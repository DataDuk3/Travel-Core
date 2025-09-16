import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const handleCancel = () => {
    navigate("/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("http://127.0.0.1:5000/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setMsg(data.message);
  };

  return (
    <div className="login-container">
      <div className="logo">
        <img src={logo} alt="Logo" className="logostyle"/>
      </div>
      <div className="container">
        <h2 className="mb-4">Forgot Password</h2>
        <form onSubmit={handleSubmit}>
          <input
            className="form-control mb-3"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div>
            <button type="submit" className="btn btn-success me-2">Send Reset Link</button>
            <button className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
          </div>
          
        </form>
        <p className="mt-3">{msg}</p>
      </div>
    </div>
    
  );
}

export default ForgotPassword;
