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

  let currentUrls = '';
  
  // URL del servidor (desde config.js)
  const SERVER_URL = (typeof CONFIG !== 'undefined') ? CONFIG.SERVER_URL : 'http://localhost:3000';

  extractBtn.addEventListener('click', async function() {
    extractBtn.disabled = true;
    statusEl.textContent = '⏳ Extrayendo URLs...';
    statusEl.className = '';

    try {
      // Obtener la pestaña activa
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tabs || tabs.length === 0) {
        throw new Error('No se encontró pestaña activa');
      }

      const tab = tabs[0];

      // Verificar que estamos en YouTube
      if (!tab.url.includes('youtube.com')) {
        statusEl.textContent = '❌ Esta extensión solo funciona en YouTube';
        statusEl.className = 'error';
        extractBtn.disabled = false;
        return;
      }

      // Enviar mensaje al content script
      chrome.tabs.sendMessage(tab.id, { action: "extractUrls" }, function(response) {
        if (chrome.runtime.lastError) {
          console.error('Error:', chrome.runtime.lastError);
          statusEl.textContent = '❌ Error: ' + chrome.runtime.lastError.message;
          statusEl.className = 'error';
          extractBtn.disabled = false;
          return;
        }

        if (response && response.success) {
          // Mostrar las URLs
          currentUrls = response.urls;
          urlsTextarea.value = response.urls;
          urlListEl.style.display = 'block';
          statusEl.textContent = `✅ Se encontraron ${response.count} URLs`;
          statusEl.className = 'success';
        } else {
          statusEl.textContent = '❌ No se encontraron videos en esta página';
          statusEl.className = 'error';
          urlListEl.style.display = 'none';
        }

        extractBtn.disabled = false;
      });
    } catch (error) {
      console.error('Error:', error);
      statusEl.textContent = '❌ Error: ' + error.message;
      statusEl.className = 'error';
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
      downloadStatusEl.textContent = '❌ No hay URLs para descargar';
      downloadStatusEl.className = 'error';
      return;
    }

    downloadMp3Btn.disabled = true;
    downloadStatusEl.textContent = '⏳ Conectando al servidor...';
    downloadStatusEl.className = '';

    try {
      // Verificar que el servidor esté activo
      const statusResponse = await fetch(`${SERVER_URL}/status`);
      if (!statusResponse.ok) {
        throw new Error('Servidor no disponible');
      }

      // Enviar URLs al servidor
      downloadStatusEl.textContent = '⏳ Descargando videos como MP3...';
      
      const response = await fetch(`${SERVER_URL}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ urls: currentUrls })
      });

      const data = await response.json();

      if (data.success) {
        downloadStatusEl.textContent = `✅ ¡Descarga completada! ${data.downloadDir}`;
        downloadStatusEl.className = 'success';
      } else {
        downloadStatusEl.textContent = `❌ Error: ${data.error}`;
        downloadStatusEl.className = 'error';
      }
    } catch (error) {
      console.error('Error:', error);
      downloadStatusEl.textContent = `❌ Error al conectar con el servidor. ¿Está ejecutando: npm start?`;
      downloadStatusEl.className = 'error';
    } finally {
      downloadMp3Btn.disabled = false;
    }
  });
});
