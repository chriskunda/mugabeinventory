import { api } from "./client";

export const managersApi = {
  list: () => api.get("/users/managers"),
  pending: () => api.get("/users/managers/pending"),
  approve: (id) => api.patch(`/users/managers/${id}/approve`),
  reject: (id) => api.patch(`/users/managers/${id}/reject`),
  create: (payload) => api.post("/users/managers", payload),
};
