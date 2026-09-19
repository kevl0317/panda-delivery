@echo off
setlocal
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 (
  echo Python was not found. Please install Python and try again.
  pause
  exit /b 1
)
echo Game URL: http://localhost:8788
echo Keep this window open. Press Ctrl+C to stop the server.
start "" /b powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:8788'"
python -m http.server 8788 --bind 127.0.0.1
if errorlevel 1 (
  echo Server could not start. If port 8788 is in use, open http://localhost:8788
  pause
)
