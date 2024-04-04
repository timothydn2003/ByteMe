// CSS import
import "./AudioDropdown.css";

// REACT imports
import { useEffect, useRef, useState } from "react";

// Components imports
import { AudioVisualizer } from "../AudioTranscriber";
import { dateToFormat } from "../../Courses/CoursesSelector";

// FIREBASE imports
import { db } from "../../../firebase-config";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";

import useSound from "use-sound"; // for handling the sound

/*
interface audioRef {
    url: String;
    name: String; // name of the audio file
    type: String; 
    size: Number; 
    duration: Number;
    courseRef: String; // reference to the course
    createdAt: Date; // date created
    transcript: String; // transcript of the audio
}
*/

const tempText = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean vel mattis dui, nec venenatis nisi. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam quam quam, venenatis vel est in, dictum molestie mi. Maecenas pulvinar molestie ultrices. Pellentesque id congue odio, vel blandit arcu. Praesent tincidunt elit non laoreet ultricies. Sed eu tempor felis. Morbi sed consequat erat.

Donec gravida libero ut accumsan suscipit. Aliquam ullamcorper nec nisl et mollis. Donec laoreet blandit purus quis ultricies. Nam nisl mauris, cursus at feugiat in, iaculis at nisl. Praesent dui risus, eleifend eget ultricies et, pellentesque ut erat. Nulla aliquet ullamcorper turpis, ac pretium dolor. Mauris aliquet id mi id lacinia. Fusce ultricies venenatis leo eget iaculis. Curabitur vel lectus lectus. Suspendisse varius tellus ac ipsum porta imperdiet. Pellentesque suscipit tempus bibendum. Sed est velit, consequat at magna at, lacinia elementum nibh. Mauris placerat accumsan magna at vulputate. Pellentesque volutpat turpis quis porttitor accumsan.`;

export const AudioDropdown = ({ audioRef }) => {
  const [displayTranscript, setDisplayTranscript] = useState(false);

  return (
    <div className="audio-dropdown-component-wrapper">
      <div className="audio-dropdown">
        <div className="icon-container">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={`icon ${displayTranscript ? "open" : ""}`}
            onClick={() => setDisplayTranscript(!displayTranscript)}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m19.5 8.25-7.5 7.5-7.5-7.5"
            />
          </svg>
        </div>

        <h3 className="audio-title">{audioRef.name}</h3>
        <p className="audio-date">
          {dateToFormat("MMM DD, YYYY", audioRef.createdAt.toDate())}
        </p>
        <p className="audio-type">{audioRef.type}</p>
      </div>

      {displayTranscript && (
        <>
          <div className="audio-visualizer">
            <AudioVisualizer src={audioRef.url} />
          </div>

          <div className="transcript-dialogue-container">
            <TranscriptDialogue transcript={audioRef.transcript || tempText} />
          </div>
        </>
      )}
    </div>
  );
};

// NEW dropdown
export const AudioTranscriptDrown = ({ audioRef }) => {
  const [displayTranscript, setDisplayTranscript] = useState(false);

  const [updateTitle, setUpdateTitle] = useState({
    editing: false,
    title: audioRef.name || "",
  });
  const updateTitleRef = useRef(null);

  const handleDelete = async (e) => {
    e.preventDefault();
    const id = audioRef.id;
    try {
      // delete from db
      const docRef = doc(db, "Courses", `${audioRef?.courseRef}`, `Audios`, id);
      await deleteDoc(docRef);
      window.location.reload();
    } catch (error) {
      console.error("Error deleting audio:", error);
    }
  };

  // handle title changes
  const onChange = (e) => {
    setUpdateTitle({ ...updateTitle, title: e.target.value });
  };
  const handleSave = async () => {
    if (updateTitle.title !== audioRef.name) {
      await updateDocument();
    }
    setUpdateTitle({ ...updateTitle, editing: false });
  };

  const toggleEdit = () => {
    setUpdateTitle((prev) => ({ ...prev, editing: !prev.editing }));
    setTimeout(
      () => updateTitleRef.current && updateTitleRef.current.focus(),
      0
    );
  };

  const updateDocument = async () => {
    const documentRef = doc(
      db,
      "Courses",
      `${audioRef?.courseRef}`,
      "Audios",
      audioRef.id
    );

    // update the field
    const updateResp = await updateDoc(documentRef, {
      name: updateTitle.title,
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        updateTitleRef.current &&
        !updateTitleRef.current.contains(event.target)
      ) {
        handleSave();
      }
    };

    if (updateTitle.editing) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [updateTitle.editing]);

  return (
    <div
      className="course-audio-content"
      onClick={() => setDisplayTranscript(!displayTranscript)}
    >
      <div className="audio-summary">
        <div className="audio-title-content" ref={updateTitleRef}>
          {updateTitle.editing ? (
            <input
              type="text"
              className="audio-title-edit"
              value={updateTitle.title}
              onChange={onChange}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
              autoFocus
            />
          ) : (
            <h2 className="audio-title" onClick={toggleEdit}>
              {updateTitle.title}
            </h2>
          )}
        </div>

        <div className={`audio-details ${displayTranscript ? "active" : ""}`}>
          <p className="audio-description">
            {audioRef.summary || audioRef.transcript || ""}
          </p>
        </div>
      </div>

      <div className="playback-widget">
        <MediaPlayer src={audioRef.url} />
      </div>

      {/* handle this better using state globally */}
      <button onClick={handleDelete} className="deleteBtn">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18 18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
};

export const TranscriptDialogue = ({ transcript }) => {
  return (
    <div className="transcript-dialogue">
      <p className="transcript-dialogue-text">{transcript}</p>
    </div>
  );
};

// Media player; play btn or soundbar
export const MediaPlayer = ({ src }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const [play, { pause }] = useSound(src, {
    onend: () => setIsPlaying(false),
  });

  const playingButton = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (isPlaying) {
      pause();
    } else {
      play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="playback-widget-circle" onClick={playingButton}>
      {isPlaying ? (
        <img
          alt="soundbar"
          src="assets/soundbar.gif"
          className="icon-soundbar"
        />
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="icon-play"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
          />
        </svg>
      )}
    </div>
  );
};
