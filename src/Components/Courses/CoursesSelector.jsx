// BOOTSTRAP imports
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "@mui/material/Button";

// MATERIAL UI Imports
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";

// COMPONENTS imports
import { useContext, useEffect, useState } from "react";
import { Context } from "../CoursesContext";

// FIREBASE imports
import { db } from "../../firebase-config";
import { collection, getDocs, addDoc } from "firebase/firestore";

// CSS imports
import "./CoursesSelector.css";

export const CoursesSelector = () => {
    const { courses, currentCourse, setCurrentCourse, setCourses } =
        useContext(Context);
    const [open, setOpen] = useState(false);
    const courseCollectionRef = collection(db, "Courses");

    // this crap is stupid, doesnt want to function inside the context provider
    useEffect(() => {
        const getCourses = async () => {
            try {
                const data = await getDocs(courseCollectionRef);
                const tmpArr = data.docs
                    .map((doc) => ({
                        ...doc.data(),
                        id: doc.id,
                    }))
                    .sort((a, b) => {
                        // Sort operation right after mapping.
                        const bDate = new Date(b.date);
                        const aDate = new Date(a.date);
                        // return bDate - aDate;
                        // Use getTime for accurate sorting.
                        return bDate.getTime() - aDate.getTime();
                    });

                console.log("tmpArr:", tmpArr);

                setCourses(tmpArr);
                setCurrentCourse(tmpArr[0]); // Assuming tmpArr is not empty.
            } catch (error) {
                console.error("Error fetching courses:", error);
            }
        };
        getCourses();
    }, []);

    const handleOpen = () => {
        setOpen(true);
    };

    return (
        <>
            {/* <Row> */}
            <Col className="courseAdd">
                <Button onClick={handleOpen} variant="contained">
                    Add Course
                </Button>
            </Col>
            {/* </Row> */}
            {courses.length === 0 ? (
                <h1>No courses</h1>
            ) : (
                <Row className="courseList-container">
                    <Col className="courseList">
                        {courses.map((data) => {
                            return <CourseButton key={data.id} data={data} />;
                        })}
                    </Col>
                </Row>
            )}

            <Col>
                <CourseAddModal
                    open={open}
                    handleClose={() => setOpen(false)}
                />
            </Col>
        </>
    );
};

const CourseButton = ({ data }) => {
    const { courses, currentCourse, setCurrentCourse } = useContext(Context);
    return (
        <button
            onClick={() => setCurrentCourse(data)}
            className={`courseBtn ${data === currentCourse ? "active" : ""}`}
        >
            {data.name}
        </button>
    );
};

export const CourseAddModal = ({ open, handleClose }) => {
    const style = {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 400,
        bgcolor: "background.paper",
        border: "2px solid #000",
        boxShadow: 24,
        p: 4,
    };

    const { addCourse } = useContext(Context);

    const [courseName, setCourseName] = useState("");
    const [courseDesc, setCourseDesc] = useState("");

    return (
        <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Box sx={style}>
                <Container>
                    <Row>
                        <Col>
                            <h4>Add a course</h4>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <TextField
                                onChange={(e) => setCourseName(e.target.value)}
                                id="outlined-basic"
                                label="Course Name"
                                variant="outlined"
                            />
                        </Col>
                        <Col>
                            <TextField
                                onChange={(e) => setCourseDesc(e.target.value)}
                                id="outlined-basic"
                                label="Course Description"
                                variant="outlined"
                            />
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <Button
                                onClick={addCourse}
                                style={{ marginTop: "10px" }}
                                variant="contained"
                            >
                                Add Course
                            </Button>
                        </Col>
                    </Row>
                </Container>
            </Box>
        </Modal>
    );
};
