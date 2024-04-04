// Components/CoursesContext.js

import React, { useEffect } from "react";

import { db } from "../firebase-config";
import { collection, getDocs, addDoc } from "firebase/firestore";

const Context = React.createContext({
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
});

const CoursesContext = ({ children }) => {
  const courseCollectionRef = collection(db, "Courses");
  const [courses, setCourses] = React.useState([]);
  const [currentCourse, setCurrentCourse] = React.useState(null);

  const [transcription, setTranscription] = React.useState({
    isRecording: false,
    audioChunk: null,
    transcription: "",
    audioUrl: "",
    title: "",
  });

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
      }}
    >
      {children}
    </Context.Provider>
  );
};

export { CoursesContext, Context };
