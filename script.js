import { updateGrid } from './grid.js';
import { saveToFile, loadFromFile } from './filesystem.js';

const PADDING = 16;
const MIN_WIDTH = 120;
const MIN_HEIGHT = 60;
const containerEl = document.getElementById('container');

const stage = new Konva.Stage({
  container: 'container',
  width: window.innerWidth,
  height: window.innerHeight,
  draggable: true,
});

const layer = new Konva.Layer();
stage.add(layer);

const tr = new Konva.Transformer({
  anchorFill: '#ffffff',
  anchorStroke: '#3182ce',
  anchorCornerRadius: 2,
  anchorSize: 8,
  borderStroke: '#3182ce',
  borderDash: [4, 4],
  enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right']
});
layer.add(tr);

function autoFitGroupToText(group) {
  const rect = group.findOne('Rect');
  const textNode = group.findOne('Text');

  const textWidth = textNode.width() - textNode.padding() * 2;
  const textHeight = textNode.measureSize(textNode.text()).height;

  const newWidth = Math.max(MIN_WIDTH, textWidth + PADDING * 2);
  const newHeight = Math.max(MIN_HEIGHT, textHeight + PADDING * 2);

  rect.width(newWidth);
  rect.height(newHeight);
  textNode.width(newWidth);
  textNode.height(newHeight);
}

function makeTextEditable(group) {
  const rect = group.findOne('Rect');
  const textNode = group.findOne('Text');

  group.on('dblclick dbltap', () => {
    tr.nodes([]);
    layer.draw();

    const stageScale = stage.scaleX();
    const textPosition = textNode.absolutePosition();
    const stageBox = stage.container().getBoundingClientRect();

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    textarea.value = textNode.text();
    textarea.style.position = 'absolute';
    textarea.style.top = `${stageBox.top + textPosition.y}px`;
    textarea.style.left = `${stageBox.left + textPosition.x}px`;
    textarea.style.width = `${rect.width() * stageScale}px`;
    textarea.style.height = `${rect.height() * stageScale}px`;
    textarea.style.fontSize = `${textNode.fontSize() * stageScale}px`;
    textarea.style.padding = `${PADDING * stageScale}px`;
    textarea.style.boxSizing = 'border-box';
    textarea.style.lineHeight = textNode.lineHeight();
    textarea.style.fontFamily = textNode.fontFamily();
    textarea.style.color = textNode.fill();
    textarea.style.border = '2px solid #3182ce';
    textarea.style.borderRadius = `${8 * stageScale}px`;
    textarea.style.background = '#ffffff';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.overflow = 'hidden';

    // DÖNDÜRÜLMÜŞ KUTULAR İÇİN ROTASYON HİZALAMASI (Düzeltme)
    const rotation = group.rotation();
    if (rotation) {
      textarea.style.transform = `rotate(${rotation}deg)`;
      textarea.style.transformOrigin = 'top left';
    }

    textarea.focus();

    function handleInput() {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(MIN_HEIGHT * stageScale, textarea.scrollHeight)}px`;
    }

    textarea.addEventListener('input', handleInput);
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);

    textNode.hide();
    rect.hide();
    layer.draw();

    function handleOutsideClick(e) {
      if (e.target !== textarea) setTextareaValue();
    }

    function removeTextarea() {
      textarea.removeEventListener('input', handleInput);
      window.removeEventListener('click', handleOutsideClick); // MEMORY LEAK DÜZELTİLDİ
      if (textarea.parentNode) textarea.parentNode.removeChild(textarea);
      textNode.show();
      rect.show();
      layer.draw();
    }

    function setTextareaValue() {
      textNode.text(textarea.value);
      autoFitGroupToText(group);
      removeTextarea();
    }

    textarea.addEventListener('keydown', (e) => {
      if (e.keyCode === 13 && !e.shiftKey) {
        e.preventDefault();
        setTextareaValue();
      }
      if (e.keyCode === 27) removeTextarea();
    });

    setTimeout(() => window.addEventListener('click', handleOutsideClick));
  });
}

export function createCard(x, y, width = 160, height = 80, initialText = 'Çift tıkla...', rotation = 0) {
  const group = new Konva.Group({
    x: x,
    y: y,
    rotation: rotation,
    draggable: true,
    name: 'shape'
  });

  const rect = new Konva.Rect({
    width: width,
    height: height,
    fill: '#ffffff',
    stroke: '#cbd5e1',
    strokeWidth: 2,
    cornerRadius: 8,
    shadowColor: 'black',
    shadowBlur: 10,
    shadowOpacity: 0.05,
    shadowOffsetX: 0,
    shadowOffsetY: 4,
  });

  const text = new Konva.Text({
    text: initialText,
    fontSize: 14,
    fontFamily: 'sans-serif',
    fill: '#334155',
    width: width,
    height: height,
    padding: PADDING,
    align: 'left',
    verticalAlign: 'top'
  });

  group.add(rect);
  group.add(text);

  group.on('transformend', () => {
    const scaleX = group.scaleX();
    const scaleY = group.scaleY();

    rect.width(Math.max(MIN_WIDTH, rect.width() * scaleX));
    rect.height(Math.max(MIN_HEIGHT, rect.height() * scaleY));
    text.width(rect.width());
    text.height(rect.height());

    group.scaleX(1);
    group.scaleY(1);
    
    autoFitGroupToText(group);
  });

  makeTextEditable(group);
  layer.add(group);
  autoFitGroupToText(group);
  layer.draw();
}

stage.on('click tap', (e) => {
  if (e.target === stage) {
    tr.nodes([]);
    layer.draw();
    return;
  }
  const targetGroup = e.target.findAncestor('.shape') || (e.target.hasName('shape') ? e.target : null);
  if (targetGroup) {
    tr.nodes([targetGroup]);
    layer.draw();
  }
});

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

// requestAnimationFrame ile 60fps Akıcı Drag Performansı
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

document.getElementById('addRect').addEventListener('click', () => {
  const stageScale = stage.scaleX();
  const centerX = (-stage.x() + window.innerWidth / 2) / stageScale;
  const centerY = (-stage.y() + window.innerHeight / 2) / stageScale;
  createCard(centerX - 80, centerY - 40);
});

document.getElementById('saveBtn').addEventListener('click', () => saveToFile(stage));

const fileInput = document.getElementById('fileInput');
document.getElementById('loadBtn').addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    loadFromFile(file, stage, layer, tr, createCard, () => updateGrid(stage, containerEl));
    fileInput.value = '';
  }
});

window.addEventListener('resize', () => {
  stage.width(window.innerWidth);
  stage.height(window.innerHeight);
  updateGrid(stage, containerEl);
});

updateGrid(stage, containerEl);