import { useState, useEffect } from "react";
import "./App.css";
import { useNavigate } from "react-router-dom";

function SavedButton() {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate("/SavedLaTeX")} className="savedButton">
      Saved LaTeX
    </button>
  );
}

function LoginButton() {
  const navigate = useNavigate();

  const handleClick = () => {
    // clear previous login state
    localStorage.removeItem("token");
    navigate("/Login");
  };

  return (
    <button onClick={handleClick} className="loginButton">
      Login / Signup
    </button>
  );
}


function Home({ renderLatex }) {
  const [nlText, setNlText] = useState("");
  const [latexText, setLatexText] = useState(
    "testing the quadratic formula which is $\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}$. it is useful. $$\\int_0^\\infty x^2 dx$$ $$\\int_0^\\infty x^2 dx$$ very cool stuff. remember the quadratic formula: $\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}$??"
  ); // initial sample text
  const [savedLatex, setSavedLatex] = useState([]); // snippets per user
  const username = localStorage.getItem("token"); // stored after login

  const addToSaved = async () => {
    if (!username) {
      // alert("Please login to save LaTeX.");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8004/save-latex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, latex: latexText }),
      });

      if (response.ok) {
        const newSnippet = await response.json();
        setSavedLatex((prev) => [...prev, newSnippet]); // append new
      } else {
        console.error("Failed to save snippet");
      }
    } catch (err) {
      console.error("Error saving snippet:", err);
    }
  };

  // fetch saved snippets for this user
  useEffect(() => {
    if (!username) return;
    const fetchSaved = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8004/get-latex/${username}`);
        if (res.ok) {
          const data = await res.json();
          setSavedLatex(data.snippets || []);
        }
      } catch (err) {
        console.error("Error fetching snippets:", err);
      }
    };
    fetchSaved();
  }, [username]);

  return (
    <div className="app-container">
      <h1>LaTalk</h1>
      <h2>Speech to LaTeX translator.</h2>

      <LoginButton />
      <SavedButton />

      <div className="bodyContainer">
        <div className="textContainer">
          <h3>Natural Language</h3>
          <div className="scrollContainer">
            <p>{nlText}</p>
          </div>
        </div>

        <div className="textContainer">
          <h3>LaTeX</h3>
          <div className="scrollContainer">
            <div className="latexText">{renderLatex(latexText)}</div>
          </div>
          <button onClick={addToSaved} className="saveButton">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
