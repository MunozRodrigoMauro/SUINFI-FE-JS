// src/api/whatsappService.js
import axiosUser from "./axiosUser";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export async function getMyWhatsapp() {
  const { data } = await axiosUser.get(`${API}/whatsapp/me`);
  return data || {};
}

export async function updateMyWhatsapp(payload) {
  // payload: { number?: string, visible?: boolean, nationality?: string }
  const { data } = await axiosUser.patch(`${API}/whatsapp/me`, payload);
  return data || {};
}

// ⬇️ NUEVO: endpoint específico del profesional (/api/whatsapp/pro)
export async function updateMyWhatsappPro({ number, visible, nationality }) {
  const body = {
    nationality,               // "AR"
    whatsapp: { number, visible } // { number: "+549...", visible: true/false }
  };
  const { data } = await axiosUser.patch(`${API}/whatsapp/pro`, body);
  return data || {};
}

// (opcional) Activá logs de requests/responses de WhatsApp
export function enableWhatsappDebugLogs(enable = true) {
  if (!enable) return;
  const tag = "[WA][axios]";
  // evitá duplicar interceptores si se llama más de una vez
  if (axiosUser.__waDebugInstalled) return;
  axiosUser.__waDebugInstalled = true;

  axiosUser.interceptors.request.use((cfg) => {
    if (cfg.url?.includes("/whatsapp/")) {
      console.log(tag, "REQ", cfg.method?.toUpperCase(), cfg.url, cfg.data);
    }
    return cfg;
  });
  axiosUser.interceptors.response.use(
    (res) => {
      if (res.config?.url?.includes("/whatsapp/")) {
        console.log(tag, "RES", res.status, res.config.url, res.data);
      }
      return res;
    },
    (err) => {
      if (err.config?.url?.includes("/whatsapp/")) {
        console.log(tag, "ERR", err.response?.status, err.config.url, err.response?.data);
      }
      return Promise.reject(err);
    }
  );
}
