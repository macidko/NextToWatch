// DOM hazır olduğunda çalışacak fonksiyon
document.addEventListener('DOMContentLoaded', () => {
  // Navbar geçişleri için event listener
  setupNavigation();
  
  // Kaydırma butonları için event listener
  setupSliderNavigation();
  
  // İçerik kartları için event listener
  setupContentCards();
  
  // Yeni ekle butonu için event listener
  setupAddButton();
  
  // Arama fonksiyonu
  setupSearch();
});

// Sayfa içeriği - farklı kategoriler için içerik konteynerları
const pageContents = {
  'Anasayfa': `
    <div class="category">
      <h2 class="category-title">Önerilen İçerikler</h2>
      <div class="content-section">
        <h3 class="section-title">En Son Eklenenler</h3>
        <div class="content-slider">
          <div class="slider-content">
            <div class="content-card" data-id="101">Yeni İçerik 1</div>
            <div class="content-card" data-id="102">Yeni İçerik 2</div>
            <div class="content-card" data-id="103">Yeni İçerik 3</div>
            <div class="content-card" data-id="104">Yeni İçerik 4</div>
            <div class="content-card" data-id="105">Yeni İçerik 5</div>
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

      <!-- İzleniyor Bölümü -->
      <div class="content-section">
        <h3 class="section-title">İzleniyor</h3>
        <div class="content-slider">
          <div class="slider-content">
            <div class="content-card" data-id="1">Film 1</div>
            <div class="content-card" data-id="2">Film 2</div>
            <div class="content-card" data-id="3">Film 3</div>
            <div class="content-card" data-id="4">Film 4</div>
            <div class="content-card" data-id="5">Film 5</div>
          </div>
          <div class="slider-navigation">
            <div class="nav-button">←</div>
            <div class="nav-button">→</div>
          </div>
        </div>
      </div>

      <!-- İzlenecek Bölümü -->
      <div class="content-section">
        <h3 class="section-title">İzlenecek</h3>
        <div class="content-slider">
          <div class="slider-content">
            <div class="content-card" data-id="6">Film 6</div>
            <div class="content-card" data-id="7">Film 7</div>
            <div class="content-card" data-id="8">Film 8</div>
            <div class="content-card" data-id="9">Film 9</div>
            <div class="content-card" data-id="10">Film 10</div>
          </div>
          <div class="slider-navigation">
            <div class="nav-button">←</div>
            <div class="nav-button">→</div>
          </div>
        </div>
      </div>

      <!-- İzlendi Bölümü -->
      <div class="content-section">
        <h3 class="section-title">İzlendi</h3>
        <div class="content-slider">
          <div class="slider-content">
            <div class="content-card" data-id="11">Film 11</div>
            <div class="content-card" data-id="12">Film 12</div>
            <div class="content-card" data-id="13">Film 13</div>
            <div class="content-card" data-id="14">Film 14</div>
            <div class="content-card" data-id="15">Film 15</div>
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

      <!-- İzleniyor Bölümü -->
      <div class="content-section">
        <h3 class="section-title">İzleniyor</h3>
        <div class="content-slider">
          <div class="slider-content">
            <div class="content-card" data-id="21">Dizi 1</div>
            <div class="content-card" data-id="22">Dizi 2</div>
            <div class="content-card" data-id="23">Dizi 3</div>
            <div class="content-card" data-id="24">Dizi 4</div>
            <div class="content-card" data-id="25">Dizi 5</div>
          </div>
          <div class="slider-navigation">
            <div class="nav-button">←</div>
            <div class="nav-button">→</div>
          </div>
        </div>
      </div>

      <!-- İzlenecek Bölümü -->
      <div class="content-section">
        <h3 class="section-title">İzlenecek</h3>
        <div class="content-slider">
          <div class="slider-content">
            <div class="content-card" data-id="26">Dizi 6</div>
            <div class="content-card" data-id="27">Dizi 7</div>
            <div class="content-card" data-id="28">Dizi 8</div>
            <div class="content-card" data-id="29">Dizi 9</div>
            <div class="content-card" data-id="30">Dizi 10</div>
          </div>
          <div class="slider-navigation">
            <div class="nav-button">←</div>
            <div class="nav-button">→</div>
          </div>
        </div>
      </div>

      <!-- İzlendi Bölümü -->
      <div class="content-section">
        <h3 class="section-title">İzlendi</h3>
        <div class="content-slider">
          <div class="slider-content">
            <div class="content-card" data-id="31">Dizi 11</div>
            <div class="content-card" data-id="32">Dizi 12</div>
            <div class="content-card" data-id="33">Dizi 13</div>
            <div class="content-card" data-id="34">Dizi 14</div>
            <div class="content-card" data-id="35">Dizi 15</div>
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

      <!-- İzleniyor Bölümü -->
      <div class="content-section">
        <h3 class="section-title">İzleniyor</h3>
        <div class="content-slider">
          <div class="slider-content">
            <div class="content-card" data-id="41">Anime 1</div>
            <div class="content-card" data-id="42">Anime 2</div>
            <div class="content-card" data-id="43">Anime 3</div>
            <div class="content-card" data-id="44">Anime 4</div>
            <div class="content-card" data-id="45">Anime 5</div>
          </div>
          <div class="slider-navigation">
            <div class="nav-button">←</div>
            <div class="nav-button">→</div>
          </div>
        </div>
      </div>

      <!-- İzlenecek Bölümü -->
      <div class="content-section">
        <h3 class="section-title">İzlenecek</h3>
        <div class="content-slider">
          <div class="slider-content">
            <div class="content-card" data-id="46">Anime 6</div>
            <div class="content-card" data-id="47">Anime 7</div>
            <div class="content-card" data-id="48">Anime 8</div>
            <div class="content-card" data-id="49">Anime 9</div>
            <div class="content-card" data-id="50">Anime 10</div>
          </div>
          <div class="slider-navigation">
            <div class="nav-button">←</div>
            <div class="nav-button">→</div>
          </div>
        </div>
      </div>

      <!-- İzlendi Bölümü -->
      <div class="content-section">
        <h3 class="section-title">İzlendi</h3>
        <div class="content-slider">
          <div class="slider-content">
            <div class="content-card" data-id="51">Anime 11</div>
            <div class="content-card" data-id="52">Anime 12</div>
            <div class="content-card" data-id="53">Anime 13</div>
            <div class="content-card" data-id="54">Anime 14</div>
            <div class="content-card" data-id="55">Anime 15</div>
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
        <h3 class="section-title">Tüm İçerikler</h3>
        <div class="content-slider">
          <div class="slider-content">
            <div class="content-card" data-id="61">Liste 1</div>
            <div class="content-card" data-id="62">Liste 2</div>
            <div class="content-card" data-id="63">Liste 3</div>
            <div class="content-card" data-id="64">Liste 4</div>
            <div class="content-card" data-id="65">Liste 5</div>
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
          <h3>Tema</h3>
          <div class="theme-selector">
            <button class="theme-button active" data-theme="dark">Karanlık</button>
            <button class="theme-button" data-theme="light">Aydınlık</button>
          </div>
        </div>
        <div class="settings-item">
          <h3>Bildirimler</h3>
          <div class="notification-settings">
            <label class="switch">
              <input type="checkbox" checked>
              <span class="slider round"></span>
            </label>
            <span>Bildirimleri Etkinleştir</span>
          </div>
        </div>
        <div class="settings-item">
          <h3>Veri Yönetimi</h3>
          <button class="settings-button">Verileri Dışa Aktar</button>
          <button class="settings-button">Verileri İçe Aktar</button>
        </div>
      </div>
    </div>
  `
};

