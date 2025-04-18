// DOM hazır olduğunda çalışacak fonksiyon
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM yüklendi, event listener\'lar kuruluyor...');
  
  // Sayfa yüklendiğinde, localStorage'dan son aktif sayfı kontrol et
  const lastActivePage = localStorage.getItem('lastActivePage');
  if (lastActivePage) {
    console.log(`Son ziyaret edilen sayfa: ${lastActivePage}`);
    currentActivePage = lastActivePage;
  }
  
  // İzleme listesini yükle
  await loadWatchlist();
  
  // Yeni ekle butonu için event listener
  setupAddButton();
  
  // Diğer kurulumlar
  setupNavigation();
  setupSearch();
  
  // Pencere kontrollerini ayarla
  setupWindowControls();
});

// İzleme listesi verilerini tutan global değişken
let watchlistData = { anime: [], movie: [], series: [] };

// Global aktif sayfa değişkeni - tüm sayfa geçişlerini kontrol eder
let currentActivePage = 'Anasayfa';

// İzleme listesini yükle
async function loadWatchlist() {
  try {
    console.log('İzleme listesi yükleniyor...');
    
    // IPC ile ana süreçten watchlist verilerini al
    watchlistData = await window.ipcRenderer.invoke('get-watchlist');
    console.log('İzleme listesi yüklendi:', watchlistData);
    
    // Sayfa içeriklerini güncelle
    renderCurrentPage();
    
    return true;
  } catch (error) {
    console.error('İzleme listesi yüklenirken hata oluştu:', error);
    return false;
  }
}

// İzleme listesindeki içerikleri status'e göre filtrele
function filterWatchlistByStatus(contentType, status) {
  if (!watchlistData || !watchlistData[contentType]) {
    return [];
  }
  
  return watchlistData[contentType].filter(item => item.status === status);
}

// İçerik kartı oluştur
function createContentCard(item) {
  // Postersi olmayan içerikler için fallback
  const posterUrl = item.poster || './src/assets/no-poster.png';
  
  // İzleme durumuna göre renk ve etiket belirle
  let statusColor, statusLabel, statusIcon;
  switch(item.status) {
    case 'watching':
      statusColor = '#3a6cf3';
      statusLabel = 'İzleniyor';
      statusIcon = '▶️';
      break;
    case 'to-watch':
      statusColor = '#f39c3a';
      statusLabel = 'İzlenecek';
      statusIcon = '🕒';
      break;
    case 'watched':
      statusColor = '#32a852';
      statusLabel = 'İzlendi';
      statusIcon = '✓';
      break;
    default:
      statusColor = '#888888';
      statusLabel = 'Belirsiz';
      statusIcon = '❓';
  }

  // Ekleme tarihini formatlama
  const addedDate = item.addedAt ? new Date(item.addedAt).toLocaleDateString('tr-TR') : '';
  
  // Rastgele puan ve yüzde değerleri (gerçek uygulamada bunlar API'den gelecek)
  const randomScore = (Math.random() * 2 + 8).toFixed(1); // 8.0-10.0 arası
  const randomPercent = Math.floor(Math.random() * 30) + 70; // 70%-100% arası
  
  // İçerik türüne göre sezon verisi oluştur (bu örnek veri, gerçekte API'dan gelecek)
  const hasSeasons = item.type === 'series' || item.type === 'anime';
  
  // Örnek sezon verisi (gerçek uygulamada API'dan veya kullanıcı verilerinden gelecek)
  const seasonCount = hasSeasons ? Math.floor(Math.random() * 5) + 1 : 0; // 1-5 arası sezon
  const seasons = [];
  
  if (hasSeasons) {
    for (let i = 1; i <= seasonCount; i++) {
      const episodeCount = Math.floor(Math.random() * 20) + 5; // 5-24 arası bölüm
      const watchedEpisodes = Math.floor(Math.random() * episodeCount); // 0 ile episodeCount arası izlenmiş bölüm
      
      seasons.push({
        number: i,
        title: `Sezon ${i}`,
        episodeCount,
        watchedEpisodes
      });
    }
  }
  
  // İzleme ilerlemesi hesapla
  let totalEpisodes = 0;
  let totalWatchedEpisodes = 0;
  
  seasons.forEach(season => {
    totalEpisodes += season.episodeCount;
    totalWatchedEpisodes += season.watchedEpisodes;
  });
  
  const progress = totalEpisodes > 0 ? Math.round((totalWatchedEpisodes / totalEpisodes) * 100) : 0;
  
  return `
    <div class="content-card" data-id="${item.id}" data-type="${item.type}">
      <div class="card-inner">
        <div class="card-front">
          <div class="card-status-badge" style="background-color: ${statusColor}">
            <span class="status-icon">${statusIcon}</span>
            <span class="status-text">${statusLabel}</span>
          </div>
          
          <div class="card-poster-container">
            <div class="card-poster" style="background-image: url('${posterUrl}')"></div>
            <div class="card-gradient-overlay"></div>
            
            <div class="card-quick-info">
              <div class="card-rating" title="Puan">
                <span class="rating-value">${randomScore}</span>
                <div class="rating-stars">★★★★<span class="half-star">★</span></div>
              </div>
              <div class="card-match" title="Eşleşme">
                <div class="match-percent">${randomPercent}%</div>
                <div class="match-label">eşleşme</div>
              </div>
            </div>
          </div>
          
          <div class="card-info">
            <h4 class="card-title">${item.title}</h4>
            <div class="card-meta">
              ${item.year ? `<span class="card-year">${item.year}</span>` : ''}
              <span class="card-type">${item.type === 'movie' ? 'Film' : item.type === 'series' ? 'Dizi' : 'Anime'}</span>
            </div>
          </div>
        </div>
        
        <div class="card-back">
          <button class="card-back-close">✕</button>
          <h4 class="card-back-title">${item.title}</h4>
          
          ${hasSeasons ? `
          <div class="card-progress-container">
            <div class="progress-bar">
              <div class="progress-value" style="width: ${progress}%"></div>
            </div>
            <div class="progress-text">${progress}% tamamlandı (${totalWatchedEpisodes}/${totalEpisodes} bölüm)</div>
          </div>
          
          <div class="seasons-container">
            ${seasons.map(season => `
              <div class="season-item">
                <div class="season-header">
                  <h5 class="season-title">${season.title}</h5>
                  <div class="season-progress">${season.watchedEpisodes}/${season.episodeCount}</div>
                </div>
                <div class="episodes-grid">
                  ${Array.from({ length: season.episodeCount }, (_, i) => {
                    const episodeNum = i + 1;
                    const isWatched = episodeNum <= season.watchedEpisodes;
                    return `
                      <button class="episode-button ${isWatched ? 'watched' : ''}" 
                        data-season="${season.number}" 
                        data-episode="${episodeNum}" 
                        title="Bölüm ${episodeNum}">
                        ${episodeNum}
                      </button>
                    `;
                  }).join('')}
                </div>
              </div>
            `).join('')}
          </div>
          ` : `
          <div class="card-back-details">
            <p><strong>Tür:</strong> ${item.type === 'movie' ? 'Film' : item.type === 'series' ? 'Dizi' : 'Anime'}</p>
            ${item.year ? `<p><strong>Yıl:</strong> ${item.year}</p>` : ''}
            <p><strong>Durum:</strong> <span style="color:${statusColor}">${statusLabel}</span></p>
            <p><strong>Eklenme:</strong> ${addedDate}</p>
          </div>
          
          <div class="card-back-actions">
            <button class="card-back-action-button edit-button" title="Düzenle">Düzenle</button>
            <button class="card-back-action-button remove-button" title="Kaldır">Kaldır</button>
          </div>
          
          <div class="card-actions-secondary">
            <button class="card-action-secondary-button" data-status="watched">
              ${item.status === 'watched' ? 'İzlendi ✓' : 'İzlendi Olarak İşaretle'}
            </button>
          </div>
          `}
        </div>
      </div>
    </div>
  `;
}

