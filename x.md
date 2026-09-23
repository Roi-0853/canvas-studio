# Canvas Studio Sistem Mimarisi ve Çalışma Prensipleri

Bu doküman, Canvas Studio projesinin mimarisini, web sitesi ilk açıldığında gerçekleşen tüm yaşam döngüsü adımlarını ve sisteme sağlanan tüm girdilere (inputs) karşılık üretilen çıktıların (outputs) nasıl meydana geldiğini ayrıntılı olarak açıklamaktadır.

---

## 1. Genel Sistem Mimarisi ve Modüler Yapı

Canvas Studio, HTML5 Canvas üzerinde vektörel çizim ve manipülasyon işlemlerini yürütmek amacıyla **Konva.js** kütüphanesini temel alan, modern **ES6 modüler** mimarisine sahip istemci taraflı (client-side) bir web uygulamasıdır. Projede kullanılan modüller ve görevleri şunlardır:

- **`index.html` & `style.css`**: Kullanıcı arayüzünün iskeletini (üst araç çubuğu/toolbar ve sahne taşıyıcısı/container) ve görsel stil tanımlarını barındırır.
- **`app.js` (Uygulama Giriş Noktası - Entry Point)**: Sahneyi, olay dinleyicilerini, kart fabrikasını ve bağlantı yöneticisini birbirine bağlayan orkestrasyon merkezidir.
- **`canvas/stage.js`**: `Konva.Stage`, ana `Konva.Layer` ve kartların boyutlandırılmasını sağlayan `Konva.Transformer` nesnelerini ilklendirir. Sahne üzerindeki genel seçim/tıklama mekanizmalarını yönetir.
- **`canvas/zoomAndPan.js`**: Sahnenin fare tekerleğiyle (`wheel`) yakınlaştırılıp uzaklaştırılmasını (zoom in/out) ve sahne sürüklendikçe (`dragmove`) arka plan ızgarasının senkronize edilmesini sağlar.
- **`canvas/events/resize.js`**: Tarayıcı penceresi yeniden boyutlandırıldığında sahne ve ızgara boyutlarını günceller.
- **`canvas/events/contextMenu.js`**: Bağlantı oklarına sağ tıklandığında tarayıcının varsayılan bağlam menüsünü engelleyerek bağlantının silinmesini sağlar.
- **`cards/cardFactory.js`**: `Konva.Group`, `Konva.Rect` ve `Konva.Text` bileşenlerini birleştirerek sahnede yeni kart düğümleri üretir; boyutlandırma, sürükleme ve metin düzenleme yeteneklerini karta ekler.
- **`cards/ports.js`**: Kartların dört kenarında (üst, alt, sol, sağ) beliren bağlantı portlarını (`Konva.Circle`) yönetir.
- **`cards/textEditor.js`**: Karta çift tıklandığında canvas üzerinde tam metin alanına denk gelecek şekilde DOM tabanlı bir `<textarea>` açar; otomatik boyut hesaplaması (`autoFitGroupToText`) yapar.
- **`connections/connectionManager.js`**: Kartlar arasındaki mantıksal ve görsel bağlantı ilişkilerini (`Konva.Arrow`) yönetir; ekleme, güncelleme, silme ve JSON serileştirme/deserileştirme işlemlerini yürütür.
- **`connections/mouseEvents.js`**: Bir porttan sürükleme başlatıldığında farenin global hareketini takip ederek geçici oku çizer ve fare bırakıldığında hedef tespiti yapar.
- **`connections/tempLine.js`**: Bağlantı kurma sırasında gösterilen kesikli geçici oku (`Konva.Arrow` with dash) yönetir.
- **`connections/popup.js`**: Bağlantı çizgisi boş bir alana bırakıldığında canvas koordinatlarında dinamik olarak "+ Kutucuk Ekle" hızlı işlem butonunu görüntüler.
- **`storage/fileSaver.js`**: Sahnedeki kartları, metinleri, boyutları, konumları ve bağlantıları `.mycanvas` formatında (JSON) dışa aktarır ve dosya indirmesini tetikler.
- **`storage/fileLoader.js`**: Kullanıcının yüklediği `.mycanvas` dosyasını `FileReader` ile okuyup JSON ayrıştırması yapar, sahneyi sıfırlar ve tüm kart ve bağlantıları yeniden inşa eder.
- **`utils/grid.js`**: Sahnenin ölçek ve kaydırma değerlerine göre dinamik bir SVG nokta deseni (dot pattern) oluşturur ve arka plan olarak DOM elemanına uygular.
- **`utils/math.js`**: İki kartın merkezleri ve sınırları arasındaki geometrik kesişim noktalarını (`getEdgeIntersectionPoints`) hesaplayarak bağlantı okunun tam kart kenarlarına oturmasını sağlar.
- **`utils/idGenerator.js`**: Kartlara benzersiz kimlikler (`card-{counter}-{hash}`) atar.
- **`constants.js`**: Sabit seçiciler, boyut sınırları ve stil parametrelerini tutar.

