import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './pages/Auth';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import Landing from './pages/Landing';
import MockInterview from './pages/MockInterview';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import PersonalDetails from './pages/PersonalDetails';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/profile" element={<PersonalDetails />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/mock-interview" element={<MockInterview />} />
          <Route path="/resume" element={<ResumeAnalyzer />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
