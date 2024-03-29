import Courses from "../Components/Courses"
import '../App.css';
import { useState } from "react";
import LinearProgress from '@mui/material/LinearProgress';

const Home = () => {
    const [loading,setLoading] = useState(false)
    return(
        <div className="homePage">
            <div className="Header">
            {loading? <LinearProgress />:""}
                <h1>ByteMyCourse</h1>
            </div>
            <div className="body">
                <Courses setLoading = {setLoading}/>
            </div>
        </div>


    )
}

export default Home