---

## 2. Bölüm 1: Web Sitesi İlk Açıldığında Ne Olur ve Neler Çalışır?

Kullanıcı web sitesini tarayıcıda açtığında (sayfa yüklendiğinde) arka planda sıralı olarak şu adımlar gerçekleşir ve şu kod blokları çalışır:

1. **HTML Ayrıştırma ve Harici Kaynakların Yüklenmesi (`index.html`)**:
   - Tarayıcı `index.html` dosyasını ayrıştırmaya başlar.
   - `style.css` yüklenir ve genel stiller (`overflow: hidden`, sıfırlanmış kenar boşlukları vb.) uygulanır.
   - Konva.js kütüphanesi CDN üzerinden (`https://unpkg.com/konva@9/konva.min.js`) global nesne olarak tarayıcı belleğine alınır.
   - Sayfa gövdesinde `#toolbar` (içinde *Kutu Ekle*, *Bağlan*, *Kaydet*, *Dosya Aç* butonları ve gizli bir `#fileInput` bulunur) ve `#container` (`100vw` x `100vh`) elemanları DOM'a yerleştirilir.
   - `<script type="module" src="app.js"></script>` etiketi ES6 modülü olarak yüklenir ve çalıştırılır.

2. **Modül Bağımlılıklarının Çalıştırılması ve Sahne İlklendirmesi (`canvas/stage.js`)**:
   - `app.js` modülü çalıştığında ilk olarak import ettiği `canvas/stage.js` modülü devreye girer.
   - `document.getElementById('container')` çağrısıyla sahne taşıyıcı elemanı referans alınır.
   - `new Konva.Stage({ container: 'container', width: window.innerWidth, height: window.innerHeight, draggable: true })` çalıştırılarak tam ekran boyutlarında, sürüklenebilir bir Konva Sahnesi (`stage`) oluşturulur.
   - Bir `Konva.Layer` oluşturulup sahneye (`stage.add(layer)`) eklenir.
   - Seçilen kartları çevreleyen ve boyutlandırma tutamaçlarını sağlayan `Konva.Transformer` nesnesi oluşturulur. Döndürme özelliği (`rotateEnabled: false`) kapatılır, 4 köşe tutamacı aktif edilip katmana eklenir.
   - Sahneye genel `click / tap` dinleyicisi atanır; boş alana tıklandığında seçimi temizler, bir karta tıklandığında ise o kartı Transformer'a bağlar.

3. **Yakınlaştırma ve Kaydırma Mekanizmasının Kurulması (`canvas/zoomAndPan.js`)**:
   - `canvas/zoomAndPan.js` içe aktarıldığında `stage.on('wheel', ...)` dinleyicisi kaydedilir (fare tekeriyle ölçekleme için).
   - Sahne sürüklendikçe `stage.on('dragmove', ...)` olayı `requestAnimationFrame` kontrolü altında arka plan ızgarasını senkronize edecek şekilde tetiklenmeye hazır hale getirilir.

4. **Bağlantı Yöneticisinin (ConnectionManager) Başlatılması (`app.js`)**:
   - `new ConnectionManager(layer)` çalıştırılır. Bu nesne boş bir `connections` dizisi ve bir bağlantı sayacı (`connCounter = 0`) ile bellekte hazır bekler.

5. **Kart Fabrikasının (CardFactory) Hazırlanması (`app.js`)**:
   - `createCardFactory(connectionManager)` çağrılır ve `connectionManager` referansına sahip `createCard` üretici fonksiyonu elde edilir.

6. **Etkinlik Dinleyicilerinin (Event Listeners) Kurulması (`app.js`)**:
   - `setupContextMenu(connectionManager)`: Sahne üzerinde sağ tıklama (`contextmenu`) dinleyicisi kurulur; bağlantı çizgilerine sağ tıklandığında silinmelerini sağlar.
   - `setupResizeEvent()`: `window.addEventListener('resize', ...)` dinleyicisi kaydedilerek pencere boyutu değiştiğinde sahne ve ızgara boyutlarının güncellenmesi sağlanır.
   - `setupConnectionMouseEvents(connectionManager, createCard)`: Global `window` nesnesine `mousemove` ve `mouseup` dinleyicileri eklenerek portlardan sürüklenen geçici bağlantı oklarının ve hedef bırakma mantığının takibi başlatılır.

