import { api, API_BASE_URL } from "./client";

export const reportsApi = {
  create: (payload) => api.post("/reports", payload),
  mine: () => api.get("/reports/mine"),
  all: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/reports${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => api.get(`/reports/${id}`),
  requestEdit: (id, reason) => api.patch(`/reports/${id}/request-edit`, { reason }),
  resolveEdit: (id, approve) => api.patch(`/reports/${id}/resolve-edit`, { approve }),
  update: (id, payload) => api.put(`/reports/${id}`, payload),
};

export const downloadFile = async (path, filename) => {
  const res = await fetch(`${API_BASE_URL}${path}`, { credentials: "include" });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || "Download failed");
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

export const downloadReportExcel = (id, filename = "report.xlsx") =>
  downloadFile(`/reports/${id}/export`, filename);

export const downloadReportPdf = (id, filename = "report.pdf") =>
  downloadFile(`/reports/${id}/pdf`, filename);

export const downloadMonthExcel = (month, filename = "reports.xlsx") =>
  downloadFile(`/reports/export-all?month=${month}`, filename);

export const downloadTransferPdf = (id, filename = "transfer.pdf") => 
  downloadFile(`/transfers/${id}/pdf`, filename);