// Aktif sayfayı değiştir ve renderla
function changePage(pageName) {
  // Global değişkeni güncelle
  currentActivePage = pageName;
  console.log(`Aktif sayfa değiştirildi: ${currentActivePage}`);
  
  // Son aktif sayfa bilgisini localStorage'a kaydet
  localStorage.setItem('lastActivePage', currentActivePage);
  
  // UI'daki aktif sekme göstergelerini güncelle
  updateActiveTabIndicators();
  
  // Sayfayı renderla
  renderCurrentPage();
}

// Aktif sekme göstergelerini güncelle
function updateActiveTabIndicators() {
  const navItems = document.querySelectorAll('.navbar-item');
  
  // Tüm aktif sınıfları kaldır
  navItems.forEach(item => item.classList.remove('active'));
  
  // Mevcut aktif sayfayı işaretle
  navItems.forEach(item => {
    if (item.textContent === currentActivePage) {
      item.classList.add('active');
    }
  });
}

// Mevcut aktif sayfayı renderla
function renderCurrentPage() {
  const mainContent = document.querySelector('.main-content');
  
  // Sayfa içeriğini oluştur
  generatePageContents();
  
  // Aktif sayfayı göster
  if (pageContents[currentActivePage]) {
    mainContent.innerHTML = pageContents[currentActivePage];
    console.log(`${currentActivePage} içeriği güncellendi`);
    
    // Slider butonları için event listener'ları yeniden ekle
    setupSliderNavigation();
    
    // İçerik kartları için tıklama olayı ekle
    setupContentCardEvents();
  } else {
    console.log(`${currentActivePage} için içerik bulunamadı`);
  }
}