7. **Kullanıcı Arayüzü (UI) Buton Olaylarının Bağlanması (`app.js`)**:
   - `#addRect` butonuna `click` dinleyicisi eklenir (ekran merkezini hesaplayıp yeni kart ekler).
   - `#saveBtn` butonuna `click` dinleyicisi atanır (`saveToFile` çağrılır).
   - `#loadBtn` butonuna tıklanıldığında gizli `#fileInput`'un tetiklenmesi (`fileInput.click()`) bağlanır.
   - `#fileInput` üzerindeki `change` olayında seçilen dosyanın `loadFromFile` ile okunması dinlenir.

8. **İlk Arka Plan Grid Çizimi (`utils/grid.js` -> `updateGrid`)**:
   - `updateGrid(stage, containerEl)` fonksiyonu çağrılır.
   - Mevcut sahne ölçeği (`1`) ve konumu (`(0, 0)`) dikkate alınarak dinamik bir SVG nokta deseni (`<circle>`) üretilir.
   - Bu SVG verisi Data URL biçimine dönüştürülerek `#container` elemanının `backgroundImage` stiline atanır ve `backgroundPosition` koordinatları ayarlanır.
   - Sayfa, kullanıcının etkileşime girebileceği hazır ve boş bir ızgaralı tuval ile açılmış olur.

---

## 3. Bölüm 2: Projeye Karşılık Gelen Tüm Girdiler (Inputs) ve Üretilen Çıktılar (Outputs)

Aşağıda, kullanıcının veya sistemin ürettiği tüm girdiler madde madde listelenmiş, her bir girdinin sonucunda hangi çıktının nasıl oluşturulduğu detaylandırılmıştır:

### 1. "Kutu Ekle" Butonuna Tıklanması (`#addRect` Click)
- **Girdi:** Kullanıcının araç çubuğundaki "Kutu Ekle" düğmesine fareyle sol tıklaması.
- **Üretilen Çıktı:** Sahnenin o anki görünüm alanının (viewport) tam ortasında varsayılan boyutlarda (`160x80 px`), beyaz zeminli, gölgeli ve içinde `"Start Writing!"` yazısı bulunan yeni bir kart bileşeni (`Konva.Group`) oluşturulur ve ekranda belirir.
- **Çıktının Nasıl Üretildiği:**
  - `stage.scaleX()`, `stage.x()`, `stage.y()`, `window.innerWidth` ve `window.innerHeight` değerleri okunarak ekranın merkezine karşılık gelen sahne koordinatları `(centerX, centerY)` hesaplanır.
  - `createCard(centerX - 80, centerY - 40)` çağrılır.
  - `createCardFactory` içinde bir `Konva.Group`, `Konva.Rect` ve `Konva.Text` oluşturulup gruba eklenir.
  - `generateCardId()` ile karta benzersiz bir `cardId` atanır.
  - Kartın 4 kenarına `setupCardPorts` ile bağlantı portları eklenir.
  - `autoFitGroupToText` ile kart metnine göre boyutlandırma yapılır ve katman `layer.draw()` ile yeniden çizilir.

---

### 2. "Kaydet (.mycanvas)" Butonuna Tıklanması (`#saveBtn` Click)
- **Girdi:** Araç çubuğundaki "Kaydet (.mycanvas)" düğmesine tıklanması.
- **Üretilen Çıktı:** Tarayıcı, sahnenin güncel durumunu içeren `canvas_{zamanDamgasi}.mycanvas` isimli JSON yapısındaki bir dosyayı otomatik olarak kullanıcının bilgisayarına indirir.
- **Çıktının Nasıl Üretildiği:**
  - `saveToFile(stage, connectionManager)` çağrılır.
  - Sahnedeki tüm `.shape` grupları taranır; her kartın `cardId`, `x`, `y`, `width`, `height`, `rotation` ve `text` değerleri toplanır.
  - `stage.scaleX()`, `stage.x()` ve `stage.y()` değerleri ile sahnenin konumu/ölçeği kaydedilir.
  - `connectionManager.serialize()` çağrılarak mevcut tüm bağlantıların ID, başlangıç kartı (`from`) ve hedef kartı (`to`) bilgileri alınır.
  - Tüm bu veri `JSON.stringify` ile serileştirilip bir `Blob` nesnesine (`application/json`) dönüştürülür.
  - Geçici bir `<a>` elemanı oluşturularak `URL.createObjectURL(blob)` ile indirme tetiklenir (`a.click()`) ve URL bellekten temizlenir.

