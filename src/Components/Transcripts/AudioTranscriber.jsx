import { useContext, useEffect, useRef, useState } from "react";
import { storage } from "../../firebase-config";

// external libs
import useSound from "use-sound"; // for handling the sound
import { AiFillPlayCircle, AiFillPauseCircle } from "react-icons/ai"; // icons for play and pause
import { BiSkipNext, BiSkipPrevious } from "react-icons/bi"; // icons for next and previous track
import { IconContext } from "react-icons";

// spinner
import { Bars, Comment } from "react-loader-spinner";

// Firebase imports
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../firebase-config";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// CSS imports
import "../../css/Transcripts/AudioTranscriber.css";

// context states
import { Context } from "../CoursesContext";

// FFMPEG WASM imports
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import {
  createCourseAudioRef,
  generateKeyTopics,
  retrieveFileUrl,
  summarizeAudioTranscription,
  summarizedTextToMarkdown,
  uploadAudioForTranscription,
  uploadFile,
} from "./audioActions";

import { Base64 } from "js-base64";

const ffmpeg = new FFmpeg();

export const AudioComponent = ({ passUp }) => {
  const [uploaded, setUploaded] = useState({
    fileUrl: "",
  });
  const { currentCourse, updatedAudio, setUpdatedAudio, setCurrentCourse } =
    useContext(Context);

  // used for checking if ffmpeg is ready
  const [ready, setReady] = useState(false);

  // loader for transcription
  const [loading, setLoading] = useState(false);
  const [loadingTranscription, setLoadingTranscription] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const load = async () => {
    await ffmpeg.load();
    setReady(true);
  };

  useEffect(() => {
    load();
  }, []);

  // Reference to the file input element
  const fileInputRef = useRef(null);

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  // function to segment chunks so no large files uploaded to open AI
  const convertAndSplit = async (file) => {
    // Sanitize file name; this threw me off for longest time; so assure file name is sanitized
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    // get the file name without the extension
    const sanitizedFileNamePrefix = sanitizedFileName
      .split(".")
      .slice(0, -1)
      .join(".");

    try {
      const data = await fetchFile(file);

      // write a tmp file to virtualized FS
      await ffmpeg.writeFile(sanitizedFileName, data);

      // create tmp file name for output so dont get error when reading and writing same file; FFmpeg cannot edit existing files in-place.
      const outputFileName = `${sanitizedFileNamePrefix}_dup.mp3`;

      // Convert any audio file to MP3; ffmpeg will infer the output format from the file extension
      const conversionResp = await ffmpeg.exec([
        "-i",
        sanitizedFileName,
        "-codec:a",
        "libmp3lame",
        "-qscale:a",
        "2",
        outputFileName,
      ]);

      if (conversionResp !== 0) {
        console.error("Error during conversion!");
        return;
      }

      // segement / partition the audio file
      // Split the MP3 with a shorter segment time for testing
      const splitResp = await ffmpeg.exec([
        "-i",
        outputFileName,
        "-f",
        "segment",
        "-segment_time",
        "600", // 10 minutes
        "-c",
        "copy", // Copy audio stream without re-encoding
        `${sanitizedFileNamePrefix}-%03d.mp3`,
      ]);

      if (splitResp !== 0) {
        console.error("Error during splitting of audio!");
        return;
      }

      // get the list of files in the virtualized FS for processing chunks we created
      const files = await ffmpeg.listDir("/");

      // filter the segemented files using the virtualized FS
      const segmentFileNames = files
        .filter((fileObj) =>
          fileObj.name.startsWith(`${sanitizedFileNamePrefix}-`)
        )
        .map((fileObj) => fileObj.name);

      // Process each segment file
      // const segments = []; // array to hold blobs
      const transcriptions = [];
      for (const segmentFileName of segmentFileNames) {
        const chunkData = await ffmpeg.readFile(segmentFileName);
        // call to OpenAI API for transcription
        const resp = await uploadAudioForTranscription(
          chunkData,
          segmentFileName
        );

        // add transcription to array
        if (resp) {
          transcriptions.push(resp);
        } else {
          console.error("Error transcribing segment:", segmentFileName);
        }

        // push blob to array
        // segments.push(chunkData);

        // Delete the segment file; save memory?¿¿
        await ffmpeg.deleteFile(segmentFileName);
      }

      // delete virtual files
      await ffmpeg.deleteFile(sanitizedFileName);
      await ffmpeg.deleteFile(outputFileName);

      return transcriptions;
    } catch (error) {
      console.error("An error occurred:", error);
      return null;
    }
  };

  // Function to handle file selection
  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];

    if (!selectedFile) return;

    setLoading(true);
    // Convert and split the audio file
    setLoadingTranscription(true);
    const STT_transcription = await convertAndSplit(selectedFile);
    let transcriptedText = "";
    if (STT_transcription && STT_transcription.length > 0) {
      transcriptedText = STT_transcription.join(" ");
    } else {
      console.error("No transcription found");
      setLoadingTranscription(false);
      setLoading(false);
      return;
    }
    setLoadingTranscription(false);

    setLoadingSummary(true);

    // Summarize the transcription
    const summarizedText = await summarizeAudioTranscription(transcriptedText);
    if (!summarizedText) {
      console.error("Failed to summarize transcription");
      setLoadingSummary(false);
      setLoading(false);
      return;
    }

    const markdownText = await summarizedTextToMarkdown(summarizedText);

    console.log("md resp: ", markdownText);
    // convert the markdown to base 64 to not lose the formatting
    // const base64Encoded_MD = btoa(markdownText);
    const base64Encoded_MD = Base64.encode(markdownText);
    setLoadingSummary(false);

    const uploadAudioToFireBase = async () => {
      try {
        // Upload the file to Firebase Storage
        const fileRef = await uploadFile(selectedFile);

        if (!fileRef) return;
        console.log("File reference:", fileRef);

        // retrieve key topics
        const keyTopics = (await generateKeyTopics(transcriptedText)) || [];

        const fileUrl = await retrieveFileUrl(fileRef);
        await createCourseAudioRef(
          fileUrl,
          selectedFile.name,
          selectedFile.type,
          transcriptedText,
          selectedFile.size,
          selectedFile.duration,
          summarizedText,
          currentCourse,
          base64Encoded_MD,
          keyTopics
        );

        // Set the uploaded state to true
        setUploaded({
          fileUrl,
        });
        passUp(fileUrl);
        setLoading(false);

        // FIXME:
        setUpdatedAudio(true);
        window.location.reload();
      } catch (error) {
        console.warn("some error buddies");
      }
    };

    uploadAudioToFireBase();

    // use state values so that the current course can be updated
  };

  return (
    <div className="audio-component-wrapper">
      {!loading ? (
        <button className="audio-component" onClick={handleButtonClick}>
          Upload Audio
          <input
            type="file"
            ref={fileInputRef}
            accept="audio/*"
            className=""
            onChange={handleFileChange}
          />
        </button>
      ) : loadingTranscription ? (
        <TranscriptionLoader />
      ) : loadingSummary ? (
        <SummaryLoader />
      ) : (
        <p className="typewriter-text">Uploading...</p>
      )}
    </div>
  );
};

