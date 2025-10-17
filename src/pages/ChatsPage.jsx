// src/pages/ChatsPage.jsx
// [CHANGE] Sonidos ahora con WebAudio (SFX). Sin <audio> ni mp3. Layout mobile sólo aquí.
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  useParams,
  useSearchParams,
  useLocation,
  useNavigate,
  Link,
} from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import axiosUser from "../api/axiosUser";
import { socket } from "../lib/socket";
import {
  LuSearch,
  LuSend,
  LuChevronLeft,
  LuLoaderCircle,
} from "react-icons/lu";
import Navbar from "../components/layout/Navbar";
import BackBar from "../components/layout/BackBar";
import { getAvailableNowProfessionals } from "../api/professionalService";
// [ADD] SFX WebAudio (reemplaza a mp3)
import SFX from "../lib/sfx";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const ASSET_BASE = API.replace(/\/api\/?$/, "");
const absUrl = (u) =>
  !u
    ? ""
    : /^https?:\/\//i.test(u)
    ? u
    : u.startsWith("/")
    ? `${ASSET_BASE}${u}`
    : `${ASSET_BASE}/${u}`;

export default function ChatsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { otherUserId: paramId } = useParams();
  const [search] = useSearchParams();
  const { state } = useLocation();

  const otherUserId = useMemo(
    () => paramId || search.get("with") || state?.otherUserId || "",
    [paramId, search, state]
  );

  // ===== Sidebar =====
  const [chats, setChats] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [q, setQ] = useState("");

  // Disponibilidad (dots)
  const [availableSet, setAvailableSet] = useState(() => new Set());

  const seedAvailability = async () => {
    try {
      const list = await getAvailableNowProfessionals();
      const ids = new Set((list || []).map((p) => String(p?.user?._id || p?.user)));
      setAvailableSet(ids);
    } catch {}
  };

  useEffect(() => {
    const init = async () => {
      await seedAvailability();
    };
    init();

    const onAvailability = ({ userId, isAvailableNow }) => {
      if (!userId) return;
      setAvailableSet((prev) => {
        const next = new Set(prev);
        if (isAvailableNow) next.add(String(userId));
        else next.delete(String(userId));
        return next;
      });
    };
    const onConnect = () => seedAvailability();

    socket?.on?.("availability:update", onAvailability);
    socket?.on?.("availability:changed", onAvailability);
    socket?.on?.("connect", onConnect);

    return () => {
      socket?.off?.("availability:update", onAvailability);
      socket?.off?.("availability:changed", onAvailability);
      socket?.off?.("connect", onConnect);
    };
  }, []);

  const fetchChats = async () => {
    setLoadingList(true);
    try {
      const { data } = await axiosUser.get(`${API}/chats`);
      const arr = Array.isArray(data) ? data : [];
      arr.sort(
        (a, b) =>
          new Date(b?.lastMessage?.createdAt || 0) -
          new Date(a?.lastMessage?.createdAt || 0)
      );
      setChats(arr);
    } finally {
      setLoadingList(false);
    }
  };
  useEffect(() => {
    fetchChats();
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return chats;
    const term = q.toLowerCase();
    return chats.filter((c) => {
      const u = c?.otherUser || {};
      const name = (u.name || u.email || "").toLowerCase();
      const last = (c?.lastMessage?.text || "").toLowerCase();
      return name.includes(term) || last.includes(term);
    });
  }, [q, chats]);

  // ===== Conversación =====
  const [counterpart, setCounterpart] = useState(null);
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  // [KEEP] helper local para mobile
  const isMobile = () => window.innerWidth < 768;

  // Autoredirige al primer chat si no hay :id en la URL
  useEffect(() => {
    if (otherUserId) return;
    if (loadingList) return;
    if (chats.length > 0 && chats[0]?.otherUser?._id) {
      navigate(`/chats/${chats[0].otherUser._id}`, { replace: true });
    }
  }, [otherUserId, chats, loadingList, navigate]);

  // Cargar conversación
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!otherUserId) return;
      setLoadingChat(true);
      setError("");
      try {
        const { data } = await axiosUser.get(
          `${API}/chats/with/${otherUserId}`
        );
        if (!mounted) return;
        setCounterpart(data?.otherUser || null);
        setChat(data?.chat || null);
        setMessages(Array.isArray(data?.messages) ? data.messages : []);
      } catch {
        if (mounted) setError("No es posible abrir el chat.");
      } finally {
        if (mounted) setLoadingChat(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [otherUserId]);

  // Scroll al final (sólo en esta vista)
  const scrollToBottom = (smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    const behavior = smooth ? "smooth" : "auto";
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior });
    });
  };
  useEffect(() => {
    if (!loadingChat) scrollToBottom(true);
  }, [messages.length, loadingChat]);

  // Forzar scroll al cambiar viewport (teclado móvil)
  useEffect(() => {
    const onResize = () => {
      if (isMobile()) scrollToBottom(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Join de usuario a su room personal
  useEffect(() => {
    if (!socket) return;
    const myId = user?.id || user?._id;
    if (myId) socket.emit("joinUser", String(myId));
  }, [user?.id, user?._id]);

  // Join/leave de room del chat actual + recibir mensajes
  useEffect(() => {
    if (!socket || !chat?._id) return;
    const room = `chat:${chat._id}`;
    socket.emit("joinRoom", room);

    const onNewMsg = (payload) => {
      if (payload?.chatId !== String(chat._id)) return;
      const msg = payload?.message;
      setMessages((prev) => {
        const already = prev.some((m) => String(m._id) === String(msg?._id));
        return already ? prev : [...prev, msg];
      });
      fetchChats();

      // [CHANGE] sonido recibido con SFX (solo si es del otro)
      const fromId = msg?.from?._id || msg?.from;
      const myId = user?.id || user?._id;
      if (String(fromId) !== String(myId)) {
        SFX.playRecv();
      }

      scrollToBottom(true);
    };

    socket.on("chat:message", onNewMsg);
    return () => {
      socket.emit("leaveRoom", room);
      socket.off("chat:message", onNewMsg);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat?._id, user?.id, user?._id]);

  const sendMessage = async (e) => {
    e?.preventDefault?.();
    const text = inputRef.current?.value?.trim();
    if (!text || !chat?._id) return;

    const me = user?.id || user?._id;
    const tempId = `tmp:${Date.now()}`;
    const optimistic = {
      _id: tempId,
      chat: chat._id,
      from: me,
      to: otherUserId,
      text,
      createdAt: new Date().toISOString(),
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    inputRef.current.value = "";
    setSending(true);
    scrollToBottom(true);

    try {
      const { data } = await axiosUser.post(
        `${API}/chats/${chat._id}/messages`,
        { text }
      );
      const real = data?.message;

      setMessages((prev) => {
        const noTemp = prev.filter((m) => m._id !== tempId);
        if (!real) return noTemp;
        const exists = noTemp.some((m) => String(m._id) === String(real._id));
        return exists ? noTemp : [...noTemp, real];
      });

      // [CHANGE] sonido envío en éxito
      SFX.playSend();

      fetchChats();
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? { ...m, error: true } : m))
      );
    } finally {
      setSending(false);
      scrollToBottom(true);
    }
  };

  const you = user?.id || user?._id;

  // ===== nombre + avatar del header con fallback a la lista =====
  const counterpartName = counterpart?.name || counterpart?.email || "Chat";

  const counterpartAvatar = useMemo(() => {
    if (counterpart?.avatarUrl) return absUrl(counterpart.avatarUrl);
    const fromList = chats.find(
      (c) => String(c?.otherUser?._id) === String(otherUserId)
    )?.otherUser?.avatarUrl;
    return fromList ? absUrl(fromList) : "";
  }, [counterpart?.avatarUrl, chats, otherUserId]);

  const counterpartAvailable = useMemo(
    () => availableSet.has(String(otherUserId || counterpart?._id || "")),
    [availableSet, otherUserId, counterpart?._id]
  );

  return (
    <>
      <Navbar />
      <BackBar
        title="💬 Mensajes"
        subtitle="Conversá con tus contactos en tiempo real."
      />

      {/* Layout SOLO aquí: 100dvh en mobile + flex para scroll correcto */}
      <section className="bg-white text-[#0a0e17] md:min-h-screen min-h-[100dvh] pt-24 pb-2">
        <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-[360px_minmax(0,1fr)] gap-4 px-4">
          {/* Sidebar */}
          <aside className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b font-semibold">Chats</div>
            <div className="px-3 py-2 border-b">
              <div className="relative">
                <LuSearch className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar"
                  className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg"
                />
              </div>
            </div>
            <div className="max-h-[65vh] overflow-y-auto">
              {loadingList ? (
                <div className="p-4 text-sm text-gray-600">Cargando…</div>
              ) : filtered.length === 0 ? (
                <div className="p-4 text-sm text-gray-600">No hay chats.</div>
              ) : (
                filtered.map((c) => {
                  const u = c?.otherUser || {};
                  const name = u.name || u.email || "Usuario";
                  const isActive = String(u._id) === String(otherUserId);
                  const avatar = u.avatarUrl ? absUrl(u.avatarUrl) : "";
                  const isAvail = availableSet.has(String(u._id || ""));
                  return (
                    <button
                      key={c._id}
                      onClick={() => navigate(`/chats/${u._id}`)}
                      aria-current={isActive ? "page" : undefined}
                      title={name}
                      className={`group w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg cursor-pointer transition
                        ${
                          isActive
                            ? "bg-slate-50 ring-1 ring-slate-200"
                            : "hover:bg-gray-50 hover:shadow-sm hover:ring-1 hover:ring-slate-200"
                        }
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 active:bg-gray-100`}
                    >
                      <div className="relative h-10 w-10 rounded-full bg-slate-200 grid place-items-center overflow-hidden">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={name}
                            className="h-full w-full object-cover transition-transform duration-150 group-hover:scale-[1.02]"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-slate-700">
                            {(name[0] || "U").toUpperCase()}
                          </span>
                        )}
                        <span
                          className={`absolute -bottom-0 -right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white ${
                            isAvail ? "bg-emerald-500" : "bg-gray-400"
                          }`}
                          title={isAvail ? "Disponible" : "No disponible"}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium leading-5 truncate group-hover:text-black">
                          {name}
                        </div>
                        <div
                          className="text-xs text-gray-500 truncate"
                          title={c?.lastMessage?.text || ""}
                        >
                          {c?.lastMessage?.text || "—"}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* Conversación */}
          {/* flex-col + flex-1 en lista; sin vh fijos */}
          <main className="rounded-2xl border bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 bg-[#111827] text-white">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => navigate(-1)}
                  className="md:hidden rounded bg-white/10 p-1"
                >
                  <LuChevronLeft className="h-5 w-5" />
                </button>
                <div className="relative h-9 w-9 rounded-full bg-white/20 grid place-items-center overflow-hidden">
                  {counterpartAvatar ? (
                    <img
                      src={counterpartAvatar}
                      alt={counterpartName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold">
                      {(counterpartName?.[0] || "U").toUpperCase()}
                    </span>
                  )}
                  <span
                    className={`absolute -bottom-0 -right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white ${
                      counterpartAvailable ? "bg-emerald-500" : "bg-gray-400"
                    }`}
                    title={counterpartAvailable ? "Disponible" : "No disponible"}
                  />
                </div>
                <div className="truncate font-semibold">{counterpartName}</div>
              </div>
            </div>

            {/* Lista */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 bg-gray-50"
              style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
            >
              {loadingChat ? (
                <div className="flex items-center justify-center h-full text-gray-600 gap-2">
                  <LuLoaderCircle className="h-4 w-4 animate-spin" /> Cargando chat…
                </div>
              ) : error ? (
                <div className="text-center text-rose-600">{error}</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500">
                  No hay mensajes todavía.
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((m, i) => {
                    const mine =
                      String(m.from?._id || m.from) === String(you);
                    const key = String(m._id || `temp-${m.createdAt}-${i}`);
                    return (
                      <div
                        key={key}
                        className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm break-words ${
                          mine
                            ? "ml-auto bg-[#111827] text-white"
                            : "mr-auto bg-white border"
                        }`}
                        title={new Date(m.createdAt).toLocaleString()}
                      >
                        {m.text}
                        {m.pending && (
                          <div className="text-[10px] opacity-75 mt-1">
                            Enviando…
                          </div>
                        )}
                        {m.error && (
                          <div className="text-[10px] text-rose-500 mt-1">
                            Error al enviar
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Composer */}
            <form
              onSubmit={sendMessage}
              className="flex items-center gap-2 p-3 border-t bg-white"
              style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
            >
              <input
                ref={inputRef}
                className="flex-1 border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="Escribí un mensaje…"
                disabled={!chat?._id}
                onFocus={() => isMobile() && scrollToBottom(false)}
              />
              <button
                type="submit"
                disabled={sending || !chat?._id}
                className={`h-9 px-3 rounded-xl text-white flex items-center gap-1 ${
                  sending ? "bg-gray-400" : "bg-[#111827] hover:bg-black"
                }`}
                title="Enviar"
              >
                <LuSend className="h-4 w-4" />
                <span className="text-xs font-medium">Enviar</span>
              </button>
            </form>
          </main>
        </div>
      </section>
    </>
  );
}
