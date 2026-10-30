import { api } from "./client";

export const authApi = {
  register: (payload) => api.post("/auth/register", payload),
  login: (payload) => api.post("/auth/login", payload),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
  forgotPassword: (p) => api.post("/auth/forgot-password", p),
  requestDayAccess: (p) => api.post("/auth/request-day-access", p),
  setPhoto: (photo) => api.patch("/auth/me/photo", { photo }),
};
