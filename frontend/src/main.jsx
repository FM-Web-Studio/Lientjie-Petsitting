import React from 'react';
import ReactDOM from 'react-dom/client';
// Global styles first, so each component's own CSS module can override them.
import './styles/globals.css';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
