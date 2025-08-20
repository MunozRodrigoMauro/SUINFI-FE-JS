import React, { useState } from "react";
import { updateBookingStatus } from "../../api/bookingService";
import { canClientCancel, canProComplete } from "../../utils/datetime";
 
/**
 * Acciones según rol:
 * - role="pro": accepted | rejected | completed
 * - role="client": canceled
 */
export default function BookingActions({ booking, role = "client", onChanged }) {
  const [busy, setBusy] = useState(false);

  const doSet = async (status) => {
    try {
      setBusy(true);
      await updateBookingStatus(booking._id, status);
      onChanged?.(status);
    } catch (e) {
      // podrías mostrar toast
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
              className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              Aceptar
            </button>
            <button
              onClick={() => doSet("rejected")}
              disabled={busy}
              className="px-3 py-1 rounded bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
            >
              Rechazar
            </button>
          </>
        )}
        {canProComplete(booking.status) && (
          <button
            onClick={() => doSet("completed")}
            disabled={busy}
            className="px-3 py-1 rounded bg-slate-800 text-white hover:bg-black disabled:opacity-60"
          >
            Completar
          </button>
        )}
      </div>
    );
  }

  // role client
  return (
    <div className="flex gap-2">
      {canClientCancel(booking.status) && (
        <button
          onClick={() => doSet("canceled")}
          disabled={busy}
          className="px-3 py-1 rounded bg-gray-800 text-white hover:bg-black disabled:opacity-60"
        >
          Cancelar
        </button>
      )}
    </div>
  );
}
