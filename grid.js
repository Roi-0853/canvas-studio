const BASE_STEP = 30;
let lastSvgUrl = '';

export function updateGrid(stage, containerEl) {
  if (!stage || !containerEl) return;

  const scale = stage.scaleX();
  const pos = stage.position();

  let step = BASE_STEP;
  let scaledStep = step * scale;

  while (scaledStep < 15) scaledStep *= 2;
  while (scaledStep > 60) scaledStep /= 2;

  let opacity = 1;
  if (scale < 0.4) {
    opacity = Math.max(0.15, scale / 0.4);
  }

  // YALNIZCA SVG içeriği değiştiğinde DOM'a backgroundImage bas (Re-render Engelleme)
  const svgPattern = `<svg xmlns="http://www.w3.org/2000/svg" width="${scaledStep}" height="${scaledStep}"><circle cx="${scaledStep / 2}" cy="${scaledStep / 2}" r="1" fill="rgba(100, 116, 139, ${opacity})" /></svg>`;
  
  if (svgPattern !== lastSvgUrl) {
    lastSvgUrl = svgPattern;
    const svgUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgPattern)}`;
    containerEl.style.backgroundImage = `url("${svgUrl}")`;
  }

  // Sürüklemede SADECE hafif olan offset hesaplamasını yap
  const offsetX = pos.x % scaledStep;
  const offsetY = pos.y % scaledStep;
  containerEl.style.backgroundPosition = `${offsetX}px ${offsetY}px`;
}