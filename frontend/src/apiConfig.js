// In production (Vercel), REACT_APP_API_BASE is empty string, meaning use relative URLs (same domain)
// In development, REACT_APP_API_BASE points to localhost backend (or codespace backend)
// For codespaces, use relative URLs with proxy configuration
export const API_BASE = (() => {
  if (process.env.REACT_APP_API_BASE) {
    return process.env.REACT_APP_API_BASE;
  }
  // Use the API prefix for both local development and production.
  return '/api';
})();
