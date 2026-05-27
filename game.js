/* ============================================================
   ASTROBLAST 2D — game.js
   Canvas API · Graficación ISC · ITP 2026
   Temática: Espacio sideral
============================================================ */

"use strict";

// ── CONFIGURACIÓN GLOBAL ────────────────────────────────────
const TOTAL_OBJECTS = 25;
const EXPLOSION_DURATION = 35; // frames

// ── REFERENCIAS DOM ─────────────────────────────────────────
const canvas     = document.getElementById("gameCanvas");
const ctx        = canvas.getContext("2d");
const clickCountEl     = document.getElementById("clickCount");
const objectCountEl    = document.getElementById("objectCount");
const collisionCountEl = document.getElementById("collisionCount");

let clickCount     = 0;
let collisionCount = 0;
let audioPlaying   = false;

// ── RESIZE CANVAS ────────────────────────────────────────────
function resizeCanvas() {
  const wrapper = canvas.parentElement;
  const maxW = Math.min(wrapper.clientWidth, 900);
  const maxH = Math.min(window.innerHeight * 0.72, 600);
  canvas.width  = maxW;
  canvas.height = maxH;
}
resizeCanvas();
window.addEventListener("resize", () => { resizeCanvas(); });

// ── DIBUJAR FONDO ESPACIAL (canvas) ─────────────────────────
let bgStars = [];
function initBgStars() {
  bgStars = [];
  for (let i = 0; i < 160; i++) {
    bgStars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      alpha: Math.random() * 0.7 + 0.3,
      twinkle: Math.random() * 0.03 + 0.005,
      phase: Math.random() * Math.PI * 2,
    });
  }
}
initBgStars();

