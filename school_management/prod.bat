@echo off
echo ========================================================
echo Iniciando Marsella en Modo PRODUCCION (Nginx + Build)
echo Frontend: http://localhost
echo Backend:  http://localhost:8080/api
echo ========================================================
docker stop marsella_exam_frontend_dev 2>nul
docker compose up -d --build
