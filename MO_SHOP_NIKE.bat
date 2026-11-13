@echo off
title Shop Giay Nike - Frontend & Backend Launcher
cd /d "%~dp0"
echo =======================================================
echo    SHOP GIAY NIKE CHINH HANG 2026 - KHOI DONG HE THONG
echo =======================================================
echo Dang khoi dong Backend REST API tai http://localhost:5000 ...
start /b "" node backend/server.js
echo Dang khoi dong Frontend UI tai http://localhost:8080 ...
start /b "" node frontend/server.js
timeout /t 1 /nobreak >nul
start "" "http://localhost:8080"
echo Da khoi dong thanh cong!
exit
