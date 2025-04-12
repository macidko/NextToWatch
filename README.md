# NextToWatch

İzlenen dizi, film ve anime takip uygulaması.

## Özellikler

- **Dizi, Film ve Anime Takibi**: İzlediğiniz içerikleri kategorilere ayırarak takip edin
- **Sezon ve Bölüm Yönetimi**: İzlediğiniz bölümleri işaretleyin
- **İzleme Planı**: Gelecekte izlemek istediğiniz içerikleri planlayın
- **Discord Bot Entegrasyonu**: Discord üzerinden bölüm tamamlama işaretlemesi yapın
- **GitHub Depolama**: Verileriniz GitHub üzerinde güvenle saklanır

## Gereksinimler

- Node.js (v16 veya üzeri)
- GitHub hesabı (veri depolama için)
- Discord hesabı ve bot (isteğe bağlı)

## Kurulum

1. Repoyu klonlayın:
   ```
   git clone https://github.com/KULLANICI/NextToWatch.git
   cd NextToWatch
   ```

2. Bağımlılıkları yükleyin:
   ```
   npm install
   ```

3. `.env.example` dosyasını `.env` olarak kopyalayın ve gerekli bilgileri doldurun:
   ```
   cp .env.example .env
   ```

4. Uygulamayı başlatın:
   ```
   npm start
   ```

## Discord Bot Kurulumu

1. [Discord Developer Portal](https://discord.com/developers/applications) üzerinden bir bot oluşturun
2. Bot token'ını .env dosyasına ekleyin
3. Discord botu çalıştırın:
   ```
   npm run bot
   ```

## GitHub Entegrasyonu

1. GitHub üzerinde [kişisel erişim token'ı oluşturun](https://github.com/settings/tokens)
2. Token'ı .env dosyasına ekleyin
3. GitHub kullanıcı adı ve repo bilgilerini .env dosyasına ekleyin

## Katkıda Bulunma

Katkıda bulunmak isterseniz:

1. Projeyi forklayın
2. Yeni bir branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Daha fazla bilgi için `LICENSE` dosyasına bakın. 