import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import SavedLaTeX from './SavedLaTeX';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/SavedLaTeX" element={<SavedLaTeX />} />
      </Routes>
    </Router>
  );
}

export default App;
