import React, { useMemo, useRef, useState } from "react";
import StarRating from "./StarRating";
import { createReview } from "../../api/reviewsService";

export default function ReviewModal({ open, onClose, professionalId, bookingId, onSaved }) {
  const [rating, setRating] = useState(0); // ⬅️ empieza vacío
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState([]); // File[]
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const inputRef = useRef(null);

  const LEFT = useMemo(
    () => Math.max(0, 6 - files.length),
    [files.length]
  );

  if (!open) return null;

  const addFiles = (list) => {
    const arr = Array.from(list || []);
    if (!arr.length) return;
    const next = [...files];
    for (const f of arr) {
      if (next.length >= 6) break;
      if (f.type.startsWith("image/")) next.push(f);
    }
    setFiles(next);
  };

  const onPickFiles = (e) => addFiles(e.target.files);

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addFiles(e.dataTransfer.files);
  };
  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const removeFile = (idx) => {
    setFiles((list) => list.filter((_, i) => i !== idx));
    if (inputRef.current) inputRef.current.value = "";
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!bookingId) return setMsg("Falta el bookingId.");
    if (!rating || rating < 1) return setMsg("Elegí una calificación (al menos 1 estrella).");
    try {
      setSaving(true);
      await createReview({
        bookingId,
        professionalId,
        rating,
        comment: comment.trim(),
        photos: files,
      });
      onSaved?.();
      onClose?.();
    } catch (e) {
      const err = e?.response?.data?.error || "No se pudo guardar la reseña";
      setMsg(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">Dejar reseña</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-black">✕</button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {msg && (
            <div className="text-sm bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg">
              {msg}
            </div>
          )}

          {/* Estrellas tipo Google */}
          <div>
            <label className="block text-sm font-medium mb-1">Tu calificación</label>
            <StarRating value={rating} onChange={setRating} size={28} />
            <div className="text-xs text-gray-500 mt-1">
              Tip: podés usar las flechas ⬅️➡️ del teclado para ajustar.
            </div>
          </div>

          {/* Comentario */}
          <div>
            <label className="block text-sm font-medium mb-1">Comentario (opcional)</label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 resize-none"
              placeholder="Contá brevemente tu experiencia…"
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-right">{comment.length}/500</div>
          </div>

          {/* Fotos con drag & drop + previews + ❌ */}
          <div>
            <label className="block text-sm font-medium mb-1">Fotos (opcional, hasta 6)</label>

            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              className={`border-2 border-dashed rounded-xl p-3 transition ${
                LEFT > 0 ? "border-gray-300 hover:border-gray-400" : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-gray-600">
                  Arrastrá y soltá imágenes acá
                  {LEFT > 0 ? ` (podés agregar ${LEFT} más)` : " (límite alcanzado)"}
                </div>
                <label className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 cursor-pointer ${LEFT === 0 ? "opacity-50 pointer-events-none" : ""}`}>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={onPickFiles}
                    disabled={LEFT === 0}
                  />
                  <span className="text-sm">Elegir archivos…</span>
                </label>
              </div>

              {files.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {files.map((f, i) => {
                    const url = URL.createObjectURL(f);
                    return (
                      <div key={i} className="relative group rounded-lg overflow-hidden border">
                        <img src={url} alt={`foto-${i+1}`} className="w-full h-24 object-cover" />
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="absolute top-1 right-1 h-6 w-6 grid place-items-center rounded-full bg-black/60 text-white text-xs opacity-90 group-hover:opacity-100"
                          title="Quitar"
                        >
                          ✕
                        </button>
                        <div className="absolute bottom-0 inset-x-0 bg-black/40 text-white text-[10px] px-1 py-0.5 line-clamp-1">
                          {f.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border hover:bg-gray-50">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || rating < 1}
              className={`px-4 py-2 rounded-lg text-white ${
                saving || rating < 1 ? "bg-gray-400 cursor-not-allowed" : "bg-[#0a0e17] hover:bg-black/80"
              }`}
            >
              {saving ? "Enviando…" : "Enviar reseña"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