function drawBackground() {
  // Fondo negro-azul degradado
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#020818");
  grad.addColorStop(0.5, "#061022");
  grad.addColorStop(1, "#030c18");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Nebulosas
  [[0.15, 0.3, "#1a0a3a", 0.18], [0.75, 0.65, "#0a1a3a", 0.15], [0.5, 0.5, "#0d1f10", 0.1]].forEach(([nx, ny, col, al]) => {
    const rg = ctx.createRadialGradient(nx*canvas.width, ny*canvas.height, 10, nx*canvas.width, ny*canvas.height, canvas.width*0.35);
    rg.addColorStop(0, col.replace(")", `,${al})`).replace("rgb", "rgba"));
    rg.addColorStop(1, "transparent");
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  });

  // Estrellas parpadeantes
  const now = performance.now() / 1000;
  bgStars.forEach(s => {
    const a = s.alpha * (0.6 + 0.4 * Math.sin(now * s.twinkle * 60 + s.phase));
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(220,240,255,${a})`;
    ctx.fill();
  });
}

// ── TIPOS DE MOVIMIENTO ──────────────────────────────────────
// 0=vertical, 1=horizontal, 2=diagonal, 3=circular
const MOVE_TYPES = ["vertical", "horizontal", "diagonal", "circular"];

// ── TIPOS DE OBJETO ──────────────────────────────────────────
const OBJ_TYPES = [
  { name: "asteroid-big",   color: "#ff6b6b", size: 28, glow: "#ff0000" },
  { name: "asteroid-mid",   color: "#ffd93d", size: 20, glow: "#ffaa00" },
  { name: "asteroid-small", color: "#6bcb77", size: 14, glow: "#00ff44" },
  { name: "starship",       color: "#4d96ff", size: 22, glow: "#0055ff" },
];

// ── CLASE OBJETO ESPACIAL ────────────────────────────────────
class SpaceObject {
  constructor(id) {
    this.id = id;
    this.reset(true);
  }

  reset(init = false) {
    const margin = 60;
    this.x = margin + Math.random() * (canvas.width  - margin * 2);
    this.y = margin + Math.random() * (canvas.height - margin * 2);
    this.type = OBJ_TYPES[Math.floor(Math.random() * OBJ_TYPES.length)];
    this.r    = this.type.size + Math.random() * 6;
    this.baseSpeed = 0.6 + Math.random() * 2.2;

    // Dirección de movimiento
    this.moveType = MOVE_TYPES[Math.floor(Math.random() * 4)];
    const angle   = Math.random() * Math.PI * 2;
    const spd     = this.baseSpeed;

    if (this.moveType === "vertical")    { this.vx = 0;               this.vy = spd * (Math.random() > 0.5 ? 1 : -1); }
    else if (this.moveType === "horizontal") { this.vx = spd * (Math.random() > 0.5 ? 1 : -1); this.vy = 0; }
    else if (this.moveType === "diagonal")   { this.vx = spd * Math.cos(angle); this.vy = spd * Math.sin(angle); }
    else { // circular
      this.cx    = this.x;
      this.cy    = this.y;
      this.angle = Math.random() * Math.PI * 2;
      this.radius= 30 + Math.random() * 60;
      this.angularSpeed = (Math.random() > 0.5 ? 1 : -1) * (0.015 + Math.random() * 0.03);
      this.vx = 0; this.vy = 0;
    }

    // Rotación visual del asteroide
    this.rotation     = Math.random() * Math.PI * 2;
    this.rotSpeed     = (Math.random() - 0.5) * 0.06;
    this.alpha        = 0;         // fade in
    this.exploding    = false;
    this.explosionTimer = 0;
    this.colliding    = false;
    this.flashTimer   = 0;
  }

  update() {
    // Fade-in
    if (this.alpha < 1) this.alpha = Math.min(1, this.alpha + 0.05);

    if (this.exploding) {
      this.explosionTimer++;
      if (this.explosionTimer >= EXPLOSION_DURATION) {
        this.exploding = false;
        this.explosionTimer = 0;
      }
      return;
    }

    if (this.flashTimer > 0) this.flashTimer--;

    // Movimiento
    if (this.moveType === "circular") {
      this.angle += this.angularSpeed;
      this.x = this.cx + Math.cos(this.angle) * this.radius;
      this.y = this.cy + Math.sin(this.angle) * this.radius;
      // Mueve centro si sale
      if (this.cx - this.radius < 0 || this.cx + this.radius > canvas.width)  this.angularSpeed *= -1;
      if (this.cy - this.radius < 0 || this.cy + this.radius > canvas.height) this.angularSpeed *= -1;
    } else {
      this.x += this.vx;
      this.y += this.vy;
      // Rebote en bordes
      if (this.x - this.r < 0)             { this.x = this.r;              this.vx = Math.abs(this.vx); }
      if (this.x + this.r > canvas.width)   { this.x = canvas.width-this.r; this.vx = -Math.abs(this.vx); }
      if (this.y - this.r < 0)             { this.y = this.r;              this.vy = Math.abs(this.vy); }
      if (this.y + this.r > canvas.height)  { this.y = canvas.height-this.r; this.vy = -Math.abs(this.vy); }
    }

    this.rotation += this.rotSpeed;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);

    if (this.exploding) {
      this.drawExplosion();
      ctx.restore();
      return;
    }

    // Flash de colisión
    if (this.flashTimer > 0) {
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur  = 30;
    } else {
      ctx.shadowColor = this.type.glow;
      ctx.shadowBlur  = 14;
    }

    ctx.rotate(this.rotation);

    if (this.type.name === "starship") {
      this.drawStarship();
    } else {
      this.drawAsteroid();
    }

    ctx.restore();
  }

  drawAsteroid() {
    const r = this.r;
    const points = 8;
    ctx.beginPath();
    for (let i = 0; i < points; i++) {
      const a    = (i / points) * Math.PI * 2;
      const jitter = r * (0.7 + Math.random() * 0 + (i % 3 === 0 ? 0.3 : 0));
      const px   = Math.cos(a) * (r - (i % 2 === 0 ? r*0.25 : 0));
      const py   = Math.sin(a) * (r - (i % 3 === 0 ? r*0.2  : 0));
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();

    // Relleno con gradiente
    const gr = ctx.createRadialGradient(-r*0.2, -r*0.2, 1, 0, 0, r);
    gr.addColorStop(0, lighten(this.type.color, 60));
    gr.addColorStop(0.5, this.type.color);
    gr.addColorStop(1,   darken(this.type.color, 40));
    ctx.fillStyle = gr;
    ctx.fill();
    ctx.strokeStyle = lighten(this.type.color, 30);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Cráteres
    [[-r*0.25, -r*0.1, r*0.18], [r*0.15, r*0.2, r*0.12]].forEach(([cx,cy,cr]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI*2);
      ctx.fillStyle = darken(this.type.color, 50) + "99";
      ctx.fill();
    });
  }

  drawStarship() {
    const r = this.r;
    // Cuerpo de la nave
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r*0.55, r*0.7);
    ctx.lineTo(0, r*0.4);
    ctx.lineTo(-r*0.55, r*0.7);
    ctx.closePath();
    const gr = ctx.createLinearGradient(0, -r, 0, r);
    gr.addColorStop(0, "#88ccff");
    gr.addColorStop(1, "#1144aa");
    ctx.fillStyle = gr;
    ctx.fill();
    ctx.strokeStyle = "#4d96ff";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Ventana
    ctx.beginPath();
    ctx.arc(0, -r*0.1, r*0.22, 0, Math.PI*2);
    ctx.fillStyle = "#aaddff";
    ctx.shadowColor = "#00f5ff";
    ctx.shadowBlur = 10;
    ctx.fill();

    // Motor
    ctx.beginPath();
    ctx.arc(0, r*0.5, r*0.18, 0, Math.PI*2);
    ctx.fillStyle = "#ff8800";
    ctx.shadowColor = "#ff4400";
    ctx.shadowBlur = 12;
    ctx.fill();
  }

  drawExplosion() {
    const t   = this.explosionTimer / EXPLOSION_DURATION;
    const maxR = this.r * 3.5;
    const rNow = maxR * t;
    const a    = 1 - t;

    // Onda de choque
    ctx.beginPath();
    ctx.arc(0, 0, rNow, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,200,50,${a})`;
    ctx.lineWidth = 4 * (1 - t);
    ctx.shadowColor = "#ff8800";
    ctx.shadowBlur  = 20;
    ctx.stroke();

    // Segunda onda
    ctx.beginPath();
    ctx.arc(0, 0, rNow * 0.6, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,100,0,${a * 0.8})`;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Partículas
    const sparks = 10;
    for (let i = 0; i < sparks; i++) {
      const angle = (i / sparks) * Math.PI * 2;
      const dist  = rNow * 0.9;
      ctx.beginPath();
      ctx.arc(Math.cos(angle)*dist, Math.sin(angle)*dist, 3*(1-t), 0, Math.PI*2);
      const colors = ["#ff6b00","#ffd700","#ff3333","#ffffff"];
      ctx.fillStyle = colors[i % colors.length].replace(")", `,${a})`).replace("#", "rgba(") || `rgba(255,180,0,${a})`;
      ctx.fill();
    }

    // Flash central
    ctx.beginPath();
    ctx.arc(0, 0, this.r * (1 - t * 0.7), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,200,${a * 0.6})`;
    ctx.fill();

    // Texto "¡BOOM!"
    if (t < 0.5) {
      ctx.rotate(-this.rotation);
      ctx.font = `bold ${Math.round(this.r * 0.9)}px Orbitron, monospace`;
      ctx.fillStyle = `rgba(255,220,0,${a})`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "#ff8800";
      ctx.shadowBlur = 10;
      ctx.fillText("💥", 0, -this.r * 1.5);
    }
  }

  // Aparece explotando brevemente al ser clickeado
  triggerDestroy() {
    this.exploding = true;
    this.explosionTimer = 0;
  }

  triggerCollision() {
    this.flashTimer = 8;
  }
}

