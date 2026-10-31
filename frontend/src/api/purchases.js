import { api } from "./client";

export const purchasesApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/purchases${query ? `?${query}` : ""}`);
  },
  create: (payload) => api.post("/purchases", payload),
  resolve: (id, approve) => api.patch(`/purchases/${id}/resolve`, { approve }),
  remove: (id) => api.delete(`/purchases/${id}`),
};
