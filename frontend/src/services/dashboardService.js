import api from "./api";

export async function getDashboardSummary() {
  const response = await api.get("/dashboard/summary");
  return response.data;
}

export async function getRecentEvents(limit = 10) {
  const response = await api.get(`/dashboard/recent-events?limit=${limit}`);
  return response.data;
}