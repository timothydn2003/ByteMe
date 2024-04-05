// CSS import
import "./AudioDropdown.css";
import { useContext, useEffect, useState } from "react";

import { Context } from "../../CoursesContext";
import { MediaPlayer } from ".";
import {
  createCourseAudioRef,
  retrieveFileUrl,
  summarizeAudioTranscription,
  uploadAudioForTranscription,
  uploadFile,
} from "../audioActions";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

// FIXME: maybe can use a hook for such?!?! unsure
const ffmpeg = new FFmpeg();

export const LiveAudioTranscriptDropdown = ({ startDate }) => {
  const [displayTranscript, setDisplayTranscript] = useState(true);
  const { liveTranscription, currentCourse } = useContext(Context);

  const [ready, setReady] = useState(false);

  const load = async () => {
    await ffmpeg.load();
    setReady(true);
  };

  useEffect(() => {
    load();
  }, []);

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

  const createUrl = (blob) => {
    const url = URL.createObjectURL(blob);
    // add extension so can be used as src
    return `${url}#.mp3`;
  };

  // when the user stops recording use Effect to convert and upload
  useEffect(() => {
    const handleUpload = async () => {
      // assure we have a audio blob to upload
      if (!liveTranscription.audioChunk) return;

      // TODO: allow updating of titles later
      const fileName = `audio-${Date.now()}.mp3`;
      const audioFile = new File([liveTranscription.audioChunk], fileName, {
        type: "audio/mpeg",
      });
      const STT_transcription = await convertAndSplit(audioFile);
      let transcriptedText = "";
      if (STT_transcription && STT_transcription.length > 0) {
        transcriptedText = STT_transcription.join(" ");
      } else {
        console.error("No transcription found");
        return;
      }

      const summarizedText = await summarizeAudioTranscription(
        transcriptedText
      );

      // assure we have a summarized text to upload; will leave this commented out for now since live audios are trickier to retain if error
      // if (!summarizedText) {
      //   console.error("Failed to summarize transcription");
      //   return;
      // }

      // Upload the file to Firebase Storage
      const fileRef = await uploadFile(audioFile);
      if (!fileRef) return;

      const fileUrl = await retrieveFileUrl(fileRef);

      await createCourseAudioRef(
        fileUrl,
        audioFile.name,
        audioFile.type,
        transcriptedText,
        audioFile.size,
        audioFile.duration,
        summarizedText,
        currentCourse
      );

      window.location.reload();
    };

    handleUpload();
  }, [liveTranscription.audioChunk, currentCourse]);

  if (!liveTranscription || !liveTranscription.transcription) {
    return null;
  }

  return (
    <div
      className="course-audio-content"
      onClick={() => setDisplayTranscript(!displayTranscript)}
    >
      <div className="audio-summary">
        <h2 className="audio-title">{liveTranscription.title}</h2>

        <div className={`audio-details ${displayTranscript ? "active" : ""}`}>
          <p className="audio-description">{liveTranscription.transcription}</p>
        </div>
      </div>
      <div className="playback-widget">
        {liveTranscription.audioChunk && (
          <MediaPlayer src={createUrl(liveTranscription.audioChunk)} />
        )}
      </div>
    </div>
  );
};