---

### 3. "Dosya Aç (.mycanvas)" Butonuna Tıklanması ve Dosya Seçimi (`#loadBtn` Click & `#fileInput` Change)
- **Girdi:** Kullanıcının "Dosya Aç (.mycanvas)" butonuna tıklaması, açılan sistem dosya seçicisinden geçerli bir `.mycanvas` dosyası seçmesi.
- **Üretilen Çıktı:** Sahne üzerindeki mevcut tüm kartlar ve bağlantılar tamamen temizlenir; seçilen dosyadaki kartlar, metinler, boyutlar, bağlantı okları ve sahnenin zoom/kaydırma konumu eksiksiz olarak tuvale geri yüklenir.
- **Çıktının Nasıl Üretildiği:**
  - `#loadBtn` tıklanınca gizli `#fileInput` tetiklenir (`fileInput.click()`).
  - Dosya seçildiğinde `change` olayı tetiklenir ve dosya `loadFromFile(...)` fonksiyonuna gönderilir.
  - `FileReader` dosyayı metin olarak okur ve `JSON.parse` ile nesneye dönüştürür.
  - Transformer temizlenir (`tr.nodes([])`), `connectionManager.clearAll()` ile eski bağlantılar yok edilir ve mevcut `.shape` grupları sahneden kaldırılır (`destroy()`).
  - Dosyadaki `stage` bilgisiyle sahne konumu ve ölçeği güncellenir.
  - `data.items` dizisi döngüye alınarak her kart `createCard` ile oluşturulur ve eski `cardId` değeri gruba yeniden atanır.
  - `connectionManager.deserialize(data.connections)` çağrılarak kartlar arasındaki tüm yönlü oklar (`Konva.Arrow`) doğru kesişim koordinatlarıyla yeniden oluşturulur.
  - Katman çizilir (`layer.draw()`) ve arka plan ızgarası güncellenir. Hatalı dosyalarda kullanıcıya `alert('Geçersiz dosya biçimi!')` uyarısı verilir.

---

### 4. Fare Tekerleğinin Döndürülmesi (`wheel` Olayı)
- **Girdi:** Kullanıcının tuval üzerindeyken fare tekerleğini ileri veya geri kaydırması.
- **Üretilen Çıktı:** Tuval, imlecin bulunduğu nokta sabit kalacak (odak noktası olacak) şekilde pürüzsüzce yakınlaşır (zoom in) veya uzaklaşır (zoom out); arka plandaki nokta ızgarası da dinamik olarak ölçeklenir ve opaklığı ayarlanır.
- **Çıktının Nasıl Üretildiği:**
  - `canvas/zoomAndPan.js` içindeki `stage.on('wheel')` dinleyicisi tetiklenir.
  - Varsayılan tarayıcı kaydırması `e.evt.preventDefault()` ile engellenir.
  - İmlecin sahne koordinatlarındaki karşılığı `mousePointTo` hesaplanır.
  - Tekerlek yönüne göre (`deltaY < 0 ? 1 : -1`) sahne ölçeği `scaleBy = 1.08` çarpanı ile artırılır veya azaltılır (sınırlar: `0.1` ile `20` arası).
  - İmleç altındaki noktanın görsel olarak kaymaması için sahnenin `(x, y)` konumu yeniden hesaplanır (`stage.position(...)`).
  - `updateGrid(stage, containerEl)` çalıştırılarak SVG nokta ızgarasının boyutu (`scaledStep`) ve uzaklaşma durumunda opaklığı (`opacity`) güncellenir.

---

### 5. Boş Alandan Fareyle Sürükleme Yapılması (Sahne Pan / Sürükleme)
- **Girdi:** Kullanıcının boş bir alanda farenin sol tuşuna basılı tutarak imleci hareket ettirmesi.
- **Üretilen Çıktı:** Tüm çalışma alanı (sahne ve üzerindeki tüm nesneler) farenin hareket ettiği yönde serbestçe kaydırılır (pan yapılır); arka plandaki nokta deseni sahneyle kusursuz bir senkronizasyonla kayar.
- **Çıktının Nasıl Üretildiği:**
  - `stage` nesnesi `draggable: true` olarak yapılandırıldığından Konva sahnesi sürüklenir.
  - Sürükleme boyunca `dragmove` olayı tetiklenir.
  - `requestAnimationFrame` ve `ticking` bayrağı kullanılarak performans optimize edilir; her karede `updateGrid(stage, containerEl)` çağrılır.
  - `updateGrid` içinde sahne pozisyonunun ızgara adımına göre modüler ofsetleri (`pos.x % scaledStep`, `pos.y % scaledStep`) hesaplanıp `#container`'ın `backgroundPosition` stiline atanır.

