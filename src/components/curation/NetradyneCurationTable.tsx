import React, { FC, useState, useMemo } from "react";
import { UserPlus, AlertCircle, Inbox, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { UnresolvedNetradyneCuration } from "../../api/curationApi";
import useStationReadOnly from "../../hooks/useStationReadOnly";

export type NetradyneSortColumn = "driver_name" | "netradyne_id" | "reason";

export interface NetradyneCurationTableProps {
  curations: UnresolvedNetradyneCuration[];
  isLoading: boolean;
  searchQuery: string;
  onAddDriver: (row: UnresolvedNetradyneCuration) => void;
}

export const NetradyneCurationTable: FC<NetradyneCurationTableProps> = ({
  curations,
  isLoading,
  searchQuery,
  onAddDriver,
}) => {
  const { readOnly, reason } = useStationReadOnly();
  const [sortColumn, setSortColumn] = useState<NetradyneSortColumn>("driver_name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (column: NetradyneSortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const renderSortIcon = (column: NetradyneSortColumn) => {
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
      const nameMatch = (c.driver_name || "").toLowerCase().includes(q);
      const netMatch = (c.netradyne_id || "").toLowerCase().includes(q);
      const reasonMatch = (c.reason || "").toLowerCase().includes(q);
      return nameMatch || netMatch || reasonMatch;
    });
  }, [curations, searchQuery]);

  // Sort filtered curations
  const sortedCurations = useMemo(() => {
    return [...filteredCurations].sort((a, b) => {
      let valA = "";
      let valB = "";
      if (sortColumn === "driver_name") {
        valA = a.driver_name || "";
        valB = b.driver_name || "";
      } else if (sortColumn === "netradyne_id") {
        valA = a.netradyne_id || "";
        valB = b.netradyne_id || "";
      } else if (sortColumn === "reason") {
        valA = a.reason || "";
        valB = b.reason || "";
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
        <h4 className="curation-empty-title">No Netradyne Curations Pending</h4>
        <p className="curation-empty-desc">
          All Netradyne safety alerts and telematics IDs are matched to registered drivers.
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
          No pending Netradyne curations matched &quot;{searchQuery}&quot;.
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
                onClick={() => handleSort("driver_name")}
                title="Click to sort by Driver Name"
              >
                <div className="flex items-center gap-1.5">
                  <span>Driver Name</span>
                  {renderSortIcon("driver_name")}
                </div>
              </th>
              <th
                style={{ width: "26%" }}
                className="curation-th-sortable group"
                onClick={() => handleSort("netradyne_id")}
                title="Click to sort by Netradyne ID"
              >
                <div className="flex items-center gap-1.5">
                  <span>Netradyne ID</span>
                  {renderSortIcon("netradyne_id")}
                </div>
              </th>
              <th
                style={{ width: "24%" }}
                className="curation-th-sortable group"
                onClick={() => handleSort("reason")}
                title="Click to sort by Curation Source"
              >
                <div className="flex items-center gap-1.5">
                  <span>Curation Source</span>
                  {renderSortIcon("reason")}
                </div>
              </th>
              <th className="curation-th-action" style={{ width: "14%", textAlign: "center" }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedCurations.map((row) => {
              const sourceText = row.reason
                ? row.reason
                : "Netradyne safety report";

              return (
                <tr key={row._id} className="curation-table-row">
                  {/* Driver Name (clean text only, no extra initial letter) */}
                  <td>
                    <span className="curation-driver-name" title={row.driver_name}>
                      {row.driver_name}
                    </span>
                  </td>

                  {/* Netradyne ID */}
                  <td>
                    <span className="curation-tid-text">
                      {row.netradyne_id ? row.netradyne_id.replace(/^#+/, "") : "Unassigned"}
                    </span>
                  </td>

                  {/* Curation Source (clean text, no icon) */}
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

export default NetradyneCurationTable;
