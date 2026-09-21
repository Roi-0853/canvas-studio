// cards/ports.js
// DEBUG: Kartların 4 kenarındaki bağlantı noktalarının (yuvarlak portlar) yönetimi.

import { stage, layer } from '../canvas/stage.js';
import { createTempLine, getTempLine, setDragSourceGroup } from '../connections/tempLine.js';

export function setupCardPorts(group) {
  const rect = group.findOne('Rect');
  
  // 4 Taraf İçin Nokta Oluştur
  const portsData = [
    { name: 'right', getPos: (w, h) => ({ x: w, y: h / 2 }) },
    { name: 'left', getPos: (w, h) => ({ x: 0, y: h / 2 }) },
    { name: 'bottom', getPos: (w, h) => ({ x: w / 2, y: h }) },
    { name: 'top', getPos: (w, h) => ({ x: w / 2, y: 0 }) },
  ];

  const portGroup = new Konva.Group({ name: 'portsGroup', visible: false });

  portsData.forEach(p => {
    const circle = new Konva.Circle({
      radius: 6,
      fill: '#3182ce',
      stroke: '#ffffff',
      strokeWidth: 2,
      name: `port-${p.name}`,
      cursor: 'crosshair'
    });

    // Sürükleme Başlangıcı
    circle.on('mousedown touchstart', (e) => {
      e.cancelBubble = true; // Stage drag'ini engelle
      stage.draggable(false);
      setDragSourceGroup(group);

      const stageScale = stage.scaleX();
      const pos = circle.absolutePosition();
      const startX = (pos.x - stage.x()) / stageScale;
      const startY = (pos.y - stage.y()) / stageScale;

      createTempLine(startX, startY);
    });

    portGroup.add(circle);
  });

  group.add(portGroup);
  updatePortPositions(group);

  // Hover Durumunda Noktaları Göster
  group.on('mouseenter', () => {
    portGroup.visible(true);
    layer.batchDraw();
  });

  group.on('mouseleave', () => {
    if (!getTempLine()) {
      portGroup.visible(false);
      layer.batchDraw();
    }
  });
}

export function updatePortPositions(group) {
  const rect = group.findOne('Rect');
  const portGroup = group.findOne('.portsGroup');
  if (!rect || !portGroup) return;

  const w = rect.width();
  const h = rect.height();

  const right = portGroup.findOne('.port-right');
  const left = portGroup.findOne('.port-left');
  const bottom = portGroup.findOne('.port-bottom');
  const top = portGroup.findOne('.port-top');

  if (right) right.position({ x: w, y: h / 2 });
  if (left) left.position({ x: 0, y: h / 2 });
  if (bottom) bottom.position({ x: w / 2, y: h });
  if (top) top.position({ x: w / 2, y: 0 });
}