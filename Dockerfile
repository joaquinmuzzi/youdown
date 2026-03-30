FROM node:18-alpine

RUN apk add --no-cache ffmpeg yt-dlp

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
