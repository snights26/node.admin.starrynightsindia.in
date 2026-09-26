export const setSession = (token, expiry, refreshToken, refreshExpiry) => {
  localStorage.setItem("adminToken", token);
  localStorage.setItem("tokenExpiry", expiry);
  localStorage.setItem("adminRefreshToken", refreshToken);
  localStorage.setItem("adminRefreshExpiry", refreshExpiry);
};

export const setAdminUser = (user) => {
  localStorage.setItem("adminUser", JSON.stringify(user));
};

export const getAdminUser = () => {
  try {
    return JSON.parse(localStorage.getItem("adminUser") || "null");
  } catch {
    return null;
  }
};

export const isOperationsAdmin = () => getAdminUser()?.role === "ADMIN";

export const clearSession = () => {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("tokenExpiry");
  localStorage.removeItem("adminRefreshToken");
  localStorage.removeItem("adminRefreshExpiry");
  localStorage.removeItem("adminUser");
};

export const logoutAdmin = () => {
  const refreshToken = localStorage.getItem("adminRefreshToken");
  clearSession();
  if (refreshToken) {
    api.post("/auth/logout", { refreshToken }).catch(() => {});
  }
};

export const isAuthenticated = () => {
  const token = localStorage.getItem("adminToken");
  const expiry = localStorage.getItem("tokenExpiry");

  if (!token || !expiry) return false;

  if (Date.now() > Number(expiry)) {
    clearSession();
    return false;
  }

  return true;
};
import api from "./api";
