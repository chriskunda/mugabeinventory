import { api } from "./client";
export const ratingsApi = { mine: () => api.get("/ratings/mine") };