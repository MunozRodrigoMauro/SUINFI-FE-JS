// src/pages/ChatsPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import axiosUser from "../api/axiosUser";
import { socket } from "../lib/socket";
import { LuSearch, LuSend, LuChevronLeft, LuLoaderCircle } from "react-icons/lu";
import Navbar from "../components/layout/Navbar";
import BackBar from "../components/layout/BackBar";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

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

  const fetchChats = async () => {
    setLoadingList(true);
    try {
      const { data } = await axiosUser.get(`${API}/chats`);
      const arr = Array.isArray(data) ? data : [];
      arr.sort((a, b) => new Date(b?.lastMessage?.createdAt || 0) - new Date(a?.lastMessage?.createdAt || 0));
      setChats(arr);
    } finally {
      setLoadingList(false);
    }
  };
  useEffect(() => { fetchChats(); }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return chats;
    const term = q.toLowerCase();
    return chats.filter(c => {
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

  useEffect(() => {
    if (otherUserId) return;
    if (loadingList) return;
    if (chats.length > 0 && chats[0]?.otherUser?._id) {
      navigate(`/chats/${chats[0].otherUser._id}`, { replace: true });
    }
  }, [otherUserId, chats, loadingList, navigate]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!otherUserId) return;
      setLoadingChat(true);
      setError("");
      try {
        const { data } = await axiosUser.get(`${API}/chats/with/${otherUserId}`);
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
    return () => { mounted = false; };
  }, [otherUserId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, loadingChat]);

  useEffect(() => {
    if (!socket) return;
    const myId = user?.id || user?._id;
    if (myId) socket.emit("joinUser", String(myId));
  }, [user?.id, user?._id]);

  useEffect(() => {
    if (!socket || !chat?._id) return;
    const room = `chat:${chat._id}`;
    socket.emit("joinRoom", room);

    const onNewMsg = (payload) => {
      if (payload?.chatId !== String(chat._id)) return;
      setMessages((prev) => {
        const already = prev.some((m) => String(m._id) === String(payload.message?._id));
        return already ? prev : [...prev, payload.message];
      });
      fetchChats();
    };

    socket.on("chat:message", onNewMsg);
    return () => {
      socket.emit("leaveRoom", room);
      socket.off("chat:message", onNewMsg);
    };
  }, [chat?._id]);

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

    try {
      const { data } = await axiosUser.post(`${API}/chats/${chat._id}/messages`, { text });
      const real = data?.message;
      setMessages((prev) => prev.map((m) => (m._id === tempId ? real || m : m)));
      fetchChats();
    } catch {
      setMessages((prev) => prev.map((m) => (m._id === tempId ? { ...m, error: true } : m)));
    } finally {
      setSending(false);
    }
  };

  const you = user?.id || user?._id;

  return (
    <>
      <Navbar />

      {/* BackBar encima del contenido */}
      <BackBar
        title="💬 Mensajes"
        subtitle="Conversá con tus contactos en tiempo real."
      />

      <section className="min-h-screen bg-white text-[#0a0e17] pt-30 pb-6">
        <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-[360px_minmax(0,1fr)] gap-4 px-4">
          {/* Sidebar estilo IG */}
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
                  return (
                    <button
                      key={c._id}
                      onClick={() => navigate(`/chats/${u._id}`)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 ${
                        isActive ? "bg-gray-50" : ""
                      }`}
                    >
                      <div className="h-10 w-10 rounded-full bg-slate-200 grid place-items-center overflow-hidden">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-sm font-semibold text-slate-700">
                            {(name[0] || "U").toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium leading-5 truncate">{name}</div>
                        <div className="text-xs text-gray-500 truncate">
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
          <main className="rounded-2xl border bg-white shadow-sm overflow-hidden min-h-[70vh]">
            <div className="flex items-center justify-between px-4 py-3 bg-[#111827] text-white">
              <div className="flex items-center gap-3 min-w-0">
                <button onClick={() => navigate(-1)} className="md:hidden rounded bg-white/10 p-1">
                  <LuChevronLeft className="h-5 w-5" />
                </button>
                <div className="h-9 w-9 rounded-full bg-white/20 grid place-items-center overflow-hidden">
                  <span className="text-sm font-semibold">
                    {(counterpart?.name?.[0] || counterpart?.email?.[0] || "U").toUpperCase()}
                  </span>
                </div>
                <div className="truncate font-semibold">
                  {counterpart?.name || counterpart?.email || "Chat"}
                </div>
              </div>
              <Link
                to={`/profile/${counterpart?._id || ""}`}
                className="hidden md:inline-block text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20"
              >
                Ver perfil
              </Link>
            </div>

            <div ref={scrollRef} className="h-[60vh] md:h-[70vh] overflow-y-auto p-4 bg-gray-50">
              {loadingChat ? (
                <div className="flex items-center justify-center h-full text-gray-600 gap-2">
                  <LuLoaderCircle className="h-4 w-4 animate-spin" /> Cargando chat…
                </div>
              ) : error ? (
                <div className="text-center text-rose-600">{error}</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500">No hay mensajes todavía.</div>
              ) : (
                <div className="space-y-2">
                  {messages.map((m, i) => {
                    const mine = String(m.from?._id || m.from) === String(you);
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
                          <div className="text-[10px] opacity-75 mt-1">Enviando…</div>
                        )}
                        {m.error && (
                          <div className="text-[10px] text-rose-500 mt-1">Error al enviar</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <form onSubmit={sendMessage} className="flex items-center gap-2 p-3 border-t bg-white">
              <input
                ref={inputRef}
                className="flex-1 border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="Escribí un mensaje…"
                disabled={!chat?._id}
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