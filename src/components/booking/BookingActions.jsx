import React, { useRef, useState } from "react";
import { updateBookingStatus } from "../../api/bookingService";
import { canClientCancel, canProComplete } from "../../utils/datetime";
import CancelBookingModal from "./cancelBookingModal";

/**
 * Acciones según rol:
 * - role="pro": accepted | rejected | completed
 * - role="client": canceled (con nota opcional)
 */
export default function BookingActions({ booking, role = "client", onChanged }) {
  const [busy, setBusy] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const triggerRef = useRef(null);

  const doSet = async (status, extra = {}) => {
    try {
      setBusy(true);
      await updateBookingStatus(booking._id, status, extra);
      onChanged?.(status);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  if (role === "pro") {
    return (
      <div className="flex gap-2">
        {booking.status === "pending" && (
          <>
            <button
              onClick={() => doSet("accepted")}
              disabled={busy}
              className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 cursor-pointer"
            >
              Aceptar
            </button>
            <button
              onClick={() => doSet("rejected")}
              disabled={busy}
              className="px-3 py-1 rounded bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60 cursor-pointer"
            >
              Rechazar
            </button>
          </>
        )}
        {canProComplete(booking.status) && (
          <button
            onClick={() => doSet("completed")}
            disabled={busy}
            className="px-3 py-1 rounded bg-slate-800 text-white hover:bg-black disabled:opacity-60 cursor-pointer"
          >
            Completar
          </button>
        )}
      </div>
    );
  }

  // role client
  return (
    <>
      <div className="flex gap-2">
        {canClientCancel(booking.status) && (
          <button
            ref={triggerRef}
            onClick={() => setCancelOpen(true)}
            disabled={busy}
            className="px-3 py-1 rounded bg-gray-800 text-white hover:bg-black disabled:opacity-60 cursor-pointer"
          >
            Cancelar
          </button>
        )}
      </div>

      <CancelBookingModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        returnFocusRef={triggerRef}
        onConfirm={(reason) =>
          doSet(
            "canceled",                                    // <- el controller espera "canceled"
            reason?.trim()
              ? { note: reason.trim(), cancelNote: reason.trim() } // compat BE
              : {}
          )
           }
        title="Cancelar reserva"
        subtitle="Podés agregar un breve motivo (se verá en la reserva)."
      />
    </>
  );
}