---

### 6. Tarayıcı Penceresinin Boyutlandırılması (`window resize`)
- **Girdi:** Tarayıcı pencere boyutunun büyütülmesi, küçültülmesi veya ekranın tam ekran yapılması.
- **Üretilen Çıktı:** Çizim alanı beyaz/gri boşluk kalmadan yeni pencere boyutuna genişler veya daralır; ızgara tüm ekrana kesintisiz yayılır.
- **Çıktının Nasıl Üretildiği:**
  - `window.addEventListener('resize')` olayı tetiklenir.
  - `stage.width(window.innerWidth)` ve `stage.height(window.innerHeight)` ile sahne pikselleri güncellenir.
  - `updateGrid(stage, containerEl)` çağrılarak arka plan deseninin yeni pencere boyutlarına uyumu sağlanır.

---

### 7. Kartın Üzerine Tıklanması (`stage click / tap` on Card)
- **Girdi:** Sahnedeki bir kartın üzerine sol fare tuşu ile tek tıklama yapılması.
- **Üretilen Çıktı:** Kartın etrafında mavi renkli bir seçim çerçevesi ve 4 köşesinde boyutlandırma tutamaçları (Transformer) belirir.
- **Çıktının Nasıl Üretildiği:**
  - `stage.on('click tap')` tetiklenir.
  - Tıklanan elemanın atası olan `.shape` grubu tespit edilir (`e.target.findAncestor('.shape')`).
  - Bulunan grup nesnesi `tr.nodes([targetGroup])` çağrısıyla Transformer'a atanır.
  - `layer.draw()` ile seçim çerçevesi ekranda görünür hale gelir.

---

### 8. Boş Alana Tıklanması (`stage click / tap` on Empty Canvas)
- **Girdi:** Herhangi bir kartın veya kontrolün olmadığı boş sahne zeminine tıklanması.
- **Üretilen Çıktı:** Seçili olan kartın etrafındaki Transformer seçim çerçevesi kaybolur (seçim kaldırılır).
- **Çıktının Nasıl Üretildiği:**
  - `stage.on('click tap')` olayı tetiklendiğinde `e.target === stage` koşulu sağlanır.
  - `tr.nodes([])` çağrılarak seçim boşaltılır ve `layer.draw()` ile sahne yeniden çizilir.

---

### 9. Kartın Sürüklenip Taşınması (Card Drag & Drop)
- **Girdi:** Bir kartın gövdesine basılı tutularak sahne üzerinde başka bir noktaya sürüklenip bırakılması.
- **Üretilen Çıktı:** Kart yeni konumuna taşınır; karta bağlı olan tüm giriş ve çıkış bağlantı okları sürükleme anında canlı olarak kartın kenarlarına yapışık kalacak şekilde güncellenir.
- **Çıktının Nasıl Üretildiği:**
  - Kart grubu `draggable: true` özelliğine sahiptir.
  - Sürükleme esnasında grubun `dragmove` olayı tetiklenir.
  - `connectionManager.updateConnectionsForCard(getCardId(group))` çağrılır.
  - Bu çağrı, karta bağlı tüm bağlantıları bulup `getEdgeIntersectionPoints` algoritması ile iki kartın güncel merkez ve kenar sınırlarını hesaplar ve `arrow.points([startX, startY, endX, endY])` koordinatlarını güncelleyip katmanı `batchDraw()` ile yeniden çizer.

---

### 10. Kart Boyutlandırma Tutamaçlarının Sürüklenmesi (Transformer Resize)
- **Girdi:** Seçili kartın köşe tutamaçlarından birine basılı tutularak kartın boyutunun değiştirilmesi.
- **Üretilen Çıktı:** Kartın genişlik ve yüksekliği dinamik olarak değişir, minimum boyut sınırlarının altına inmesi engellenir (`140x70 px`), metin alanı ve bağlantı portları yeni kart boyutlarına göre otomatik olarak yeniden konumlandırılır; bağlı oklar güncellenir.
- **Çıktının Nasıl Üretildiği:**
  - Kart grubunun `transform` ve `transformend` olayları tetiklenir.
  - Boyutlandırma bittiğinde grubun `scaleX()` ve `scaleY()` değerleri okunur.
  - `Math.max(MIN_WIDTH, rect.width() * scaleX)` ve `Math.max(MIN_HEIGHT, rect.height() * scaleY)` formülleriyle yeni genişlik ve yükseklik hesaplanarak `rect` ve `text` nesnelerine uygulanır.
  - Grubun ölçeği tekrar `1`'e sıfırlanır (`scaleX(1)`, `scaleY(1)`).
  - `autoFitGroupToText(group)` ve `updatePortPositions(group)` çağrılarak portlar kartın yeni kenar merkezlerine taşınır.
  - `connectionManager.updateConnectionsForCard` ile bağlantı oklarının uçları yeni kenar koordinatlarına çekilir.

