Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Iniciando Marsella en Modo DESARROLLO (Hot Reloading RT)" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "Backend:  http://localhost:8080/api" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
docker stop marsella_exam_frontend 2>$null
docker compose -f docker-compose.dev.yml up
