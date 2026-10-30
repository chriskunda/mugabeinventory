import { api } from "./client";
export const accessApi = {
  mine: () => api.get("/access/mine"),
  requestWork: (p) => api.post("/access/work", p),
  pending: () => api.get("/access"),
  resolve: (id, approve) => api.patch(`/access/${id}/resolve`, { approve }),
};