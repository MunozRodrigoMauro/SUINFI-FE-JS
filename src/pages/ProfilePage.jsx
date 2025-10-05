// src/pages/ProfilePage.jsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
  useCallback,
} from "react";
import ReactDOM from "react-dom";
import ReactCountryFlag from "react-country-flag";

import Navbar from "../components/layout/Navbar";
import BackBar from "../components/layout/BackBar";
import {
  getMyProfile,
  updateMyProfile,
  uploadMyAvatar,
  deleteMyAvatar,
} from "../api/userService";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import MapCanvas from "../components/map/ProfessionalRequest/MapCanvas";
import {
  updateAvailabilitySchedule,
  setAvailabilityMode,
  updateMyProfessional,
  updateMyLocation,
  getMyProfessional,
  uploadProfessionalDoc,
  deleteProfessionalDoc,
  getMyPayout,
  updateMyPayout,
} from "../api/professionalService";

// WhatsApp
import { updateMyWhatsapp, updateMyWhatsappPro } from "../api/whatsappService";
import { parsePhoneNumberFromString } from "libphonenumber-js";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const ASSET_BASE = API_BASE.replace(/\/api\/?$/, "");
const MAP_KEY = import.meta.env.VITE_MAP_API_KEY;

const log = (...a) => console.log("[WA]", ...a);

const DAYS = [
  { key: "lunes", label: "Lunes" },
  { key: "martes", label: "Martes" },
  { key: "miércoles", label: "Miércoles" },
  { key: "jueves", label: "Jueves" },
  { key: "viernes", label: "Viernes" },
  { key: "sábado", label: "Sábado" },
  { key: "domingo", label: "Domingo" },
];

const buildAddressLabel = (a) =>
  [a.street && `${a.street} ${a.number}`, a.city, a.state, a.postalCode, a.country]
    .filter(Boolean)
    .join(", ");

function absUrl(u) {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("/")) return `${ASSET_BASE}${u}`;
  return `${ASSET_BASE}/${u}`;
}

