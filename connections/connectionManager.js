// connections/connectionManager.js
// DEBUG: Kartlar arası bağlantıları (Arrow) oluşturan, saklayan, silen ve serileştiren sınıf.

import { CARD_SELECTOR, CONNECTION_NAME } from '../constants.js';
import { getCardId } from '../utils/idGenerator.js';
import { getEdgeIntersectionPoints } from '../utils/math.js';

export class ConnectionManager {
  constructor(layer) {
    this.layer = layer;
    this.connections = [];
    this.connCounter = 0;
  }

  _cardGroups() {
    return this.layer.find(CARD_SELECTOR);
  }

  findCardById(id) {
    if (!id) return null;
    return this._cardGroups().find((g) => getCardId(g) === id) || null;
  }

  hasConnection(fromId, toId) {
    return this.connections.some(
      (c) => (c.from === fromId && c.to === toId) || (c.from === toId && c.to === fromId)
    );
  }

  createConnection(fromGroup, toGroup) {
    if (!fromGroup || !toGroup || fromGroup === toGroup) return null;

    const fromId = getCardId(fromGroup);
    const toId = getCardId(toGroup);

    if (this.hasConnection(fromId, toId)) return null;

    this.connCounter += 1;
    const conn = {
      id: `conn-${this.connCounter}-${Math.random().toString(36).slice(2, 6)}`,
      from: fromId,
      to: toId,
      arrow: null,
    };

    const arrow = new Konva.Arrow({
      points: getEdgeIntersectionPoints(fromGroup, toGroup),
      stroke: '#3182ce',
      strokeWidth: 2,
      fill: '#3182ce',
      pointerLength: 8,
      pointerWidth: 8,
      hitStrokeWidth: 10,
      name: CONNECTION_NAME,
    });
    arrow.setAttr('connectionId', conn.id);

    conn.arrow = arrow;
    this.layer.add(arrow);
    arrow.moveToBottom(); // Çizgi kartın arkasına geçer

    this.connections.push(conn);
    this.layer.batchDraw();

    return conn;
  }

  updateConnection(conn) {
    const fromGroup = this.findCardById(conn.from);
    const toGroup = this.findCardById(conn.to);

    if (!fromGroup || !toGroup) {
      if (conn.arrow) conn.arrow.visible(false);
      return;
    }

    const points = getEdgeIntersectionPoints(fromGroup, toGroup);
    conn.arrow.points(points);
    conn.arrow.visible(true);
  }

  updateConnectionsForCard(cardId) {
    if (!cardId) return;
    this.connections.forEach((c) => {
      if (c.from === cardId || c.to === cardId) this.updateConnection(c);
    });
    this.layer.batchDraw();
  }

  clearAll() {
    this.connections.forEach((c) => {
      if (c.arrow) c.arrow.destroy();
    });
    this.connections = [];
    this.connCounter = 0;
    this.layer.batchDraw();
  }

  removeConnectionById(connId) {
    const index = this.connections.findIndex((c) => c.id === connId);
    if (index === -1) return null;
    const [removed] = this.connections.splice(index, 1);
    if (removed.arrow) removed.arrow.destroy();
    this.layer.batchDraw();
    return removed;
  }

  getConnectionByArrow(arrowNode) {
    if (!arrowNode) return null;
    const connId = arrowNode.getAttr('connectionId');
    return this.connections.find((c) => c.id === connId) || null;
  }

  serialize() {
    return this.connections.map((c) => ({
      id: c.id,
      from: c.from,
      to: c.to,
    }));
  }

  deserialize(data) {
    this.clearAll();
    if (!Array.isArray(data)) return;

    data.forEach((item) => {
      const fromGroup = this.findCardById(item.from);
      const toGroup = this.findCardById(item.to);
      if (!fromGroup || !toGroup) return;

      const conn = this.createConnection(fromGroup, toGroup);
      if (conn && item.id) {
        conn.id = item.id;
        conn.arrow.setAttr('connectionId', item.id);
      }
    });

    this.layer.batchDraw();
  }
}