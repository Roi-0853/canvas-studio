// filesystem.js

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

export function loadFromFile(file, stage, layer, tr, createCardFn, updateGridFn, connectionManager) {
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);

      // Hayalet Transformer çizgilerini temizle
      if (tr) {
        tr.nodes([]);
      }

      // Mevcut sahneyi temizle (önce bağlantılar, sonra kartlar).
      if (connectionManager) connectionManager.clearAll();
      const existingShapes = stage.find('.shape');
      existingShapes.forEach(shape => shape.destroy());

      if (data.stage) {
        stage.scale({ x: data.stage.scale, y: data.stage.scale });
        stage.position({ x: data.stage.x, y: data.stage.y });
      }

      if (Array.isArray(data.items)) {
        data.items.forEach(item => {
          const group = createCardFn(item.x, item.y, item.width, item.height, item.text, item.rotation || 0);
          // Kaydedilmiş kart id'sini geri yükle; bağlantılar bu id'lere bağlanır.
          if (group && item.id) group.setAttr('cardId', item.id);
        });
      }

      // Bağlantıları kartlar oluşturulduktan SONRA yükle.
      if (connectionManager && Array.isArray(data.connections)) {
        connectionManager.deserialize(data.connections);
      }

      layer.draw();
      updateGridFn();
    } catch (err) {
      alert('Geçersiz dosya biçimi!');
      console.error(err);
    }
  };

  reader.readAsText(file);
}