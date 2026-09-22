// canvas/zoomAndPan.js
// DEBUG: Fare tekerleği ile zoom yapma ve sürüklerken arka plan ızgarasını sync etme.

import { stage, containerEl } from './stage.js';
import { updateGrid } from '../utils/grid.js';

const scaleBy = 1.08;

stage.on('wheel', (e) => {
  e.evt.preventDefault();
  const oldScale = stage.scaleX();
  const pointer = stage.getPointerPosition();

  const mousePointTo = {
    x: (pointer.x - stage.x()) / oldScale,
    y: (pointer.y - stage.y()) / oldScale,
  };

  const direction = e.evt.deltaY < 0 ? 1 : -1;
  const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

  if (newScale < 0.1 || newScale > 20) return;

  stage.scale({ x: newScale, y: newScale });
  stage.position({
    x: pointer.x - mousePointTo.x * newScale,
    y: pointer.y - mousePointTo.y * newScale,
  });

  updateGrid(stage, containerEl);
});

let ticking = false;
stage.on('dragmove', () => {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      updateGrid(stage, containerEl);
      ticking = false;
    });
    ticking = true;
  }
});