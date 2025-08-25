import { useEffect, useRef, useState } from "react";
import { socket } from "../lib/socket";

/** Mapa { userId: {lat,lng, at, isAvailableNow} } */
export default function useLiveProLocations() {
  const [positions, setPositions] = useState({});
  const ref = useRef({});

  useEffect(() => {
    if (!socket) return;

    const onMove = (p) => {
      if (!p?.userId || p.lat == null || p.lng == null) return;
      ref.current[p.userId] = {
        lat: p.lat,
        lng: p.lng,
        at: p.at,
        isAvailableNow: !!p.isAvailableNow,
      };
      setPositions({ ...ref.current });
    };

    socket.on("pro:location:update", onMove);
    return () => socket.off("pro:location:update", onMove);
  }, []);

  return positions;
}