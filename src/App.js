import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import MeetNowApp from './MeetNowApp';
import ProximityChatTestPage from './pages/ProximityChatTestPage';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="app-nav">
          <ul>
            <li>
              <Link to="/">MeetNow App</Link>
            </li>
            <li>
              <Link to="/proximity-chat-test">Proximity Chat Test</Link>
            </li>
          </ul>
        </nav>

        <Routes>
          <Route path="/proximity-chat-test" element={<ProximityChatTestPage />} />
          <Route path="/" element={<MeetNowApp />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 