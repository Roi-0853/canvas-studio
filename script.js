// 1. Sahneyi (Stage) ve Katmanı (Layer) Başlat
let stage = new Konva.Stage({
  container: 'container',
  width: window.innerWidth,
  height: window.innerHeight,
  draggable: true,
});

let layer = new Konva.Layer();
stage.add(layer);

let tr = new Konva.Transformer({
  anchorFill: '#ffffff',
  anchorStroke: '#3182ce',
  anchorCornerRadius: 2,
  anchorSize: 8,
  borderStroke: '#3182ce',
  borderDash: [4, 4],
});
layer.add(tr);

// 2. Noktalı Arka Planı Doğrudan Canvas Pattern Olarak Çizen Katman
const gridLayer = new Konva.Layer({ listening: false });
stage.add(gridLayer);
gridLayer.moveToBottom();

// Bellekte tek bir ızgara hücresi (tile) oluşturalım
const patternCanvas = document.createElement('canvas');
const patternCtx = patternCanvas.getContext('2d');

function updateGrid() {
  const scale = stage.scaleX();
  const pos = stage.position();

  // Temel nokta aralığımız (30px)
  let step = 30;

  // Zoom seviyesine göre adım boyutunu dinamik ayarla
  let scaledStep = step * scale;
  while (scaledStep < 15) scaledStep *= 2;
  while (scaledStep > 60) scaledStep /= 2;

  patternCanvas.width = scaledStep;
  patternCanvas.height = scaledStep;

  // Tek hücresel noktayı çiz
  patternCtx.clearRect(0, 0, scaledStep, scaledStep);
  patternCtx.fillStyle = '#b0b0b0';
  patternCtx.beginPath();
  patternCtx.arc(1.5, 1.5, 1.5, 0, Math.PI * 2);
  patternCtx.fill();

  // Eski çizimi temizle ve tek bir büyük Rect üzerine pattern uygula
  gridLayer.destroyChildren();

  const patternRect = new Konva.Rect({
    x: -pos.x / scale,
    y: -pos.y / scale,
    width: window.innerWidth / scale,
    height: window.innerHeight / scale,
    fillPriority: 'pattern',
    fillPatternImage: patternCanvas,
    fillPatternOffset: {
      x: (-pos.x / scale) % (scaledStep / scale),
      y: (-pos.y / scale) % (scaledStep / scale),
    },
    listening: false,
  });

  gridLayer.add(patternRect);
  gridLayer.batchDraw();
}

// 3. Zoom (Hızlı ve Akıcı)
const scaleBy = 1.08;
stage.on('wheel', (e) => {
  e.evt.preventDefault();

  const oldScale = stage.scaleX();
  const pointer = stage.getPointerPosition();

  // Farenin tuttuğu dünya koordinatı
  const mousePointTo = {
    x: (pointer.x - stage.x()) / oldScale,
    y: (pointer.y - stage.y()) / oldScale,
  };

  const direction = e.evt.deltaY < 0 ? 1 : -1;
  const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

  if (newScale < 0.05 || newScale > 50) return;

  stage.scale({ x: newScale, y: newScale });

  const newPos = {
    x: pointer.x - mousePointTo.x * newScale,
    y: pointer.y - mousePointTo.y * newScale,
  };
  stage.position(newPos);

  updateGrid();
});

stage.on('dragmove', () => {
  updateGrid();
});

stage.on('mousedown touchstart', (e) => {
  if (e.target === stage) {
    stage.draggable(true);
  } else {
    stage.draggable(false);
  }
});

function setupShapeEvents(shape) {
  shape.on('transformend', () => {
    shape.width(Math.max(5, shape.width() * shape.scaleX()));
    shape.height(Math.max(5, shape.height() * shape.scaleY()));
    shape.scaleX(1);
    shape.scaleY(1);
  });
}

function bindStageEvents() {
  stage.on('click tap', (e) => {
    if (e.target === stage) {
      tr.nodes([]);
      layer.draw();
      return;
    }

    if (e.target.hasName('shape')) {
      tr.nodes([e.target]);
    }
    layer.draw();
  });
}

bindStageEvents();

// Kutu Ekleme
document.getElementById('addRect').addEventListener('click', () => {
  const stageScale = stage.scaleX();
  const centerX = (-stage.x() + window.innerWidth / 2) / stageScale;
  const centerY = (-stage.y() + window.innerHeight / 2) / stageScale;

  const rect = new Konva.Rect({
    x: centerX - 60,
    y: centerY - 40,
    width: 120,
    height: 80,
    fill: 'royalblue',
    draggable: true,
    name: 'shape'
  });

  setupShapeEvents(rect);
  layer.add(rect);
  layer.draw();
});

// Kaydetme
document.getElementById('saveBtn').addEventListener('click', () => {
  const canvasData = stage.toJSON();
  const blob = new Blob([canvasData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'projem.mycanvas';
  a.click();
  URL.revokeObjectURL(url);
});

// Dosya Açma
const loadBtn = document.getElementById('loadBtn');
const fileInput = document.getElementById('fileInput');

loadBtn.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = (event) => {
    const jsonContent = event.target.result;

    stage.destroy();

    stage = Konva.Node.create(jsonContent, 'container');
    layer = stage.findOne('Layer');

    const oldTr = stage.findOne('Transformer');
    if (oldTr) oldTr.destroy();

    tr = new Konva.Transformer({
      anchorFill: '#ffffff',
      anchorStroke: '#3182ce',
      anchorCornerRadius: 2,
      anchorSize: 8,
      borderStroke: '#3182ce',
      borderDash: [4, 4],
    });
    layer.add(tr);

    const shapes = stage.find('.shape');
    shapes.forEach((shape) => {
      setupShapeEvents(shape);
    });

    bindStageEvents();
    updateGrid();

    layer.draw();
    fileInput.value = '';
  };

  reader.readAsText(file);
});

updateGrid();
window.addEventListener('resize', () => {
  stage.width(window.innerWidth);
  stage.height(window.innerHeight);
  updateGrid();
});