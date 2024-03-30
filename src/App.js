// App.js

import "./App.css";

// OLD import below
import Home from "./Pages/Home";

import { Home as NewHome } from "./Components/Home";
import { CoursesContext } from "./Components/CoursesContext";

function App() {
    return (
        <div className="App">
            {/* <Home /> */}
            <CoursesContext>
                <NewHome />
            </CoursesContext>
        </div>
    );
}

export default App;