---

### 11. Kartın Üzerine Fareyle Gelme ve Ayrılma (Card Mouse Enter / Leave)
- **Girdi:** Fare imlecinin kartın üzerine getirilmesi (`mouseenter`) veya kartın dışına çıkarılması (`mouseleave`).
- **Üretilen Çıktı:** Kartın üzerine gelindiğinde 4 kenarında mavi renkli bağlantı noktaları (port daireleri) görünür hale gelir; fare karttan ayrıldığında (eğer aktif bir çizgi çekme işlemi yoksa) portlar tekrar gizlenir.
- **Çıktının Nasıl Üretildiği:**
  - `cards/ports.js` içindeki `mouseenter` olayı kartın içindeki `portsGroup.visible(true)` yapar ve `layer.batchDraw()` çağırır.
  - `mouseleave` olayında ise `getTempLine()` kontrol edilir; eğer o an aktif bir bağlantı çekilmiyorsa `portsGroup.visible(false)` yapılır.

---

### 12. Kart Bağlantı Portundan Sürükleme Başlatılması (Port `mousedown` / `touchstart`)
- **Girdi:** Kartın kenarındaki 4 dairesel porttan birine sol fare tuşu veya dokunmatik ile basılması.
- **Üretilen Çıktı:** Sahnenin kaydırılması (drag) geçici olarak kilitlenir; portun merkezinden başlayan mavi renkli, kesikli (dashed) geçici bir bağlantı oku görünür.
- **Çıktının Nasıl Üretildiği:**
  - `cards/ports.js` içindeki port çemberine ait `mousedown` dinleyicisi çalışır.
  - `e.cancelBubble = true` ile olayın sahneye yayılması engellenir.
  - `stage.draggable(false)` yapılarak sahnenin sürüklenmesi durdurulur.
  - Kaynak kart `setDragSourceGroup(group)` ile kaydedilir.
  - Portun mutlak ekran konumu sahne ölçeği ve koordinatlarına dönüştürülür.
  - `createTempLine(startX, startY)` çağrılarak katmana `dash: [4, 4]` özellikli geçici bir `Konva.Arrow` eklenir.

---

### 13. Geçici Bağlantı Oku Çekilirken Farenin Hareketi (`window mousemove`)
- **Girdi:** Porttan basılı tutularak farenin sahne üzerinde gezdirilmesi.
- **Üretilen Çıktı:** Kesikli geçici bağlantı oku, başlangıç portundan farenin güncel imleç konumuna kadar uzanır ve fareyi canlı olarak takip eder.
- **Çıktının Nasıl Üretildiği:**
  - `connections/mouseEvents.js` modülündeki global `mousemove` dinleyicisi tetiklenir.
  - Eğer `tempLine` mevcutsa ve `stage.draggable()` kapalıysa; `e.clientX` ve `e.clientY` koordinatları sahne uzayına çevrilir (`(clientX - stage.x()) / scale`).
  - `tempLine.points([startX, startY, mouseX, mouseY])` güncellenir ve `layer.batchDraw()` ile ekran tazelenir.

---

