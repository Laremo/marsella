Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Iniciando Marsella en Modo PRODUCCION (Nginx + Build)" -ForegroundColor Green
Write-Host "Frontend: http://localhost" -ForegroundColor Yellow
Write-Host "Backend:  http://localhost:8080/api" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
docker stop marsella_exam_frontend_dev 2>$null
docker compose up -d --build
