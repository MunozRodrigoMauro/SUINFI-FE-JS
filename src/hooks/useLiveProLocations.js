// src/hooks/useLiveProLocations.js
import { useEffect, useRef, useState } from "react";
import { socket } from "../lib/socket";

/**
 * Hook de ubicaciones en vivo de profesionales.
 * Mantiene un Map<userId, { lat, lng, atMs, isAvailableNow, tombstone?: boolean }>.
 * - Expira entradas antiguas (ttlMs).
 * - Ignora eventos desordenados (por timestamp).
 * - Actualiza isAvailableNow con availability:update/changed.
 * - Marca tombstone al desconectar (presence:offline) para NO volver al estado del BE.
 *
 * @param {Object} options
 * @param {number} options.ttlMs - Tiempo máximo de vigencia de una posición (ms). Default: 10s
 * @param {boolean} options.autoExpire - Si true, corre un GC periódico. Default: true
 * @returns {Map<string, {lat?:number, lng?:number, atMs:number, isAvailableNow:boolean, tombstone?:boolean}>}
 */
export default function useLiveProLocations(options = {}) {
  // [CHANGE] bajamos TTL por defecto para reactividad rápida
  const { ttlMs = 10_000, autoExpire = true } = options;

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

      // [CHANGE] cualquier movimiento invalida tombstone
      upsert(p.userId, {
        lat: +p.lat,
        lng: +p.lng,
        atMs,
        tombstone: false,
        isAvailableNow:
          typeof p.isAvailableNow === "boolean"
            ? p.isAvailableNow
            : // si no viene explícito, preservamos el valor previo o asumimos true (está emitiendo)
              (typeof prev?.isAvailableNow === "boolean" ? prev.isAvailableNow : true),
      });
    };

    const onAvail = ({ userId, isAvailableNow }) => {
      if (!userId) return;
      const prev = storeRef.current.get(userId) || {};
      // [CHANGE] availability explícita invalida tombstone
      upsert(userId, {
        ...prev,
        atMs: Date.now(),
        tombstone: false,
        isAvailableNow: !!isAvailableNow,
      });
    };

    // 🔴 OFFLINE: en vez de borrar, ponemos un tombstone con isAvailableNow=false
    const onPresenceOff = ({ userId }) => {
      if (!userId) return;
      const now = Date.now();
      upsert(userId, {
        atMs: now,
        tombstone: true,          // [CHANGE] marca “apagado” duro
        isAvailableNow: false,    // [CHANGE] fuerza override OFF
        // lat/lng los dejamos como estén (o undefined) – no son relevantes estando OFF
      });
    };

    // 🟢 ONLINE: sólo levantamos tombstone si el BE nos dice algo
    const onPresenceOn = ({ userId, isAvailableNow }) => {
      if (!userId) return;
      const prev = storeRef.current.get(userId) || {};
      upsert(userId, {
        ...prev,
        atMs: Date.now(),
        tombstone: false, // [CHANGE] “revive” la entrada
        // Si el payload no trae isAvailableNow, mantenemos el valor previo (que podría ser false tras tombstone)
        isAvailableNow:
          typeof isAvailableNow === "boolean"
            ? !!isAvailableNow
            : (typeof prev.isAvailableNow === "boolean" ? prev.isAvailableNow : false),
      });
    };

    socket.on("pro:location:update", onMove);
    socket.on("availability:update", onAvail);
    socket.on("availability:changed", onAvail);
    socket.on("presence:offline", onPresenceOff);
    socket.on("presence:online", onPresenceOn);

    // Nota: al reconectar NO vaciamos. El Dashboard ya hace refetch del catálogo.

    return () => {
      socket.off("pro:location:update", onMove);
      socket.off("availability:update", onAvail);
      socket.off("availability:changed", onAvail);
      socket.off("presence:offline", onPresenceOff);
      socket.off("presence:online", onPresenceOn);
    };
  }, []);

  // Expiración automática de posiciones/tombstones viejos
  useEffect(() => {
    if (!autoExpire) return;
    const interval = setInterval(() => {
      const now = Date.now();
      let changed = false;
      for (const [userId, v] of storeRef.current) {
        // [CHANGE] expiramos tanto posiciones como tombstones por el mismo TTL
        if (!v?.atMs || now - v.atMs > ttlMs) {
          storeRef.current.delete(userId);
          changed = true;
        }
      }
      if (changed) publish();
    }, Math.min(Math.max(ttlMs / 2, 500), 2000)); // entre 0.5s y 2s
    return () => clearInterval(interval);
  }, [ttlMs, autoExpire]);

  return snapshot;
}
