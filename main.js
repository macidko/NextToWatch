const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');

// Veri deposu oluştur
const store = new Store({
  name: 'nexttowatch-data', // Depo adı
  fileExtension: 'json', // Dosya uzantısı
  clearInvalidConfig: true, // Geçersiz yapılandırmayı temizle
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

function createWindow() {
  try {
    // Ana pencereyi oluştur
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      backgroundColor: '#1E1E2E', // plan.txt'de belirtilen Gece Siyahı renk
      webPreferences: {
        nodeIntegration: false, // Node.js entegrasyonu kapalı (güvenlik için)
        contextIsolation: true, // İçerik izolasyonu açık (güvenlik için)
        preload: path.join(__dirname, 'preload.js'), // Preload script
        sandbox: false // Sandbox'ı devre dışı bırak
      }
    });

    // index.html dosyasını yükle
    mainWindow.loadFile('index.html');

    // Geliştirici araçları (Dev modunda aç)
    mainWindow.webContents.openDevTools();

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
  }
}

// Uygulama verilerini başlat
function initializeAppData() {
  // Ayarları kontrol et ve varsayılanları kaydet
  const settings = store.get('settings');
  if (!settings) {
    store.set('settings', defaultSettings);
  }
  
  // İzleme listesi için veri yapılarını kontrol et
  if (!store.has('watchlist')) {
    store.set('watchlist', {
      anime: [],
      movie: [],
      series: []
    });
  }
  
  // İzleme günlüğü için veri yapısını kontrol et
  if (!store.has('watchHistory')) {
    store.set('watchHistory', []);
  }
  
  // Uygulama veri dizinini kontrol et ve oluştur
  const userDataPath = app.getPath('userData');
  const dataDirPath = path.join(userDataPath, 'data');
  
  if (!fs.existsSync(dataDirPath)) {
    fs.mkdirSync(dataDirPath, { recursive: true });
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
      
      // Proje kök dizini yerine app.getPath('userData') kullanmak yerine,
      // doğrudan proje kök dizinindeki data klasörüne yazalım
      const dataDirPath = path.join(__dirname, 'data');
      console.log('Veri dizini yolu:', dataDirPath);
      
      const watchlistPath = path.join(dataDirPath, 'watchlist.json');
      console.log('İzleme listesi dosya yolu:', watchlistPath);
      
      if (!fs.existsSync(dataDirPath)) {
        console.log('Veri dizini bulunamadı, oluşturuluyor:', dataDirPath);
        fs.mkdirSync(dataDirPath, { recursive: true });
        console.log('Veri dizini oluşturuldu');
      }
      
      // JSON dosyasını oku
      let watchlist = { anime: [], movie: [], series: [] };
      if (fs.existsSync(watchlistPath)) {
        try {
          console.log('Mevcut izleme listesi dosyası okunuyor');
          const fileContent = fs.readFileSync(watchlistPath, 'utf8');
          watchlist = JSON.parse(fileContent);
          console.log('Mevcut izleme listesi yüklendi');
        } catch (error) {
          console.error('JSON dosyası okunamadı, yeni dosya oluşturulacak:', error);
        }
      } else {
        console.log('İzleme listesi dosyası bulunamadı, yeni dosya oluşturulacak');
      }
      
      // İzleme listesinde, belirtilen türdeki listede olup olmadığını kontrol et
      if (!watchlist[contentType]) {
        console.log(`"${contentType}" türü için liste bulunamadı, oluşturuluyor`);
        watchlist[contentType] = [];
      }
      
      // Bu ID'ye sahip içerik zaten var mı kontrol et
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
      
      // Listeyi JSON dosyasına yaz
      try {
        const jsonData = JSON.stringify(watchlist, null, 2);
        console.log('İzleme listesi JSON verisi oluşturuldu, dosyaya yazılıyor');
        fs.writeFileSync(watchlistPath, jsonData, 'utf8');
        console.log('İzleme listesi JSON dosyasına yazıldı:', watchlistPath);
        
        // Klasör ve dosya izinlerini kontrol et
        const dirStats = fs.statSync(dataDirPath);
        console.log('Veri dizini izinleri:', dirStats.mode.toString(8));
        
        if (fs.existsSync(watchlistPath)) {
          const fileStats = fs.statSync(watchlistPath);
          console.log('JSON dosya izinleri:', fileStats.mode.toString(8));
          console.log('JSON dosya boyutu:', fileStats.size, 'bayt');
        } else {
          console.error('JSON dosyası oluşturuldu ama hala bulunamıyor!');
        }
      } catch (writeError) {
        console.error('JSON dosyası yazılırken hata oluştu:', writeError);
      }
      
      // Ayrıca store'a da ekleyelim (mevcut özelliklerle uyumluluk için)
      store.set('watchlist', watchlist);
      console.log('İzleme listesi electron-store\'a kaydedildi');
      
      return true;
    } catch (error) {
      console.error('İzleme listesine ekleme hatası:', error);
      return false;
    }
  });
  
  // İzleme listesinden içerik kaldır
  ipcMain.handle('remove-from-watchlist', (event, contentId, type) => {
    try {
      const watchlist = store.get('watchlist');
      
      // İçerik türünü belirle
      let contentType = type || 'movie';
      if (contentType === 'series' || contentType === 'show') contentType = 'series';
      if (contentType === 'anime') contentType = 'anime';
      
      // ID'ye göre içeriği filtrele (kaldır)
      watchlist[contentType] = watchlist[contentType].filter(item => item.id !== contentId);
      
      // Güncellenmiş listeyi kaydet
      store.set('watchlist', watchlist);
      
      // Proje kök dizinindeki JSON dosyasına da yaz
      const dataDirPath = path.join(__dirname, 'data');
      const watchlistPath = path.join(dataDirPath, 'watchlist.json');
      
      if (fs.existsSync(dataDirPath)) {
        fs.writeFileSync(watchlistPath, JSON.stringify(watchlist, null, 2), 'utf8');
        console.log('İzleme listesi JSON dosyasına yazıldı:', watchlistPath);
      }
      
      return true;
    } catch (error) {
      console.error('İzleme listesinden kaldırma hatası:', error);
      return false;
    }
  });
  
  // İzleme listesini getir
  ipcMain.handle('get-watchlist', () => {
    // Önce proje kök dizinindeki JSON dosyasından okumayı dene
    const dataDirPath = path.join(__dirname, 'data');
    const watchlistPath = path.join(dataDirPath, 'watchlist.json');
    
    if (fs.existsSync(watchlistPath)) {
      try {
        const fileContent = fs.readFileSync(watchlistPath, 'utf8');
        const watchlist = JSON.parse(fileContent);
        return watchlist || { anime: [], movie: [], series: [] };
      } catch (error) {
        console.error('JSON dosyası okunamadı:', error);
      }
    }
    
    // Eğer proje dizininde yoksa veya okuma hatası olduysa, store'dan al
    return store.get('watchlist') || { anime: [], movie: [], series: [] };
  });
  
  // İçerik durumunu güncelle
  ipcMain.handle('update-content-status', (event, contentId, type, status) => {
    try {
      const watchlist = store.get('watchlist');
      
      // İçerik türünü belirle
      let contentType = type || 'movie';
      if (contentType === 'series' || contentType === 'show') contentType = 'series';
      if (contentType === 'anime') contentType = 'anime';
      
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
        
        // Proje kök dizinindeki JSON dosyasına da yaz
        const dataDirPath = path.join(__dirname, 'data');
        const watchlistPath = path.join(dataDirPath, 'watchlist.json');
        
        if (fs.existsSync(dataDirPath)) {
          fs.writeFileSync(watchlistPath, JSON.stringify(watchlist, null, 2), 'utf8');
          console.log('İzleme listesi JSON dosyasına yazıldı:', watchlistPath);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('İçerik durumu güncelleme hatası:', error);
      return false;
    }
  });
  
  // Bildirim olayı
  ipcMain.on('notify', (event, message) => {
    // Burada bildirim gösterme işlemi yapılabilir
    console.log('Bildirim:', message);
  });
}

// Preload dosyasını ayarla ve electron-rebuild ile tekrar derlenmesini sağla
app.whenReady().then(() => {
  // API Servislerini hazırla
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
  } catch (error) {
    console.error('Uygulama başlatılırken hata:', error);
  }
});

// Uygulama kapatıldığında
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
}); 