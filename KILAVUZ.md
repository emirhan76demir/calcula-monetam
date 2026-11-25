# Calcula Monetam · Amaç ve Kullanım Kılavuzu

## 1. Projenin amacı

Döviz bozdururken ya da alırken iki soru sorulur: **"Bu ne eder?"** ve **"Elime gerçekte ne geçer?"** Çoğu çevirici yalnızca ilkine, o da tek bir kaynağın orta kuruyla cevap verir. Oysa bankalar ve büroların uyguladığı makas, komisyon, sabit ücret ve vergi yüzünden gerçek tutar her zaman farklıdır.

Calcula Monetam bu iki soruyu birlikte cevaplar:

- **Karışık tutarları tek satırda hesaplar.** `10 dolar - 5 euro kaç TL` gibi birden fazla para birimini toplayıp çıkarabilir, çarpabilir ve bölebilirsiniz.
- **Kuru tek kaynağa bırakmaz.** Birkaç ücretsiz kaynaktan kur alır ve ortancasını (medyan) kullanır. Kaynakların ne kadar ayrıştığını da gösterir.
- **Net tutarı gösterir.** Orta kurdan başlayıp makas, komisyon, ücret ve vergiyi adım adım düşer ya da ekler; sonunda **eline geçen** ya da **ödeyeceğin** tutara ulaşır.
- **Kendi kurunuzu kabul eder.** Bankanızın kurunu girerseniz hesap o kurla yapılır ve piyasa ortancasından ne kadar saptığı görünür.

### Kimler için?

- Yurt dışına çıkan, bütçesini birkaç para biriminde tutan gezginler
- Dövizle maaş ya da ödeme alan serbest çalışanlar
- Birikimini dolar, euro, altın ya da kriptoda tutanlar
- Banka ile döviz bürosu arasında hangisinin daha kârlı olduğunu görmek isteyen herkes

### İlkeler

- **Dürüst rakam:** Her kurun kaynağı ve ne kadar önce güncellendiği yazar. Orta kur ile net tutar arasındaki fark gizlenmez.
- **Hafif ve hızlı:** Kurulum, sunucu, hesap ya da reklam yoktur. Uygulamanın tamamı yarım megabayttan küçüktür.
- **Taşınabilir:** Klasörü kopyalayan herkes aynı şekilde kullanır.
- **Gizli:** Yazdıklarınız yalnızca kendi tarayıcınızda kalır.

> Calcula Monetam bilgi amaçlıdır, yatırım tavsiyesi değildir. Ücretsiz kaynaklar günde bir güncellenir; anlık piyasa verisi değildir.

---

## 2. Başlarken

1. Klasördeki `index.html` dosyasını çift tıklayın. Uygulama tarayıcınızda açılır.
2. Kurlar birkaç saniye içinde yüklenir. Editörün sağ üstünde "Kurlar 1 dk önce alındı" gibi bir not görürsünüz.
3. İlk açılışta editörde örnek satırlar bulunur. Bunları silip kendi hesaplarınızı yazabilirsiniz.

Uygulama bir web sitesinde yayınlanmışsa tarayıcınızın **Uygulamayı yükle** seçeneğiyle telefonunuza ya da masaüstünüze kurabilirsiniz. Kurulduktan sonra internet olmadan da son kayıtlı kurlarla çalışır.

### Ekranın bölümleri

| Bölüm | Ne işe yarar |
|---|---|
| **Sol panel** | Hedef para birimi, işlem yönü, masraf profili, kendi kurlarınız, tema ve dil |
| **Orta: Hesaplar** | Hesaplarınızı satır satır yazdığınız editör. Her satırın sonucu sağda, toplamı en altta görünür. |
| **Sağ panel** | İmlecin bulunduğu satırın ayrıntısı: net tutar, bileşim, masraf dökümü, kaynaklar ve son 30 günün grafiği |

Telefonda sol panel, sağ üstteki ayar düğmesiyle açılır.

---

## 3. Hesap yazmak

Her satır ayrı bir hesaptır. Yazdıkça sonuç anında güncellenir.

### Temel kullanım

```
100 usd
10 usd - 5 eur
(250 + 120) eur
1.500 tl kaç dolar
```