// Sayfa içeriklerini güncelle
function generatePageContents() {
  // Anime sayfası
  const animeWatching = filterWatchlistByStatus('anime', 'watching').map(createContentCard).join('');
  const animeToWatch = filterWatchlistByStatus('anime', 'to-watch').map(createContentCard).join('');
  const animeWatched = filterWatchlistByStatus('anime', 'watched').map(createContentCard).join('');
  
  // Film sayfası
  const movieWatching = filterWatchlistByStatus('movie', 'watching').map(createContentCard).join('');
  const movieToWatch = filterWatchlistByStatus('movie', 'to-watch').map(createContentCard).join('');
  const movieWatched = filterWatchlistByStatus('movie', 'watched').map(createContentCard).join('');
  
  // Dizi sayfası
  const seriesWatching = filterWatchlistByStatus('series', 'watching').map(createContentCard).join('');
  const seriesToWatch = filterWatchlistByStatus('series', 'to-watch').map(createContentCard).join('');
  const seriesWatched = filterWatchlistByStatus('series', 'watched').map(createContentCard).join('');
  
  // Sayfa içeriklerini güncelle
  pageContents['Anime'] = `
    <div class="category">
      <h2 class="category-title">Anime</h2>
      
      <div class="content-section">
        <h3 class="section-title">İzleniyor</h3>
        <div class="content-slider">
          <div class="slider-content">
            ${animeWatching || '<div class="no-content">İzlenen anime yok</div>'}
          </div>
          <div class="slider-navigation">
            <div class="nav-button">←</div>
            <div class="nav-button">→</div>
          </div>
        </div>
      </div>
      
      <div class="content-section">
        <h3 class="section-title">İzlenecek</h3>
        <div class="content-slider">
          <div class="slider-content">
            ${animeToWatch || '<div class="no-content">İzlenecek anime yok</div>'}
          </div>
          <div class="slider-navigation">
            <div class="nav-button">←</div>
            <div class="nav-button">→</div>
          </div>
        </div>
      </div>
      
      <div class="content-section">
        <h3 class="section-title">İzlendi</h3>
        <div class="content-slider">
          <div class="slider-content">
            ${animeWatched || '<div class="no-content">İzlenen anime yok</div>'}
          </div>
          <div class="slider-navigation">
            <div class="nav-button">←</div>
            <div class="nav-button">→</div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  pageContents['Film'] = `
    <div class="category">
      <h2 class="category-title">Film</h2>
      
      <div class="content-section">
        <h3 class="section-title">İzleniyor</h3>
        <div class="content-slider">
          <div class="slider-content">
            ${movieWatching || '<div class="no-content">İzlenen film yok</div>'}
          </div>
          <div class="slider-navigation">
            <div class="nav-button">←</div>
            <div class="nav-button">→</div>
          </div>
        </div>
      </div>
      
      <div class="content-section">
        <h3 class="section-title">İzlenecek</h3>
        <div class="content-slider">
          <div class="slider-content">
            ${movieToWatch || '<div class="no-content">İzlenecek film yok</div>'}
          </div>
          <div class="slider-navigation">
            <div class="nav-button">←</div>
            <div class="nav-button">→</div>
          </div>
        </div>
      </div>
      
      <div class="content-section">
        <h3 class="section-title">İzlendi</h3>
        <div class="content-slider">
          <div class="slider-content">
            ${movieWatched || '<div class="no-content">İzlenen film yok</div>'}
          </div>
          <div class="slider-navigation">
            <div class="nav-button">←</div>
            <div class="nav-button">→</div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  pageContents['Dizi'] = `
    <div class="category">
      <h2 class="category-title">Dizi</h2>
      
      <div class="content-section">
        <h3 class="section-title">İzleniyor</h3>
        <div class="content-slider">
          <div class="slider-content">
            ${seriesWatching || '<div class="no-content">İzlenen dizi yok</div>'}
          </div>
          <div class="slider-navigation">
            <div class="nav-button">←</div>
            <div class="nav-button">→</div>
          </div>
        </div>
      </div>
      
      <div class="content-section">
        <h3 class="section-title">İzlenecek</h3>
        <div class="content-slider">
          <div class="slider-content">
            ${seriesToWatch || '<div class="no-content">İzlenecek dizi yok</div>'}
          </div>
          <div class="slider-navigation">
            <div class="nav-button">←</div>
            <div class="nav-button">→</div>
          </div>
        </div>
      </div>
      
      <div class="content-section">
        <h3 class="section-title">İzlendi</h3>
        <div class="content-slider">
          <div class="slider-content">
            ${seriesWatched || '<div class="no-content">İzlenen dizi yok</div>'}
          </div>
          <div class="slider-navigation">
            <div class="nav-button">←</div>
            <div class="nav-button">→</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// İçerik kartları için tıklama olayı
function setupContentCardEvents() {
  const contentCards = document.querySelectorAll('.content-card');
  
  // Overlay ve popup elementi oluşturma
  let overlay = document.querySelector('.card-overlay');
  let popup = document.querySelector('.card-popup');
  
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'card-overlay';
    document.body.appendChild(overlay);
  }
  
  if (!popup) {
    popup = document.createElement('div');
    popup.className = 'card-popup';
    document.body.appendChild(popup);
  }
  
  // Overlay'e tıklama ile popup'ı kapat
  overlay.addEventListener('click', () => {
    overlay.style.display = 'none';
    popup.style.display = 'none';
    popup.innerHTML = '';
  });
  
  contentCards.forEach(card => {
    // Kart içindeki tüm tıklanabilir elemanların kart çevirme olayını tetiklememesi için
    const allClickableElements = card.querySelectorAll('button, .episode-button, .card-back-action-button, .card-action-secondary-button');
    allClickableElements.forEach(element => {
      element.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    });

    // Kartın ön yüzüne tıklama ile popup aç
    const cardFront = card.querySelector('.card-front');
    if (cardFront) {
      cardFront.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Kart bilgilerini al
        const cardId = card.dataset.id;
        const cardType = card.dataset.type;
        const cardTitle = card.querySelector('.card-title').textContent;
        const posterUrl = card.querySelector('.card-poster').style.backgroundImage;
        
        // Popup içeriğini oluştur
        createCardPopup(cardId, cardType, cardTitle, posterUrl, card);
        
        // Popup ve overlay'i göster
        overlay.style.display = 'block';
        popup.style.display = 'block';
        
        console.log(`Kart popup olarak açıldı: ${cardId}, ${cardType}`);
      });
    }
  });
}

// Popup içeriğini oluştur
function createCardPopup(id, type, title, posterUrl, originalCard) {
  const popup = document.querySelector('.card-popup');
  if (!popup) return;
  
  // Kart türüne göre farklı içerik
  const hasSeasons = type === 'series' || type === 'anime';
  
  // İzleme ilerlemesi bilgilerini al
  let progress = 0;
  let watchedEpisodes = 0;
  let totalEpisodes = 0;
  let seasons = [];
  
  // Orijinal karttan sezon bilgilerini al
  if (hasSeasons) {
    const progressElement = originalCard.querySelector('.progress-text');
    if (progressElement) {
      const progressMatch = progressElement.textContent.match(/(\d+)%\s+tamamlandı\s+\((\d+)\/(\d+)/);
      if (progressMatch && progressMatch.length >= 4) {
        progress = parseInt(progressMatch[1], 10);
        watchedEpisodes = parseInt(progressMatch[2], 10);
        totalEpisodes = parseInt(progressMatch[3], 10);
      }
    }
    
    // Sezon bilgilerini al
    const seasonItems = originalCard.querySelectorAll('.season-item');
    seasonItems.forEach(seasonItem => {
      const seasonTitle = seasonItem.querySelector('.season-title').textContent;
      const seasonProgressText = seasonItem.querySelector('.season-progress').textContent;
      const [watched, total] = seasonProgressText.split('/').map(num => parseInt(num.trim(), 10));
      
      const seasonNumber = parseInt(seasonTitle.replace('Sezon ', ''), 10);
      
      // Bölüm butonlarının izlenme durumlarını al
      const episodeButtons = seasonItem.querySelectorAll('.episode-button');
      const episodes = Array.from(episodeButtons).map(button => {
        return {
          number: parseInt(button.textContent.trim(), 10),
          isWatched: button.classList.contains('watched')
        };
      });
      
      seasons.push({
        number: seasonNumber,
        title: seasonTitle,
        watchedCount: watched,
        totalCount: total,
        episodes: episodes
      });
    });
  }
  
  // HTML içeriğini oluştur
  let popupHTML = `
    <div class="popup-content">
      <div class="popup-header">
        <h2 class="popup-title">${title}</h2>
        <button class="popup-close">×</button>
      </div>
  `;
  
  if (hasSeasons) {
    // İlerleme durumu
    popupHTML += `
      <div class="popup-progress">
        <div class="popup-progress-bar">
          <div class="popup-progress-value" style="width: ${progress}%"></div>
        </div>
        <div class="popup-progress-text">${progress}% tamamlandı (${watchedEpisodes}/${totalEpisodes} bölüm)</div>
      </div>
    `;
    
    // Sezonlar ve bölümler
    seasons.forEach(season => {
      popupHTML += `
        <div class="popup-season">
          <div class="popup-season-title">
            ${season.title}
            <span class="popup-season-count">${season.watchedCount}/${season.totalCount}</span>
          </div>
          <div class="popup-episodes">
      `;
      
      // Bölüm butonları
      for (let i = 0; i < season.totalCount; i++) {
        const episodeNum = i + 1;
        const episode = season.episodes.find(ep => ep.number === episodeNum);
        const isWatched = episode ? episode.isWatched : false;
        
        popupHTML += `
          <button class="popup-episode ${isWatched ? 'watched' : ''}" 
            data-season="${season.number}" 
            data-episode="${episodeNum}">
            ${episodeNum}
          </button>
        `;
      }
      
      popupHTML += `
          </div>
        </div>
      `;
    });
  } else {
    // Film içerikleri için detay bilgileri
    popupHTML += `
      <div class="popup-details">
        <p><strong>Tür:</strong> ${type === 'movie' ? 'Film' : type === 'series' ? 'Dizi' : 'Anime'}</p>
        <p><strong>Durum:</strong> <span class="popup-status-text">${originalCard.querySelector('.card-status-badge .status-text').textContent}</span></p>
      </div>
    `;
  }
  
  // Aksiyon butonları
  popupHTML += `
    <div class="popup-actions">
      <button class="popup-action-button popup-remove-button" data-id="${id}" data-type="${type}">Kaldır</button>
    </div>
    
    <button class="popup-status" data-id="${id}" data-type="${type}" data-status="watched">
      ${originalCard.querySelector('.card-status-badge .status-text').textContent === 'İzlendi' ? 'İzlendi ✓' : 'İzlendi Olarak İşaretle'}
    </button>
  </div>`;
  
  // İçeriği popup'a ekle
  popup.innerHTML = popupHTML;
  
  // Event listener'ları ekle
  setupPopupEventListeners(popup, id, type, originalCard);
}

// Popup için event listener'ları ekle
function setupPopupEventListeners(popup, id, type, originalCard) {
  // Kapat butonu
  const closeButton = popup.querySelector('.popup-close');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      // Overlay ve popup'ı gizle
      const overlay = document.querySelector('.card-overlay');
      
      if (overlay) overlay.style.display = 'none';
      popup.style.display = 'none';
    });
  }
  
  // Kaldır butonu
  const removeButton = popup.querySelector('.popup-remove-button');
  if (removeButton) {
    removeButton.addEventListener('click', async () => {
      if (confirm('Bu içeriği izleme listenizden kaldırmak istediğinizden emin misiniz?')) {
        // Popup'ı kapat
        const overlay = document.querySelector('.card-overlay');
        if (overlay) overlay.style.display = 'none';
        popup.style.display = 'none';
        
        try {
          console.log('İçerik kaldırılıyor...');
          
          // İşlemden önce mevcut aktif sayfa adını kaydet
          const tempActivePageName = currentActivePage;
          console.log(`İşlem öncesi aktif sayfa: ${tempActivePageName}`);
          
          // Sayfa bilgisini localStorage'a kaydet (yenileme durumu için)
          localStorage.setItem('lastActivePage', tempActivePageName);
          
          // İçeriği kaldır
          const result = await window.ipcRenderer.invoke('remove-from-watchlist', id, type);
          
          if (result) {
            console.log('İçerik başarıyla kaldırıldı');
            
            // İzleme listesi verilerini güncelle
            watchlistData = await window.ipcRenderer.invoke('get-watchlist');
            
            // Sayfa içeriğini güncelle
            generatePageContents();
            
            // Aktif sayfayı korumak için, değişken içindeki sayfaya geri dön
            console.log(`İşlem sonrası aktif sayfa ayarlanıyor: ${tempActivePageName}`);
            currentActivePage = tempActivePageName;
            updateActiveTabIndicators();
            renderCurrentPage();
          } else {
            console.error('İçerik kaldırılamadı');
          }
        } catch (error) {
          console.error('İçerik kaldırma hatası:', error);
        }
      }
    });
  }
  
  // İzleme durumu butonu
  const statusButton = popup.querySelector('.popup-status');
  if (statusButton) {
    statusButton.addEventListener('click', async () => {
      const newStatus = statusButton.dataset.status;
      
      try {
        console.log(`İçerik durumu değiştiriliyor: ${newStatus}`);
        
        // İşlemden önce mevcut aktif sayfa adını kaydet
        const tempActivePageName = currentActivePage;
        console.log(`İşlem öncesi aktif sayfa: ${tempActivePageName}`);
        
        // Sayfa bilgisini localStorage'a kaydet (yenileme durumu için)
        localStorage.setItem('lastActivePage', tempActivePageName);
        
        // IPC ile ana sürece bildir
        const result = await window.ipcRenderer.invoke('update-content-status', id, type, newStatus);
        
        if (result) {
          console.log('İçerik durumu başarıyla güncellendi');
          
          // Overlay ve popup'ı kapat
          const overlay = document.querySelector('.card-overlay');
          if (overlay) overlay.style.display = 'none';
          popup.style.display = 'none';
          
          // İzleme listesi verilerini güncelle
          watchlistData = await window.ipcRenderer.invoke('get-watchlist');
          
          // Sayfa içeriğini güncelle
          generatePageContents();
          
          // Aktif sayfayı korumak için, değişken içindeki sayfaya geri dön
          console.log(`İşlem sonrası aktif sayfa ayarlanıyor: ${tempActivePageName}`);
          currentActivePage = tempActivePageName;
          updateActiveTabIndicators();
          renderCurrentPage();
        } else {
          console.error('İçerik durumu güncellenemedi');
        }
      } catch (error) {
        console.error('Durum güncelleme hatası:', error);
      }
    });
  }
  
  // Bölüm butonları
  const episodeButtons = popup.querySelectorAll('.popup-episode');
  episodeButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const seasonNumber = button.dataset.season;
      const episodeNumber = button.dataset.episode;
      
      // Bölüm izlendi/izlenmedi olarak işaretle
      button.classList.toggle('watched');
      const isWatched = button.classList.contains('watched');
      
      console.log(`Bölüm ${isWatched ? 'izlendi' : 'izlenmedi'} olarak işaretlendi: ${type} ${id}, Sezon ${seasonNumber}, Bölüm ${episodeNumber}`);
      
      // Aynı sezondan tüm bölümleri bul
      const seasonButtons = Array.from(popup.querySelectorAll(`.popup-episode[data-season="${seasonNumber}"]`));
      const totalEpisodes = seasonButtons.length;
      const watchedEpisodes = seasonButtons.filter(btn => btn.classList.contains('watched')).length;
      
      // Sezon başlığını güncelle
      const seasonTitle = popup.querySelector(`.popup-season-title:nth-of-type(${seasonNumber})`);
      if (seasonTitle) {
        const seasonCountElement = seasonTitle.querySelector('.popup-season-count');
        if (seasonCountElement) {
          seasonCountElement.textContent = `${watchedEpisodes}/${totalEpisodes}`;
        }
      }
      
      // Genel ilerleme durumunu güncelle
      updatePopupProgress(popup);
      
      // Ayrıca orijinal kartı da güncelle
      const originalButton = originalCard.querySelector(`.episode-button[data-season="${seasonNumber}"][data-episode="${episodeNumber}"]`);
      if (originalButton) {
        if (isWatched) {
          originalButton.classList.add('watched');
        } else {
          originalButton.classList.remove('watched');
        }
        
        // Orijinal karttaki ilerleme durumunu da güncelle
        updateSeasonProgress(originalCard, seasonNumber);
        updateOverallProgress(originalCard);
      }
    });
  });
}

// Popup ilerleme durumunu güncelle
function updatePopupProgress(popup) {
  // Tüm bölümleri say
  const allEpisodes = popup.querySelectorAll('.popup-episode');
  const totalEpisodes = allEpisodes.length;
  const watchedEpisodes = popup.querySelectorAll('.popup-episode.watched').length;
  
  // İlerleme yüzdesini hesapla
  const progress = totalEpisodes > 0 ? Math.round((watchedEpisodes / totalEpisodes) * 100) : 0;
  
  // İlerleme çubuğunu güncelle
  const progressBar = popup.querySelector('.popup-progress-value');
  if (progressBar) {
    progressBar.style.width = `${progress}%`;
  }
  
  // İlerleme metnini güncelle
  const progressText = popup.querySelector('.popup-progress-text');
  if (progressText) {
    progressText.textContent = `${progress}% tamamlandı (${watchedEpisodes}/${totalEpisodes} bölüm)`;
  }
}

// İzleme listesinden içerik kaldır
async function removeFromWatchlist(id, type, activePage = null) {
  try {
    console.log(`İzleme listesinden kaldırılıyor: ${id}, ${type}`);
    
    // IPC ile ana sürece bildir
    const result = await window.ipcRenderer.invoke('remove-from-watchlist', id, type);
    
    if (result) {
      console.log('İçerik başarıyla kaldırıldı');
      
      // İzleme listesini güncelle ve aktivePage'e dön
      await loadWatchlist();
      if (activePage) {
        renderCurrentPage();
      }
    } else {
      console.error('İçerik kaldırılamadı');
    }
    
    return result;
  } catch (error) {
    console.error('İçerik kaldırma hatası:', error);
    return false;
  }
}

// İçerik detaylarını göster
function showContentDetails(id, type) {
  // Şu an için sadece konsola yazdırıyoruz
  // Daha sonra detay modalını ekleyebilirsiniz
  console.log(`İçerik detayları gösteriliyor: ${id}, ${type}`);
}

// Sayfa içeriği - farklı kategoriler için içerik konteynerları
const pageContents = {
  'Anasayfa': `
    <div class="category">
      <h2 class="category-title">Önerilen İçerikler</h2>
      <div class="content-section">
        <h3 class="section-title">En Son Eklenenler</h3>
        <div class="content-slider">
          <div class="slider-content">
            <!-- API'den dinamik olarak doldurulacak -->
          </div>
          <div class="slider-navigation">
            <div class="nav-button">←</div>
            <div class="nav-button">→</div>
          </div>
        </div>
      </div>
    </div>
  `,
  'Film': `
    <div class="category">
      <h2 class="category-title">Film</h2>
      
      <div class="content-section">
        <h3 class="section-title">İzleniyor</h3>
        <div class="content-slider">
          <div class="slider-content">
            <div class="content-card">Film 1</div>
            <div class="content-card">Film 2</div>
            <div class="content-card">Film 3</div>
          </div>
          <div class="slider-navigation">
            <div class="nav-button">←</div>
            <div class="nav-button">→</div>
          </div>
        </div>
      </div>
      
      <div class="content-section">
        <h3 class="section-title">İzlenecek</h3>
        <div class="content-slider">
          <div class="slider-content">
            <div class="content-card">Film 4</div>
            <div class="content-card">Film 5</div>
            <div class="content-card">Film 6</div>
          </div>
          <div class="slider-navigation">
            <div class="nav-button">←</div>
            <div class="nav-button">→</div>
          </div>
        </div>
      </div>
    </div>
  `,
  'Dizi': `
    <div class="category">
      <h2 class="category-title">Dizi</h2>
      
      <div class="content-section">
        <h3 class="section-title">İzleniyor</h3>
        <div class="content-slider">
          <div class="slider-content">
            <div class="content-card">Dizi 1</div>
            <div class="content-card">Dizi 2</div>
            <div class="content-card">Dizi 3</div>
          </div>
          <div class="slider-navigation">
            <div class="nav-button">←</div>
            <div class="nav-button">→</div>
          </div>
        </div>
      </div>
      
      <div class="content-section">
        <h3 class="section-title">İzlenecek</h3>
        <div class="content-slider">
          <div class="slider-content">
            <div class="content-card">Dizi 4</div>
            <div class="content-card">Dizi 5</div>
            <div class="content-card">Dizi 6</div>
          </div>
          <div class="slider-navigation">
            <div class="nav-button">←</div>
            <div class="nav-button">→</div>
          </div>
        </div>
      </div>
    </div>
  `,
  'Anime': `
    <div class="category">
      <h2 class="category-title">Anime</h2>
      
      <div class="content-section">
        <h3 class="section-title">İzleniyor</h3>
        <div class="content-slider">
          <div class="slider-content">
            <div class="content-card">Anime 1</div>
            <div class="content-card">Anime 2</div>
            <div class="content-card">Anime 3</div>
          </div>
          <div class="slider-navigation">
            <div class="nav-button">←</div>
            <div class="nav-button">→</div>
          </div>
        </div>
      </div>
      
      <div class="content-section">
        <h3 class="section-title">İzlenecek</h3>
        <div class="content-slider">
          <div class="slider-content">
            <div class="content-card">Anime 4</div>
            <div class="content-card">Anime 5</div>
            <div class="content-card">Anime 6</div>
          </div>
          <div class="slider-navigation">
            <div class="nav-button">←</div>
            <div class="nav-button">→</div>
          </div>
        </div>
      </div>
    </div>
  `,
  'İzleme Listem': `
    <div class="category">
      <h2 class="category-title">İzleme Listem</h2>
      
      <div class="content-section">
        <h3 class="section-title">Filmler</h3>
        <div class="content-slider">
          <div class="slider-content">
            <div class="content-card">Listem Film 1</div>
            <div class="content-card">Listem Film 2</div>
          </div>
          <div class="slider-navigation">
            <div class="nav-button">←</div>
            <div class="nav-button">→</div>
          </div>
        </div>
      </div>
      
      <div class="content-section">
        <h3 class="section-title">Diziler</h3>
        <div class="content-slider">
          <div class="slider-content">
            <div class="content-card">Listem Dizi 1</div>
            <div class="content-card">Listem Dizi 2</div>
          </div>
          <div class="slider-navigation">
            <div class="nav-button">←</div>
            <div class="nav-button">→</div>
          </div>
        </div>
      </div>
    </div>
  `,
  'Ayarlar': `
    <div class="settings-container">
      <h2 class="category-title">Ayarlar</h2>
      <div class="settings-section">
        <div class="settings-item">
          <h3>Veri Yönetimi</h3>
          <button class="settings-button">Verileri Dışa Aktar</button>
          
          <div class="backup-options">
            <h4>Yedekleme Seçenekleri</h4>
            <div class="backup-buttons">
              <button class="backup-button github">
                <i class="fab fa-github"></i>
                <span>GitHub</span>
              </button>
              <button class="backup-button googledrive">
                <i class="fab fa-google-drive"></i>
                <span>Google Drive</span>
              </button>
              <button class="backup-button local">
                <i class="fas fa-folder"></i>
                <span>Yerel Dizin</span>
              </button>
            </div>
          </div>
          
          <div class="api-integrations">
            <h4>API Entegrasyonları</h4>
            <div class="api-buttons">
              <button class="api-button tmdb">
                <span class="tmdb-logo">TMDB</span>
                <span>The Movie Database</span>
              </button>
              <button class="api-button omdb">
                <span class="omdb-logo">OMDb</span>
                <span>Open Movie Database</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};

