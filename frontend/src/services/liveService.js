import api from "./api";

export async function startCamera(cameraId) {
  const response = await api.post(`/live/start/${cameraId}`);
  return response.data;
}

export async function stopCamera(cameraId) {
  const response = await api.post(`/live/stop/${cameraId}`);
  return response.data;
}

export async function getLiveStatus(cameraId) {
  const response = await api.get(`/live/status/${cameraId}`);
  return response.data;
}

export async function getLiveCount(cameraId) {
  const response = await api.get(`/live/count/${cameraId}`);
  return response.data;
}

export async function resetLiveCount(cameraId) {
  const response = await api.post(`/live/reset/${cameraId}`);
  return response.data;
}

export function getLiveStreamUrl(cameraId) {
  const baseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

  return `${baseUrl}/live/stream/${cameraId}`;
}

export async function takeSnapshot(cameraId) {
  const response = await api.post(`/live/snapshot/${cameraId}`);
  return response.data;
}

export function getStaticFileUrl(path) {
  const baseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

  if (!path) return "";

  const cleanPath = path.replace("app/static", "static");

  return `${baseUrl}/${cleanPath}`;
}