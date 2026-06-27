import { useEffect, useState } from "react";

import GlassPanel from "../components/cards/GlassPanel";
import Button from "../components/common/Button";
import Input from "../components/common/Input";

import {
  getCameras,
  getCameraSettings,
  updateCameraSettings,
} from "../services/cameraService";

const defaultSettings = {
  line_start_x: 0.0,
  line_start_y: 0.6,
  line_end_x: 1.0,
  line_end_y: 0.6,
  entry_direction: "TOP_TO_BOTTOM",
  exit_direction: "BOTTOM_TO_TOP",
  confidence_threshold: 0.5,
  min_track_duration: 1.0,
};

function Settings() {
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");

  const [settings, setSettings] = useState(defaultSettings);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadCameras();
  }, []);

  useEffect(() => {
    if (selectedCameraId) {
      loadCameraSettings(selectedCameraId);
    }
  }, [selectedCameraId]);

  async function loadCameras() {
    setLoading(true);
    setError("");

    try {
      const data = await getCameras();
      setCameras(data);

      if (data.length > 0) {
        setSelectedCameraId(String(data[0].id));
      }
    } catch (err) {
      setError("Failed to load cameras. Please add a camera first.");
    } finally {
      setLoading(false);
    }
  }

  async function loadCameraSettings(cameraId) {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const data = await getCameraSettings(cameraId);

      setSettings({
        line_start_x: data.line_start_x,
        line_start_y: data.line_start_y,
        line_end_x: data.line_end_x,
        line_end_y: data.line_end_y,
        entry_direction: data.entry_direction,
        exit_direction: data.exit_direction,
        confidence_threshold: data.confidence_threshold,
        min_track_duration: data.min_track_duration,
      });
    } catch (err) {
      setError("Failed to load camera settings.");
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleNumberChange(event) {
    const { name, value } = event.target;

    setSettings((prev) => ({
      ...prev,
      [name]: value === "" ? "" : Number(value),
    }));
  }

  function validateSettings() {
    const numberFields = [
      "line_start_x",
      "line_start_y",
      "line_end_x",
      "line_end_y",
      "confidence_threshold",
      "min_track_duration",
    ];

    for (const field of numberFields) {
      const value = settings[field];

      if (value === "" || value === null || Number.isNaN(Number(value))) {
        return `${field} must be a valid number.`;
      }
    }

    const ratioFields = [
      "line_start_x",
      "line_start_y",
      "line_end_x",
      "line_end_y",
    ];

    for (const field of ratioFields) {
      const value = Number(settings[field]);

      if (value < 0 || value > 1) {
        return `${field} must be between 0 and 1.`;
      }
    }

    if (
      Number(settings.confidence_threshold) < 0.1 ||
      Number(settings.confidence_threshold) > 1
    ) {
      return "Confidence threshold must be between 0.1 and 1.";
    }

    if (
      Number(settings.min_track_duration) < 0 ||
      Number(settings.min_track_duration) > 10
    ) {
      return "Minimum track duration must be between 0 and 10.";
    }

    if (settings.entry_direction === settings.exit_direction) {
      return "Entry direction and exit direction cannot be the same.";
    }

    return "";
  }

  async function handleSaveSettings(event) {
    event.preventDefault();

    if (!selectedCameraId) {
      setError("Please select a camera first.");
      return;
    }

    setError("");
    setMessage("");

    const validationError = validateSettings();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      const payload = {
        line_start_x: Number(settings.line_start_x),
        line_start_y: Number(settings.line_start_y),
        line_end_x: Number(settings.line_end_x),
        line_end_y: Number(settings.line_end_y),
        entry_direction: settings.entry_direction,
        exit_direction: settings.exit_direction,
        confidence_threshold: Number(settings.confidence_threshold),
        min_track_duration: Number(settings.min_track_duration),
      };

      await updateCameraSettings(selectedCameraId, payload);

      setMessage("Camera settings saved successfully. Stop and start the camera again to apply new line/direction settings.");
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        "Failed to save settings. Please check backend connection.";

      setError(typeof detail === "string" ? detail : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  function applyHorizontalDefault() {
    setSettings((prev) => ({
      ...prev,
      line_start_x: 0.0,
      line_start_y: 0.6,
      line_end_x: 1.0,
      line_end_y: 0.6,
      entry_direction: "TOP_TO_BOTTOM",
      exit_direction: "BOTTOM_TO_TOP",
    }));
  }

  function applyVerticalDefault() {
    setSettings((prev) => ({
      ...prev,
      line_start_x: 0.5,
      line_start_y: 0.0,
      line_end_x: 0.5,
      line_end_y: 1.0,
      entry_direction: "LEFT_TO_RIGHT",
      exit_direction: "RIGHT_TO_LEFT",
    }));
  }

  const selectedCamera = cameras.find(
    (camera) => String(camera.id) === String(selectedCameraId)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-on-surface-variant">
            Configuration
          </p>

          <h1 className="mt-1 text-2xl font-bold text-on-background md:text-3xl">
            System Settings
          </h1>

          <p className="mt-2 text-sm text-on-surface-variant">
            Configure camera counting line, entry/exit direction, and AI detection sensitivity.
          </p>
        </div>

        <Button variant="secondary" onClick={loadCameras}>
          <span className="material-symbols-outlined text-sm">refresh</span>
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded border border-tertiary/40 bg-tertiary/10 px-4 py-3 text-sm text-tertiary">
          {message}
        </div>
      )}

      {loading && (
        <div className="rounded border border-outline-variant/40 bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
          Loading settings...
        </div>
      )}

      <GlassPanel className="p-6">
        <h3 className="mb-4 border-b border-outline-variant/30 pb-2 font-mono text-xs uppercase tracking-wider text-on-surface-variant">
          Camera Selection
        </h3>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <label className="block">
            <span className="mb-2 block font-mono text-xs uppercase tracking-wider text-on-surface-variant">
              Select Camera
            </span>

            <select
              value={selectedCameraId}
              onChange={(event) => setSelectedCameraId(event.target.value)}
              className="w-full rounded border border-outline-variant/50 bg-surface-container-low px-4 py-3 text-on-background outline-none focus:border-primary"
            >
              {cameras.length === 0 ? (
                <option value="">No cameras available</option>
              ) : (
                cameras.map((camera) => (
                  <option key={camera.id} value={camera.id}>
                    {camera.camera_name} - {camera.status}
                  </option>
                ))
              )}
            </select>
          </label>

          <div className="rounded bg-surface-container-lowest p-4">
            <p className="font-mono text-xs uppercase tracking-wider text-on-surface-variant">
              Selected Camera
            </p>

            <p className="mt-2 text-lg font-semibold text-on-background">
              {selectedCamera?.camera_name || "No camera selected"}
            </p>

            <p className="mt-1 text-sm text-on-surface-variant">
              {selectedCamera?.location || "No location"}
            </p>
          </div>
        </div>
      </GlassPanel>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <GlassPanel className="p-6">
            <h3 className="mb-4 border-b border-outline-variant/30 pb-2 font-mono text-xs uppercase tracking-wider text-on-surface-variant">
              Counting Line Position
            </h3>

            <div className="mb-4 rounded border border-outline-variant/40 bg-surface-container-lowest p-4">
              <p className="font-mono text-xs uppercase text-on-surface-variant">
                How line position works
              </p>

              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                Values are ratios between 0 and 1. Example: line_start_y = 0.6 means the line is placed at 60% height of the video.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Line Start X"
                name="line_start_x"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={settings.line_start_x}
                onChange={handleNumberChange}
              />

              <Input
                label="Line Start Y"
                name="line_start_y"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={settings.line_start_y}
                onChange={handleNumberChange}
              />

              <Input
                label="Line End X"
                name="line_end_x"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={settings.line_end_x}
                onChange={handleNumberChange}
              />

              <Input
                label="Line End Y"
                name="line_end_y"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={settings.line_end_y}
                onChange={handleNumberChange}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="secondary"
                onClick={applyHorizontalDefault}
              >
                Horizontal Door Line
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={applyVerticalDefault}
              >
                Vertical Door Line
              </Button>
            </div>
          </GlassPanel>

          <GlassPanel className="p-6">
            <h3 className="mb-4 border-b border-outline-variant/30 pb-2 font-mono text-xs uppercase tracking-wider text-on-surface-variant">
              Entry / Exit Direction
            </h3>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block font-mono text-xs uppercase tracking-wider text-on-surface-variant">
                  Entry Direction
                </span>

                <select
                  name="entry_direction"
                  value={settings.entry_direction}
                  onChange={handleChange}
                  className="w-full rounded border border-outline-variant/50 bg-surface-container-low px-4 py-3 text-on-background outline-none focus:border-primary"
                >
                  <option value="TOP_TO_BOTTOM">Top to Bottom</option>
                  <option value="BOTTOM_TO_TOP">Bottom to Top</option>
                  <option value="LEFT_TO_RIGHT">Left to Right</option>
                  <option value="RIGHT_TO_LEFT">Right to Left</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block font-mono text-xs uppercase tracking-wider text-on-surface-variant">
                  Exit Direction
                </span>

                <select
                  name="exit_direction"
                  value={settings.exit_direction}
                  onChange={handleChange}
                  className="w-full rounded border border-outline-variant/50 bg-surface-container-low px-4 py-3 text-on-background outline-none focus:border-primary"
                >
                  <option value="TOP_TO_BOTTOM">Top to Bottom</option>
                  <option value="BOTTOM_TO_TOP">Bottom to Top</option>
                  <option value="LEFT_TO_RIGHT">Left to Right</option>
                  <option value="RIGHT_TO_LEFT">Right to Left</option>
                </select>
              </label>

              <div className="rounded border border-outline-variant/40 bg-surface-container-lowest p-4">
                <p className="font-mono text-xs uppercase text-on-surface-variant">
                  Current Rule
                </p>

                <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                  Entry is counted when movement matches{" "}
                  <span className="font-mono text-tertiary">
                    {settings.entry_direction}
                  </span>
                  . Exit is counted when movement matches{" "}
                  <span className="font-mono text-secondary">
                    {settings.exit_direction}
                  </span>
                  .
                </p>
              </div>
            </div>
          </GlassPanel>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <GlassPanel className="p-6">
            <h3 className="mb-4 border-b border-outline-variant/30 pb-2 font-mono text-xs uppercase tracking-wider text-on-surface-variant">
              AI Detection Settings
            </h3>

            <div className="space-y-4">
              <Input
                label="Confidence Threshold"
                name="confidence_threshold"
                type="number"
                step="0.01"
                min="0.1"
                max="1"
                value={settings.confidence_threshold}
                onChange={handleNumberChange}
              />

              <Input
                label="Minimum Track Duration"
                name="min_track_duration"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={settings.min_track_duration}
                onChange={handleNumberChange}
              />

              <div className="rounded border border-outline-variant/40 bg-surface-container-lowest p-4">
                <p className="font-mono text-xs uppercase text-on-surface-variant">
                  Recommended
                </p>

                <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                  Start with confidence threshold 0.50. If YOLO misses people, reduce to 0.35 or 0.25. If false detections happen, increase to 0.60.
                </p>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel className="p-6">
            <h3 className="mb-4 border-b border-outline-variant/30 pb-2 font-mono text-xs uppercase tracking-wider text-on-surface-variant">
              Apply Settings
            </h3>

            <div className="space-y-4">
              <div className="rounded bg-surface-container-lowest p-4">
                <p className="font-mono text-xs uppercase text-on-surface-variant">
                  Important
                </p>

                <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                  After changing line position or direction, stop the camera and start again from the Live Camera page. The backend loads settings when camera processing starts.
                </p>
              </div>

              <Button
                type="submit"
                disabled={saving || !selectedCameraId}
                className="w-full"
              >
                <span className="material-symbols-outlined text-sm">save</span>
                {saving ? "Saving Settings..." : "Save Settings"}
              </Button>
            </div>
          </GlassPanel>
        </div>
      </form>
    </div>
  );
}

export default Settings;