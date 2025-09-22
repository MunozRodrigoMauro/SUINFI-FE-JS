// src/hooks/useGeolocation.js

/** Devuelve tu posición una sola vez (promesa) */
export async function getCurrentPositionOnce(options = {}) {
    if (!("geolocation" in navigator)) {
      throw new Error("geolocation_unavailable");
    }
    const opts = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0, ...options };
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          resolve({ lat: latitude, lng: longitude, accuracy });
        },
        (err) => reject(err),
        opts
      );
    });
  }
  
  /** Busca la mejor lectura dentro de un tiempo/precisión objetivo */
  export function getBestPosition({
    targetAccuracy = 30,
    timeoutMs = 10000,
    highAccuracy = true,
  } = {}) {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) return reject(new Error("geolocation_unavailable"));
  
      let best = null;
      const opts = { enableHighAccuracy: highAccuracy, timeout: timeoutMs, maximumAge: 0 };
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          const cand = { lat: latitude, lng: longitude, accuracy: accuracy ?? Infinity };
          if (!best || cand.accuracy < best.accuracy) best = cand;
          if (cand.accuracy && cand.accuracy <= targetAccuracy) {
            navigator.geolocation.clearWatch(id);
            resolve(best);
          }
        },
        (err) => {
          navigator.geolocation.clearWatch(id);
          reject(err);
        },
        opts
      );
  
      setTimeout(() => {
        navigator.geolocation.clearWatch(id);
        if (best) resolve(best);
        else reject(new Error("timeout"));
      }, timeoutMs);
    });
  }
  
  // (opcional) export default por conveniencia
  export default { getCurrentPositionOnce, getBestPosition };
  