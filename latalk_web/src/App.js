import { useState } from "react";
import Latex from "react-latex-next";
import "./App.css";

function App() {
  const [isListening, setIsListening] = useState(false);
  const [nlText, setNlText] = useState("");
  const [latexText, setLatexText] = useState("");

  const handleMicClick = async () => {
    setIsListening(!isListening);

    if (!isListening) {
      const response = await fetch("http://127.0.0.1:8000/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: "Lorem ipsum dolor sit amet." }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        try {
          const { nl, latex } = JSON.parse(chunk);
          setNlText((prev) => prev + " " + nl);
          setLatexText((prev) => prev + " " + latex);
        } catch {
          // skip incomplete chunks
        }
      }
      setIsListening(false);
    }
  };

  return (
    <div className="app-container">
      {/* Left column */}
      <div className="left-panel">
        <button
          className={`mic-button ${isListening ? "active" : ""}`}
          onClick={handleMicClick}
        >
          🎤
        </button>

        <div className="output-box">
          <h2>Natural Language Output</h2>
          <p>{nlText}</p>
        </div>
      </div>

      {/* Center title */}
      <div className="title-container">
        <h1>LaTalX</h1>
      </div>

      {/* Right column */}
      <div className="right-panel">
        <h2>LaTeX Renderer</h2>
        <Latex>{latexText}</Latex>
      </div>
    </div>
  );
}

export default App;
