"use client";

import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// --- Type Definitions (update import paths as needed) ---
import { FarmdersType } from "../farmersdata/farmers";
import { Schemesdatas } from "../schemesdata/schemes";
import { Taluka } from "../Taluka/Taluka";

interface AllFarmersData {
  schemes: Schemesdatas[];
  farmers: FarmdersType[];
  taluka: Taluka[];
}

type SchemeBarData = {
  schemeName: string;
  schemeId: number;
  Applied: number;
  NotApplied: number;
  Benefited: number;
};

const STATUS_LABELS = [
  { value: "Applied", label: "Applied", color: "#8884d8" },
  { value: "NotApplied", label: "Not Applied", color: "#ffc658" },
  { value: "Benefited", label: "Benefited", color: "#82ca9d" },
];
const PAGE_SIZE = 50;

// Helper: Get latest status per scheme ID from a farmer's schemes string
function getLatestSchemeStatuses(schemesString: string | undefined) {
  if (!schemesString) return {};
  const entries = schemesString.split("|");
  const schemeStatusMap: Record<string, string> = {};

  entries.forEach((entry) => {
    // Extract scheme ID: digit(s) before first hyphen or before | if no hyphen
    // The scheme ID is always before the first hyphen in each entry or if multiple hyphens, before the first hyphen
    // Given example: "8-FSDIMG2631720250613965.jpg-Year 2015-Benefit Received"
    // So scheme ID is "8", status is last part after last hyphen -> "Benefit Received"
    const parts = entry.split("-");
    if (parts.length < 2) return; // ignore malformed

    const schemeIdMatch = parts[0].trim();
    const schemeId = schemeIdMatch;

    // Status is last part trimmed
    const lastPart = parts[parts.length - 1].trim().toLowerCase();

    // Check status mapping according to normalized status string
    // Normalize status text to known labels
    let status = "";
    if (lastPart === "benefit received") {
      status = "Benefited";
    } else if (
      lastPart === "applyed" || // intentional typo from original
      lastPart === "applied"
    ) {
      status = "Applied";
    } else {
      // treat all others as NotApplied (including absent or unknown)
      status = "NotApplied";
    }

    // Always set latest status for schemeId
    schemeStatusMap[schemeId] = status;
  });

  return schemeStatusMap;
}

function getSchemeStats(
  farmers: FarmdersType[],
  schemes: Schemesdatas[]
): SchemeBarData[] {
  const stats: Record<number, SchemeBarData> = {};
  schemes.forEach((scheme) => {
    stats[scheme.scheme_id] = {
      schemeName: scheme.scheme_name,
      schemeId: scheme.scheme_id,
      Applied: 0,
      NotApplied: 0,
      Benefited: 0,
    };
  });

  farmers.forEach((farmer) => {
    const statuses = getLatestSchemeStatuses(farmer.schemes);
    schemes.forEach((scheme) => {
      const status = statuses[String(scheme.scheme_id)];
      if (!status || status === "NotApplied") {
        stats[scheme.scheme_id].NotApplied += 1;
      } else if (status === "Applied") {
        stats[scheme.scheme_id].Applied += 1;
      } else if (status === "Benefited") {
        stats[scheme.scheme_id].Benefited += 1;
      }
    });
  });

  return Object.values(stats);
}

