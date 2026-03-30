// Configuración de la extensión YouDown
// Cambia SERVER_URL por tu URL de Railway

const CONFIG = {
  // URL local para desarrollar
  // SERVER_URL: 'http://localhost:3000',
  
  // URL de Railway (reemplaza con tu dominio)
  SERVER_URL: 'https://youdown-production.up.railway.app',
};

// Exportar para popup.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
