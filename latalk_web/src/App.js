import { useState, useEffect } from "react";
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
      const response = await fetch("http://127.0.0.1:3000/stream", {
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

  useEffect(() => {
    const eventSource = new EventSource("http://127.0.0.1:3000/events");

    eventSource.onmessage = (event) => {

      try {
        const { text } = JSON.parse(event.data);
        setNlText((prev) => prev + " " + text);
      } catch (err) {
        console.error("Error parsing SSE data:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE connection error:", err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

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
              <p id="output_plaintext">{nlText}</p>
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
