import './index.css';
import App from './App.tsx';
import { StrictMode } from 'react';
import { inject } from '@vercel/analytics';
import { createRoot } from 'react-dom/client';

// Inject analytics
inject();

// Render the application
createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
