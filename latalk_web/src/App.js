import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import SavedLaTeX from './SavedLaTeX';
import { useState, useEffect } from "react";
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';


function renderLatex(text) {
  const parts = [];
  const regex = /(\$\$.*?\$\$|\$.*?\$)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const latex = match[0];
    if (latex.startsWith("$$")) {
      parts.push(<BlockMath math={latex.slice(2, -2)} />);
    }
    else if (latex.startsWith("$")) {
      parts.push(<InlineMath math={latex.slice(1, -1)} />);
    }
    else {
      parts.push(<p>{latex}</p>);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function App() {
  const [savedLatex, setSavedLatex] = useState([]);
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home savedLatex={savedLatex} setSavedLatex={setSavedLatex} renderLatex={renderLatex}/>} />
        <Route path="/SavedLaTeX" element={<SavedLaTeX savedLatex={savedLatex} renderLatex={renderLatex}/>} />
      </Routes>
    </Router>
  );
}

export default App;
