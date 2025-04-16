const axios = require('axios');

// Jikan API URL
const BASE_URL = 'https://api.jikan.moe/v4';

// API istekleri arasında bekleme süresi (milisaniye) - Rate Limit için
const API_DELAY = 400; // Rate limit'i aşmamak için biraz arttırdım

// Son istek zamanını takip etmek için
let lastRequestTime = 0;

/**
 * API çağrısı yapmadan önce gerekirse gecikme ekler
 * @returns {Promise<void>} - Gecikme tamamlandığında çözülen Promise
 */
const throttleRequest = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < API_DELAY) {
    const delay = API_DELAY - timeSinceLastRequest;
    console.log(`Jikan API rate limit: ${delay}ms bekleniyor...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  lastRequestTime = Date.now();
};

/**
 * Anime arama işlevi
 * @param {string} query - Arama metni
 * @param {number} page - Sayfa numarası
 * @returns {Promise<Object>} - Arama sonuçları
 */
const searchAnime = async (query, page = 1) => {
  if (!query) {
    console.warn('Jikan API: Arama metni boş.');
    return { data: [] };
  }
  
  try {
    console.log('Jikan API ile anime araması yapılıyor:', query);
    await throttleRequest();
    
    const response = await axios.get(`${BASE_URL}/anime`, {
      params: {
        q: query,
        page: page,
        limit: 15,
        sfw: true
      },
      timeout: 8000 // 8 saniye zaman aşımı
    });
    
    console.log(`Jikan API yanıtı: ${response.data.data?.length || 0} sonuç bulundu`);
    return response.data;
  } catch (error) {
    console.error('Anime arama hatası:', error.message);
    
    // Özel hata mesajları
    if (error.response) {
      // API yanıt verdi ama hata kodu döndü
      console.error(`Jikan API hata kodu: ${error.response.status}`, error.response.data);
      return { 
        data: [], 
        error: `API yanıt hatası: ${error.response.status} - ${error.response.data?.message || 'Bilinmeyen hata'}` 
      };
    } else if (error.request) {
      // İstek yapıldı ama yanıt alınamadı (zaman aşımı veya ağ hatası)
      console.error('Jikan API yanıt vermedi, sunucu bağlantı sorunu olabilir.');
      return { data: [], error: 'API sunucusuna bağlanılamadı. Rate limit aşılmış veya sunucu bakımda olabilir.' };
    } else {
      // İstek oluşturulurken hata oluştu
      return { data: [], error: `API istek hatası: ${error.message}` };
    }
  }
};

/**
 * Anime detaylarını getir
 * @param {number} animeId - Anime ID
 * @returns {Promise<Object>} - Anime detayları
 */
const getAnimeDetails = async (animeId) => {
  if (!animeId) {
    console.warn('Jikan API: Anime ID boş.');
    return { data: null, error: 'Anime ID gereklidir' };
  }
  
  try {
    await throttleRequest();
    
    const response = await axios.get(`${BASE_URL}/anime/${animeId}`, {
      timeout: 8000 // 8 saniye zaman aşımı
    });
    return response.data;
  } catch (error) {
    console.error('Anime detay hatası:', error.message);
    
    // Özel hata mesajları
    if (error.response) {
      // API yanıt verdi ama hata kodu döndü
      return { 
        data: null, 
        error: `API yanıt hatası: ${error.response.status} - ${error.response.data?.message || 'Bilinmeyen hata'}` 
      };
    } else if (error.request) {
      // İstek yapıldı ama yanıt alınamadı
      return { data: null, error: 'API sunucusuna bağlanılamadı. Rate limit aşılmış olabilir.' };
    } else {
      // İstek oluşturulurken hata oluştu
      return { data: null, error: `API istek hatası: ${error.message}` };
    }
  }
};

/**
 * Popüler anime listesini getir
 * @param {number} limit - Sonuç sayısı sınırı
 * @param {number} page - Sayfa numarası
 * @returns {Promise<Object>} - Popüler anime listesi
 */
const getTopAnime = async (limit = 15, page = 1) => {
  try {
    await throttleRequest();
    
    const response = await axios.get(`${BASE_URL}/top/anime`, {
      params: {
        page,
        limit,
        filter: 'bypopularity'
      },
      timeout: 8000 // 8 saniye zaman aşımı
    });
    
    return response.data;
  } catch (error) {
    console.error('Popüler anime listesi hatası:', error.message);
    
    // Özel hata mesajları
    if (error.response) {
      return { 
        data: [], 
        error: `API yanıt hatası: ${error.response.status} - ${error.response.data?.message || 'Bilinmeyen hata'}` 
      };
    } else if (error.request) {
      return { data: [], error: 'API sunucusuna bağlanılamadı. Rate limit aşılmış olabilir.' };
    } else {
      return { data: [], error: `API istek hatası: ${error.message}` };
    }
  }
};

/**
 * Mevsimlik anime listesini getir
 * @param {string} season - Mevsim (winter, spring, summer, fall)
 * @param {number} year - Yıl
 * @param {number} page - Sayfa numarası
 * @returns {Promise<Object>} - Mevsimlik anime listesi
 */
const getSeasonalAnime = async (season, year = new Date().getFullYear(), page = 1) => {
  const validSeasons = ['winter', 'spring', 'summer', 'fall'];
  
  if (!validSeasons.includes(season)) {
    console.warn('Jikan API: Geçersiz mevsim.');
    return { 
      data: [], 
      error: 'Geçersiz mevsim. Geçerli değerler: winter, spring, summer, fall' 
    };
  }
  
  try {
    await throttleRequest();
    
    const response = await axios.get(`${BASE_URL}/seasons/${year}/${season}`, {
      params: {
        page,
        limit: 15
      },
      timeout: 8000 // 8 saniye zaman aşımı
    });
    
    return response.data;
  } catch (error) {
    console.error('Mevsimlik anime listesi hatası:', error.message);
    
    // Özel hata mesajları
    if (error.response) {
      return { 
        data: [], 
        error: `API yanıt hatası: ${error.response.status} - ${error.response.data?.message || 'Bilinmeyen hata'}` 
      };
    } else if (error.request) {
      return { data: [], error: 'API sunucusuna bağlanılamadı. Rate limit aşılmış olabilir.' };
    } else {
      return { data: [], error: `API istek hatası: ${error.message}` };
    }
  }
};

/**
 * Anime bölüm listesini getir
 * @param {number} animeId - Anime ID
 * @param {number} page - Sayfa numarası
 * @returns {Promise<Object>} - Bölüm listesi
 */
const getAnimeEpisodes = async (animeId, page = 1) => {
  if (!animeId) {
    console.warn('Jikan API: Anime ID boş.');
    return { data: [], error: 'Anime ID gereklidir' };
  }
  
  try {
    await throttleRequest();
    
    const response = await axios.get(`${BASE_URL}/anime/${animeId}/episodes`, {
      params: {
        page
      },
      timeout: 8000 // 8 saniye zaman aşımı
    });
    
    return response.data;
  } catch (error) {
    console.error('Anime bölümleri hatası:', error.message);
    
    // Özel hata mesajları
    if (error.response) {
      return { 
        data: [], 
        error: `API yanıt hatası: ${error.response.status} - ${error.response.data?.message || 'Bilinmeyen hata'}` 
      };
    } else if (error.request) {
      return { data: [], error: 'API sunucusuna bağlanılamadı. Rate limit aşılmış olabilir.' };
    } else {
      return { data: [], error: `API istek hatası: ${error.message}` };
    }
  }
};

/**
 * Gelen Jikan API verilerini uygulama formatına dönüştürür
 * @param {Object} animeData - Jikan API'den gelen anime verisi
 * @returns {Object} Formatlı anime verisi
 */
const formatAnimeData = (animeData) => {
  if (!animeData || !animeData.data) {
    return null;
  }
  
  return {
    id: animeData.mal_id || animeData.id,
    title: animeData.title,
    titleEnglish: animeData.title_english,
    image: animeData.images?.jpg?.image_url || animeData.images?.jpg?.large_image_url,
    trailer: animeData.trailer?.url || '',
    synopsis: animeData.synopsis || '',
    type: animeData.type || '',
    source: animeData.source || '',
    episodes: animeData.episodes || 0,
    status: animeData.status || '',
    airing: !!animeData.airing,
    aired: animeData.aired?.string || '',
    season: animeData.season || '',
    year: animeData.year || '',
    rating: animeData.rating || '',
    score: animeData.score || 0,
    genres: (animeData.genres || []).map(genre => genre.name),
    studios: (animeData.studios || []).map(studio => studio.name),
    duration: animeData.duration || ''
  };
};

/**
 * Arama sonuçlarını uygulama formatına dönüştürür
 * @param {Object} searchResults - Jikan API'den gelen arama sonuçları
 * @returns {Object} Formatlı arama sonuçları
 */
const formatSearchResults = (searchResults) => {
  if (!searchResults || !searchResults.data) {
    return {
      items: [],
      pagination: {
        lastPage: 0,
        currentPage: 0,
        hasNextPage: false
      }
    };
  }
  
  return {
    items: searchResults.data.map(anime => formatAnimeData(anime)),
    pagination: {
      lastPage: searchResults.pagination?.last_visible_page || 0,
      currentPage: searchResults.pagination?.current_page || 0,
      hasNextPage: searchResults.pagination?.has_next_page || false
    }
  };
};

// API servisini başlat
console.log('Jikan API servisi başlatılıyor...');

// Modülü dışa aktar
module.exports = {
  searchAnime,
  getAnimeDetails,
  getTopAnime,
  getSeasonalAnime,
  getAnimeEpisodes,
  formatAnimeData,
  formatSearchResults
}; 