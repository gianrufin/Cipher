import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
try {
  const storedTheme = localStorage.getItem('cipher_theme');
  document.documentElement.dataset.theme = storedTheme === 'light' || storedTheme === 'dark'
    ? storedTheme
    : preferredTheme;
} catch {
  document.documentElement.dataset.theme = preferredTheme;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
