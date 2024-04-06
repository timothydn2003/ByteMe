// Components/Home/index.jsx

// CSS import
import "./Home.css";

import Container from "react-bootstrap/Container";

import { useContext } from "react";
import { Context } from "../CoursesContext";
import { CoursesSelector } from "../Courses/CoursesSelector";
import { TranscriptsSection } from "../Transcripts";
import { ChatbotSection } from "../Chatbot";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from '../../firebase-config.js';

export const Home = ({ props }) => {
  // import context
  const { courses, currentCourse, addCourse } = useContext(Context);

  return (
    <>
      <h1 style={{ textAlign: "center" }}>Byte My Course</h1>
      <div id="home">
        {/* take up 1/6 of left side */}
        <Container id="courses">
          <CoursesSelector />
        </Container>

        {/* take up 3/6 of middle */}
        <Container id="transcripts">
          <TranscriptsSection />
        </Container>

        {/* take up 2/6 of right side */}
        <Container id="chatbot">
          <ChatbotSection />
        </Container>
      </div>
    </>
  );
};
