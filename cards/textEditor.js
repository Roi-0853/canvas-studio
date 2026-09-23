// cards/textEditor.js
// DEBUG: Kart üzerindeki metinlerin dinamik olarak yeniden boyutlandırılması ve çift tıkla düzenlenmesi.

import { PADDING, MIN_WIDTH, MIN_HEIGHT } from '../constants.js';
import { stage, layer, tr } from '../canvas/stage.js';
import { updatePortPositions } from './ports.js';
import { getCardId } from '../utils/idGenerator.js';

export function autoFitGroupToText(group) {
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

  updatePortPositions(group);
}

export function makeTextEditable(group, connectionManager) {
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
    textarea.addEventListener('click', (e) => e.stopPropagation());

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
    textarea.style.border = '2px solid #553353';
    textarea.style.borderRadius = `${8 * stageScale}px`;
    textarea.style.background = '#ffffff';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';

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
      window.removeEventListener('click', handleOutsideClick);
      if (textarea.parentNode) textarea.parentNode.removeChild(textarea);
      textNode.show();
      rect.show();
      layer.draw();
    }

    function setTextareaValue() {
      textNode.text(textarea.value);
      autoFitGroupToText(group);
      connectionManager.updateConnectionsForCard(getCardId(group));
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