// Yeni içerik ekle butonu için event listener
function setupAddButton() {
  const addButton = document.querySelector('.add-button');
  console.log('Add button setup:', addButton);
  
  if (addButton) {
    // Butonun içinde Yeni İçerik Ekle yazsın
    addButton.innerHTML = 'Ekle';
    
    addButton.addEventListener('click', () => {
      console.log('Yeni ekle butonuna tıklandı');
      
      // Modal oluştur
      const modal = document.createElement('div');
      modal.className = 'modal';
      
      // Form içeriği - Arka planı ve butonları güncelle
      modal.innerHTML = `
        <div class="add-form" style="background-color: var(--background-color); border: 1px solid rgba(255, 255, 255, 0.05);">
          <h2 style="color: var(--accent-color);">Yeni İçerik Ekle</h2>
          <div class="form-group">
            <input type="text" class="search-input" placeholder="Film, Dizi veya Anime Ara..." style="background-color: rgba(30, 30, 35, 0.7); border: 1px solid rgba(255, 255, 255, 0.1);">
            <div class="content-type-radio">
              <label class="radio-container" style="background-color: #4e1f19; border: 1px solid rgba(255, 61, 0, 0.3);">
                <input type="radio" name="searchType" value="movie" checked>
                <span class="radio-label">Film</span>
              </label>
              <label class="radio-container" style="background-color: #1f2942; border: 1px solid rgba(61, 90, 254, 0.3);">
                <input type="radio" name="searchType" value="series">
                <span class="radio-label">Dizi</span>
              </label>
              <label class="radio-container" style="background-color: #421f32; border: 1px solid rgba(233, 30, 99, 0.3);">
                <input type="radio" name="searchType" value="anime">
                <span class="radio-label">Anime</span>
              </label>
            </div>
            <button class="search-button" style="background: linear-gradient(135deg, var(--accent-color), #ff6d00); box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);">Ara</button>
          </div>
          <div class="search-results"></div>
          <div class="modal-actions">
            <button class="cancel-button" style="background-color: rgba(255, 255, 255, 0.1);">İptal</button>
          </div>
        </div>
      `;
      
      // Modal'ı sayfaya ekle
      document.body.appendChild(modal);
      
      // Add-form'a tıklama olayı ekle - bu dışa tıklanınca kapanmaması için
      const addForm = modal.querySelector('.add-form');
      addForm.addEventListener('click', (e) => {
        e.stopPropagation();
      });
      
      // Arama butonu event listener
      const searchButton = modal.querySelector('.search-button');
      searchButton.addEventListener('click', () => {
        performSearch(modal);
      });

      // Enter tuşu ile arama yapma
      const searchInput = modal.querySelector('.search-input');
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          performSearch(modal);
        }
      });
      
      // İptal butonu event listener
      const cancelButton = modal.querySelector('.cancel-button');
      cancelButton.addEventListener('click', () => {
        modal.remove();
      });
      
      // Modal dışına tıklama
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });

      // Arama inputuna odaklan
      searchInput.focus();
      
      // Radio butonları için stil güncellemeleri
      const radioContainers = modal.querySelectorAll('.radio-container');
      radioContainers.forEach(container => {
        const radio = container.querySelector('input[type="radio"]');
        radio.addEventListener('change', () => {
          // Tüm radio container'ları için aktif olmayan stil
          radioContainers.forEach(c => {
            const r = c.querySelector('input[type="radio"]');
            if (r.value === 'movie') {
              c.style.backgroundColor = r.checked ? '#4e1f19' : 'rgba(30, 30, 35, 0.7)';
              c.style.borderColor = r.checked ? 'rgba(255, 61, 0, 0.6)' : 'rgba(255, 255, 255, 0.1)';
            } else if (r.value === 'series') {
              c.style.backgroundColor = r.checked ? '#1f2942' : 'rgba(30, 30, 35, 0.7)';
              c.style.borderColor = r.checked ? 'rgba(61, 90, 254, 0.6)' : 'rgba(255, 255, 255, 0.1)';
            } else if (r.value === 'anime') {
              c.style.backgroundColor = r.checked ? '#421f32' : 'rgba(30, 30, 35, 0.7)';
              c.style.borderColor = r.checked ? 'rgba(233, 30, 99, 0.6)' : 'rgba(255, 255, 255, 0.1)';
            }
          });
        });
      });
    });
  }
}

