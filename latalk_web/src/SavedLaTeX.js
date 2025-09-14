import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./App.css";
import "katex/dist/katex.min.css";

function SavedLaTeX({ renderLatex }) {
  const navigate = useNavigate();
  const [savedLatex, setSavedLatex] = useState([]);
  const username = localStorage.getItem("token");

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
      <h1>Saved</h1>
      <h2>Your saved LaTeX translations will appear here.</h2>
      <button onClick={() => navigate("/")} className="savedButton">
        Home
      </button>
      <div className="textContainer2">
        <div className="scrollContainer">
          <div className="latexText">
            {savedLatex.length === 0 ? (
              <p>No saved items yet.</p>
            ) : (
              savedLatex.map((s) => (
                <div key={s.id}>{renderLatex(s.latex)}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SavedLaTeX;
