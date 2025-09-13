import { useState } from "react";
import Latex from "react-latex-next";
import "./App.css";
import micpic from "./Microphone2.png"

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
        <h1>LaTalk</h1>
        <h2>Speech to LaTeX translator.</h2>


        <button
              className={`mic-button ${isListening ? "active" : ""}`}
              onClick={handleMicClick}
            >
            <img className = "micIcon" src = {micpic} alt = "mic" />
        </button>

        <div className = "bodyContainer">

          <div className = "textContainer">
            <h3>Natural Language</h3>
            <div className = "scrollContainer">
              <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. 
              Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum. Lorem Ipsum is simply dummy text of the printing and typesetting industry. 
              Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</p>
            </div>
          </div>
          <div className = "textContainer">
            <h3>LaTeX</h3>
            <div className = "scrollContainer">
              <p>some more text here translated into latex</p>
              <p className = "annotation">i love rats!</p>
            </div>
          </div>

        </div>

      </div>
  );
}

export default App;
