@echo off
echo ========================================================
echo Iniciando Marsella en Modo PRODUCCION (Nginx + Build)
echo Frontend: http://localhost (y http://localhost:3000)
echo Backend:  http://localhost:8080/api
echo ========================================================
docker compose up -d --build