// Arama işlemini gerçekleştir
async function performSearch(modal) {
  const searchInput = modal.querySelector('.search-input');
  const searchTypeRadio = modal.querySelector('input[name="searchType"]:checked');
  const searchType = searchTypeRadio ? searchTypeRadio.value : 'movie';
  const resultsContainer = modal.querySelector('.search-results');
  
  const searchTerm = searchInput.value.trim();
  console.log('Arama başlatılıyor, terim:', searchTerm, 'tip:', searchType);
  
  if (!searchTerm) {
    resultsContainer.innerHTML = '<div class="no-results">Lütfen arama terimi girin</div>';
    return;
  }
  
  // Yükleniyor göster
  resultsContainer.innerHTML = `
    <div class="loading-indicator" style="position:relative; height:100px;">
      <div class="loading-spinner"></div>
      <div class="loading-message">Aranıyor...</div>
    </div>
  `;
  
  try {
    console.log(`Arama yapılıyor: ${searchTerm}, türü: ${searchType}`);
    
    // API servisinin var olup olmadığını kontrol et
    if (!window.apiService) {
      console.error('API servisi bulunamadı! window.apiService:', window.apiService);
      console.log('window nesnesi içeriği:', Object.keys(window));
      throw new Error('API servisi bulunamadı');
    }
    
    console.log('API servisi mevcut, searchContent çağrılıyor...');
    
    // Doğrudan API servisinin searchContent metodunu kullan
    const searchResults = await window.apiService.searchContent(searchTerm, searchType);
    console.log('Arama sonuçları alındı:', searchResults);
    
    // Sonuçları göster
    displaySearchResults(resultsContainer, searchTerm, searchResults.items || []);
    
    // Sonuçlar konteynırına da event listener ekle
    resultsContainer.addEventListener('click', (e) => {
      // Event propagation'ı durdur
      e.stopPropagation();
    });
    
  } catch (error) {
    console.error('Arama hatası:', error);
    resultsContainer.innerHTML = `
      <div class="error-message">
        <p>Arama sırasında bir hata oluştu: ${error.message}</p>
      </div>
    `;
  }
}

