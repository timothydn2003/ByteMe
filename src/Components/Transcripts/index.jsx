// BOOTSTRAP imports
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import { useContext } from "react";
import { Context } from "../CoursesContext";
import { AudioComponent } from "./AudioTranscriber";

export const TranscriptsSection = () => {
    const { courses, currentCourse, addCourse } = useContext(Context);

    if (!currentCourse) {
        return <h1>No course selected</h1>;
    }

    return (
        <>
            <Col style={{}}>
                <AudioComponent />
            </Col>
            <Col style={{ width: `100%`, textAlign: "start" }}>
                <h1>Name: {currentCourse.name}</h1>
            </Col>
            <Col
                style={{
                    width: `100%`,
                    textAlign: "start",
                }}
            >
                <h1>Description: {currentCourse.description}</h1>
            </Col>
        </>
    );
};
