import { api } from "./client";

export const productsApi = {
  list: () => api.get("/products"),
  create: (p) => api.post("/products", p),
  adjust: (id, p) => api.patch(`/products/${id}/stock`, p),
  remove: (id) => api.delete(`/products/${id}`),
};