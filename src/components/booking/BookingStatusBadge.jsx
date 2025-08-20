import React from "react";
import { STATUS_LABEL } from "../../utils/datetime";

const styles = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  completed: "bg-slate-100 text-slate-700 border-slate-200",
  canceled: "bg-gray-50 text-gray-600 border-gray-200",
};

export default function BookingStatusBadge({ status }) {
  const cls = styles[status] || styles.pending;
  return (
    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border ${cls}`}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}