const TranscriptionLoader = () => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prevDots) => (prevDots.length < 3 ? prevDots + "." : ""));
    }, 400);

    return () => clearInterval(interval);
  }, []);
  return (
    <div className="transcription-loader">
      <Bars
        height="80"
        width="80"
        color="#132C4A"
        ariaLabel="bars-loading"
        wrapperStyle={{}}
        wrapperClass=""
        visible={true}
      />
      <p className="typewriter-text">Transcribing{dots}</p>
    </div>
  );
};

const SummaryLoader = () => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prevDots) => (prevDots.length < 3 ? prevDots + "." : ""));
    }, 400);

    return () => clearInterval(interval);
  }, []);
  return (
    <div className="summary-loader">
      <Comment
        visible={true}
        height="80"
        width="80"
        ariaLabel="comment-loading"
        wrapperStyle={{}}
        wrapperClass="comment-wrapper"
        color="#fff"
        backgroundColor="#132C4A"
      />
      <p className="typewriter-text">Summarizing{dots}</p>
    </div>
  );
};

export const AudioVisualizer = ({ src }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [time, setTime] = useState({
    min: "",
    sec: "",
  });
  const [currTime, setCurrTime] = useState({
    min: "",
    sec: "",
  });

  const [seconds, setSeconds] = useState();

  const [play, { pause, duration, sound }] = useSound(src);

  useEffect(() => {
    if (duration) {
      const sec = duration / 1000;
      const min = Math.floor(sec / 60);
      const secRemain = Math.floor(sec % 60);
      setTime({
        min: min,
        sec: secRemain,
      });
    }
  }, [isPlaying]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (sound) {
        setSeconds(sound.seek([]));
        const min = Math.floor(sound.seek([]) / 60);
        const sec = Math.floor(sound.seek([]) % 60);
        setCurrTime({
          min,
          sec,
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [sound]);

  const playingButton = () => {
    if (isPlaying) {
      pause();
      setIsPlaying(false);
    } else {
      play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="component">
      <div>
        <div className="time">
          <p>
            {currTime.min}:{currTime.sec}
          </p>
          <p>
            {time.min}:{time.sec}
          </p>
        </div>
        <input
          type="range"
          min="0"
          max={duration / 1000}
          default="0"
          value={seconds}
          className="timeline"
          onChange={(e) => {
            sound.seek([e.target.value]);
          }}
        />
      </div>
      <div>
        <button className="playButton">
          <IconContext.Provider value={{ size: "2em", color: "#22223b" }}>
            <BiSkipPrevious />
          </IconContext.Provider>
        </button>
        {!isPlaying ? (
          <button className="playButton" onClick={playingButton}>
            <IconContext.Provider value={{ size: "2em", color: "#22223b" }}>
              <AiFillPlayCircle />
            </IconContext.Provider>
          </button>
        ) : (
          <button className="playButton" onClick={playingButton}>
            <IconContext.Provider value={{ size: "2em", color: "#22223b" }}>
              <AiFillPauseCircle />
            </IconContext.Provider>
          </button>
        )}
        <button className="playButton">
          <IconContext.Provider value={{ size: "2em", color: "#22223b" }}>
            <BiSkipNext />
          </IconContext.Provider>
        </button>
      </div>
    </div>
  );
};
