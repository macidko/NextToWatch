const { contextBridge, ipcRenderer } = require('electron');
const apiService = require('./api/apiService');

// Ana süreç ile iletişim kurmak için güvenli köprü
contextBridge.exposeInMainWorld('ipcRenderer', {
  // IPC iletişimi için güvenli yöntemler
  invoke: (channel, ...args) => {
    const validChannels = [
      'app:initialize', 
      'app:get-settings', 
      'app:save-settings',
      'app:get-watchlist',
      'app:add-to-watchlist',
      'app:remove-from-watchlist',
      'app:update-content-status'
    ];
    
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    
    return Promise.reject(new Error(`İzin verilmeyen kanal: ${channel}`));
  },
  on: (channel, listener) => {
    const validChannels = [
      'app:settings-updated',
      'app:watchlist-updated',
      'app:notification'
    ];
    
    if (validChannels.includes(channel)) {
      // Birden fazla dinleyici eklemeden önce eski dinleyiciyi kaldır
      ipcRenderer.removeAllListeners(channel);
      // Yeni dinleyici ekle
      ipcRenderer.on(channel, (event, ...args) => listener(...args));
      
      return true;
    }
    
    return false;
  },
  removeAllListeners: (channel) => {
    const validChannels = [
      'app:settings-updated',
      'app:watchlist-updated',
      'app:notification'
    ];
    
    if (validChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
      return true;
    }
    
    return false;
  }
});

// API servislerini dışa aktar
contextBridge.exposeInMainWorld('apiService', {
  // İçerik arama
  searchContent: (query, type) => apiService.searchContent(query, type),
  
  // Özel arama fonksiyonları
  searchAnime: (query) => apiService.searchAnime(query),
  searchOmdb: (query, type) => apiService.searchOmdb(query, type),
  
  // İçerik detayları
  getContentDetails: (id, type) => apiService.getContentDetails(id, type),
  
  // Popüler içerikler
  getPopularContent: (type, limit) => apiService.getPopularContent(type, limit),
  
  // İzleme listesi işlemleri
  addToWatchlist: (id, type, status) => apiService.addToWatchlist(id, type, status)
}); 