import React, { FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Star,
  ChevronRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  DriversLeaderboardSummary,
  DriverSummary,
  TierRating,
} from "../../api/unifiedDashboardApi";

interface Props {
  leaderboard?: DriversLeaderboardSummary;
  onSelectDriver: (driver: DriverSummary) => void;
  isLoading?: boolean;
}

export const DriverPerformanceRankingCard: FC<Props> = ({
  leaderboard,
  onSelectDriver,
  isLoading,
}) => {
  const navigate = useNavigate();
  // Switcher between Top 5 and Bottom 5
  const [rankingTab, setRankingTab] = useState<"top" | "bottom">("top");

  const liveTop = leaderboard?.topPerformers || [];
  const liveBottom = leaderboard?.bottomPerformers || [];

  // Normalize scores to be out of 100 if raw score is > 100 (e.g. 845 -> 99.4)
  const formatScoreOutOf100 = (score?: number): string => {
    if (score === undefined || score === null) return "0.0";
    if (score > 100) {
      return ((score / 850) * 100).toFixed(1);
    }
    return score.toFixed(1);
  };

  const topPerformers: DriverSummary[] = liveTop;
  const bottomPerformers: DriverSummary[] = liveBottom;

  // Exact user color rules for driver rating tiers:
  // Fantastic Plus -> purple, Fantastic -> blue, Great -> green, Fair -> orange, Poor -> red
  const getDriverRatingStyle = (score?: number, tier?: TierRating | string) => {
    const t = (tier || "").toLowerCase();
    const num = score && score > 100 ? (score / 850) * 100 : (score || 95);

    if (t.includes("plus") || num >= 99) {
      return { label: tier || "Fantastic Plus", color: "var(--ads-purple)", bg: "var(--ads-purple-tint)" };
    }
    if (t.includes("fantastic") || num >= 96) {
      return { label: tier || "Fantastic", color: "#0058B0", bg: "var(--ads-blue-tint)" };
    }
    if (t.includes("great") || num >= 90) {
      return { label: tier || "Great", color: "var(--ads-green)", bg: "var(--ads-green-tint)" };
    }
    if (t.includes("fair") || num >= 80) {
      return { label: tier || "Fair", color: "var(--ads-amber)", bg: "var(--ads-amber-tint)" };
    }
    return { label: tier || "Poor", color: "var(--ads-red)", bg: "var(--ads-red-tint)" };
  };

  const currentList = rankingTab === "top" ? topPerformers : bottomPerformers;

  return (
    <div className="uop-card uop-driver-ranking-card" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div className="uop-card-header" style={{ marginBottom: "0.35rem" }}>
        <h3 className="uop-card-title">
          <span>Driver Ranking</span>
        </h3>
        <div className="uop-card-icon emerald">
          <Star size={18} />
        </div>
      </div>

      {/* Main Content Body (Vertically balanced & filled to eliminate dead space) */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, margin: "auto 0" }}>
        {/* Tab Switcher: Top 5 vs Bottom 5 */}
        <div className="uop-ranking-switcher" style={{ marginBottom: "0.5rem" }}>
          <button
            type="button"
            className={`uop-ranking-tab ${rankingTab === "top" ? "active top" : ""}`}
            onClick={() => setRankingTab("top")}
          >
            <TrendingUp size={13} />
            <span>Top 5 Drivers</span>
          </button>
          <button
            type="button"
            className={`uop-ranking-tab ${rankingTab === "bottom" ? "active bottom" : ""}`}
            onClick={() => setRankingTab("bottom")}
          >
            <TrendingDown size={13} />
            <span>Bottom 5 Drivers</span>
          </button>
        </div>

        {/* Group Title Subtitle Bar */}
        <div className="uop-ranking-group-title" style={{ marginBottom: "0.45rem", padding: "0 0.15rem" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              color: rankingTab === "top" ? "var(--ads-green)" : "var(--ads-red)",
              fontWeight: 600,
              fontSize: "0.725rem",
              letterSpacing: "0.06em",
            }}
          >
            {rankingTab === "top" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {rankingTab === "top" ? "TOP 5 PERFORMERS" : "NEEDS COACHING (BOTTOM 5)"}
          </span>
          <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--ads-ink-quaternary)", letterSpacing: "0.06em" }}>
            SCORE & STANDING
          </span>
        </div>

        {/* Ranking List (5 rows only per tab) */}
        <div className="uop-ranking-list" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="uop-skeleton" style={{ height: 42, borderRadius: "var(--ads-r-sm)" }} />
            ))
          ) : currentList.length === 0 ? (
            <div
              style={{
                height: 160,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--ads-ink-tertiary)",
                fontSize: "0.8125rem",
                textAlign: "center",
                padding: "1rem",
              }}
            >
              No driver performance data recorded for this period
            </div>
          ) : (
            currentList.map((driver, i) => {
              const scoreOutOf100 = formatScoreOutOf100(driver.score);
              const ratingInfo = getDriverRatingStyle(driver.score, driver.tier);
              const rankNum = driver.rank || (rankingTab === "top" ? i + 1 : 50 - 4 + i);
              const isFirst = rankingTab === "top" && rankNum === 1;

              return (
                <div
                  key={driver.id || i}
                  className="uop-ranking-row"
                  onClick={() => onSelectDriver(driver)}
                  title={`View ${driver.name} rating and scorecard`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.52rem 0.65rem",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", minWidth: 0 }}>
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "var(--ads-r-xs)",
                        fontSize: "0.75rem",
                        fontWeight: 650,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        backgroundColor: isFirst
                          ? "var(--ads-amber-tint)"
                          : rankingTab === "top"
                          ? "var(--ads-green-tint)"
                          : "var(--ads-red-tint)",
                        color: isFirst
                          ? "var(--ads-amber)"
                          : rankingTab === "top"
                          ? "var(--ads-green)"
                          : "var(--ads-red)",
                        border: "1px solid transparent",
                      }}
                    >
                      {rankNum}
                    </span>
                    <span
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "var(--ads-ink)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {driver.name}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 650,
                        color: "var(--ads-ink)",
                        letterSpacing: "-0.022em",
                      }}
                    >
                      {scoreOutOf100}
                    </span>

                    <span
                      style={{
                        fontSize: "0.725rem",
                        fontWeight: 600,
                        padding: "0.18rem 0.6rem",
                        borderRadius: "var(--ads-r-pill)",
                        backgroundColor: ratingInfo.bg,
                        color: ratingInfo.color,
                        border: "1px solid transparent",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {ratingInfo.label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="uop-card-footer" style={{ marginTop: "auto" }}>
        <span style={{ fontSize: "0.6875rem", color: "var(--ads-ink-tertiary)" }}>
          Scale: 0 - 100
        </span>
        <span
          className="uop-card-link-hint"
          onClick={() => navigate("/performance/reports?report=driver_rating_report")}
          style={{ cursor: "pointer" }}
        >
          <span>Leaderboard</span>
          <ChevronRight size={13} />
        </span>
      </div>
    </div>
  );
};

export default DriverPerformanceRankingCard;