### 14. Geçici Bağlantı Okunun Başka Bir Kartın Üzerine Bırakılması (`window mouseup` on Card)
- **Girdi:** Porttan çekilen okun ucunun hedef bir kartın üzerindeyken farenin sol tuşunun bırakılması.
- **Üretilen Çıktı:** Geçici kesikli ok kaybolur; iki kartın kenarlarını birbirine bağlayan kalıcı, mavi, yönlü bir bağlantı oku (`Konva.Arrow`) oluşturulur ve kartların arkasına yerleştirilir. (Eğer iki kart arasında zaten bir bağlantı varsa veya hedef kart kaynak kartın kendisiyse yeni bağlantı kurulmaz).
- **Çıktının Nasıl Üretildiği:**
  - `connections/mouseEvents.js` içindeki `mouseup` olayı çalışır ve `stage.draggable(true)` tekrar aktif edilir.
  - `stage.getIntersection({ x: e.clientX, y: e.clientY })` ile farenin bırakıldığı noktadaki Konva düğümü aranır.
  - Hedef düğümün bağlı olduğu kart grubu (`targetGroup`) bulunur.
  - Hedef grup geçerliyse ve kaynak karttan farklıysa `connectionManager.createConnection(dragSourceGroup, targetGroup)` çağrılır.
  - `hasConnection` kontrolü yapılarak çift bağlantı engellenir.
  - `getEdgeIntersectionPoints` ile kart sınırları hesaplanarak yeni `Konva.Arrow` üretilir, `connectionId` atanır ve `arrow.moveToBottom()` ile kartların altına itilir.
  - `cleanupTempLine()` çağrılarak geçici ok bellekten ve sahneden silinir.

---

### 15. Geçici Bağlantı Okunun Boş Bir Alana Bırakılması (`window mouseup` on Empty Space)
- **Girdi:** Porttan çekilen okun ucunun sahnedeki herhangi bir kartın olmadığı boş bir noktada bırakılması.
- **Üretilen Çıktı:** Farenin bırakıldığı noktada üzerinde **"+ Kutucuk Ekle"** yazan mavi, gölgeli hızlı bir buton (popup grubu) belirir.
- **Çıktının Nasıl Üretildiği:**
  - `mouseup` sırasında hedefte herhangi bir kart bulunamadığında (`!targetGroup`) `showAddCardPopup(...)` fonksiyonu çağrılır.
  - Fonksiyon, canvas koordinatlarında `quickAddPopup` isimli bir `Konva.Group` (arkasında yuvarlatılmış dikdörtgen, üzerinde "+ Kutucuk Ekle" metni) oluşturur ve katmana ekler.
  - Kullanıcı fareyi butonun üzerine getirdiğinde imleç el işaretine (`cursor: pointer`) dönüşür.
  - Sayfaya bir defalık global `pointerdown` dinleyicisi eklenerek butonun dışına tıklandığında popup'ın kapanması ve geçici çizginin temizlenmesi güvenceye alınır.

---

### 16. Hızlı "+ Kutucuk Ekle" Popup Butonuna Tıklanması
- **Girdi:** Açılan "+ Kutucuk Ekle" butonunun üzerine tıklanması.
- **Üretilen Çıktı:** Butonun bulunduğu noktada yeni bir kart oluşturulur, kaynak karttan bu yeni karta otomatik olarak kalıcı bir bağlantı oku çekilir ve popup butonu kaybolur.
- **Çıktının Nasıl Üretildiği:**
  - Popup grubunun `click / tap` dinleyicisi çalışır.
  - `e.cancelBubble = true` ile sahne seçim temizleme olayı engellenir.
  - `createCardFn(canvasX - 70, canvasY - 35)` çağrılarak tam o noktada yeni kart üretilir.
  - `connectionManager.createConnection(sourceGroup, newCard)` ile kaynak kart doğrudan bu yeni karta bağlanır.
  - `cleanupTempLine()` ve `removeAddCardPopup()` çağrılarak buton sahneden silinir.

---

### 17. Bağlantı Okuna Sağ Tıklanması (`contextmenu` on Connection Arrow)
- **Girdi:** Sahnedeki herhangi bir bağlantı okunun çizgisine veya ucuna farenin sağ tuşu ile tıklanması.
- **Üretilen Çıktı:** Tarayıcının varsayılan bağlam menüsü engellenir; tıklanan bağlantı oku sahneden anında silinir ve bağlantı listesinden çıkarılır.
- **Çıktının Nasıl Üretildiği:**
  - `canvas/events/contextMenu.js` içindeki `stage.on('contextmenu')` dinleyicisi tetiklenir.
  - `e.evt.preventDefault()` ile tarayıcı menüsü durdurulur.
  - Tıklanan elemanın adı kontrol edilir (`e.target.hasName('connection')`).
  - `connectionManager.getConnectionByArrow(arrow)` ile ilgili bağlantı nesnesi bulunur.
  - `connectionManager.removeConnectionById(conn.id)` çalıştırılarak ok nesnesi yok edilir (`arrow.destroy()`), bağlantı diziden çıkarılır ve katman `layer.batchDraw()` ile yeniden çizilir.

---