// ── UTILIDADES COLOR ─────────────────────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return [r,g,b];
}
function lighten(hex, amt) {
  const [r,g,b] = hexToRgb(hex);
  return `rgb(${Math.min(255,r+amt)},${Math.min(255,g+amt)},${Math.min(255,b+amt)})`;
}
function darken(hex, amt) {
  const [r,g,b] = hexToRgb(hex);
  return `rgb(${Math.max(0,r-amt)},${Math.max(0,g-amt)},${Math.max(0,b-amt)})`;
}

// ── INICIALIZAR OBJETOS ──────────────────────────────────────
let objects = [];
function initObjects() {
  objects = [];
  for (let i = 0; i < TOTAL_OBJECTS; i++) {
    objects.push(new SpaceObject(i));
  }
}
initObjects();

// ── DETECCIÓN DE COLISIONES ──────────────────────────────────
function checkCollisions() {
  for (let i = 0; i < objects.length; i++) {
    for (let j = i + 1; j < objects.length; j++) {
      const a = objects[i];
      const b = objects[j];
      if (a.exploding || b.exploding) continue;

      const dx   = b.x - a.x;
      const dy   = b.y - a.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const minD = a.r + b.r;

      if (dist < minD && dist > 0.1) {
        // Separar objetos
        const overlap = (minD - dist) / 2;
        const nx = dx / dist;
        const ny = dy / dist;
        a.x -= nx * overlap;
        a.y -= ny * overlap;
        b.x += nx * overlap;
        b.y += ny * overlap;

        // Intercambiar velocidades (rebote elástico)
        if (a.moveType !== "circular") {
          const tmpVx = a.vx; const tmpVy = a.vy;
          a.vx = b.vx; a.vy = b.vy;
          b.vx = tmpVx; b.vy = tmpVy;
        }
        if (b.moveType === "circular") {
          b.angularSpeed *= -1;
        }

        // Flash de choque
        a.triggerCollision();
        b.triggerCollision();
        collisionCount++;
        collisionCountEl.textContent = collisionCount;
      }
    }
  }
}

