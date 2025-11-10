// src/components/chat/ChatDockContainer.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../../lib/socket";
import { fetchMyChats } from "../../api/chatService";
import ChatDock from "./ChatDock";
import SFX from "../../lib/sfx";

// Pequeño debounce para evitar múltiples refetches seguidos
function useDebounced(fn, delay = 300) {
  const t = useRef(null);
  return useCallback(
    (...args) => {
      if (t.current) clearTimeout(t.current);
      t.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  );
}

export default function ChatDockContainer() {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [ready, setReady] = useState(false);

  const doFetch = useCallback(async () => {
    const list = await fetchMyChats(50); // traemos más para que el orden/unread sea correcto
    setChats(Array.isArray(list) ? list : []);
    setReady(true);
  }, []);
  const debouncedFetch = useDebounced(doFetch, 200);

  // carga inicial
  useEffect(() => {
    let mounted = true;
    (async () => {
      await doFetch();
      if (!mounted) return;
    })();
    return () => {
      mounted = false;
    };
  }, [doFetch]);

  // refresco al conectar socket (rejoin puede llegar a reemitir eventos)
  useEffect(() => {
    const onConnect = () => debouncedFetch();
    socket?.on?.("connect", onConnect);
    return () => socket?.off?.("connect", onConnect);
  }, [debouncedFetch]);

  // [CHANGE-ALL-MESSAGE-NAMES] escuchar todos los alias conocidos de “nuevo mensaje”
  useEffect(() => {
    if (!socket) return;

    const refetchAndSfx = (payload) => {
      // Refrescar lista para reorden/unread/preview desde el BE
      debouncedFetch();
      // Sonido de respaldo (si no lo manejó otra vista)
      try {
        const msg = payload?.message;
        const fromId = msg?.from?._id || msg?.from;
        // el sonido de respaldo es inofensivo; si es mío no suena
        if (fromId) SFX.playRecv();
      } catch {}
    };

    socket.on("chat:message", refetchAndSfx);
    socket.on("message:new", refetchAndSfx);        // [CHANGE-ALL-MESSAGE-NAMES]
    socket.on("chat:new-message", refetchAndSfx);   // [CHANGE-ALL-MESSAGE-NAMES]

    // [CHANGE-ONANY-FALLBACK] por si viene con otro nombre pero incluye {message}
    const onAny = (event, payload) => {
      if (payload && payload.message) refetchAndSfx(payload);
    };
    socket.onAny(onAny);

    return () => {
      socket.off("chat:message", refetchAndSfx);
      socket.off("message:new", refetchAndSfx);
      socket.off("chat:new-message", refetchAndSfx);
      socket.offAny(onAny);
    };
  }, [debouncedFetch]);

  const handleOpenChat = (peerId) => {
    if (!peerId) return;
    navigate(`/chats/${peerId}`);
  };

  if (!ready) return null; // el dock aparece cuando ya tenemos la lista inicial

  return <ChatDock chats={chats} onOpenChat={handleOpenChat} />;
}
