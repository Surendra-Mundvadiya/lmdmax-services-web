import React, { FC } from "react";
import { Search, X, Radio, Pin, Paperclip, MessageSquare } from "lucide-react";
import { ChatThreadItem, ChatChannelType } from "../../api/chatsApi";
import { getAvatarColor, getInitials } from "../../utils/avatarUtils";

interface ChatThreadListProps {
  threads: ChatThreadItem[];
  activeThread: ChatThreadItem | null;
  onSelectThread: (thread: ChatThreadItem) => void;
  activeChannel: ChatChannelType;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilter: "all" | "unread" | "pinned" | "broadcast";
  onFilterChange: (filter: "all" | "unread" | "pinned" | "broadcast") => void;
  onOpenBroadcastModal: () => void;
  loading: boolean;
}

export const ChatThreadList: FC<ChatThreadListProps> = ({
  threads,
  activeThread,
  onSelectThread,
  activeChannel,
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  onOpenBroadcastModal,
  loading,
}) => {
  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return "";
    try {
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) return timeStr;

      const now = new Date();
      const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

      if (isToday) {
        return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      }

      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return date.toLocaleDateString([], { weekday: "short" });
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
      return timeStr;
    }
  };

  const filteredThreads = threads.filter((t) => {
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = t.name.toLowerCase().includes(q);
      const matchPhone = t.phone?.toLowerCase().includes(q);
      const matchMsg = t.message?.toLowerCase().includes(q);
      const matchTransporter = t.transporter_id?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchMsg && !matchTransporter) return false;
    }

    // Tab filter
    if (activeFilter === "unread") return t.unread_count > 0;
    if (activeFilter === "pinned") return t.is_pinned;
    if (activeFilter === "broadcast") return t.type === "broadcast";
    return true;
  });

  return (
    <div className="chat-thread-list-wrapper" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Search and Broadcast Controls */}
      <div className="chat-sidebar-header">
        <div className="chat-search-row">
          <div className="chat-search-input-wrap">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              className="chat-search-input"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchQuery && (
              <button
                className="chat-search-clear-btn"
                onClick={() => onSearchChange("")}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {(activeChannel === "sms" || activeChannel === "secondary_sms") && (
            <button
              className="chat-btn-broadcast"
              onClick={onOpenBroadcastModal}
              title="Broadcast SMS announcement to multiple drivers"
            >
              <Radio size={14} />
              <span>Broadcast</span>
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="chat-filter-pills" role="tablist">
          <button
            className={`chat-filter-pill ${activeFilter === "all" ? "active" : ""}`}
            onClick={() => onFilterChange("all")}
          >
            All
          </button>
          <button
            className={`chat-filter-pill ${activeFilter === "unread" ? "active" : ""}`}
            onClick={() => onFilterChange("unread")}
          >
            Unread
          </button>
          <button
            className={`chat-filter-pill ${activeFilter === "pinned" ? "active" : ""}`}
            onClick={() => onFilterChange("pinned")}
          >
            Pinned
          </button>
          <button
            className={`chat-filter-pill ${activeFilter === "broadcast" ? "active" : ""}`}
            onClick={() => onFilterChange("broadcast")}
          >
            Broadcasts
          </button>
        </div>
      </div>

      {/* Threads List */}
      <div className="chat-thread-list">
        {loading ? (
          <div style={{ padding: "2rem 1rem", textAlign: "center", color: "#64748B", fontSize: "0.85rem" }}>
            Loading conversations...
          </div>
        ) : filteredThreads.length === 0 ? (
          <div className="chat-empty-threads">
            <MessageSquare size={32} color="#94A3B8" />
            <div style={{ fontWeight: 600, color: "#1E293B", fontSize: "0.875rem" }}>
              {searchQuery ? "No matching conversations" : "No conversation threads"}
            </div>
            <div style={{ fontSize: "0.775rem", color: "#94A3B8" }}>
              {searchQuery
                ? "Try searching with a different driver name or phone number."
                : "Real-time messages will appear here once received or sent."}
            </div>
          </div>
        ) : (
          filteredThreads.map((thread) => {
            const isSelected = activeThread?.id === thread.id;
            const avatarBg = getAvatarColor(thread.name, "driver");
            const initials = getInitials(thread.name);

            return (
              <div
                key={`${thread.channel}-${thread.id}`}
                className={`chat-thread-item ${isSelected ? "active" : ""}`}
                onClick={() => onSelectThread(thread)}
              >
                {/* Driver Avatar */}
                <div
                  className="chat-avatar"
                  style={{ backgroundColor: avatarBg }}
                  title={thread.name}
                >
                  {initials}
                </div>

                {/* Content */}
                <div className="chat-thread-content">
                  <div className="chat-thread-top">
                    <span className="chat-thread-name">{thread.name}</span>
                    <span className="chat-thread-time">{formatTime(thread.message_time)}</span>
                  </div>


                  <div className="chat-thread-meta-row">
                    <span className="chat-thread-message-snippet">
                      {thread.attachments && thread.attachments.length > 0 && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", marginRight: "4px", color: "#2563EB" }}>
                          <Paperclip size={11} />
                          [Attachment]
                        </span>
                      )}
                      {thread.message || "No messages yet"}
                    </span>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      {thread.is_pinned && (
                        <span className="chat-pin-icon" title="Pinned conversation">
                          <Pin size={12} fill="#F59E0B" />
                        </span>
                      )}
                      {thread.unread_count > 0 && (
                        <span className="chat-unread-badge">
                          {thread.unread_count > 99 ? "99+" : thread.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatThreadList;
