import { api } from "./client";

export const transfersApi = {
  create: (payload) => api.post("/transfers", payload),
  list: () => api.get("/transfers"),
  markReceived: (id) => api.patch(`/transfers/${id}/receive`),
};
