import { api } from "./client";

export const productsApi = {
  list: () => api.get("/products"),
  create: (p) => api.post("/products", p),
  adjust: (id, p) => api.patch(`/products/${id}/stock`, p),
  setValue: (id, p) => api.patch(`/products/${id}/value`, p),
  reconcile: (p) => api.post("/products/reconcile", p),
  remove: (id) => api.delete(`/products/${id}`),
  setValue: (id, p) => api.patch(`/products/${id}/value`, p),
  reconcile: (p) => api.post("/products/reconcile", p),
};