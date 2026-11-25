# Calcula Monetam

Para birimleri arasında hesap yapan, kurları birden fazla ücretsiz kaynaktan alıp ortanca (medyan) değeri kullanan, makas, komisyon, sabit ücret ve vergiyi hesaba katarak **eline geçecek** ya da **ödeyeceğin** net tutarı gösteren bir uygulama.

```
10 usd - 5 eur
maaş = 2.400 eur
maaş * 12 kaç dolar
3 gr altın + 0,05 btc
```

[English](README.en.md) · [Amaç ve kullanım kılavuzu](KILAVUZ.md)

## Kullanım

- `index.html` dosyasını çift tıklayarak açın. Kurulum, sunucu ya da internetten başka bir şey gerekmez.
- Başkasıyla paylaşmak için klasörü olduğu gibi kopyalayın veya zipleyin.
- Bir web sunucusunda yayınlandığında (ör. GitHub Pages, Netlify, Cloudflare Pages) tarayıcının "Uygulamayı yükle" seçeneğiyle masaüstüne ya da telefona kurulabilir ve çevrimdışı açılır.

## Yazım

| Yazdığınız | Anlamı |
|---|---|
| `10 usd`, `$10`, `10 dolar`, `10 доллар`, `10美元` | Kod, simge ya da 10 dildeki adlar |
| `+ - * / ( )` | Dört işlem ve parantez |
| `250 eur + %18`, `250 eur - 10%` | Yüzde ekleme / çıkarma |
| `1500 tl kaç dolar`, `100 eur in usd`, `→ gbp` | Satır sonunda hedef para birimi |
| `3 gr altın`, `1 ons gümüş` | Gram ya da ons altın ve gümüş |
| `3 çeyrek + 1 yarım altın`, `10 gr 22 ayar` | Ziynet altınları ve ayarlı altın |
| `10.000 tl net kaç dolar` | Ters hesap: net tutar için gereken ya da alınabilecek döviz |
| `maaş = 2.400 eur` | Değişken; sonraki satırlarda `maaş * 12` |
| `otel: 120 eur` | Etiketli satır |
| `# Tatil bütçesi` | Başlık satırı |
| `10k usd` | 10.000 |

Sayılar seçili dilin biçimine göre okunur: Türkçede `2.400` iki bin dört yüz, `2,5` iki buçuktur.

Birimleri yazmak zorunda değilsiniz:

- **Hızlı butonlar:** Editörün üstündeki düğmeler birimi imlecin olduğu yere ekler. En çok kullandıklarınız öne geçer; diğer tüm birimler **Diğer…** listesindedir.
- **Otomatik tamamlama:** Birkaç harf yazınca (`do`, `eu`, `al`) öneriler açılır. Ok tuşlarıyla seçip Enter veya Tab ile ekleyin. Tanımladığınız değişkenler de önerilir.

## Kasam

**Kasam** sekmesinde elindeki parayı birim birim tutarsın: başta **Ekle**, alışveriş yaptıkça **Harca**. Toplam değer, kalan miktarlar ve tarihli hareket geçmişi görünür. Seyahatte cebindeki parayı takip etmek için tasarlandı.

## Kendi kurların

Bankanızın ya da döviz bürosunun kurunu sol paneldeki **Kendi kurların** bölümüne girin (ör. `1 USD = 49,80 TRY`). Hesaplar bu kurla yapılır. Sağ paneldeki **Kendi kurunu gir** düğmesi, o an baktığınız kur çiftini tek tıkla bu tabloya ekler. Kaynaklar bölümünde **Senin kurun** satırı, kurunuzun piyasa ortancasından yüzde kaç saptığını gösterir. Kutucuğu kaldırarak bir kuru silmeden devre dışı bırakabilirsiniz.

Kendi kur girdiğiniz çiftte makas kura dahil sayılır ve ayrıca düşülmez; komisyon, sabit ücret ve vergi profildeki gibi uygulanır. Kurunuz yalnızca girdiğiniz çifte (ve tersine) uygulanır, diğer çiftler piyasa ortancasıyla hesaplanmaya devam eder.

## Paylaşma

Uygulama bir web sunucusunda yayınlandığında editörün üstündeki bağlantı düğmesi, hesabınızı ve hedef para biriminizi içeren bir bağlantı kopyalar. Bağlantıyı açan kişi aynı hesapları görür.

## Masraflar

