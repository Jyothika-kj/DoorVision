import { useEffect, useState } from "react";

import StatCard from "../components/cards/StatCard";
import GlassPanel from "../components/cards/GlassPanel";
import Button from "../components/common/Button";

import {
  getDashboardSummary,
  getRecentEvents,
} from "../services/dashboardService";

const defaultSummary = {
  total_entry_today: 0,
  total_exit_today: 0,
  currently_inside: 0,
  peak_occupancy_today: 0,
  total_cameras: 0,
  active_cameras: 0,
  offline_cameras: 0,
  error_cameras: 0,
};

function Dashboard() {
  const [summary, setSummary] = useState(defaultSummary);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboardData();

    const intervalId = setInterval(() => {
      loadDashboardData(false);
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  async function loadDashboardData(showLoading = true) {
    if (showLoading) {
      setLoading(true);
    }

    setError("");

    try {
      const [summaryData, eventsData] = await Promise.all([
        getDashboardSummary(),
        getRecentEvents(8),
      ]);

      setSummary(summaryData);
      setRecentEvents(eventsData);
    } catch (err) {
      setError("Failed to load dashboard data. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  }

  function formatTime(dateValue) {
    if (!dateValue) return "-";

    return new Date(dateValue).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-on-surface-variant">
            Overview
          </p>

          <h1 className="mt-1 text-2xl font-bold text-on-background md:text-3xl">
            DoorVision AI Dashboard
          </h1>

          <p className="mt-2 text-sm text-on-surface-variant">
            Real-time occupancy summary from live camera counting data.
          </p>
        </div>

        <Button variant="secondary" onClick={() => loadDashboardData()}>
          <span className="material-symbols-outlined text-sm">refresh</span>
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded border border-outline-variant/40 bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
          Loading dashboard data...
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Entry Today"
          value={summary.total_entry_today}
          icon="login"
        />

        <StatCard
          title="Exit Today"
          value={summary.total_exit_today}
          icon="logout"
          color="text-secondary"
          border="border-l-secondary"
        />

        <StatCard
          title="Currently Inside"
          value={summary.currently_inside}
          icon="group"
          color="text-tertiary"
          border="border-l-tertiary"
        />

        <StatCard
          title="Peak Occupancy"
          value={summary.peak_occupancy_today}
          icon="groups"
          color="text-error"
          border="border-l-error"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <GlassPanel className="p-6 lg:col-span-8">
          <h3 className="mb-4 border-b border-outline-variant/30 pb-2 font-mono text-xs uppercase tracking-wider text-on-surface-variant">
            Camera Health
          </h3>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded bg-surface-container-lowest p-4">
              <p className="font-mono text-xs uppercase text-on-surface-variant">
                Total Cameras
              </p>
              <p className="mt-2 text-3xl font-bold text-primary">
                {summary.total_cameras}
              </p>
            </div>

            <div className="rounded bg-surface-container-lowest p-4">
              <p className="font-mono text-xs uppercase text-on-surface-variant">
                Active
              </p>
              <p className="mt-2 text-3xl font-bold text-tertiary">
                {summary.active_cameras}
              </p>
            </div>

            <div className="rounded bg-surface-container-lowest p-4">
              <p className="font-mono text-xs uppercase text-on-surface-variant">
                Offline
              </p>
              <p className="mt-2 text-3xl font-bold text-on-surface-variant">
                {summary.offline_cameras}
              </p>
            </div>

            <div className="rounded bg-surface-container-lowest p-4">
              <p className="font-mono text-xs uppercase text-on-surface-variant">
                Error
              </p>
              <p className="mt-2 text-3xl font-bold text-error">
                {summary.error_cameras}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded bg-surface-container-lowest p-4">
            <p className="font-mono text-xs uppercase tracking-wider text-on-surface-variant">
              System Note
            </p>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Counts are updated from live AI line-crossing events. If values are zero,
              start a camera and cross the configured counting line.
            </p>
          </div>
        </GlassPanel>

        <GlassPanel className="p-6 lg:col-span-4">
          <h3 className="mb-4 border-b border-outline-variant/30 pb-2 font-mono text-xs uppercase tracking-wider text-on-surface-variant">
            Recent Events
          </h3>

          {recentEvents.length === 0 ? (
            <p className="text-sm text-on-surface-variant">
              No entry/exit events yet.
            </p>
          ) : (
            <div className="space-y-3">
              {recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded bg-surface-container-lowest px-3 py-3"
                >
                  <div>
                    <p
                      className={[
                        "font-mono text-xs font-semibold uppercase",
                        event.event_type === "ENTRY"
                          ? "text-tertiary"
                          : "text-secondary",
                      ].join(" ")}
                    >
                      {event.event_type}
                    </p>

                    <p className="mt-1 text-xs text-on-surface-variant">
                      {event.camera_name || `Camera ${event.camera_id}`}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-mono text-xs text-on-background">
                      ID:{event.track_id || "-"}
                    </p>

                    <p className="mt-1 text-xs text-on-surface-variant">
                      {formatTime(event.event_time)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassPanel>
      </div>
    </div>
  );
}

export default Dashboard;