### 18. Karta Çift Tıklanması (`dblclick` / `dbltap` on Card)
- **Girdi:** Kartın üzerine farenin sol tuşuyla hızlıca iki kez tıklanması veya dokunmatik ekranda çift dokunulması.
- **Üretilen Çıktı:** Kartın içindeki mevcut metin ve arka plan gizlenir; kartın tam üstüne ve aynı görsel boyutlara/stiline sahip, düzenlenebilir bir HTML `<textarea>` giriş alanı açılır ve imleç metnin sonuna odaklanır.
- **Çıktının Nasıl Üretildiği:**
  - `cards/textEditor.js` içindeki `group.on('dblclick dbltap')` dinleyicisi tetiklenir.
  - Transformer seçimi iptal edilir (`tr.nodes([])`).
  - Sahne ölçeği, kartın mutlak pozisyonu ve boyutları hesaplanır.
  - `document.createElement('textarea')` ile dinamik bir DOM elemanı üretilir ve `document.body`'ye eklenir.
  - CSS stilleri (font boyutu, satır yüksekliği, renk, dolgu) sahne ölçeğiyle (`stageScale`) çarpılarak ayarlanır ve kartın tam üstüne mutlak (`absolute`) pozisyonlanır.
  - Kartın kendi `Konva.Text` ve `Konva.Rect` düğümleri gizlenir (`hide()`) ve katman çizilir.

---

### 19. Metin Alanına Yazı Yazılması (`textarea input`)
- **Girdi:** Açık olan metin kutusuna klavyeden yeni karakterler yazılması veya silinmesi.
- **Üretilen Çıktı:** Metin kutusunun yüksekliği içeriğe bağlı olarak dikeyde otomatik genişler veya daralır.
- **Çıktının Nasıl Üretildiği:**
  - `textarea.addEventListener('input')` tetiklenir.
  - `textarea.style.height` değeri önce `'auto'` yapılır, ardından `textarea.scrollHeight` ve `MIN_HEIGHT * stageScale` değerlerinin büyüğüne eşitlenerek dinamik dikey büyüme sağlanır.

---

### 20. Metin Düzenlemesinin Onaylanması (`Enter` Tuşu veya Dışarıya Tıklama)
- **Girdi:** Metin düzenlenirken klavyeden `Enter` tuşuna basılması (Shift olmadan) veya metin alanı dışındaki herhangi bir yere tıklanması.
- **Üretilen Çıktı:** DOM `<textarea>` elemanı kaldırılır; kartın metni güncellenir, kartın boyutları metnin uzunluğuna ve satır sayısına göre otomatik olarak (`autoFitGroupToText`) yeniden boyutlandırılır, bağlantı portları ve bağlı tüm oklar yeni boyutlara göre senkronize edilir.
- **Çıktının Nasıl Üretildiği:**
  - `textarea` üzerindeki `keydown` olayında `e.keyCode === 13 && !e.shiftKey` koşulu veya `window` üzerindeki `handleOutsideClick` kontrolü tetiklenir.
  - `textNode.text(textarea.value)` ile Konva metin nesnesi güncellenir.
  - `autoFitGroupToText(group)` çalıştırılır; `textNode.measureSize(...)` ile metnin yeni piksel genişlik/yükseklik değerleri ölçülür ve `rect` ile `text` minimum sınırlar (`MIN_WIDTH: 140`, `MIN_HEIGHT: 70`) gözetilerek genişletilir.
  - `updatePortPositions(group)` portları yeni kenarlara taşır.
  - `connectionManager.updateConnectionsForCard` çağrılarak karta bağlı tüm okların uçları yeni boyut sınırlarına oturtulur.
  - `textarea` DOM'dan kaldırılır (`removeChild`), kartın orijinal `Rect` ve `Text` düğümleri tekrar görünür kılınır (`show()`) ve sahne yeniden çizilir.

---

### 21. Metin Düzenlemesinin İptal Edilmesi (`Escape` Tuşu)
- **Girdi:** Metin kutusu açıkken klavyeden `Escape` (`Esc`) tuşuna basılması.
- **Üretilen Çıktı:** Yapılan değişiklikler uygulanmadan metin kutusu kapatılır; kart önceki boyut ve metin içeriğiyle sahneye geri döner.
- **Çıktının Nasıl Üretildiği:**
  - `textarea.addEventListener('keydown')` içinde `e.keyCode === 27` kontrolü devreye girer.
  - Değer aktarımı yapılmadan doğrudan `removeTextarea()` fonksiyonu çalıştırılır.
  - `textarea` DOM'dan silinir, kartın gizlenen `Text` ve `Rect` düğümleri tekrar gösterilir (`show()`) ve `layer.draw()` çağrılır.
