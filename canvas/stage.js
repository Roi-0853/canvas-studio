// canvas/stage.js
// DEBUG: Ana Konva Stage, Layer ve Transformer nesnelerinin ilklendirilmesi.

import { CONTAINER_ID } from '../constants.js';

export const containerEl = document.getElementById(CONTAINER_ID);

export const stage = new Konva.Stage({
  container: CONTAINER_ID,
  width: window.innerWidth,
  height: window.innerHeight,
  draggable: true,
});

export const layer = new Konva.Layer();
stage.add(layer);

// Transformer: Sadece Boyutlandırma (Rotasyon Tamamen Kaldırıldı)
export const tr = new Konva.Transformer({
  anchorFill: '#ffffff',
  anchorStroke: '#3182ce',
  anchorCornerRadius: 2,
  anchorSize: 8,
  borderStroke: '#3182ce',
  rotateEnabled: false, // DÖNDÜRME KAPATILDI
  enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right']
});
layer.add(tr);

// Tıklama ile Kart Seçimi veya Boşluğa Tıklayıp Seçimi Kaldırma
stage.on('click tap', (e) => {
  if (e.target === stage) {
    tr.nodes([]);
    layer.draw();
    return;
  }
  const targetGroup = e.target.findAncestor('.shape') || (e.target.hasName('shape') ? e.target : null);
  if (targetGroup) {
    tr.nodes([targetGroup]);
    layer.draw();
  }
});