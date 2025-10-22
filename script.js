// script.js - cleaned, fixed, toolbar minimization working, background included in save

// ----- elements & contexts -----
const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext('2d');

// Offscreen drawing layer (we draw strokes to this, then copy to visible canvas)
let drawingLayer = document.createElement('canvas');
let dctx = drawingLayer.getContext('2d');

// state
let drawing = false;
let tool = 'pen';
let color = '#000000';
let penSize = 3;
let penEffect = 'normal';
let lastX = 0;
let lastY = 0;
// --- load background only once and reuse ---
let backgroundImg = new Image();
backgroundImg.src = getComputedStyle(document.body)
  .backgroundImage
  .replace(/url\(["']?(.*?)["']?\)/i, '$1');
backgroundImg.onload = () => redrawCanvas();

// ---- helpers ----
function getPointerPos(evt) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (evt.clientX - rect.left) * (canvas.width / rect.width),
    y: (evt.clientY - rect.top) * (canvas.height / rect.height)
  };
}

function copyAndResizeCanvas(oldCanvas, newWidth, newHeight) {
  if (!oldCanvas) return;
  const temp = document.createElement('canvas');
  temp.width = oldCanvas.width;
  temp.height = oldCanvas.height;
  temp.getContext('2d').drawImage(oldCanvas, 0, 0);
  drawingLayer.width = newWidth;
  drawingLayer.height = newHeight;
  dctx.clearRect(0, 0, newWidth, newHeight);
  dctx.drawImage(temp, 0, 0, temp.width, temp.height, 0, 0, newWidth, newHeight);
}

// ---- canvas sizing & redraw ----
function resizeCanvas() {
  const newW = window.innerWidth;
  const newH = window.innerHeight;
  copyAndResizeCanvas(dctx.canvas, newW, newH);
  canvas.width = newW;
  canvas.height = newH;
  redrawCanvas();
}

function redrawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background if loaded
  if (backgroundImg.complete && backgroundImg.naturalWidth > 0) {
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
  }

  // ✅ Draw the drawing layer on top
  ctx.drawImage(drawingLayer, 0, 0, canvas.width, canvas.height);
}

  

// initial size
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ---- pointer events ----
canvas.addEventListener('mousedown', (e) => {
  drawing = true;
  const pos = getPointerPos(e);
  lastX = pos.x;
  lastY = pos.y;
});
canvas.addEventListener('mouseup', () => drawing = false);
canvas.addEventListener('mouseout', () => drawing = false);
canvas.addEventListener('mousemove', draw);

// ---- API functions ----
function setTool(selectedTool) { tool = selectedTool; }
function setEffect(effect) { penEffect = effect; }

// ---- DOM ready ----
document.addEventListener('DOMContentLoaded', () => {
  const colorEl = document.getElementById('colorPicker');
  const sizeEl = document.getElementById('penSize');

  if (colorEl) colorEl.addEventListener('input', e => color = e.target.value);
  if (sizeEl) sizeEl.addEventListener('input', e => penSize = Number(e.target.value));

  // toolbar toggle (minimize / expand)
  const toolbar = document.getElementById('toolbar');
  const toggleBtn = document.getElementById('toggleToolbar');
  if (toolbar && toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isCollapsed = toolbar.classList.toggle('collapsed');
      toggleBtn.textContent = isCollapsed ? '+' : '−';
    });
  }
});

