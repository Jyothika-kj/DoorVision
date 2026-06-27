import { useEffect, useMemo, useState } from "react";

import GlassPanel from "../components/cards/GlassPanel";
import StatCard from "../components/cards/StatCard";
import Button from "../components/common/Button";

import { getCameras } from "../services/cameraService";
import {
  downloadPdfReport,
  getDailyReport,
  getDateRangeReport,
  getHourlyReport,
} from "../services/reportService";

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function getMonthStartDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
}

function Reports() {
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");

  const [reportDate, setReportDate] = useState(getTodayDate());
  const [startDate, setStartDate] = useState(getMonthStartDate());
  const [endDate, setEndDate] = useState(getTodayDate());

  const [dailyReports, setDailyReports] = useState([]);
  const [rangeReports, setRangeReports] = useState([]);
  const [hourlyReport, setHourlyReport] = useState({
    hourly_data: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const dailySummary = useMemo(() => {
    return dailyReports.reduce(
      (acc, report) => {
        acc.total_entry += report.total_entry;
        acc.total_exit += report.total_exit;
        acc.currently_inside += report.currently_inside;
        acc.peak_occupancy = Math.max(
          acc.peak_occupancy,
          report.peak_occupancy
        );

        return acc;
      },
      {
        total_entry: 0,
        total_exit: 0,
        currently_inside: 0,
        peak_occupancy: 0,
      }
    );
  }, [dailyReports]);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function handleDownloadPdf() {
    setLoading(true);
    setError("");

    try {
      await downloadPdfReport(startDate, endDate, selectedCameraId);
    } catch (err) {
      setError("Failed to download PDF report.");
    } finally {
      setLoading(false);
    }
  }

  async function loadInitialData() {
    setLoading(true);
    setError("");

    try {
      const cameraData = await getCameras();
      setCameras(cameraData);

      await loadReports();
    } catch (err) {
      setError("Failed to load reports data. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  }

  async function loadReports() {
    setLoading(true);
    setError("");

    try {
      const [dailyData, rangeData, hourlyData] = await Promise.all([
        getDailyReport(reportDate, selectedCameraId),
        getDateRangeReport(startDate, endDate, selectedCameraId),
        getHourlyReport(reportDate, selectedCameraId),
      ]);

      setDailyReports(dailyData);
      setRangeReports(rangeData);
      setHourlyReport(hourlyData);
    } catch (err) {
      setError("Failed to load report details.");
    } finally {
      setLoading(false);
    }
  }

  function getBarHeight(value) {
    const maxValue = Math.max(
      1,
      ...(hourlyReport.hourly_data || []).map((item) =>
        Math.max(item.entry_count, item.exit_count)
      )
    );

    return `${Math.max(4, (value / maxValue) * 100)}%`;
  }

  function formatDate(dateValue) {
    if (!dateValue) return "-";
    return new Date(dateValue).toLocaleDateString();
  }

  function handleDownloadCsv() {
    const rows = [
      [
        "Report Date",
        "Camera Name",
        "Total Entry",
        "Total Exit",
        "Currently Inside",
        "Peak Occupancy",
      ],
      ...rangeReports.map((report) => [
        report.report_date,
        report.camera_name || `Camera ${report.camera_id}`,
        report.total_entry,
        report.total_exit,
        report.currently_inside,
        report.peak_occupancy,
      ]),
    ];

    const csvContent = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `doorvision_report_${startDate}_to_${endDate}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-on-surface-variant">
            Occupancy History
          </p>

          <h1 className="mt-1 text-2xl font-bold text-on-background md:text-3xl">
            Reports
          </h1>

          <p className="mt-2 text-sm text-on-surface-variant">
            View daily, hourly, and camera-wise people counting reports.
          </p>
        </div>

        <Button variant="secondary" onClick={loadReports}>
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
          Loading reports...
        </div>
      )}

      <GlassPanel className="p-6">
        <h3 className="mb-4 border-b border-outline-variant/30 pb-2 font-mono text-xs uppercase tracking-wider text-on-surface-variant">
          Filters
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <label className="block">
            <span className="mb-2 block font-mono text-xs uppercase tracking-wider text-on-surface-variant">
              Camera
            </span>

            <select
              value={selectedCameraId}
              onChange={(event) => setSelectedCameraId(event.target.value)}
              className="w-full rounded border border-outline-variant/50 bg-surface-container-low px-4 py-3 text-on-background outline-none focus:border-primary"
            >
              <option value="">All Cameras</option>
              {cameras.map((camera) => (
                <option key={camera.id} value={camera.id}>
                  {camera.camera_name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block font-mono text-xs uppercase tracking-wider text-on-surface-variant">
              Report Date
            </span>

            <input
              type="date"
              value={reportDate}
              onChange={(event) => setReportDate(event.target.value)}
              className="w-full rounded border border-outline-variant/50 bg-surface-container-low px-4 py-3 text-on-background outline-none focus:border-primary"
            />
          </label>

          <label className="block">
            <span className="mb-2 block font-mono text-xs uppercase tracking-wider text-on-surface-variant">
              Start Date
            </span>

            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full rounded border border-outline-variant/50 bg-surface-container-low px-4 py-3 text-on-background outline-none focus:border-primary"
            />
          </label>

          <label className="block">
            <span className="mb-2 block font-mono text-xs uppercase tracking-wider text-on-surface-variant">
              End Date
            </span>

            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full rounded border border-outline-variant/50 bg-surface-container-low px-4 py-3 text-on-background outline-none focus:border-primary"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Button onClick={loadReports}>
            <span className="material-symbols-outlined text-sm">search</span>
            Apply Filters
          </Button>

          <Button
            variant="secondary"
            onClick={handleDownloadCsv}
            disabled={rangeReports.length === 0}
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Download CSV
          </Button>

          <Button
            variant="secondary"
            onClick={handleDownloadPdf}
          >
            <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
            Download PDF
          </Button>

        </div>
      </GlassPanel>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard
          title="Total Entry"
          value={dailySummary.total_entry}
          icon="login"
        />

        <StatCard
          title="Total Exit"
          value={dailySummary.total_exit}
          icon="logout"
          color="text-secondary"
          border="border-l-secondary"
        />

        <StatCard
          title="Currently Inside"
          value={dailySummary.currently_inside}
          icon="group"
          color="text-tertiary"
          border="border-l-tertiary"
        />

        <StatCard
          title="Peak Occupancy"
          value={dailySummary.peak_occupancy}
          icon="groups"
          color="text-error"
          border="border-l-error"
        />
      </div>

      <GlassPanel className="p-6">
        <h3 className="mb-4 font-mono text-xs uppercase tracking-wider text-on-surface-variant">
          Hourly Entry / Exit Chart
        </h3>

        <div className="flex h-72 items-end gap-2 overflow-x-auto rounded bg-surface-container-lowest p-4">
          {(hourlyReport.hourly_data || []).map((item) => (
            <div
              key={item.hour}
              className="flex h-full min-w-8 flex-col items-center justify-end gap-1"
            >
              <div className="flex h-full w-full items-end justify-center gap-1">
                <div
                  title={`Entry: ${item.entry_count}`}
                  className="w-3 rounded-t bg-tertiary/80"
                  style={{ height: getBarHeight(item.entry_count) }}
                />

                <div
                  title={`Exit: ${item.exit_count}`}
                  className="w-3 rounded-t bg-secondary/80"
                  style={{ height: getBarHeight(item.exit_count) }}
                />
              </div>

              <span className="font-mono text-[10px] text-on-surface-variant">
                {item.hour}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-4 font-mono text-xs uppercase">
          <span className="text-tertiary">Entry</span>
          <span className="text-secondary">Exit</span>
        </div>
      </GlassPanel>

      <GlassPanel className="p-6">
        <h3 className="mb-4 border-b border-outline-variant/30 pb-2 font-mono text-xs uppercase tracking-wider text-on-surface-variant">
          Daily Report
        </h3>

        {dailyReports.length === 0 ? (
          <p className="text-sm text-on-surface-variant">
            No report found for selected date.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-outline-variant/40 font-mono text-xs uppercase text-on-surface-variant">
                <tr>
                  <th className="py-3">Date</th>
                  <th className="py-3">Camera</th>
                  <th className="py-3">Entry</th>
                  <th className="py-3">Exit</th>
                  <th className="py-3">Inside</th>
                  <th className="py-3">Peak</th>
                </tr>
              </thead>

              <tbody>
                {dailyReports.map((report) => (
                  <tr
                    key={report.id}
                    className="border-b border-outline-variant/20"
                  >
                    <td className="py-3 text-on-surface-variant">
                      {formatDate(report.report_date)}
                    </td>

                    <td className="py-3 text-on-background">
                      {report.camera_name || `Camera ${report.camera_id}`}
                    </td>

                    <td className="py-3 text-tertiary">
                      {report.total_entry}
                    </td>

                    <td className="py-3 text-secondary">
                      {report.total_exit}
                    </td>

                    <td className="py-3 text-on-background">
                      {report.currently_inside}
                    </td>

                    <td className="py-3 text-error">
                      {report.peak_occupancy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassPanel>

      <GlassPanel className="p-6">
        <h3 className="mb-4 border-b border-outline-variant/30 pb-2 font-mono text-xs uppercase tracking-wider text-on-surface-variant">
          Date Range Report
        </h3>

        {rangeReports.length === 0 ? (
          <p className="text-sm text-on-surface-variant">
            No report found for selected date range.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-outline-variant/40 font-mono text-xs uppercase text-on-surface-variant">
                <tr>
                  <th className="py-3">Date</th>
                  <th className="py-3">Camera</th>
                  <th className="py-3">Entry</th>
                  <th className="py-3">Exit</th>
                  <th className="py-3">Inside</th>
                  <th className="py-3">Peak</th>
                </tr>
              </thead>

              <tbody>
                {rangeReports.map((report) => (
                  <tr
                    key={report.id}
                    className="border-b border-outline-variant/20"
                  >
                    <td className="py-3 text-on-surface-variant">
                      {formatDate(report.report_date)}
                    </td>

                    <td className="py-3 text-on-background">
                      {report.camera_name || `Camera ${report.camera_id}`}
                    </td>

                    <td className="py-3 text-tertiary">
                      {report.total_entry}
                    </td>

                    <td className="py-3 text-secondary">
                      {report.total_exit}
                    </td>

                    <td className="py-3 text-on-background">
                      {report.currently_inside}
                    </td>

                    <td className="py-3 text-error">
                      {report.peak_occupancy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}

export default Reports;