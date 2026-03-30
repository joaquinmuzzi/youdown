FROM node:18-alpine

# Instalar yt-dlp, ffmpeg y otras dependencias
RUN apk add --no-cache python3 py3-pip gcc musl-dev linux-headers ffmpeg && \
    pip install --no-cache-dir yt-dlp

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos
COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Exponer puerto
EXPOSE 3000

# Variable de entorno
ENV NODE_ENV=production

# Iniciar servidor
CMD ["npm", "start"]
