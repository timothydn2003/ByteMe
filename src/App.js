// App.js

import "./App.css";

import { Home as NewHome } from "./Components/Home";
import { CoursesContext } from "./Components/CoursesContext";

import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase-config";

function App() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in, see docs for a list of available properties
            // https://firebase.google.com/docs/reference/js/auth.user
            const uid = user.uid;
            
            //do something
        } else {
            // User is signed out
            // ...
            window.location.replace('/authenticate')
        }
    })

    function signUserOut(evt) {
        evt.preventDefault()

        signOut(auth).then(() => {
            window.location.replace('/authenticate')
        }).catch((error) => {
            console.log(error)
        })
    }

    return (
        <div className="App">
            <button onClick={signUserOut} className="signOutBtn">Sign Out</button>
            <HomeContext />
        </div>
    );
}

const HomeContext = () => {
    return (
        <CoursesContext>
            <NewHome />
        </CoursesContext>
    )
}

export default App;
