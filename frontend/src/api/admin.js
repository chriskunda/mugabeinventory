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
};