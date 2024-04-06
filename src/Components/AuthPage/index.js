import { useState } from "react";
import { redirect } from "react-router-dom";
import { FiUser, FiLock, FiAnchor } from "react-icons/fi";

import './AuthPage.css';

import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase-config";

export default function AuthPage() {
    const [signUp, setSignUp] = useState(false)
    const [error, setError] = useState("")

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    function switchAuth() {
        setSignUp(!signUp)
    }

    function checkPassword(str) {
        if (str.length < 12)
            return {error: 'Password must be at least 12 characters long.'}
        if (str === str.toLowerCase())
            return {error: 'Password must contain at least 1 uppercase character.'}
        if (!(/\d/).test(str))
            return {error: 'Password must contain at least 1 numeric character.'}
        return {}
    }

    async function userLogin() {
        return await signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            return true
        })
        .catch((error) => {
            setError('User Not Found, Check Your Credentials.')
            return false
        })
    }

    async function userSignUp() {
        return await createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            return true
        })
        .catch((error) => {
            setError(error.message)
            return false
        })
    }

    async function handleAuthSubmit(evt) {
        evt.preventDefault()

        if (email === "" || password === "" || (signUp && confirmPassword === "")) {
            setError('Please Fill All Fields.')
            return
        }

        if (signUp && confirmPassword !== password) {
            setError('Both Passwords Must Match.')
            return
        }

        if (signUp) {
            const tmpErr = checkPassword(password)

            if (tmpErr.error !== undefined) {
                setError(tmpErr.error)
                return
            }
        }

        setError('')

        if (signUp) {
            const success = await userSignUp()
            if (success)
                window.location.replace('/')
        }
        else {
            const success = await userLogin()
            if (success)
                window.location.replace('/')
        }
    }

    return (
        <div className="pageBackground">
            <form onSubmit={handleAuthSubmit} className="authForm">
                <h2  className="authFormTitle">
                    {
                        (
                            signUp ?
                            'Sign Up' :
                            'Login'
                        )
                    }
                </h2>

                <div className="formInputWrapper">
                    <label>Email</label>
                    <div>
                        <FiUser color="#c2c2c2" />
                    </div>
                    <input onChange={(evt) => { setEmail(evt.target.value) }} value={email} placeholder="Type Your E-mail" name="email" type="email" className="emailInput" />
                </div>
                <div className="formInputWrapper">
                    <label>Password</label>
                    <div>
                        <FiLock color="#c2c2c2" />
                    </div>
                    <input onChange={(evt) => { setPassword(evt.target.value) }} value={password} placeholder="Type Your Password" name="password" type="password" className="passwordInput" />
                </div>
                {
                    (
                        signUp ?
                        <div className="formInputWrapper">
                            <label>Confirm Password</label>
                            <div>
                                <FiAnchor color="#c2c2c2" />
                            </div>
                            <input onChange={(evt) => { setConfirmPassword(evt.target.value) }} value={confirmPassword} placeholder="Confirm Your Password" name="confirmPassword" type="password" className="confirmPasswordInput" />
                        </div> :
                        <></>
                    )
                }
                <div className="authErrorWrapper">
                    <p className="authError">{error}</p>
                </div>
                <button type="submit" className="submitAuth">{(signUp ? "SIGN UP" : "LOGIN")}</button>
                <div className="formSpacer"></div>
                <footer onClick={switchAuth} className="formSwitch">{(signUp ? "Already A User?" : "Don't Have An Account?")}</footer>
            </form>
        </div>
    )
}