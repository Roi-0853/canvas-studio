// storage/fileSaver.js
// DEBUG: Mevcut sahne durumunu ve bağlantıları `.mycanvas` uzantısıyla kaydetme işlevi.

export function saveToFile(stage, connectionManager) {
  const shapes = stage.find('.shape');

  const exportData = {
    version: '1.1',
    stage: {
      scale: stage.scaleX(),
      x: stage.x(),
      y: stage.y()
    },
    items: shapes.map(group => {
      const rect = group.findOne('Rect');
      const text = group.findOne('Text');
      return {
        id: group.getAttr('cardId'), // Bağlantılar bu id ile referans verir
        x: group.x(),
        y: group.y(),
        width: rect.width(),
        height: rect.height(),
        rotation: group.rotation() || 0, // Rotasyonu da kaydediyoruz
        text: text.text()
      };
    }),
    // Bağlantılar (oklar) ayrı bir dizide saklanır.
    connections: connectionManager ? connectionManager.serialize() : []
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `canvas_${Date.now()}.mycanvas`;
  a.click();
  URL.revokeObjectURL(url);
}