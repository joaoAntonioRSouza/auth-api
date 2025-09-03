# Guia de Deploy

## Preparação para Produção

### 1. Variáveis de Ambiente

\`\`\`env
# Production Environment
NODE_ENV=production
PORT=3000

# Database (Production)
DB_HOST=seu-postgres-host
DB_PORT=5432
DB_NAME=auth_production
DB_USER=auth_user
DB_PASSWORD=senha_super_segura

# JWT (IMPORTANTE: Use chave forte)
JWT_SECRET=chave_jwt_super_segura_com_pelo_menos_32_caracteres
JWT_EXPIRES_IN=24h

# Redis (Production)
REDIS_HOST=seu-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=senha_redis_segura

# API Info
API_TITLE=Authentication API
API_VERSION=1.0.0
API_DESCRIPTION=Sistema de autenticação em produção
\`\`\`

### 2. Docker

\`\`\`dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/
COPY docs/ ./docs/

EXPOSE 3000

USER node

CMD ["npm", "start"]
\`\`\`

\`\`\`yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: auth_production
      POSTGRES_USER: auth_user
      POSTGRES_PASSWORD: senha_super_segura
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass senha_redis_segura
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
\`\`\`

### 3. Nginx (Reverse Proxy)

\`\`\`nginx
# /etc/nginx/sites-available/auth-api
server {
    listen 80;
    server_name api.seudominio.com;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
\`\`\`

### 4. SSL com Let's Encrypt

\`\`\`bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d api.seudominio.com

# Auto-renovação
sudo crontab -e
# Adicionar: 0 12 * * * /usr/bin/certbot renew --quiet
\`\`\`

## Monitoramento

### 1. PM2 (Process Manager)

\`\`\`bash
# Instalar PM2
npm install -g pm2

# Configuração
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'auth-api',
    script: 'src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}

# Iniciar
pm2 start ecosystem.config.js

# Monitorar
pm2 monit

# Logs
pm2 logs

# Restart
pm2 restart auth-api
\`\`\`

### 2. Health Checks

\`\`\`bash
# Script de health check
#!/bin/bash
# health-check.sh

ENDPOINT="http://localhost:3000/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $ENDPOINT)

if [ $RESPONSE -eq 200 ]; then
    echo "✅ API is healthy"
    exit 0
else
    echo "❌ API is unhealthy (HTTP $RESPONSE)"
    exit 1
fi
\`\`\`

### 3. Backup

\`\`\`bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Backup PostgreSQL
pg_dump -h localhost -U auth_user auth_production > $BACKUP_DIR/db_$DATE.sql

# Backup Redis (se necessário)
redis-cli --rdb $BACKUP_DIR/redis_$DATE.rdb

# Limpar backups antigos (manter 7 dias)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.rdb" -mtime +7 -delete

echo "Backup completed: $DATE"
\`\`\`

## Segurança em Produção

### 1. Firewall

\`\`\`bash
# UFW (Ubuntu)
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw deny 3000  # Bloquear acesso direto à API
\`\`\`

### 2. Fail2Ban

\`\`\`ini
# /etc/fail2ban/jail.local
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[nginx-auth-api]
enabled = true
port = http,https
filter = nginx-auth-api
logpath = /var/log/nginx/access.log
maxretry = 3
bantime = 1800
\`\`\`

### 3. Monitoramento de Logs

\`\`\`bash
# Logrotate
# /etc/logrotate.d/auth-api
/app/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 node node
    postrotate
        pm2 reloadLogs
    endscript
}
\`\`\`

## Performance

### 1. Otimizações

\`\`\`javascript
// Configurações de produção no server.js
if (process.env.NODE_ENV === 'production') {
  // Compressão
  app.use(compression())
  
  // Cache headers
  app.use(express.static('public', {
    maxAge: '1d',
    etag: true
  }))
  
  // Trust proxy
  app.set('trust proxy', 1)
}
\`\`\`

### 2. Redis Clustering (Alta Disponibilidade)

\`\`\`yaml
# redis-cluster.yml
version: '3.8'

services:
  redis-master:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    
  redis-replica:
    image: redis:7-alpine
    command: redis-server --slaveof redis-master 6379 --appendonly yes
    depends_on:
      - redis-master
\`\`\`

## Checklist de Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados criado e migrado
- [ ] Redis configurado
- [ ] SSL certificado instalado
- [ ] Firewall configurado
- [ ] Monitoramento ativo
- [ ] Backups automatizados
- [ ] Health checks funcionando
- [ ] Logs estruturados
- [ ] Rate limiting configurado
- [ ] Documentação atualizada
