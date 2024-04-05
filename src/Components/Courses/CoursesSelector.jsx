// BOOTSTRAP imports
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "@mui/material/Button";
import { IoTrash } from "react-icons/io5";

// MATERIAL UI Imports
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";

// COMPONENTS imports
import { useContext, useEffect, useState } from "react";
import { Context } from "../CoursesContext";

// FIREBASE imports
import { db } from "../../firebase-config";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

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

        setCourses(tmpArr);
        tmpArr.length && setCurrentCourse(tmpArr[0]);
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
        <div className="courseList-container">
          <div className="courseList">
            {courses.map((data) => {
              return <CourseButtonTwo key={data.id} data={data} />;
            })}
          </div>
        </div>
      )}

      <Col>
        <CourseAddModal open={open} handleClose={() => setOpen(false)} />
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

const CourseButtonTwo = ({ data }) => {
  const { courses, currentCourse, setCurrentCourse } = useContext(Context);

  const handleDelete = async (e) => {
    e.preventDefault();
    const id = data.id;
    try {
      // delete from db
      const docRef = doc(db, "Courses", id);
      await deleteDoc(docRef);
      window.location.reload();
    } catch (error) {
      console.error("Error deleting course:", error);
    }
  };

  return (
    <button
      onClick={() => setCurrentCourse(data)}
      className={`newCourseBtn ${data === currentCourse ? "active" : ""}`}
    >
      <h3>{data.name}</h3>

      <label style={{ fontSize: "smaller" }}>Date Created</label>
      <p className="description">
        {dateToFormat("MMM DD, YYYY", new Date(data.date))}
      </p>

      {/* delete */}
      <button onClick={handleDelete} className={`deleteBtn ${(data === currentCourse ? 'activeDelete' : '')}`}>
        <IoTrash className="trash-icon" />
      </button>
    </button>
  );
};

export const dateToFormat = (format, date) => {
  let str = format.toLowerCase().slice();
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  let mm = str.includes("mmm") ? "mmm" : "mm";
  let dd = str.includes("ddd") ? "ddd" : "dd";
  let yy = str.includes("yyyy") ? "yyyy" : "yy";

  str = str.replace(
    mm,
    mm === "mm"
      ? (date.getMonth() + 1).toString().padStart(2, "0")
      : monthNames[date.getMonth()]
  );
  str = str.replace(
    dd,
    dd === "dd"
      ? date.getDate().toString().padStart(2, "0")
      : dayNames[date.getDay()]
  );
  str = str.replace(
    yy,
    yy === "yyyy"
      ? date.getFullYear().toString()
      : date.getFullYear().toString().slice(-2)
  );

  return str;
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
                value={courseName}
              />
            </Col>
            <Col>
              <TextField
                onChange={(e) => setCourseDesc(e.target.value)}
                id="outlined-basic"
                label="Course Description"
                variant="outlined"
                value={courseDesc}
              />
            </Col>
          </Row>
          <Row>
            <Col>
              <Button
                onClick={addCourse.bind(this, courseName, courseDesc)}
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
