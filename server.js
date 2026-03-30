const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const DOWNLOAD_DIR = process.env.DOWNLOAD_DIR ||
  (process.env.NODE_ENV === 'production'
    ? '/tmp/youdown_downloads'
    : path.join(os.homedir(), 'Downloads', 'youdown_downloads'));

if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

let currentJob = null;

function countUrls(urls) {
  return urls
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean).length;
}

function splitLines(buffer, chunk) {
  const text = buffer + chunk.toString();
  const parts = text.split(/\r?\n/);
  return {
    lines: parts.slice(0, -1),
    remainder: parts[parts.length - 1]
  };
}

function cleanupListFile(listFile) {
  try {
    if (fs.existsSync(listFile)) {
      fs.unlinkSync(listFile);
    }
  } catch (error) {
    console.error('Error al limpiar archivo temporal:', error);
  }
}

function getPublicJob(job) {
  if (!job) {
    return {
      active: false,
      status: 'idle'
    };
  }

  return {
    active: job.status === 'running',
    id: job.id,
    status: job.status,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt || null,
    totalUrls: job.totalUrls,
    completedCount: job.completedCount,
    progressPercent: job.progressPercent,
    currentFile: job.currentFile,
    lastLine: job.lastLine,
    error: job.error || null,
    downloadDir: job.downloadDir,
    downloadedFiles: job.downloadedFiles.slice(-10)
  };
}

function updateJobFromLine(job, line) {
  if (!job) {
    return;
  }

  const trimmedLine = line.trim();
  if (!trimmedLine) {
    return;
  }

  job.lastLine = trimmedLine;
  console.log(trimmedLine);

  const progressMatch = trimmedLine.match(/\[download\]\s+([0-9.]+)%/);
  if (progressMatch) {
    job.progressPercent = Number(progressMatch[1]);
  }

  const currentFileMatch = trimmedLine.match(/(?:Destination|\[ExtractAudio\] Destination):\s+(.+)$/);
  if (currentFileMatch) {
    job.currentFile = currentFileMatch[1];
  }

  const extractMatch = trimmedLine.match(/\[ExtractAudio\] Destination:\s+(.+)$/);
  if (extractMatch) {
    const fileName = extractMatch[1];
    if (!job.downloadedFiles.includes(fileName)) {
      job.downloadedFiles.push(fileName);
      job.completedCount += 1;
    }
  }

  const alreadyMatch = trimmedLine.match(/\[download\]\s+(.+) has already been downloaded/);
  if (alreadyMatch) {
    const fileName = alreadyMatch[1];
    if (!job.downloadedFiles.includes(fileName)) {
      job.downloadedFiles.push(fileName);
      job.completedCount += 1;
    }
  }
}

app.post('/download', (req, res) => {
  const { urls } = req.body;

  if (!urls || urls.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'No URLs provided'
    });
  }

  if (currentJob && currentJob.status === 'running') {
    return res.status(409).json({
      success: false,
      busy: true,
      error: 'Ya hay una descarga en progreso',
      job: getPublicJob(currentJob)
    });
  }

  const listFile = path.join(DOWNLOAD_DIR, `list_${Date.now()}.txt`);
  fs.writeFileSync(listFile, urls);

  currentJob = {
    id: Date.now().toString(),
    status: 'running',
    startedAt: new Date().toISOString(),
    finishedAt: null,
    totalUrls: countUrls(urls),
    completedCount: 0,
    progressPercent: 0,
    currentFile: null,
    lastLine: 'Inicializando descarga...',
    error: null,
    downloadDir: DOWNLOAD_DIR,
    downloadedFiles: []
  };

  const args = [
    '-a', listFile,
    '-x',
    '--audio-format', 'mp3',
    '--audio-quality', '0',
    '--newline'
  ];

  console.log(`[${new Date().toISOString()}] Iniciando descarga...`);
  console.log(`Comando: yt-dlp ${args.join(' ')}`);

  const child = spawn('yt-dlp', args, {
    cwd: DOWNLOAD_DIR,
    env: process.env
  });

  let stdoutRemainder = '';
  let stderrRemainder = '';

  child.stdout.on('data', (chunk) => {
    const { lines, remainder } = splitLines(stdoutRemainder, chunk);
    stdoutRemainder = remainder;
    lines.forEach((line) => updateJobFromLine(currentJob, line));
  });

  child.stderr.on('data', (chunk) => {
    const { lines, remainder } = splitLines(stderrRemainder, chunk);
    stderrRemainder = remainder;
    lines.forEach((line) => updateJobFromLine(currentJob, line));
  });

  child.on('error', (error) => {
    cleanupListFile(listFile);
    if (currentJob) {
      currentJob.status = 'error';
      currentJob.finishedAt = new Date().toISOString();
      currentJob.error = error.message;
      currentJob.lastLine = error.message;
    }
    console.error('Error en ejecución:', error);
  });

  child.on('close', (code) => {
    if (stdoutRemainder) {
      updateJobFromLine(currentJob, stdoutRemainder);
      stdoutRemainder = '';
    }

    if (stderrRemainder) {
      updateJobFromLine(currentJob, stderrRemainder);
      stderrRemainder = '';
    }

    cleanupListFile(listFile);

    if (!currentJob) {
      return;
    }

    currentJob.finishedAt = new Date().toISOString();

    if (code === 0) {
      currentJob.status = 'completed';
      currentJob.progressPercent = 100;
      currentJob.lastLine = 'Descarga completada';
      console.log('Descarga completada');
      return;
    }

    currentJob.status = 'error';
    currentJob.error = `yt-dlp terminó con código ${code}`;
    currentJob.lastLine = currentJob.error;
    console.error(currentJob.error);
  });

  return res.json({
    success: true,
    started: true,
    job: getPublicJob(currentJob)
  });
});

app.get('/status', (req, res) => {
  res.json({
    success: true,
    status: 'Servidor activo',
    downloadDir: DOWNLOAD_DIR
  });
});

app.get('/progress', (req, res) => {
  res.json({
    success: true,
    job: getPublicJob(currentJob)
  });
});

app.get('/downloads', (req, res) => {
  try {
    const files = fs.readdirSync(DOWNLOAD_DIR);
    const mp3Files = files.filter((file) => file.endsWith('.mp3'));

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
