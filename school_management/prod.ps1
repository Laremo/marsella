Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Iniciando Marsella en Modo PRODUCCION (Nginx + Build)" -ForegroundColor Green
Write-Host "Frontend: http://localhost (y http://localhost:3000)" -ForegroundColor Yellow
Write-Host "Backend:  http://localhost:8080/api" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
docker compose up -d --build

