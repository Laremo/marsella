#!/bin/bash
# =============================================================================
# Script de aprovisionamiento en AWS EC2 (Ubuntu 22.04 / 24.04 LTS)
# =============================================================================
set -e

echo "=== 1. Actualizando paquetes del sistema e instalando herramientas ==="
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release git ufw certbot
sudo mkdir -p /etc/letsencrypt

echo "=== 2. Configurando Firewall UFW ==="
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo "=== 3. Instalando Docker y Docker Compose ==="
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER

echo "=== 4. Creando archivo Swap de 2GB (Recomendado para EC2) ==="
if [ ! -f /swapfile ]; then
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# Dar permisos de ejecución a los scripts del proyecto
chmod +x init-ssl.sh backup-db.sh 2>/dev/null || true

echo "=== Listo! Reinicia tu sesión de SSH para aplicar permisos de Docker ==="
echo "1. Configura tus secretos: cp .env.production.example .env && nano .env"
echo "2. Para configurar SSL y arrancar: sudo ./init-ssl.sh"
