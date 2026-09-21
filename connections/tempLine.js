// connections/tempLine.js
// DEBUG: Sürükleme esnasında gösterilen geçici kesikli bağlantı çizgisinin yönetimi.

import { layer } from '../canvas/stage.js';

let tempLine = null;
let dragSourceGroup = null;

export function getTempLine() {
  return tempLine;
}

export function getDragSourceGroup() {
  return dragSourceGroup;
}

export function setDragSourceGroup(group) {
  dragSourceGroup = group;
}

export function createTempLine(startX, startY) {
  tempLine = new Konva.Arrow({
    points: [startX, startY, startX, startY],
    stroke: '#3182ce',
    strokeWidth: 2,
    fill: '#3182ce',
    pointerLength: 8,
    pointerWidth: 8,
    dash: [4, 4],
    listening: false
  });
  layer.add(tempLine);
}

export function cleanupTempLine() {
  if (tempLine) {
    tempLine.destroy();
    tempLine = null;
  }
  dragSourceGroup = null;
  layer.batchDraw();
}