const SchemeStatusBarChart = ({
  farmersData,
}: {
  farmersData: AllFarmersData;
}) => {
  const { farmers, schemes, taluka } = farmersData;

  const chartData = useMemo(() => getSchemeStats(farmers, schemes), [farmers, schemes]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState<SchemeBarData | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<"Applied" | "NotApplied" | "Benefited">("Benefited");
  const [page, setPage] = useState(1);

  // On bar click
  const handleBarClick = (
    scheme: SchemeBarData | undefined,
    status: "Applied" | "NotApplied" | "Benefited"
  ) => {
    if (scheme) {
      setSelectedScheme(scheme);
      setSelectedStatus(status);
      setModalOpen(true);
      setPage(1);
    }
  };

  // Filtered farmers for modal
  const filteredFarmers = useMemo(() => {
    if (!selectedScheme) return [];
    const schemeId = selectedScheme.schemeId;
    return farmers.filter((farmer) => {
      const statuses = getLatestSchemeStatuses(farmer.schemes);
      const status = statuses[String(schemeId)];
      if (selectedStatus === "NotApplied") {
        return !status || status === "NotApplied";
      }
      if (selectedStatus === "Applied") {
        return status === "Applied";
      }
      if (selectedStatus === "Benefited") {
        return status === "Benefited";
      }
      return false;
    });
  }, [selectedScheme, selectedStatus, farmers]);

  // Pagination logic
  const totalPages = Math.ceil(filteredFarmers.length / PAGE_SIZE);
  const paginatedFarmers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredFarmers.slice(start, start + PAGE_SIZE);
  }, [filteredFarmers, page]);

  // Excel Export (current page only)
  const handleDownload = () => {
    if (!paginatedFarmers.length) return;
    const data = paginatedFarmers.map((farmer) => ({
      FarmerId: farmer.farmer_id || "",
      Name: farmer.name || "",
      Aadhaar: farmer.aadhaar_no || "",
      Taluka:
        taluka.find((t) => t.taluka_id === Number(farmer.taluka_id))?.name || "",
      SchemeStatus: selectedStatus,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Farmers");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([excelBuffer], { type: "application/octet-stream" }),
      `Farmers_${selectedScheme?.schemeName}_${selectedStatus}_Page${page}.xlsx`
    );
  };

  // Calculate totals for all statuses across all schemes
//   const totalApplied = chartData.reduce((sum, scheme) => sum + scheme.Applied, 0);
//   const totalNotApplied = chartData.reduce((sum, scheme) => sum + scheme.NotApplied, 0);
//   const totalBenefited = chartData.reduce((sum, scheme) => sum + scheme.Benefited, 0);

  return (
    <>
      <div className="w-full max-w-6xl mx-auto mt-5">
        <div className="bg-white p-6 rounded-xl shadow-lg w-full">
          <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">
                Scheme wise IFR holders
              </h2>
              <div className="bg-white p-4 rounded-lg shadow-md w-full md:w-auto">
                <div className="text-sm text-gray-700 space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4"
                      style={{ background: "#8884d8", borderRadius: 4 }}
                    />
                    <p>
                      Applied
                      {/* : <strong>{totalApplied}</strong> */}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4"
                      style={{ background: "#ffc658", borderRadius: 4 }}
                    />
                    <p>
                      Not Applied
                      {/* : <strong>{totalNotApplied}</strong> */}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4"
                      style={{ background: "#82ca9d", borderRadius: 4 }}
                    />
                    <p>
                      Benefited
                      {/* : <strong>{totalBenefited}</strong> */}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ width: "100%", height: 400 }}>
              <ResponsiveContainer>
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="schemeName"
                    angle={-40}
                    textAnchor="end"
                    interval={0}
                    fontSize={10}
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  {STATUS_LABELS.map((status) => (
                    <Bar
                      key={status.value}
                      dataKey={status.value}
                      fill={status.color}
                      name={status.label}
                      onClick={(_data, index) => {
                        const scheme = chartData[index];
                        handleBarClick(
                          scheme,
                          status.value as "Applied" | "NotApplied" | "Benefited"
                        );
                      }}
                      cursor="pointer"
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && selectedScheme && (
        <div
          className="fixed inset-0 bg-[#0303033f] bg-opacity-50 flex items-center justify-start p-4 z-[99999]"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-4xl relative ml-[25%]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 text-2xl"
              onClick={() => setModalOpen(false)}
            >
              &times;
            </button>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
              <h3 className="text-xl font-bold mb-2 md:mb-0">
                IFR Holders for Scheme:{" "}
                <span className="text-blue-600">{selectedScheme.schemeName}</span>
              </h3>
              <div className="flex gap-2 flex-wrap">
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(
                      e.target.value as "Applied" | "NotApplied" | "Benefited"
                    );
                    setPage(1);
                  }}
                  className="border rounded px-2 py-1"
                >
                  {STATUS_LABELS.map((s) => (
                    <option value={s.value} key={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <button
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                  onClick={handleDownload}
                >
                  Download Excel
                </button>
              </div>
            </div>
            <div className="overflow-auto max-h-[60vh]">
              <table className="min-w-full border text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1">#</th>
                    <th className="border px-2 py-1">Farmer ID</th>
                    <th className="border px-2 py-1">Name</th>
                    <th className="border px-2 py-1">Aadhaar</th>
                    <th className="border px-2 py-1">Taluka</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedFarmers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4">
                        No data found.
                      </td>
                    </tr>
                  ) : (
                    paginatedFarmers.map((farmer, idx) => (
                      <tr key={farmer.farmer_id || ""}>
                        <td className="border px-2 py-1">
                          {(page - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        <td className="border px-2 py-1">
                          {farmer.farmer_id || ""}
                        </td>
                        <td className="border px-2 py-1">{farmer.name || ""}</td>
                        <td className="border px-2 py-1">
                          {farmer.aadhaar_no || ""}
                        </td>
                        <td className="border px-2 py-1">
                          {taluka.find(
                            (t) => t.taluka_id === Number(farmer.taluka_id)
                          )?.name || ""}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-4">
              <span>
                Showing {(page - 1) * PAGE_SIZE + 1}-
                {Math.min(page * PAGE_SIZE, filteredFarmers.length)} of{" "}
                {filteredFarmers.length}
              </span>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 border rounded disabled:opacity-50"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Prev
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  className="px-3 py-1 border rounded disabled:opacity-50"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SchemeStatusBarChart;

