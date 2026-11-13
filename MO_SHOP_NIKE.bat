@echo off
title Shop Giay Nike Launcher
cd /d "%~dp0"
echo Dang khoi dong may chu Shop Giay Nike tai http://localhost:8080 ...
start /b "" node server.js
timeout /t 1 /nobreak >nul
start "" "http://localhost:8080"
exit