Sol paneldeki **İşlem** seçimi yönü belirler. **Satıyorum** seçiliyse masraflar düşülür ve eline geçen tutar gösterilir. **Alıyorum** seçiliyse masraflar eklenir ve ödeyeceğin tutar gösterilir.

- **Makas:** Alış ile satış arasındaki toplam fark; yarısı işlem yönüne uygulanır.
- **Komisyon:** Yüzde olarak.
- **Sabit ücret:** Hedef para biriminde, işlem başına.
- **Vergi:** Yüzde olarak, brüt tutar üzerinden.

Masraflar yalnızca hedef para birimine çevrilen kısma uygulanır. Hazır profillerdeki oranlar örnektir; kendi bankanızın ya da büronuzun oranlarını girdiğinizde profil **Özel** olarak kaydedilir.

## Kaynaklar

| Kaynak | İçerik | Güncellenme |
|---|---|---|
| [Frankfurter](https://frankfurter.dev) | Avrupa Merkez Bankası verisi, geçmiş grafikler | İş günlerinde günlük |
| [ExchangeRate-API](https://www.exchangerate-api.com) | 160+ para birimi | Günlük |
| [Currency API](https://github.com/fawazahmed0/exchange-api) | Döviz, altın, gümüş, kripto | Günlük |
| [Gold API](https://gold-api.com) | Altın ve gümüş (ons, USD) | Dakikalar içinde |
| [TCMB](https://www.tcmb.gov.tr) | Resmi TL kurları | İş günlerinde, GitHub otomasyonuyla (aşağıya bakın) |

Her kur, kaynakların ortancasıdır. Sağ panelde her kaynağın verdiği değer, ne kadar önce güncellendiği ve kaynaklar arasındaki fark görünür. Ücretsiz kaynaklar anlık piyasa verisi değildir.

## Görünüm ve dil

- **Temalar:** Moneta, Tabula, Spectra, Tessera, Pura. Adrese `?theme=tabula` eklenerek de seçilebilir.
- **Diller:** Türkçe, English, Русский, 中文, Español, Deutsch, Français, العربية, 日本語, Português.

## Gizlilik

Yazdıklarınız ve ayarlarınız yalnızca kendi tarayıcınızda saklanır. Uygulama, yukarıdaki kaynaklardan kur indirmek dışında hiçbir yere veri göndermez.

## TCMB kurları nasıl geliyor?

TCMB'nin kur dosyası tarayıcıların okumasına izin vermez. Bu yüzden uygulama TCMB'ye doğrudan bağlanmaz; veriyi projenin içindeki `data/tcmb.js` dosyasından okur. Bu dosya her zaman uygulamayla birlikte gelir, bu sayede `index.html` diskten açıldığında da çalışır.

Proje GitHub'a yüklendiğinde `.github/workflows/tcmb.yml` görevi, her iş günü Türkiye saatiyle 15:45 ve 17:15'te TCMB'nin kur dosyasını çeker. Dosya `scripts/tcmb.mjs` ile doğrulanır, değiştiyse `data/tcmb.js` olarak depoya kaydedilir. Hiçbir sunucu, hesap ya da anahtar gerekmez; görev yalnızca o depoya yazma iznine sahiptir ve dışarıdan hazır eklenti kullanmaz.

Doğrulama adımları:

- Dosya beklenen biçimde mi, tarih son 10 gün içinde mi?
- USD ve EUR dahil en az 10 para birimi var mı, alış ve satış değerleri tutarlı mı?
- USD/TRY bir önceki kayda göre %25'ten fazla oynamış mı? Oynamışsa dosya kaydedilmez.

Uygulama tarafında iki koruma daha vardır. 5 günden eski TCMB verisi kullanılmaz. Diğer kaynaklardan %5'ten fazla sapan herhangi bir değer de ortancaya katılmaz.

Görevi beklemeden çalıştırmak için GitHub'da **Actions → TCMB kurları → Run workflow** yolunu izleyin. Klasörü GitHub'sız kullanıyorsanız `node scripts/tcmb.mjs` komutu aynı işi bilgisayarınızda yapar.

İsterseniz `js/config.js` içindeki `tcmbUrl` alanına güncel dosyanın adresini yazabilirsiniz (ör. `https://raw.githubusercontent.com/KULLANICI/calcula-monetam/main/data/tcmb.js`). Bu sayede diskten açılan kopyalar da her zaman en güncel TCMB verisini kullanır.

## Testler

Node.js 18 veya üstü ile:

```
node --test
```

---

Bilgi amaçlıdır, yatırım tavsiyesi değildir. Gerçek işlem kurları farklı olabilir.
