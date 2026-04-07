// In production (Vercel), REACT_APP_API_BASE is empty string, meaning use relative URLs (same domain)
// In development, REACT_APP_API_BASE points to localhost backend
export const API_BASE = process.env.REACT_APP_API_BASE !== undefined ? process.env.REACT_APP_API_BASE : (typeof window !== 'undefined' ? window.location.origin : '');
