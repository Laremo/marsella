@echo off
echo ========================================================
echo Iniciando Marsella en Modo DESARROLLO (Hot Reloading RT)
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8080/api
echo ========================================================
docker compose -f docker-compose.dev.yml up

