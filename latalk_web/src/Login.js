import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const url = isSignUp
      ? "http://127.0.0.1:8005/signup"
      : "http://127.0.0.1:8005/login";
  
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
});
  
      const data = await response.json();
  
      if (response.ok) {
        if (data.access_token) {
          localStorage.setItem("token", data.access_token);
          setMessage(""); // clear any old error
        }
        navigate("/");
      } else {
        setMessage("Error.")
      }
    } catch (error) {
      console.error("Error:", error);
        setMessage("Failed to connect to the server.")
    }
  };
  
  return (
    <div className="app-container">
      <h1>{isSignUp ? "Sign Up" : "Login"}</h1>
      <form className="submitContainer" onSubmit={handleSubmit}>
        <div>
          <h3>Username:</h3>
          <input
            className="usernamepwInput"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <h3>Password:</h3>
          <input
            className="usernamepwInput"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button className = "submit" type="submit">{isSignUp ? "Sign Up" : "Login"}</button>
        <button className = "toggle" type="button" onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp
            ? "Already have an account? Login"
            : "Don't have an account? Sign Up"}
        </button>
      </form>
      {message && <div className="alert">{message}</div>}
    </div>
  );
};

export default Login;
