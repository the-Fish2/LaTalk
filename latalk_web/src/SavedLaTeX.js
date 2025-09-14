import { useNavigate } from 'react-router-dom';
import "./App.css";

function SavedLaTeX() {
  const navigate = useNavigate();
  return (
    <div className="app-container">
      <h1>Saved</h1>
      <h2>Your saved LaTeX translations will appear here.</h2>
      <button onClick={() => navigate('/')} className="savedButton">Home</button>
      <div className="textContainer2">
        <p>I love rats!</p>
      </div>
    </div>
  );
}

export default SavedLaTeX;
