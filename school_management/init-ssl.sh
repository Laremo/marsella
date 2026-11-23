#!/bin/bash
# =============================================================================
# MARSELLA - SCRIPT AUTOMATIZADO DE CERTIFICADO SSL (LET'S ENCRYPT)
# =============================================================================
set -e

if [ "$EUID" -ne 0 ]; then
  echo "Por favor ejecuta este script con permisos sudo: sudo ./init-ssl.sh"
  exit 1
fi

echo "========================================================"
echo " CONFIGURACIÓN DE DOMINIO Y CERTIFICADO SSL GRATUITO"
echo "========================================================"
echo ""

# 1. Solicitar Dominio
read -p "Ingresa tu dominio (ej. marsella.duckdns.org o examenes.colegiomarsella.edu.mx): " DOMAIN
if [ -z "$DOMAIN" ]; then
    echo "Error: El dominio no puede estar vacío."
    exit 1
fi

# 2. Solicitar Email
read -p "Ingresa tu correo para avisos de renovación de Let's Encrypt: " EMAIL
if [ -z "$EMAIL" ]; then
    echo "Error: El correo no puede estar vacío."
    exit 1
fi

echo ""
echo "=== 1. Verificando que Certbot esté instalado ==="
if ! command -v certbot &> /dev/null; then
    apt-get update && apt-get install -y certbot
fi

echo "=== 2. Deteniendo contenedor frontend temporalmente para liberar el puerto 80 ==="
docker stop marsella_exam_frontend 2>/dev/null || true

echo "=== 3. Obteniendo certificado SSL gratuito de Let's Encrypt para $DOMAIN ==="
certbot certonly --standalone \
    -d "$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --non-interactive

echo "=== 4. Generando configuración de Nginx con SSL y WebSockets ==="
cat <<EOF > frontend/nginx.prod.conf
server {
    listen 80;
    server_name $DOMAIN;

    # Redirección obligatoria de HTTP a HTTPS
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Frontend Single Page App
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
    }

    # API Proxy para Spring Boot backend
    location /api/ {
        proxy_pass http://backend:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    # WebSocket Proxy para Quizzes en vivo (WSS)
    location /ws/ {
        proxy_pass http://backend:8080/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
EOF

echo "=== 5. Configurando auto-renovación de certificados en crontab ==="
RENEW_CRON="0 3 * * * certbot renew --quiet --post-hook 'docker restart marsella_exam_frontend'"
(crontab -l 2>/dev/null | grep -v certbot ; echo "$RENEW_CRON") | crontab -

echo "=== 6. Levantando la aplicación con HTTPS ==="
docker compose -f docker-compose.prod.yml --env-file .env up -d --build

echo ""
echo "================================================================"
echo " ¡LISTO! Tu plataforma está funcionando con HTTPS y SSL seguro:"
echo " https://$DOMAIN"
echo "================================================================"
