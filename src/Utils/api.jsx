import axios from "axios";

const configuredApiBaseUrl = String(import.meta.env.VITE_API_BASE_URL || "")
  .trim()
  .replace(/\/+$/, "");

if (!configuredApiBaseUrl) {
  throw new Error("VITE_API_BASE_URL must be configured for the Admin application.");
}

const api = axios.create({
  baseURL: configuredApiBaseUrl,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use((response) => response.data?.data ?? response.data);

export const apiBaseUrl = configuredApiBaseUrl;

export default api;
