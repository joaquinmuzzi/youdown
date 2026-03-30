// Popup logic
// Nota: config.js debe estar en popup.html como <script src="config.js"></script>

document.addEventListener('DOMContentLoaded', function() {
  const extractBtn = document.getElementById('extractBtn');
  const copyBtn = document.getElementById('copyBtn');
  const downloadMp3Btn = document.getElementById('downloadMp3Btn');
  const statusEl = document.getElementById('status');
  const downloadStatusEl = document.getElementById('downloadStatus');
  const urlListEl = document.getElementById('urlList');
  const urlsTextarea = document.getElementById('urls');
  const progressCardEl = document.getElementById('progressCard');
  const progressTextEl = document.getElementById('progressText');
  const progressMetaEl = document.getElementById('progressMeta');
  const progressCurrentFileEl = document.getElementById('progressCurrentFile');
  const progressBarEl = document.getElementById('progressBar');

  let currentUrls = localStorage.getItem('youdown.urls') || '';
  let progressInterval = null;

  const SERVER_URL = (typeof CONFIG !== 'undefined') ? CONFIG.SERVER_URL : 'http://localhost:3000';

  if (currentUrls) {
    urlsTextarea.value = currentUrls;
    urlListEl.style.display = 'block';
  }

  function setStatus(element, text, type) {
    element.textContent = text;
    element.className = `info${type ? ` ${type}` : ''}`;
  }

  function setDownloadingState(isDownloading) {
    downloadMp3Btn.disabled = isDownloading;
    downloadMp3Btn.textContent = isDownloading ? '⏳ Descargando...' : '🎵 Descargar MP3';
    progressCardEl.style.display = isDownloading ? 'block' : 'none';
  }

  function renderJob(job) {
    if (!job || job.status === 'idle') {
      setDownloadingState(false);
      progressBarEl.style.width = '0%';
      return;
    }

    const percent = typeof job.progressPercent === 'number' ? job.progressPercent : 0;
    progressBarEl.style.width = `${Math.max(0, Math.min(100, percent))}%`;
    progressTextEl.textContent = job.status === 'completed'
      ? '✅ Descarga completada'
      : job.status === 'error'
        ? '❌ Error en la descarga'
        : '⏳ Descargando archivos...';
    progressMetaEl.textContent = `Progreso actual: ${percent.toFixed(1)}% · ${job.completedCount || 0}/${job.totalUrls || 0} completados`;
    progressCurrentFileEl.textContent = job.currentFile || job.lastLine || 'Esperando actividad...';

    if (job.status === 'running') {
      setDownloadingState(true);
      localStorage.setItem('youdown.downloading', 'true');
      setStatus(downloadStatusEl, 'Descarga en progreso en el servidor...', 'success');
      return;
    }

    setDownloadingState(false);
    localStorage.removeItem('youdown.downloading');

    if (job.status === 'completed') {
      setStatus(downloadStatusEl, `✅ Descarga completada en ${job.downloadDir}`, 'success');
    } else if (job.status === 'error') {
      setStatus(downloadStatusEl, `❌ ${job.error || 'La descarga falló'}`, 'error');
    }
  }

  function stopProgressPolling() {
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
  }

  async function refreshProgress() {
    try {
      const response = await fetch(`${SERVER_URL}/progress`);
      if (!response.ok) {
        throw new Error('No se pudo consultar el progreso');
      }

      const data = await response.json();
      renderJob(data.job);

      if (!data.job || data.job.status !== 'running') {
        stopProgressPolling();
      }
    } catch (error) {
      stopProgressPolling();
      setDownloadingState(false);
      if (localStorage.getItem('youdown.downloading') === 'true') {
        setStatus(downloadStatusEl, '❌ No se pudo consultar el progreso del servidor', 'error');
      }
    }
  }

  function startProgressPolling() {
    stopProgressPolling();
    refreshProgress();
    progressInterval = setInterval(refreshProgress, 2000);
  }

  function sendExtractMessage(tabId) {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, { action: 'extractUrls' }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    });
  }

  extractBtn.addEventListener('click', async function() {
    extractBtn.disabled = true;
    setStatus(statusEl, '⏳ Extrayendo URLs...', '');

    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs || tabs.length === 0) {
        throw new Error('No se encontró pestaña activa');
      }

      const tab = tabs[0];
      if (!tab.url.includes('youtube.com')) {
        setStatus(statusEl, '❌ Esta extensión solo funciona en YouTube', 'error');
        extractBtn.disabled = false;
        return;
      }

      let response;
      try {
        response = await sendExtractMessage(tab.id);
      } catch (initialError) {
        if (initialError.message.includes('Receiving end does not exist')) {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
          response = await sendExtractMessage(tab.id);
        } else {
          throw initialError;
        }
      }

      if (response && response.success) {
        currentUrls = response.urls;
        localStorage.setItem('youdown.urls', currentUrls);
        urlsTextarea.value = response.urls;
        urlListEl.style.display = 'block';
        setStatus(statusEl, `✅ Se encontraron ${response.count} URLs`, 'success');
      } else {
        urlListEl.style.display = 'none';
        setStatus(statusEl, '❌ No se encontraron videos en esta página', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      setStatus(statusEl, `❌ Error: ${error.message}`, 'error');
    } finally {
      extractBtn.disabled = false;
    }
  });

  copyBtn.addEventListener('click', function() {
    urlsTextarea.select();
    document.execCommand('copy');

    const originalText = copyBtn.textContent;
    copyBtn.textContent = '✓ ¡Copiado!';
    setTimeout(() => {
      copyBtn.textContent = originalText;
    }, 2000);
  });

  downloadMp3Btn.addEventListener('click', async function() {
    if (!currentUrls) {
      setStatus(downloadStatusEl, '❌ No hay URLs para descargar', 'error');
      return;
    }

    setDownloadingState(true);
    setStatus(downloadStatusEl, '⏳ Enviando la descarga al servidor...', '');

    try {
      const statusResponse = await fetch(`${SERVER_URL}/status`);
      if (!statusResponse.ok) {
        throw new Error('Servidor no disponible');
      }

      const response = await fetch(`${SERVER_URL}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ urls: currentUrls })
      });

      const data = await response.json();

      if (response.status === 409 && data.job) {
        setStatus(downloadStatusEl, '⏳ Ya hay una descarga activa, mostrando progreso...', 'success');
        localStorage.setItem('youdown.downloading', 'true');
        renderJob(data.job);
        startProgressPolling();
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'No se pudo iniciar la descarga');
      }

      localStorage.setItem('youdown.downloading', 'true');
      renderJob(data.job);
      startProgressPolling();
    } catch (error) {
      console.error('Error:', error);
      localStorage.removeItem('youdown.downloading');
      setDownloadingState(false);
      setStatus(downloadStatusEl, `❌ ${error.message}`, 'error');
    }
  });

  refreshProgress();
  if (localStorage.getItem('youdown.downloading') === 'true') {
    startProgressPolling();
  }

  window.addEventListener('beforeunload', stopProgressPolling);
});
