import React, { FC, useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Search,
  X,
  Radio,
  Pin,
  Loader2,
  MessageSquare,
  Paperclip,
} from "lucide-react";
import {
  ChatChannelType,
  ChatThreadItem,
  ChatMessageItem,
  chatsApi,
} from "../../api/chatsApi";
import ChatConversationView from "./ChatConversationView";
import CreateBroadcastModal from "./CreateBroadcastModal";
import { getInitials, getAvatarColor } from "../../utils/avatarUtils";

interface ChatsWorkspaceProps {
  initialChannel?: ChatChannelType;
  stationIds?: string[];
}

const CHANNELS: { id: ChatChannelType; label: string; shortLabel: string }[] = [
  { id: "sms",           label: "SMS Chat",       shortLabel: "SMS" },
  { id: "payroll",       label: "Payroll Chat",   shortLabel: "Payroll" },
  { id: "short_code",    label: "DSP Short Code", shortLabel: "DSP" },
  { id: "direct",        label: "Direct",         shortLabel: "Direct" },
  { id: "secondary_sms", label: "Secondary SMS",  shortLabel: "SMS 2" },
];

export const ChatsWorkspace: FC<ChatsWorkspaceProps> = ({
  initialChannel = "sms",
  stationIds,
}) => {
  const navigate = useNavigate();
  const [activeChannel, setActiveChannel] = useState<ChatChannelType>(initialChannel);
  const [threads, setThreads] = useState<ChatThreadItem[]>([]);
  const [activeThread, setActiveThread] = useState<ChatThreadItem | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loadingThreads, setLoadingThreads] = useState<boolean>(true);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "pinned" | "broadcast">("all");
  const [unreadCounts, setUnreadCounts] = useState<Partial<Record<ChatChannelType, number>>>({});
  const [isBroadcastOpen, setIsBroadcastOpen] = useState<boolean>(false);
  const [mobileShowChat, setMobileShowChat] = useState<boolean>(false);

  const currentChannelObj = useMemo(
    () => CHANNELS.find((c) => c.id === activeChannel) || CHANNELS[0],
    [activeChannel]
  );

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

  const loadThreads = useCallback(async () => {
    setLoadingThreads(true);
    try {
      let data: ChatThreadItem[] = [];
      if (activeChannel === "sms" || activeChannel === "secondary_sms") {
        data = await chatsApi.getSMSMessageHeads({
          station_ids: stationIds,
          keyword: searchQuery.trim() || undefined,
          filter: activeFilter === "all" ? undefined : activeFilter,
        });
      } else if (activeChannel === "payroll") {
        data = await chatsApi.getPayrollThreads();
      } else if (activeChannel === "short_code") {
        data = await chatsApi.getInAppRooms("company");
      } else if (activeChannel === "direct") {
        data = await chatsApi.getInAppRooms("individual");
      }
      setThreads(data);
      if (data.length > 0) {
        if (!activeThread || !data.some((t) => t.id === activeThread.id)) {
          setActiveThread(data[0]);
        }
      } else {
        setActiveThread(null);
        setMessages([]);
      }
    } catch {
      setThreads([]);
    } finally {
      setLoadingThreads(false);
    }
  }, [activeChannel, searchQuery, activeFilter, stationIds]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    chatsApi.getUnreadCount().then((count) => {
      setUnreadCounts((prev) => ({ ...prev, sms: count }));
    });
  }, [activeChannel]);

  const loadMessages = useCallback(async (thread: ChatThreadItem) => {
    setLoadingMessages(true);
    try {
      let msgs: ChatMessageItem[] = [];
      if (thread.channel === "sms" || thread.channel === "secondary_sms") {
        msgs = await chatsApi.getSMSMessages(thread.driver_id);
        chatsApi.markAsSeen(thread.driver_id);
      } else if (thread.channel === "short_code" || thread.channel === "direct") {
        msgs = await chatsApi.getInAppMessages(thread.id);
      } else if (thread.channel === "payroll") {
        msgs = await chatsApi.getSMSMessages(thread.driver_id);
      }
      setMessages(msgs);
      if (thread.unread_count > 0) {
        setThreads((prev) =>
          prev.map((t) => (t.id === thread.id ? { ...t, unread_count: 0 } : t))
        );
      }
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (activeThread) loadMessages(activeThread);
    else setMessages([]);
  }, [activeThread?.id, loadMessages]);

  const handleSelectChannel = (channel: ChatChannelType) => {
    if (channel === activeChannel) return;
    setActiveChannel(channel);
    setActiveThread(null);
    setMessages([]);
    setMobileShowChat(false);
  };

  const handleSelectThread = (thread: ChatThreadItem) => {
    setActiveThread(thread);
    setMobileShowChat(true);
  };

  const handleSendMessage = async (msgText: string, file?: File | null): Promise<boolean> => {
    if (!activeThread) return false;
    setSendingMessage(true);
    try {
      let success = false;
      if (activeThread.channel === "sms" || activeThread.channel === "secondary_sms") {
        success = await chatsApi.sendSMSMessage({
          to: activeThread.driver_id,
          message: msgText,
          attachment: file,
          station_ids: stationIds,
        });
      } else if (activeThread.channel === "short_code" || activeThread.channel === "direct") {
        success = await chatsApi.sendInAppMessage(activeThread.id, msgText);
      } else {
        success = await chatsApi.sendSMSMessage({
          to: activeThread.driver_id,
          message: msgText,
          attachment: file,
          station_ids: stationIds,
        });
      }
      if (success) {
        const tempMsg: ChatMessageItem = {
          _id: String(Date.now()),
          id: String(Date.now()),
          sender_type: "dispatcher",
          is_driver: false,
          sender_name: "Dispatcher",
          message: msgText,
          created_at: new Date().toISOString(),
          status: "delivered",
          attachments: file ? [URL.createObjectURL(file)] : [],
        };
        setMessages((prev) => [...prev, tempMsg]);
        setThreads((prev) =>
          prev.map((t) =>
            t.id === activeThread.id
              ? { ...t, message: msgText, message_time: new Date().toISOString() }
              : t
          )
        );
        loadMessages(activeThread);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setSendingMessage(false);
    }
  };

  const handleTogglePin = async () => {
    if (!activeThread) return;
    const newPinned = !activeThread.is_pinned;
    setActiveThread((prev) => (prev ? { ...prev, is_pinned: newPinned } : null));
    setThreads((prev) =>
      prev.map((t) => (t.id === activeThread.id ? { ...t, is_pinned: newPinned } : t))
    );
    if (activeThread.channel === "sms" || activeThread.channel === "secondary_sms") {
      await chatsApi.togglePinChat(activeThread.driver_id, newPinned);
    }
  };

  const filteredThreads = useMemo(() => {
    return threads.filter((t) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (t.name || "").toLowerCase().includes(q);
        const matchPhone = (t.phone || "").toLowerCase().includes(q);
        const matchMsg = (t.message || "").toLowerCase().includes(q);
        const matchTransporter = (t.transporter_id || "").toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchMsg && !matchTransporter) return false;
      }
      if (activeFilter === "unread") return t.unread_count > 0;
      if (activeFilter === "pinned") return t.is_pinned;
      if (activeFilter === "broadcast") return t.type === "broadcast";
      return true;
    });
  }, [threads, searchQuery, activeFilter]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        gap: "0.85rem",
      }}
    >
      {/* ── 1. Top Header Options on the Background Screen (No Second Header Card, No Top Search) ── */}
      <div className="upload-filter-toolbar">
        {/* Left: Breadcrumbs in the normal way on the background screen */}
        <div className="upload-breadcrumb-wrap">
          <span
            className="upload-breadcrumb-root"
            onClick={() => navigate("/dashboard")}
          >
            Communication
          </span>
          <ChevronRight size={14} style={{ color: "#64748B" }} />
          <span className="upload-breadcrumb-current">Chat</span>
          <ChevronRight size={14} style={{ color: "#64748B" }} />
          <span className="upload-breadcrumb-active-report">
            {currentChannelObj.label}
          </span>
          {activeThread && (
            <>
              <ChevronRight size={14} style={{ color: "#64748B" }} />
              <span
                style={{
                  fontSize: "0.8125rem",
                  color: "#1E293B",
                  fontWeight: 600,
                  maxWidth: "180px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {activeThread.name}
              </span>
            </>
          )}
        </div>

        {/* Right: View by Capsule & Broadcast Action */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <div className="upload-view-by-wrap">
            <span className="upload-view-by-label">View by</span>
            <div className="upload-segmented-capsule">
              {CHANNELS.map((ch) => {
                const isActive = activeChannel === ch.id;
                const unread = unreadCounts[ch.id] || 0;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => handleSelectChannel(ch.id)}
                    className={`upload-segmented-btn ${isActive ? "active" : ""}`}
                  >
                    <span>{ch.shortLabel}</span>
                    {unread > 0 ? (
                      <span
                        className="upload-segmented-count"
                        style={{
                          backgroundColor: isActive ? "rgba(255,255,255,0.3)" : "#EF4444",
                          color: "#FFFFFF",
                        }}
                      >
                        {unread > 99 ? "99+" : unread}
                      </span>
                    ) : (
                      <span className="upload-segmented-count">
                        {ch.id === activeChannel ? threads.length : 0}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {(activeChannel === "sms" || activeChannel === "secondary_sms") && (
            <button
              type="button"
              onClick={() => setIsBroadcastOpen(true)}
              className="upload-action-pill-btn"
              title="Broadcast SMS announcement to multiple drivers"
            >
              <Radio size={14} style={{ color: "#2563EB" }} />
              <span>Broadcast</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 2. Divided Screen: Left Catalog Sidebar + Right Workspace Container ── */}
      <div className="upload-split-layout">
        {/* Left: Chat Threads Catalog Sidebar */}
        <aside
          className={`upload-reports-sidebar ${mobileShowChat ? "mobile-hidden" : ""}`}
          style={{ width: "340px", flexShrink: 0 }}
        >
          {/* Sidebar Header: Title + Count Badge */}
          <div className="upload-sidebar-header">
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
              <span className="upload-sidebar-title">
                {currentChannelObj.label}
              </span>
            </div>
            <span className="upload-sidebar-badge">
              {filteredThreads.length} {filteredThreads.length === 1 ? "chat" : "chats"}
            </span>
          </div>

          {/* In-Sidebar Search & Sub-Filter Pills */}
          <div
            style={{
              padding: "0.65rem 0.85rem 0.5rem",
              borderBottom: "1px solid #F1F5F9",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
            }}
          >
            {/* Search Input */}
            <div style={{ position: "relative", width: "100%" }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: "0.65rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94A3B8",
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  height: "32px",
                  padding: "0 1.6rem 0 2rem",
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  fontSize: "0.78rem",
                  outline: "none",
                  backgroundColor: "#F8FAFC",
                  color: "#0F172A",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
                onBlur={(e) => (e.target.style.borderColor = "#CBD5E1")}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: "0.5rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#94A3B8",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Sub-Filters: All | Unread | Pinned */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              {(
                [
                  { id: "all" as const, label: "All" },
                  { id: "unread" as const, label: "Unread" },
                  { id: "pinned" as const, label: "Pinned" },
                ] as const
              ).map((f) => {
                const isFActive = activeFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setActiveFilter(f.id)}
                    style={{
                      padding: "0.22rem 0.6rem",
                      borderRadius: "6px",
                      border: isFActive ? "1px solid #BFDBFE" : "1px solid #E2E8F0",
                      backgroundColor: isFActive ? "#EFF6FF" : "#FFFFFF",
                      color: isFActive ? "#1D4ED8" : "#64748B",
                      fontSize: "0.72rem",
                      fontWeight: isFActive ? 700 : 500,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable Threads List */}
          <div className="upload-reports-list-scroll">
            {loadingThreads ? (
              <div
                style={{
                  padding: "2.5rem 1rem",
                  textAlign: "center",
                  color: "#64748B",
                  fontSize: "0.8125rem",
                }}
              >
                <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 0.5rem", color: "#2563EB" }} />
                <span>Loading conversations...</span>
              </div>
            ) : filteredThreads.length === 0 ? (
              <div
                style={{
                  padding: "2.5rem 1rem",
                  textAlign: "center",
                  color: "#64748B",
                  fontSize: "0.8125rem",
                }}
              >
                <MessageSquare size={32} style={{ margin: "0 auto 0.5rem", color: "#94A3B8" }} />
                <p style={{ margin: "0 0 0.25rem", fontWeight: 700, color: "#1E293B" }}>
                  {searchQuery ? "No matching conversations" : "No conversations"}
                </p>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "#94A3B8" }}>
                  {searchQuery ? "Try a different driver or phone number." : "Messages will appear here."}
                </p>
              </div>
            ) : (
              filteredThreads.map((t) => {
                const isSelected = activeThread?.id === t.id;
                const avatarBg = getAvatarColor(t.name, "driver");
                const initials = getInitials(t.name);
                return (
                  <button
                    key={`${t.channel}-${t.id}`}
                    type="button"
                    onClick={() => handleSelectThread(t)}
                    className={`upload-report-sidebar-item ${isSelected ? "active" : ""}`}
                    style={{
                      padding: "0.6rem 0.75rem",
                    }}
                  >
                    {isSelected && <span className="upload-item-indicator" />}

                    {/* Squircle Driver Avatar */}
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        backgroundColor: avatarBg,
                        color: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.8125rem",
                        fontWeight: 700,
                        flexShrink: 0,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      }}
                    >
                      {initials}
                    </div>

                    {/* Name + Message Preview */}
                    <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.4rem" }}>
                        <span
                          style={{
                            fontSize: "0.8125rem",
                            fontWeight: isSelected ? 700 : 600,
                            color: isSelected ? "#1D4ED8" : "#0F172A",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {t.name}
                        </span>
                        <span style={{ fontSize: "0.6875rem", color: "#94A3B8", flexShrink: 0 }}>
                          {formatTime(t.message_time)}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.4rem", marginTop: "2px" }}>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            color: isSelected ? "#3B82F6" : "#64748B",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            flex: 1,
                          }}
                        >
                          {t.attachments && t.attachments.length > 0 && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", marginRight: "4px", color: "#2563EB" }}>
                              <Paperclip size={11} />
                            </span>
                          )}
                          {t.message || "No messages yet"}
                        </span>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexShrink: 0 }}>
                          {t.is_pinned && <Pin size={11} fill="#F59E0B" color="#F59E0B" />}
                          {t.unread_count > 0 && (
                            <span
                              style={{
                                fontSize: "0.625rem",
                                fontWeight: 700,
                                padding: "0.08rem 0.4rem",
                                borderRadius: "9999px",
                                backgroundColor: "#2563EB",
                                color: "#FFFFFF",
                              }}
                            >
                              {t.unread_count > 99 ? "99+" : t.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <ChevronRight
                      size={14}
                      style={{
                        color: isSelected ? "#2563EB" : "#CBD5E1",
                        flexShrink: 0,
                      }}
                    />
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right: Conversation Workspace Container */}
        <section
          className={`upload-workspace-container ${!mobileShowChat ? "mobile-hidden" : ""}`}
          style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}
        >
          <ChatConversationView
            activeThread={activeThread}
            messages={messages}
            loadingMessages={loadingMessages}
            onSendMessage={handleSendMessage}
            sending={sendingMessage}
            onTogglePin={handleTogglePin}
            onRefresh={() => activeThread && loadMessages(activeThread)}
            onBackToList={() => setMobileShowChat(false)}
            channelType={activeChannel}
          />
        </section>
      </div>

      <CreateBroadcastModal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
        availableDrivers={threads}
        onBroadcastSuccess={loadThreads}
        stationIds={stationIds}
      />
    </div>
  );
};

export default ChatsWorkspace;
