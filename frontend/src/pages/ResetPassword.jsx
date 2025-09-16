import { useState } from "react";
import { useParams } from "react-router-dom";
import logo from "../assets/logo.png";
import 'bootstrap/dist/css/bootstrap.min.css';

function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirm_password, setCPass] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirm_password) {
      setError("Passwords do not match!");
      return;
    }

    const res = await fetch("http://127.0.0.1:5000/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setMsg(data.message || data.errormsg);
  };

  return (
    <div className="login-container">
      <div className="logo">
        <img src={logo} alt="Logo" className="logostyle"/>
      </div>

      <div className="container">
        <h2 className="mb-4">Reset Password</h2>
        <form onSubmit={handleSubmit}>
          
          
          {/* New Password */}
          <div className="inputs d-flex align-items-center mb-3">
            <i className="bi bi-lock fs-4 pe-3"></i>
            <input
              className="form-control"
              type={showPass ? "text" : "password"}
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="btn btn-outline-success ms-2"
              onClick={() => setShowPass(!showPass)}
            >
              {showPass ? "Hide" : "Show"}
            </button>
          </div>
          
          {/* Confirm Password */}
          <div className="inputs d-flex align-items-center mb-2">
            <i className="bi bi-lock-fill fs-4 pe-3"></i>
            <input
              className="form-control"
              type={showConfirmPass ? "text" : "password"}
              value={confirm_password}
              onChange={(e) => setCPass(e.target.value)}
              placeholder="Confirm Password"
              required
            />
            <button
              type="button"
              className="btn btn-outline-success ms-2"
              onClick={() => setShowConfirmPass(!showConfirmPass)}
            >
              {showConfirmPass ? "Hide" : "Show"}
            </button>
          </div>

          {/* Error message and submit button */}
          <div className="d-flex flex-column justify-content-center align-items-center">
            {error && <p className="text-danger">{error}</p>}
            <button className="btn btn-success mt-2">Update Password</button>
          </div>
        </form>

        <p className="mt-3">{msg}</p>
      </div>
    </div>
  );
}

export default ResetPassword;
