const jikanApi = require('./jikanApi');
const omdbApi = require('./omdbApi');

/**
 * API Servisi - Jikan ve OMDB API'lerini birleştiren merkezi servis
 */
class ApiService {
  constructor() {
    this.jikanApi = jikanApi;
    this.omdbApi = omdbApi;
    
    // Yerel veritabanı bağlantısı (Electron Store gibi)
    this.database = null;
  }
  
  /**
   * Veritabanı bağlantısını ayarlar
   * @param {Object} database - Veritabanı referansı
   */
  setDatabase(database) {
    this.database = database;
  }
  
  /**
   * İçerik araması - İçerik tipine göre uygun API'yi kullanır
   * @param {string} query - Arama sorgusu
   * @param {string} type - İçerik tipi (movie, series, anime, all)
   * @returns {Promise<Object>} - Arama sonuçları
   */
  async searchContent(query, type = 'all') {
    console.log('searchContent() çağrıldı:', { query, type });
    
    if (!query || query.trim() === '') {
      console.log('Boş sorgu, boş sonuç döndürülüyor');
      return { items: [] };
    }
    
    // Anime araması
    if (type === 'anime' || type === 'all') {
      try {
        console.log('Anime araması yapılıyor');
        return await this.searchAnime(query);
      } catch (error) {
        console.error('Anime araması sırasında hata:', error);
        if (type === 'anime') {
          throw error;
        }
      }
    }
    
    // Film veya dizi araması
    if (type === 'movie' || type === 'series' || type === 'all') {
      try {
        console.log('OMDB araması yapılıyor, tip:', type !== 'all' ? type : 'all');
        return await this.searchOmdb(query, type !== 'all' ? type : '');
      } catch (error) {
        console.error('OMDB araması sırasında hata:', error);
        throw error;
      }
    }
    
    console.log('Geçersiz tür, boş sonuç döndürülüyor');
    return { items: [] };
  }
  
  /**
   * Anime araması - Jikan API kullanır
   * @param {string} query - Arama sorgusu
   * @returns {Promise<Object>} - Anime arama sonuçları
   */
  async searchAnime(query) {
    console.log('searchAnime() çağrıldı:', query);
    
    if (!query || query.trim() === '') {
      console.log('Boş sorgu, boş sonuç döndürülüyor');
      return { items: [] };
    }
    
    try {
      console.log('Jikan API ile anime araması başlatılıyor');
      const results = await this.jikanApi.searchAnime(query);
      console.log('Jikan API yanıtı alındı');
      
      if (!results || !results.data) {
        console.log('Geçerli veri yok, boş sonuç döndürülüyor');
        return { items: [] };
      }
      
      // Sonuçları dönüştür
      console.log(`${results.data.length} anime sonucu işleniyor`);
      const items = results.data.map(anime => ({
        id: anime.mal_id.toString(),
        title: anime.title,
        image: anime.images?.jpg?.image_url || '',
        type: 'anime',
        year: anime.aired?.from ? new Date(anime.aired.from).getFullYear().toString() : '',
        synopsis: anime.synopsis || '',
        score: anime.score || 0,
        episodes: anime.episodes || 0,
        status: anime.status || ''
      }));
      
      console.log('İşlenen anime sonuçları:', items.length);
      return { items };
    } catch (error) {
      console.error('Jikan API ile anime araması sırasında hata:', error);
      throw error;
    }
  }
  
  /**
   * Film/Dizi araması - OMDB API kullanır
   * @param {string} query - Arama sorgusu
   * @param {string} type - İçerik tipi (movie, series, boş bırakılırsa ikisi de)
   * @returns {Promise<Object>} - Film/Dizi arama sonuçları
   */
  async searchOmdb(query, type = '') {
    console.log('searchOmdb() çağrıldı:', { query, type });
    
    if (!query || query.trim() === '') {
      console.log('Boş sorgu, boş sonuç döndürülüyor');
      return { items: [] };
    }
    
    try {
      console.log('OMDB API ile arama başlatılıyor');
      const results = await this.omdbApi.search(query, type);
      console.log('OMDB API yanıtı alındı:', results);
      
      if (!results || !results.Search || results.Response === 'False') {
        console.log('Geçerli sonuç bulunamadı, boş sonuç döndürülüyor');
        return { items: [] };
      }
      
      // Sonuçları dönüştür
      console.log(`${results.Search.length} OMDB sonucu işleniyor`);
      const items = results.Search.map(item => ({
        id: item.imdbID,
        title: item.Title,
        poster: item.Poster !== 'N/A' ? item.Poster : '',
        type: item.Type === 'movie' ? 'movie' : 'series',
        year: item.Year || ''
      }));
      
      console.log('İşlenen OMDB sonuçları:', items.length);
      return { items };
    } catch (error) {
      console.error('OMDB API ile arama sırasında hata:', error);
      throw error;
    }
  }
  
