// connections/popup.js
// DEBUG: Çizgi boş alana bırakıldığında açılan Hızlı Kutucuk Ekle butonu (Konva grubu).

import { stage, layer } from '../canvas/stage.js';
import { cleanupTempLine } from './tempLine.js';

let popupGroup = null;

export function showAddCardPopup(screenX, screenY, canvasX, canvasY, sourceGroup, createCardFn, connectionManager) {
  removeAddCardPopup(); // Varsa eskisini kaldır

  const label = '+ Kutucuk Ekle';
  const fontSize = 14;
  const paddingX = 12;
  const paddingY = 8;
  const fontFamily = 'sans-serif';

  // Metin boyutunu ölçmek için geçici bir Konva.Text kullan
  const measure = new Konva.Text({ text: label, fontSize, fontFamily, fontStyle: 'bold' });
  const width = measure.width() + paddingX * 2;
  const height = measure.height() + paddingY * 2;
  measure.destroy();

  // Konum canvas uzayındadır (screen değil); stage pan/zoom'una otomatik uyar
  const group = new Konva.Group({
    name: 'quickAddPopup',
    x: canvasX,
    y: canvasY,
  });

  const rect = new Konva.Rect({
    width,
    height,
    fill: '#553353',
    cornerRadius: 6,
    shadowColor: 'rgba(0,0,0,0.25)',
    shadowBlur: 10,
    shadowOffsetY: 4,
  });

  const text = new Konva.Text({
    text: label,
    fontSize,
    fontFamily,
    fontStyle: 'bold',
    fill: '#ffffff',
    x: paddingX,
    y: paddingY,
    listening: false, // Tıklamayı group yakalasın
  });

  group.add(rect);
  group.add(text);

  // Tıklama: yeni kartı oluştur ve bağlantıyı tamamla
  group.on('click tap', (e) => {
    e.cancelBubble = true; // Stage click (seçim temizleme) tetiklenmesin
    const newCard = createCardFn(canvasX - 70, canvasY - 35);
    connectionManager.createConnection(sourceGroup, newCard);
    cleanupTempLine();
    removeAddCardPopup();
  });

  // Fareyi üzerine getirince imleci değiştir
  group.on('mouseenter', () => {
    stage.container().style.cursor = 'pointer';
  });
  group.on('mouseleave', () => {
    stage.container().style.cursor = '';
  });

  layer.add(group);
  popupGroup = group;
  layer.batchDraw();

  // Dışarı tıklandığında iptal et. Sonraki pointerdown ile kaydediyoruz;
  // böylece popup'ı oluşturan jestin bitmesi beklenir (tıklama yutulması önlenir).
  requestAnimationFrame(() => {
    const onPointerDown = (e) => {
      // Popup üzerinde basıldıysa iptal etme
      if (e.target && e.target.findAncestor('.quickAddPopup', true)) return;
      window.removeEventListener('pointerdown', onPointerDown, true);
      removeAddCardPopup();
    };
    window.addEventListener('pointerdown', onPointerDown, true);
  });
}

export function removeAddCardPopup() {
  if (popupGroup) {
    popupGroup.destroy();
    popupGroup = null;
    stage.container().style.cursor = '';
    layer.batchDraw();
    cleanupTempLine();
  }
}