// In production (Vercel), REACT_APP_API_BASE is empty string, meaning use relative URLs (same domain)
// In development, REACT_APP_API_BASE points to localhost backend (or codespace backend)
// For codespaces, use relative URLs with proxy configuration
export const API_BASE = (() => {
  if (process.env.REACT_APP_API_BASE) {
    return process.env.REACT_APP_API_BASE;
  }
  if (typeof window !== 'undefined') {
    // In GitHub Codespace, use relative URLs (proxied through frontend server)
    const hostname = window.location.hostname;
    if (hostname.includes('.app.github.dev')) {
      // Use relative URLs - frontend proxy will forward to backend
      return '';
    }
    // Fallback for localhost development
    return 'http://localhost:3000';
  }
  return '';
})();
