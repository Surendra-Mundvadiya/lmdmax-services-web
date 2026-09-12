import React, { FC, useState, useMemo } from "react";
import { UserPlus, AlertCircle, Inbox, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { RemainingCuration } from "../../api/curationApi";
import useStationReadOnly from "../../hooks/useStationReadOnly";

export type UnifiedSortColumn = "name" | "transporter_id" | "curation_from";

export interface UnifiedCurationTableProps {
  curations: RemainingCuration[];
  isLoading: boolean;
  searchQuery: string;
  onAddDriver: (row: RemainingCuration) => void;
}

export const UnifiedCurationTable: FC<UnifiedCurationTableProps> = ({
  curations,
  isLoading,
  searchQuery,
  onAddDriver,
}) => {
  const { readOnly, reason } = useStationReadOnly();
  const [sortColumn, setSortColumn] = useState<UnifiedSortColumn>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (column: UnifiedSortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const renderSortIcon = (column: UnifiedSortColumn) => {
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

  // Filter curations based on search query
  const filteredCurations = useMemo(() => {
    if (!searchQuery.trim()) return curations;
    const q = searchQuery.toLowerCase().trim();
    return curations.filter((c) => {
      const nameMatch = (c.name || "").toLowerCase().includes(q);
      const tidMatch = (c.transporter_id || "").toLowerCase().includes(q);
      const fromMatch = (c.curation_from || "").toLowerCase().includes(q);
      return nameMatch || tidMatch || fromMatch;
    });
  }, [curations, searchQuery]);

  // Sort filtered curations
  const sortedCurations = useMemo(() => {
    return [...filteredCurations].sort((a, b) => {
      let valA = "";
      let valB = "";
      if (sortColumn === "name") {
        valA = a.name || "";
        valB = b.name || "";
      } else if (sortColumn === "transporter_id") {
        valA = a.transporter_id || "";
        valB = b.transporter_id || "";
      } else if (sortColumn === "curation_from") {
        valA = a.curation_from || "";
        valB = b.curation_from || "";
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
        <h4 className="curation-empty-title">No Unified Curations Pending</h4>
        <p className="curation-empty-desc">
          All driver transporter IDs are resolved and matched to your active roster.
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
          No pending unified curations matched &quot;{searchQuery}&quot;.
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
                style={{ width: "36%" }}
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
                style={{ width: "26%" }}
                className="curation-th-sortable group"
                onClick={() => handleSort("transporter_id")}
                title="Click to sort by Transporter ID"
              >
                <div className="flex items-center gap-1.5">
                  <span>Transporter ID</span>
                  {renderSortIcon("transporter_id")}
                </div>
              </th>
              <th
                style={{ width: "24%" }}
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
              const sourceText = row.curation_from
                ? row.curation_from.replace(/_/g, " ")
                : "Scorecard report";

              return (
                <tr key={row._id} className="curation-table-row">
                  {/* Driver Name (clean text only, no extra initial letter or matching badge) */}
                  <td>
                    <span className="curation-driver-name" title={row.name}>
                      {row.name}
                    </span>
                  </td>

                  {/* Transporter ID */}
                  <td>
                    <span className="curation-tid-text">
                      {row.transporter_id ? row.transporter_id.replace(/^#+/, "") : "—"}
                    </span>
                  </td>

                  {/* Source (clean text, no icon) */}
                  <td>
                    <span className="curation-source-text">
                      {sourceText}
                    </span>
                  </td>

                  {/* Actions (Aligned Action button) */}
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

export default UnifiedCurationTable;
