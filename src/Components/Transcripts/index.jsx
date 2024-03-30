// BOOTSTRAP imports
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import { useContext, useEffect, useState } from "react";
import { Context } from "../CoursesContext";
import { AudioComponent } from "./AudioTranscriber";
import { AudioDropdown } from "./AudioDropdown";

// FIREBASE imports
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../../firebase-config";

export const TranscriptsSection = () => {
    const { courses, currentCourse, addCourse } = useContext(Context);

    const [courseAudios, setCourseAudios] = useState([]);

    useEffect(() => {
        console.log("selected course change: ", currentCourse);

        const fetchCourseAudios = async () => {
            // utilizing currentCourse fetch from CoursesAudio collection
            const courseAudioCollectionRef = collection(db, "CoursesAudios");
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
    }, [currentCourse]);

    if (!currentCourse) {
        return <h1>No course selected</h1>;
    }

    return (
        <>
            <Col style={{}}>
                <AudioComponent />
            </Col>
            {courseAudios.length ? (
                courseAudios.map((audioRef) => (
                    <Col
                        style={{
                            width: `100%`,
                            textAlign: "start",
                        }}
                    >
                        <AudioDropdown audioRef={audioRef} key={audioRef} />
                    </Col>
                ))
            ) : (
                <h1>No audio files</h1>
            )}
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
