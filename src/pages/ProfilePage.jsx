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
  // ▶️ NUEVO:
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

// ───────── Map + geocode helpers
async function geocode(q) {
  if (!q?.trim()) return [];
  const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(
    q
  )}.json?key=${MAP_KEY}&language=es`;
  const res = await fetch(url);
  const data = await res.json();
  return (data?.features || []).map((f) => ({
    id: f.id,
    label: f.place_name || f.text,
    lat: f.center?.[1],
    lng: f.center?.[0],
  }));
}

async function reverseGeocode(lat, lng) {
  const u = `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${MAP_KEY}&language=es`;
  const res = await fetch(u);
  const data = await res.json();
  const f = (data?.features || [])[0];
  return f ? f.place_name || f.text : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

// ── wrappers FE → BE
const patchUserWhatsapp = ({ number, visible, nationality }) =>
  updateMyWhatsapp({ number, visible, nationality });

const patchProWhatsapp = ({ number, visible, nationality }) =>
  updateMyWhatsappPro({ number, visible, nationality });

export default function ProfilePage() {
  const { setUser, bumpAvatarVersion } = useAuth();
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

  const [openAccount, setOpenAccount] = useState(false);
  const [openAddress, setOpenAddress] = useState(false);
  const [openAvailability, setOpenAvailability] = useState(false);
  const [openDocuments, setOpenDocuments] = useState(false);

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

  // ───────── Depósito/Seña (nuevo)
  const [openDeposit, setOpenDeposit] = useState(false);
  const [depositEnabled, setDepositEnabled] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [savingDeposit, setSavingDeposit] = useState(false);
  const [depositMsg, setDepositMsg] = useState("");
  const [depositMsgType, setDepositMsgType] = useState("success");

  // ───────── Cobros / Datos bancarios (nuevo)
  const [openPayout, setOpenPayout] = useState(false);
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

  // ───────── LinkedIn (solo Professional)
  const [openLinkedin, setOpenLinkedin] = useState(false);
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

  // ─── Carga inicial con buffer para evitar carrera
  useEffect(() => {
    let meWa = null; // buffer del WhatsApp del USER

    // USER
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

        // guardar, NO setear
        meWa = me?.whatsapp || null;
      } catch {
        setMsgType("error");
        setMsg("No se pudo cargar tu perfil.");
      } finally {
        setLoadingProfile(false);
      }
    })();

    // PROFESSIONAL
    (async () => {
      try {
        const mine = await getMyProfessional();
        log("GET /professionals/me → whatsapp:", mine?.whatsapp);
        setHasProfessional(!!(mine && (mine._id || mine.exists)));

        // Agenda
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

        // Docs
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

        // WhatsApp: prioridad PRO; si no, USER (buffer)
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

        // Depósito/Seña: valores actuales
        if (mine) {
          setDepositEnabled(!!mine.depositEnabled);
          setDepositAmount(
            typeof mine.depositAmount === "number" && Number.isFinite(mine.depositAmount)
              ? String(mine.depositAmount)
              : ""
          );
        }

        // LinkedIn: valor actual
        setLinkedinUrl(mine?.linkedinUrl || "");

        // Cobros / Payout: cargar datos actuales
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
  // ▶️ NUEVO: limpiar mensajes payout
  useEffect(() => {
    if (!payoutMsg) return;
    const t = setTimeout(() => setPayoutMsg(""), 2500);
    return () => clearTimeout(t);
  }, [payoutMsg]);

  // ▶️ NUEVO: limpiar mensajes LinkedIn
  useEffect(() => {
    if (!linkedinMsg) return;
    const t = setTimeout(() => setLinkedinMsg(""), 2500);
    return () => clearTimeout(t);
  }, [linkedinMsg]);

  const onChangeQuery = (e) => {
    setAllowSuggests(true);
    setQuery(e.target.value);
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

  const pickSuggestion = (s) => {
    setQuery(s.label);
    setLabel(s.label);
    setCoords({ lat: s.lat, lng: s.lng });
    setSuggests([]);
    setAllowSuggests(false);
  };

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const onChangeAddr = (e) =>
    setAddr((a) => ({ ...a, [e.target.name]: e.target.value }));

  const useGPS = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        const q = `${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}`;
        setQuery(q);
        setLabel(q);
        setSuggests([]);
        setAllowSuggests(false);
      },
      () => {}
    );
  };

  // ✅ essentialsOk
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

  // Guardado
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

    // --- Normalizar WhatsApp (pero NO parcheamos todavía)
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
    if (localDigits.length === 0) e164 = ""; // limpiar

    // --- 1) Guardar datos de USER
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

    // --- 2) Si es PRO, sincronizar address/location
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

    // --- 3) AHORA SÍ: PATCH WhatsApp al FINAL
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
    } catch {
      setAgendaMsg("No se pudo guardar la agenda.");
    } finally {
      setSavingAgenda(false);
    }
  };

  // Depósito/Seña: guardar
  const onSaveDeposit = async () => {
    setSavingDeposit(true);
    try {
      const amt = String(depositAmount).trim();
      // límites ARS
      const MIN = 2000;
      const MAX = 5000;

      if (depositEnabled) {
        const n = Number(amt);
        if (!Number.isFinite(n) || n < MIN || n > MAX) {
          setDepositMsgType("error");
          setDepositMsg(`El monto debe estar entre $${MIN.toLocaleString("es-AR")} y $${MAX.toLocaleString("es-AR")}.`);
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
    } catch (e) {
      console.error(e);
      setDepositMsgType("error");
      const apiMsg = e?.response?.data?.message || "No se pudo guardar.";
      setDepositMsg(apiMsg);
    } finally {
      setSavingDeposit(false);
    }
  };

  // ▶️ NUEVO: guardar Cobros / Datos bancarios
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
    } catch (e) {
      console.error(e);
      setPayoutMsgType("error");
      const apiMsg = e?.response?.data?.message || "No se pudo guardar.";
      setPayoutMsg(apiMsg);
    } finally {
      setSavingPayout(false);
    }
  };

  // ▶️ NUEVO: guardar LinkedIn
  const onSaveLinkedin = async () => {
    setSavingLinkedin(true);
    try {
      const clean = (linkedinUrl || "").trim();
      if (clean && !isValidLinkedinUrl(clean)) {
        setLinkedinMsgType("error");
        setLinkedinMsg("Ingresá una URL válida de LinkedIn (debe comenzar con https://www.linkedin.com/...)");
        setSavingLinkedin(false);
        return;
      }
      await updateMyProfessional({
        linkedinUrl: clean || "", // vacío = quitar
      });
      setLinkedinMsgType("success");
      setLinkedinMsg(clean ? "✅ LinkedIn actualizado." : "✅ LinkedIn eliminado.");
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
      setDocsMsg(
        which === "cr" ? "Subiendo certificado…" : "Subiendo matrícula…"
      );
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
      setDocsMsg(
        which === "cr" ? "✅ Antecedentes subidos." : "✅ Matrícula subida."
      );
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
    } catch {
      setMsgType("error");
      setMsg("No se pudo eliminar la foto.");
    }
  };

  if (loadingProfile)
    return <p className="text-center mt-28">Cargando tu perfil...</p>;
  const headerInitial = (form.name?.[0] || "U").toUpperCase();

  return (
    <>
      <Navbar />
      <BackBar
        title="Mi perfil"
        subtitle={
          hasProfessional
            ? "Editá tu cuenta, foto, ubicación, documentos y disponibilidad"
            : "Editá tu cuenta, foto y ubicación"
        }
      />

      <section className="min-h-screen bg-white text-[#0a0e17] pt-30 pb-24 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Encabezado */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-200 grid place-items-center text-gray-700 font-bold ring-2 ring-white shadow">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
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
          <div className="bg-white border rounded-2xl shadow-sm mb-4 overflow-hidden">
            <button
              onClick={() => setOpenAccount((o) => !o)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
            >
              <div>
                <h2 className="text-lg font-semibold">Cuenta</h2>
                <p className="text-sm text-gray-500">Nombre, email, rol y foto</p>
              </div>
              <Chevron open={openAccount} />
            </button>

            {openAccount && (
              <div className="px-5 pb-5">
                <div className="space-y-5">
                  {/* Foto de perfil */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Foto de perfil
                    </label>
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
                                setMsg(
                                  "Nueva foto seleccionada. No olvides “Guardar cambios”."
                                );
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

                  {/* Nombre / email / rol */}
                  <div>
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
                      }))
                    }
                    maxLength={50}
                    className="w-full border rounded-lg px-4 py-2"
                    placeholder="Tu nombre completo"
                  />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Email
                      </label>
                      <input
                        value={form.email}
                        disabled
                        className="w-full border rounded-lg px-4 py-2 bg-gray-100 text-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Rol
                      </label>
                      <input
                        value={form.role}
                        disabled
                        className="w-full border rounded-lg px-4 py-2 bg-gray-100 text-gray-600 capitalize"
                      />
                    </div>
                  </div>

                  {/* ───────────────── WhatsApp ──────────────── */}
                  <div className="border rounded-xl p-4">
                    <div className="font-semibold mb-1">Compartir WhatsApp</div>
                    <p className="text-xs text-gray-600 mb-3">
                      Mostrá un botón de WhatsApp en tu perfil y al reservar. Elegí el país con la
                      banderita y escribí el resto del número.
                    </p>

                    <div className="grid md:grid-cols-[240px_minmax(0,1fr)] gap-3">
                      {/* selector de país */}
                      <div className="relative">
                        <label className="block text-xs text-gray-500 mb-1">
                          País
                        </label>
                        <button
                          ref={waAnchorRef}
                          type="button"
                          onClick={() => setWaOpen((o) => !o)}
                          className="w-full h-10 px-3 rounded-lg border bg-white flex items-center justify-between cursor-pointer"
                        >
                          <span className="inline-flex items-center gap-2">
                            <ReactCountryFlag
                              svg
                              countryCode={waCountry.iso}
                              style={{ width: "1.1rem", height: "1.1rem" }}
                            />
                            <span className="text-sm">{waCountry.iso}</span>
                            <span className="text-xs text-gray-500">
                              {waCountry.dial}
                            </span>
                          </span>
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 20 20"
                            className="text-gray-500"
                          >
                            <path fill="currentColor" d="M5 7l5 5 5-5z" />
                          </svg>
                        </button>

                        <CountryDropdown
                          open={waOpen}
                          anchorRef={waAnchorRef}
                          valueISO={waISO}
                          onSelect={(iso) => setWaISO(iso)}
                          onClose={() => setWaOpen(false)}
                        />
                      </div>

                      {/* número sin prefijo */}
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Número{" "}
                          <span className="text-gray-400">
                            (sin el código {waCountry.dial})
                          </span>
                        </label>
                        <div className="flex">
                          <div className="h-10 px-2 shrink-0 flex items-center gap-1 border rounded-l-lg bg-gray-50 text-gray-700 text-sm">
                            <ReactCountryFlag
                              svg
                              countryCode={waCountry.iso}
                              style={{ width: "1rem", height: "1rem" }}
                            />
                            <span className="font-medium">{waCountry.iso}</span>
                            <span className="text-gray-500">
                              {waCountry.dial}
                            </span>
                          </div>
                          <input
                            inputMode="numeric"
                            placeholder="tu número sin el prefijo"
                            value={waNumber}
                            onChange={(e) => {
                              setWaErr("");
                              setWaNumber(onlyDigits(e.target.value));
                            }}
                            onBlur={() => {
                              if (!waNumber) return setWaErr("");
                              const ok = !!tryNormalizeWa(
                                waISO,
                                waCountry.dial,
                                waNumber
                              );
                              setWaErr(
                                ok
                                  ? ""
                                  : `El número no parece válido para ${waCountry.name}.`
                              );
                            }}
                            className={`flex-1 h-10 px-3 border border-l-0 rounded-r-lg ${
                              waErr ? "border-rose-400" : ""
                            }`}
                          />
                        </div>

                        <label className="mt-3 inline-flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={waVisible}
                            onChange={(e) => setWaVisible(e.target.checked)}
                          />
                          <span>Mostrar en mi perfil</span>
                        </label>

                        {waErr ? (
                          <div className="text-[11px] text-rose-600 mt-1">
                            {waErr}
                          </div>
                        ) : (
                          <div className="text-[11px] text-gray-500 mt-1">
                            Se usará para abrir WhatsApp (wa.me) desde tu perfil.
                          </div>
                        )}
                      </div>
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

          {/* 💳 RESERVAS Y SEÑA (solo Professional) */}
          {hasProfessional && (
            <div className="bg-white border rounded-2xl shadow-sm mb-4 overflow-hidden">
              <button
                onClick={() => setOpenDeposit((o) => !o)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
              >
                <div>
                  <h2 className="text-lg font-semibold">Reservas y seña</h2>
                  <p className="text-sm text-gray-500">
                    Definí si pedís seña y el monto fijo en ARS
                  </p>
                </div>
                <Chevron open={openDeposit} />
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
                        onChange={(e) => setDepositEnabled(e.target.checked)}
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
                    <label className="block text-sm font-medium mb-1">
                      Monto fijo de la seña (ARS)
                    </label>
                    <input
                      type="number"
                      min={2000}
                      max={5000}
                      step={100}
                      inputMode="numeric"
                      disabled={!depositEnabled}
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
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

          {/* 💸 COBROS / DATOS BANCARIOS (solo Professional) */}
          {hasProfessional && (
            <div className="bg-white border rounded-2xl shadow-sm mb-4 overflow-hidden">
              <button
                onClick={() => setOpenPayout((o) => !o)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
              >
                <div>
                  <h2 className="text-lg font-semibold">Cobros / Datos bancarios</h2>
                  <p className="text-sm text-gray-500">Guardá tu CBU o Alias para recibir liquidaciones</p>
                </div>
                <Chevron open={openPayout} />
              </button>

              {openPayout && (
                <div className="px-5 pb-5 space-y-4">
                  {payoutMsg && (
                    <div className={`rounded-lg border px-3 py-2 text-sm ${
                      payoutMsgType === "success"
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-red-50 border-red-200 text-red-700"
                    }`}>{payoutMsg}</div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Titular</label>
                      <input
                        value={payout.holderName}
                        onChange={(e) => setPayout((p) => ({ ...p, holderName: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="Nombre y apellido como figura en el banco"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tipo de documento</label>
                      <select
                        value={payout.docType}
                        onChange={(e) => setPayout((p) => ({ ...p, docType: e.target.value }))}
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
                        onChange={(e) => setPayout((p) => ({ ...p, docNumber: e.target.value.replace(/\D/g, "") }))}
                        className="w-full border rounded-lg px-3 py-2"
                        inputMode="numeric"
                        placeholder="Solo números"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Banco</label>
                      <input
                        value={payout.bankName}
                        onChange={(e) => setPayout((p) => ({ ...p, bankName: e.target.value }))}
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
                        onChange={(e) => setPayout((p) => ({ ...p, cbu: e.target.value.replace(/\D/g, "") }))}
                        className="w-full border rounded-lg px-3 py-2"
                        inputMode="numeric"
                        placeholder="Ej.: 2850590940090418135201"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Alias</label>
                      <input
                        value={payout.alias}
                        onChange={(e) => setPayout((p) => ({ ...p, alias: e.target.value.toLowerCase() }))}
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

          {/* 🔗 LINKEDIN (solo Professional) */}
          {hasProfessional && (
            <div className="bg-white border rounded-2xl shadow-sm mb-4 overflow-hidden">
              <button
                onClick={() => setOpenLinkedin((o) => !o)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
              >
                <div>
                  <h2 className="text-lg font-semibold">LinkedIn</h2>
                  <p className="text-sm text-gray-500">
                    Guardá el enlace a tu perfil de LinkedIn (se usa en las cards)
                  </p>
                </div>
                <Chevron open={openLinkedin} />
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
                    <label className="block text-sm font-medium mb-1">
                      URL de LinkedIn
                    </label>
                    <input
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
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

          {/* UBICACIÓN */}
          <div className="bg-white border rounded-2xl shadow-sm mb-4 overflow-hidden">
            <button
              onClick={() => setOpenAddress((o) => !o)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
            >
              <div>
                <h2 className="text-lg font-semibold pr-40">Buscar dirección</h2>
                <p className="text-sm text-gray-500">
                  Ingresá una dirección, usá GPS o mové el punto en mapa
                </p>
              </div>
              <Chevron open={openAddress} />
            </button>

            {openAddress && (
              <div className="px-5 pb-5">
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">
                    Buscar dirección
                  </label>
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
                    onClick={() => {
                      const line = buildAddressLabel(addr);
                      if (!line) return;
                      setAllowSuggests(true);
                      setQuery(line);
                    }}
                    className="px-3 py-2 rounded border bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    Geocodificar campos
                  </button>
                </div>

                {/* Campos humanos */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">País *</label>
                    <input
                      name="country"
                      value={addr.country}
                      onChange={onChangeAddr}
                      className="w-full border rounded-lg px-4 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">
                      Provincia / Estado *
                    </label>
                    <input
                      name="state"
                      value={addr.state}
                      onChange={onChangeAddr}
                      className="w-full border rounded-lg px-4 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Ciudad *</label>
                    <input
                      name="city"
                      value={addr.city}
                      onChange={onChangeAddr}
                      className="w-full border rounded-lg px-4 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Código Postal *</label>
                    <input
                      name="postalCode"
                      value={addr.postalCode}
                      onChange={onChangeAddr}
                      className="w-full border rounded-lg px-4 py-2"
                    />
                  </div>
                  <div className="md:col-span-2 grid md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm mb-1">Calle *</label>
                      <input
                        name="street"
                        value={addr.street}
                        onChange={onChangeAddr}
                        className="w-full border rounded-lg px-4 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Número *</label>
                      <input
                        name="number"
                        value={addr.number}
                        onChange={onChangeAddr}
                        className="w-full border rounded-lg px-4 py-2"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm mb-1">
                      Depto / Piso / Unidad
                    </label>
                    <input
                      name="unit"
                      value={addr.unit}
                      onChange={onChangeAddr}
                      className="w-full border rounded-lg px-4 py-2"
                    />
                  </div>
                </div>

                {/* Mapa con arrastre */}
                <div className="mt-4">
                  <div className="text-sm text-gray-600 mb-2">
                    {coords ? (
                      <>
                        Coordenadas:{" "}
                        <b>
                          {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                        </b>
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
                        const nice = await reverseGeocode(lat, lng);
                        setLabel(nice);
                        setQuery(nice);
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

          {/* DOCUMENTOS (solo Professional) */}
          {hasProfessional && (
            <div className="bg-white border rounded-2xl shadow-sm mb-4 overflow-hidden">
              <button
                onClick={() => setOpenDocuments((o) => !o)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
              >
                <div>
                  <h2 className="text-lg font-semibold">Documentos</h2>
                  <p className="text-sm text-gray-500">
                    Antecedentes penales y matrícula
                  </p>
                </div>
                <Chevron open={openDocuments} />
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
                          <h3 className="font-semibold">
                            Certificado de antecedentes
                          </h3>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full border ${
                              documents?.criminalRecord?.url
                                ? crExpired
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-gray-50 text-gray-700 border-gray-200"
                            }`}
                          >
                            {documents?.criminalRecord?.url
                              ? crExpired
                                ? "vencido"
                                : "vigente"
                              : "pendiente"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Elegí el PDF y se sube automáticamente.{" "}
                          <span className="text-gray-500">
                            (Si querés guardar el vencimiento, elegilo antes de
                            seleccionar el PDF).
                          </span>
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
                      <div className="text-xs text-gray-600">
                        {savingDocs ? "Procesando…" : null}
                      </div>
                    </div>

                    <div className="mt-3 grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm mb-1">
                          Archivo (PDF)
                        </label>
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
                          {documents?.criminalRecord?.url
                            ? "Archivo cargado"
                            : "Ningún archivo seleccionado"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm mb-1">
                          Vence (opcional)
                        </label>
                        <input
                          type="date"
                          value={docCrExpiresAt}
                          onChange={(e) => setDocCrExpiresAt(e.target.value)}
                          onFocus={(e) => e.target.showPicker && e.target.showPicker()}
                          className="w-full border rounded-lg px-3 py-2 cursor-pointer"
                        />

                        {documents?.criminalRecord?.expiresAt && (
                          <div className="text-xs text-gray-600 mt-1">
                            Actual:{" "}
                            {new Date(
                              documents.criminalRecord.expiresAt
                            ).toLocaleDateString()}
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
                        <p className="text-sm text-gray-600">
                          Elegí el PDF y se sube automáticamente.
                        </p>
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
                      <div className="text-xs text-gray-600">
                        {savingDocs ? "Procesando…" : null}
                      </div>
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
                        {documents?.license?.url
                          ? "Archivo cargado"
                          : "Ningún archivo seleccionado"}
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

          {/* DISPONIBILIDAD */}
          {hasProfessional && (
            <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenAvailability((o) => !o)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
              >
                <div>
                  <h2 className="text-lg font-semibold">Disponibilidad</h2>
                  <p className="text-sm text-gray-500">
                    Agenda semanal y horarios
                  </p>
                </div>
                <Chevron open={openAvailability} />
              </button>

              {openAvailability && (
                <div className="px-5 pb-5">
                  <h2 className="sr-only">Disponibilidad</h2>
                  {loadingAgenda ? (
                    <p className="text-gray-600 mt-2">Cargando…</p>
                  ) : (
                    <>
                      {agendaMsg && (
                        <div className="mt-2 text-sm">{agendaMsg}</div>
                      )}
                      <div className="mt-3 space-y-3">
                        {DAYS.map((d, idx) => {
                          const inactive = !rows[idx].active;
                          return (
                            <div
                              key={d.key}
                              className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 border rounded-xl ${
                                inactive
                                  ? "bg-gray-50 border-gray-200"
                                  : "bg-white border-gray-300"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-[180px]">
                                <input
                                  id={`day-${d.key}`}
                                  type="checkbox"
                                  checked={rows[idx].active}
                                  onChange={(e) =>
                                    setRows((a) =>
                                      a.map((r, i) =>
                                        i === idx
                                          ? { ...r, active: e.target.checked }
                                          : r
                                      )
                                    )
                                  }
                                  className="h-5 w-5 cursor-pointer"
                                  aria-describedby={`day-help-${d.key}`}
                                />
                                <label
                                  htmlFor={`day-${d.key}`}
                                  className="cursor-pointer select-none"
                                >
                                  {d.label}
                                </label>

                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full ml-1 ${
                                    inactive
                                      ? "bg-gray-200 text-gray-600"
                                      : "bg-emerald-100 text-emerald-700"
                                  }`}
                                >
                                  {inactive ? "Inactivo" : "Activo"}
                                </span>
                              </div>

                              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:ml-auto w-full sm:w-auto">
                                {inactive ? (
                                  <p
                                    id={`day-help-${d.key}`}
                                    className="text-xs text-gray-500 sm:mr-2"
                                  >
                                    🔒 Activa el día para editar los horarios.
                                  </p>
                                ) : null}

                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-600">De</span>
                                  <input
                                    type="time"
                                    step="900"
                                    value={rows[idx].from}
                                    disabled={inactive}
                                    onChange={(e) =>
                                      setRows((a) =>
                                        a.map((r, i) =>
                                          i === idx
                                            ? { ...r, from: e.target.value }
                                            : r
                                        )
                                      )
                                    }
                                    title={
                                      inactive
                                        ? "Activa el día para editar"
                                        : "Editar hora de inicio"
                                    }
                                    className={`border rounded-lg px-3 py-2 text-sm transition ${
                                      inactive
                                        ? "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed"
                                        : "bg-white border-gray-300 focus:border-gray-400 focus:ring-1 focus:ring-gray-300"
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
                                    onChange={(e) =>
                                      setRows((a) =>
                                        a.map((r, i) =>
                                          i === idx
                                            ? { ...r, to: e.target.value }
                                            : r
                                        )
                                      )
                                    }
                                    title={
                                      inactive
                                        ? "Activa el día para editar"
                                        : "Editar hora de fin"
                                    }
                                    className={`border rounded-lg px-3 py-2 text-sm transition ${
                                      inactive
                                        ? "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed"
                                        : "bg-white border-gray-300 focus:border-gray-400 focus:ring-1 focus:ring-gray-300"
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
                            setRows(
                              DAYS.map((d) => ({
                                key: d.key,
                                active: false,
                                from: "09:00",
                                to: "18:00",
                              }))
                            )
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

          <div className="mt-8 flex justify-end">
            <button
              onClick={() => navigate("/dashboard/professional")}
              disabled={!essentialsOk}
              className={`px-5 py-2 rounded-lg ${
                essentialsOk
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              Ir a mi panel
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