- **Para birimleri** üç şekilde yazılabilir: kod (`usd`, `eur`, `try`), simge (`$`, `€`, `₺`, `£`) ya da ad (`dolar`, `euro`, `sterlin`, `lira`).
- **Dört işlem ve parantez** kullanılabilir: `+ - * / ( )`.
- **Hedef para birimi** sol panelden seçilir. Tek bir satırı başka birime çevirmek için o satırdayken sonucun yanındaki **para birimi düğmesinden** seçim yapın; satırın sonuna `= eur` gibi bir ek yazılır. İsterseniz bunu `kaç dolar`, `in eur` ya da `→ gbp` diye elle de yazabilirsiniz.

### Sayı biçimi

Sayılar seçtiğiniz dilin kurallarına göre okunur. Türkçede:

| Yazdığınız | Okunan |
|---|---|
| `2.400` | iki bin dört yüz |
| `2,5` | iki buçuk |
| `1.234,56` | bin iki yüz otuz dört virgül elli altı |
| `10k` | on bin |

### Yüzde

```
250 eur + %18
1.000 tl - 10%
```

`+ %18` tutara yüzde 18 ekler, `- 10%` yüzde 10 düşer.

### Altın, gümüş ve kripto

```
3 gr altın
1 ons gümüş
0,05 btc + 0,5 eth
```

Yalnızca `altın` yazarsanız gram kabul edilir. Ons için `ons` kelimesini ekleyin.

**Ziynet altınları ve ayar:**

```
3 çeyrek + 1 yarım altın
2 cumhuriyet altını
10 gr 22 ayar
5.000 tl kaç çeyrek
```

`çeyrek`, `yarım altın`, `tam altın`, `ata altın` (cumhuriyet) ve `gremse` tanınır. "Tam" ve "yarım" gündelik dilde de kullanıldığı için yanlarına "altın" yazılmalıdır. Hepsi 22 ayar kabul edilir ve içindeki saf altına göre hesaplanır (ör. çeyrek 1,75 gr). `10 gr 22 ayar` gibi yazımlarla 8, 14, 18, 21, 22 ve 24 ayar da hesaplanabilir. Kuyumcu fiyatı işçilik payı içerir; o fiyatla hesaplamak için **Kendi kurların** bölümünü kullanın.

### Değişkenler

Bir değeri isimlendirip sonraki satırlarda kullanabilirsiniz:

```
maaş = 2.400 eur
kira = 18.000 tl
maaş * 12 - kira * 12
```

### Etiket ve başlık

```
# Tatil bütçesi
otel: 4 * 120 eur
uçak: 310 eur
yemek: 25 eur * 5
```

`#` ile başlayan satır başlıktır. `otel:` gibi iki nokta üst üsteyle biten sözcük etikettir; hesabı etkilemez.

### Birimleri yazmadan girmek

- **Hızlı butonlar:** Editörün üstündeki USD, EUR, TRY, gr altın, BTC gibi düğmeler, birimi imlecin olduğu yere ekler. En çok kullandıklarınız zamanla öne geçer. Diğer tüm birimler **Diğer…** listesindedir.
- **Otomatik tamamlama:** Birkaç harf yazınca öneriler açılır (`do` → dolar, `al` → altın). Ok tuşlarıyla seçip **Enter** ya da **Tab** ile ekleyin, **Esc** ile kapatın. Tanımladığınız değişkenler de önerilir.

Eklemeleri **Ctrl+Z** ile geri alabilirsiniz.

Telefonda birim butonlarının altında `+ − × ÷ ( ) %` tuşları da bulunur; klavye değiştirmeden işlem yazabilirsiniz.

---

## 4. Net tutarı görmek

Sağ paneldeki büyük rakam, işlem masrafları düşüldükten ya da eklendikten sonraki tutardır.

### İşlem yönü

- **Satıyorum:** Elinizdeki dövizi bozduruyorsunuz. Masraflar düşülür, **eline geçen** tutar gösterilir.
- **Alıyorum:** Döviz satın alıyorsunuz. Masraflar eklenir, **ödeyeceğin** tutar gösterilir.

### Masraf profili

