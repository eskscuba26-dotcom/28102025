# 🔐 SAR AMBALAJ SİSTEMİ - GÜVENLİK BİLGİLERİ

## ⚠️ ÖNEMLİ: BU DOSYAYI SADECE SİZ GÖREBİLİRSİNİZ!

Bu dosya sadece sizin bilginiz için oluşturulmuştur. **Kimseyle paylaşmayın!**

---

## 🔑 GİRİŞ BİLGİLERİ

### Admin Hesabı (İlk Giriş):
- **Kullanıcı Adı:** `admin`
- **Şifre:** `SAR_2025_GuvenlI_SifrE!@#`

**ÖNEMLİ:** İlk girişten sonra mutlaka şifrenizi değiştirin!

---

## 🛡️ GÜVENLİK ÖZELLİKLERİ

### ✅ Aktif Güvenlik Önlemleri:

1. **Kimlik Doğrulama Sistemi:**
   - Tüm API endpoint'leri JWT token ile korunuyor
   - Token olmadan hiçbir veriye erişilemez
   - Token süresi: 7 gün

2. **Şifre Güvenliği:**
   - Şifreler bcrypt ile hash'leniyor
   - Veritabanında açık şifre saklanmıyor
   - Şifre karmaşıklığı yüksek

3. **Yetki Kontrolü:**
   - Admin ve Viewer rolleri var
   - Kullanıcı yönetimi sadece Admin yapabilir
   - Her kullanıcı sadece yetkili olduğu işlemleri yapabilir

4. **CORS Koruması:**
   - Sadece belirlenen domain'den erişim
   - Rastgele sitelerden erişim engelleniyor

5. **API Koruması:**
   - Tüm production verilerine token gerekiyor
   - Tüm sevkiyat verilerine token gerekiyor
   - Tüm kesim verilerine token gerekiyor
   - Stok verilerine token gerekiyor

---

## 👥 KULLANICI YÖNETİMİ

### Yeni Kullanıcı Ekleme:
1. Admin hesabı ile giriş yapın
2. "Kullanıcı Yönetimi" sayfasına gidin
3. Yeni kullanıcı ekleyin
4. Rol seçin: **Admin** veya **Viewer**

### Roller:
- **Admin:** Her şeyi görebilir ve değiştirebilir
- **Viewer:** Sadece görüntüleyebilir, değişiklik yapamaz

---

## 🚨 GÜVENLİK ÖNERİLERİ

### Mutlaka Yapın:
1. ✅ İlk girişte admin şifresini değiştirin
2. ✅ Her kullanıcı için güçlü şifre kullanın
3. ✅ Şifreleri kimseyle paylaşmayın
4. ✅ Bilgisayarınızda oturum açık bırakmayın
5. ✅ Şüpheli aktivite görürseniz hemen şifre değiştirin

### Asla Yapmayın:
1. ❌ Şifreleri not kağıdına yazmayın
2. ❌ Aynı şifreyi başka yerlerde kullanmayın
3. ❌ Token'ları başkalarıyla paylaşmayın
4. ❌ Güvenilmeyen bilgisayarlardan giriş yapmayın
5. ❌ Bu dosyayı kimseyle paylaşmayın

---

## 🔒 VERİTABANI GÜVENLİĞİ

- Veritabanı sadece localhost'tan erişilebilir
- Dışarıdan direkt veritabanı erişimi YOK
- Tüm veriler şifreli bağlantı üzerinden gidiyor
- Şifreler hash'li olarak saklanıyor

---

## 📱 UYGULAMA ERİŞİMİ

### Preview URL (Geçici):
Şu an kullandığınız preview URL geçicidir. Kalıcı kullanım için:

1. **Deploy** butonuna basın
2. 10 dakika içinde kalıcı URL alın
3. O URL'yi bookmark yapın
4. Artık her yerden erişebilirsiniz

### Paylaşma:
- Preview URL'yi güvendiğiniz kişilerle paylaşabilirsiniz
- Ancak şifreleri ASLA paylaşmayın
- Her kişi için ayrı kullanıcı hesabı oluşturun

---

## 🆘 SORUN YAŞARSANIZ

Eğer:
- Şifrenizi unuttuysanız
- Hesabınız kilitlendiyse
- Şüpheli aktivite fark ettiyseniz
- Sisteme giremiyorsanız

**Benimle iletişime geçin, size yardımcı olacağım!**

---

## 📝 SON GÜNCELLEME

- Tarih: 28 Ekim 2025
- Güvenlik Seviyesi: **YÜKSEK** 🛡️
- Durum: **AKTİF VE GÜVENLİ** ✅

---

**NOT:** Bu dosyayı silebilir veya saklayabilirsiniz. İçeriğini bir yere not alın ve dosyayı silin.
