// app.js
// DEBUG: Tüm modülleri import edip uygulamayı ilklendiren ana dosya.

import { updateGrid } from './utils/grid.js';
import { saveToFile } from './storage/fileSaver.js';
import { loadFromFile } from './storage/fileLoader.js';
import { ConnectionManager } from './connections/connectionManager.js';
import { stage, layer, tr, containerEl } from './canvas/stage.js';
import './canvas/zoomAndPan.js';
import { setupContextMenu } from './canvas/events/contextMenu.js';
import { setupResizeEvent } from './canvas/events/resize.js';
import { createCardFactory } from './cards/cardFactory.js';
import { setupConnectionMouseEvents } from './connections/mouseEvents.js';

// 1. Bağlantı Yöneticisini Başlat
const connectionManager = new ConnectionManager(layer);

// 2. Kart Üretici Fonksiyonu Oluştur
export const createCard = createCardFactory(connectionManager);

// 3. Etkinlik Dinleyicilerini Kur
setupContextMenu(connectionManager);
setupResizeEvent();
setupConnectionMouseEvents(connectionManager, createCard);

// 4. UI Buton Bağlantıları
document.getElementById('addRect').addEventListener('click', () => {
  const stageScale = stage.scaleX();
  const centerX = (-stage.x() + window.innerWidth / 2) / stageScale;
  const centerY = (-stage.y() + window.innerHeight / 2) / stageScale;
  createCard(centerX - 80, centerY - 40);
});

document.getElementById('saveBtn').addEventListener('click', () => saveToFile(stage, connectionManager));

const fileInput = document.getElementById('fileInput');
document.getElementById('loadBtn').addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    loadFromFile(file, stage, layer, tr, createCard, () => updateGrid(stage, containerEl), connectionManager);
    fileInput.value = '';
  }
});

// 5. İlk Arka Plan Grid Çizimi
updateGrid(stage, containerEl);