// ── CLICK EN CANVAS ──────────────────────────────────────────
canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx   = e.clientX - rect.left;
  const my   = e.clientY - rect.top;

  for (let i = 0; i < objects.length; i++) {
    const obj = objects[i];
    if (obj.exploding) continue;
    const dx = mx - obj.x;
    const dy = my - obj.y;
    if (Math.sqrt(dx*dx + dy*dy) <= obj.r + 4) {
      obj.triggerDestroy();
      playExplosionSound();
      clickCount++;
      clickCountEl.textContent = clickCount;

      // Respawn tras la animación de explosión
      setTimeout(() => {
        obj.reset();
      }, (EXPLOSION_DURATION / 60) * 1000 + 100);
      break;
    }
  }
});

// ── AUDIO (Web Audio API — sin archivos externos) ─────────────
let audioCtx  = null;
let masterGain = null;
let audioNodes = []; // nodos activos para detenerlos

function initAudioContext() {
  if (audioCtx) return;
  audioCtx   = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(0.18, audioCtx.currentTime);
  masterGain.connect(audioCtx.destination);
}

// Crea un oscilador que suena como "drone" espacial
function createDrone(freq, type, gainVal, detune = 0) {
  const osc  = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type      = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  osc.detune.setValueAtTime(detune, audioCtx.currentTime);
  gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start();
  audioNodes.push(osc, gain);
  return { osc, gain };
}

// Pulso rítmico lento (efecto ping espacial)
function createPulse(freq, interval) {
  const pulse = () => {
    if (!audioPlaying) return;
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(audioCtx.currentTime + 1.3);
    audioNodes.push(osc, gain);
  };
  pulse();
  const id = setInterval(() => { if (!audioPlaying) { clearInterval(id); return; } pulse(); }, interval);
  audioNodes.push({ stop: () => clearInterval(id) }); // guardamos para detener
}

