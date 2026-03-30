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
    
    if (count === 0) {
      // Si no encuentra videos con ese selector, buscar alternativas
      console.log("No se encontraron videos con selector directo, buscando alternativas...");
      
      // Alternativa 1: ytd-video-renderer
      document.querySelectorAll("ytd-video-renderer").forEach(function(element) {
        try {
          const link = element.querySelector("a#thumbnail");
          if (link && link.href) {
            urls += link.href + "\n";
            count++;
          }
        } catch (e) {}
      });
      
      // Alternativa 2: a.yt-simple-endpoint con href que contenga watch
      if (count === 0) {
        document.querySelectorAll("a.yt-simple-endpoint[href*='v=']").forEach(function(element) {
          if (element.href && element.href.includes("watch")) {
            urls += element.href.split("&")[0] + "\n";
            count++;
          }
        });
      }
    }
    
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
