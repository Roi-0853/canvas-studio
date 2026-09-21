// connections/mouseEvents.js
// DEBUG: Fare hareketleri ile çizgi uzatma ve fare bırakıldığında bağlantı tamamlama.

import { stage, layer } from '../canvas/stage.js';
import { getTempLine, getDragSourceGroup, cleanupTempLine } from './tempLine.js';
import { showAddCardPopup } from './popup.js';

export function setupConnectionMouseEvents(connectionManager, createCardFn) {
  // Canlı Sürükleme Esnasında Çizgiyi Güncelle
  // connections/mouseEvents.js

 // connections/mouseEvents.js

  window.addEventListener('mousemove', (e) => {
    const tempLine = getTempLine();
    
    if (!tempLine || stage.draggable()) return; 

    const stageScale = stage.scaleX();
    const mouseX = (e.clientX - stage.x()) / stageScale;
    const mouseY = (e.clientY - stage.y()) / stageScale;

    const points = tempLine.points();
    tempLine.points([points[0], points[1], mouseX, mouseY]);
    layer.batchDraw();
  });
  
  // Sürükleme Bittiğinde
  window.addEventListener('mouseup', (e) => {
    const tempLine = getTempLine();
    const dragSourceGroup = getDragSourceGroup();
    if (!tempLine || !dragSourceGroup) return;

    stage.draggable(true);
    const stageScale = stage.scaleX();
    const dropX = (e.clientX - stage.x()) / stageScale;
    const dropY = (e.clientY - stage.y()) / stageScale;

    // Bırakılan Yerde Başka Bir Kart Var mı?
    const targetNode = stage.getIntersection({ x: e.clientX, y: e.clientY });
    const targetGroup = targetNode ? targetNode.findAncestor('.shape') || (targetNode.hasName('shape') ? targetNode : null) : null;

    if (targetGroup && targetGroup !== dragSourceGroup) {
      // Mevcut Kutuya Bağla
      connectionManager.createConnection(dragSourceGroup, targetGroup);
      cleanupTempLine();
    } else if (!targetGroup) {
      // Boşluğa Bırakıldı: "Kutucuk Ekle" Butonu Aç
      showAddCardPopup(e.clientX, e.clientY, dropX, dropY, dragSourceGroup, createCardFn, connectionManager);
    } else {
      cleanupTempLine();
    }
  });
}