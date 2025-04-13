const { contextBridge, ipcRenderer } = require('electron');
// Doğrudan göreceli yolu kullanarak modülü yükle
console.log('preload.js: API Service modülü yükleniyor...');
try {
  const apiService = require('./src/js/api/apiService.js');
  console.log('preload.js: API Service modülü başarıyla yüklendi');
  console.log('preload.js: API Metodları:', Object.keys(apiService));

  // Ana süreç ile iletişim kurmak için güvenli köprü
  contextBridge.exposeInMainWorld('ipcRenderer', {
    // IPC iletişimi için güvenli yöntemler
    invoke: (channel, ...args) => {
      const validChannels = [
        'initialize', 
        'get-settings', 
        'save-settings',
        'get-watchlist',
        'add-to-watchlist',
        'remove-from-watchlist',
        'update-content-status',
        // Eski kanal isimleri (geriye uyumluluk için)
        'get-app-version'
      ];
      
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args);
      }
      
      return Promise.reject(new Error(`İzin verilmeyen kanal: ${channel}`));
    },
    on: (channel, listener) => {
      const validChannels = [
        'settings-updated',
        'watchlist-updated',
        'notification'
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
        'settings-updated',
        'watchlist-updated',
        'notification'
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
    searchContent: async (query, type) => {
      try {
        console.log('preload.js: searchContent çağrıldı', { query, type });
        const result = await apiService.searchContent(query, type);
        console.log('preload.js: searchContent sonuç', result);
        return result;
      } catch (error) {
        console.error('preload.js: searchContent hatası', error);
        throw error;
      }
    },
    
    // Özel arama fonksiyonları
    searchAnime: async (query) => {
      try {
        console.log('preload.js: searchAnime çağrıldı', { query });
        const result = await apiService.searchAnime(query);
        console.log('preload.js: searchAnime sonuç', result);
        return result;
      } catch (error) {
        console.error('preload.js: searchAnime hatası', error);
        throw error;
      }
    },
    
    searchOmdb: async (query, type) => {
      try {
        console.log('preload.js: searchOmdb çağrıldı', { query, type });
        const result = await apiService.searchOmdb(query, type);
        console.log('preload.js: searchOmdb sonuç', result);
        return result;
      } catch (error) {
        console.error('preload.js: searchOmdb hatası', error);
        throw error;
      }
    },
    
    // İçerik detayları
    getContentDetails: async (id, type) => {
      try {
        console.log('preload.js: getContentDetails çağrıldı', { id, type });
        const result = await apiService.getContentDetails(id, type);
        return result;
      } catch (error) {
        console.error('preload.js: getContentDetails hatası', error);
        throw error;
      }
    },
    
    // Popüler içerikler
    getPopularContent: async (type, limit) => {
      try {
        console.log('preload.js: getPopularContent çağrıldı', { type, limit });
        const result = await apiService.getPopularContent(type, limit);
        return result;
      } catch (error) {
        console.error('preload.js: getPopularContent hatası', error);
        throw error;
      }
    },
    
    // İzleme listesi işlemleri
    addToWatchlist: async (id, type, status) => {
      try {
        console.log('preload.js: addToWatchlist çağrıldı', { id, type, status });
        const result = await apiService.addToWatchlist(id, type, status);
        return result;
      } catch (error) {
        console.error('preload.js: addToWatchlist hatası', error);
        throw error;
      }
    }
  });
  
  console.log('preload.js: API servisi başarıyla tanımlandı');
} catch (error) {
  console.error('preload.js: API Service modülü yüklenirken hata oluştu:', error);
} 