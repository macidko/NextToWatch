const axios = require('axios');
require('dotenv').config();

// API Anahtarı
const API_KEY = process.env.OMDB_API_KEY || 'e539cedc';
const BASE_URL = 'http://www.omdbapi.com/';

/**
 * OMDB API ile arama yapar
 * @param {string} query - Arama sorgusu
 * @param {string} type - İçerik türü (movie, series)
 * @param {number} page - Sayfa numarası
 * @returns {Promise<Object>} - Arama sonuçları
 */
const search = async (query, type = '', page = 1) => {
  if (!query) {
    throw new Error('Arama sorgusu gereklidir.');
  }

  try {
    console.log('OMDB API araması yapılıyor:', query, type);
    
    const params = {
      apikey: API_KEY,
      s: query,
      page: page
    };

    // Eğer tür belirtilmişse, params'a ekle
    if (type && (type === 'movie' || type === 'series')) {
      params.type = type;
    }

    const response = await axios.get(BASE_URL, { params });
    console.log('OMDB API yanıtı:', response.data);
    
    if (response.data.Response === 'False') {
      console.log('OMDB yanıt hatası:', response.data.Error);
      return {
        Response: 'False',
        Error: response.data.Error || 'İçerik bulunamadı.'
      };
    }

    return response.data;
  } catch (error) {
    console.error('OMDB arama hatası:', error);
    throw error;
  }
};

/**
 * IMDB ID ile detay getirir
 * @param {string} imdbId - IMDB ID
 * @param {boolean} fullPlot - Tam plot içeriği
 * @returns {Promise<Object>} - Film veya dizi detayları
 */
const getById = async (imdbId, fullPlot = false) => {
  if (!API_KEY) {
    throw new Error('OMDB API anahtarı tanımlanmamış. .env dosyasını kontrol edin.');
  }

  if (!imdbId) {
    throw new Error('IMDB ID gereklidir.');
  }

  try {
    const params = {
      apikey: API_KEY,
      i: imdbId,
      plot: fullPlot ? 'full' : 'short'
    };

    const response = await axios.get(BASE_URL, { params });
    
    if (response.data.Response === 'False') {
      return {
        Response: 'False',
        Error: response.data.Error || 'İçerik bulunamadı.'
      };
    }

    return response.data;
  } catch (error) {
    console.error('OMDB ID ile detay getirme hatası:', error);
    throw error;
  }
};

/**
 * Dizi için sezon detaylarını getirir
 * @param {string} imdbId - IMDB ID
 * @param {number} season - Sezon numarası
 * @returns {Promise<Object>} - Sezon detayları
 */
const getSeasonDetails = async (imdbId, season) => {
  if (!API_KEY) {
    throw new Error('OMDB API anahtarı tanımlanmamış. .env dosyasını kontrol edin.');
  }

  if (!imdbId) {
    throw new Error('IMDB ID gereklidir.');
  }

  if (!season) {
    throw new Error('Sezon numarası gereklidir.');
  }

  try {
    const params = {
      apikey: API_KEY,
      i: imdbId,
      Season: season
    };

    const response = await axios.get(BASE_URL, { params });
    
    if (response.data.Response === 'False') {
      return {
        Response: 'False',
        Error: response.data.Error || 'Sezon bulunamadı.'
      };
    }

    return response.data;
  } catch (error) {
    console.error('OMDB sezon detayları hatası:', error);
    throw error;
  }
};

/**
 * Bölüm detaylarını getirir
 * @param {string} imdbId - IMDB ID
 * @param {number} season - Sezon numarası
 * @param {number} episode - Bölüm numarası
 * @returns {Promise<Object>} - Bölüm detayları
 */
const getEpisodeDetails = async (imdbId, season, episode) => {
  if (!API_KEY) {
    throw new Error('OMDB API anahtarı tanımlanmamış. .env dosyasını kontrol edin.');
  }

  if (!imdbId || !season || !episode) {
    throw new Error('IMDB ID, sezon ve bölüm numarası gereklidir.');
  }

  try {
    const params = {
      apikey: API_KEY,
      i: imdbId,
      Season: season,
      Episode: episode
    };

    const response = await axios.get(BASE_URL, { params });
    
    if (response.data.Response === 'False') {
      return {
        Response: 'False',
        Error: response.data.Error || 'Bölüm bulunamadı.'
      };
    }

    return response.data;
  } catch (error) {
    console.error('OMDB bölüm detayları hatası:', error);
    throw error;
  }
};

// Fonksiyonları dışa aktar
module.exports = {
  search,
  getById,
  getSeasonDetails,
  getEpisodeDetails
}; 