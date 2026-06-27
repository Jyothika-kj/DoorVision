import api from "./api";

export async function getSystemHealth() {
  const response = await api.get("/admin/system-health");
  return response.data;
}