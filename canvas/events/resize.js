// canvas/events/resize.js
// DEBUG: Tarayıcı pencere boyutu değiştiğinde Sahneyi ve Grid'i yeniden boyutlandırma.

import { stage, containerEl } from '../stage.js';
import { updateGrid } from '../../utils/grid.js';

export function setupResizeEvent() {
  window.addEventListener('resize', () => {
    stage.width(window.innerWidth);
    stage.height(window.innerHeight);
    updateGrid(stage, containerEl);
  });
}