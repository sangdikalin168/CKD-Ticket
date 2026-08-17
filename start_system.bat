@echo off
REM Starts the CKD system without Docker (the setup the office LAN uses).
REM   backend  -> Node/Apollo on :4000   (dotenv -e prod.env, NODE_ENV=production)
REM   frontend -> Vite dev server on :5173, bound to all interfaces (--host)
REM
REM The frontend proxies /graphql, /refresh_token and /uploads to :4000
REM (see frontend/vite.config.ts), so office browsers reach the API same-origin
REM at http://<this-machine-ip>:5173 with no CORS involved.
REM
REM The docker-compose.yml route (nginx + cloudflared) is the alternative
REM deployment; do not run both at once, they both want :4000.

cd /d "D:\CKD-System\backend"
echo Starting backend (port 4000)...
start /min npm start

cd /d "D:\CKD-System\frontend"
echo Starting frontend (port 5173)...
start /min npm start