  /**
   * İçerik detaylarını getirir - İçerik tipine göre uygun API'yi kullanır
   * @param {string} id - İçerik ID'si
   * @param {string} type - İçerik tipi (movie, series, anime)
   * @returns {Promise<Object>} - İçerik detayları
   */
  async getContentDetails(id, type) {
    if (!id) {
      throw new Error('ID gereklidir');
    }
    
    // Anime detayları
    if (type === 'anime') {
      try {
        const animeDetails = await this.jikanApi.getAnimeDetails(id);
        
        if (!animeDetails || !animeDetails.data) {
          throw new Error('Anime detayları bulunamadı');
        }
        
        const anime = animeDetails.data;
        
        return {
          id: anime.mal_id.toString(),
          title: anime.title,
          image: anime.images?.jpg?.image_url || '',
          type: 'anime',
          year: anime.aired?.from ? new Date(anime.aired.from).getFullYear().toString() : '',
          synopsis: anime.synopsis || '',
          score: anime.score || 0,
          episodes: anime.episodes || 0,
          status: anime.status || '',
          genres: anime.genres?.map(genre => genre.name) || []
        };
      } catch (error) {
        console.error('Anime detayları alınırken hata:', error);
        throw error;
      }
    }
    
    // Film veya dizi detayları
    if (type === 'movie' || type === 'series') {
      try {
        const contentDetails = await this.omdbApi.getById(id);
        
        if (!contentDetails || contentDetails.Response === 'False') {
          throw new Error('İçerik detayları bulunamadı');
        }
        
        return {
          id: contentDetails.imdbID,
          title: contentDetails.Title,
          poster: contentDetails.Poster !== 'N/A' ? contentDetails.Poster : '',
          type: contentDetails.Type === 'movie' ? 'movie' : 'series',
          year: contentDetails.Year || '',
          plot: contentDetails.Plot || '',
          rating: contentDetails.imdbRating || '0',
          runtime: contentDetails.Runtime || '',
          genre: contentDetails.Genre || '',
          director: contentDetails.Director || '',
          actors: contentDetails.Actors || '',
          totalSeasons: contentDetails.totalSeasons || ''
        };
      } catch (error) {
        console.error('Film/Dizi detayları alınırken hata:', error);
        throw error;
      }
    }
    
    throw new Error('Desteklenmeyen içerik tipi');
  }
  
  /**
   * İzleme listesine içerik ekler
   * @param {string} id - İçerik ID'si
   * @param {string} type - İçerik tipi (movie, series, anime)
   * @param {string} status - İzleme durumu (to-watch, watching, watched)
   * @returns {Promise<boolean>} - Başarılı olup olmadığı
   */
  async addToWatchlist(id, type, status = 'to-watch') {
    if (!id || !type) {
      throw new Error('ID ve içerik tipi gereklidir');
    }
    
    // İçerik detaylarını getir
    try {
      const details = await this.getContentDetails(id, type);
      
      if (!details) {
        throw new Error('İçerik detayları bulunamadı');
      }
      
      // Veritabanına ekle
      if (this.database) {
        const watchlistItem = {
          id,
          type,
          status,
          title: details.title,
          poster: details.poster || details.image || '',
          year: details.year || '',
          addedAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };
        
        await this.database.addToWatchlist(watchlistItem);
        return true;
      } else {
        console.warn('Veritabanı bağlantısı olmadan içerik eklenmeye çalışıldı');
        return false;
      }
    } catch (error) {
      console.error('İzleme listesine eklerken hata:', error);
      throw error;
    }
  }
  
  /**
   * Popüler içerik listesini getirir
   * @param {string} type - İçerik tipi (movie, series, anime, all)
   * @param {number} limit - Sonuç sayısı sınırı
   * @returns {Promise<Object>} - Popüler içerik listesi
   */
  async getPopularContent(type = 'all', limit = 10) {
    const results = { items: [] };
    
    if (type === 'anime' || type === 'all') {
      try {
        const animeResults = await this.jikanApi.getTopAnime(limit);
        
        if (animeResults && animeResults.data) {
          const animeItems = animeResults.data.map(anime => ({
            id: anime.mal_id.toString(),
            title: anime.title,
            image: anime.images?.jpg?.image_url || '',
            type: 'anime',
            year: anime.aired?.from ? new Date(anime.aired.from).getFullYear().toString() : '',
            score: anime.score || 0
          }));
          
          results.items = [...results.items, ...animeItems];
        }
      } catch (error) {
        console.error('Popüler anime alınırken hata:', error);
      }
    }
    
    return results;
  }
}

// Singleton instance oluştur
const apiService = new ApiService();

module.exports = apiService; 