import { api } from "./client";

export const managersApi = {
  list: () => api.get("/users/managers"),
  pending: () => api.get("/users/managers/pending"),
  approve: (id) => api.patch(`/users/managers/${id}/approve`),
  reject: (id) => api.patch(`/users/managers/${id}/reject`),
  create: (payload) => api.post("/users/managers", payload),
  setAccess: (id, active) => api.patch(`/users/managers/${id}/access`, { active }),
  setDaysOff: (id, daysOff) => api.patch(`/users/managers/${id}/days-off`, { daysOff }),
  assignBranch: (id, branch) => api.patch(`/users/managers/${id}/branch`, { branch }),
  passwordRequests: () => api.get("/users/password-requests"),
  resolvePassword: (id, approve) => api.patch(`/users/managers/${id}/password-request`, { approve }),
  rate: (id, p) => api.post(`/users/managers/${id}/ratings`, p),
  ratings: (id) => api.get(`/users/managers/${id}/ratings`),
};
