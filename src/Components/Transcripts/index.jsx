// BOOTSTRAP imports
import Col from "react-bootstrap/Col";

import { useContext, useEffect, useState } from "react";
import { Context } from "../CoursesContext";
import { AudioComponent } from "./AudioTranscriber";
import { AudioTranscriptDrown } from "./AudioDropdown";
import { LiveAudioTranscriptDropdown } from "./AudioDropdown/LiveAudioTranscriptDropdown";

// FIREBASE imports
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase-config";

import "../../css/Transcripts/AudioTranscriber.css";
import { LiveAudioTranscriber } from "./LiveAudioTranscriber";

export const TranscriptsSection = () => {
  const { currentCourse } = useContext(Context);

  const [courseAudios, setCourseAudios] = useState([]);
  const [newFile, addFile] = useState("");

  useEffect(() => {
    const fetchCourseAudios = async () => {
      if (!currentCourse) return;
      // utilizing currentCourse fetch from CoursesAudio collection
      const courseAudioCollectionRef = collection(
        db,
        "Courses",
        `${currentCourse.id}`,
        "Audios"
      );
      const data = await getDocs(courseAudioCollectionRef);
      const tmpArr = data.docs
        .map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }))
        .sort((a, b) => {
          const bDate = new Date(b.createdAt);
          const aDate = new Date(a.createdAt);
          return bDate - aDate;
        });

      setCourseAudios(tmpArr);
    };

    fetchCourseAudios();
  }, [currentCourse, newFile]);

  if (!currentCourse) {
    return <h1>No course selected</h1>;
  }

  return (
    <>
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        <h2 className="courseTitle">{currentCourse.name.toUpperCase()}</h2>
      </div>
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-evenly",
          alignItems: "center",
          marginTop: "10px",
          marginBottom: "10px",
        }}
      >
        <div className="description-content">
          <h3>Description:</h3>
          <div style={{ width: "100%", textAlign: "left" }}>
            <p className="courseDesc">{currentCourse.description}</p>
          </div>
        </div>
        <div className="audio-transmitters-container">
          <LiveAudioTranscriber />
          <AudioComponent passUp={addFile} />
        </div>
      </div>
      {<LiveAudioTranscriptDropdown />}
      {courseAudios.length !== 0 ? (
        courseAudios.map((audioRef) => (
          <Col
            style={{
              width: `100%`,
              textAlign: "start",
            }}
          >
            {/* OLD dropdown */}
            {/* <AudioDropdown audioRef={audioRef} key={audioRef} /> */}
            {/* NEW dropdown */}
            <AudioTranscriptDrown audioRef={audioRef} key={audioRef} />
          </Col>
        ))
      ) : (
        <h1>No audio files</h1>
      )}
    </>
  );
};