// Navbar item tıklandığında aktif sınıfı değiştirme ve sayfa içeriğini güncelleme
function setupNavigation() {
  const navItems = document.querySelectorAll('.navbar-item');
  const mainContent = document.querySelector('.main-content');
  
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      // Aktif sınıfını kaldır
      navItems.forEach(nav => nav.classList.remove('active'));
      
      // Tıklanan öğeye aktif sınıfı ekle
      item.classList.add('active');
      
      // Sayfa içeriğini güncelle
      const pageContent = pageContents[item.textContent] || '';
      mainContent.innerHTML = pageContent;
      
      // Yeni eklenen içerikler için event listenerları tekrar kur
      setupSliderNavigation();
      setupContentCards();
      
      // Ayarlar sayfası için özel işlevler
      if (item.textContent === 'Ayarlar') {
        setupSettingsPage();
      }
    });
  });
}

// Kaydırma butonları için işlev
function setupSliderNavigation() {
  const sliders = document.querySelectorAll('.content-slider');
  
  sliders.forEach(slider => {
    const content = slider.querySelector('.slider-content');
    const prevBtn = slider.querySelector('.nav-button:first-child');
    const nextBtn = slider.querySelector('.nav-button:last-child');
    
    if (!content || !prevBtn || !nextBtn) return;
    
    // Kaydırma miktarını hesapla (card genişliği + margin)
    const cardWidth = 180; // İçerik kartının genişliği
    const cardMargin = 24; // İçerik kartının sağ margin değeri (1.5rem)
    const scrollAmount = cardWidth + cardMargin;
    
    // İleri butonuna tıklandığında
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Event propagation'ı durdur
      content.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
    
    // Geri butonuna tıklandığında
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Event propagation'ı durdur
      content.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });
    
    // Scroll durumuna göre butonları göster/gizle
    content.addEventListener('scroll', () => {
      // Scroll pozisyonunu kontrol et
      const isAtStart = content.scrollLeft === 0;
      const isAtEnd = content.scrollLeft + content.clientWidth >= content.scrollWidth - 5;
      
      // Sol butonu göster/gizle
      prevBtn.style.opacity = isAtStart ? '0.5' : '1';
      prevBtn.style.cursor = isAtStart ? 'default' : 'pointer';
      
      // Sağ butonu göster/gizle
      nextBtn.style.opacity = isAtEnd ? '0.5' : '1';
      nextBtn.style.cursor = isAtEnd ? 'default' : 'pointer';
    });
    
    // Sayfa yüklendiğinde scroll durumunu kontrol et
    setTimeout(() => {
      // Yapay bir scroll eventi tetikle
      content.dispatchEvent(new Event('scroll'));
    }, 100);
  });
}

