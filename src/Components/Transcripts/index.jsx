// BOOTSTRAP imports
import Col from "react-bootstrap/Col";

import { useContext, useEffect, useState } from "react";
import { Context } from "../CoursesContext";
import { AudioComponent } from "./AudioTranscriber";
import { AudioTranscriptDrown } from "./AudioDropdown";

// FIREBASE imports
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase-config";

import "../../css/Transcripts/AudioTranscriber.css";
import ImageComponent, { ImageDropdown } from "./ImageTranscriber";

export const TranscriptsSection = () => {
  const { courses, currentCourse, addCourse } = useContext(Context);

  const [courseAudios, setCourseAudios] = useState([]);
  const [courseImages, setCourseImages] = useState([])
  const [newFile, addFile] = useState("");
  const [uploadType, setUploadType] = useState(0)

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

    const fetchCourseImages = async () => {
      if (!currentCourse) return;
      // utilizing currentCourse fetch from CoursesAudio collection
      const courseAudioCollectionRef = collection(
        db,
        "Courses",
        `${currentCourse.id}`,
        "Images"
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

        setCourseImages(tmpArr);
    };

    fetchCourseAudios();
    fetchCourseImages();
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
        <div
          style={{
            width: "60%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-evenly",
            alignItems: "flex-start",
          }}
        >
          <h3>Description:</h3>
          <div style={{ width: "100%", textAlign: "left" }}>
            <p className="courseDesc">{currentCourse.description}</p>
          </div>
        </div>
        {
          uploadType === 0 ?
          <AudioComponent passUp={addFile} /> :
          <ImageComponent passUp={addFile} />
        }
      </div>

      <div className="uploadToggleContainer">
        <div className="uploadToggle">
          <div className="uploadToggleHighlighter" style={(uploadType === 0 ? {transform: 'translateX(-55%)'} : {transform: 'translateX(55%)'})}></div>
          <button onClick={() => { setUploadType(0) }} className={"uploadToggleItem" + (uploadType === 0 ? " activeToggleItem" : "")}>
            Audio
          </button>
          <button onClick={() => { setUploadType(1) }} className={"uploadToggleItem" + (uploadType !== 0 ? " activeToggleItem" : "")}>
            Image
          </button>  
        </div>
      </div>

      {(uploadType === 0 ? courseAudios : courseImages).length !== 0 ? (
        (uploadType === 0 ? courseAudios : courseImages).map((ref) => (
          <Col
            style={{
              width: `100%`,
              textAlign: "start",
            }}
          >
            {/* OLD dropdown */}
            {/* <AudioDropdown audioRef={audioRef} key={audioRef} /> */}
            {/* NEW dropdown */}
            {(uploadType === 0 ? <AudioTranscriptDrown audioRef={ref} key={ref} /> : <ImageDropdown imgData={ref} key={ref} />)}
          </Col>
        ))
      ) : (
        <h1>{`No ${(uploadType === 0 ? 'Audio' : 'Image')} Files`}</h1>
      )}
    </>
  );
};
