const axios = require('axios');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// .env dosyasını yükleme
let envConfig = {};
const possiblePaths = [
  '.env',
  '../../.env',
  '../../../.env',
  path.join(process.cwd(), '.env')
];

// Olası tüm yolları dene ve ilk bulunan .env dosyasını yükle
for (const envPath of possiblePaths) {
  try {
    if (fs.existsSync(envPath)) {
      envConfig = dotenv.parse(fs.readFileSync(envPath));
      console.log(`OMDB API: .env dosyası başarıyla yüklendi: ${envPath}`);
      break;
    }
  } catch (err) {
    console.error(`OMDB API: .env dosyasını yükleme hatası (${envPath}):`, err.message);
  }
}

// API Anahtarı
const API_KEY = envConfig.OMDB_API_KEY || process.env.OMDB_API_KEY;
const BACKUP_API_KEY = 'e539cedc';

// API anahtarı durumunu loglama
if (API_KEY) {
  console.log('OMDB API: API anahtarı başarıyla yüklendi');
} else {
  console.warn('OMDB API: .env dosyasından API anahtarı yüklenemedi. Yedek anahtar kullanılıyor.');
}

// Temel URL
const BASE_URL = 'http://www.omdbapi.com/';

// API anahtarının varlığını kontrol etme fonksiyonu
function checkApiKey() {
  const activeKey = API_KEY || BACKUP_API_KEY;
  if (!activeKey) {
    console.error('OMDB API: API anahtarı tanımlanmamış. .env dosyasını kontrol edin.');
    throw new Error('OMDB API anahtarı tanımlanmamış. .env dosyasını kontrol edin.');
  }
  return activeKey;
}

/**
 * Film veya dizi arama fonksiyonu
 * @param {string} title - Aranacak başlık
 * @param {string} type - Arama tipi (movie, series, episode)
 * @param {number} page - Sayfa numarası
 * @param {number} year - Yıl filtresi (isteğe bağlı)
 * @returns {Promise<Object>} - Arama sonuçları
 */
async function search(title, type = '', page = 1, year = '') {
  try {
    const activeKey = checkApiKey();
    
    // Arama parametrelerini oluştur
    const params = {
      apikey: activeKey,
      s: title,
      page: page
    };

    // İsteğe bağlı parametreler
    if (type) params.type = type;
    if (year) params.y = year;
    
    // API isteği yap
    const response = await axios.get(BASE_URL, { params });
    console.log('OMDB API yanıtı:', response.data);
    
    // API yanıtını kontrol et
    if (response.data.Response === 'False') {
      console.error('OMDB API Hata:', response.data.Error);
      return { Response: 'False', Error: `API isteği başarısız: ${response.data.Error}` };
    }
    
    return response.data;
  } catch (error) {
    console.error('OMDB API Arama Hatası:', error.message);
    return { Response: 'False', Error: `API isteği başarısız: ${error.message}` };
  }
}

/**
 * IMDB ID'ye göre detay alma fonksiyonu
 * @param {string} imdbId - IMDB ID
 * @param {string} plot - Plot tipi (short, full)
 * @returns {Promise<Object>} - Film veya dizi detayları
 */
async function getById(imdbId, plot = 'full') {
  try {
    const activeKey = checkApiKey();
    
    // Parametreleri oluştur
    const params = {
      apikey: activeKey,
      i: imdbId,
      plot: plot
    };
    
    // API isteği yap
    const response = await axios.get(BASE_URL, { params });
    
    // API yanıtını kontrol et
    if (response.data.Response === 'False') {
      console.error('OMDB API Hata:', response.data.Error);
      return { Response: 'False', Error: `API isteği başarısız: ${response.data.Error}` };
    }
    
    return response.data;
  } catch (error) {
    console.error('OMDB API getById Hatası:', error.message);
    return { Response: 'False', Error: `API isteği başarısız: ${error.message}` };
  }
}

/**
 * Sezon detaylarını alma fonksiyonu
 * @param {string} imdbId - IMDB ID
 * @param {number} season - Sezon numarası
 * @returns {Promise<Object>} - Sezon detayları
 */
async function getSeasonDetails(imdbId, season) {
  try {
    const activeKey = checkApiKey();
    
    // Parametreleri oluştur
    const params = {
      apikey: activeKey,
      i: imdbId,
      Season: season
    };
    
    // API isteği yap
    const response = await axios.get(BASE_URL, { params });
    
    // API yanıtını kontrol et
    if (response.data.Response === 'False') {
      console.error('OMDB API Hata:', response.data.Error);
      return { Response: 'False', Error: `API isteği başarısız: ${response.data.Error}` };
    }
    
    return response.data;
  } catch (error) {
    console.error('OMDB API getSeasonDetails Hatası:', error.message);
    return { Response: 'False', Error: `API isteği başarısız: ${error.message}` };
  }
}

/**
 * Bölüm detaylarını alma fonksiyonu
 * @param {string} imdbId - IMDB ID
 * @param {number} season - Sezon numarası
 * @param {number} episode - Bölüm numarası
 * @returns {Promise<Object>} - Bölüm detayları
 */
async function getEpisodeDetails(imdbId, season, episode) {
  try {
    const activeKey = checkApiKey();
    
    // Parametreleri oluştur
    const params = {
      apikey: activeKey,
      i: imdbId,
      Season: season,
      Episode: episode
    };
    
    // API isteği yap
    const response = await axios.get(BASE_URL, { params });
    
    // API yanıtını kontrol et
    if (response.data.Response === 'False') {
      console.error('OMDB API Hata:', response.data.Error);
      return { Response: 'False', Error: `API isteği başarısız: ${response.data.Error}` };
    }
    
    return response.data;
  } catch (error) {
    console.error('OMDB API getEpisodeDetails Hatası:', error.message);
    return { Response: 'False', Error: `API isteği başarısız: ${error.message}` };
  }
}

// Modül dışa aktarımı
module.exports = {
  search,
  getById,
  getSeasonDetails,
  getEpisodeDetails
}; 