function Chevron({ open }) {
  return (
    <svg
      className={`h-5 w-5 transition-transform ${open ? "rotate-180" : "rotate-0"}`}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ───────── WhatsApp: países
const WA_COUNTRIES = [
  { iso: "AR", name: "Argentina", dial: "+54" },
  { iso: "UY", name: "Uruguay", dial: "+598" },
  { iso: "CL", name: "Chile", dial: "+56" },
  { iso: "BR", name: "Brasil", dial: "+55" },
  { iso: "PY", name: "Paraguay", dial: "+595" },
  { iso: "BO", name: "Bolivia", dial: "+591" },
  { iso: "PE", name: "Perú", dial: "+51" },
  { iso: "CO", name: "Colombia", dial: "+57" },
  { iso: "EC", name: "Ecuador", dial: "+593" },
  { iso: "VE", name: "Venezuela", dial: "+58" },
  { iso: "MX", name: "México", dial: "+52" },
  { iso: "US", name: "Estados Unidos", dial: "+1" },
  { iso: "ES", name: "España", dial: "+34" },
  { iso: "IT", name: "Italia", dial: "+39" },
  { iso: "FR", name: "Francia", dial: "+33" },
  { iso: "DE", name: "Alemania", dial: "+49" },
  { iso: "GB", name: "Reino Unido", dial: "+44" },
  { iso: "PT", name: "Portugal", dial: "+351" },
  { iso: "CA", name: "Canadá", dial: "+1" },
  { iso: "PR", name: "Puerto Rico", dial: "+1-787" },
];

const onlyDigits = (s) => String(s || "").replace(/\D/g, "");

// más tolerante
const tryNormalizeWa = (iso, dial, local) => {
  let digits = onlyDigits(local);
  if (!digits) return "";
  const dialDigits = onlyDigits(dial);
  if (digits.startsWith(dialDigits)) digits = digits.slice(dialDigits.length);

  if (iso === "AR") {
    digits = digits.replace(/^0+/, "").replace(/^(\d{2,4})15/, "$1");
    if (!digits.startsWith("9")) digits = "9" + digits;
  }

  const raw = `+${dialDigits}${digits}`;
  try {
    const p = parsePhoneNumberFromString(raw, iso);
    return p && p.isValid() ? p.number : "";
  } catch {
    return "";
  }
};

const findCountry = (iso) =>
  WA_COUNTRIES.find((c) => c.iso === iso) || WA_COUNTRIES[0];

function pickFromE164(e164) {
  const num = onlyDigits(e164);
  let best = WA_COUNTRIES[0],
    bestLen = 0;
  for (const c of WA_COUNTRIES) {
    const d = onlyDigits(c.dial);
    if (d && num.startsWith(d) && d.length > bestLen) {
      best = c;
      bestLen = d.length;
    }
  }
  return { iso: best.iso, dial: best.dial, local: num.slice(bestLen) };
}

// ───────── LinkedIn
const isValidLinkedinUrl = (u = "") =>
  /^https?:\/\/(www\.)?linkedin\.com\/.+/i.test(String(u).trim());

// ───────── helpers UI (sin tocar lógica)
const fmtHHMM = (d) =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

const timeAgo = (ts) => {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const m = Math.round(diff / 60000);
  if (m < 1) return "justo ahora";
  if (m === 1) return "hace 1 min";
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h === 1) return "hace 1 hora";
  return `hace ${h} horas`;
};

// ───────── toasts
function Toasts({ items, onDismiss }) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] space-y-2">
      {items.slice(0, 3).map((t) => (
        <div
          key={t.id}
          className="rounded-lg border border-emerald-200 bg-white shadow-md px-3 py-2 text-sm text-emerald-700 flex items-center gap-2"
        >
          <span>✅</span>
          <span>{t.text}</span>
          <button
            onClick={() => onDismiss(t.id)}
            className="ml-2 text-emerald-700/60 hover:text-emerald-900"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

// ───────── Country dropdown (igual)
function usePortal() {
  const elRef = React.useRef(null);
  if (!elRef.current) {
    const el = document.createElement("div");
    el.id = "wa-country-portal";
    el.style.zIndex = "60";
    elRef.current = el;
  }
  React.useEffect(() => {
    const el = elRef.current;
    document.body.appendChild(el);
    return () => {
      try {
        document.body.removeChild(el);
      } catch {}
    };
  }, []);
  return elRef.current;
}

function CountryDropdown({ open, anchorRef, valueISO, onSelect, onClose }) {
  const portalRoot = usePortal();
  const [pos, setPos] = useState({ top: 0, left: 0, width: 280 });
  const [q, setQ] = useState("");
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

  useLayoutEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const place = useCallback(() => {
    const a = anchorRef?.current;
    if (!a) return;
    const r = a.getBoundingClientRect();
    setPos({ top: r.bottom + 8, left: r.left, width: Math.max(260, r.width) });
  }, [anchorRef]);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const onScroll = () => place();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", place);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      const a = anchorRef?.current;
      if (!a) return;
      if (!portalRoot.contains(e.target) && !a.contains(e.target)) onClose?.();
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open, onClose, portalRoot, anchorRef]);

  const items = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return WA_COUNTRIES;
    return WA_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(qq) ||
        c.iso.toLowerCase().includes(qq) ||
        c.dial.replace(/\D/g, "").includes(qq.replace(/\D/g, ""))
    );
  }, [q]);

  if (!open || !portalRoot) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed bg-white border shadow-xl rounded-xl overflow-hidden"
      style={{
        top: pos.top,
        left: pos.left,
        width: pos.width,
        maxHeight: "360px",
        zIndex: 60,
      }}
      role="dialog"
      aria-label="Elegir país"
    >
      <div className="p-2 border-b">
        <input
          autoFocus
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Buscar país por código…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="max-h-[300px] overflow-y-auto">
        {items.map((c) => (
          <button
            key={c.iso}
            onClick={() => {
              onSelect?.(c.iso);
              onClose?.();
            }}
            className={`w-full flex items-center justify-between gap-3 px-3 py-2 hover:bg-gray-50 ${
              valueISO === c.iso ? "bg-gray-50" : ""
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <ReactCountryFlag
                svg
                countryCode={c.iso}
                style={{ width: "1.1rem", height: "1.1rem" }}
              />
              <span className="text-sm">{c.name}</span>
            </span>
            <span className="text-xs text-gray-600">{c.dial}</span>
          </button>
        ))}
      </div>
    </div>,
    portalRoot
  );
}

// NEW: convierte "363 s" → "363 sur", "239 o" → "239 oeste", etc.
function normalizeAddressLine(a = {}) {
  const parts = [];
  const numRaw = String(a.number || "").trim();
  let number = numRaw;
  let orient = "";

  const m = numRaw.match(/^(\d+)\s*([nseow])$/i);
  if (m) {
    number = m[1];
    const map = { n: "norte", s: "sur", e: "este", o: "oeste", w: "oeste" };
    orient = map[m[2].toLowerCase()] || "";
  }

  if (a.street) parts.push(`${a.street} ${number || ""}`.trim());
  if (orient) parts.push(orient);
  if (a.city) parts.push(a.city);
  if (a.state) parts.push(a.state);
  if (a.postalCode) parts.push(a.postalCode);
  if (a.country) parts.push(a.country);

  return parts.filter(Boolean).join(", ");
}

/* ──────────────────────────────────────────────────────────
   Geocoding helpers (MEJORADOS): devuelven feature + addr
   + inferencia de Código Postal cuando la API no lo trae.
   [CHANGE #1] agregado inferPostalFromLabel() y usado como
   fallback en geocode / reverseGeocodeFull / applyGeoResult.
────────────────────────────────────────────────────────── */

/* [CHANGE #1] Fallback robusto para detectar CP desde la etiqueta */
function inferPostalFromLabel(label = "") {
  const s = String(label || "");
  // CPA Argentino: letra + 4 dígitos + 3 letras (ej: J5402ABC)
  const mCPA = s.match(/\b([A-Z]\d{4}[A-Z]{3})\b/i);
  if (mCPA) return mCPA[1].toUpperCase();
  // CP de 4 dígitos (AR) común
  const m4 = s.match(/\b(\d{4})\b/);
  if (m4) return m4[1];
  // Fallback genérico 5 dígitos (otros países)
  const m5 = s.match(/\b(\d{5})\b/);
  if (m5) return m5[1];
  // Nada
  return "";
}

function extractAddrFromFeature(f) {
  const ctx = Array.isArray(f?.context) ? f.context : [];
  const by = (prefix) =>
    ctx.find((c) => String(c?.id || "").startsWith(prefix + ".")) || {};
  const country =
    by("country")?.text || f?.properties?.country || f?.place_name?.split(",").pop()?.trim() || "";
  const state =
    by("region")?.text || by("state")?.text || f?.properties?.region || "";
  const city =
    by("place")?.text ||
    by("locality")?.text ||
    by("district")?.text ||
    f?.properties?.place ||
    "";
  let postalCode =
    by("postcode")?.text ||
    f?.properties?.postcode ||
    f?.properties?.postalcode ||
    "";

  const street = f?.text || f?.properties?.street || "";
  const number = String(f?.address || f?.properties?.housenumber || "").replace(/[()]/g, "").trim();

  // [CHANGE #1] si no hay CP, lo inferimos del place_name
  if (!postalCode) {
    postalCode = inferPostalFromLabel(f?.place_name || f?.text || "");
  }

  return {
    country,
    state,
    city,
    street,
    number,
    postalCode,
  };
}

// UPDATE: acepta opciones (limit, proximity, types, country) y no rompe si algo falta
async function geocode(q, opts = {}) {
  if (!q?.trim()) return [];
  const params = new URLSearchParams({
    key: MAP_KEY,
    language: "es",
    limit: String(opts.limit ?? 6),
    // MapTiler (Mapbox-like) suele respetar estos:
    types: opts.types ?? "address,street",
    country: opts.country ?? "AR",
  });
  if (opts.proximity?.lng != null && opts.proximity?.lat != null) {
    params.set("proximity", `${opts.proximity.lng},${opts.proximity.lat}`);
  }
  const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(q)}.json?${params}`;
  const res = await fetch(url);
  const data = await res.json();
  return (data?.features || []).map((f) => ({
    id: f.id,
    label: f.place_name || f.text,
    lat: f.center?.[1],
    lng: f.center?.[0],
    feature: f,
    addr: extractAddrFromFeature(f),
  }));
}

async function reverseGeocodeFull(lat, lng) {
  const u = `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${MAP_KEY}&language=es`;
  const res = await fetch(u);
  const data = await res.json();
  const f = (data?.features || [])[0];
  if (!f) {
    const label = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    return { label, addr: {}, feature: null };
  }
  const addr = extractAddrFromFeature(f);
  // [CHANGE #1] fallback CP por etiqueta si faltara
  const label = f.place_name || f.text;
  const withCP = { ...addr, postalCode: addr.postalCode || inferPostalFromLabel(label) };
  return {
    label,
    addr: withCP,
    feature: f,
  };
}

// ── wrappers FE → BE
const patchUserWhatsapp = ({ number, visible, nationality }) =>
  updateMyWhatsapp({ number, visible, nationality });

const patchProWhatsapp = ({ number, visible, nationality }) =>
  updateMyWhatsappPro({ number, visible, nationality });

export default function ProfilePage() {
  const { user, setUser, bumpAvatarVersion } = useAuth();
  const navigate = useNavigate();

  const [hasProfessional, setHasProfessional] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    password: "",
    avatarUrl: "",
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("success");

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  // acordeones (mantener)
  const [openAccount, setOpenAccount] = useState(false);
  const [openWhatsApp, setOpenWhatsApp] = useState(false);
  const [openAddress, setOpenAddress] = useState(false);
  const [openAvailability, setOpenAvailability] = useState(false);
  const [openDeposit, setOpenDeposit] = useState(false);
  const [openPayout, setOpenPayout] = useState(false);
  const [openDocuments, setOpenDocuments] = useState(false);
  const [openLinkedin, setOpenLinkedin] = useState(false);

  // estado por sección (dirty / lastSaved)
  const [dirtyAccount, setDirtyAccount] = useState(false);
  const [savedAtAccount, setSavedAtAccount] = useState(null);

  const [dirtyWhatsApp, setDirtyWhatsApp] = useState(false);
  const [savedAtWhatsApp, setSavedAtWhatsApp] = useState(null);

  const [dirtyAddress, setDirtyAddress] = useState(false);
  const [savedAtAddress, setSavedAtAddress] = useState(null);

  const [dirtyAgenda, setDirtyAgenda] = useState(false);
  const [savedAtAgenda, setSavedAtAgenda] = useState(null);

  const [dirtyDeposit, setDirtyDeposit] = useState(false);
  const [savedAtDeposit, setSavedAtDeposit] = useState(null);

  const [dirtyPayout, setDirtyPayout] = useState(false);
  const [savedAtPayout, setSavedAtPayout] = useState(null);

  const [dirtyDocs, setDirtyDocs] = useState(false);
  const [savedAtDocs, setSavedAtDocs] = useState(null);

  const [dirtyLinkedin, setDirtyLinkedin] = useState(false);
  const [savedAtLinkedin, setSavedAtLinkedin] = useState(null);

  // toasts
  const [toasts, setToasts] = useState([]);
  const pushToast = (text) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [{ id, text }, ...t].slice(0, 3));
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3000);
  };

  const [addr, setAddr] = useState({
    country: "",
    state: "",
    city: "",
    street: "",
    number: "",
    unit: "",
    postalCode: "",
  });

  const [query, setQuery] = useState("");
  const [suggests, setSuggests] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [allowSuggests, setAllowSuggests] = useState(false);
  const debounceId = useRef(0);

  const [coords, setCoords] = useState(null);
  const [label, setLabel] = useState("");

  const [rows, setRows] = useState(() =>
    DAYS.map((d) => ({ key: d.key, active: false, from: "09:00", to: "18:00" }))
  );
  const [loadingAgenda, setLoadingAgenda] = useState(true);
  const [savingAgenda, setSavingAgenda] = useState(false);
  const [agendaMsg, setAgendaMsg] = useState("");

  const [docsMsg, setDocsMsg] = useState("");
  const [savingDocs, setSavingDocs] = useState(false);
  const [docCrFile, setDocCrFile] = useState(null);
  const [docLicFile, setDocLicFile] = useState(null);
  const [docCrExpiresAt, setDocCrExpiresAt] = useState("");
  const [documents, setDocuments] = useState(() => ({
    criminalRecord: null,
    license: null,
  }));

  // WhatsApp UI state
  const [waISO, setWaISO] = useState("AR");
  const [waNumber, setWaNumber] = useState("");
  const [waVisible, setWaVisible] = useState(false);
  const [waLoading, setWaLoading] = useState(true);
  const [waOpen, setWaOpen] = useState(false);
  const waAnchorRef = useRef(null);
  const [waErr, setWaErr] = useState("");

  const waCountry = useMemo(() => findCountry(waISO), [waISO]);

  // Depósito/Seña
  const [depositEnabled, setDepositEnabled] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [savingDeposit, setSavingDeposit] = useState(false);
  const [depositMsg, setDepositMsg] = useState("");
  const [depositMsgType, setDepositMsgType] = useState("success");

  // Cobros / Datos bancarios
  const [payout, setPayout] = useState({
    holderName: "",
    docType: "DNI",
    docNumber: "",
    bankName: "",
    cbu: "",
    alias: "",
  });
  const [savingPayout, setSavingPayout] = useState(false);
  const [payoutMsg, setPayoutMsg] = useState("");
  const [payoutMsgType, setPayoutMsgType] = useState("success");

  // LinkedIn
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [savingLinkedin, setSavingLinkedin] = useState(false);
  const [linkedinMsg, setLinkedinMsg] = useState("");
  const [linkedinMsgType, setLinkedinMsgType] = useState("success");

  const refreshDocs = async () => {
    try {
      const mine = await getMyProfessional();
      if (mine?.documents) {
        const cr = mine.documents.criminalRecord || null;
        const lic = mine.documents.license || null;
        setDocuments({
          criminalRecord: cr ? { ...cr, url: absUrl(cr.url) } : null,
          license: lic ? { ...lic, url: absUrl(lic.url) } : null,
        });
        setDocCrExpiresAt(
          cr?.expiresAt ? new Date(cr.expiresAt).toISOString().slice(0, 10) : ""
        );
      }
    } catch (e) {
      console.error("refreshDocs error", e);
    }
  };

  // carga inicial
  useEffect(() => {
    let meWa = null;

    (async () => {
      try {
        const me = await getMyProfile();
        log("GET /users/me → whatsapp:", me?.whatsapp);
        setForm({
          name: me.name || "",
          email: me.email || "",
          role: me.role || "",
          password: "",
          avatarUrl: me?.avatarUrl || "",
        });
        setAvatarPreview(absUrl(me?.avatarUrl || ""));
        setAddr((prev) => ({
          ...prev,
          country: me?.address?.country || "",
          state: me?.address?.state || "",
          city: me?.address?.city || "",
          street: me?.address?.street || "",
          number: me?.address?.number || "",
          unit: me?.address?.unit || "",
          postalCode: me?.address?.postalCode || "",
        }));
        const loc = me?.address?.location;
        if (loc?.lat != null && loc?.lng != null) {
          setCoords({ lat: loc.lat, lng: loc.lng });
          const lbl =
            me?.address?.label || `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`;
          setLabel(lbl);
          setQuery(lbl);
        } else {
          const line = buildAddressLabel(me?.address || {});
          if (line) setQuery(line);
        }
        meWa = me?.whatsapp || null;
      } catch {
        setMsgType("error");
        setMsg("No se pudo cargar tu perfil.");
      } finally {
        setLoadingProfile(false);
      }
    })();

    (async () => {
      try {
        const mine = await getMyProfessional();
        log("GET /professionals/me → whatsapp:", mine?.whatsapp);
        setHasProfessional(!!(mine && (mine._id || mine.exists)));

        if (mine?.availabilitySchedule) {
          const map =
            mine.availabilitySchedule instanceof Map
              ? Object.fromEntries(mine.availabilitySchedule)
              : mine.availabilitySchedule;

          setRows((prev) =>
            prev.map((r) => {
              const v = map[r.key];
              if (!v) return { ...r, active: false };
              return {
                ...r,
                active: true,
                from: v.from || "09:00",
                to: v.to || "18:00",
              };
            })
          );
        }

        if (mine?.documents) {
          const cr = mine.documents.criminalRecord || null;
          const lic = mine.documents.license || null;
          const crAbs = cr ? { ...cr, url: absUrl(cr.url) } : null;
          const licAbs = lic ? { ...lic, url: absUrl(lic.url) } : null;
          setDocuments({ criminalRecord: crAbs, license: licAbs });
          setDocCrExpiresAt(
            cr?.expiresAt ? new Date(cr.expiresAt).toISOString().slice(0, 10) : ""
          );
        }

        if (
          mine?.whatsapp &&
          (mine.whatsapp.number || mine.whatsapp.visible !== undefined)
        ) {
          const picked = pickFromE164(mine.whatsapp.number || "");
          log("INIT set from PRO:", { picked, visible: !!mine.whatsapp.visible });
          setWaISO(picked.iso);
          setWaNumber(picked.local);
          setWaVisible(!!mine.whatsapp.visible);
        } else if (meWa) {
          const picked = pickFromE164(meWa.number || "");
          log("INIT set from USER:", { picked, visible: !!meWa.visible });
          setWaISO(picked.iso);
          setWaNumber(picked.local);
          setWaVisible(!!meWa.visible);
        }

        if (mine) {
          setDepositEnabled(!!mine.depositEnabled);
          setDepositAmount(
            typeof mine.depositAmount === "number" && Number.isFinite(mine.depositAmount)
              ? String(mine.depositAmount)
              : ""
          );
        }

        setLinkedinUrl(mine?.linkedinUrl || "");

        if (mine?.payout) {
          setPayout({
            holderName: mine.payout.holderName || "",
            docType: mine.payout.docType || "DNI",
            docNumber: mine.payout.docNumber || "",
            bankName: mine.payout.bankName || "",
            cbu: mine.payout.cbu || "",
            alias: mine.payout.alias || "",
          });
        } else if (hasProfessional) {
          try {
            const p = await getMyPayout();
            setPayout({
              holderName: p?.holderName || "",
              docType: p?.docType || "DNI",
              docNumber: p?.docNumber || "",
              bankName: p?.bankName || "",
              cbu: p?.cbu || "",
              alias: p?.alias || "",
            });
          } catch {}
        }
      } catch {
        setHasProfessional(false);
      } finally {
        setLoadingAgenda(false);
        setWaLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(""), 2500);
    return () => clearTimeout(t);
  }, [msg]);
  useEffect(() => {
    if (!agendaMsg) return;
    const t = setTimeout(() => setAgendaMsg(""), 2500);
    return () => clearTimeout(t);
  }, [agendaMsg]);
  useEffect(() => {
    if (!docsMsg) return;
    const t = setTimeout(() => setDocsMsg(""), 2500);
    return () => clearTimeout(t);
  }, [docsMsg]);
  useEffect(() => {
    if (!depositMsg) return;
    const t = setTimeout(() => setDepositMsg(""), 2500);
    return () => clearTimeout(t);
  }, [depositMsg]);
  useEffect(() => {
    if (!payoutMsg) return;
    const t = setTimeout(() => setPayoutMsg(""), 2500);
    return () => clearTimeout(t);
  }, [payoutMsg]);
  useEffect(() => {
    if (!linkedinMsg) return;
    const t = setTimeout(() => setLinkedinMsg(""), 2500);
    return () => clearTimeout(t);
  }, [linkedinMsg]);

  const onChangeQuery = (e) => {
    setAllowSuggests(true);
    setQuery(e.target.value);
    setDirtyAddress(true);
  };

  useEffect(() => {
    window.clearTimeout(debounceId.current);
    if (!isFocused || !allowSuggests || !query?.trim()) {
      setSuggests([]);
      return;
    }
    debounceId.current = window.setTimeout(async () => {
      try {
        const list = await geocode(query);
        setSuggests(list.slice(0, 8));
      } catch {
        setSuggests([]);
      }
    }, 300);
  }, [query, isFocused, allowSuggests]);

  // UPDATE: merge no destructivo (si el geocoder no trae un campo, conservamos el actual)
  const applyGeoResult = useCallback(
    (res) => {
      if (!res) return;
      const { label: lbl, addr: a, feature } = res;

      setLabel(lbl || "");
      setQuery(lbl || "");
      setCoords({
        lat: feature?.center?.[1] ?? coords?.lat ?? null,
        lng: feature?.center?.[0] ?? coords?.lng ?? null,
      });

      setAddr((prev) => ({
        ...prev,
        country: a?.country || prev.country,
        state: a?.state || prev.state,
        city: a?.city || prev.city,
        street: a?.street || prev.street,
        number: a?.number || prev.number,
        postalCode: a?.postalCode || prev.postalCode, // ← CP solo si vino
      }));

      setDirtyAddress(true);
    },
    [coords?.lat, coords?.lng]
  );

  const pickSuggestion = (s) => {
    setSuggests([]);
    setAllowSuggests(false);
    applyGeoResult(s);
  };

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setDirtyAccount(true);
  };
  const onChangeAddr = (e) => {
    setAddr((a) => ({ ...a, [e.target.name]: e.target.value }));
    setDirtyAddress(true);
  };

  const useGPS = async () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        try {
          const res = await reverseGeocodeFull(c.lat, c.lng);
          applyGeoResult({ ...res, feature: { center: [c.lng, c.lat] } });
        } catch {
          const q = `${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}`;
          setLabel(q);
          setQuery(q);
          setDirtyAddress(true);
        }
      },
      () => {}
    );
  };

  // UPDATE: no mueve el mapa ni borra campos si no hay match fuerte; muestra sugerencias
  const geocodeFromFields = async () => {
    // Línea “inteligente” con orientación
    const line = normalizeAddressLine(addr);
    if (!line.trim()) return;

    try {
      const list = await geocode(line, {
        limit: 6,
        country: "AR",
        types: "address,street",
        proximity: coords || undefined, // sesgo a lo que ya tenés
      });

      if (!list.length) {
        // Búsqueda aproximada sin número para darte algo cercano
        const approxQ = normalizeAddressLine({ ...addr, number: "" });
        const approx = await geocode(approxQ, {
          limit: 6,
          country: "AR",
          types: "address,street",
          proximity: coords || undefined,
        });

        if (approx.length) {
          setSuggests(approx);
          setAllowSuggests(true);
          setIsFocused(true);
          setMsgType("error");
          setMsg("No encontramos la dirección exacta. Elegí una sugerencia aproximada o corregí número/orientación.");
        } else {
          setMsgType("error");
          setMsg("No encontramos nada con esos datos. Probá: Calle + Número + Ciudad.");
        }
        return;
      }

      // Usamos el más relevante; si es flojo, no aplicamos automáticamente
      const best = list.find((x) => (x.feature?.relevance ?? 0) >= 0.8) || list[0];
      if ((best.feature?.relevance ?? 0) < 0.8) {
        setSuggests(list);
        setAllowSuggests(true);
        setIsFocused(true);
        setMsgType("error");
        setMsg("Resultado poco claro. Elegí una opción de la lista o ajustá los campos.");
        return;
      }

      // Match confiable → aplicamos
      setSuggests([]);
      setAllowSuggests(false);
      applyGeoResult(best);
    } catch {
      setMsgType("error");
      setMsg("Hubo un problema buscando la dirección. Intentá nuevamente.");
    }
  };

  const essentialsOk = useMemo(() => {
    const nameOk = form.name.trim().length >= 2;
    const addrOk =
      addr.country &&
      addr.state &&
      addr.city &&
      addr.street &&
      addr.number &&
      addr.postalCode;
    return Boolean(nameOk && addrOk);
  }, [form.name, addr]);

  // Guardado (cuenta + whatsapp + ubicación)
  const saveCommon = async () => {
    log("saveCommon() start", {
      hasProfessional,
      waISO,
      waNumber,
      waVisible,
    });

    let newAvatarUrl = form.avatarUrl || "";
    let updatedAtFromUpload = null;

    if (avatarFile) {
      try {
        const fd = new FormData();
        fd.append("file", avatarFile);
        const r = await uploadMyAvatar(fd);
        const uploaded = r?.url || r?.user?.avatarUrl || "";
        if (uploaded) {
          newAvatarUrl = uploaded;
          setAvatarPreview(absUrl(uploaded));
          const nextUpdatedAt =
            r?.user?.updatedAt || new Date().toISOString();
          updatedAtFromUpload = nextUpdatedAt;
          setUser((prev) => ({
            ...prev,
            avatarUrl: uploaded,
            updatedAt: nextUpdatedAt,
          }));
          bumpAvatarVersion();
        }
      } catch (e) {
        console.error("upload avatar error", e);
        setMsgType("error");
        setMsg("No se pudo subir la foto. Probá nuevamente.");
        return;
      }
    }

    let e164 = "";
    const localDigits = onlyDigits(waNumber);

    if (localDigits.length > 0 || waVisible) {
      e164 = tryNormalizeWa(waISO, waCountry.dial, waNumber);
      log("normalize", {
        iso: waISO,
        dial: waCountry.dial,
        input: waNumber,
        e164,
        localDigits,
      });
      if (!e164 && localDigits.length > 0) {
        setWaErr(
          `El número no es válido para ${waCountry.name}. Revisá el código de área / celular.`
        );
        return;
      }
    }
    if (localDigits.length === 0) e164 = "";

    const clean = {
      country: addr.country.trim(),
      state: addr.state.trim(),
      city: addr.city.trim(),
      street: addr.street.trim(),
      number: addr.number.trim(),
      unit: addr.unit.trim(),
      postalCode: addr.postalCode.trim(),
    };

    const payload = {
      name: form.name.trim() || undefined,
      password: form.password?.trim() ? form.password.trim() : undefined,
      ...(newAvatarUrl ? { avatarUrl: newAvatarUrl } : {}),
      address: {
        ...clean,
        ...(coords
          ? {
              label: label || buildAddressLabel(clean),
              location: { lat: coords.lat, lng: coords.lng },
            }
          : {}),
      },
    };

    const resUser = await updateMyProfile(payload);
    const updated = resUser?.user || resUser;
    setUser((p) => ({
      ...p,
      ...updated,
      ...(updatedAtFromUpload ? { updatedAt: updatedAtFromUpload } : {}),
    }));

    if (hasProfessional) {
      try {
        await updateMyProfessional({
          address: {
            ...clean,
            label: label || buildAddressLabel(clean),
            ...(coords ? { location: { lat: coords.lat, lng: coords.lng } } : {}),
          },
        });
        if (coords) await updateMyLocation(coords.lat, coords.lng);
      } catch (e) {
        console.error("sync Professional addr/loc error", e);
      }
    }

    let waOk = true;
    try {
      if (hasProfessional) {
        log("PATCH /api/whatsapp/pro payload →", {
          nationality: waISO,
          whatsapp: { number: e164, visible: waVisible },
        });
        await patchProWhatsapp({
          number: e164,
          visible: waVisible,
          nationality: waISO,
        });
        const readback = await getMyProfessional();
        log("READBACK /professionals/me ←", readback?.whatsapp);
      } else {
        log("PATCH /api/whatsapp/me payload →", {
          number: e164,
          visible: waVisible,
          nationality: waISO,
        });
        await patchUserWhatsapp({
          number: e164,
          visible: waVisible,
          nationality: waISO,
        });
        const rb = await getMyProfile();
        log("READBACK /users/me ←", rb?.whatsapp);
      }
    } catch (e) {
      waOk = false;
      const apiMsg = e?.response?.data?.message;
      if (apiMsg === "INVALID_WHATSAPP_NUMBER") {
        setWaErr(
          `El número no es válido para ${waCountry.name}. Probá quitando ceros iniciales o revisando el área.`
        );
      } else {
        setWaErr("No pudimos guardar tu WhatsApp ahora. Intentá de nuevo.");
      }
      console.error("patch whatsapp error", e?.response?.data || e);
    }

    setAvatarFile(null);
    setMsgType(waOk ? "success" : "error");
    setMsg(
      waOk
        ? "✅ Cambios guardados"
        : "Se guardaron tus datos, pero el WhatsApp no se actualizó."
    );

    const now = Date.now();
    if (dirtyAccount) {
      setSavedAtAccount(now);
      setDirtyAccount(false);
      pushToast("✅ Cambios guardados en “Cuenta”.");
    }
    if (dirtyAddress) {
      setSavedAtAddress(now);
      setDirtyAddress(false);
      pushToast("✅ Cambios guardados en “Ubicación”.");
    }
    if (dirtyWhatsApp) {
      setSavedAtWhatsApp(now);
      setDirtyWhatsApp(false);
      if (waOk) pushToast("✅ Cambios guardados en “WhatsApp”.");
    }
  };

  const invalids = useMemo(() => {
    const bad = [];
    rows.forEach((r) => {
      if (!r.active) return;
      if (!r.from || !r.to || r.from >= r.to) bad.push(r.key);
    });
    return bad;
  }, [rows]);

  const onSaveAgenda = async () => {
    if (invalids.length) {
      setAgendaMsg("Revisá los horarios: inicio < fin.");
      return;
    }
    setSavingAgenda(true);
    try {
      await updateAvailabilitySchedule(
        rows.reduce((acc, r) => {
          if (r.active) acc[r.key] = { from: r.from, to: r.to };
          return acc;
        }, {})
      );
      await setAvailabilityMode("schedule");
      setAgendaMsg("✅ Agenda guardada y modo horario activo.");
      const now = Date.now();
      setSavedAtAgenda(now);
      setDirtyAgenda(false);
      pushToast("✅ Cambios guardados en “Disponibilidad”.");
    } catch {
      setAgendaMsg("No se pudo guardar la agenda.");
    } finally {
      setSavingAgenda(false);
    }
  };

  const onSaveDeposit = async () => {
    setSavingDeposit(true);
    try {
      const amt = String(depositAmount).trim();
      const MIN = 2000;
      const MAX = 5000;

      if (depositEnabled) {
        const n = Number(amt);
        if (!Number.isFinite(n) || n < MIN || n > MAX) {
          setDepositMsgType("error");
          setDepositMsg(
            `El monto debe estar entre $${MIN.toLocaleString("es-AR")} y $${MAX.toLocaleString("es-AR")}.`
          );
          setSavingDeposit(false);
          return;
        }
      }

      await updateMyProfessional({
        depositEnabled: !!depositEnabled,
        ...(depositEnabled ? { depositAmount: Math.round(Number(amt) || 0) } : {}),
      });

      setDepositMsgType("success");
      setDepositMsg("✅ Preferencias de seña actualizadas.");
      const now = Date.now();
      setSavedAtDeposit(now);
      setDirtyDeposit(false);
      pushToast("✅ Cambios guardados en “Reservas y seña”.");
    } catch (e) {
      console.error(e);
      setDepositMsgType("error");
      const apiMsg = e?.response?.data?.message || "No se pudo guardar.";
      setDepositMsg(apiMsg);
    } finally {
      setSavingDeposit(false);
    }
  };

  const onSavePayout = async () => {
    setSavingPayout(true);
    try {
      const clean = {
        holderName: payout.holderName.trim(),
        docType: payout.docType,
        docNumber: payout.docNumber.trim(),
        bankName: payout.bankName.trim(),
        cbu: payout.cbu.replace(/\D/g, ""),
        alias: payout.alias.trim().toLowerCase(),
      };

      if (!clean.holderName || !clean.docNumber) {
        setPayoutMsgType("error");
        setPayoutMsg("Completá titular y documento.");
        setSavingPayout(false);
        return;
      }
      if (!clean.cbu && !clean.alias) {
        setPayoutMsgType("error");
        setPayoutMsg("Ingresá CBU (22 dígitos) o Alias.");
        setSavingPayout(false);
        return;
      }
      if (clean.cbu && clean.cbu.length !== 22) {
        setPayoutMsgType("error");
        setPayoutMsg("El CBU debe tener 22 dígitos.");
        setSavingPayout(false);
        return;
      }

      await updateMyPayout(clean);
      setPayoutMsgType("success");
      setPayoutMsg("✅ Datos bancarios actualizados.");
      const now = Date.now();
      setSavedAtPayout(now);
      setDirtyPayout(false);
      pushToast("✅ Cambios guardados en “Cobros”.");
    } catch (e) {
      console.error(e);
      setPayoutMsgType("error");
      const apiMsg = e?.response?.data?.message || "No se pudo guardar.";
      setPayoutMsg(apiMsg);
    } finally {
      setSavingPayout(false);
    }
  };

  const onSaveLinkedin = async () => {
    setSavingLinkedin(true);
    try {
      const clean = (linkedinUrl || "").trim();
      if (clean && !isValidLinkedinUrl(clean)) {
        setLinkedinMsgType("error");
        setLinkedinMsg(
          "Ingresá una URL válida de LinkedIn (debe comenzar con https://www.linkedin.com/...)"
        );
        setSavingLinkedin(false);
        return;
      }
      await updateMyProfessional({
        linkedinUrl: clean || "",
      });
      setLinkedinMsgType("success");
      setLinkedinMsg(clean ? "✅ LinkedIn actualizado." : "✅ LinkedIn eliminado.");
      const now = Date.now();
      setSavedAtLinkedin(now);
      setDirtyLinkedin(false);
      pushToast("✅ Cambios guardados en “LinkedIn”.");
    } catch (e) {
      setLinkedinMsgType("error");
      setLinkedinMsg("No se pudo guardar tu LinkedIn.");
    } finally {
      setSavingLinkedin(false);
    }
  };

  const crExpired = useMemo(() => {
    const ex = documents?.criminalRecord?.expiresAt;
    return ex ? new Date(ex).getTime() < Date.now() : false;
  }, [documents?.criminalRecord?.expiresAt]);

  const autoUpload = async ({ which, file }) => {
    if (!hasProfessional || !file) return;
    try {
      setSavingDocs(true);
      setDocsMsg(which === "cr" ? "Subiendo certificado…" : "Subiendo matrícula…");
      const fd = new FormData();
      fd.append("file", file);
      if (which === "cr" && docCrExpiresAt) fd.append("expiresAt", docCrExpiresAt);
      const type = which === "cr" ? "criminal-record" : "license";
      const r = await uploadProfessionalDoc(type, fd);
      const docs = r?.documents || {};
      setDocuments({
        criminalRecord: docs.criminalRecord
          ? { ...docs.criminalRecord, url: absUrl(docs.criminalRecord.url) }
          : null,
        license: docs.license
          ? { ...docs.license, url: absUrl(docs.license.url) }
          : null,
      });
      if (which === "cr") setDocCrFile(null);
      if (which === "lic") setDocLicFile(null);
      await refreshDocs();
      setDocsMsg(which === "cr" ? "✅ Antecedentes subidos." : "✅ Matrícula subida.");
      const now = Date.now();
      setSavedAtDocs(now);
      setDirtyDocs(false);
      pushToast("✅ Documento subido en “Documentos”.");
    } catch (e) {
      console.error(e);
      setDocsMsg("No se pudo subir el archivo.");
    } finally {
      setSavingDocs(false);
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      const { user: updated } = await deleteMyAvatar();
      setAvatarPreview("");
      setAvatarFile(null);
      setForm((f) => ({ ...f, avatarUrl: "" }));
      setUser((prev) => ({
        ...prev,
        ...updated,
        updatedAt: updated?.updatedAt || new Date().toISOString(),
      }));
      bumpAvatarVersion();
      setMsgType("success");
      setMsg("✅ Foto eliminada");
      setDirtyAccount(true);
    } catch {
      setMsgType("error");
      setMsg("No se pudo eliminar la foto.");
    }
  };

  // flags y progreso
  const role = (form.role || user?.role || "").toLowerCase();
  const isAdmin = role === "admin";
  const isProfessional = role === "professional";
  const hasName = form.name.trim().length >= 2;
  const hasAddr =
    !!addr.country && !!addr.state && !!addr.city && !!addr.street && !!addr.number && !!addr.postalCode;

  const hasPhoto = !!avatarPreview;
  const waOk = (() => {
    const digits = (waNumber || "").replace(/\D/g, "");
    if (!waVisible || digits.length === 0) return false;
    return !!tryNormalizeWa(waISO, waCountry.dial, waNumber);
  })();

  const hasSchedule = !hasProfessional || rows.some((r) => r.active);
  const hasAnyDoc = !!(documents?.criminalRecord?.url || documents?.license?.url);
  const hasLinkedin = hasProfessional && (() => {
    const u = (linkedinUrl || "").trim();
    return u && isValidLinkedinUrl(u);
  })();

  const completionItems = [
    { key: "name", label: "Nombre", done: hasName, essential: true },
    { key: "addr", label: "Dirección completa", done: hasAddr, essential: true },
    { key: "photo", label: "Foto de perfil", done: hasPhoto },
    { key: "wa", label: "WhatsApp visible", done: waOk },
    ...(hasProfessional
      ? [
          { key: "sched", label: "Agenda con al menos 1 día activo", done: hasSchedule },
          { key: "docs", label: "Documentos cargados", done: hasAnyDoc },
          { key: "linkedin", label: "LinkedIn", done: hasLinkedin },
        ]
      : []),
  ];

  const doneCount = completionItems.filter((i) => i.done).length;
  const totalCount = completionItems.length;
  const completionPct = Math.round((doneCount / Math.max(1, totalCount)) * 100);

  const allowPanel = isAdmin || (hasName && hasAddr);

  // Quick Nav
  const sections = [
    { id: "sec-cuenta", title: "Cuenta", dirty: dirtyAccount, savedAt: savedAtAccount, done: hasName && hasPhoto },
    { id: "sec-whatsapp", title: "WhatsApp", dirty: dirtyWhatsApp, savedAt: savedAtWhatsApp, done: waOk },
    { id: "sec-ubicacion", title: "Ubicación", dirty: dirtyAddress, savedAt: savedAtAddress, done: hasAddr },
    ...(hasProfessional
      ? [
          { id: "sec-disponibilidad", title: "Disponibilidad", dirty: dirtyAgenda, savedAt: savedAtAgenda, done: hasSchedule },
          { id: "sec-sena", title: "Reservas y seña", dirty: dirtyDeposit, savedAt: savedAtDeposit, done: true },
          { id: "sec-cobros", title: "Cobros", dirty: dirtyPayout, savedAt: savedAtPayout, done: !!(payout.cbu || payout.alias) },
          { id: "sec-documentos", title: "Documentos", dirty: dirtyDocs, savedAt: savedAtDocs, done: hasAnyDoc },
          { id: "sec-linkedin", title: "LinkedIn", dirty: dirtyLinkedin, savedAt: savedAtLinkedin, done: hasLinkedin },
        ]
      : []),
  ];

  const anyDirty =
    dirtyAccount ||
    dirtyWhatsApp ||
    dirtyAddress ||
    dirtyAgenda ||
    dirtyDeposit ||
    dirtyPayout ||
    dirtyDocs ||
    dirtyLinkedin;

  const firstDirty = sections.find((s) => s.dirty);

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const guardadoChip = (dirty, savedAt) => {
    if (dirty) return <span className="text-xs px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">Cambios sin guardar</span>;
    if (savedAt)
      return (
        <span className="text-xs px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200" title={new Date(savedAt).toLocaleString()}>
        Guardado {timeAgo(savedAt)}
      </span>
    );
    return <span className="text-xs px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700 border-gray-200">Sin cambios</span>;
  };
  
  // chip estado booleano simple (para checklist)
  const boolChip = (ok, on=true, off=true) => {
    if (ok && on) return <span className="text-xs px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">completo</span>;
    if (!ok && off) return <span className="text-xs px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">pendiente</span>;
    return null;
  };
  
  if (loadingProfile) return <p className="text-center mt-28">Cargando tu perfil...</p>;
  
  const headerInitial = (form.name?.[0] || "U").toUpperCase();
  
  return (
    <>
      <Navbar />
      <BackBar
        title="Mi perfil"
        subtitle={
          isAdmin ? (
            "Administrás la plataforma"
          ) : isProfessional ? (
            <>
              <span className="font-semibold">Completá tus datos</span>
              <span className="mx-1">·</span>
              <span>Mientras más datos completes, más chances de que <b>te contraten</b>.</span>
            </>
          ) : (
            <>
              <span className="font-semibold">Completá tus datos</span>
              <span className="mx-1">·</span>
              <span>Mientras más datos completes, mejores opciones vas a tener para <b>contratar</b>.</span>
            </>
          )
        }
      />
  
      {/* Barra de cambios sin guardar (global) */}
      {anyDirty && (
        <div className="fixed top-14 left-0 right-0 z-[90]">
          <div className="mx-auto max-w-5xl px-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 flex items-center justify-between gap-3 shadow-sm">
              <div>
                Tienes cambios sin guardar {firstDirty ? <>en <b>{sections.find(s => s.id === firstDirty.id)?.title}</b></> : null}.
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1 rounded-lg border border-amber-300 hover:bg-amber-100"
                  onClick={() => firstDirty && scrollToId(firstDirty.id)}
                  title="Ir a la sección con cambios"
                >
                  Ir a la sección
                </button>
                <button
                  className="px-3 py-1 rounded-lg border hover:bg-white"
                  onClick={() => {
                    // Solo limpiamos flags de UI (no revertimos datos)
                    setDirtyAccount(false);
                    setDirtyWhatsApp(false);
                    setDirtyAddress(false);
                    setDirtyAgenda(false);
                    setDirtyDeposit(false);
                    setDirtyPayout(false);
                    setDirtyDocs(false);
                    setDirtyLinkedin(false);
                  }}
                  title="Descartar (solo limpia el indicador visual)"
                >
                  Descartar aviso
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
  
      {/* Toasts globales */}
      <Toasts
        items={toasts}
        onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))}
      />
  
      <div className="h-12 md:h-16" aria-hidden />
  
      {/* Progreso y checklist */}
      {!isAdmin && (
        <div className="bg-white px-4">
          <div className="max-w-5xl mx-auto mt-4 md:mt-6">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100">⚡</span>
                  <div>
                    <div className="font-medium text-amber-900">
                      Perfil {completionPct}% completo
                    </div>
                    {!allowPanel && (
                      <div className="text-xs text-amber-800">
                        Completá <b>Nombre</b> y <b>Dirección</b> para habilitar tu panel.
                      </div>
                    )}
                  </div>
                </div>
  
                <div className="hidden sm:block w-40">
                  <div className="h-2 rounded-full bg-white/60 overflow-hidden border border-amber-200">
                    <div className="h-full bg-amber-500" style={{ width: `${completionPct}%` }} />
                  </div>
                </div>
              </div>
  
              <div className="mt-3 flex flex-wrap gap-2">
                {completionItems.map(it => (
                  <span
                    key={it.key}
                    className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border
                      ${it.done
                        ? "bg-white border-emerald-200 text-emerald-700"
                        : "bg-white border-amber-200 text-amber-800"}`}
                    title={it.essential ? "Requisito para habilitar el panel" : "Suma confianza"}
                  >
                    {it.done ? "✔" : "•"} {it.label}
                    {it.essential && <span className="ml-1 text-[10px] opacity-70">(obligatorio)</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
  
      {/* Contenido principal con Quick Nav lateral */}
      <section className="relative min-h-screen bg-white text-[#0a0e17] pt-5 md:pt-5 pb-24 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-8">
          {/* Columna principal */}
          <div>
            {/* Encabezado */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-200 grid place-items-center text-gray-700 font-bold ring-2 ring-white shadow">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  headerInitial
                )}
              </div>
              <h1 className="text-3xl font-bold">Mi perfil</h1>
            </div>
  
            {msg && (
              <div
                className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
                  msgType === "success"
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}
              >
                {msg}
              </div>
            )}
  
            {/* CUENTA */}
            <div id="sec-cuenta" className="bg-white border rounded-2xl shadow-sm mb-4 overflow-hidden">
              <button
                onClick={() => setOpenAccount((o) => !o)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
              >
                {/* IZQUIERDA: ocupa ancho, forzado a alineación izquierda */}
                <div className="flex-1 min-w-0 text-left">
                  <h2 className="text-lg font-semibold leading-tight">Cuenta</h2>
                  <p className="text-sm text-gray-500 leading-snug truncate">Nombre, correo y foto</p>
                </div>

                {/* DERECHA: chips + chevron, no se encoge */}
                <div className="ml-3 flex items-center gap-3 shrink-0">
                  {guardadoChip(dirtyAccount, savedAtAccount)}
                  <Chevron open={openAccount} />
                </div>
              </button>

              {openAccount && (
                <div className="px-5 pb-5">
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium mb-2">Foto de perfil</label>
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          {avatarPreview ? (
                            <img
                              src={avatarPreview}
                              alt="Preview"
                              className="h-20 w-20 rounded-full object-cover ring-2 ring-gray-200"
                            />
                          ) : (
                            <div className="h-20 w-20 rounded-full bg-gray-200 grid place-items-center text-gray-600">
                              IMG
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 cursor-pointer w-fit">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) {
                                  setAvatarFile(f);
                                  const url = URL.createObjectURL(f);
                                  setAvatarPreview(url);
                                  setMsgType("success");
                                  setMsg("Nueva foto seleccionada. No olvides “Guardar cambios”.");
                                  setDirtyAccount(true);
                                }
                              }}
                            />
                            <span>Elegir archivo…</span>
                          </label>
  
                          {form.avatarUrl && !avatarFile && (
                            <button
                              type="button"
                              className="text-sm text-rose-700 hover:underline w-fit"
                              onClick={handleDeleteAvatar}
                            >
                              Quitar foto actual
                            </button>
                          )}
                          {avatarFile && (
                            <span className="text-xs text-gray-600">
                              {avatarFile.name} — listo para subir.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
  
                    <div>
                      <label className="block text-sm font-medium mb-1">Nombre</label>
                      <input
                        name="name"
                        value={form.name}
                        onChange={onChange}
                        onBlur={() =>
                          setForm(f => ({
                            ...f,
                            name: f.name
                              .trim()
                              .toLowerCase()
                              .replace(/\s+/g, " ")
                              .split(" ")
                              .map(w => w.charAt(0).toLocaleUpperCase("es-AR") + w.slice(1))
                              .join(" ")
                              .slice(0, 50)
                          }))}
                        maxLength={50}
                        className="w-full border rounded-lg px-4 py-2"
                        placeholder="Tu nombre completo"
                      />
                    </div>
  
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                          value={form.email}
                          disabled
                          className="w-full border rounded-lg px-4 py-2 bg-gray-100 text-gray-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Rol</label>
                        <input
                          value={form.role}
                          disabled
                          className="w-full border rounded-lg px-4 py-2 bg-gray-100 text-gray-600 capitalize"
                        />
                      </div>
                    </div>
  
                    <div className="flex justify-end">
                      <button
                        onClick={async () => {
                          setSavingProfile(true);
                          try {
                            await saveCommon();
                          } finally {
                            setSavingProfile(false);
                          }
                        }}
                        disabled={savingProfile}
                        className="px-4 py-2 rounded-lg bg-[#0a0e17] text-white hover:bg-black/80 disabled:opacity-60 cursor-pointer"
                      >
                        {savingProfile ? "Guardando..." : "Guardar cambios"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
  
            {/* WHATSAPP */}
            <div id="sec-whatsapp" className="bg-white border rounded-2xl shadow-sm mb-4 overflow-hidden">
            <button
              onClick={() => setOpenWhatsApp((o) => !o)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
            >
              {/* IZQUIERDA */}
              <div className="flex-1 min-w-0 text-left">
                <h2 className="text-lg font-semibold leading-tight">WhatsApp</h2>
                <p className="text-sm text-gray-500 leading-snug truncate">
                  Mostrá un botón de WhatsApp en tu perfil y durante la reserva
                </p>
              </div>

              {/* DERECHA */}
              <div className="ml-3 flex items-center gap-3 shrink-0">
                {guardadoChip(dirtyWhatsApp, savedAtWhatsApp)}
                <Chevron open={openWhatsApp} />
              </div>
            </button>
  
              {openWhatsApp && (
                <div className="px-5 pb-5 space-y-4">
                  <div className="grid md:grid-cols-[240px_minmax(0,1fr)] gap-3">
                    <div className="relative">
                      <label className="block text-xs text-gray-500 mb-1">País</label>
                      <button
                        ref={waAnchorRef}
                        type="button"
                        onClick={() => setWaOpen((o) => !o)}
                        className="w-full h-10 px-3 rounded-lg border bg-white flex items-center justify-between cursor-pointer"
                      >
                        <span className="inline-flex items-center gap-2">
                          <ReactCountryFlag svg countryCode={waCountry.iso} style={{ width: "1.1rem", height: "1.1rem" }} />
                          <span className="text-sm">{waCountry.iso}</span>
                          <span className="text-xs text-gray-500">{waCountry.dial}</span>
                        </span>
                        <svg width="18" height="18" viewBox="0 0 20 20" className="text-gray-500">
                          <path fill="currentColor" d="M5 7l5 5 5-5z" />
                        </svg>
                      </button>
  
                      <CountryDropdown
                        open={waOpen}
                        anchorRef={waAnchorRef}
                        valueISO={waISO}
                        onSelect={(iso) => { setWaISO(iso); setDirtyWhatsApp(true); }}
                        onClose={() => setWaOpen(false)}
                      />
                    </div>
  
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Número <span className="text-gray-400">(sin el código {waCountry.dial})</span>
                      </label>
                      <div className="flex">
                        <div className="h-10 px-2 shrink-0 flex items-center gap-1 border rounded-l-lg bg-gray-50 text-gray-700 text-sm">
                          <ReactCountryFlag svg countryCode={waCountry.iso} style={{ width: "1rem", height: "1rem" }} />
                          <span className="font-medium">{waCountry.iso}</span>
                          <span className="text-gray-500">{waCountry.dial}</span>
                        </div>
                        <input
                          inputMode="numeric"
                          placeholder="tu número sin el prefijo"
                          value={waNumber}
                          onChange={(e) => {
                            setWaErr("");
                            setWaNumber(onlyDigits(e.target.value));
                            setDirtyWhatsApp(true);
                          }}
                          onBlur={() => {
                            if (!waNumber) return setWaErr("");
                            const ok = !!tryNormalizeWa(waISO, waCountry.dial, waNumber);
                            setWaErr(ok ? "" : `El número no parece válido para ${waCountry.name}.`);
                          }}
                          className={`flex-1 h-10 px-3 border border-l-0 rounded-r-lg ${waErr ? "border-rose-400" : ""}`}
                        />
                      </div>
  
                      <label className="mt-3 inline-flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={waVisible}
                          onChange={(e) => { setWaVisible(e.target.checked); setDirtyWhatsApp(true); }}
                        />
                        <span>Mostrar en mi perfil</span>
                      </label>
  
                      {waErr ? (
                        <div className="text-[11px] text-rose-600 mt-1">{waErr}</div>
                      ) : (
                        <div className="text-[11px] text-gray-500 mt-1">Se usará para abrir WhatsApp (wa.me) desde tu perfil.</div>
                      )}
                    </div>
                  </div>
  
                  <div className="flex justify-end">
                    <button
                      onClick={async () => {
                        setSavingProfile(true);
                        try {
                          await saveCommon();
                        } finally {
                          setSavingProfile(false);
                        }
                      }}
                      disabled={savingProfile}
                      className="px-4 py-2 rounded-lg bg-[#0a0e17] text-white hover:bg-black/80 disabled:opacity-60 cursor-pointer"
                    >
                      {savingProfile ? "Guardando..." : "Guardar WhatsApp"}
                    </button>
                  </div>
                </div>
              )}
            </div>
  
            {/* UBICACIÓN */}
            <div id="sec-ubicacion" className="bg-white border rounded-2xl shadow-sm mb-4 overflow-hidden">
            <button
              onClick={() => setOpenAddress((o) => !o)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
            >
              {/* IZQUIERDA */}
              <div className="flex-1 min-w-0 text-left">
                <h2 className="text-lg font-semibold leading-tight">Ubicación</h2>
                <p className="text-sm text-gray-500 leading-snug truncate">
                  Buscá tu dirección, usá GPS o mové el punto en el mapa
                </p>
              </div>

              {/* DERECHA */}
              <div className="ml-3 flex items-center gap-3 shrink-0">
                {guardadoChip(dirtyAddress, savedAtAddress)}
                <Chevron open={openAddress} />
              </div>
            </button>

              {openAddress && (
                <div className="px-5 pb-5">
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Buscar dirección</label>
                    <input
                      value={query}
                      onChange={onChangeQuery}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => {
                        setIsFocused(false);
                        setTimeout(() => setSuggests([]), 100);
                      }}
                      placeholder="Ej.: Av. Siempre Viva 742, Springfield"
                      className="w-full border rounded-lg px-4 py-2"
                    />
                    {isFocused && allowSuggests && suggests.length > 0 && (
                      <div className="mt-2 rounded-lg border bg-white shadow-sm overflow-hidden max-h-64 overflow-y-auto">
                        {suggests.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onMouseDown={() => pickSuggestion(s)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50"
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
  
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={useGPS}
                      className="px-3 py-2 rounded bg-[#111827] text-white hover:bg-black cursor-pointer"
                    >
                      Usar GPS
                    </button>
                    <button
                      onClick={geocodeFromFields}
                      className="px-3 py-2 rounded border bg-white hover:bg-gray-50 cursor-pointer"
                    >
                      Geocodificar campos
                    </button>
                  </div>
  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-1">País *</label>
                      <input name="country" value={addr.country} onChange={onChangeAddr} className="w-full border rounded-lg px-4 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Provincia / Estado *</label>
                      <input name="state" value={addr.state} onChange={onChangeAddr} className="w-full border rounded-lg px-4 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Ciudad *</label>
                      <input name="city" value={addr.city} onChange={onChangeAddr} className="w-full border rounded-lg px-4 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Código Postal *</label>
                      <input name="postalCode" value={addr.postalCode} onChange={onChangeAddr} className="w-full border rounded-lg px-4 py-2" />
                    </div>
                    <div className="md:col-span-2 grid md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm mb-1">Calle *</label>
                        <input name="street" value={addr.street} onChange={onChangeAddr} className="w-full border rounded-lg px-4 py-2" />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Número *</label>
                        <input name="number" value={addr.number} onChange={onChangeAddr} className="w-full border rounded-lg px-4 py-2" />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm mb-1">Depto / Piso / Unidad</label>
                      <input name="unit" value={addr.unit} onChange={onChangeAddr} className="w-full border rounded-lg px-4 py-2" />
                    </div>
                  </div>
  
                  <div className="mt-4">
                    <div className="text-sm text-gray-600 mb-2">
                      {coords ? (
                        <>
                          Coordenadas: <b>{coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}</b>
                          {label ? <> · {label}</> : null}
                        </>
                      ) : (
                        <>Elegí una sugerencia, usá GPS o arrastrá el punto.</>
                      )}
                    </div>
                    <div className="rounded-xl overflow-hidden border">
                      <MapCanvas
                        center={coords || { lat: -34.6037, lng: -58.3816 }}
                        markers={[]}
                        radiusKm={null}
                        zoom={coords ? 15 : 12}
                        draggableOrigin
                        onOriginDragEnd={async ({ lat, lng }) => {
                          setCoords({ lat, lng });
                          try {
                            const res = await reverseGeocodeFull(lat, lng);
                            applyGeoResult({ ...res, feature: { center: [lng, lat] } });
                          } catch {
                            const nice = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
                            setLabel(nice);
                            setQuery(nice);
                            setDirtyAddress(true);
                          }
                          setAllowSuggests(false);
                          setSuggests([]);
                        }}
                      />
                    </div>
                  </div>
  
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={async () => {
                        setSavingProfile(true);
                        try {
                          await saveCommon();
                        } finally {
                          setSavingProfile(false);
                        }
                      }}
                      disabled={savingProfile}
                      className="px-4 py-2 rounded-lg bg-[#0a0e17] text-white cursor-pointer"
                    >
                      {savingProfile ? "Guardando..." : "Guardar ubicación"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* DISPONIBILIDAD (pro) */}
            {hasProfessional && (
              <div id="sec-disponibilidad" className="bg-white border rounded-2xl shadow-sm mb-4 overflow-hidden">
              <button
                onClick={() => setOpenAvailability((o) => !o)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
              >
                {/* IZQUIERDA */}
                <div className="flex-1 min-w-0 text-left">
                  <h2 className="text-lg font-semibold leading-tight">Disponibilidad</h2>
                  <p className="text-sm text-gray-500 leading-snug truncate">
                    Definí días y horarios
                  </p>
                </div>

                {/* DERECHA */}
                <div className="ml-3 flex items-center gap-3 shrink-0">
                  {guardadoChip(dirtyAgenda, savedAtAgenda)}
                  <Chevron open={openAvailability} />
                </div>
              </button>
  
                {openAvailability && (
                  <div className="px-5 pb-5">
                    {loadingAgenda ? (
                      <p className="text-gray-600 mt-2">Cargando…</p>
                    ) : (
                      <>
                        {agendaMsg && <div className="mt-2 text-sm">{agendaMsg}</div>}
                        <div className="mt-3 space-y-3">
                          {DAYS.map((d, idx) => {
                            const inactive = !rows[idx].active;
                            return (
                              <div
                                key={d.key}
                                className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 border rounded-xl ${
                                  inactive ? "bg-gray-50 border-gray-200" : "bg-white border-gray-300"
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-[180px]">
                                  <input
                                    id={`day-${d.key}`}
                                    type="checkbox"
                                    checked={rows[idx].active}
                                    onChange={(e) => {
                                      setRows((a) => a.map((r, i) => (i === idx ? { ...r, active: e.target.checked } : r)));
                                      setDirtyAgenda(true);
                                    }}
                                    className="h-5 w-5 cursor-pointer"
                                    aria-describedby={`day-help-${d.key}`}
                                  />
                                  <label htmlFor={`day-${d.key}`} className="cursor-pointer select-none">{d.label}</label>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ml-1 ${inactive ? "bg-gray-200 text-gray-600" : "bg-emerald-100 text-emerald-700"}`}>
                                    {inactive ? "Inactivo" : "Activo"}
                                  </span>
                                </div>
  
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:ml-auto w-full sm:w-auto">
                                  {inactive ? (
                                    <p id={`day-help-${d.key}`} className="text-xs text-gray-500 sm:mr-2">🔒 Activa el día para editar los horarios.</p>
                                  ) : null}
  
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">De</span>
                                    <input
                                      type="time"
                                      step="900"
                                      value={rows[idx].from}
                                      disabled={inactive}
                                      onChange={(e) => {
                                        setRows((a) => a.map((r, i) => (i === idx ? { ...r, from: e.target.value } : r)));
                                        setDirtyAgenda(true);
                                      }}
                                      title={inactive ? "Activa el día para editar" : "Editar hora de inicio"}
                                      className={`border rounded-lg px-3 py-2 text-sm transition ${
                                        inactive ? "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed" : "bg-white border-gray-300 focus:border-gray-400 focus:ring-1 focus:ring-gray-300"
                                      }`}
                                    />
                                  </div>
  
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">a</span>
                                    <input
                                      type="time"
                                      step="900"
                                      value={rows[idx].to}
                                      disabled={inactive}
                                      onChange={(e) => {
                                        setRows((a) => a.map((r, i) => (i === idx ? { ...r, to: e.target.value } : r)));
                                        setDirtyAgenda(true);
                                      }}
                                      title={inactive ? "Activa el día para editar" : "Editar hora de fin"}
                                      className={`border rounded-lg px-3 py-2 text-sm transition ${
                                        inactive ? "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed" : "bg-white border-gray-300 focus:border-gray-400 focus:ring-1 focus:ring-gray-300"
                                      }`}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-end gap-3 mt-4">
                          <button
                            onClick={() =>
                              { setRows(DAYS.map((d) => ({ key: d.key, active: false, from: "09:00", to: "18:00" }))); setDirtyAgenda(true); }
                            }
                            className="px-4 py-2 rounded border cursor-pointer"
                          >
                            Restablecer
                          </button>
                          <button
                            onClick={onSaveAgenda}
                            disabled={savingAgenda}
                            className="px-4 py-2 rounded bg-[#0a0e17] text-white cursor-pointer"
                          >
                            {savingAgenda ? "Guardando…" : "Guardar agenda"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
  
            {/* RESERVAS Y SEÑA (pro) */}
            {hasProfessional && (
              <div id="sec-sena" className="bg-white border rounded-2xl shadow-sm mb-4 overflow-hidden">
              <button
                onClick={() => setOpenDeposit((o) => !o)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
              >
                {/* IZQUIERDA */}
                <div className="flex-1 min-w-0 text-left">
                  <h2 className="text-lg font-semibold leading-tight">Reservas y seña</h2>
                  <p className="text-sm text-gray-500 leading-snug truncate">
                    Elegí si pedís seña y el monto fijo en ARS
                  </p>
                </div>

                {/* DERECHA */}
                <div className="ml-3 flex items-center gap-3 shrink-0">
                  {guardadoChip(dirtyDeposit, savedAtDeposit)}
                  <Chevron open={openDeposit} />
                </div>
              </button>

                {openDeposit && (
                  <div className="px-5 pb-5 space-y-4">
                    {depositMsg && (
                      <div
                        className={`rounded-lg border px-3 py-2 text-sm ${
                          depositMsgType === "success"
                            ? "bg-green-50 border-green-200 text-green-700"
                            : "bg-red-50 border-red-200 text-red-700"
                        }`}
                      >
                        {depositMsg}
                      </div>
                    )}
  
                    <div className="flex items-center justify-between gap-3">
                      <label className="inline-flex items-center gap-3 text-sm">
                        <input
                          type="checkbox"
                          checked={depositEnabled}
                          onChange={(e) => { setDepositEnabled(e.target.checked); setDirtyDeposit(true); }}
                        />
                        <span>Requerir seña para reservar</span>
                      </label>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        depositEnabled
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-gray-50 text-gray-700 border-gray-200"
                      }`}>
                        {depositEnabled ? "Activo" : "Inactivo"}
                      </span>
                    </div>
  
                    <div>
                      <label className="block text-sm font-medium mb-1">Monto fijo de la seña (ARS)</label>
                      <input
                        type="number"
                        min={2000}
                        max={5000}
                        step={100}
                        inputMode="numeric"
                        disabled={!depositEnabled}
                        value={depositAmount}
                        onChange={(e) => { setDepositAmount(e.target.value); setDirtyDeposit(true); }}
                        className={`w-full border rounded-lg px-3 py-2 ${depositEnabled ? "bg-white" : "bg-gray-100 text-gray-500"}`}
                        placeholder="Ej.: 3000"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Debe estar entre $2.000 y $5.000. Si desactivás la seña, tus clientes podrán reservar sin pasar por pago.
                      </p>
                    </div>
  
                    <div className="flex justify-end">
                      <button
                        onClick={onSaveDeposit}
                        disabled={savingDeposit}
                        className="px-4 py-2 rounded-lg bg-[#0a0e17] text-white hover:bg-black/80 disabled:opacity-60 cursor-pointer"
                      >
                        {savingDeposit ? "Guardando…" : "Guardar preferencias"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
  
            {/* COBROS / DATOS BANCARIOS (pro) */}
            {hasProfessional && (
              <div id="sec-cobros" className="bg-white border rounded-2xl shadow-sm mb-4 overflow-hidden">
              <button
                onClick={() => setOpenPayout((o) => !o)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
              >
                {/* IZQUIERDA */}
                <div className="flex-1 min-w-0 text-left">
                  <h2 className="text-lg font-semibold leading-tight">Cobros / Datos bancarios</h2>
                  <p className="text-sm text-gray-500 leading-snug truncate">
                    Guardá tu CBU o Alias para recibir pagos
                  </p>
                </div>

                {/* DERECHA */}
                <div className="ml-3 flex items-center gap-3 shrink-0">
                  {guardadoChip(dirtyPayout, savedAtPayout)}
                  <Chevron open={openPayout} />
                </div>
              </button>
  
                {openPayout && (
                  <div className="px-5 pb-5 space-y-4">
                    {payoutMsg && (
                      <div className={`rounded-lg border px-3 py-2 text-sm ${
                        payoutMsgType === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
                      }`}>{payoutMsg}</div>
                    )}
  
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Titular</label>
                        <input
                          value={payout.holderName}
                          onChange={(e) => { setPayout((p) => ({ ...p, holderName: e.target.value })); setDirtyPayout(true); }}
                          className="w-full border rounded-lg px-3 py-2"
                          placeholder="Nombre y apellido como figura en el banco"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Tipo de documento</label>
                        <select
                          value={payout.docType}
                          onChange={(e) => { setPayout((p) => ({ ...p, docType: e.target.value })); setDirtyPayout(true); }}
                          className="w-full border rounded-lg px-3 py-2"
                        >
                          <option value="DNI">DNI</option>
                          <option value="CUIT">CUIT</option>
                          <option value="CUIL">CUIL</option>
                          <option value="PAS">PAS</option>
                          <option value="OTRO">OTRO</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">N° de documento</label>
                        <input
                          value={payout.docNumber}
                          onChange={(e) => { setPayout((p) => ({ ...p, docNumber: e.target.value.replace(/\D/g, "") })); setDirtyPayout(true); }}
                          className="w-full border rounded-lg px-3 py-2"
                          inputMode="numeric"
                          placeholder="Solo números"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Banco</label>
                        <input
                          value={payout.bankName}
                          onChange={(e) => { setPayout((p) => ({ ...p, bankName: e.target.value })); setDirtyPayout(true); }}
                          className="w-full border rounded-lg px-3 py-2"
                          placeholder="Nombre del banco (opcional)"
                        />
                      </div>
                    </div>
  
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">CBU (22 dígitos)</label>
                        <input
                          value={payout.cbu}
                          onChange={(e) => { setPayout((p) => ({ ...p, cbu: e.target.value.replace(/\D/g, "") })); setDirtyPayout(true); }}
                          className="w-full border rounded-lg px-3 py-2"
                          inputMode="numeric"
                          placeholder="Ej.: 2850590940090418135201"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Alias</label>
                        <input
                          value={payout.alias}
                          onChange={(e) => { setPayout((p) => ({ ...p, alias: e.target.value.toLowerCase() })); setDirtyPayout(true); }}
                          className="w-full border rounded-lg px-3 py-2"
                          placeholder="tu.alias.banco"
                        />
                        <p className="text-xs text-gray-500 mt-1">Podés completar CBU o Alias.</p>
                      </div>
                    </div>
  
                    <div className="flex justify-end">
                      <button
                        onClick={onSavePayout}
                        disabled={savingPayout}
                        className="px-4 py-2 rounded-lg bg-[#0a0e17] text-white hover:bg-black/80 disabled:opacity-60 cursor-pointer"
                      >
                        {savingPayout ? "Guardando…" : "Guardar datos bancarios"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
  
            {/* DOCUMENTOS (pro) */}
            {hasProfessional && (
              <div id="sec-documentos" className="bg-white border rounded-2xl shadow-sm mb-4 overflow-hidden">
              <button
                onClick={() => setOpenDocuments((o) => !o)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
              >
                {/* IZQUIERDA */}
                <div className="flex-1 min-w-0 text-left">
                  <h2 className="text-lg font-semibold leading-tight">Documentos</h2>
                  <p className="text-sm text-gray-500 leading-snug truncate">
                    Antecedentes y matrícula (PDF)
                  </p>
                </div>

                {/* DERECHA */}
                <div className="ml-3 flex items-center gap-3 shrink-0">
                  {guardadoChip(dirtyDocs, savedAtDocs)}
                  <Chevron open={openDocuments} />
                </div>
              </button>
  
                {openDocuments && (
                  <div className="px-5 pb-5">
                    {docsMsg && (
                      <div className="mb-3 text-sm rounded-lg px-3 py-2 border bg-indigo-50 border-indigo-200 text-indigo-700">
                        {docsMsg}
                      </div>
                    )}
  
                    {/* Antecedentes penales */}
                    <div className="p-4 border rounded-xl mb-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">Certificado de antecedentes</h3>
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded-full border ${
                                documents?.criminalRecord?.url
                                  ? crExpired
                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-gray-50 text-gray-700 border-gray-200"
                              }`}
                            >
                              {documents?.criminalRecord?.url ? (crExpired ? "vencido" : "vigente") : "pendiente"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Elegí el PDF y se sube automáticamente.{" "}
                            <span className="text-gray-500">(Si querés guardar el vencimiento, elegilo antes de subir.)</span>
                          </p>
                          {documents?.criminalRecord?.url && (
                            <a
                              href={documents.criminalRecord.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-indigo-700 hover:underline"
                            >
                              Ver archivo actual
                            </a>
                          )}
                        </div>
                        <div className="text-xs text-gray-600">{savingDocs ? "Procesando…" : null}</div>
                      </div>
  
                      <div className="mt-3 grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm mb-1">Archivo (PDF)</label>
                          <label
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 cursor-pointer ${
                              savingDocs ? "opacity-60 pointer-events-none" : ""
                            }`}
                            title="Seleccionar archivo (se sube automáticamente)"
                          >
                            <input
                              type="file"
                              accept="application/pdf"
                              className="hidden"
                              onChange={async (e) => {
                                const f = e.target.files?.[0];
                                if (!f) return;
                                setDocCrFile(f);
                                await autoUpload({ which: "cr", file: f });
                                e.target.value = "";
                              }}
                            />
                            <span>{savingDocs ? "Subiendo…" : "Elegir archivo…"}</span>
                          </label>
                          <div className="text-xs text-gray-600 mt-1">
                            {documents?.criminalRecord?.url ? "Archivo cargado" : "Ningún archivo seleccionado"}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Vence (opcional)</label>
                          <input
                            type="date"
                            value={docCrExpiresAt}
                            onChange={(e) => { setDocCrExpiresAt(e.target.value); setDirtyDocs(true); }}
                            onFocus={(e) => e.target.showPicker && e.target.showPicker()}
                            className="w-full border rounded-lg px-3 py-2 cursor-pointer"
                          />
                          {documents?.criminalRecord?.expiresAt && (
                            <div className="text-xs text-gray-600 mt-1">
                              Actual: {new Date(documents.criminalRecord.expiresAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
  
                      <div className="mt-3 flex items-center gap-2">
                        {documents?.criminalRecord && (
                          <button
                            role="button"
                            className="px-3 py-1.5 rounded border border-rose-300 text-rose-700 hover:bg-rose-50 cursor-pointer"
                            onClick={async () => {
                              setSavingDocs(true);
                              try {
                                await deleteProfessionalDoc("criminal-record");
                                await refreshDocs();
                                setDocsMsg("Certificado eliminado.");
                                setDirtyDocs(true);
                              } finally {
                                setSavingDocs(false);
                              }
                            }}
                            title="Eliminar certificado"
                          >
                            Eliminar certificado
                          </button>
                        )}
                      </div>
                    </div>
  
                    {/* Matrícula */}
                    <div className="p-4 border rounded-xl">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">Matrícula profesional</h3>
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded-full border ${
                                documents?.license?.url
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-gray-50 text-gray-700 border-gray-200"
                              }`}
                            >
                              {documents?.license?.url ? "cargada" : "pendiente"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">Elegí el PDF y se sube automáticamente.</p>
                          {documents?.license?.url && (
                            <a
                              href={documents.license.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-indigo-700 hover:underline"
                            >
                              Ver archivo actual
                            </a>
                          )}
                        </div>
                        <div className="text-xs text-gray-600">{savingDocs ? "Procesando…" : null}</div>
                      </div>
  
                      <div className="mt-3">
                        <label className="block text-sm mb-1">Archivo (PDF)</label>
                        <label
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 cursor-pointer ${
                            savingDocs ? "opacity-60 pointer-events-none" : ""
                          }`}
                          title="Seleccionar archivo (se sube automáticamente)"
                        >
                          <input
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              setDocLicFile(f);
                              await autoUpload({ which: "lic", file: f });
                              e.target.value = "";
                            }}
                          />
                          <span>{savingDocs ? "Subiendo…" : "Elegir archivo…"}</span>
                        </label>
                        <div className="text-xs text-gray-600 mt-1">
                          {documents?.license?.url ? "Archivo cargado" : "Ningún archivo seleccionado"}
                        </div>
                      </div>
  
                      <div className="mt-3 flex items-center gap-2">
                        {documents?.license && (
                          <button
                            role="button"
                            className="px-3 py-1.5 rounded border border-rose-300 text-rose-700 hover:bg-rose-50 cursor-pointer"
                            onClick={async () => {
                              setSavingDocs(true);
                              try {
                                await deleteProfessionalDoc("license");
                                await refreshDocs();
                                setDocsMsg("Matrícula eliminada.");
                                setDirtyDocs(true);
                              } finally {
                                setSavingDocs(false);
                              }
                            }}
                            title="Eliminar matrícula"
                          >
                            Eliminar matrícula
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* LINKEDIN (pro) */}
            {hasProfessional && (
              <div id="sec-linkedin" className="bg-white border rounded-2xl shadow-sm mb-4 overflow-hidden">
              <button
                onClick={() => setOpenLinkedin((o) => !o)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
              >
                {/* IZQUIERDA */}
                <div className="flex-1 min-w-0 text-left">
                  <h2 className="text-lg font-semibold leading-tight">LinkedIn</h2>
                  <p className="text-sm text-gray-500 leading-snug truncate">
                    Agregá el enlace a tu perfil profesional
                  </p>
                </div>

                {/* DERECHA */}
                <div className="ml-3 flex items-center gap-3 shrink-0">
                  {guardadoChip(dirtyLinkedin, savedAtLinkedin)}
                  <Chevron open={openLinkedin} />
                </div>
              </button>
  
                {openLinkedin && (
                  <div className="px-5 pb-5 space-y-4">
                    {linkedinMsg && (
                      <div
                        className={`rounded-lg border px-3 py-2 text-sm ${
                          linkedinMsgType === "success"
                            ? "bg-green-50 border-green-200 text-green-700"
                            : "bg-red-50 border-red-200 text-red-700"
                        }`}
                      >
                        {linkedinMsg}
                      </div>
                    )}
  
                    <div>
                      <label className="block text-sm font-medium mb-1">URL de LinkedIn</label>
                      <input
                        value={linkedinUrl}
                        onChange={(e) => { setLinkedinUrl(e.target.value); setDirtyLinkedin(true); }}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="https://www.linkedin.com/in/tu-usuario"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Debe comenzar con <code>https://www.linkedin.com/</code>. Si dejás vacío, se quitará el ícono.
                      </p>
                    </div>
  
                    <div className="flex justify-end">
                      <button
                        onClick={onSaveLinkedin}
                        disabled={savingLinkedin}
                        className="px-4 py-2 rounded-lg bg-[#0a0e17] text-white hover:bg-black/80 disabled:opacity-60 cursor-pointer"
                      >
                        {savingLinkedin ? "Guardando…" : "Guardar LinkedIn"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
  
              <div className="mt-8 flex flex-col items-end gap-1">
              <button
                onClick={() => navigate(hasProfessional ? "/dashboard/professional" : "/dashboard/user")}
                disabled={!allowPanel}
                aria-disabled={!allowPanel}
                title={allowPanel ? "Abrir panel" : "Completá Nombre y Dirección para habilitar el panel"}
                className={`px-5 py-2 rounded-lg ${
                  allowPanel
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                Ir a mi panel
              </button>

              {/* Hint cuando está deshabilitado */}
              {!allowPanel && (
                <p className="text-xs text-gray-500">
                  Completá <b>Nombre</b> y <b>Dirección</b> para habilitar el panel.
                </p>
              )}
            </div>
          </div>
  
          {/* Rail Quick Nav */}
          <aside className="hidden lg:block sticky top-24 h-fit">
            <div className="rounded-2xl border bg-white p-3">
              <div className="px-2 py-1 text-xs font-medium text-gray-600">Secciones</div>
              <nav className="mt-1 space-y-1">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => scrollToId(s.id)}
                    className="w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left hover:bg-gray-50"
                    title={s.savedAt ? `Último guardado: ${new Date(s.savedAt).toLocaleString()}` : undefined}
                  >
                    <span className="text-sm">{s.title}</span>
                    <span className="inline-flex items-center gap-2">
                      {s.dirty ? (
                        <span className="h-2 w-2 rounded-full bg-amber-500" title="Cambios sin guardar" />
                      ) : s.done ? (
                        <span className="h-2 w-2 rounded-full bg-emerald-600" title="Completo" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-gray-300" title="Pendiente" />
                      )}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
