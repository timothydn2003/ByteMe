// Components/Home/index.jsx

// CSS import
import "./Home.css";

import Container from "react-bootstrap/Container";

import { useContext } from "react";
import { Context } from "../CoursesContext";
import { CoursesSelector } from "../Courses/CoursesSelector";
import { TranscriptsSection } from "../Transcripts";

export const Home = () => {
    // import context
    const { courses, currentCourse, addCourse } = useContext(Context);

    return (
        <div id="home">
            {/* take up 1/5 of left side */}
            <Container id="courses">
                <CoursesSelector />
            </Container>

            {/* take up 4/5 of right side */}
            <Container id="transcripts">
                <TranscriptsSection />
            </Container>
        </div>
    );
};
