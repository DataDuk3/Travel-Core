import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom"; 
import "./StyleSheet.css"; 
import logo2 from "../assets/logo2.png";

function Navbar() {
    const navigate = useNavigate();

    const handleLogout = async () => {
        const confirmLogout = window.confirm("Are you sure?")
        if (!confirmLogout) {
            return;
        }

        const session_id = localStorage.getItem("session_id");

        if (session_id) {
            try {
                await fetch("http://localhost:5000/logout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ session_id })
                });
            } catch (err) {
                console.error("Logout failed:", err);
            }
        }

        // Clear session storage
        localStorage.removeItem("session_id");

        // Redirect & block going back
        navigate("/login", { replace: true });
        window.history.pushState(null, "", "/login");
        window.onpopstate = () => {
            navigate("/login", { replace: true });
        };
    };

    useEffect(() => {
        const session_id = localStorage.getItem("session_id");
        if (!session_id) {
            navigate("/login", { replace: true });
        }
    }, [navigate]);

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3">
            <div className="pe-2">
                <img src={logo2} alt="Logo" className="logo2style"/>
            </div>
            <Link className="navbar-brand fw-bold" to="/">Travel Core</Link>
            
            {/* Toggler for mobile */}
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span className="navbar-toggler-icon"></span>
            </button>

            {/* Menu items */}
            <div className="collapse navbar-collapse" id="navbarNav">
                <ul className="navbar-nav ms-auto">
                    <li className="nav-item">
                        <Link className="nav-link active" to="/main_menu">Home</Link>
                    </li>
                    <li className="nav-item">
                        <Link className="nav-link" to="/about">About</Link>
                    </li>
                    <li className="nav-item">
                        <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
                    </li>
                </ul>
            </div>
        </nav>
    );
}

export default Navbar;
