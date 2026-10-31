import { api } from "./client";
export const accessApi = {
  mine: () => api.get("/access/mine"),
  requestWork: (p) => api.post("/access/work", p),
  requestLeave: (p) => api.post("/access/leave", p),
  requestRestock: (p) => api.post("/access/restock", p),
  pending: () => api.get("/access"),
  resolve: (id, approve, days) => api.patch(`/access/${id}/resolve`, { approve, days }),
};