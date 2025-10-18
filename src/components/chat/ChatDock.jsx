// src/components/chat/ChatDock.jsx
import React, { useEffect, useMemo, useRef, useState, lazy, Suspense } from "react"; // [EMOJI] +lazy,Suspense
import {
  LuX,
  LuMessageSquare,
  LuSend,
  LuChevronUp,
  LuChevronDown,
  LuSmile, // [EMOJI]
} from "react-icons/lu";
import { useAuth } from "../../auth/AuthContext";
import { socket } from "../../lib/socket";
import { getOrCreateWith, sendText } from "../../api/chatService";
import { getAvailableNowProfessionals } from "../../api/professionalService";
// [ADD] SFX WebAudio
import SFX from "../../lib/sfx";

// [EMOJI] lazy-load del picker alternativo
const EmojiPicker = lazy(() => import("emoji-picker-react"));

/**
 * props:
 * - chats: [{ _id, otherUser:{_id,name,email,avatarUrl}, lastMessage:{ text, createdAt, from?, readAt? } }]
 * - onOpenChat: (peerId) => void
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const ASSET_BASE = API_BASE.replace(/\/api\/?$/, "");
const absUrl = (u) =>
  !u ? "" : /^https?:\/\//i.test(u) ? u : u.startsWith("/") ? `${ASSET_BASE}${u}` : `${ASSET_BASE}/${u}`;

export default function ChatDock({ chats = [], onOpenChat }) {
  const { user } = useAuth();
  const me = user?.id || user?._id;

  const [openList, setOpenList] = useState(false);
  const [windows, setWindows] = useState([]);            // [{peerId, name, avatar}]
  const [locallyRead, setLocallyRead] = useState(() => new Set());
  const [overrides, setOverrides] = useState({});

  const [availableSet, setAvailableSet] = useState(() => new Set());

  useEffect(() => {
    let mounted = true;
    const seed = async () => {
      try {
        const list = await getAvailableNowProfessionals();
        if (!mounted) return;
        const ids = new Set((list || []).map((p) => String(p?.user?._id || p?.user)));
        setAvailableSet(ids);
      } catch {}
    };
    seed();

    const onAvailability = ({ userId, isAvailableNow }) => {
      if (!userId) return;
      setAvailableSet((prev) => {
        const next = new Set(prev);
        if (isAvailableNow) next.add(String(userId));
        else next.delete(String(userId));
        return next;
      });
    };
    const onConnect = () => seed();

    socket?.on?.("availability:update", onAvailability);
    socket?.on?.("availability:changed", onAvailability);
    socket?.on?.("connect", onConnect);

    return () => {
      mounted = false;
      socket?.off?.("availability:update", onAvailability);
      socket?.off?.("availability:changed", onAvailability);
      socket?.off?.("connect", onConnect);
    };
  }, []);

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

  const openWindow = (peerId, name, avatar) => {
    setWindows((prev) => {
      const exists = prev.find((w) => w.peerId === peerId);
      const next = exists ? prev : [...prev, { peerId, name, avatar }];
      return next.slice(-3);
    });
    setLocallyRead((prev) => {
      const n = new Set(prev);
      n.add(String(peerId));
      return n;
    });
  };

  const closeWindow = (peerId) =>
    setWindows((prev) => prev.filter((w) => w.peerId !== peerId));

  if (!merged.length) return null;

  return (
    <>
      {/* Lista flotante */}
      <div className="fixed right-4 bottom-4 z-40">
        <div className="w-80 max-h-[60vh] rounded-2xl shadow-xl border bg-white/95 backdrop-blur overflow-hidden">
          <button
            type="button"
            onClick={() => setOpenList((o) => !o)}
            aria-expanded={openList}
            className="group w-full px-4 py-3 flex items-center justify-between border-b cursor-pointer select-none hover:bg-slate-50 transition-colors"
            title={openList ? "Contraer" : "Expandir"}
          >
            <div className="relative flex items-center gap-2">
              <div className="relative">
                <LuMessageSquare
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
              <LuChevronDown className="h-5 w-5 text-slate-500 group-hover:text-black transition-colors" />
            ) : (
              <LuChevronUp className="h-5 w-5 text-slate-500 group-hover:text-black transition-colors" />
            )}
          </button>

          {openList && (
            <div className="max-h-[46vh] overflow-y-auto bg-white">
              {merged.map((c) => {
                const name = c?.otherUser?.name || c?.otherUser?.email || "Usuario";
                const peerId = String(c?.otherUser?._id || "");
                const isAvail = availableSet.has(peerId);
                const avatar = c?.otherUser?.avatarUrl ? absUrl(c.otherUser.avatarUrl) : "";
                const unread = isUnread(c);

                return (
                  <button
                    key={c._id}
                    onClick={() => openWindow(c?.otherUser?._id, name, c?.otherUser?.avatarUrl || "")}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg cursor-pointer transition 
                              hover:bg-gray-50 hover:shadow-sm hover:ring-1 hover:ring-slate-200
                              focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 active:bg-gray-100"
                  >
                    <div className="relative h-9 w-9 rounded-full bg-slate-200 overflow-hidden shrink-0 grid place-items-center">
                      {avatar ? (
                        <img src={avatar} alt={name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-sm font-semibold text-slate-700">
                          {name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span
                        className={`absolute -bottom-0 -right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white ${isAvail ? "bg-emerald-500" : "bg-gray-400"}`}
                        title={isAvail ? "Disponible" : "No disponible"}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className={`leading-5 truncate ${unread ? "font-semibold text-black" : "font-medium"}`}>
                        {name}
                      </div>
                      <div
                        className={`text-xs truncate ${unread ? "text-black font-semibold" : "text-gray-500"}`}
                        title={c?.lastMessage?.text || ""}
                      >
                        {c?.lastMessage?.text || "—"}
                      </div>
                    </div>

                    {unread && (
                      <span className="ml-2 h-2.5 w-2.5 rounded-full bg-sky-500 shrink-0" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Ventanas flotantes (desktop) */}
      <div
        className="hidden md:flex fixed right-4 bottom-24 z-40 gap-3
                   flex-row-reverse flex-wrap-reverse max-w-[calc(100vw-2rem)]" // [RESP]
      >
        {windows.map((w) => (
          <ChatWindow
            key={w.peerId}
            peerId={w.peerId}
            name={w.name}
            avatarUrl={w.avatar}
            isAvailable={availableSet.has(String(w.peerId))}
            onClose={() => closeWindow(w.peerId)}
            onOpen={() => onOpenChat?.(w.peerId)}
            onLocalLastMessage={(payload) =>
              setOverrides((prev) => ({
                ...prev,
                [w.peerId]: payload,
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
              avatarUrl={windows[0].avatar}
              isAvailable={availableSet.has(String(windows[0].peerId))}
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

function ChatWindow({
  peerId,
  name,
  isAvailable,
  avatarUrl: avatarProp,
  onClose,
  onOpen,
  isMobile = false,
  onLocalLastMessage,
}) {
  const { user } = useAuth();
  const me = user?.id || user?._id;

  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(avatarProp || "");
  const listRef = useRef(null);

  const seenIdsRef = useRef(new Set());

  // [EMOJI] estado + refs para popover de ventana
  const [showPicker, setShowPicker] = useState(false);
  const inputRef = useRef(null);
  const insertAtCursor = (el, t) => {
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const before = el.value.slice(0, start);
    const after = el.value.slice(end);
    const next = `${before}${t}${after}`;
    setText(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + t.length;
      el.setSelectionRange(pos, pos);
    });
  };
  useEffect(() => {
    const onAway = (e) => {
      if (!showPicker) return;
      const el = document.getElementById(`emoji-popover-win-${peerId}`);
      if (el && !el.contains(e.target)) setShowPicker(false);
    };
    document.addEventListener("mousedown", onAway);
    return () => document.removeEventListener("mousedown", onAway);
  }, [showPicker, peerId]);
  // [EMOJI] FIN

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getOrCreateWith(peerId); // { chat, messages, otherUser }
        if (!mounted) return;
        const cid = data?.chat?._id || null;
        setChatId(cid);

        if (!avatarProp && data?.otherUser?.avatarUrl) {
          setAvatarUrl(data.otherUser.avatarUrl);
        }

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

        if (socket && cid) {
          if (me) socket.emit("joinUser", String(me));
          socket.emit("joinRoom", `chat:${cid}`);
        }
      } catch {}
    })();
    return () => {
      mounted = false;
      if (socket && chatId) {
        socket.emit("leaveRoom", `chat:${chatId}`);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerId]);

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

        // [CHANGE] sonido recibido si es del otro
        const fromId = msg?.from?._id || msg?.from;
        if (String(fromId) !== String(me)) {
          SFX.playRecv();
        }
      }
    };

    socket.on("chat:message", onNewMsg);
    return () => {
      socket.off("chat:message", onNewMsg);
    };
  }, [chatId, me]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = async () => {
    const t = text.trim();
    if (!t || !chatId) return;

    setSending(true);

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

      onLocalLastMessage?.({
        text: real?.text ?? t,
        createdAt: real?.createdAt ?? new Date().toISOString(),
        from: me,
      });

      socket?.emit?.("message:send", { chatId, message: real });

      // [CHANGE] sonido enviar en éxito
      SFX.playSend();
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? { ...m, error: true } : m))
      );
    } finally {
      setSending(false);
      setText("");
    }
  };

  const isMine = (m) => String(m.from?._id || m.from) === String(me);
  const photo = avatarUrl ? absUrl(avatarUrl) : "";
  const initial = (name?.[0] || "U").toUpperCase();

  return (
    <div
      className={`w-[min(92vw,320px)] ${isMobile ? "w-full h-[70vh]" : "h-96"} rounded-2xl border bg-white shadow-xl overflow-visible`} // [RESP]
    >
      <div className="px-3 py-2 bg-slate-800 text-white flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative h-7 w-7 rounded-full bg-white/20 grid place-items-center overflow-hidden">
            {photo ? (
              <img src={photo} alt={name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-semibold">{initial}</span>
            )}
            <span
              className={`absolute -bottom-0 -right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white ${
                isAvailable ? "bg-emerald-500" : "bg-gray-400"
              }`}
              title={isAvailable ? "Disponible" : "No disponible"}
            />
          </div>
          <div className="font-medium truncate">{name}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="text-white/80 hover:text-white text-sm cursor-pointer"
            onClick={onOpen}
            title="Abrir chat completo"
          >
            Abrir
          </button>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white cursor-pointer"
            title="Cerrar"
          >
            <LuX className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        ref={listRef}
        className={`px-3 ${isMobile ? "h-[calc(70vh-110px)]" : "h-[calc(384px-110px)]"} overflow-y-auto bg-gray-50`}
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

      <form
        className="p-2 flex items-center gap-2 border-t bg-white"
        onSubmit={(e) => {
          e.preventDefault();
          if (!sending) handleSend();
        }}
      >
        {/* [EMOJI] Input con botón 🙂 a la izquierda y popover */}
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => setShowPicker((v) => !v)}
            aria-label="Insertar emoji"
            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg grid place-items-center text-slate-600 hover:bg-slate-100"
          >
            <LuSmile className="h-5 w-5" />
          </button>

          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribí un mensaje…"
            className="w-full text-sm rounded-xl border px-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-slate-300"
            disabled={!chatId}
          />

          {showPicker && (
            <div
              id={`emoji-popover-win-${peerId}`}
              className="absolute bottom-12 left-0 z-20"
            >
              <Suspense fallback={<div className="text-xs text-gray-500 p-2">Cargando emojis…</div>}>
                <EmojiPicker
                  lazyLoadEmojis
                  onEmojiClick={(emojiData) => {
                    const ch = emojiData.emoji || "";
                    if (ch && inputRef.current) {
                      insertAtCursor(inputRef.current, ch);
                    }
                    setShowPicker(false);
                  }}
                  theme="light"
                  searchDisabled={false}
                  skinTonesDisabled={false}
                />
              </Suspense>
            </div>
          )}
        </div>
        {/* [EMOJI] FIN */}

        <button
          type="submit"
          disabled={sending || !chatId}
          className={`h-9 px-3 rounded-xl text-white flex items-center gap-1 ${
            sending ? "bg-gray-400" : "bg-slate-800 hover:bg-black"
          }`}
          title="Enviar"
        >
          <LuSend className="h-4 w-4" />
          <span className="text-xs font-medium">
            {sending ? "Enviando…" : "Enviar"}
          </span>
        </button>
      </form>
    </div>
  );
}
