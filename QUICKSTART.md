## ⚡ Quick Start - Para Railway

### Paso 1: Push a GitHub
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### Paso 2: Desplegar en Railway
1. Ve a https://railway.app/dashboard
2. Click **"New"** → **"Project from GitHub"**
3. Selecciona `youdown`
4. Railway detectará Node.js automáticamente
5. Espera a que se despliegue ✅

### Paso 3: Obtener tu URL
1. En Railway, verás tu dominio como: `https://youdown-xxx.railway.app`
2. Cópialo

### Paso 4: Actualizar la extensión
En `config.js`:
```javascript
const CONFIG = {
  SERVER_URL: 'https://youdown-xxx.railway.app', // Pega tu URL aquí
};
```

### Paso 5: Recargar en Chrome
1. `chrome://extensions/`
2. Haz clic en "Recargar" en la extensión YouDown

### ✅ ¡Listo!
Ve a YouTube, haz clic en YouDown, y descarga MP3s desde la nube.

---

## Troubleshooting rápido

| Problema | Solución |
|----------|----------|
| Error al conectar | Verifica tu URL en `config.js` |
| yt-dlp no encontrado | Sube el `Dockerfile` a tu repo y redeploy |
| Servidor lento | Railway toma unos 30s en iniciar |
| No descargan los MP3s | Chequea los logs en Railway dashboard |

Ver `RAILWAY-SETUP.md` para problemas más específicos.
