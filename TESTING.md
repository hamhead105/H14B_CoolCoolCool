# Local Development & Testing Guide

## Quick Start: Run Both Frontend & Backend Locally

### 1. Start the Backend (Terminal 1)
```bash
cd backend
npm install  # if not already done
npm run dev  # uses nodemon for auto-reload on file changes
# Backend will run on http://localhost:3000
```

### 2. Start the Frontend (Terminal 2)
```bash
cd frontend
npm install  # if not already done
npm start
# Frontend will run on http://localhost:3000 (React's default)
# The .env.local file automatically sets REACT_APP_API_BASE=http://localhost:3000
```

### 3. Test the Login Flow
- Open **http://localhost:3000** in your browser
- Try logging in with test credentials
- Frontend will send requests to `http://localhost:3000/buyers/login` ✓
- Check browser Console (F12) for any errors

---

## Vercel Deployment Configuration

Your `vercel.json` already routes API calls to the backend, but you need to ensure:

### Backend on Vercel
1. Push the latest code with working backend tests:
   ```bash
   git push origin frontend-iterate
   ```

2. The backend should automatically deploy. Verify by visiting:
   - `https://your-deployment.vercel.app/health` 
   - Should return `{ "status": "ok" }`

### Frontend on Vercel
- Uses `.env.production` which sets `REACT_APP_API_BASE=` (empty string)
- This makes the frontend use relative URLs: `/buyers/login` → `/buyers/login`
- Vercel's routing config forwards `/buyers/*` to the backend ✓

### Troubleshooting 500 Error on Vercel

If you see `FUNCTION_INVOCATION_FAILED`, check:

1. **Backend health endpoint**:
   ```bash
   curl https://your-deployment.vercel.app/health
   ```
   Should return `{"status":"ok"}`

2. **Check Vercel logs**:
   - Go to your Vercel project dashboard → Functions tab
   - Look for error logs from the `server.js` invocation

3. **Ensure environment variables are set in Vercel**:
   - Go to project Settings → Environment Variables
   - Add: `JWT_SECRET=your-secret-key` (same value as local .env)
   - Add: `DATABASE_URL=your-prisma-database-url` (if using remote DB)
   - Redeploy after adding variables

---

## Common Issues

### Frontend Still Hitting Old URL
- Delete browser cache or use Incognito mode
- Check Network tab in DevTools to see actual request URL
- Should be `/buyers/login` (relative), not `https://...`

### "Cannot GET /buyers/login" on Vercel
- Backend routes not deployed properly
- Check Vercel backend logs for syntax errors
- Verify `npm test` passes locally before deploying

### JWT Auth Failures
- Ensure `JWT_SECRET` is set identically everywhere:
  - Local: `.env` file in backend folder
  - Vercel: Environment Variables in project settings
  - Tests: Automatically set in `tests/setup.js`

---

## Files Modified for Frontend<→Backend Communication

- `frontend/.env.local` → Local dev config (backend on http://localhost:3001)
- `frontend/.env.production` → Production config (empty = relative URLs)
- `frontend/src/apiConfig.js` → Centralized API base URL logic
- `backend/package.json` → Added test coverage threshold (85% branches)
- `backend/tests/unit/auth.test.js` → New auth middleware tests
- `backend/tests/unit/emailService.test.js` → New email service tests  
- `backend/tests/system/orders.rating.test.js` → New rating endpoint tests

All tests pass: `22 passed, 22 total` with `89.17% branch coverage` ✓
