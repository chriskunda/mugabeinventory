import { api } from "./client";
export const branchesApi = {
  overview: () => api.get("/branches/overview"),
  create: (name) => api.post("/branches", { name }),
  rename: (id, name) => api.patch(`/branches/${id}`, { name }),
  remove: (id, password) => api.post(`/branches/${id}/delete`, { password }),
};