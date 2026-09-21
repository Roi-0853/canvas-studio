// connections/popup.js
// DEBUG: Çizgi boş alana bırakıldığında açılan Hızlı Kutucuk Ekle butonu.

import { cleanupTempLine } from './tempLine.js';

export function showAddCardPopup(screenX, screenY, canvasX, canvasY, sourceGroup, createCardFn, connectionManager) {
  removeAddCardPopup(); // Varsa eskisini kaldır

  const btn = document.createElement('button');
  btn.id = 'quick-add-btn';
  btn.innerText = '+ Kutucuk Ekle';
  btn.style.position = 'absolute';
  btn.style.left = `${screenX}px`;
  btn.style.top = `${screenY}px`;
  btn.style.zIndex = '1000';
  btn.style.padding = '8px 12px';
  btn.style.backgroundColor = '#3182ce';
  btn.style.color = '#ffffff';
  btn.style.border = 'none';
  btn.style.borderRadius = '6px';
  btn.style.cursor = 'pointer';
  btn.style.boxShadow = '0 4px 10px rgba(0,0,0,0.15)';
  btn.style.fontWeight = 'bold';

  btn.onclick = () => {
    const newCard = createCardFn(canvasX - 70, canvasY - 35);
    connectionManager.createConnection(sourceGroup, newCard);
    cleanupTempLine();
    removeAddCardPopup();
  };

  document.body.appendChild(btn);

  // Dışarı tıklandığında iptal et
  setTimeout(() => {
    window.addEventListener('click', removeAddCardPopup, { once: true });
  }, 10);
}

export function removeAddCardPopup() {
  const existing = document.getElementById('quick-add-btn');
  if (existing) {
    existing.remove();
    cleanupTempLine();
  }
}