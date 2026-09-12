import React, { FC, useState, useMemo } from "react";
import { UserPlus, AlertCircle, Inbox, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { EmentorCurationItem } from "../../api/curationApi";
import useStationReadOnly from "../../hooks/useStationReadOnly";

export type EmentorSortColumn = "name" | "curation_from";

export interface EmentorCurationTableProps {
  curations: EmentorCurationItem[];
  isLoading: boolean;
  searchQuery: string;
  onAddDriver: (row: EmentorCurationItem) => void;
}

export const EmentorCurationTable: FC<EmentorCurationTableProps> = ({
  curations,
  isLoading,
  searchQuery,
  onAddDriver,
}) => {
  const { readOnly, reason } = useStationReadOnly();
  const [sortColumn, setSortColumn] = useState<EmentorSortColumn>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (column: EmentorSortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const renderSortIcon = (column: EmentorSortColumn) => {
    if (sortColumn !== column) {
      return (
        <ArrowUpDown
          size={12}
          className="text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0"
        />
      );
    }
    return sortDirection === "asc" ? (
      <ArrowUp size={12} className="text-blue-600 font-bold flex-shrink-0" />
    ) : (
      <ArrowDown size={12} className="text-blue-600 font-bold flex-shrink-0" />
    );
  };

  // Filter based on search query
  const filteredCurations = useMemo(() => {
    if (!searchQuery.trim()) return curations;
    const q = searchQuery.toLowerCase().trim();
    return curations.filter((c) => (c.name || "").toLowerCase().includes(q));
  }, [curations, searchQuery]);

  // Sort filtered curations
  const sortedCurations = useMemo(() => {
    return [...filteredCurations].sort((a, b) => {
      let valA = "";
      let valB = "";
      if (sortColumn === "name") {
        valA = a.name || "";
        valB = b.name || "";
      } else if (sortColumn === "curation_from") {
        valA = a.curation_from || "eMentor scorecard report";
        valB = b.curation_from || "eMentor scorecard report";
      }
      const comp = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? comp : -comp;
    });
  }, [filteredCurations, sortColumn, sortDirection]);

  if (isLoading) {
    return (
      <div className="curation-table-container">
        <div className="curation-skeleton-list">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="curation-skeleton-row">
              <div className="skeleton-text skeleton-wide" />
              <div className="skeleton-text skeleton-medium" />
              <div className="skeleton-text skeleton-short" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (curations.length === 0) {
    return (
      <div className="curation-empty-state">
        <div className="curation-empty-icon-wrap">
          <Inbox size={32} className="text-blue-500" />
        </div>
        <h4 className="curation-empty-title">No eMentor Curations Pending</h4>
        <p className="curation-empty-desc">
          All eMentor driving scorecards and driver IDs are assigned to your active roster.
        </p>
      </div>
    );
  }

  if (filteredCurations.length === 0) {
    return (
      <div className="curation-empty-state">
        <div className="curation-empty-icon-wrap">
          <AlertCircle size={32} className="text-amber-500" />
        </div>
        <h4 className="curation-empty-title">No matching records</h4>
        <p className="curation-empty-desc">
          No pending eMentor curations matched &quot;{searchQuery}&quot;.
        </p>
      </div>
    );
  }

  return (
    <div className="curation-table-container">
      <div className="curation-table-responsive-wrapper">
        <table className="curation-data-table">
          <thead>
            <tr>
              <th
                style={{ width: "45%" }}
                className="curation-th-sortable group"
                onClick={() => handleSort("name")}
                title="Click to sort by Driver Name"
              >
                <div className="flex items-center gap-1.5">
                  <span>Driver Name</span>
                  {renderSortIcon("name")}
                </div>
              </th>
              <th
                style={{ width: "41%" }}
                className="curation-th-sortable group"
                onClick={() => handleSort("curation_from")}
                title="Click to sort by Curation Source"
              >
                <div className="flex items-center gap-1.5">
                  <span>Curation Source</span>
                  {renderSortIcon("curation_from")}
                </div>
              </th>
              <th className="curation-th-action" style={{ width: "14%", textAlign: "center" }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedCurations.map((row) => {
              return (
                <tr key={row._id} className="curation-table-row">
                  {/* Name (clean text only, no extra initial letter) */}
                  <td>
                    <span className="curation-driver-name" title={row.name}>
                      {row.name}
                    </span>
                  </td>

                  {/* Curation Source (clean text, no icon) */}
                  <td>
                    <span className="curation-source-text">
                      eMentor scorecard report
                    </span>
                  </td>

                  {/* Action (Aligned Action button) */}
                  <td className="curation-td-action" style={{ textAlign: "center" }}>
                    <div className="curation-action-wrap">
                      <button
                        type="button"
                        disabled={readOnly}
                        className={`btn-blue-primary btn-xs flex items-center gap-1.5 ${readOnly ? "opacity-50 cursor-not-allowed" : ""}`}
                        onClick={() => {
                          if (readOnly) return;
                          onAddDriver(row);
                        }}
                        title={readOnly ? reason : "Add driver to roster"}
                      >
                        <UserPlus size={13} style={{ color: "#FFFFFF" }} />
                        <span style={{ color: "#FFFFFF" }}>Add Driver</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmentorCurationTable;
