// Components/CoursesContext.js

import { createContext, useState } from "react";

import { db } from "../firebase-config";
import { collection, getDocs, addDoc } from "firebase/firestore";

const Context = createContext({
  courses: [],
  currentCourse: null,
  setCurrentCourse: () => {},
  addCourse: (courseName, courseDesc) => {},
  setCourses: () => {},
  liveTranscription: {
    isRecording: false,
    audioChunk: null,
    transcription: "",
    title: "",
    audioUrl: "",
  },
  setTranscription: () => {},
  updatedAudio: false,
  setUpdatedAudio: () => {},
});

const CoursesContext = ({ children }) => {
  const courseCollectionRef = collection(db, "Courses");
  const [courses, setCourses] = useState([]);
  const [currentCourse, setCurrentCourse] = useState(null);

  const [transcription, setTranscription] = useState({
    isRecording: false,
    audioChunk: null,
    transcription: "",
    audioUrl: "",
    title: "",
  });

  const [updatedAudio, setUpdatedAudio] = useState(false);
  const addCourse = async (courseName, courseDesc) => {
    const newDoc = await addDoc(courseCollectionRef, {
      name: courseName,
      description: courseDesc,
      date: new Date().toString(),
    });

    // add new doc to courses so re-render
    // COMMENT: ahh, this is the problem; but want o implement this
    // setCourses((prevCourses) => [newDoc.data(), ...prevCourses]);
    window.location.reload();
  };

  return (
    <Context.Provider
      value={{
        courses,
        currentCourse,
        setCurrentCourse,
        addCourse,
        setCourses,
        liveTranscription: transcription,
        setTranscription,
        updatedAudio,
        setUpdatedAudio,
      }}
    >
      {children}
    </Context.Provider>
  );
};

export { CoursesContext, Context };
