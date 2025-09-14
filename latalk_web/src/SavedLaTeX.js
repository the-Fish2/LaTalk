import { useNavigate } from 'react-router-dom';
import "./App.css";
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';


function SavedLaTeX({savedLatex, renderLatex}) {
  const navigate = useNavigate();
  return (
    <div className="app-container">
      <h1>Saved</h1>
      <h2>Your saved LaTeX translations will appear here.</h2>
      <button onClick={() => navigate('/')} className="savedButton">Home</button>
      <div className="textContainer2">
        {savedLatex.length === 0 ? (
          <p>No saved items yet.</p>
        ) : (
          savedLatex.map((item) => (
              <div>{renderLatex(item)}</div>
          ))
        )}
      </div>
    </div>
  );
}

export default SavedLaTeX;
