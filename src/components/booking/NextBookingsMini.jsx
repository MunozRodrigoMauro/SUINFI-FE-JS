// src/components/booking/NextBookingsMini.jsx
import React, { useEffect, useState } from "react";
import { getBookingsForMe } from "../../api/bookingService";
import { formatDateTime } from "../../utils/datetime";
import BookingStatusBadge from "./BookingStatusBadge";

export default function NextBookingsMini() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    (async () => {
      const list = await getBookingsForMe();
      setItems((list || []).slice(0, 3));
    })();
  }, []);
  if (items.length === 0) return null;
  return (
    <div className="bg-white border rounded-xl p-4">
      <div className="font-semibold mb-3">Próximas reservas</div>
      <div className="space-y-3">
        {items.map(b => (
          <div key={b._id} className="flex items-center justify-between">
            <div className="text-sm">
              <div className="font-medium">{b?.client?.name || b?.client?.email || "Cliente"}</div>
              <div className="text-gray-600">{b?.service?.name}</div>
              <div className="text-gray-600">{formatDateTime(b?.scheduledAt)}</div>
            </div>
            <BookingStatusBadge status={b?.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