function draw(e) {
  if (!drawing) return;
  const pos = getPointerPos(e);
  const x = pos.x;
  const y = pos.y;

  dctx.lineCap = 'round';
  dctx.lineJoin = 'round';

  if (tool === 'eraser') {
    dctx.clearRect(x - penSize / 2, y - penSize / 2, penSize, penSize);
  } else {
    dctx.strokeStyle = color;
    dctx.fillStyle = color;
    dctx.lineWidth = penSize;
    dctx.shadowBlur = 0;
    dctx.globalAlpha = 1;

    switch (penEffect) {
      case 'normal':
        dctx.beginPath();
        dctx.moveTo(lastX, lastY);
        dctx.lineTo(x, y);
        dctx.stroke();
        break;

      case 'dotted':
        const dx = x - lastX, dy = y - lastY;
        const steps = Math.max(1, Math.floor(Math.sqrt(dx * dx + dy * dy) / 4));
        for (let i = 0; i < steps; i++) {
          const px = lastX + (dx / steps) * i;
          const py = lastY + (dy / steps) * i;
          dctx.beginPath();
          dctx.arc(px, py, penSize / 2, 0, Math.PI * 2);
          dctx.fill();
        }
        break;

      case 'calligraphy':
        dctx.lineWidth = penSize * 2;
        dctx.beginPath();
        dctx.moveTo(lastX, lastY);
        dctx.lineTo(x, y);
        dctx.stroke();
        break;

      case 'spray':
        for (let i = 0; i < 10; i++) {
          const offsetX = Math.random() * penSize - penSize / 2;
          const offsetY = Math.random() * penSize - penSize / 2;
          dctx.beginPath();
          dctx.arc(x + offsetX, y + offsetY, 1, 0, Math.PI * 2);
          dctx.fill();
        }
        break;

      case 'highlighter':
        dctx.globalAlpha = 0.25;
        dctx.lineWidth = Math.max(1, penSize * 3);
        dctx.beginPath();
        dctx.moveTo(lastX, lastY);
        dctx.lineTo(x, y);
        dctx.stroke();
        dctx.globalAlpha = 1;
        break;

      case 'glow':
        dctx.shadowColor = color;
        dctx.shadowBlur = 12;
        dctx.lineWidth = penSize;
        dctx.beginPath();
        dctx.moveTo(lastX, lastY);
        dctx.lineTo(x, y);
        dctx.stroke();
        dctx.shadowBlur = 0;
        break;

      case 'rainbow':
        dctx.strokeStyle = `hsl(${Math.floor(Math.random() * 360)}, 100%, 50%)`;
        dctx.lineWidth = penSize;
        dctx.beginPath();
        dctx.moveTo(lastX, lastY);
        dctx.lineTo(x, y);
        dctx.stroke();
        break;

      case 'pencil':
        dctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          const jx = (Math.random() - 0.5) * 2;
          const jy = (Math.random() - 0.5) * 2;
          dctx.beginPath();
          dctx.moveTo(lastX + jx, lastY + jy);
          dctx.lineTo(x + jx, y + jy);
          dctx.stroke();
        }
        break;
    }
  }

  lastX = x;
  lastY = y;

  // refresh visible canvas immediately
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (backgroundImg && backgroundImg.complete) {
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(drawingLayer, 0, 0, canvas.width, canvas.height);
}


// ---- save function ----
function saveCanvas() {
  const link = document.createElement('a');
  link.download = 'my_art.png';
  const temp = document.createElement('canvas');
  temp.width = canvas.width;
  temp.height = canvas.height;
  const tctx = temp.getContext('2d');

  const bodyStyle = getComputedStyle(document.body);
  const bgImage = bodyStyle.backgroundImage;

  if (bgImage && bgImage !== 'none') {
    const match = bgImage.match(/url\(["']?(.*?)["']?\)/i);
    const url = match ? match[1] : null;
    if (url) {
      const bg = new Image();
      bg.crossOrigin = 'anonymous';
      bg.src = url;
      bg.onload = () => {
        tctx.drawImage(bg, 0, 0, temp.width, temp.height);
        tctx.drawImage(drawingLayer, 0, 0, temp.width, temp.height);
        link.href = temp.toDataURL('image/png');
        link.click();
      };
      bg.onerror = () => {
        tctx.drawImage(drawingLayer, 0, 0, temp.width, temp.height);
        link.href = temp.toDataURL('image/png');
        link.click();
      };
      return;
    }
  }

  tctx.drawImage(drawingLayer, 0, 0, temp.width, temp.height);
  link.href = temp.toDataURL('image/png');
  link.click();
}
