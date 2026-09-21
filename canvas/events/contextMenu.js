// canvas/events/contextMenu.js
// DEBUG: Bağlantı oklarının üzerine sağ tıklandığında bağlantıyı silme işlevi.

import { stage } from '../stage.js';

export function setupContextMenu(connectionManager) {
  // Çizgide sağ tık ile silme
  stage.on('contextmenu', (e) => {
    e.evt.preventDefault();
    const arrow = e.target.hasName('connection') ? e.target : null;
    if (arrow) {
      const conn = connectionManager.getConnectionByArrow(arrow);
      if (conn) connectionManager.removeConnectionById(conn.id);
    }
  });
}