// src/context/SearchContext.jsx
import React, { createContext, useContext, useMemo, useReducer, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const SearchContext = createContext(null);

const initialState = {
  step: 1,
  query: {
    location: null,     // { lat, lng, label }
    serviceIds: [],     // array de _id
    intent: "now",      // "now" | "schedule"
    radiusKm: 10,
  },
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, step: Math.min(3, Math.max(1, action.step)) };
    case "SET_LOCATION":
      return { ...state, query: { ...state.query, location: action.location } };
    case "ADD_SERVICE":
      if (state.query.serviceIds.includes(action.id)) return state;
      return { ...state, query: { ...state.query, serviceIds: [...state.query.serviceIds, action.id] } };
    case "REMOVE_SERVICE":
      return {
        ...state,
        query: { ...state.query, serviceIds: state.query.serviceIds.filter((x) => x !== action.id) },
      };
    case "SET_INTENT":
      return { ...state, query: { ...state.query, intent: action.intent } };
    case "SET_RADIUS":
      return { ...state, query: { ...state.query, radiusKm: action.radiusKm } };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export function SearchProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const navigate = useNavigate();

  // === Callbacks ESTABLES (no cambian en cada render)
  const setStep = useCallback((n) => dispatch({ type: "SET_STEP", step: n }), []);
  const setLocation = useCallback((location) => dispatch({ type: "SET_LOCATION", location }), []);
  const addService = useCallback((id) => dispatch({ type: "ADD_SERVICE", id }), []);
  const removeService = useCallback((id) => dispatch({ type: "REMOVE_SERVICE", id }), []);
  const setIntent = useCallback((intent) => dispatch({ type: "SET_INTENT", intent }), []);
  const setRadius = useCallback((radiusKm) => dispatch({ type: "SET_RADIUS", radiusKm }), []);
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  const finishSearch = useCallback(() => {
    const { location, serviceIds, intent, radiusKm } = state.query || {};
    if (!location?.lat || !location?.lng) return;

    const params = new URLSearchParams();
    params.set("lat", String(location.lat));
    params.set("lng", String(location.lng));
    if (serviceIds?.length) params.set("services", serviceIds.join(","));
    params.set("availableNow", intent === "now" ? "true" : "false");
    if (radiusKm != null) params.set("radius", String(radiusKm));

    navigate(`/dashboard/user?ready=1&${params.toString()}`, { replace: true });
  }, [navigate, state.query]);

  // === Objeto de API MEMOIZADO (referencia estable)
  const api = useMemo(
    () => ({
      state,
      setStep,
      setLocation,
      addService,
      removeService,
      setIntent,
      setRadius,
      finishSearch,
      reset,
    }),
    [state, setStep, setLocation, addService, removeService, setIntent, setRadius, finishSearch, reset]
  );

  return <SearchContext.Provider value={api}>{children}</SearchContext.Provider>;
}

export function useSearch() {
  return useContext(SearchContext);
}