// Arama sonuçlarını göster
function displaySearchResults(container, searchTerm, results) {
  if (!results || results.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <p>"${searchTerm}" için sonuç bulunamadı.</p>
      </div>
    `;
    return;
  }
  
  let html = `
    <div class="search-results-header">
      <h4>"${searchTerm}" için ${results.length} sonuç bulundu</h4>
    </div>
    <div class="search-results-grid">
  `;
  
  results.forEach(item => {
    const image = item.poster || item.image || '';
    const type = item.type || 'bilinmiyor';
    const year = item.year || '';
    
    // Türkçe içerik tipi
    let contentType = '';
    if (type === 'movie') contentType = 'Film';
    else if (type === 'series') contentType = 'Dizi';
    else if (type === 'anime') contentType = 'Anime';
    
    html += `
      <div class="search-result-card">
        <div class="result-poster" style="background-image: url('${image}')"></div>
        <div class="result-info">
          <h4 class="result-title">${item.title}</h4>
          <div class="result-meta">
            ${year ? `<span class="result-year">${year}</span>` : ''}
            ${contentType ? `<span class="result-type">${contentType}</span>` : ''}
          </div>
          <div class="watch-status-selection">
            <div class="status-buttons">
              <button class="status-button" data-status="watching">İzleniyor</button>
              <button class="status-button" data-status="to-watch">İzlenecek</button>
              <button class="status-button" data-status="watched">İzledim</button>
            </div>
            <button class="add-to-list-button" data-id="${item.id}" data-type="${type}" data-title="${item.title}" disabled>
              Ekle
            </button>
          </div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
  
  // Arama sonuç kartlarına tıklama olayı ekle
  const searchResultCards = container.querySelectorAll('.search-result-card');
  searchResultCards.forEach(card => {
    card.addEventListener('click', (e) => {
      // Event propagation'ı durdur
      e.stopPropagation();
    });
  });
  
  // İzleme durumu butonları için event listener ekle
  const statusButtons = container.querySelectorAll('.status-button');
  statusButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      // Event propagation'ı durdur
      e.stopPropagation();
      
      // Tıklanan butonun içinde bulunduğu kart
      const card = button.closest('.search-result-card');
      
      // Karttaki diğer tüm durum butonlarından active sınıfını kaldır
      const otherButtons = card.querySelectorAll('.status-button');
      otherButtons.forEach(btn => btn.classList.remove('active'));
      
      // Tıklanan butona active sınıfı ekle
      button.classList.add('active');
      
      // Ekle butonunu aktifleştir
      const addButton = card.querySelector('.add-to-list-button');
      addButton.disabled = false;
      
      // Ekle butonuna seçilen durumu kaydet
      addButton.setAttribute('data-status', button.getAttribute('data-status'));
    });
  });
  
  // Ekle butonları için event listener ekle
  const addButtons = container.querySelectorAll('.add-to-list-button');
  addButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      // Event propagation'ı durdur
      e.stopPropagation();
      
      const id = button.dataset.id;
      const type = button.dataset.type;
      const title = button.dataset.title;
      const status = button.dataset.status;
      
      // Poster URL'sini bul
      const card = button.closest('.search-result-card');
      const posterElement = card.querySelector('.result-poster');
      const posterUrl = posterElement ? posterElement.style.backgroundImage.replace(/url\(['"]?(.*?)['"]?\)/i, '$1') : '';
      
      if (!status) {
        console.error('İzleme durumu seçilmedi!');
        return;
      }
      
      button.disabled = true;
      button.textContent = 'Ekleniyor...';
      
      try {
        console.log(`İçerik ekleniyor: ${title}, tür: ${type}, durum: ${status}`);
        
        // İşlemden önce mevcut aktif sayfa adını kaydet
        const tempActivePageName = currentActivePage;
        console.log(`İşlem öncesi aktif sayfa: ${tempActivePageName}`);
        
        // Sayfa bilgisini localStorage'a kaydet (yenileme durumu için)
        localStorage.setItem('lastActivePage', tempActivePageName);
        
        // İzleme listesine ekle
        const result = await window.ipcRenderer.invoke('add-to-watchlist', {
          id,
          type,
          title,
          status,
          poster: posterUrl,
          addedAt: new Date().toISOString()
        });
        
        if (result) {
          button.textContent = 'Eklendi ✓';
          button.classList.add('success');
          console.log(`"${title}" izleme listenize eklendi (Durum: ${status})`);
          
          // İzleme listesi verilerini güncelle
          watchlistData = await window.ipcRenderer.invoke('get-watchlist');
          
          // Sayfa içeriğini güncelle
          generatePageContents();
          
          // Aktif sayfayı korumak için, değişken içindeki sayfaya geri dön
          console.log(`İşlem sonrası aktif sayfa ayarlanıyor: ${tempActivePageName}`);
          currentActivePage = tempActivePageName;
          updateActiveTabIndicators();
          renderCurrentPage();
          
          // 3 saniye sonra butonun normal durumuna dönmesini sağlayalım
          setTimeout(() => {
            button.textContent = 'Ekle';
            button.classList.remove('success');
            button.disabled = false;
          }, 3000);
        } else {
          button.textContent = 'Eklenemedi';
          button.disabled = false;
        }
      } catch (error) {
        console.error('Listeye ekleme hatası:', error);
        button.textContent = 'Eklenemedi';
        button.disabled = false;
      }
    });
  });
}

