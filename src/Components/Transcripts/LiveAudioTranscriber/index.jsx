// CSS imports
import "./LiveAudioTranscriber.css";
import { Context } from "../../CoursesContext";

import { useContext, useEffect, useRef, useState } from "react";

// Resource thanks: https://github.com/NikValdez/voiceTextTut/blob/master/src/App.js
// SpeechRecognition does not function FireFox
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const mic = new SpeechRecognition();
mic.continuous = true;
mic.interimResults = true;
mic.lang = "en-US";

export const LiveAudioTranscriber = () => {
  const [isListening, setIsListening] = useState(false); // live audio listener
  const [isRecording, setIsRecording] = useState(false); // recorder vars
  const [note, setNote] = useState(null); // storing the transcribed text
  // const [savedNotes, setSavedNotes] = useState([]);

  const [audioBlob, setAudioBlob] = useState(null); // storing the chunks of audio

  // store a url for optimization since creating urls mantains in memory
  const [audioURL, setAudioURL] = useState(null);
  // storing the audio recorder
  const mediaRecorderRef = useRef(null);
  // storing the audio chunks
  const audioChunksRef = useRef([]);

  // technically not even used rn
  const [fullTranscription, setFullTranscription] = useState("");

  const { liveTranscription, setTranscription } = useContext(Context);

  // event listener for recording through user mic
  useEffect(() => {
    console.log("handling listenting effect....");
    handleListen();
  }, [isListening]);

  // event listener for cleaning up the audio url; optimization slightly
  useEffect(() => {
    // release the object URL when the blob changes
    return () => {
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [audioURL]);

  // useEffect for updating the live transcription feed
  useEffect(() => {
    // update live note transcription
    if (note) {
      setTranscription((prev) => ({
        ...prev,
        transcription: note,
      }));
    }

    if (audioURL) {
      setTranscription((prev) => ({
        ...prev,
        audioUrl: audioURL,
      }));
    }
    if (audioBlob) {
      setTranscription((prev) => ({
        ...prev,
        audioChunk: audioBlob,
      }));
    }
  }, [note]);

  /**
   * Recording mechanisms;
   * 1. Start recording
   * 2. Stop recording
   */
  // setup a media recorder
  const startRecording = async () => {
    // retrieve the users audio mic stream src; access req needed
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder; API provides functionality to easily record media
    // create a media recorder instance
    mediaRecorderRef.current = new MediaRecorder(stream);

    /* EVENT LISTENERS FOR OUR MEDIA RECORDER OBJ */
    if (!liveTranscription.title) {
      const generateTitle = () => {
        const now = new Date();
        const isoString = now.toISOString();
        const formattedString = isoString.replace(/\.\d{3}Z$/, ""); //remove m.s. portion
        return `${formattedString}`;
      };
      setTranscription((prev) => ({
        ...prev,
        title: `Audio-${generateTitle()}`,
      }));
    }

    // ondataavailable: event handler for when the media recorder has new data available
    mediaRecorderRef.current.ondataavailable = (e) => {
      audioChunksRef.current.push(e.data);
    };
    mediaRecorderRef.current.onstart = () => {
      // console.log("Recording started: ", mediaRecorderRef.current.state);
    };
    mediaRecorderRef.current.onstop = () => {
      // console.log("Recording stopped: ", mediaRecorderRef.current.state);
    };

    mediaRecorderRef.current.start();
  };

  // stopping of recording & setting playback mechs
  const stopRecording = () => {
    // event listener for when media recorder stops
    mediaRecorderRef.current.onstop = () => {
      // create audio blob from the recorded chunks
      const allCurrChunks = audioChunksRef.current;
      const audioBlob = new Blob(allCurrChunks, {
        type: "audio/mpeg",
      });

      // store the audio blob
      setAudioBlob(audioBlob);

      // store the audio to state
      const url = URL.createObjectURL(audioBlob);
      setAudioURL(url);

      setTranscription((prev) => ({
        ...prev,
        audioUrl: audioURL,
        audioChunk: audioBlob,
      }));

      // reset the audio chunks array for the next recording
      audioChunksRef.current = [];
    };

    // stop the recording
    mediaRecorderRef.current.stop();

    setIsRecording(false);
  };

  const handleListen = () => {
    if (isListening) {
      mic.start();

      mic.onend = () => {
        console.log("Speech Recognition service has stopped, restarting...");
        setFullTranscription(liveTranscription.transcription);
        // Restart the service
        if (isListening) {
          mic.start();
        }
      };
    } else {
      mic.stop();
      mic.onend = () => {
        // FIXME: view me
        // setFullTranscription(liveTranscription.transcription);
        // error is stemming from these onEnd listeners
        console.log("Stopped Mic on Click");
      };
    }
    mic.onstart = () => {
      console.log("Mics on");
    };

    // as incoming data, update our notes
    mic.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0])
        .map((result) => result.transcript)
        .join("");
      console.log(transcript);
      const prevTranscription = liveTranscription.transcription;
      setFullTranscription(
        (prevTranscription) => prevTranscription + transcript
      ); // COMMENT: utilize me for full transcription?

      setTranscription((prev) => ({ ...prev, transcription: transcript }));
      setNote(transcript);
      mic.onerror = (event) => {
        console.warn(event.error);
      };
    };
  };

  const handleRecording = () => {
    if (isRecording) {
      console.log("recording stopping....");
      stopRecording();
      setIsListening(false);
    } else {
      console.log("recording starting....");
      startRecording();
      setIsListening(true);
    }
    setIsRecording(!isRecording);
  };

  return (
    <div className="live-audio" onClick={handleRecording}>
      {!isListening ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="audio-transcriber"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"
          />
        </svg>
      ) : (
        <img
          src="assets/recording.gif"
          alt="microphone"
          className="audio-transcriber"
        />
      )}
      {/* {<p style={{ color: "black" }}>note: {note}</p>} */}
    </div>
  );
};
