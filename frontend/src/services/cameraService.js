import api from "./api";

export async function createCamera(cameraData) {
  const response = await api.post("/cameras/", cameraData);
  return response.data;
}

export async function getCameras() {
  const response = await api.get("/cameras/");
  return response.data;
}

export async function getCameraById(cameraId) {
  const response = await api.get(`/cameras/${cameraId}`);
  return response.data;
}

export async function updateCamera(cameraId, cameraData) {
  const response = await api.put(`/cameras/${cameraId}`, cameraData);
  return response.data;
}

export async function deleteCamera(cameraId) {
  const response = await api.delete(`/cameras/${cameraId}`);
  return response.data;
}

export async function testUnsavedCameraConnection(rtspUrl) {
  const response = await api.post("/cameras/test-connection", {
    rtsp_url: rtspUrl,
  });

  return response.data;
}

export async function testSavedCameraConnection(cameraId) {
  const response = await api.post(`/cameras/${cameraId}/test-connection`);
  return response.data;
}

export async function getCameraSettings(cameraId) {
  const response = await api.get(`/cameras/${cameraId}/settings`);
  return response.data;
}

export async function updateCameraSettings(cameraId, settingsData) {
  const response = await api.put(`/cameras/${cameraId}/settings`, settingsData);
  return response.data;
}