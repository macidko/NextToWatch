const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const configModule = require('./src/js/config');

// Electron Store şeması ekleyelim
const storeSchema = {
  settings: {
    type: 'object',
    properties: {
      theme: { type: 'string', enum: ['dark', 'light'] },
      notifications: { type: 'boolean' },
      autoUpdate: { type: 'boolean' },
      language: { type: 'string', enum: ['tr', 'en'] }
    }
  },
  watchlist: {
    type: 'object',
    properties: {
      anime: { type: 'array', items: { type: 'object' } },
      movie: { type: 'array', items: { type: 'object' } },
      series: { type: 'array', items: { type: 'object' } }
    }
  },
  watchHistory: {
    type: 'array',
    items: { type: 'object' }
  }
};

// Veri deposu oluştur
const store = new Store({
  name: 'nexttowatch-data', // Depo adı
  fileExtension: 'json', // Dosya uzantısı
  clearInvalidConfig: true, // Geçersiz yapılandırmayı temizle
  schema: storeSchema // Şema ekle
});

// Varsayılan uygulama ayarları
const defaultSettings = {
  theme: 'dark',
  notifications: true,
  autoUpdate: true,
  language: 'tr'
};

// Dev modunda ise electron-reload paketini yükle
if (process.argv.includes('--dev')) {
  try {
    require('electron-reload')(__dirname, {
      electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
    });
  } catch (err) {
    console.log('Electron-reload yüklenemedi: ', err);
  }
}

// Uygulama versiyon bilgisi
const appVersion = require('./package.json').version || '1.0.0';

let mainWindow;

async function createWindow() {
  try {
    // İlk kurulum kontrolü
    const isConfigRequired = await configModule.checkConfiguration();
    
    if (isConfigRequired) {
      console.log('İlk kurulum yapılandırması tamamlandı');
    }
    
    // Ana pencereyi oluştur - bildirim tarzı görünüm için
    mainWindow = new BrowserWindow({
      width: 350,
      height: 600,
      minWidth: 300,
      minHeight: 400,
      backgroundColor: '#1E1E2E',
      frame: false, // Çerçeveyi kaldır (başlık çubuğu olmayacak)
      transparent: true, // Saydam arka plan
      resizable: true, // Boyutlandırılabilir
      alwaysOnTop: false, // Her zaman üstte olma özelliği
      skipTaskbar: false, // Görev çubuğunda gösterme seçeneği
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
        sandbox: false
      }
    });

    // Pencereyi ekranın sağ alt köşesine yerleştir
    const { width, height } = require('electron').screen.getPrimaryDisplay().workAreaSize;
    mainWindow.setPosition(width - 370, height - 620);

    // index.html dosyasını yükle
    mainWindow.loadFile('index.html');

    // Geliştirici araçları (Dev modunda aç)
    if (process.argv.includes('--dev')) {
      mainWindow.webContents.openDevTools({ mode: 'detach' }); // Ayrı pencerede aç
    }

    // Harici linkleri tarayıcıda aç
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });

    // Pencere kapatıldığında olayı
    mainWindow.on('closed', function () {
      mainWindow = null;
    });
    
    // İlk çalıştırmada yapılandırma kontrolü
    initializeAppData();
  } catch (error) {
    console.error('Pencere oluşturma hatası:', error);
    dialog.showErrorBox('Uygulama Hatası', `Pencere oluşturulurken bir hata oluştu: ${error.message}`);
  }
}

// Veri dosya yollarını belirle
function getDataPaths() {
  const userDataPath = app.getPath('userData');
  const dataDirPath = path.join(userDataPath, 'data');
  const watchlistPath = path.join(dataDirPath, 'watchlist.json');
  
  return {
    userDataPath,
    dataDirPath,
    watchlistPath
  };
}

// Veri dizinini oluştur
function ensureDataDirectory() {
  const { dataDirPath } = getDataPaths();
  
  if (!fs.existsSync(dataDirPath)) {
    try {
      fs.mkdirSync(dataDirPath, { recursive: true });
      console.log('Veri dizini oluşturuldu:', dataDirPath);
      return true;
    } catch (error) {
      console.error('Veri dizini oluşturulurken hata:', error.message);
      return false;
    }
  }
  
  return true;
}

