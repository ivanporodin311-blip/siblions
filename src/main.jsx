// main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Ловим код ДО запуска приложения
const params = new URLSearchParams(window.location.search);
const code = params.get('code');
const state = params.get('state');

if (code) {
  // Сохраняем временные параметры, чтобы App.jsx их подхватил
  sessionStorage.setItem('temp_oauth_code', code);
  sessionStorage.setItem('temp_oauth_state', state);
  
  // Чистим URL сразу, чтобы роутер не сходил с ума
  const cleanUrl = window.location.origin + window.location.pathname;
  window.history.replaceState(null, '', cleanUrl);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)