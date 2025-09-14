import { useState, useEffect } from "react";
import "./App.css";
import micpic from "./Microphone2.png"
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { useNavigate } from 'react-router-dom'

function SavedButton() {
  const navigate = useNavigate();
  const click = () => {
    navigate('/SavedLaTeX');
  }
  return (
    <button onClick = {click} className = "savedButton">Saved LaTeX</button>
  )
}

function Home({savedLatex, setSavedLatex, renderLatex}) {
  const [isListening, setIsListening] = useState(false);
  const [nlText, setNlText] = useState("");
  const [latexText, setLatexText] = useState("testing the quadratic formula which is $\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}$. it is useful. $$\\int_0^\\infty x^2 dx$$ $$\\int_0^\\infty x^2 dx$$ very cool stuff. remember teh quadratic formula: $\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}$??");

  const addToSaved = () => {
    setSavedLatex([...savedLatex, latexText]);
  }

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

  useEffect(() => {
    const eventSource = new EventSource("http://127.0.0.1:3000/latex_events");

    eventSource.onmessage = (event) => {

      try {
        const { text } = JSON.parse(event.data);
        setLatexText((prev) => prev + " " + text);
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

        <SavedButton/>

        <div className = "bodyContainer">

          <div className = "textContainer">
            <h3>Natural Language</h3>
            <div className = "scrollContainer">
              <p id="output_plaintext">{nlText}</p>
            </div>
          </div>
          <div className="textContainer">
            <h3>LaTeX</h3>
            <div className="scrollContainer">
              <div>{renderLatex(latexText)}</div>
              {/* <p className="annotation">I love rats!</p> */}
            </div>
            <button onClick={addToSaved} className="saveButton">Save</button>
          </div>
        </div>
      </div>
  );
}

export default Home;