| Profil | Ne zaman |
|---|---|
| **Orta kur** | Masrafsız, saf hesap |
| **Banka** | Mobil bankacılıkla döviz alım satımı |
| **Döviz bürosu** | Döviz bürosu ya da Kapalıçarşı |
| **Kartla yurt dışı** | Yurt dışında kartla harcama |
| **Kripto borsası** | Kripto alım satımı |
| **Özel** | Kendi girdiğiniz oranlar |

Profillerdeki oranlar örnektir. Herhangi bir kutuyu değiştirdiğinizde profil otomatik olarak **Özel** olur ve değerleriniz saklanır.

| Kutu | Anlamı |
|---|---|
| **Makas** | Alış ile satış arasındaki toplam fark (%). Yarısı işlem yönünüze uygulanır. |
| **Komisyon** | İşlem başına yüzde |
| **Sabit ücret** | İşlem başına sabit tutar, hedef para biriminde |
| **Vergi** | Brüt tutar üzerinden yüzde |

Masraflar yalnızca hedef para birimine **çevrilen** kısma uygulanır. `100 tl + 10 usd` satırında yalnızca 10 dolarlık kısım masraf görür.

### Ters hesap: "Elime ne kadar geçmesi lazım?"

Satıra `net` kelimesini eklerseniz uygulama hesabı tersten yapar:

```
10.000 tl net kaç dolar
```

- **Satıyorum** seçiliyken: Elinize net 10.000 TL geçmesi için **bozdurmanız gereken** dolar miktarını gösterir.
- **Alıyorum** seçiliyken: 10.000 TL ile masraflar dahil **alabileceğiniz** dolar miktarını gösterir.

Makas, komisyon, sabit ücret ve vergi hesaba katılır.

### Sağ paneli okumak

- **Para üstü / Eksik tutar:** Satırda hem eklenen hem çıkarılan tutar varsa (ör. `100 usd - 45 eur`), sonucun pozitif olması **Para üstü**, negatif olması **Eksik tutar** olarak yazılır. Eksik tutar kırmızıyla gösterilir.

- **Bileşim:** Satırdaki her para biriminin sonuca katkısı. Çizgili parçalar eksi değerlerdir.
- **Döküm:** Orta kurdan başlayıp her masraf kalemini gösterir; **Masrafa giden** satırı toplam kaybı tutar ve yüzde olarak verir.
- **Kaynaklar:** Her kaynağın verdiği kur, ne kadar önce güncellendiği ve kaynaklar arasındaki fark. Raydaki çift çizgi ortancadır.
- **Son 30 gün:** Kurun seyri. Grafiğin üzerinde gezinerek tarihli değerleri görebilirsiniz.

Sağ üstteki kopyala düğmesi, büyük rakamı panoya kopyalar.

---

## 5. Kendi kurunuzu kullanmak

Bankanızın ya da büronuzun size söylediği kurla hesap yapmak için:

1. Sağ paneldeki **Kendi kurunu gir** düğmesine basın. O an baktığınız kur çifti, güncel kurla birlikte tabloya eklenir.
2. Sol paneldeki **Kendi kurların** bölümünde değeri düzeltin, örneğin `1 USD = 49,80 TRY`.
3. Hesaplar hemen bu kurla güncellenir. Kaynaklar bölümünde **Senin kurun** satırı, kurunuzun piyasa ortancasından yüzde kaç saptığını gösterir.

Bilmeniz gerekenler:

- Kurunuz **yalnızca o çifte** ve tersine uygulanır. USD/TRY girdiyseniz USD/EUR piyasa kuruyla hesaplanmaya devam eder.
- Kurumların verdiği kur makası zaten içerdiği için o kısımdan **makas ayrıca düşülmez**. Komisyon, ücret ve vergi uygulanmaya devam eder.
- Bir kuru silmeden devre dışı bırakmak için yanındaki kutucuğu kaldırın. Silmek için × düğmesine basın.

---

## 6. Kasam: cebindeki parayı takip etmek

Editörün üstündeki **Kasam** sekmesi, elindeki parayı birim birim tutar. Özellikle seyahatte işe yarar:

1. Yola çıkarken elindeki parayı gir: tutarı yaz, birimi seç (ör. 300 · EUR) ve **Ekle**'ye bas.
2. Alışveriş yaptıkça tutarı yazıp **Harca**'ya bas. İstersen nota "market", "taksi" gibi bir açıklama ekle.
3. Üstte **Toplam değer**, cebindeki her şeyin hedef para birimindeki karşılığını gösterir. Renkli şerit, hangi birimden ne kadar olduğunu gösterir.

