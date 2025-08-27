// src/hooks/useLiveProLocations.js
import { useEffect, useRef, useState } from "react";
import { socket } from "../lib/socket";

/**
 * Hook de ubicaciones en vivo de profesionales.
 * Mantiene un Map<userId, { lat, lng, atMs, isAvailableNow }>.
 * - Expira entradas antiguas (ttlMs).
 * - Ignora eventos desordenados (por timestamp).
 * - Actualiza isAvailableNow con availability:update/changed.
 * - Elimina al desconectar (presence:offline).
 *
 * @param {Object} options
 * @param {number} options.ttlMs - Tiempo máximo de vigencia de una posición (ms). Default: 120000 (2 min)
 * @param {boolean} options.autoExpire - Si true, corre un GC periódico. Default: true
 * @returns {Map<string, {lat:number, lng:number, atMs:number, isAvailableNow:boolean}>}
 */
export default function useLiveProLocations(options = {}) {
  const { ttlMs = 120_000, autoExpire = true } = options;

  const storeRef = useRef(new Map());
  const [snapshot, setSnapshot] = useState(new Map());

  // Publica una copia inmutable para detonar render
  const publish = () => setSnapshot(new Map(storeRef.current));

  useEffect(() => {
    if (!socket) return;

    const upsert = (userId, patch) => {
      const prev = storeRef.current.get(userId) || {};
      const next = { ...prev, ...patch };
      storeRef.current.set(userId, next);
      publish();
    };

    const onMove = (p) => {
      if (!p?.userId || p.lat == null || p.lng == null) return;

      const atMs = p.at ? (Date.parse(p.at) || Date.now()) : Date.now();
      const prev = storeRef.current.get(p.userId);

      // Ignorar si llegó fuera de orden
      if (prev?.atMs && atMs < prev.atMs) return;

      upsert(p.userId, {
        lat: +p.lat,
        lng: +p.lng,
        atMs,
        isAvailableNow:
          typeof p.isAvailableNow === "boolean"
            ? p.isAvailableNow
            : prev?.isAvailableNow ?? false,
      });
    };

    const onAvail = ({ userId, isAvailableNow }) => {
      if (!userId) return;
      const prev = storeRef.current.get(userId) || {};
      upsert(userId, { ...prev, isAvailableNow: !!isAvailableNow });
    };

    const onPresenceOff = ({ userId }) => {
      if (!userId) return;
      storeRef.current.delete(userId);
      publish();
    };

    socket.on("pro:location:update", onMove);
    socket.on("availability:update", onAvail);
    socket.on("availability:changed", onAvail);
    socket.on("presence:offline", onPresenceOff);

    return () => {
      socket.off("pro:location:update", onMove);
      socket.off("availability:update", onAvail);
      socket.off("availability:changed", onAvail);
      socket.off("presence:offline", onPresenceOff);
    };
  }, []);

  // Expiración automática de posiciones viejas
  useEffect(() => {
    if (!autoExpire) return;
    const interval = setInterval(() => {
      const now = Date.now();
      let changed = false;
      for (const [userId, v] of storeRef.current) {
        if (!v?.atMs || now - v.atMs > ttlMs) {
          storeRef.current.delete(userId);
          changed = true;
        }
      }
      if (changed) publish();
    }, Math.min(Math.max(ttlMs / 2, 1000), 30000)); // entre 1s y 30s
    return () => clearInterval(interval);
  }, [ttlMs, autoExpire]);

  return snapshot;
}
