import api from "./api";

export async function getDailyReport(reportDate, cameraId = "") {
  const params = new URLSearchParams();

  if (reportDate) {
    params.append("report_date", reportDate);
  }

  if (cameraId) {
    params.append("camera_id", cameraId);
  }

  const response = await api.get(`/reports/daily?${params.toString()}`);
  return response.data;
}

export async function getDateRangeReport(startDate, endDate, cameraId = "") {
  const params = new URLSearchParams();

  params.append("start_date", startDate);
  params.append("end_date", endDate);

  if (cameraId) {
    params.append("camera_id", cameraId);
  }

  const response = await api.get(`/reports/date-range?${params.toString()}`);
  return response.data;
}

export async function getHourlyReport(reportDate, cameraId = "") {
  const params = new URLSearchParams();

  if (reportDate) {
    params.append("report_date", reportDate);
  }

  if (cameraId) {
    params.append("camera_id", cameraId);
  }

  const response = await api.get(`/reports/hourly?${params.toString()}`);
  return response.data;
}

export async function downloadPdfReport(startDate, endDate, cameraId = "") {
  const params = new URLSearchParams();

  params.append("start_date", startDate);
  params.append("end_date", endDate);

  if (cameraId) {
    params.append("camera_id", cameraId);
  }

  const response = await api.get(`/reports/export/pdf?${params.toString()}`, {
    responseType: "blob",
  });

  const blob = new Blob([response.data], {
    type: "application/pdf",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `doorvision_report_${startDate}_to_${endDate}.pdf`;
  link.click();

  URL.revokeObjectURL(url);
}