// LFO — modula un parámetro lentamente (efecto espacial ondulante)
function createLFO(target, rate, depth, base) {
  const lfo      = audioCtx.createOscillator();
  const lfoGain  = audioCtx.createGain();
  lfo.frequency.setValueAtTime(rate, audioCtx.currentTime);
  lfoGain.gain.setValueAtTime(depth, audioCtx.currentTime);
  lfo.connect(lfoGain);
  lfoGain.connect(target);
  target.setValueAtTime(base, audioCtx.currentTime);
  lfo.start();
  audioNodes.push(lfo, lfoGain);
}

function startSpaceMusic() {
  initAudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();

  // Drones base — capas de frecuencias bajas
  const d1 = createDrone(55,  "sawtooth", 0.12, 0);     // Do bajo
  const d2 = createDrone(82.4,"sawtooth", 0.08, -5);    // Mi bajo (detune ligero)
  const d3 = createDrone(110, "sine",     0.10, 3);     // La bajo

  // Pad medio — atmósfera
  const d4 = createDrone(220, "triangle", 0.06, 0);
  const d5 = createDrone(329, "triangle", 0.04, -8);

  // LFO sobre el volumen del pad (efecto "respirar")
  createLFO(d4.gain.gain, 0.12, 0.04, 0.06);
  createLFO(d5.gain.gain, 0.08, 0.03, 0.04);

  // Pulsos tipo "ping" espacial
  createPulse(440,  3200);   // cada ~3.2 s
  createPulse(660,  5100);   // cada ~5.1 s
  createPulse(880,  7700);   // cada ~7.7 s

  // Ruido de fondo suave (ambiente estelar)
  const bufferSize = audioCtx.sampleRate * 2;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
  const noise      = audioCtx.createBufferSource();
  const noiseGain  = audioCtx.createGain();
  const noiseFilter = audioCtx.createBiquadFilter();
  noise.buffer = noiseBuffer;
  noise.loop   = true;
  noiseFilter.type = "lowpass";
  noiseFilter.frequency.setValueAtTime(400, audioCtx.currentTime);
  noiseGain.gain.setValueAtTime(0.04, audioCtx.currentTime);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(masterGain);
  noise.start();
  audioNodes.push(noise, noiseGain, noiseFilter);
}

function stopSpaceMusic() {
  audioNodes.forEach(node => {
    try {
      if (typeof node.stop === "function") node.stop();
      if (typeof node.disconnect === "function") node.disconnect();
    } catch(e) {}
  });
  audioNodes = [];
  if (audioCtx) {
    audioCtx.suspend();
  }
}

function toggleAudio() {
  const btn = document.getElementById("audioBtn");
  if (audioPlaying) {
    stopSpaceMusic();
    audioPlaying = false;
    btn.textContent = "🔇 Activar Música";
  } else {
    startSpaceMusic();
    audioPlaying = true;
    btn.textContent = "🔊 Silenciar Música";
  }
}

// Sonido de explosión al hacer clic en asteroide
function playExplosionSound() {
  initAudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  const noise      = audioCtx.createBufferSource();
  const buffer     = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.4, audioCtx.sampleRate);
  const data       = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  noise.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(800, audioCtx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.4);
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  noise.start();
  noise.stop(audioCtx.currentTime + 0.4);
}

// ── LOOP PRINCIPAL ───────────────────────────────────────────
let lastResize = 0;
function gameLoop(timestamp) {
  // Re-init estrellas al redimensionar
  if (timestamp - lastResize > 500 && bgStars.length > 0 && bgStars[0].x > canvas.width) {
    initBgStars();
    lastResize = timestamp;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();

  checkCollisions();

  objects.forEach(obj => {
    obj.update();
    obj.draw();
  });

  // HUD: texto de instrucción rápida
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.font = "13px Rajdhani, sans-serif";
  ctx.fillStyle = "#00f5ff";
  ctx.textAlign = "right";
  ctx.fillText("🖱️ Clic para destruir asteroides", canvas.width - 10, canvas.height - 10);
  ctx.restore();

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);