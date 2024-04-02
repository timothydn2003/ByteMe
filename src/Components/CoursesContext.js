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
});

const CoursesContext = ({ children }) => {
  const courseCollectionRef = collection(db, "Courses");
  const [courses, setCourses] = React.useState([]);
  const [currentCourse, setCurrentCourse] = React.useState(null);

  // useEffect(() => {
  //     const getCourses = async () => {
  //         try {
  //             const data = await getDocs(courseCollectionRef);
  //             const tmpArr = data.docs
  //                 .map((doc) => ({
  //                     ...doc.data(),
  //                     id: doc.id,
  //                 }))
  //                 .sort((a, b) => {
  //                     // Sort operation right after mapping.
  //                     const bDate = new Date(b.date);
  //                     const aDate = new Date(a.date);
  //                     return bDate.getTime() - aDate.getTime(); // Use getTime for accurate sorting.
  //                 });

  //             console.log("tmpArr:", tmpArr);

  //             setCourses(tmpArr);
  //             setCurrentCourse(tmpArr[0]); // Assuming tmpArr is not empty.
  //         } catch (error) {
  //             console.error("Error fetching courses:", error);
  //         }
  //     };
  //     getCourses();
  //     // courses.sort((a, b) => {
  //     //     const bDate = new Date(b.date);
  //     //     const aDate = new Date(a.date);
  //     //     return bDate - aDate;
  //     // });
  // }, []);

  const addCourse = async (courseName, courseDesc) => {
    const newDoc = await addDoc(courseCollectionRef, {
      name: courseName,
      description: courseDesc,
      date: new Date().toString(),
    });

    // add new doc to courses so re-render
    // setCourses((prevCourses) => [newDoc.data(), ...prevCourses]); // ahh, this is the problem
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
      }}
    >
      {children}
    </Context.Provider>
  );
};

export { CoursesContext, Context };
