// utils/math.js
// DEBUG: İki kutu arasındaki en yakın kenar kesişim noktalarını hesaplar.

/**
 * 0 Derece Açıda (Düz Kutularda) En Yakın Kenar Kesişimini Bulur
 */
export function getEdgeIntersectionPoints(fromGroup, toGroup) {
  const fromRect = fromGroup.findOne('Rect');
  const toRect = toGroup.findOne('Rect');

  const w1 = fromRect.width();
  const h1 = fromRect.height();
  const w2 = toRect.width();
  const h2 = toRect.height();

  const c1 = { x: fromGroup.x() + w1 / 2, y: fromGroup.y() + h1 / 2 };
  const c2 = { x: toGroup.x() + w2 / 2, y: toGroup.y() + h2 / 2 };

  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;

  // Kutuların merkezler arası mesafesine göre sınır hesaplama
  const getEdge = (center, width, height, dirX, dirY) => {
    const halfW = width / 2;
    const halfH = height / 2;
    const scale = Math.min(
      Math.abs(dirX) > 0 ? halfW / Math.abs(dirX) : Infinity,
      Math.abs(dirY) > 0 ? halfH / Math.abs(dirY) : Infinity
    );
    return {
      x: center.x + dirX * scale,
      y: center.y + dirY * scale,
    };
  };

  const start = getEdge(c1, w1, h1, dx, dy);
  const end = getEdge(c2, w2, h2, -dx, -dy);

  return [start.x, start.y, end.x, end.y];
}