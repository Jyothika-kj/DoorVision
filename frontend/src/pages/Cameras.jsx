import { useEffect, useState } from "react";

import GlassPanel from "../components/cards/GlassPanel";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import {
  createCamera,
  deleteCamera,
  getCameras,
  testSavedCameraConnection,
  testUnsavedCameraConnection,
  updateCamera,
} from "../services/cameraService";

const initialFormData = {
  camera_name: "Main Entrance Camera",
  location: "Reception Door",
  camera_type: "IP_CAMERA",
  rtsp_url: "rtsp://username:password@camera-ip:554/stream1",
  username: "",
  password: "",
};

function getApiErrorMessage(error) {
  const detail = error.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(", ");
  }

  if (typeof detail === "string") {
    return detail;
  }

  if (detail && typeof detail === "object") {
    return JSON.stringify(detail);
  }

  return "Something went wrong. Please try again.";
}

function Cameras() {
  const [formData, setFormData] = useState(initialFormData);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [editingCameraId, setEditingCameraId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [diagnostics, setDiagnostics] = useState([
    "[SYSTEM] Ready for camera configuration.",
    "[NETWORK] Waiting for RTSP connection test.",
  ]);

  const [connectionStatus, setConnectionStatus] = useState("Not Tested");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadCameras();
  }, []);

  function handleClearForm() {
    setFormData({
      camera_name: "",
      location: "",
      camera_type: "IP_CAMERA",
      rtsp_url: "",
      username: "",
      password: "",
    });

    setSelectedCamera(null);
    setEditingCameraId(null);
    setConnectionStatus("Not Tested");
    setError("");
    setSuccess("");

    setDiagnostics([
      "[SYSTEM] Form cleared.",
      "[NETWORK] Waiting for new camera configuration.",
    ]);
  }

  async function loadCameras() {
    setLoading(true);

    try {
      const data = await getCameras();
      setCameras(data);
    } catch (err) {
      setDiagnostics((prev) => [
        ...prev,
        "[ERROR] Failed to load saved cameras.",
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function validateForm() {
    if (!formData.camera_name.trim()) {
      return "Camera name is required.";
    }

    if (!formData.rtsp_url.trim()) {
      return "RTSP URL is required.";
    }

    if (
      !formData.rtsp_url.startsWith("rtsp://") &&
      !formData.rtsp_url.startsWith("http://") &&
      !formData.rtsp_url.startsWith("https://") &&
      formData.rtsp_url !== "0"
    ) {
      return "Camera URL must start with rtsp://, http://, https://, or use 0 for webcam.";
    }

    return "";
  }

  async function handleTestConnection() {
    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setTesting(true);
    setConnectionStatus("Testing...");

    setDiagnostics([
      "[SYSTEM] Starting camera connection test...",
      `[INPUT] Source: ${formData.rtsp_url}`,
      "[NETWORK] Attempting to open stream...",
    ]);

    try {
      const result = await testUnsavedCameraConnection(formData.rtsp_url);

      if (result.connected) {
        setConnectionStatus("Connected");

        setDiagnostics([
          "[SYSTEM] Camera connection successful.",
          `[FRAME] Resolution: ${result.frame_width} x ${result.frame_height}`,
          `[STREAM] FPS: ${result.fps}`,
          "[STATUS] Frame received successfully.",
        ]);

        setSuccess("Camera connection successful.");
      } else {
        setConnectionStatus("Error");

        setDiagnostics([
          "[SYSTEM] Camera connection failed.",
          `[ERROR] ${result.message}`,
          "[HELP] Check RTSP URL, username, password, camera power, and network.",
        ]);

        setError(result.message);
      }
    } catch (err) {
      const message = getApiErrorMessage(err);

      setConnectionStatus("Error");
      setError(message);

      setDiagnostics([
        "[SYSTEM] Camera connection failed.",
        `[ERROR] ${message}`,
        "[HELP] Make sure backend is running and camera is reachable.",
      ]);
    } finally {
      setTesting(false);
    }
  }

  async function handleSaveCamera(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    const modeText = editingCameraId ? "Updating" : "Saving";

    setDiagnostics((prev) => [
      ...prev,
      `[DATABASE] ${modeText} camera configuration...`,
    ]);

    try {
      const payload = {
        camera_name: formData.camera_name.trim(),
        location: formData.location.trim(),
        camera_type: formData.camera_type,
        rtsp_url: formData.rtsp_url.trim(),
        username: formData.username.trim(),
      };

      if (formData.password.trim()) {
        payload.password = formData.password;
      }

      let savedCamera;

      if (editingCameraId) {
        savedCamera = await updateCamera(editingCameraId, payload);
        setSuccess("Camera updated successfully.");
      } else {
        savedCamera = await createCamera({
          ...payload,
          password: formData.password,
        });
        setSuccess("Camera saved successfully.");
      }

      setSelectedCamera(savedCamera);
      setEditingCameraId(savedCamera.id);

      setDiagnostics([
        `[DATABASE] Camera ${editingCameraId ? "updated" : "saved"} successfully.`,
        `[CAMERA] ID: ${savedCamera.id}`,
        `[CAMERA] Name: ${savedCamera.camera_name}`,
        `[STATUS] ${savedCamera.status}`,
      ]);

      await loadCameras();
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        "Failed to save camera. Please check form data.";

      setError(message);

      setDiagnostics([
        `[DATABASE] Failed to ${editingCameraId ? "update" : "save"} camera.`,
        `[ERROR] ${message}`,
      ]);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCamera(camera) {
    const confirmed = window.confirm(
      `Delete camera "${camera.camera_name}"? This cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      await deleteCamera(camera.id);

      setSuccess("Camera deleted successfully.");

      setDiagnostics([
        "[DATABASE] Camera deleted successfully.",
        `[CAMERA] Deleted ID: ${camera.id}`,
      ]);

      if (editingCameraId === camera.id) {
        handleClearForm();
      }

      await loadCameras();
    } catch (err) {
      const message =
        err.response?.data?.detail || "Failed to delete camera.";

      setError(message);

      setDiagnostics([
        "[DATABASE] Failed to delete camera.",
        `[ERROR] ${message}`,
      ]);
    } finally {
      setSaving(false);
    }
  }

  async function handleSavedCameraTest(camera) {
    setSelectedCamera(camera);
    setTesting(true);
    setError("");
    setSuccess("");
    setConnectionStatus("Testing...");

    setDiagnostics([
      `[SYSTEM] Testing saved camera ID: ${camera.id}`,
      `[CAMERA] ${camera.camera_name}`,
      "[NETWORK] Opening saved RTSP stream...",
    ]);

    try {
      const result = await testSavedCameraConnection(camera.id);

      if (result.connected) {
        setConnectionStatus("Connected");
        setSuccess("Saved camera connection successful.");

        setDiagnostics([
          "[SYSTEM] Saved camera connection successful.",
          `[FRAME] Resolution: ${result.frame_width} x ${result.frame_height}`,
          `[STREAM] FPS: ${result.fps}`,
          "[STATUS] Camera status updated to CONNECTED.",
        ]);
      } else {
        setConnectionStatus("Error");
        setError(result.message);

        setDiagnostics([
          "[SYSTEM] Saved camera connection failed.",
          `[ERROR] ${result.message}`,
          "[STATUS] Camera status updated to ERROR.",
        ]);
      }

      await loadCameras();
    } catch (err) {
      const message = getApiErrorMessage(err);

      setConnectionStatus("Error");
      setError(message);

      setDiagnostics([
        "[SYSTEM] Saved camera connection failed.",
        `[ERROR] ${message}`,
      ]);
    } finally {
      setTesting(false);
    }
  }

  function handleSelectCamera(camera) {
    setSelectedCamera(camera);
    setEditingCameraId(camera.id);

    setFormData({
      camera_name: camera.camera_name || "",
      location: camera.location || "",
      camera_type: camera.camera_type || "IP_CAMERA",
      rtsp_url: camera.rtsp_url || "",
      username: camera.username || "",
      password: "",
    });

    setConnectionStatus(camera.status || "Not Tested");

    setDiagnostics([
      `[CAMERA] Selected camera ID: ${camera.id}`,
      `[CAMERA] Name: ${camera.camera_name}`,
      `[LOCATION] ${camera.location || "Not specified"}`,
      `[STATUS] ${camera.status}`,
      "[MODE] Edit mode enabled.",
    ]);
  }

  const statusColor =
    connectionStatus === "Connected"
      ? "text-tertiary"
      : connectionStatus === "Error"
      ? "text-error"
      : connectionStatus === "Testing..."
      ? "text-secondary"
      : "text-on-surface-variant";

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-wider text-on-surface-variant">
          CCTV/IP Camera
        </p>
        <h1 className="mt-1 text-2xl font-bold text-on-background md:text-3xl">
          Camera Setup
        </h1>
        {editingCameraId && (
            <p className="mt-2 font-mono text-xs uppercase tracking-wider text-secondary">
              Edit Mode: Camera ID {editingCameraId}
            </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <GlassPanel className="p-6 lg:col-span-7">
          <h3 className="mb-4 border-b border-outline-variant/30 pb-2 font-mono text-xs uppercase tracking-wider text-on-surface-variant">
            Device Details
          </h3>

          <form onSubmit={handleSaveCamera} className="space-y-4">
            <Input
              label="Camera Name"
              name="camera_name"
              placeholder="Main Entrance Camera"
              value={formData.camera_name}
              onChange={handleChange}
            />

            <Input
              label="Location"
              name="location"
              placeholder="Reception Door"
              value={formData.location}
              onChange={handleChange}
            />

            <label className="block">
              <span className="mb-2 block font-mono text-xs uppercase tracking-wider text-on-surface-variant">
                Camera Type
              </span>

              <select
                name="camera_type"
                value={formData.camera_type}
                onChange={handleChange}
                className="w-full rounded border border-outline-variant/50 bg-surface-container-low px-4 py-3 text-on-background outline-none transition focus:border-primary"
              >
                <option value="IP_CAMERA">IP Camera</option>
                <option value="CCTV_DVR">CCTV / DVR</option>
                <option value="WEBCAM">Webcam</option>
                <option value="VIDEO_FILE">Video File</option>
              </select>
            </label>

            <Input
              label="RTSP URL / Camera Source"
              name="rtsp_url"
              placeholder="rtsp://username:password@camera-ip:554/stream1"
              value={formData.rtsp_url}
              onChange={handleChange}
            />

            <div className="rounded border border-outline-variant/40 bg-surface-container-lowest px-4 py-3">
              <p className="font-mono text-xs uppercase tracking-wider text-on-surface-variant">
                Testing without CCTV?
              </p>
              <p className="mt-1 text-sm text-on-surface-variant">
                Use <span className="font-mono text-tertiary">0</span> as the camera source to test with your laptop webcam.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Username"
                name="username"
                placeholder="admin"
                value={formData.username}
                onChange={handleChange}
              />

              <Input
                label="Password"
                name="password"
                type="password"
                placeholder="Camera password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            {error && (
              <div className="rounded border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded border border-tertiary/40 bg-tertiary/10 px-4 py-3 text-sm text-tertiary">
                {success}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleTestConnection}
                disabled={testing}
              >
                <span className="material-symbols-outlined text-sm">cable</span>
                {testing ? "Testing..." : "Test"}
              </Button>

              <Button type="submit" disabled={saving}>
                <span className="material-symbols-outlined text-sm">save</span>
                {saving
                  ? editingCameraId
                    ? "Updating..."
                    : "Saving..."
                  : editingCameraId
                  ? "Update"
                  : "Save"}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={handleClearForm}
              >
                <span className="material-symbols-outlined text-sm">add</span>
                New
              </Button>
            </div>
          </form>
        </GlassPanel>

        <div className="space-y-6 lg:col-span-5">
          <GlassPanel className="overflow-hidden">
            <div className="flex aspect-video items-center justify-center bg-surface-container-lowest text-on-surface-variant">
              <div className="text-center">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant">
                  videocam_off
                </span>
                <p className="mt-2">Stream Preview</p>
                <p className={`mt-2 font-mono text-xs uppercase ${statusColor}`}>
                  Status: {connectionStatus}
                </p>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel className="p-6">
            <h3 className="mb-4 border-b border-outline-variant/30 pb-2 font-mono text-xs uppercase tracking-wider text-on-surface-variant">
              Diagnostics
            </h3>

            <div className="min-h-36 rounded bg-surface-container-lowest p-4 font-mono text-xs leading-6 text-tertiary">
              {diagnostics.map((line, index) => (
                <p key={`${line}-${index}`}>&gt; {line}</p>
              ))}
            </div>
          </GlassPanel>

          <GlassPanel className="p-6">
            <h3 className="mb-4 border-b border-outline-variant/30 pb-2 font-mono text-xs uppercase tracking-wider text-on-surface-variant">
              Saved Cameras
            </h3>

            {loading ? (
              <p className="text-sm text-on-surface-variant">
                Loading cameras...
              </p>
            ) : cameras.length === 0 ? (
              <p className="text-sm text-on-surface-variant">
                No cameras saved yet.
              </p>
            ) : (
              <div className="space-y-3">
                {cameras.map((camera) => (
                  <div
                    key={camera.id}
                    className={[
                      "rounded border p-4 transition",
                      selectedCamera?.id === camera.id
                        ? "border-primary bg-primary-container/20"
                        : "border-outline-variant/40 bg-surface-container-lowest",
                    ].join(" ")}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectCamera(camera)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-on-background">
                            {camera.camera_name}
                          </p>
                          <p className="mt-1 text-sm text-on-surface-variant">
                            {camera.location || "No location"}
                          </p>
                          <p className="mt-1 font-mono text-[11px] uppercase text-on-surface-variant">
                            {camera.camera_type}
                          </p>
                        </div>

                        <span
                          className={[
                            "font-mono text-xs uppercase",
                            camera.status === "CONNECTED"
                              ? "text-tertiary"
                              : camera.status === "ERROR"
                              ? "text-error"
                              : "text-on-surface-variant",
                          ].join(" ")}
                        >
                          {camera.status}
                        </span>
                      </div>
                    </button>

                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleSelectCamera(camera)}
                    >
                      <span className="material-symbols-outlined text-sm">
                        edit
                      </span>
                      Edit
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleSavedCameraTest(camera)}
                      disabled={testing}
                    >
                      <span className="material-symbols-outlined text-sm">
                        cable
                      </span>
                      Test
                    </Button>

                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => handleDeleteCamera(camera)}
                      disabled={saving}
                    >
                      <span className="material-symbols-outlined text-sm">
                        delete
                      </span>
                      Delete
                    </Button>
                  </div>
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}

export default Cameras;