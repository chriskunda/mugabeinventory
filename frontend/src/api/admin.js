import { api } from "./client";
const qs = (o) => new URLSearchParams(o).toString();

export const financeApi = {
  incomeStatement: (period, value) => api.get(`/dashboard/income-statement?${qs({ period, value })}`),
  expenses: (period, value) => api.get(`/expenses?${qs({ period, value })}`),
  addExpense: (p) => api.post("/expenses", p),
  deleteExpense: (id) => api.delete(`/expenses/${id}`),
};
export const returnsApi = {
  list: (params = {}) => api.get(`/returns?${qs(params)}`),
  summary: (month) => api.get(`/returns/summary?${qs({ month })}`),
  create: (p) => api.post("/returns", p),
};
export const goalsApi = {
  list: () => api.get("/goals"),
  save: (p) => api.post("/goals", p),
  remove: (id) => api.delete(`/goals/${id}`),
};
export const notificationsApi = {
  list: () => api.get("/notifications"),
  readAll: () => api.post("/notifications/read-all"),
  remove: (id) => api.delete(`/notifications/${id}`),
  clear: () => api.delete("/notifications"),
};
export const purchasesApi = {
  list: (params = {}) => api.get(`/purchases?${qs(params)}`),
  create: (p) => api.post("/purchases", p),
  resolve: (id, approve) => api.patch(`/purchases/${id}/resolve`, { approve }),
  remove: (id) => api.delete(`/purchases/${id}`),
};