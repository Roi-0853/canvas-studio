// connections.js - Düzeltilmiş ve Optimize Edilmiş Sürüm

const CARD_SELECTOR = '.shape';
const CONNECTION_NAME = 'connection';

let idCounter = 0;

export function generateCardId() {
  idCounter += 1;
  return `card-${idCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getCardId(group) {
  if (!group) return null;
  let id = group.getAttr('cardId');
  if (!id) {
    id = generateCardId();
    group.setAttr('cardId', id);
  }
  return id;
}

/**
 * İki kartın merkezlerini alıp, okların tam kart sınırından/kenarından
 * çıkmasını sağlayan kararlı trigonometrik hesaplama.
 */
function getEdgeIntersectionPoints(fromGroup, toGroup) {
  const fromRect = fromGroup.findOne('Rect');
  const toRect = toGroup.findOne('Rect');

  const w1 = fromRect.width();
  const h1 = fromRect.height();
  const w2 = toRect.width();
  const h2 = toRect.height();

  // Kart merkezleri (Lokal Stage Koordinatları)
  const c1 = { x: fromGroup.x() + w1 / 2, y: fromGroup.y() + h1 / 2 };
  const c2 = { x: toGroup.x() + w2 / 2, y: toGroup.y() + h2 / 2 };

  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const angle = Math.atan2(dy, dx);

  // Kutu 1'in kenar kesişim noktası
  const start = calculateRectangleEdge(c1, w1, h1, angle);
  // Kutu 2'nin kenar kesişim noktası (Açı ters yönde)
  const end = calculateRectangleEdge(c2, w2, h2, angle + Math.PI);

  return [start.x, start.y, end.x, end.y];
}

function calculateRectangleEdge(center, width, height, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const halfW = width / 2;
  const halfH = height / 2;

  let x = 0;
  let y = 0;

  if (Math.abs(cos * halfH) > Math.abs(sin * halfW)) {
    x = cos > 0 ? halfW : -halfW;
    y = x * Math.tan(angle);
  } else {
    y = sin > 0 ? halfH : -halfH;
    x = y / Math.tan(angle);
  }

  return { x: center.x + x, y: center.y + y };
}

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
    
    // KRİTİK: Okun kartların arkasında kalması için en alta çekiyoruz
    arrow.moveToBottom();

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
      style: {
        stroke: c.arrow ? c.arrow.stroke() : '#3182ce',
        strokeWidth: c.arrow ? c.arrow.strokeWidth() : 2,
      },
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

export class ConnectionTool {
  constructor(manager, stage, layer, callbacks = {}) {
    this.manager = manager;
    this.stage = stage;
    this.layer = layer;
    this.callbacks = callbacks;
    this.active = false;
    this.sourceGroup = null;
  }

  setActive(active) {
    this.active = active;
    this.sourceGroup = null;
    this._clearHighlight();
    if (this.stage.container()) {
      this.stage.container().style.cursor = active ? 'crosshair' : 'default';
    }
  }

  _clearHighlight() {
    this.layer.find(CARD_SELECTOR).forEach((g) => {
      const rect = g.findOne('Rect');
      if (rect) {
        rect.stroke(g.getAttr('_origStroke') || '#cbd5e1');
        rect.strokeWidth(2);
      }
    });
    this.layer.batchDraw();
  }

  _highlight(group) {
    const rect = group.findOne('Rect');
    if (!rect) return;
    if (!group.getAttr('_origStroke')) {
      group.setAttr('_origStroke', rect.stroke());
    }
    rect.stroke('#e11d48');
    rect.strokeWidth(3);
    this.layer.batchDraw();
  }

  handleStageClick(targetNode) {
    if (!this.active) return false;

    const group =
      targetNode.findAncestor(CARD_SELECTOR) ||
      (targetNode.hasName && targetNode.hasName('shape') ? targetNode : null);

    if (!group) return false;

    if (!this.sourceGroup) {
      this.sourceGroup = group;
      this._highlight(group);
      return false;
    }

    if (group === this.sourceGroup) {
      this.sourceGroup = null;
      this._clearHighlight();
      return false;
    }

    const created = this.manager.createConnection(this.sourceGroup, group);
    this.sourceGroup = null;
    this._clearHighlight();
    return !!created;
  }
}