// JSON dosyasını güvenli şekilde okur
function safeReadJsonFile(filePath, defaultValue = null) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`JSON dosyası okunamadı (${filePath}):`, error.message);
  }
  
  return defaultValue;
}

// JSON dosyasını güvenli şekilde yazar
function safeWriteJsonFile(filePath, data) {
  try {
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, jsonData, 'utf8');
    return true;
  } catch (error) {
    console.error(`JSON dosyası yazılamadı (${filePath}):`, error.message);
    return false;
  }
}

// Uygulama verilerini başlat
function initializeAppData() {
  try {
    // Ayarları kontrol et ve varsayılanları kaydet
    const settings = store.get('settings');
    if (!settings) {
      store.set('settings', defaultSettings);
      console.log('Varsayılan ayarlar kaydedildi');
    }
    
    // İzleme listesi için veri yapılarını kontrol et
    if (!store.has('watchlist')) {
      store.set('watchlist', {
        anime: [],
        movie: [],
        series: []
      });
      console.log('İzleme listesi şeması oluşturuldu');
    }
    
    // İzleme günlüğü için veri yapısını kontrol et
    if (!store.has('watchHistory')) {
      store.set('watchHistory', []);
      console.log('İzleme günlüğü şeması oluşturuldu');
    }
    
    // Veri dizinini oluştur
    ensureDataDirectory();
    
    // Veri dizinindeki dosyaları electron-store ile senkronize et
    syncDataFiles();
    
    console.log('Uygulama verileri başarıyla başlatıldı');
  } catch (error) {
    console.error('Uygulama verileri başlatılırken hata:', error.message);
  }
}

// Dosya sistemi ile electron-store arasında veri senkronizasyonunu yapar
function syncDataFiles() {
  try {
    const { watchlistPath } = getDataPaths();
    
    // electron-store verilerini dosya sistemindeki JSON dosyasıyla senkronize et
    const storeWatchlist = store.get('watchlist');
    
    // Dosya sistemindeki izleme listesini oku
    const fileWatchlist = safeReadJsonFile(watchlistPath, null);
    
    if (fileWatchlist) {
      // Dosya sistemindeki veri daha yeni veya farklı mı?
      const storeHasData = storeWatchlist && 
                            (storeWatchlist.anime.length > 0 || 
                             storeWatchlist.movie.length > 0 || 
                             storeWatchlist.series.length > 0);
      
      // Eğer dosya sisteminde veri varsa ve electron-store'da veri yoksa, dosyadan yükle
      if (!storeHasData) {
        console.log('Dosya sisteminden izleme listesi verileri alınıyor');
        store.set('watchlist', fileWatchlist);
      } 
      // Aksi halde electron-store verilerini dosya sistemine yaz
      else {
        console.log('Electron-store izleme listesi verileri dosya sistemine yazılıyor');
        safeWriteJsonFile(watchlistPath, storeWatchlist);
      }
    } 
    // Eğer dosya sisteminde veri yoksa, electron-store verilerini dosyaya yaz
    else if (storeWatchlist) {
      console.log('İzleme listesi dosyada bulunamadı, electron-store verisi yazılıyor');
      safeWriteJsonFile(watchlistPath, storeWatchlist);
    }
    
    return true;
  } catch (error) {
    console.error('Veri senkronizasyonu sırasında hata:', error.message);
    return false;
  }
}

