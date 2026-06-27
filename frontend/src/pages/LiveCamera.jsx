import { useEffect, useMemo, useState } from "react";

import StatCard from "../components/cards/StatCard";
import GlassPanel from "../components/cards/GlassPanel";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";

import { getCameras } from "../services/cameraService";
import {
  getLiveCount,
  getLiveStatus,
  getLiveStreamUrl,
  getStaticFileUrl,
  resetLiveCount,
  startCamera,
  stopCamera,
  takeSnapshot,
} from "../services/liveService";

function LiveCamera() {
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [snapshotUrl, setSnapshotUrl] = useState("");

  const [liveStatus, setLiveStatus] = useState({
    is_running: false,
    has_frame: false,
    fps: 0,
    frame_width: null,
    frame_height: null,
    camera_status: "OFFLINE",
    last_error: null,
  });

  const [liveCount, setLiveCount] = useState({
    entry_count: 0,
    exit_count: 0,
    currently_inside: 0,
  });

  const [loadingCameras, setLoadingCameras] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedCamera = useMemo(() => {
    return cameras.find((camera) => String(camera.id) === String(selectedCameraId));
  }, [cameras, selectedCameraId]);

  const streamUrl = selectedCameraId ? getLiveStreamUrl(selectedCameraId) : "";

  useEffect(() => {
    loadCameras();
  }, []);

  useEffect(() => {
    if (!selectedCameraId) return;

    fetchLiveData();

    const intervalId = setInterval(() => {
      fetchLiveData();
    }, 2000);

    return () => clearInterval(intervalId);
  }, [selectedCameraId]);

  async function loadCameras() {
    setLoadingCameras(true);
    setError("");

    try {
      const data = await getCameras();
      setCameras(data);

      if (data.length > 0) {
        setSelectedCameraId(String(data[0].id));
      }
    } catch (err) {
      setError("Failed to load cameras. Please add a camera in the Cameras page first.");
    } finally {
      setLoadingCameras(false);
    }
  }

  async function fetchLiveData() {
    if (!selectedCameraId) return;

    try {
      const [statusData, countData] = await Promise.all([
        getLiveStatus(selectedCameraId),
        getLiveCount(selectedCameraId),
      ]);

      setLiveStatus(statusData);
      setLiveCount(countData);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleStartCamera() {
    if (!selectedCameraId) {
      setError("Please select a camera first.");
      return;
    }

    setActionLoading(true);
    setError("");
    setMessage("Starting camera...");

    try {
      const result = await startCamera(selectedCameraId);

      setMessage(result.message || "Camera started successfully.");

      await fetchLiveData();
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        "Failed to start camera. Check camera source, RTSP URL, or webcam availability.";

      setError(detail);
      setMessage("");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleStopCamera() {
    if (!selectedCameraId) {
      setError("Please select a camera first.");
      return;
    }

    setActionLoading(true);
    setError("");
    setMessage("Stopping camera...");

    try {
      const result = await stopCamera(selectedCameraId);

      setMessage(result.message || "Camera stopped successfully.");

      await fetchLiveData();
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        "Failed to stop camera.";

      setError(detail);
      setMessage("");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResetCounters() {
    if (!selectedCameraId) {
      setError("Please select a camera first.");
      return;
    }

    setActionLoading(true);
    setError("");
    setMessage("Resetting counters...");

    try {
      const result = await resetLiveCount(selectedCameraId);

      setMessage(result.message || "Counters reset successfully.");

      if (result.data) {
        setLiveCount(result.data);
      } else {
        await fetchLiveData();
      }
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        "Failed to reset counters.";

      setError(detail);
      setMessage("");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSnapshot() {
    if (!selectedCameraId) {
      setError("Please select a camera first.");
      return;
    }

    if (!isRunning) {
      setError("Start the camera before taking snapshot.");
      return;
    }

    setActionLoading(true);
    setError("");
    setMessage("Taking snapshot...");

    try {
      const result = await takeSnapshot(selectedCameraId);

      const fileUrl = getStaticFileUrl(result.snapshot_path);

      setSnapshotUrl(fileUrl);
      setMessage("Snapshot saved successfully.");
    } catch (err) {
      const detail =
        err.response?.data?.detail || "Failed to take snapshot.";

      setError(detail);
      setMessage("");
    } finally {
      setActionLoading(false);
    }
  }

  const isRunning = Boolean(liveStatus?.is_running);
  const hasFrame = Boolean(liveStatus?.has_frame);

  const cameraStatusText = isRunning
    ? hasFrame
      ? "LIVE"
      : "PROCESSING"
    : "STOPPED";

  const statusColor = isRunning
    ? hasFrame
      ? "text-tertiary"
      : "text-secondary"
    : "text-on-surface-variant";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-9">
        <div className="flex flex-col gap-4 rounded-lg border border-outline-variant/40 bg-surface-container-low p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-on-surface-variant">
              Active Camera
            </p>
            <h1 className="mt-1 text-xl font-bold text-on-background">
              {selectedCamera?.camera_name || "No camera selected"}
            </h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              {selectedCamera?.location || "Add/select a camera from the Cameras page"}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={selectedCameraId}
              onChange={(event) => {
                setSelectedCameraId(event.target.value);
                setMessage("");
                setError("");
              }}
              className="min-w-64 rounded border border-outline-variant/50 bg-surface-container-lowest px-4 py-3 text-on-background outline-none focus:border-primary"
            >
              {loadingCameras ? (
                <option>Loading cameras...</option>
              ) : cameras.length === 0 ? (
                <option value="">No cameras saved</option>
              ) : (
                cameras.map((camera) => (
                  <option key={camera.id} value={camera.id}>
                    {camera.camera_name} - {camera.status}
                  </option>
                ))
              )}
            </select>

            <Button variant="secondary" onClick={loadCameras}>
              <span className="material-symbols-outlined text-sm">refresh</span>
              Refresh
            </Button>
          </div>
        </div>

        <div className="relative aspect-video overflow-hidden rounded-lg border border-outline-variant/50 bg-surface-container-lowest shadow-command">
          {isRunning ? (
            <img
              src={`${streamUrl}?t=${selectedCameraId}`}
              alt="DoorVision AI live camera stream"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-container-low text-on-surface-variant">
              <span className="material-symbols-outlined text-6xl">
                videocam_off
              </span>
              <p className="mt-3 text-lg font-semibold">
                Camera stream is stopped
              </p>
              <p className="mt-1 text-sm">
                Select a camera and click Start Camera
              </p>
            </div>
          )}

          {!hasFrame && isRunning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-on-surface">
              <span className="material-symbols-outlined animate-pulse text-5xl text-secondary">
                sync
              </span>
              <p className="mt-3 font-semibold">Waiting for camera frame...</p>
            </div>
          )}

          {/* Temporary visual overlays until YOLO phase */}
          {/* <div className="ai-box" style={{ top: "35%", left: "45%", width: "60px", height: "60px" }}>
            <div className="ai-label">ID:101</div>
          </div>

          <div className="ai-box border-tertiary" style={{ top: "55%", left: "65%", width: "55px", height: "55px" }}>
            <div className="ai-label">ID:102</div>
          </div>

          <div className="counting-line">
            <span className="absolute right-4 -top-7 border border-tertiary/50 bg-tertiary/20 px-2 py-1 font-mono text-[11px] text-tertiary">
              ENTRY LINE ACTIVE
            </span>
          </div> */}

          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <Badge variant={isRunning ? "live" : "default"}>
              <span
                className={[
                  "h-2 w-2 rounded-full",
                  isRunning ? "animate-pulse bg-error" : "bg-on-surface-variant",
                ].join(" ")}
              />
              {cameraStatusText}
            </Badge>

            <Badge>
              <span className="text-primary">FPS:</span>{" "}
              {Number(liveStatus?.fps || 0).toFixed(1)}
            </Badge>

            {liveStatus?.frame_width && liveStatus?.frame_height && (
              <Badge variant="info">
                {liveStatus.frame_width} × {liveStatus.frame_height}
              </Badge>
            )}
          </div>

          <div className="glass-panel absolute bottom-4 left-4 rounded px-3 py-1.5">
            <span className="font-mono text-[11px] text-on-surface-variant">
              {selectedCamera
                ? `CAM-${selectedCamera.id}_${selectedCamera.camera_name
                    .replace(/\s+/g, "_")
                    .toUpperCase()}`
                : "NO_CAMERA_SELECTED"}
            </span>
          </div>
        </div>

        {message && (
          <div className="rounded border border-tertiary/40 bg-tertiary/10 px-4 py-3 text-sm text-tertiary">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}
        {snapshotUrl && (
          <div className="rounded border border-outline-variant/40 bg-surface-container-low p-4">
            <p className="mb-3 font-mono text-xs uppercase tracking-wider text-on-surface-variant">
              Latest Snapshot
            </p>

            <img
              src={snapshotUrl}
              alt="Latest camera snapshot"
              className="max-h-64 rounded border border-outline-variant/40"
            />

            <a
              href={snapshotUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block font-mono text-xs uppercase tracking-wider text-primary hover:underline"
            >
              Open Snapshot
            </a>
          </div>
        )}
        {liveStatus?.last_error && (
          <div className="rounded border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
            Camera Error: {liveStatus.last_error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <StatCard
            title="Entry Today"
            value={liveCount.entry_count}
            icon="login"
          />

          <StatCard
            title="Exit Today"
            value={liveCount.exit_count}
            icon="logout"
            color="text-secondary"
            border="border-l-secondary"
          />

          <StatCard
            title="Currently Inside"
            value={liveCount.currently_inside}
            icon="group"
            color="text-tertiary"
            border="border-l-tertiary"
          />
        </div>
      </div>

      <div className="space-y-6 lg:col-span-3">
        <GlassPanel className="p-6">
          <h3 className="mb-4 border-b border-outline-variant/30 pb-2 font-mono text-xs uppercase tracking-wider text-on-surface-variant">
            Camera Controls
          </h3>

          <div className="space-y-3">
            <Button
              className="w-full"
              onClick={handleStartCamera}
              disabled={actionLoading || !selectedCameraId || isRunning}
            >
              <span className="material-symbols-outlined text-sm">
                play_arrow
              </span>
              {actionLoading ? "Please Wait..." : "Start Camera"}
            </Button>

            <Button
              variant="secondary"
              className="w-full"
              onClick={handleStopCamera}
              disabled={actionLoading || !selectedCameraId || !isRunning}
            >
              <span className="material-symbols-outlined text-sm text-error">
                stop
              </span>
              Stop Camera
            </Button>

            <Button
              variant="secondary"
              className="w-full"
              onClick={handleSnapshot}
              disabled={!selectedCameraId}
            >
              <span className="material-symbols-outlined text-sm text-tertiary">
                photo_camera
              </span>
              Take Snapshot
            </Button>
          </div>
        </GlassPanel>

        <GlassPanel className="p-6">
          <h3 className="mb-4 border-b border-outline-variant/30 pb-2 font-mono text-xs uppercase tracking-wider text-on-surface-variant">
            Data Management
          </h3>

          <div className="space-y-3">
            <Button
              variant="secondary"
              className="w-full justify-between"
              onClick={handleResetCounters}
              disabled={actionLoading || !selectedCameraId}
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-secondary">
                  restart_alt
                </span>
                Reset Counters
              </span>
              <span className="material-symbols-outlined text-sm">
                chevron_right
              </span>
            </Button>

            <Button
              variant="secondary"
              className="w-full justify-between"
              onClick={() => {
                window.location.href = "/cameras";
              }}
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">
                  tune
                </span>
                Camera Settings
              </span>
              <span className="material-symbols-outlined text-sm">
                chevron_right
              </span>
            </Button>
          </div>
        </GlassPanel>

        <GlassPanel className="p-6">
          <h3 className="mb-4 border-b border-outline-variant/30 pb-2 font-mono text-xs uppercase tracking-wider text-on-surface-variant">
            Runtime Status
          </h3>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-on-surface-variant">DETECTIONS</span>
              <span className="text-tertiary">
                {liveStatus?.detection_count || 0}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-on-surface-variant">ENTRY</span>
              <span className="text-tertiary">
                {liveCount?.entry_count || 0}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-on-surface-variant">EXIT</span>
              <span className="text-secondary">
                {liveCount?.exit_count || 0}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-on-surface-variant">INSIDE</span>
              <span className="text-primary">
                {liveCount?.currently_inside || 0}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-on-surface-variant">STATE</span>
              <span className={statusColor}>{cameraStatusText}</span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-on-surface-variant">HAS FRAME</span>
              <span className={hasFrame ? "text-tertiary" : "text-error"}>
                {hasFrame ? "YES" : "NO"}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-on-surface-variant">DB STATUS</span>
              <span className="text-primary">
                {liveStatus?.camera_status || "UNKNOWN"}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-on-surface-variant">SOURCE</span>
              <span className="max-w-40 truncate text-right text-on-background">
                {selectedCamera?.camera_type || "N/A"}
              </span>
            </div>
          </div>
        </GlassPanel>
        <GlassPanel className="p-6">
          <h3 className="mb-4 border-b border-outline-variant/30 pb-2 font-mono text-xs uppercase tracking-wider text-on-surface-variant">
            Recent Count Events
          </h3>

          {liveCount?.last_events?.length > 0 ? (
            <div className="space-y-3 font-mono text-xs">
              {liveCount.last_events.slice().reverse().map((event, index) => (
                <div
                  key={`${event.track_id}-${event.timestamp}-${index}`}
                  className="flex items-center justify-between rounded bg-surface-container-lowest px-3 py-2"
                >
                  <span
                    className={
                      event.event_type === "ENTRY"
                        ? "text-tertiary"
                        : "text-secondary"
                    }
                  >
                    {event.event_type}
                  </span>

                  <span className="text-on-surface-variant">
                    ID:{event.track_id}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant">
              No entry/exit events yet.
            </p>
          )}
        </GlassPanel>
      </div>
    </div>
  );
}

export default LiveCamera;