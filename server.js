const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Directorio para descargas (usar /tmp en servidores, ~Downloads localmente)
const DOWNLOAD_DIR = process.env.DOWNLOAD_DIR || 
  (process.env.NODE_ENV === 'production' 
    ? '/tmp/youdown_downloads' 
    : path.join(os.homedir(), 'Downloads', 'youdown_downloads'));

// Crear directorio si no existe
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// Endpoint para descargar videos
app.post('/download', (req, res) => {
  const { urls } = req.body;

  if (!urls || urls.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'No URLs provided'
    });
  }
1
  // Crear archivo temporal con las URLs
  const listFile = path.join(DOWNLOAD_DIR, `list_${Date.now()}.txt`);
  
  fs.writeFileSync(listFile, urls);

  // Comando yt-dlp
  const command = `cd "${DOWNLOAD_DIR}" && yt-dlp -a "${listFile}" -x --audio-format mp3 --audio-quality 0`;

  console.log(`[${new Date().toISOString()}] Iniciando descarga...`);
  console.log(`Comando: ${command}`);

  exec(command, (error, stdout, stderr) => {
    // Limpiar archivo temporal
    try {
      fs.unlinkSync(listFile);
    } catch (e) {
      console.error('Error al limpiar archivo temporal:', e);
    }

    if (error) {
      console.error('Error en ejecución:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
        stderr: stderr
      });
    }

    console.log('Descarga completada');
    console.log('STDOUT:', stdout);

    res.json({
      success: true,
      message: 'Descarga completada',
      output: stdout,
      downloadDir: DOWNLOAD_DIR
    });
  });
});

// Endpoint para verificar estado
app.get('/status', (req, res) => {
  res.json({
    success: true,
    status: 'Servidor activo',
    downloadDir: DOWNLOAD_DIR
  });
});

// Endpoint para listar descargas
app.get('/downloads', (req, res) => {
  try {
    const files = fs.readdirSync(DOWNLOAD_DIR);
    const mp3Files = files.filter(f => f.endsWith('.mp3'));
    
    res.json({
      success: true,
      files: mp3Files,
      count: mp3Files.length,
      directory: DOWNLOAD_DIR
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🎵 Servidor YouDown escuchando en http://localhost:${PORT}`);
  console.log(`📁 Directorio de descargas: ${DOWNLOAD_DIR}`);
});
