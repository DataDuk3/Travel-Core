import React, { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate, Link } from "react-router-dom";   
import logo from "../assets/logo.png";
import "./StyleSheet.css"

export const LoginSignup = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPass] = useState("");
    const [confirm_password, setCPass] = useState("");
    const [isSignup, setIsSignup] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const modeChange = () => {
            setIsSignup(!isSignup); 
            setShowForm(!showForm);
            setName("");
            setEmail("");
            setPass("");
            setCPass("");
            setError("");
    };

    const submitform = async (e) => {
        e.preventDefault();
        
        // for signup
        if (showForm === true) {
            if (password !== confirm_password) {
                setError("Password do not match!");
                return;
            }

            const sendsignup = await fetch("http://127.0.0.1:5000/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json"},
                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password
                })
            });
            // wait for respons from flask
            const data = await sendsignup.json();

            if (sendsignup.ok && data.message && !isSignup) {
                alert(data.message);
                setTimeout(() => {
                window.location.reload(); 
                }, 1000);
            }else if (data.errormsg) {
                alert(data.errormsg);
            }else {
               alert(data.message); 
            };

        } else {

            // for logging in
            const sendlogin = await fetch("http://127.0.0.1:5000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json"},
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });
            // wait for flask response
            const data = await sendlogin.json();

            if (data.message) {
                alert(data.message);

                // save session_id
                localStorage.setItem("session_id", data.session_id);

                // redirect to the main_menu page
                navigate("/main_menu")

            } else {
                alert(data.errormsg);
            }
        }
        
    }
    return (
        <div className="login-container">
            <form onSubmit={submitform}>
                <div className="logo">
                    <img src={logo} alt="Logo" className="logostyle"/>
                </div>
                <div className="container">
                    <div className='mb-4 pb-2'>
                        <h1>{isSignup ? "Login" : "Signup"}</h1>
                    </div> 

                    {/* Name */}
                    {showForm && ( 
                        <div className='inputs'>
                            <i className="bi bi-person fs-4 pe-3"></i>
                            <input className='form-control mb-2' autoFocus autoComplete type='text' value={name} onChange={(e) => setName(e.target.value)} required  placeholder='Name'/>
                        </div>  
                    )}
                    
                    {/* gmail address */}
                    <div className='inputs'>
                        <i class="bi bi-envelope-at fs-4 pe-3"></i>
                        <input className='form-control mb-2' type='email' value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete placeholder='Gmail'/>
                    </div>

                    {/* password */}
                    <div className='inputs align-items-center'>
                        <i className="bi bi-lock fs-4 pe-3"></i>
                        <input className='form-control mb-2' 
                            type={showPass ? "text" : "password"} 
                            value={password} onChange={(e) => setPass(e.target.value)} 
                            required 
                            autoComplete 
                            placeholder='Password'
                        />
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-success ms-2"
                            onClick={() => setShowPass(!showPass)}
                        >
                            {showPass ? "Hide" : "Show"}
                        </button>
                    </div>

                    {!showForm && (
                        <div className="mt-2">
                            <Link to="/forgot-password">Forgot Password</Link>
                        </div>
                    )}

                    {/* Starts at false (login page) */}
                    {showForm && (
                        <>
                            <div className='inputs align-items-center'>
                                <i className="bi bi-lock-fill fs-4 pe-3"></i>
                                <input
                                    className='form-control mb-2'
                                    type={showConfirmPass ? "text" : "password"}
                                    value={confirm_password}
                                    onChange={(e) => setCPass(e.target.value)}
                                    required
                                    autoComplete
                                    placeholder='Confirm Password'
                                />
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-success ms-2"
                                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                                    >
                                    {showConfirmPass ? "Hide" : "Show"}
                                </button>
                            </div>
                            {error && <p className="text-red-500 text-sm m-2">{error}</p>}
                        </>
                    )}
                    <div className="mt-3">
                        <button type='submit' className="btn btn-success me-3">Enter</button>
                        <button className="btn btn-success" onClick={modeChange}>{isSignup ? "Sign Up" : "Log In"}</button>
                    </div>
                </div>
            </form>
        </div>  
    )
}

export default LoginSignup