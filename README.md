# YouDown - Extensión de Chrome para YouTube

Descarga todas las URLs de un mix o playlist de YouTube y **descargalas como MP3** directamente desde Chrome usando tu servidor de Railway.

## Características

✅ Extrae todas las URLs de los videos de un mix/playlist de YouTube  
✅ **Descarga videos como MP3** usando yt-dlp en tu servidor  
✅ Funciona con Railway (o servidor local)  
✅ Vista previa de las URLs extraídas  
✅ Copiar URLs al portapapeles  
✅ Interfaz moderna y fácil de usar  

## Requisitos

- Chrome/Chromium
- Servidor Railway con Node.js (O servidor local con Node.js + yt-dlp)

## Opción A: Usar Railway (RECOMENDADO - Ya tienes suscripción)

### 1. Desplegar en Railway

1. Sube este repositorio a GitHub
2. Ve a https://railway.app
3. Click en **"New Project"** → **"Deploy from GitHub"**
4. Selecciona tu repositorio `youdown`
5. Railway detectará automáticamente que es Node.js
6. **Importante**: En las Variables, asegúrate de que esté instalado `yt-dlp`
   - Si Railway no lo detecta, sube este `Dockerfile` a tu repo

**Obtener tu URL:**
- Una vez desplegado, irás a tu URL pública (ej: `https://youdown-xxx.up.railway.app`)

### 2. Configurar la extensión

Edita `config.js` en tu extensión:

```javascript
const CONFIG = {
  SERVER_URL: 'https://youdown-xxx.up.railway.app', // Tu URL de Railway
};
```

### 3. Instalar extensión en Chrome

1. Abre `chrome://extensions/`
2. Activa **Modo de desarrollador**
3. **Cargar extensión sin empaquetar**
4. Selecciona esta carpeta

### 4. ¡Usar!

1. Ve a un mix/playlist de YouTube
2. Haz clic en la extensión **YouDown**
3. **Extraer URLs** → **Descargar MP3**

---

## Opción B: Usar servidor local (Para desarrollo)

### 1. Instalar dependencias localmente

```bash
npm install
```

### 2. Instalar yt-dlp

```bash
# Arch Linux
sudo pacman -S yt-dlp

# Ubuntu/Debian
sudo apt install yt-dlp

# Con pip (cualquier OS)
pip install yt-dlp
```

### 3. Configurar config.js

```javascript
const CONFIG = {
  SERVER_URL: 'http://localhost:3000',
};
```

### 4. Inicia el servidor

```bash
npm start
# O
./start-server.sh
```

### 5. Instalar extensión en Chrome

(igual que arriba)

## Archivos de la Extensión

- `manifest.json` - Configuración de la extensión de Chrome
- `config.js` - **EDITAR ESTO:** URL del servidor (local o Railway)
- `popup.html` - Interfaz del popup
- `popup.css` - Estilos del popup
- `popup.js` - Lógica del popup
- `content.js` - Script que se ejecuta en YouTube
- `server.js` - Servidor Node.js que ejecuta yt-dlp
- `package.json` - Dependencias de Node.js
- `Dockerfile` - Para desplegar en Railway
- `start-server.sh` - Script para iniciar el servidor localmente

## Notas Técnicas

- **URL configurable**: Edita `config.js` para cambiar entre Railway/localhost
- **Servidor Railway**: Automáticamente asigna el puerto con `process.env.PORT`
- **Comando**: `yt-dlp -a <file> -x --audio-format mp3 --audio-quality 0`
- **Descargas**: Se guardan en `/tmp/youdown_downloads` (Railway) o `~/Downloads/youdown_downloads` (local)
- **CORS**: Habilitado para cualquier origen
- **Timeout**: Configurado para descargas lentas

## Troubleshooting

### Error: "Error al conectar con el servidor"

**Si usas Railway:**
- Verifica que tu URL en `config.js` sea correcta
- Chequea los logs en el dashboard de Railway
- Espera unos segundos, puede estar iniciando

**Si usas servidor local:**
- Verifica que el servidor esté corriendo: `npm start`
- Asegúrate de que el puerto 3000 no esté en uso: `lsof -i :3000`

### Error: "yt-dlp: command not found"

**En Railway:** 
- Asegúrate de que el `Dockerfile` está en tu repo y que Railway lo use

**En local:**
- Instala yt-dlp: `pip install yt-dlp` o `sudo pacman -S yt-dlp`
- Verifica: `which yt-dlp`

### No se encuentran videos
- Verifica que haya videos cargados en la página
- Intenta refrescar YouTube y vuelve a intentar
- Algunos selectores pueden cambiar según YouTube

### CORS Error
Si ves error de CORS en la consola, probablemente:
- Tu URL en `config.js` es incorrecta
- Verifica que no haya `/` final: `https://example.com` (no `https://example.com/`)

## Tutorial Rails

Ver [RAILWAY-SETUP.md](RAILWAY-SETUP.md) para una guía paso a paso sobre cómo desplegar en Railway.

## Desarrollo

Para modificar la extensión:
1. Realiza cambios en los archivos
2. Ve a `chrome://extensions/`
3. Haz clic en el botón de "Recargar" de la extensión

## API del Servidor

### POST /download
Descarga videos como MP3

```bash
curl -X POST http://localhost:3000/download \
  -H "Content-Type: application/json" \
  -d '{"urls":"https://www.youtube.com/watch?v=xxx\nhttps://www.youtube.com/watch?v=yyy"}'
```

### GET /status
Verifica que el servidor esté activo

```bash
curl http://localhost:3000/status
```

### GET /downloads
Lista los MP3s descargados

```bash
curl http://localhost:3000/downloads
```