// İçerik kartları için detay görünümü
function setupContentCards() {
  const contentCards = document.querySelectorAll('.content-card');
  
  contentCards.forEach(card => {
    card.addEventListener('click', () => {
      const contentId = card.getAttribute('data-id');
      const contentName = card.textContent;
      
      // İçerik detayları modalını oluştur
      showContentDetails(contentId, contentName);
    });
  });
}

// İçerik detaylarını gösteren modal
function showContentDetails(id, name) {
  // Eğer zaten bir modal varsa kaldır
  const existingModal = document.querySelector('.modal-container');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Yeni modal oluştur
  const modal = document.createElement('div');
  modal.className = 'modal-container';
  
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>${name}</h2>
        <button class="close-button">✕</button>
      </div>
      <div class="modal-body">
        <div class="content-details">
          <div class="content-image">İçerik Görseli</div>
          <div class="content-info">
            <p><strong>ID:</strong> ${id}</p>
            <p><strong>Tür:</strong> ${id < 20 ? 'Film' : id < 40 ? 'Dizi' : 'Anime'}</p>
            <p><strong>Yayın Yılı:</strong> 2023</p>
            <p><strong>Durum:</strong> ${
              id % 3 === 0 ? 'İzlendi' : 
              id % 3 === 1 ? 'İzleniyor' : 'İzlenecek'
            }</p>
          </div>
        </div>
        <div class="content-actions">
          <button class="action-button ${id % 3 === 0 ? 'active' : ''}" data-status="watched">İzlendi</button>
          <button class="action-button ${id % 3 === 1 ? 'active' : ''}" data-status="watching">İzleniyor</button>
          <button class="action-button ${id % 3 === 2 ? 'active' : ''}" data-status="to-watch">İzlenecek</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Modal kapatma butonu
  const closeButton = modal.querySelector('.close-button');
  closeButton.addEventListener('click', () => {
    modal.remove();
  });
  
  // Modal dışına tıklanınca kapatma
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
  
  // İzleme durumu butonları
  const actionButtons = modal.querySelectorAll('.action-button');
  actionButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Aktif sınıfını tümünden kaldır
      actionButtons.forEach(btn => btn.classList.remove('active'));
      // Tıklanan butona aktif sınıfı ekle
      button.classList.add('active');
      
      // İzleme durumunu güncelle
      const status = button.getAttribute('data-status');
      console.log(`İçerik ${id} için durum güncellendi: ${status}`);
      
      // Burada veritabanı güncelleme işlemleri yapılacak
    });
  });
}

