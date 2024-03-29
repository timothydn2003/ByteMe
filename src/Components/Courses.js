import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import '../App.css';
import { useEffect, useState } from 'react';
import { db } from '../firebase-config'
import { collection, getDocs } from 'firebase/firestore'
import Button from '@mui/material/Button';

const Courses = () => {
    const [courses,setCourses] = useState([])
    const courseCollectionRef = collection(db, "Courses")

    useEffect(() => {
        const getCourses = async() => {
            const data = await getDocs(courseCollectionRef)
            setCourses(data.docs.map((doc) => ({...doc.data(), id: doc.id})))
            console.log(courses)
        }
        getCourses()
    })
    return(
        <div className="courses">

            <Container>
                <Row>
                    <Col>
                        <Button variant="contained">Add Course</Button>
                    </Col>
                </Row>
            {courses.map((data) => {
                return(
                    <Row>
                        <Col style={{disply:'flex', justifyContent:'left'}}>
                            <button className='courseBtn'>{data.id}</button>
                        </Col>
                        <Col>

                        </Col>
                    </Row>
                )

            })}
            </Container>
        </div>
    )
}

export default Courses