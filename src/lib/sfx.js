// src/lib/sfx.js
// Pequeña librería de sonidos "pop/chime" estilo apps de chat.
// Sin dependencias, usa WebAudio y se arma en el primer uso.

const SFX = (() => {
    let ctx = null;
    let unlocked = false;
    let lastPlayedAt = 0;
  
    function ensureCtx() {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        ctx = new AC();
      }
      // Intento de desbloquear por si el navegador lo requiere (primer gesto)
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
    }
  
    // Rate limit suave para no “martillar” el oído si llegan muchos eventos juntos
    function throttle(ms = 60) {
      const now = performance.now();
      if (now - lastPlayedAt < ms) return true;
      lastPlayedAt = now;
      return false;
    }
  
    // Util: crea un pequeño “pop” con glide de pitch y envolvente suave
    function pop({
      startHz = 900,
      endHz = 520,
      durMs = 140,
      gainDb = -12, // volumen relativo
      curve = "exponential", // "linear" o "exponential"
      hiPassHz = 250, // quita graves para un pop más moderno
      pan = 0, // -1..1
    } = {}) {
      ensureCtx();
      if (!ctx) return;
  
      const t0 = ctx.currentTime;
      const t1 = t0 + durMs / 1000;
  
      // Nodos
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = hiPassHz;
  
      let panner = null;
      if (ctx.createStereoPanner) {
        panner = ctx.createStereoPanner();
        panner.pan.value = pan;
      }
  
      // Ruta: osc -> gain -> (hp) -> (panner) -> out
      osc.type = "sine";
      osc.frequency.setValueAtTime(startHz, t0);
      osc.frequency.exponentialRampToValueAtTime(Math.max(endHz, 1), t1);
  
      // Envolvente sin clics
      const vol = dbToGain(gainDb);
      gain.gain.setValueAtTime(0.0001, t0);
      if (curve === "exponential") {
        gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t1);
      } else {
        gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
        gain.gain.linearRampToValueAtTime(0.0001, t1);
      }
  
      // Conexiones
      osc.connect(gain);
      gain.connect(hp);
      if (panner) {
        hp.connect(panner);
        panner.connect(ctx.destination);
      } else {
        hp.connect(ctx.destination);
      }
  
      // Start/Stop
      osc.start(t0);
      osc.stop(t1 + 0.02);
    }
  
    function dbToGain(db) {
      return Math.pow(10, db / 20);
    }
  
    // ---- Presets “amigables” ----
  
    // Envío: “blip” ligeramente ascendente con doble pop muy corto (más brillante)
    function playSend() {
      if (throttle(50)) return;
      // primer pop: corto, brillante
      pop({ startHz: 700, endHz: 1100, durMs: 90, gainDb: -10, hiPassHz: 300, pan: 0.06 });
      // segundo pop (eco sutil)
      setTimeout(() => pop({ startHz: 600, endHz: 950, durMs: 80, gainDb: -16, hiPassHz: 320, pan: -0.06 }), 55);
    }
  
    // Recepción: “pop” suave descendente (más discreto)
    function playRecv() {
      if (throttle(50)) return;
      pop({ startHz: 900, endHz: 520, durMs: 140, gainDb: -12, hiPassHz: 240, pan: 0 });
    }
  
    // Permite ajustar volumen global (en dB) si querés
    function test() {
      playSend();
      setTimeout(playRecv, 220);
    }
  
    return { playSend, playRecv, test };
  })();
  
  export default SFX;
  