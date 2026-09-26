import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../Utils/api";
import { setAdminUser, setSession } from "../Utils/auth";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    identifier: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await api.post("/auth/admin/login", {
        username: form.identifier.trim(),
        password: form.password,
      });
      setSession(
        data.accessToken,
        new Date(data.accessTokenExpiresAt).getTime(),
        data.refreshToken,
        new Date(data.refreshTokenExpiresAt).getTime(),
      );
      setAdminUser(data.user);
      navigate("/dashboard");
    } catch {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <img src="/Starry Nights Holidays.png" alt="Starry Nights Holidays" className="login-logo" />
        <h1>STARRY NIGHTS HOLIDAYS</h1>
        <p>Secure Login for Admin Access</p>

        <form onSubmit={handleLogin}>
          <input
            type="text"
            name="identifier"
            placeholder="Admin email or user ID"
            value={form.identifier}
            onChange={handleChange}
            autoComplete="username"
            required
          />
          <div className="password-wrapper">
            <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" value={form.password} onChange={handleChange} autoComplete="current-password" required />
            <span className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? "Hide" : "Show"}
            </span>
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}

export default Login;
