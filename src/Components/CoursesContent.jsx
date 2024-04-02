import { useContext, useEffect, useState } from "react";
import { db } from "../firebase-config";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { AudioComponent as AudioUploader } from "./AudioTranscriber";

// CSS imports
import "./CoursesContent.css";
import { Context } from "./CoursesContext";

export const CoursesContent = () => {
  const [audioSources, setAudioSources] = useState([]);
  const { currentCourse } = useContext(Context);
  let courseAudiosCollectionRef = collection(
    db,
    "Courses",
    `${currentCourse?.id}`,
    "Audios"
  );

  const fetchReferenceAudios = async () => {
    const data = await getDocs(courseAudiosCollectionRef);

    const audioSources = data.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));

    return audioSources;
  };

  // useEffect(() => {
  //     fetchReferenceAudios().then((audioSources) => {
  //         setAudioSources(audioSources);
  //     });
  // }, []);

  useEffect(() => {
    if (!currentCourse) return;

    courseAudiosCollectionRef = collection(
      db,
      "Courses",
      `${currentCourse.id}`,
      "Audios"
    );
    fetchReferenceAudios()
      .then((audioSources) => {
        setAudioSources(audioSources);
      })
      .catch((error) => {
        console.error(error);
      });
  }, [currentCourse]);

  return (
    <div className="course-audios">
      <AudioUploader />
      {audioSources.map((audioSource) => (
        <AudioComponent key={audioSource.id} audioSource={audioSource} />
      ))}
    </div>
  );
};

const AudioComponent = ({ audioSource }) => {
  // function to retrieve type of audio reference
  const formatDate = () => {
    if (!audioSource.date) return new Date().toDateString();

    const date = new Date(audioSource.date);
    return date.toDateString();
  };

  return (
    <div className="audio-source">
      <div className="dropdown">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="chevron-down"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          />
        </svg>
        <div className="title">
          <h2>{audioSource.name}</h2>
        </div>
      </div>
      <div className="audio-date">
        <h3>{formatDate()}</h3>
      </div>
      <div className="audio-type">
        <h3>{audioSource.type}</h3>
      </div>
    </div>
  );
};