- **Elimdekiler:** Her birimin kalan miktarı ve değeri. Elindekinden fazla harcarsan kırmızıyla uyarılırsın.
- **Hareketler:** Yaptığın her ekleme ve harcama, tarih ve saatiyle. Yanlış bir kaydı × ile silebilirsin.
- **Enter tuşu:** Son kullandığın düğmeyi tekrarlar; ilk seferde **Ekle** gibi davranır. Hangisinin tekrarlanacağı renkli düğmeden anlaşılır.

Kasan da diğer her şey gibi yalnızca tarayıcında saklanır. Toplam değer, kendi kurların dahil güncel kurlarla hesaplanır.

## 7. Görünüm, dil ve paylaşım

- **Tema:** Sol panelin altından seçilir. **Moneta** (madeni para dolabı), **Tabula** (döviz bürosu panosu), **Spectra** (koyu, kaynak rayı öne çıkan), **Tessera** (uçak bileti kuponu) ve **Pura** (sade, klasik). Adres çubuğuna `?theme=tabula` ekleyerek de seçebilirsiniz.
- **Dil:** Türkçe, English, Русский, 中文, Español, Deutsch, Français, العربية, 日本語, Português. Seçtiğiniz dil sayı biçimini de belirler. Para birimi adlarını hangi dilde yazdığınız fark etmez; hepsi tanınır.
- **Paylaşım:** Uygulama bir web sitesinde yayınlanmışsa editörün üstündeki bağlantı düğmesi, hesaplarınızı içeren bir bağlantıyı kopyalar. Açan kişi aynı satırları görür; kendi kayıtlı hesapları silinmez.

---

## 8. Sık sorulan sorular

**Kurlar ne sıklıkla güncellenir?**
Uygulama açıkken her 30 dakikada bir kontrol eder. Kaynaklar ise günde bir kez güncellenir; TCMB yalnızca iş günlerinde. Anlık kur için bankanızın kurunu **Kendi kurların** bölümüne girin.

**İnternet olmadan çalışır mı?**
Evet. Son indirilen kurlar tarayıcıda saklanır. Çevrimdışıyken ekranda bu belirtilir.

**Verilerim nereye gidiyor?**
Hiçbir yere. Hesaplarınız, ayarlarınız ve kendi kurlarınız yalnızca tarayıcınızda saklanır. Uygulama, kur kaynaklarından veri indirmek dışında dışarıya bağlanmaz.

**TCMB kurları neden diğerlerinden geç güncelleniyor?**
TCMB kurlarını her iş günü öğleden sonra yayımlar. Uygulama bu veriyi doğrudan TCMB'den değil, proje içindeki ve her iş günü otomatik güncellenen bir dosyadan okur. Hafta sonu ve tatillerde son iş gününün kuru görünür; 5 günden eski TCMB verisi hiç kullanılmaz.

**Ekranda "Tanınmayan ifade" yazıyor.**
O satırda uygulamanın anlamadığı bir sözcük var; editörde dalgalı çizgiyle işaretlenir. Yazım hatası olabilir ya da değişken henüz tanımlanmamış olabilir.

**"Kur bulunamadı" yazıyor.**
O para birimi için hiçbir kaynakta kur yok ya da kurlar henüz yüklenmedi. Sağ üstteki yenile düğmesine basın.

**Hesaplarım kayboldu mu?**
Tarayıcınızın site verilerini temizlediyseniz ya da gizli pencere kullandıysanız kayıtlar silinmiş olabilir. Normal kullanımda her şey otomatik kaydedilir.

---

## 9. Kısayollar

| Tuş | Ne yapar |
|---|---|
| **↑ / ↓** | Öneri listesinde gezinir |
| **Enter / Tab** | Seçili öneriyi ekler |
| **Esc** | Öneri listesini ya da mobildeki ayar panelini kapatır |
| **Ctrl+Z** | Son değişikliği geri alır |

Sağdaki sonuç sütununda bir değere tıklamak, imleci o satıra götürür.