// Navbar navigasyonu
function setupNavigation() {
  const navItems = document.querySelectorAll('.navbar-item');
  
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const pageName = item.textContent;
      if (pageContents[pageName]) {
        // Global değişkeni güncelle ve sayfayı değiştir
        changePage(pageName);
      } else {
        console.log(`${pageName} için içerik bulunamadı`);
      }
    });
  });
}

/**
 * Slider navigasyonunu kurar, tüm sliderlara doğru çalışan kaydırma 
 * butonları ve davranışları ekler
 */
function setupSliderNavigation() {
  console.log('Slider navigasyonu kurulmaya başlıyor...');
  
  // Tüm slider'ları seç
  const sliders = document.querySelectorAll('.content-slider');
  
  if (!sliders || sliders.length === 0) {
    console.log('Hiç slider bulunamadı!');
    return;
  }
  
  console.log(`${sliders.length} slider bulundu.`);
  
  // Her slider için kurulumu yap
  sliders.forEach((slider, index) => {
    // Slider içindeki gerekli öğeleri seç
    const sliderContent = slider.querySelector('.slider-content');
    const prevButton = slider.querySelector('.nav-button:first-child');
    const nextButton = slider.querySelector('.nav-button:last-child');
    
    if (!sliderContent) {
      console.log(`#${index} slider için içerik bulunamadı!`);
      return;
    }
    
    if (!prevButton || !nextButton) {
      console.log(`#${index} slider için navigasyon butonları bulunamadı!`);
      return;
    }
    
    // Kartların bilgilerini al
    const cards = sliderContent.querySelectorAll('.content-card');
    
    if (!cards || cards.length === 0) {
      console.log(`#${index} slider'da kart bulunamadı!`);
      prevButton.style.display = 'none';
      nextButton.style.display = 'none';
      return;
    }
    
    // İlk kartın tam genişliğini hesapla (margin dahil)
    const cardStyle = window.getComputedStyle(cards[0]);
    const cardWidth = cards[0].offsetWidth + 
                      parseInt(cardStyle.marginRight) + 
                      parseInt(cardStyle.marginLeft);
    
    console.log(`Kart genişliği: ${cardWidth}px, Toplam kart sayısı: ${cards.length}`);
    
    // Görünür alan genişliğini hesapla
    const visibleWidth = sliderContent.clientWidth;
    const totalScrollWidth = sliderContent.scrollWidth;
    
    console.log(`Görünür genişlik: ${visibleWidth}px, Toplam kaydırma genişliği: ${totalScrollWidth}px`);
    
    // Başlangıçta sol butonunu gizle
    prevButton.style.display = 'none';
    
    // Eğer tüm içerik görünür alandaysa butonları gizle
    if (totalScrollWidth <= visibleWidth) {
      console.log(`#${index} slider'da tüm içerik görünür, butonlar gizlendi.`);
      prevButton.style.display = 'none';
      nextButton.style.display = 'none';
      return;
    } else {
      // İçerik tamamen görünmüyorsa sağ butonu göster
      nextButton.style.display = 'flex';
    }
    
    // Kaydırma fonksiyonları - görünür alanın %80'i kadar kaydır
    const scrollAmount = Math.min(visibleWidth * 0.8, cardWidth * 3);
    
    const scrollNext = () => {
      const currentPos = sliderContent.scrollLeft;
      const targetPos = currentPos + scrollAmount;
      
      // Animasyonlu kaydırma
      sliderContent.scrollTo({
        left: targetPos,
        behavior: 'smooth'
      });
      
      console.log(`#${index} slider ileri kaydırma: ${currentPos}px -> ${targetPos}px`);
    };
    
    const scrollPrev = () => {
      const currentPos = sliderContent.scrollLeft;
      const targetPos = Math.max(0, currentPos - scrollAmount);
      
      // Animasyonlu kaydırma
      sliderContent.scrollTo({
        left: targetPos,
        behavior: 'smooth'
      });
      
      console.log(`#${index} slider geri kaydırma: ${currentPos}px -> ${targetPos}px`);
    };
    
    // Buton görünürlüğünü güncelle
    const updateButtonVisibility = () => {
      const scrollLeft = sliderContent.scrollLeft;
      const maxScrollLeft = sliderContent.scrollWidth - sliderContent.clientWidth;
      
      // Tolerans değeri - piksel cinsinden
      const tolerance = 2;
      
      // Sol buton (geri) - eğer scroll pozisyonu başlangıçtaysa gizle
      if (scrollLeft <= tolerance) {
        prevButton.style.display = 'none';
      } else {
        prevButton.style.display = 'flex';
      }
      
      // Sağ buton (ileri) - eğer scroll pozisyonu sondaysa gizle
      if (maxScrollLeft - scrollLeft <= tolerance) {
        nextButton.style.display = 'none';
      } else {
        nextButton.style.display = 'flex';
      }
      
      // Debug bilgisi
      console.log(`#${index} slider pozisyon: ${scrollLeft}px / ${maxScrollLeft}px`);
    };
    
    // Başlangıçta buton görünürlüğünü ayarla
    updateButtonVisibility();
    
    // Butonlara tıklama olaylarını ekle
    nextButton.addEventListener('click', () => {
      scrollNext();
      // Küçük bir gecikmeyle buton görünürlüğünü güncelle (animasyon tamamlandıktan sonra)
      setTimeout(updateButtonVisibility, 500);
    });
    
    prevButton.addEventListener('click', () => {
      scrollPrev();
      // Küçük bir gecikmeyle buton görünürlüğünü güncelle (animasyon tamamlandıktan sonra)
      setTimeout(updateButtonVisibility, 500);
    });
    
    // Kaydırma olayında buton görünürlüğünü güncelle
    sliderContent.addEventListener('scroll', updateButtonVisibility);
    
    // Pencere boyutu değiştiğinde buton görünürlüğünü güncelle
    window.addEventListener('resize', () => {
      // Görünür alan yeniden hesaplanmalı
      const newVisibleWidth = sliderContent.clientWidth;
      const newTotalWidth = sliderContent.scrollWidth;
      
      console.log(`#${index} slider boyutu değişti: ${newVisibleWidth}px / ${newTotalWidth}px`);
      
      // Eğer tüm içerik görünür hale geldiyse butonları gizle
      if (newTotalWidth <= newVisibleWidth) {
        prevButton.style.display = 'none';
        nextButton.style.display = 'none';
      } else {
        // Değilse normal buton görünürlüğü kurallarını uygula
        updateButtonVisibility();
      }
    });
    
    console.log(`#${index} slider kurulumu tamamlandı.`);
  });
  
  console.log('Tüm slider navigasyonları kuruldu.');
}

// Arama fonksiyonu
function setupSearch() {
  const searchBar = document.querySelector('.search-bar input');
  
  if (searchBar) {
    searchBar.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const searchTerm = searchBar.value.trim();
        if (searchTerm.length > 0) {
          console.log(`Arama yapılıyor: ${searchTerm}`);
        }
      }
    });
  }
}

// Şu anki açık sayfayı al
function getCurrentPage() {
  const activeNavItem = document.querySelector('.navbar-item.active');
  return activeNavItem ? activeNavItem.textContent : 'Anasayfa';
}

// renderer.js - DOM yüklendikten sonra çağrılacak
function setupWindowControls() {
  const minimizeButton = document.querySelector('.window-control.minimize');
  const closeButton = document.querySelector('.window-control.close');
  
  if (minimizeButton) {
    minimizeButton.addEventListener('click', () => {
      console.log('Minimize butonuna tıklandı');
      window.ipcRenderer.send('window-minimize');
    });
  }
  
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      console.log('Close butonuna tıklandı');
      window.ipcRenderer.send('window-close');
    });
  }
} 