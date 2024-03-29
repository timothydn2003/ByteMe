import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import '../App.css';
import { useEffect, useState } from 'react';
import { db } from '../firebase-config'
import { collection, getDocs, addDoc } from 'firebase/firestore'
import Button from '@mui/material/Button';
import * as React from 'react';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import TextField from '@mui/material/TextField';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};
const Courses = () => {
    const [courses,setCourses] = useState([])
    const [currentCourse, setCurrentCourse] = useState([])
    const courseCollectionRef = collection(db, "Courses")

    // Add course states
    const [courseName, setCourseName] = useState("")
    const [courseDesc, setCourseDesc] = useState("")

    // Modal States
    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    useEffect(() => {
        const getCourses = async() => {
            const data = await getDocs(courseCollectionRef)
            setCourses(data.docs.map((doc) => ({...doc.data(), id: doc.id})))
            console.log(courses)
        }
        getCourses()
    })

    const addCourse = async() => {
        await addDoc(courseCollectionRef, {name: courseName, description: courseDesc})
    }
    return(
        <div className="courses">

            <Container>
                <Row>
                    <Col>
                        <Button style={{marginBottom: '10px'}} onClick={handleOpen} variant="contained">Add Course</Button>
                    </Col>
                </Row>


                    <Row>
                        <Col style={{disply:'flex', justifyContent:'left'}}>
                            {courses.map((data) => {
                                return(
                                    <div>
                                        <button className='courseBtn'>{data.name}</button><br/>
                                    </div>
                                )
                            })}
                        </Col>
                        <Col>

                        </Col>
                    </Row>


            </Container>
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
                        <TextField onChange={(e) => setCourseName(e.target.value)} id="outlined-basic" label="Course Name" variant="outlined" />
                    </Col>
                    <Col>
                        <TextField onChange={(e) => setCourseDesc(e.target.value)} id="outlined-basic" label="Course Description" variant="outlined" />
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <Button onClick={addCourse} style={{marginTop: '10px'}} variant="contained">Add Course</Button>
                    </Col>
                </Row>
            </Container>
            </Box>
        </Modal>
        </div>
    )
}

export default Courses