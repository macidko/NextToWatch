const { contextBridge, ipcRenderer } = require('electron');
// API servisi yükleniyor
console.log('preload.js: API Service modülü yükleniyor...');
try {
  // Modül yolunu daha güvenilir hale getirmek için path modülünü kullan
  const path = require('path');
  const apiServicePath = path.join(__dirname, 'src', 'js', 'api', 'apiService.js');
  console.log(`preload.js: API servisi yükleniyor: ${apiServicePath}`);
  
  const apiService = require(apiServicePath);
  console.log('preload.js: API Service modülü başarıyla yüklendi');
  
  if (apiService) {
    console.log('preload.js: API Metodları:', Object.keys(apiService));
  } else {
    console.error('preload.js: API Service modülü yüklendi ancak içeriği boş');
  }

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
        if (!apiService.searchContent) {
          console.error('preload.js: searchContent metodu bulunamadı');
          return { items: [] };
        }
        const result = await apiService.searchContent(query, type);
        console.log('preload.js: searchContent sonuç', result);
        return result;
      } catch (error) {
        console.error('preload.js: searchContent hatası', error);
        return { items: [], error: error.message };
      }
    },
    
    // Özel arama fonksiyonları
    searchAnime: async (query) => {
      try {
        console.log('preload.js: searchAnime çağrıldı', { query });
        if (!apiService.searchAnime) {
          console.error('preload.js: searchAnime metodu bulunamadı');
          return { items: [] };
        }
        const result = await apiService.searchAnime(query);
        console.log('preload.js: searchAnime sonuç', result);
        return result;
      } catch (error) {
        console.error('preload.js: searchAnime hatası', error);
        return { items: [], error: error.message };
      }
    },
    
    searchOmdb: async (query, type) => {
      try {
        console.log('preload.js: searchOmdb çağrıldı', { query, type });
        if (!apiService.searchOmdb) {
          console.error('preload.js: searchOmdb metodu bulunamadı');
          return { items: [] };
        }
        const result = await apiService.searchOmdb(query, type);
        console.log('preload.js: searchOmdb sonuç', result);
        return result;
      } catch (error) {
        console.error('preload.js: searchOmdb hatası', error);
        return { items: [], error: error.message };
      }
    },
    
    // İçerik detayları
    getContentDetails: async (id, type) => {
      try {
        console.log('preload.js: getContentDetails çağrıldı', { id, type });
        if (!apiService.getContentDetails) {
          console.error('preload.js: getContentDetails metodu bulunamadı');
          return null;
        }
        const result = await apiService.getContentDetails(id, type);
        return result;
      } catch (error) {
        console.error('preload.js: getContentDetails hatası', error);
        return { error: error.message };
      }
    },
    
    // Popüler içerikler
    getPopularContent: async (type, limit) => {
      try {
        console.log('preload.js: getPopularContent çağrıldı', { type, limit });
        if (!apiService.getPopularContent) {
          console.error('preload.js: getPopularContent metodu bulunamadı');
          return { items: [] };
        }
        const result = await apiService.getPopularContent(type, limit);
        return result;
      } catch (error) {
        console.error('preload.js: getPopularContent hatası', error);
        return { items: [], error: error.message };
      }
    },
    
    // İzleme listesi işlemleri
    addToWatchlist: async (id, type, status) => {
      try {
        console.log('preload.js: addToWatchlist çağrıldı', { id, type, status });
        if (!apiService.addToWatchlist) {
          console.error('preload.js: addToWatchlist metodu bulunamadı');
          return false;
        }
        const result = await apiService.addToWatchlist(id, type, status);
        return result;
      } catch (error) {
        console.error('preload.js: addToWatchlist hatası', error);
        return false;
      }
    }
  });
  
  console.log('preload.js: API servisi başarıyla tanımlandı');
} catch (error) {
  console.error('preload.js: API Service modülü yüklenirken hata oluştu:', error);
} 