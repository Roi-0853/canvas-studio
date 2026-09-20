// filesystem.js

export function saveToFile(stage) {
  const shapes = stage.find('.shape');
  
  const exportData = {
    version: '1.0',
    stage: {
      scale: stage.scaleX(),
      x: stage.x(),
      y: stage.y()
    },
    items: shapes.map(group => {
      const rect = group.findOne('Rect');
      const text = group.findOne('Text');
      return {
        x: group.x(),
        y: group.y(),
        width: rect.width(),
        height: rect.height(),
        rotation: group.rotation() || 0, // Rotasyonu da kaydediyoruz
        text: text.text()
      };
    })
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `canvas_${Date.now()}.mycanvas`;
  a.click();
  URL.revokeObjectURL(url);
}

export function loadFromFile(file, stage, layer, tr, createCardFn, updateGridFn) {
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);

      // Hayalet Transformer çizgilerini temizle
      if (tr) {
        tr.nodes([]);
      }

      // Mevcut sahneyi temizle
      const existingShapes = stage.find('.shape');
      existingShapes.forEach(shape => shape.destroy());

      if (data.stage) {
        stage.scale({ x: data.stage.scale, y: data.stage.scale });
        stage.position({ x: data.stage.x, y: data.stage.y });
      }

      if (Array.isArray(data.items)) {
        data.items.forEach(item => {
          createCardFn(item.x, item.y, item.width, item.height, item.text, item.rotation || 0);
        });
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