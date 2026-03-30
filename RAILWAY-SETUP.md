# Instrucciones para desplegar en Railway

## 1. Preparar el repositorio

Asegúrate de tener estos archivos en la raíz:
- `server.js`
- `package.json`
- `package-lock.json`

## 2. Crear proyecto en Railway

1. Ve a https://railway.app
2. Click en "New Project" → "Deploy from GitHub"
3. Selecciona tu repositorio `youdown`
4. Railway detectará automáticamente que es una app Node.js

## 3. Configurar variables de entorno (si es necesario)

En Railway, ve a "Variables":
- `NODE_ENV`: `production`
- Opcionalmente: `DOWNLOAD_DIR` si quieres otro directorio

## 4. Obtener la URL de tu servidor

Una vez desplegado, Railway te dará una URL como:
```
https://youdown-production.up.railway.app
```

O un dominio personalizado si lo configuraste.

## 5. Actualizar la extensión

En `config.js` de tu extensión, reemplaza:

```javascript
SERVER_URL: 'https://youdown-production.up.railway.app',
```

con tu URL real de Railway.

## 6. Recargar la extensión

1. Ve a `chrome://extensions/`
2. Haz clic en el botón de "Recargar" de YouDown
3. ¡Listo!

## Detalles técnicos

- Railway automáticamente asigna un `PORT` (variable de entorno `process.env.PORT`)
- El servidor usa ese puerto automáticamente
- Los MP3s se guardan en `/tmp` o donde Railway lo permita
- El servidor tiene CORS habilitado para cualquier origen

## Tips

- Monitored logs en Railway para ver errores
- IMPORTANTE: Asegúrate de que `yt-dlp` esté instalado en el servidor Railway
- Si hay errores, revisa los logs en el dashboard de Railway

## Problemas comunes

### Error: "yt-dlp command not found"
Crea un `Dockerfile` en Railway:

```dockerfile
FROM node:18-alpine

RUN apk add --no-cache python3 py3-pip ffmpeg && \
    pip install yt-dlp

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

EXPOSE 3000
CMD ["npm", "start"]
```

### Error: "Servidor no disponible"
- Verifica que la URL en `config.js` sea correcta
- Chequea si el servidor en Railway está corriendo (logs)
- Espera un minuto, puede estar iniciando
