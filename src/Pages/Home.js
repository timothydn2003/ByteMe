import Courses from "../Components/Courses"

const Home = () => {
    return(
        <div className="homePage">
            <div className="Header">
                <h1>ByteMyCourse</h1>
            </div>
            <div className="body">
                <Courses/>
            </div>
        </div>


    )
}

export default Home