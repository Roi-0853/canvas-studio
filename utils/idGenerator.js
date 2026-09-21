// utils/idGenerator.js
// DEBUG: Elemanlara özgün ID atamak için kullanılan sayaçlar ve yardımcı fonksiyonlar.

let idCounter = 0;

/**
 * Benzersiz bir kart ID'si üretir.
 */
export function generateCardId() {
  idCounter += 1;
  return `card-${idCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Konva Grubundan kart ID'sini okur veya yoksa yeni bir tane atar.
 */
export function getCardId(group) {
  if (!group) return null;
  let id = group.getAttr('cardId');
  if (!id) {
    id = generateCardId();
    group.setAttr('cardId', id);
  }
  return id;
}