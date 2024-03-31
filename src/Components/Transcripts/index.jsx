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

import '../../css/Transcripts/AudioTranscriber.css'

export const TranscriptsSection = () => {
    const { courses, currentCourse, addCourse } = useContext(Context);

    const [courseAudios, setCourseAudios] = useState([]);
    const [newFile, addFile] = useState('');

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
    }, [currentCourse, newFile]);

    if (!currentCourse) {
        return <h1>No course selected</h1>;
    }
//{currentCourse.description}
    return (
        <>
            <div style={{width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center'}}>
                <h2 className="courseTitle">{currentCourse.name.toUpperCase()}</h2>
            </div>
            <div style={{width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', marginTop: '10px', marginBottom: '10px'}}>
                <div style={{width: '60%', display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', alignItems: 'flex-start'}}>
                    <h3>Description:</h3>
                    <div style={{width: '100%', textAlign: 'left'}}>
                        <p className="courseDesc">
                            {currentCourse.description}
                        </p>
                    </div>
                </div>
                <AudioComponent passUp={addFile} />
            </div>
            {courseAudios.length !== 0 ? (
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
        </>
    );
};
