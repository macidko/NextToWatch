const { app, BrowserWindow } = require('electron');
const path = require('path');

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

let mainWindow;

function createWindow() {
  // Ana pencereyi oluştur
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#1E1E2E', // plan.txt'de belirtilen Gece Siyahı renk
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // index.html dosyasını yükle
  mainWindow.loadFile('index.html');

  // Geliştirici araçları (Dev modunda aç)
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // Pencere kapatıldığında olayı
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Electron app hazır olduğunda
app.whenReady().then(createWindow);

// Tüm pencereler kapatıldığında uygulamadan çık (Windows & Linux)
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Uygulama aktifleştirildiğinde pencere yoksa yeni oluştur (macOS)
app.on('activate', function () {
  if (mainWindow === null) createWindow();
}); 