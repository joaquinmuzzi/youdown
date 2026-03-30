// Content script que se ejecuta en YouTube para extraer URLs
function extractYoutubeUrls() {
  try {
    let urls = "";
    let count = 0;
    
    // Buscar todos los videos en la playlist/mix
    document.querySelectorAll("ytd-playlist-panel-video-renderer").forEach(function(element) {
      try {
        const endpoint = element.querySelector("#wc-endpoint");
        if (endpoint && endpoint.href) {
          // Extraer solo la URL base (sin parámetros adicionales)
          const url = endpoint.href.split("&")[0];
          urls += url + "\n";
          count++;
        }
      } catch (e) {
        console.error("Error procesando elemento:", e);
      }
    });
    
    return {
      urls: urls,
      count: count,
      success: count > 0
    };
  } catch (error) {
    console.error("Error extrayendo URLs:", error);
    return {
      urls: "",
      count: 0,
      success: false,
      error: error.message
    };
  }
}

// Escuchar mensajes desde el popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractUrls") {
    const result = extractYoutubeUrls();
    sendResponse(result);
  }
});
