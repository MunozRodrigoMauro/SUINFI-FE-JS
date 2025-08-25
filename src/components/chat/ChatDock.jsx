// src/components/chat/ChatDock.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, MessageSquare, Send, ChevronUp, ChevronDown } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { socket } from "../../lib/socket";
import { getOrCreateWith, sendText } from "../../api/chatService";

/**
 * props:
 * - chats: [{ _id, otherUser:{_id,name,email,avatarUrl}, lastMessage:{ text, createdAt, from?, readAt? } }]
 * - onOpenChat: (peerId) => void
 */
export default function ChatDock({ chats = [], onOpenChat }) {
  const { user } = useAuth();
  const me = user?.id || user?._id;

  const [openList, setOpenList] = useState(false);
  const [windows, setWindows] = useState([]);            // [{peerId, name}]
  const [locallyRead, setLocallyRead] = useState(() => new Set()); // peerIds marcados como leídos al abrir
  const [overrides, setOverrides] = useState({});        // { [peerId]: { text, createdAt, from } }

  // fusiona chats + overrides de último mensaje y reordena por fecha
  const merged = useMemo(() => {
    const base = Array.isArray(chats) ? chats.slice() : [];
    const out = base.map((c) => {
      const pid = c?.otherUser?._id;
      const ov = pid ? overrides[pid] : null;
      if (!ov) return c;
      return {
        ...c,
        lastMessage: {
          ...(c.lastMessage || {}),
          text: ov.text,
          createdAt: ov.createdAt,
          from: ov.from,
        },
      };
    });
    out.sort(
      (a, b) =>
        new Date(b?.lastMessage?.createdAt || 0) -
        new Date(a?.lastMessage?.createdAt || 0)
    );
    return out;
  }, [chats, overrides]);

  // “No leído” SOLO si el último es del otro y sin readAt (y no lo abriste ya)
  const isUnread = (c) => {
    if (!c) return false;
    const peerId = c?.otherUser?._id;
    if (peerId && locallyRead.has(String(peerId))) return false;
    const lm = c.lastMessage || {};
    const from = lm?.from?._id || lm?.from;
    if (!from) return false;
    return String(from) !== String(me) && !lm?.readAt;
  };

  const unreadTotal = useMemo(
    () => merged.reduce((acc, c) => acc + (isUnread(c) ? 1 : 0), 0),
    [merged, locallyRead, me]
  );

  const openWindow = (peerId, name) => {
    setWindows((prev) => {
      const exists = prev.find((w) => w.peerId === peerId);
      const next = exists ? prev : [...prev, { peerId, name }];
      return next.slice(-3);
    });
    // al abrir, lo marcamos como leído localmente (no afecta al backend)
    setLocallyRead((prev) => {
      const n = new Set(prev);
      n.add(String(peerId));
      return n;
    });
  };

  const closeWindow = (peerId) =>
    setWindows((prev) => prev.filter((w) => w.peerId !== peerId));

  // 👉 Si no hay chats, NO mostrar dock
  if (!merged.length) return null;

  return (
    <>
      {/* Lista flotante */}
      <div className="fixed right-4 bottom-4 z-40">
        <div className="w-80 max-h-[60vh] rounded-2xl shadow-xl border bg-white/95 backdrop-blur overflow-hidden">
          {/* Header clickeable */}
          <button
            type="button"
            onClick={() => setOpenList((o) => !o)}
            aria-expanded={openList}
            className="group w-full px-4 py-3 flex items-center justify-between border-b cursor-pointer select-none"
            title={openList ? "Contraer" : "Expandir"}
          >
            <div className="relative flex items-center gap-2">
              <div className="relative">
                <MessageSquare
                  className="h-5 w-5 text-slate-700 transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-110 group-hover:rotate-3 group-hover:text-black"
                  aria-hidden="true"
                />
                {unreadTotal > 0 && (
                  <span
                    className="absolute -top-2 -right-2 h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white text-[10px] leading-4 text-center"
                    aria-label={`${unreadTotal} mensajes sin leer`}
                  >
                    {unreadTotal}
                  </span>
                )}
              </div>
              <span className="font-semibold text-slate-800 group-hover:text-black">
                Mensajes
              </span>
            </div>
            {openList ? (
              <ChevronDown className="h-5 w-5 text-slate-500 group-hover:text-black transition-colors" />
            ) : (
              <ChevronUp className="h-5 w-5 text-slate-500 group-hover:text-black transition-colors" />
            )}
          </button>

          {openList && (
            <div className="max-h-[46vh] overflow-y-auto bg-white">
              {merged.map((c) => {
                const name =
                  c?.otherUser?.name || c?.otherUser?.email || "Usuario";
                const avatar = c?.otherUser?.avatarUrl || "";
                const unread = isUnread(c);

                return (
                  <button
                    key={c._id}
                    onClick={() => openWindow(c?.otherUser?._id, name)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left"
                  >
                    <div className="h-9 w-9 rounded-full bg-slate-200 overflow-hidden shrink-0 grid place-items-center">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-slate-700">
                          {name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div
                        className={`leading-5 truncate ${
                          unread ? "font-semibold text-black" : "font-medium"
                        }`}
                      >
                        {name}
                      </div>
                      <div
                        className={`text-xs truncate ${
                          unread ? "text-black font-semibold" : "text-gray-500"
                        }`}
                        title={c?.lastMessage?.text || ""}
                      >
                        {c?.lastMessage?.text || "—"}
                      </div>
                    </div>

                    {/* Puntito tipo IG si está no leído */}
                    {unread && (
                      <span
                        className="ml-2 h-2.5 w-2.5 rounded-full bg-sky-500 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Ventanas flotantes (desktop) */}
      <div className="hidden md:flex fixed right-4 bottom-24 z-40 gap-3">
        {windows.map((w) => (
          <ChatWindow
            key={w.peerId}
            peerId={w.peerId}
            name={w.name}
            onClose={() => closeWindow(w.peerId)}
            onOpen={() => onOpenChat?.(w.peerId)} // abre ChatsPage solo al presionar "Abrir"
            onLocalLastMessage={(payload) =>
              setOverrides((prev) => ({
                ...prev,
                [w.peerId]: payload, // { text, createdAt, from }
              }))
            }
          />
        ))}
      </div>

      {/* Ventana modal (mobile) */}
      {windows[0] && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50">
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-xl">
            <ChatWindow
              peerId={windows[0].peerId}
              name={windows[0].name}
              onClose={() => closeWindow(windows[0].peerId)}
              onOpen={() => onOpenChat?.(windows[0].peerId)}
              isMobile
              onLocalLastMessage={(payload) =>
                setOverrides((prev) => ({
                  ...prev,
                  [windows[0].peerId]: payload,
                }))
              }
            />
          </div>
        </div>
      )}
    </>
  );
}

function ChatWindow({ peerId, name, onClose, onOpen, isMobile = false, onLocalLastMessage }) {
  const { user } = useAuth();
  const me = user?.id || user?._id;

  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  // Para evitar duplicados
  const seenIdsRef = useRef(new Set());

  // Cargar (o crear) el chat y su historial al abrir la ventana
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getOrCreateWith(peerId); // { chat, messages, otherUser }
        if (!mounted) return;
        const cid = data?.chat?._id || null;
        setChatId(cid);

        const msgs = Array.isArray(data?.messages) ? data.messages : [];
        const dedup = [];
        const seen = new Set();
        for (const m of msgs) {
          const id = String(m._id || "");
          if (id && !seen.has(id)) {
            seen.add(id);
            dedup.push(m);
          }
        }
        seenIdsRef.current = seen;
        setMessages(dedup);

        // Join rooms de socket
        if (socket && cid) {
          if (me) socket.emit("joinUser", String(me));
          socket.emit("joinRoom", `chat:${cid}`);
        }
      } catch (e) {
        // silencioso
      }
    })();
    return () => {
      mounted = false;
      if (socket && chatId) {
        socket.emit("leaveRoom", `chat:${chatId}`);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerId]);

  // Escuchar mensajes entrantes
  useEffect(() => {
    if (!socket || !chatId) return;

    const onNewMsg = (payload) => {
      if (payload?.chatId !== String(chatId)) return;
      const msg = payload?.message;
      if (!msg) return;
      const id = String(msg._id || "");
      if (id && !seenIdsRef.current.has(id)) {
        seenIdsRef.current.add(id);
        setMessages((prev) => [...prev, msg]);
        // si el que llega es del otro, no tocamos overrides (badge correcto)
      }
    };

    socket.on("chat:message", onNewMsg);
    return () => {
      socket.off("chat:message", onNewMsg);
    };
  }, [chatId]);

  // Auto-scroll
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = async () => {
    const t = text.trim();
    if (!t || !chatId) return;

    setSending(true);

    // Optimista
    const tempId = `tmp:${Date.now()}`;
    const optimistic = {
      _id: tempId,
      chat: chatId,
      from: me,
      to: peerId,
      text: t,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    setMessages((prev) => [...prev, optimistic]);

    try {
      const real = await sendText(chatId, t);
      // Reemplazar temp por real y deduplicar
      setMessages((prev) => {
        const replaced = prev.map((m) => (m._id === tempId ? real || m : m));
        const seen = new Set();
        const out = [];
        for (const m of replaced) {
          const id = String(m._id || "");
          if (id && !seen.has(id)) {
            seen.add(id);
            out.push(m);
          }
        }
        seenIdsRef.current = seen;
        return out;
      });

      // ⚡️ Actualizar el listado del dock inmediatamente
      onLocalLastMessage?.({
        text: real?.text ?? t,
        createdAt: real?.createdAt ?? new Date().toISOString(),
        from: me,
      });

      // Aviso opcional (el BE igual lo rebota)
      socket?.emit?.("message:send", { chatId, message: real });
    } catch {
      // marcar error en el temp
      setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? { ...m, error: true } : m))
      );
    } finally {
      setSending(false);
      setText("");
    }
  };

  const isMine = (m) => String(m.from?._id || m.from) === String(me);

  return (
    <div
      className={`w-[320px] ${
        isMobile ? "w-full h-[70vh]" : "h-96"
      } rounded-2xl border bg-white shadow-xl overflow-hidden`}
    >
      {/* Topbar de ventanita */}
      <div className="px-3 py-2 bg-slate-800 text-white flex items-center justify-between">
        <div className="font-medium truncate">{name}</div>
        <div className="flex items-center gap-2">
          <button
            className="text-white/80 hover:text-white text-sm"
            onClick={onOpen}
            title="Abrir chat completo"
          >
            Abrir
          </button>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white"
            title="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Timeline con separador cada 4 mensajes */}
      <div
        ref={listRef}
        className={`px-3 ${
          isMobile ? "h-[calc(70vh-110px)]" : "h-[calc(384px-110px)]"
        } overflow-y-auto bg-gray-50`}
      >
        {messages.length === 0 ? (
          <div className="text-center text-xs text-gray-500 py-3">
            Decile hola 👋
          </div>
        ) : (
          <div className="py-2 space-y-1">
            {messages.map((m, idx) => (
              <React.Fragment key={m._id || `tmp-${idx}`}>
                <div
                  className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm break-words ${
                    isMine(m)
                      ? "ml-auto bg-[#111827] text-white"
                      : "mr-auto bg-white border"
                  }`}
                  title={new Date(m.createdAt).toLocaleString()}
                >
                  {m.text}
                  {m.pending && (
                    <div className="text-[10px] opacity-75 mt-1">Enviando…</div>
                  )}
                  {m.error && (
                    <div className="text-[10px] text-rose-500 mt-1">
                      Error al enviar
                    </div>
                  )}
                </div>

                {(idx + 1) % 4 === 0 && (
                  <div className="text-center text-[10px] text-gray-400 my-2">
                    — {new Date(m.createdAt).toLocaleTimeString()} —
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        className="p-2 flex items-center gap-2 border-t bg-white"
        onSubmit={(e) => {
          e.preventDefault();
          if (!sending) handleSend();
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribí un mensaje…"
          className="flex-1 text-sm rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300"
          disabled={!chatId}
        />
        <button
          type="submit"
          disabled={sending || !chatId}
          className={`h-9 px-3 rounded-xl text-white flex items-center gap-1 ${
            sending ? "bg-gray-400" : "bg-slate-800 hover:bg-black"
          }`}
          title="Enviar"
        >
          <Send className="h-4 w-4" />
          <span className="text-xs font-medium">
            {sending ? "Enviando…" : "Enviar"}
          </span>
        </button>
      </form>
    </div>
  );
}