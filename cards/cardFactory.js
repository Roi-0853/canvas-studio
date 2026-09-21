// cards/cardFactory.js
// DEBUG: Kartların (Group, Rect, Text) ilklendirilmesi ve sahnede oluşturulması.

import { PADDING, MIN_WIDTH, MIN_HEIGHT } from '../constants.js';
import { layer } from '../canvas/stage.js';
import { getCardId } from '../utils/idGenerator.js';
import { setupCardPorts } from './ports.js';
import { autoFitGroupToText, makeTextEditable } from './textEditor.js';

export function createCardFactory(connectionManager) {
  return function createCard(x, y, width = 160, height = 80, initialText = 'Çift tıkla...') {
    const group = new Konva.Group({
      x: x,
      y: y,
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

    getCardId(group);
    setupCardPorts(group);

    group.on('dragmove transform', () => {
      connectionManager.updateConnectionsForCard(getCardId(group));
    });

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
      connectionManager.updateConnectionsForCard(getCardId(group));
    });

    makeTextEditable(group, connectionManager);
    layer.add(group);
    autoFitGroupToText(group);
    layer.draw();

    return group;
  };
}