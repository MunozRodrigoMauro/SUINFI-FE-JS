import React, { useEffect, useMemo, useRef, useState, lazy, Suspense } from "react"; // [EMOJI] +lazy,Suspense
import { createPortal } from "react-dom"; // [PORTAL]
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
import { getOrCreateWith, sendText, setTyping, markRead } from "../../api/chatService"; // [ADD-READ] import markRead
import { getAvailableNowProfessionals } from "../../api/professionalService";
import SFX from "../../lib/sfx";

const EmojiPicker = lazy(() => import("emoji-picker-react"));

/**
 * props:
 * - chats: [{ _id, otherUser:{_id,name,email,avatarUrl}, lastMessage:{ text, createdAt, from?, to?, readAt? }, unreadCount? }]
 * - onOpenChat: (peerId) => void
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const ASSET_BASE = API_BASE.replace(/\/api\/?$/, "");
const absUrl = (u) =>
  !u ? "" : /^https?:\/\//i.test(u) ? u : u.startsWith("/") ? `${ASSET_BASE}${u}` : `${ASSET_BASE}/${u}`;

// [PORTAL] wrapper simple para renderizar fuera de cualquier stacking/overflow
function Portal({ children }) {
  const [el] = useState(() => {
    const d = document.createElement("div");
    d.setAttribute("data-chatdock-portal", ""); // hook para inspección si hace falta
    return d;
  });
  useEffect(() => {
    document.body.appendChild(el);
    return () => {
      try { document.body.removeChild(el); } catch {}
    };
  }, [el]);
  return createPortal(children, el);
}

export default function ChatDock({ chats = [], onOpenChat }) {
  const { user } = useAuth();
  const me = user?.id || user?._id;

  const [openList, setOpenList] = useState(false);
  const [windows, setWindows] = useState([]);            // [{peerId, name, avatar}]
  const [locallyRead, setLocallyRead] = useState(() => new Set());
  const [overrides, setOverrides] = useState({});        // por peerId
  const [overridesByChatId, setOverridesByChatId] = useState({}); // por chatId
  const [availableSet, setAvailableSet] = useState(() => new Set());

  const MAX_WINDOWS = 2;

  // [CHANGE-JOIN-USER] asegurar unión global para eventos entrantes
  useEffect(() => {
    if (!socket) return;
    const myId = String(me || "");
    if (!myId) return;
    try { socket.emit("joinUser", myId); } catch {}
  }, [me]);

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

  // ===== Helpers para normalizar payloads =====
  const extractIds = (payload) => {
    const msg = payload?.message || {};
    const fromId = String(msg?.from?._id || msg?.from || "");
    const toId = String(msg?.to?._id || msg?.to || "");
    const chatLike =
      payload?.chatId ||
      payload?.roomId ||
      payload?.chat ||
      msg?.chat?._id ||
      msg?.chat;
    const chatId = chatLike ? String(chatLike) : "";
    return { fromId, toId, chatId };
  };

  const updatePreviews = (msg, chatIdGuess, myId) => {
    const fromId = String(msg?.from?._id || msg?.from || "");
    const toId = String(msg?.to?._id || msg?.to || "");
    const peerId = fromId && toId ? (fromId === myId ? toId : fromId) : "";

    if (peerId) {
      setOverrides((prev) => ({
        ...prev,
        [peerId]: {
          text: msg.text,
          createdAt: msg.createdAt,
          from: msg.from,
        },
      }));
    }
    if (chatIdGuess) {
      setOverridesByChatId((prev) => ({
        ...prev,
        [chatIdGuess]: {
          text: msg.text,
          createdAt: msg.createdAt,
          from: msg.from,
        },
      }));
    }
  };

  // [FIX-ONANY] router universal: escucha cualquier evento que incluya { message }
  useEffect(() => {
    if (!socket) return;
    const myId = String(me || "");
    const onAny = (event, payload) => {
      const msg = payload?.message;
      if (!msg) return;

      const { chatId } = extractIds(payload);
      updatePreviews(msg, chatId, myId);

      const fromId = String(msg?.from?._id || msg?.from || "");
      const toId = String(msg?.to?._id || msg?.to || "");
      const peerId = fromId && toId ? (fromId === myId ? toId : fromId) : "";
      const isMine = fromId === myId;
      const hasOpenWindow = peerId && windows.some((w) => String(w.peerId) === String(peerId));
      if (!isMine && !hasOpenWindow) {
        try { SFX.playRecv(); } catch {}
      }
    };

    socket.onAny(onAny);
    return () => socket.offAny(onAny);
  }, [me, windows]);

  const merged = useMemo(() => {
    const base = Array.isArray(chats) ? chats.slice() : [];
    const out = base.map((c) => {
      const pid = c?.otherUser?._id;
      const ovPeer = pid ? overrides[pid] : null;
      const ovChat = overridesByChatId[c?._id];
      const ov = ovPeer || ovChat;
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
  }, [chats, overrides, overridesByChatId]);

  // Unread logic
  const isUnread = (c) => {
    if (!c) return false;
    const peerId = c?.otherUser?._id;
    if (peerId && locallyRead.has(String(peerId))) return false;
    const n = Number(c?.unreadCount || 0);
    return n > 0;
  };

  const unreadTotal = useMemo(
    () => merged.reduce((acc, c) => acc + (isUnread(c) ? 1 : 0), 0),
    [merged, locallyRead, me]
  );

  const openWindow = (peerId, name, avatar) => {
    setWindows((prev) => {
      const exists = prev.find((w) => w.peerId === peerId);
      const next = exists ? prev : [...prev, { peerId, name, avatar }];
      return next.slice(-MAX_WINDOWS);
    });
    setLocallyRead((prev) => {
      const n = new Set(prev);
      n.add(String(peerId));
      return n;
    });
  };

  const closeWindow = (peerId) =>
    setWindows((prev) => prev.filter((w) => w.peerId !== peerId));

  return (
    <>
      {/* Lista flotante en PORTAL */}
      <Portal>
        <div className="fixed right-4 bottom-4 z-[9999] pointer-events-auto">
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
                <span className="font-semibold text-slate-800 group-hover:text-black text-lg">
                  Mensajes
                </span>
              </div>
              {openList ? (
                <LuChevronDown className="h-6 w-6 text-slate-500 group-hover:text-black transition-colors" />
              ) : (
                <LuChevronUp className="h-6 w-6 text-slate-500 group-hover:text-black transition-colors" />
              )}
            </button>

            {openList && (
              <div className="max-h-[46vh] overflow-y-auto bg-white text-lg">
                {merged.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-gray-500">
                    Aún no tenés chats. Cuando envíes o recibas un mensaje, aparecerán acá.
                  </div>
                ) : (
                  merged.map((c) => {
                    const name = c?.otherUser?.name || c?.otherUser?.email || "Usuario";
                    const peerId = String(c?.otherUser?._id || "");
                    const isAvail = availableSet.has ? availableSet.has(peerId) : false;
                    const avatar = c?.otherUser?.avatarUrl ? absUrl(c.otherUser.avatarUrl) : "";
                    const unread = isUnread(c);

                    return (
                      <button
                        key={c._id}
                        onClick={() =>
                          openWindow(c?.otherUser?._id, name, c?.otherUser?.avatarUrl || "")
                        }
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
                            className={`absolute -bottom-0 -right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white ${
                              isAvail ? "bg-emerald-500" : "bg-gray-400"
                            }`}
                            title={isAvail ? "Disponible" : "No disponible"}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className={`leading-5 truncate ${unread ? "font-semibold text-black" : "font-medium"}`}>
                            {name}
                          </div>
                          <div
                            className={`text-sm truncate ${unread ? "text-black font-semibold" : "text-gray-500"}`}
                            title={c?.lastMessage?.text || ""}
                          >
                            {c?.lastMessage?.text || "—"}
                          </div>
                        </div>

                        {unread && (
                          <span
                            className="ml-2 h-2.5 w-2.5 rounded-full bg-sky-500 shrink-0"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </Portal>

      {/* Ventanas flotantes (desktop) en PORTAL */}
      <Portal>
        <div
          className="hidden md:flex fixed right-4 bottom-24 z-[10000] gap-3
                     flex-row-reverse flex-wrap-reverse max-w-[calc(100vw-2rem)] pointer-events-none"
        >
          {windows.slice(-MAX_WINDOWS).map((w) => (
            <div key={w.peerId} className="pointer-events-auto">
              <ChatWindow
                peerId={w.peerId}
                name={w.name}
                avatarUrl={w.avatar}
                isAvailable={availableSet.has ? availableSet.has(String(w.peerId)) : false}
                onClose={() => closeWindow(w.peerId)}
                onOpen={() => onOpenChat?.(w.peerId)}
                onLocalLastMessage={(payload) =>
                  setOverrides((prev) => ({
                    ...prev,
                    [w.peerId]: payload,
                  }))
                }
              />
            </div>
          ))}
        </div>
      </Portal>

      {/* Ventana modal (mobile) en PORTAL */}
      {windows[0] && (
        <Portal>
          <div className="md:hidden fixed inset-0 z-[10010] bg-black/50">
            <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-xl">
              <ChatWindow
                peerId={windows[0].peerId}
                name={windows[0].name}
                avatarUrl={windows[0].avatar}
                isAvailable={availableSet.has ? availableSet.has(String(windows[0].peerId)) : false}
                onClose={() => closeWindow(windows[0].peerId)}
                onOpen={() => onOpenChat?.(windows[0].peerId)}
                isMobile
                onLocalLastMessage={(payload) =>
                  setOverrides((prev) => ({
                    ...prev,
                    [windows[0].peerId]: payload,
                  }))}
              />
            </div>
          </div>
        </Portal>
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

  // typing state en ventana
  const [peerTyping, setPeerTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const stopTypingTimerRef = useRef(null); // única

  // [EMOJI]
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

  // ===== helpers de fecha/hora (ES) =====
  const fmtDate = (d) =>
    new Date(d).toLocaleDateString("es-AR", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
  const fmtTime = (d) =>
    new Date(d).toLocaleTimeString("es-AR", { hour: "numeric", minute: "2-digit" });
  const isSameDay = (a, b) => {
    const da = new Date(a), db = new Date(b);
    return da.getFullYear() === db.getFullYear() &&
           da.getMonth() === db.getMonth() &&
           da.getDate() === db.getDate();
  };

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
      finally {
        requestAnimationFrame(() => {
          inputRef.current?.focus();
          requestAnimationFrame(() => {
            if (listRef.current) {
              listRef.current.scrollTop = listRef.current.scrollHeight;
            }
          });
        });
      }
    })();
  }, [peerId]); // eslint-disable-line

  // marcar leído al tener chatId listo
  useEffect(() => {
    if (chatId) markRead(chatId);
  }, [chatId]);

  useEffect(() => {
    if (!socket || !chatId) return;

    const onNewMsg = (payload) => {
      const incomingChatLike =
        payload?.chatId ||
        payload?.roomId ||
        payload?.chat ||
        payload?.message?.chat?._id ||
        payload?.message?.chat;

      const incomingChatId = incomingChatLike ? String(incomingChatLike) : "";
      const thisChatId = String(chatId);

      if (incomingChatId && incomingChatId !== thisChatId) return;

      const msg = payload?.message;
      if (!msg) return;

      if (!incomingChatId) {
        const fromId = String(msg?.from?._id || msg?.from || "");
        const toId = String(msg?.to?._id || msg?.to || "");
        const myId = String(me || "");
        const other = fromId === myId ? toId : fromId;
        if (String(other || "") !== String(peerId || "")) return;
      }

      const id = String(msg._id || "");
      if (id && !seenIdsRef.current.has(id)) {
        seenIdsRef.current.add(id);
        setMessages((prev) => [...prev, msg]);

        const fromId = msg?.from?._id || msg?.from;
        if (String(fromId) !== String(me)) {
          SFX.playRecv();
        }

        if (document.visibilityState === "visible" && chatId) {
          markRead(chatId);
        }
      }
    };

    const onTyping = (payload) => {
      const incomingChatLike =
        payload?.chatId ||
        payload?.roomId ||
        payload?.chat ||
        payload?.message?.chat?._id ||
        payload?.message?.chat;

      const incomingChatId = incomingChatLike ? String(incomingChatLike) : "";
      const thisChatId = String(chatId);

      if (incomingChatId && incomingChatId !== thisChatId) return;

      if (!incomingChatId) {
        const fromId = String(payload?.fromUserId || "");
        if (!fromId) return;
        if (String(fromId) === String(me)) return;
        if (String(fromId) !== String(peerId)) return;
      }

      if (String(payload?.fromUserId || "") === String(me)) return;
      setPeerTyping(!!payload?.isTyping);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setPeerTyping(false), 4000);
    };

    socket.on("chat:message", onNewMsg);
    socket.on("chat:typing", onTyping);
    socket.on("message:new", onNewMsg);
    socket.on("chat:new-message", onNewMsg);

    return () => {
      socket.off("chat:message", onNewMsg);
      socket.off("chat:typing", onTyping);
      socket.off("message:new", onNewMsg);
      socket.off("chat:new-message", onNewMsg);
      clearTimeout(typingTimeoutRef.current);
    };
  }, [chatId, me, peerId]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length, peerTyping]);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handler = () => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    };
    vv.addEventListener("resize", handler);
    return () => vv.removeEventListener("resize", handler);
  }, [chatId]);

  const burstTyping = () => {
    if (!chatId) return;
    setTyping(chatId, true);
    clearTimeout(stopTypingTimerRef.current);
    stopTypingTimerRef.current = setTimeout(() => setTyping(chatId, false), 900);
  };
  useEffect(() => () => clearTimeout(stopTypingTimerRef.current), []);

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

      SFX.playSend();
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? { ...m, error: true } : m))
      );
    } finally {
      setSending(false);
      setText("");
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        requestAnimationFrame(() => {
          if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
        });
      });
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
          <div className="font-medium truncate text-lg">{name}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="text-white/80 hover:text-white text-xl cursor-pointer font-semibold mr-2"
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
            <LuX className="h-6 w-6" />
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
            {messages.map((m, idx) => {
              const prev = messages[idx - 1];
              const showDay = !prev || !isSameDay(prev?.createdAt, m.createdAt);

              let showTime = false;
              if (prev) {
                const gap =
                  (new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime()) / 60000;
                showTime = gap >= 45 || (idx % 6 === 0);
              }

              return (
                <React.Fragment key={m._id || `tmp-${idx}`}>
                  {showDay && (
                    <div className="text-center text-[10px] text-gray-400 my-2">
                      — {fmtDate(m.createdAt)} —
                    </div>
                  )}
                  {showTime && !showDay && (
                    <div className="text-center text-[10px] text-gray-400 my-1">
                      — {fmtTime(m.createdAt)} —
                    </div>
                  )}

                  <div
                    className={`max-w-[78%] px-3 py-2 rounded-2xl text-md break-words ${
                      isMine(m)
                        ? "ml-auto bg-[#111827] text-white"
                        : "mr-auto bg-white border"
                    }`}
                    title={new Date(m.createdAt).toLocaleString("es-AR")}
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
                </React.Fragment>
              );
            })}
            {peerTyping && (
              <div className="text-sm text-gray-500 mt-1 px-1">Escribiendo…</div>
            )}
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
            onChange={(e) => { setText(e.target.value); burstTyping(); }}
            placeholder="Escribí un mensaje…"
            className="w-full text-smmd rounded-xl border px-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-slate-300"
            disabled={!chatId}
            onFocus={() => {
              if (listRef.current) {
                requestAnimationFrame(() => {
                  listRef.current.scrollTop = listRef.current.scrollHeight;
                });
              }
              if (chatId) markRead(chatId);
            }}
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

        <button
          type="submit"
          disabled={sending || !chatId}
          className={`h-9 px-3 rounded-xl text-white flex items-center gap-1 ${
            sending ? "bg-gray-400" : "bg-slate-800 hover:bg-black"
          }`}
          title="Enviar"
        >
          <LuSend className="h-4 w-4" />
          <span className="text-md font-medium">
            {sending ? "Enviando…" : "Enviar"}
          </span>
        </button>
      </form>
    </div>
  );
}
