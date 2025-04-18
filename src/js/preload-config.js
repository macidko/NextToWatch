const { contextBridge, ipcRenderer } = require('electron');

// API'yi tanımla
contextBridge.exposeInMainWorld('api', {
  // Yapılandırma verilerini ana sürece gönder
  sendConfig: (config) => {
    return ipcRenderer.invoke('save-config', config);
  }
});

// Pencere hazır olduğunda
window.addEventListener('DOMContentLoaded', () => {
  console.log('Yapılandırma penceresi hazır');
}); 