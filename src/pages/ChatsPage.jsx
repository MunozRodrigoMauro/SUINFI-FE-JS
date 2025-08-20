// src/pages/ChatsPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import axiosUser from "../api/axiosUser";
import { socket } from "../lib/socket";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export default function ChatsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { otherUserId: paramId } = useParams();
  const [search] = useSearchParams();
  const { state } = useLocation();

  // 1) Resolvemos el destinatario: param > ?with= > state
  const otherUserId = useMemo(
    () => paramId || search.get("with") || state?.otherUserId || "",
    [paramId, search, state]
  );

  // 2) Estado
  const [counterpart, setCounterpart] = useState(null);
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // 👉 para “modo inbox” (sin destinatario)
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxTried, setInboxTried] = useState(false);

  const inputRef = useRef(null);

  // 3) Si NO hay destinatario, probamos abrir el chat más reciente
  useEffect(() => {
    let mounted = true;

    const openMostRecentChat = async () => {
      setInboxLoading(true);
      setError("");
      try {
        const { data } = await axiosUser.get(`${API}/chats`); // [{ _id, otherUser, ... }]
        const arr = Array.isArray(data) ? data : [];
        if (!mounted) return;
        if (arr.length > 0 && arr[0]?.otherUser?._id) {
          navigate(`/chats/${arr[0].otherUser._id}`, { replace: true });
        } else {
          // no hay chats
          setInboxTried(true);
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setInboxTried(true);
          setLoading(false);
          setError("No pudimos cargar tus chats.");
        }
      } finally {
        if (mounted) setInboxLoading(false);
      }
    };

    if (!otherUserId) {
      openMostRecentChat();
    }
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherUserId]);

  // 4) Cargar/crear el chat con el otro usuario (cuando SÍ hay destinatario)
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!otherUserId) return; // modo inbox se maneja arriba
      setLoading(true);
      setError("");
      try {
        const { data } = await axiosUser.get(`${API}/chats/with/${otherUserId}`);
        if (!mounted) return;
        setCounterpart(data?.otherUser || null);
        setChat(data?.chat || null);
        setMessages(Array.isArray(data?.messages) ? data.messages : []);
      } catch (e) {
        console.error(e);
        if (mounted) setError("No es posible iniciar el chat (verificá el destinatario).");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [otherUserId]);

  // 5) Unirme a mis rooms de socket
  useEffect(() => {
    if (!socket) return;
    const myId = user?.id || user?._id;
    if (myId) socket.emit("joinUser", String(myId));
  }, [user?.id, user?._id]);

  // 6) Suscribirse a mensajes del chat y evitar duplicados
  useEffect(() => {
    if (!socket || !chat?._id) return;

    const room = `chat:${chat._id}`;
    socket.emit("joinRoom", room);

    const onNewMsg = (payload) => {
      if (payload?.chatId !== String(chat._id)) return;
      setMessages((prev) => {
        const already = prev.some((m) => String(m._id) === String(payload.message?._id));
        if (already) return prev;
        return [...prev, payload.message];
      });
    };

    socket.on("chat:message", onNewMsg);

    return () => {
      socket.emit("leaveRoom", room);
      socket.off("chat:message", onNewMsg);
    };
  }, [chat?._id]);

  // 7) Enviar mensaje
  const sendMessage = async (e) => {
    e?.preventDefault?.();
    const text = inputRef.current?.value?.trim();
    if (!text || !chat?._id) return;

    const me = user?.id || user?._id;
    const tempId = `temp:${Date.now()}`;
    const tempMsg = {
      _id: tempId,
      chat: chat._id,
      from: me,
      to: otherUserId,
      text,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    setMessages((prev) => [...prev, tempMsg]);
    inputRef.current.value = "";
    setSending(true);

    try {
      const { data } = await axiosUser.post(`${API}/chats/${chat._id}/messages`, { text });
      const real = data?.message;

      setMessages((prev) => {
        const replaced = prev.map((m) => (m._id === tempId ? real || m : m));
        const seen = new Set();
        return replaced.filter((m) => {
          const key = String(m._id || "");
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      });
    } catch (err) {
      console.error(err);
      setMessages((prev) => prev.map((m) => (m._id === tempId ? { ...m, error: true } : m)));
    } finally {
      setSending(false);
    }
  };

  // 8) UI
  if (!otherUserId) {
    // "modo inbox"
    return (
      <section className="pt-24 max-w-xl mx-auto px-4">
        {inboxLoading ? (
          <div className="text-center text-gray-600">Cargando tus chats…</div>
        ) : inboxTried ? (
          <div className="space-y-3">
            <div className="bg-white border rounded-lg p-4">
              <div className="text-gray-700">No tenés conversaciones aún.</div>
              <div className="text-sm text-gray-500 mt-1">
                Iniciá un chat desde el perfil de un profesional o desde tus reservas.
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigate(-1)} className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50">
                ← Volver
              </button>
              <button onClick={() => navigate("/dashboard/professional")} className="px-3 py-1.5 rounded-lg bg-[#0a0e17] text-white hover:bg-black">
                Ir al panel
              </button>
            </div>
          </div>
        ) : null}
      </section>
    );
  }

  if (loading) return <div className="pt-24 text-center">Cargando chat…</div>;
  if (error) {
    return (
      <section className="pt-24 max-w-xl mx-auto px-4">
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg">
          {error}
        </div>
        <div className="mt-3">
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50"
          >
            ← Volver
          </button>
        </div>
      </section>
    );
  }

  const title = counterpart?.name || counterpart?.email || "Chat";

  return (
    <section className="min-h-screen bg-white text-[#0a0e17] pt-24 pb-4 px-4">
      <div className="max-w-3xl mx-auto border rounded-2xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="px-4 py-3 bg-[#111827] text-white flex items-center justify-between">
          <div className="font-semibold">{title}</div>
          <button
            onClick={() => navigate(-1)}
            className="text-sm px-2 py-1 rounded bg-white/10 hover:bg-white/20"
          >
            ← Volver
          </button>
        </div>

        {/* Mensajes */}
        <div className="h-[60vh] overflow-y-auto p-4 bg-white">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500">No hay mensajes todavía.</div>
          ) : (
            <div className="space-y-2">
              {messages.map((m, i) => {
                const mine = (m.from?._id || m.from) === (user?.id || user?._id);
                const key = String(m._id || `temp-${m.createdAt || ""}-${i}`);
                return (
                  <div
                    key={key}
                    className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${
                      mine
                        ? "ml-auto bg-emerald-50 border border-emerald-200"
                        : "mr-auto bg-gray-50 border border-gray-200"
                    }`}
                    title={new Date(m.createdAt).toLocaleString()}
                  >
                    <div className="whitespace-pre-wrap break-words">{m.text}</div>
                    {m.pending && (
                      <div className="text-[10px] text-gray-500 mt-1">Enviando…</div>
                    )}
                    {m.error && (
                      <div className="text-[10px] text-rose-600 mt-1">Error al enviar</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Composer */}
        <form onSubmit={sendMessage} className="flex gap-2 p-3 border-t bg-white">
          <input
            ref={inputRef}
            className="flex-1 border rounded-lg px-3 py-2"
            placeholder="Escribí un mensaje…"
          />
          <button
            type="submit"
            disabled={sending || !chat?._id}
            className={`px-4 py-2 rounded-lg text-white ${
              sending ? "bg-gray-400" : "bg-[#0a0e17] hover:bg-black"
            }`}
          >
            Enviar
          </button>
        </form>
      </div>
    </section>
  );
}
