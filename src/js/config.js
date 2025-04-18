const { app, dialog, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');

// Yapılandırma deposu
const configStore = new Store({
  name: 'nexttowatch-config',
  encryptionKey: 'nexttowatch-secure-key', // Basit şifreleme
  schema: {
    apiKeys: {
      type: 'object',
      properties: {
        omdb: { type: 'string' },
        tmdb: { type: 'string' },
        jikan: { type: 'string', nullable: true }
      }
    },
    backup: {
      type: 'object',
      properties: {
        github: { 
          type: 'object',
          properties: {
            token: { type: 'string', nullable: true },
            repo: { type: 'string', nullable: true }
          }
        },
        googleDrive: {
          type: 'object',
          properties: {
            token: { type: 'string', nullable: true }
          }
        }
      }
    },
    firstRun: { type: 'boolean', default: true },
    installPath: { type: 'string' }
  }
});

// .env dosyası oluşturma
function createEnvFile(apiKeys) {
  const envContent = `# API Anahtarları
OMDB_API_KEY=${apiKeys.omdb || ''}
TMDB_API_KEY=${apiKeys.tmdb || ''}

# GitHub Bilgileri
GITHUB_TOKEN=${apiKeys.github?.token || ''}
GITHUB_REPO=${apiKeys.github?.repo || ''}

# Uygulama Ayarları
APP_TITLE=NextToWatch
APP_DESCRIPTION=Dizi, Film ve Anime İzleme Takibi
APP_VERSION=${app?.getVersion() || '1.0.0'}
APP_ENV=production
`;

  try {
    const envPath = path.join(app.getAppPath(), '.env');
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('.env dosyası başarıyla oluşturuldu:', envPath);
    return true;
  } catch (error) {
    console.error('.env dosyası oluşturulurken hata:', error);
    return false;
  }
}

// İlk çalıştırmada yapılandırma penceresini açar
async function showConfigWindow() {
  return new Promise((resolve) => {
    const configWindow = new BrowserWindow({
      width: 600,
      height: 650,
      resizable: false,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(app.getAppPath(), 'src', 'js', 'preload-config.js')
      },
      title: 'NextToWatch Yapılandırma',
      icon: path.join(app.getAppPath(), 'build', 'icon.ico')
    });

    // Yapılandırma sayfasını yükle
    configWindow.loadFile(path.join(app.getAppPath(), 'src', 'config.html'));
    
    // Yapılandırma penceresi kapatıldığında
    configWindow.on('closed', () => {
      resolve(configStore.get('apiKeys'));
    });
  });
}

// Yapılandırmayı kontrol et ve gerekirse pencereyi aç
async function checkConfiguration() {
  const isFirstRun = configStore.get('firstRun', true);
  
  if (isFirstRun) {
    // İlk çalıştırmada yapılandırma penceresini göster
    const apiKeys = await showConfigWindow();
    
    // .env dosyasını oluştur
    if (apiKeys) {
      createEnvFile(apiKeys);
    }
    
    // İlk çalıştırmayı işaretle
    configStore.set('firstRun', false);
    
    return true;
  }
  
  return false;
}

// Modülü dışa aktar
module.exports = {
  configStore,
  checkConfiguration,
  createEnvFile
}; 