import React, { FC, useEffect } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Info,
  Building,
  Clock,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import GlassAppLayout from "../layout/GlassAppLayout";
import { useNotificationStore } from "../../store/notificationStore";

export const NotificationsPage: FC = () => {
  const notifications = useNotificationStore((state) => state.notifications);
  const filterCategory = useNotificationStore((state) => state.filterCategory);
  const setFilterCategory = useNotificationStore((state) => state.setFilterCategory);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const deleteNotification = useNotificationStore((state) => state.deleteNotification);
  const clearAll = useNotificationStore((state) => state.clearAll);
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
  const isLoading = useNotificationStore((state) => state.isLoading);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filtered = notifications.filter((n) => {
    if (filterCategory === "unread") return !n.read;
    if (filterCategory === "all") return true;
    return n.category === filterCategory;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "alert":
        return <AlertTriangle size={16} style={{ color: "var(--ads-red)" }} />;
      case "warning":
        return <AlertTriangle size={16} style={{ color: "var(--ads-amber)" }} />;
      case "success":
        return <CheckCircle2 size={16} style={{ color: "var(--ads-green)" }} />;
      default:
        return <Info size={16} style={{ color: "var(--ads-blue)" }} />;
    }
  };

  return (
    <GlassAppLayout
      currentRoute="notifications"
      activeBreadcrumb={{ section: "Activity", page: "Notifications" }}
    >

      <div className="operations-main-content">
        <div className="notifications-page-card">
          {/* Header */}
          <div className="notifications-page-header">
            <div className="flex items-center gap-2.5" style={{ display: "flex", alignItems: "center", gap: "var(--ads-s3)" }}>
              <div
                className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "var(--ads-r-sm)",
                  background: "var(--ads-blue-tint)",
                  color: "var(--ads-blue)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Bell size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2" style={{ display: "flex", alignItems: "center", gap: "var(--ads-s2)" }}>
                  <h2
                    className="text-lg font-bold text-slate-900 m-0"
                    style={{
                      margin: 0,
                      fontSize: "1.0625rem",
                      fontWeight: 600,
                      letterSpacing: "-0.014em",
                      color: "var(--ads-ink)",
                    }}
                  >
                    Notifications & Operational Alerts
                  </h2>
                  {unreadCount > 0 && (
                    <span className="notif-badge-count">{unreadCount} unread</span>
                  )}
                </div>
                <p
                  className="text-xs text-slate-500 mt-0.5"
                  style={{
                    margin: "2px 0 0",
                    fontSize: "0.75rem",
                    lineHeight: 1.4,
                    color: "var(--ads-ink-tertiary)",
                  }}
                >
                  Real-time RTS checkout, DVIC inspections, driver safety, and system events.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.85rem", alignItems: "center" }}>
              <button
                type="button"
                className="btn-outline-cancel text-xs flex items-center gap-1.5"
                onClick={() => fetchNotifications()}
                disabled={isLoading}
                title="Refresh notifications"
              >
                <RefreshCw size={13} className={isLoading ? "spin" : ""} />
                <span>Refresh</span>
              </button>
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="btn-outline-cancel text-xs flex items-center gap-1.5"
                  onClick={markAllAsRead}
                >
                  <CheckCheck size={14} />
                  <span>Mark All as Read</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  className="btn-outline-cancel text-xs flex items-center gap-1.5"
                  onClick={clearAll}
                  style={{ color: "var(--ads-red)" }}
                >
                  <Trash2 size={14} />
                  <span>Clear All</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="notifications-filter-bar">
            <button
              type="button"
              className={`notif-filter-pill ${filterCategory === "all" ? "active" : ""}`}
              onClick={() => setFilterCategory("all")}
            >
              All Notifications ({notifications.length})
            </button>
            <button
              type="button"
              className={`notif-filter-pill ${filterCategory === "unread" ? "active" : ""}`}
              onClick={() => setFilterCategory("unread")}
            >
              Unread ({unreadCount})
            </button>
            <button
              type="button"
              className={`notif-filter-pill ${filterCategory === "checkout" ? "active" : ""}`}
              onClick={() => setFilterCategory("checkout")}
            >
              RTS Checkout
            </button>
            <button
              type="button"
              className={`notif-filter-pill ${filterCategory === "dvic" ? "active" : ""}`}
              onClick={() => setFilterCategory("dvic")}
            >
              DVIC & Inspections
            </button>
            <button
              type="button"
              className={`notif-filter-pill ${filterCategory === "dispatch" ? "active" : ""}`}
              onClick={() => setFilterCategory("dispatch")}
            >
              Dispatch & Drivers
            </button>
            <button
              type="button"
              className={`notif-filter-pill ${filterCategory === "system" ? "active" : ""}`}
              onClick={() => setFilterCategory("system")}
            >
              System Alerts
            </button>
          </div>

          {/* Notifications List */}
          {filtered.length === 0 ? (
            <div className="driver-table-empty-state" style={{ padding: "3.5rem 1rem" }}>
              <div className="empty-state-icon-box">
                <Bell size={28} style={{ color: "var(--ads-blue)" }} />
              </div>
              <h4 className="empty-state-heading">No Notifications</h4>
              <p className="empty-state-desc">
                You're all caught up! There are no alerts in this category right now.
              </p>
            </div>
          ) : (
            <div className="notifications-list-wrap">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className={`notification-item-card ${!item.read ? "unread" : ""}`}
                  onClick={() => !item.read && markAsRead(item.id)}
                >
                  <div className="notif-item-left">
                    <div className={`notif-icon-circle ${item.type}`}>
                      {getTypeIcon(item.type)}
                    </div>
                    <div className="notif-item-content">
                      <div className="flex items-center gap-2">
                        <span className="notif-item-title">{item.title}</span>
                        {!item.read && <span className="notif-unread-dot" />}
                        {item.station_code && (
                          <span
                            className="station-code-chip"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "3px 9px",
                              borderRadius: "var(--ads-r-pill)",
                              background: "var(--ads-blue-tint)",
                              color: "#0058B0",
                              fontSize: "0.6875rem",
                              fontWeight: 600,
                              letterSpacing: "-0.005em",
                            }}
                          >
                            {item.station_code}
                          </span>
                        )}
                      </div>
                      <p className="notif-item-message">{item.message}</p>
                      <div className="notif-item-meta">
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {item.timestamp}
                        </span>
                        <span className="text-slate-300">&bull;</span>
                        <span className="capitalize text-slate-500 font-medium">
                          {item.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="notif-item-right" style={{ display: "flex", gap: "0.85rem", alignItems: "center" }}>
                    {item.action_label && (
                      <button
                        type="button"
                        className="btn-blue-outline btn-sm text-xs flex items-center gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(item.id);
                        }}
                      >
                        <span>{item.action_label}</span>
                        <ExternalLink size={12} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-action-icon text-slate-400 hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(item.id);
                      }}
                      aria-label={`Delete notification: ${item.title}`}
                      title="Delete notification"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "30px",
                        height: "30px",
                        borderRadius: "var(--ads-r-xs)",
                        border: "1px solid transparent",
                        background: "transparent",
                        color: "var(--ads-ink-tertiary)",
                        cursor: "pointer",
                        flexShrink: 0,
                        transition:
                          "background-color var(--ads-dur-fast) var(--ads-ease), color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "var(--ads-red)";
                        e.currentTarget.style.background = "var(--ads-red-tint)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--ads-ink-tertiary)";
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </GlassAppLayout>
  );
};

export default NotificationsPage;