// IPC İletişimi
function setupIpcHandlers() {
  // Uygulama versiyonunu döndür
  ipcMain.handle('get-app-version', () => {
    return appVersion;
  });
  
  // Uygulama ayarlarını döndür
  ipcMain.handle('get-settings', () => {
    return store.get('settings') || defaultSettings;
  });
  
  // Uygulama ayarlarını kaydet
  ipcMain.handle('save-settings', (event, settings) => {
    store.set('settings', settings);
    return true;
  });
  
  // İzleme listesine içerik ekle (JSON dosyasına yaz)
  ipcMain.handle('add-to-watchlist', (event, content) => {
    try {
      console.log('İzleme listesine içerik ekleniyor:', content);
      
      // İçerik türünü belirle
      let contentType = content.type || 'movie';
      if (contentType === 'series' || contentType === 'show') contentType = 'series';
      if (contentType === 'anime') contentType = 'anime';
      
      // Veri dizinini kontrol et
      ensureDataDirectory();
      
      // Önce electron-store'dan watchlist verilerini al
      let watchlist = store.get('watchlist') || { anime: [], movie: [], series: [] };
      
      // Listeyi güncelle
      const existingIndex = watchlist[contentType].findIndex(item => item.id === content.id);
      
      if (existingIndex >= 0) {
        // Varsa güncelle
        console.log(`"${content.title}" (ID: ${content.id}) zaten izleme listesinde, güncelleniyor`);
        watchlist[contentType][existingIndex] = {
          ...watchlist[contentType][existingIndex],
          ...content,
          updatedAt: new Date().toISOString()
        };
      } else {
        // Yoksa ekle
        console.log(`"${content.title}" (ID: ${content.id}) izleme listesine ekleniyor`);
        watchlist[contentType].push({
          ...content,
          addedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: content.status,
          progress: content.progress || 0,
          rating: content.rating || 0
        });
      }
      
      // Electron-store'a kaydet
      store.set('watchlist', watchlist);
      console.log('İzleme listesi electron-store\'a kaydedildi');
      
      // JSON dosyasına yaz
      const { watchlistPath } = getDataPaths();
      safeWriteJsonFile(watchlistPath, watchlist);
      console.log('İzleme listesi JSON dosyasına yazıldı:', watchlistPath);
      
      return true;
    } catch (error) {
      console.error('İzleme listesine ekleme hatası:', error.message);
      return false;
    }
  });
  
  // İzleme listesinden içerik kaldır
  ipcMain.handle('remove-from-watchlist', (event, contentId, type) => {
    try {
      // İçerik türünü belirle
      let contentType = type || 'movie';
      if (contentType === 'series' || contentType === 'show') contentType = 'series';
      if (contentType === 'anime') contentType = 'anime';
      
      // Electron-store'dan verileri al
      const watchlist = store.get('watchlist');
      
      // ID'ye göre içeriği filtrele (kaldır)
      watchlist[contentType] = watchlist[contentType].filter(item => item.id !== contentId);
      
      // Güncellenmiş listeyi kaydet
      store.set('watchlist', watchlist);
      console.log(`"${contentId}" ID'li ${contentType} içeriği izleme listesinden kaldırıldı`);
      
      // JSON dosyasına yaz
      const { watchlistPath } = getDataPaths();
      safeWriteJsonFile(watchlistPath, watchlist);
      
      return true;
    } catch (error) {
      console.error('İzleme listesinden kaldırma hatası:', error.message);
      return false;
    }
  });
  
  // İzleme listesini getir
  ipcMain.handle('get-watchlist', () => {
    try {
      // Önce dosya sistemi ile senkronize et
      syncDataFiles();
      
      // Electron-store'dan izleme listesini al
      const watchlist = store.get('watchlist') || { anime: [], movie: [], series: [] };
      return watchlist;
    } catch (error) {
      console.error('İzleme listesi alma hatası:', error.message);
      return { anime: [], movie: [], series: [] };
    }
  });
  
  // İçerik durumunu güncelle
  ipcMain.handle('update-content-status', (event, contentId, type, status) => {
    try {
      // İçerik türünü belirle
      let contentType = type || 'movie';
      if (contentType === 'series' || contentType === 'show') contentType = 'series';
      if (contentType === 'anime') contentType = 'anime';
      
      // Electron-store'dan verileri al
      const watchlist = store.get('watchlist');
      
      // İçeriği bul
      const contentIndex = watchlist[contentType].findIndex(item => item.id === contentId);
      
      if (contentIndex >= 0) {
        // İçerik bulundu, durumu güncelle
        watchlist[contentType][contentIndex].status = status;
        watchlist[contentType][contentIndex].updatedAt = new Date().toISOString();
        
        // Durum "izlendi" ise, izleme tarihini kaydet
        if (status === 'watched') {
          watchlist[contentType][contentIndex].watchedAt = new Date().toISOString();
          
          // İzleme geçmişine ekle
          const watchHistory = store.get('watchHistory') || [];
          watchHistory.push({
            id: contentId,
            type: contentType,
            title: watchlist[contentType][contentIndex].title,
            watchedAt: new Date().toISOString()
          });
          
          store.set('watchHistory', watchHistory);
        }
        
        // Güncellenmiş listeyi kaydet
        store.set('watchlist', watchlist);
        console.log(`"${contentId}" ID'li ${contentType} içeriğinin durumu "${status}" olarak güncellendi`);
        
        // JSON dosyasına yaz
        const { watchlistPath } = getDataPaths();
        safeWriteJsonFile(watchlistPath, watchlist);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('İçerik durumu güncelleme hatası:', error.message);
      return false;
    }
  });
  
  // İçerik ilerleme durumunu güncelle - yeni eklenen özellik
  ipcMain.handle('update-content-progress', (event, contentId, type, progress, totalEpisodes) => {
    try {
      // İçerik türünü belirle
      let contentType = type || 'movie';
      if (contentType === 'series' || contentType === 'show') contentType = 'series';
      if (contentType === 'anime') contentType = 'anime';
      
      // Electron-store'dan verileri al
      const watchlist = store.get('watchlist');
      
      // İçeriği bul
      const contentIndex = watchlist[contentType].findIndex(item => item.id === contentId);
      
      if (contentIndex >= 0) {
        // İçerik bulundu, ilerleme durumunu güncelle
        const item = watchlist[contentType][contentIndex];
        
        item.progress = progress || 0;
        item.totalEpisodes = totalEpisodes || 0;
        item.updatedAt = new Date().toISOString();
        
        // Eğer ilerleme tamamlandıysa, otomatik olarak durumu "izlendi" olarak işaretle
        if (progress > 0 && totalEpisodes > 0 && progress >= totalEpisodes) {
          item.status = 'watched';
          item.watchedAt = new Date().toISOString();
          
          // İzleme geçmişine ekle
          const watchHistory = store.get('watchHistory') || [];
          watchHistory.push({
            id: contentId,
            type: contentType,
            title: item.title,
            watchedAt: new Date().toISOString()
          });
          
          store.set('watchHistory', watchHistory);
        } 
        // İzlemeye başlandıysa ama tamamlanmadıysa durumu "izleniyor" olarak işaretle
        else if (progress > 0) {
          item.status = 'watching';
        }
        
        // Güncellenmiş listeyi kaydet
        store.set('watchlist', watchlist);
        console.log(`"${contentId}" ID'li ${contentType} içeriğinin ilerleme durumu güncellendi: ${progress}/${totalEpisodes}`);
        
        // JSON dosyasına yaz
        const { watchlistPath } = getDataPaths();
        safeWriteJsonFile(watchlistPath, watchlist);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('İçerik ilerleme güncelleme hatası:', error.message);
      return false;
    }
  });
  
  // Bildirim olayı
  ipcMain.on('notify', (event, message) => {
    // Burada bildirim gösterme işlemi yapılabilir
    console.log('Bildirim:', message);
  });
  
  // Pencere minimize olayı
  ipcMain.on('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });
  
  // Pencere kapatıldığında
  ipcMain.on('window-close', () => {
    if (mainWindow) mainWindow.close();
  });
  
  // Yapılandırma verilerini kaydet
  ipcMain.handle('save-config', async (event, config) => {
    try {
      // Yapılandırma verilerini kaydet
      configModule.configStore.set('apiKeys', config.apiKeys || {});
      
      if (config.backup && config.backup.github) {
        configModule.configStore.set('backup.github', config.backup.github);
      }
      
      // .env dosyasını oluştur
      configModule.createEnvFile(config.apiKeys || {});
      
      return true;
    } catch (error) {
      console.error('Yapılandırma kaydedilirken hata:', error);
      return false;
    }
  });
  
  console.log('IPC olay işleyicileri kuruldu');
}

// Preload dosyasını ayarla ve electron-rebuild ile tekrar derlenmesini sağla
app.whenReady().then(() => {
  // Uygulama başlat
  try {
    // Uygulama verilerini başlat
    initializeAppData();
    
    // Ana pencereyi oluştur
    createWindow();
    
    // IPC olaylarını ayarla
    setupIpcHandlers();
    
    // Electron'un macOS davranışı için
    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
    
    console.log('Uygulama başarıyla başlatıldı');
  } catch (error) {
    console.error('Uygulama başlatılırken hata:', error.message);
    dialog.showErrorBox('Uygulama Hatası', `Uygulama başlatılırken bir hata oluştu: ${error.message}`);
  }
});

// Uygulama kapatıldığında
app.on('window-all-closed', function () {
  // Son bir kez veri senkronizasyonu yap
  syncDataFiles();
  
  if (process.platform !== 'darwin') app.quit();
}); 