// Yeni içerik ekleme modalı
function setupAddButton() {
  const addButton = document.querySelector('.add-button');
  
  if (addButton) {
    addButton.addEventListener('click', () => {
      // Eğer zaten bir modal varsa kaldır
      const existingModal = document.querySelector('.modal-container');
      if (existingModal) {
        existingModal.remove();
      }
      
      // Yeni içerik ekleme modalını oluştur
      const modal = document.createElement('div');
      modal.className = 'modal-container';
      
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h2>Yeni İçerik Ekle</h2>
            <button class="close-button">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label for="content-name">İçerik Adı</label>
              <input type="text" id="content-name" placeholder="İçerik adını girin">
            </div>
            <div class="form-group">
              <label for="content-type">İçerik Türü</label>
              <select id="content-type">
                <option value="film">Film</option>
                <option value="dizi">Dizi</option>
                <option value="anime">Anime</option>
              </select>
            </div>
            <div class="form-group">
              <label for="content-status">İzleme Durumu</label>
              <select id="content-status">
                <option value="to-watch">İzlenecek</option>
                <option value="watching">İzleniyor</option>
                <option value="watched">İzlendi</option>
              </select>
            </div>
            <div class="form-actions">
              <button class="cancel-button">İptal</button>
              <button class="save-button">Kaydet</button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Modal kapatma butonu
      const closeButton = modal.querySelector('.close-button');
      const cancelButton = modal.querySelector('.cancel-button');
      
      [closeButton, cancelButton].forEach(button => {
        button.addEventListener('click', () => {
          modal.remove();
        });
      });
      
      // Modal dışına tıklanınca kapatma
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });
      
      // Kaydet butonu
      const saveButton = modal.querySelector('.save-button');
      saveButton.addEventListener('click', () => {
        const contentName = document.getElementById('content-name').value;
        const contentType = document.getElementById('content-type').value;
        const contentStatus = document.getElementById('content-status').value;
        
        if (contentName.trim() === '') {
          alert('İçerik adı boş olamaz!');
          return;
        }
        
        console.log('Yeni içerik eklendi:', {
          name: contentName,
          type: contentType,
          status: contentStatus
        });
        
        // Burada veritabanına kaydetme işlemleri yapılacak
        
        modal.remove();
      });
    });
  }
}

// Arama fonksiyonu
function setupSearch() {
  const searchInput = document.querySelector('.search-bar input');
  
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.trim().toLowerCase();
      
      if (searchTerm.length < 2) return; // En az 2 karakter gerekli
      
      console.log('Aranan:', searchTerm);
      
      // Arama sonucu 500ms sonra göster (inputta yazmayı bitirsin diye)
      setTimeout(() => {
        if (searchTerm === searchInput.value.trim().toLowerCase() && searchTerm.length >= 2) {
          showSearchResults(searchTerm);
        }
      }, 500);
    });
  }
}

// Arama sonuçlarını göster
function showSearchResults(searchTerm) {
  // Arama sonucu sayfasını oluştur
  const mainContent = document.querySelector('.main-content');
  
  mainContent.innerHTML = `
    <div class="category">
      <h2 class="category-title">"${searchTerm}" için arama sonuçları</h2>
      
      <div class="content-section">
        <h3 class="section-title">Filmler</h3>
        <div class="search-results">
          ${getSearchResults(searchTerm, 'film')}
        </div>
      </div>
      
      <div class="content-section">
        <h3 class="section-title">Diziler</h3>
        <div class="search-results">
          ${getSearchResults(searchTerm, 'dizi')}
        </div>
      </div>
      
      <div class="content-section">
        <h3 class="section-title">Animeler</h3>
        <div class="search-results">
          ${getSearchResults(searchTerm, 'anime')}
        </div>
      </div>
    </div>
  `;
  
  // Arama sonuçları için event listenerları kur
  setupContentCards();
}

// Demo arama sonuçları
function getSearchResults(searchTerm, type) {
  let results = '';
  const types = {
    'film': ['Film 1', 'Film 3', 'Film 5', 'Aksiyon Filmi', 'Macera Filmi'],
    'dizi': ['Dizi 2', 'Dizi 4', 'Gizem Dizisi', 'Aksiyon Dizisi'],
    'anime': ['Anime 1', 'Anime 3', 'Anime 5', 'Aksiyon Animesi']
  };
  
  const filteredResults = types[type].filter(item => 
    item.toLowerCase().includes(searchTerm)
  );
  
  if (filteredResults.length === 0) {
    return '<div class="no-results">Sonuç bulunamadı</div>';
  }
  
  filteredResults.forEach((item, index) => {
    results += `<div class="content-card" data-id="${index + 100}">${item}</div>`;
  });
  
  return results;
}

// Ayarlar sayfası için özel işlevler
function setupSettingsPage() {
  // Tema değiştirme butonları
  const themeButtons = document.querySelectorAll('.theme-button');
  
  if (themeButtons.length) {
    themeButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Aktif sınıfını tümünden kaldır
        themeButtons.forEach(btn => btn.classList.remove('active'));
        // Tıklanan butona aktif sınıfı ekle
        button.classList.add('active');
        
        // Tema değiştir
        const theme = button.getAttribute('data-theme');
        console.log(`Tema değiştirildi: ${theme}`);
        
        // Burada tema değiştirme işlemi yapılacak
      });
    });
  }
  
  // Veri yönetimi butonları
  const dataButtons = document.querySelectorAll('.settings-button');
  
  if (dataButtons.length) {
    dataButtons.forEach(button => {
      button.addEventListener('click', () => {
        console.log(`${button.textContent} işlemi başlatıldı`);
        
        // Burada veri dışa/içe aktarma işlemleri yapılacak
      });
    });
  }
} 