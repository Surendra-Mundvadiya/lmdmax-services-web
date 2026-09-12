import React, { FC, useRef, useEffect } from "react";
import {
  Pin,
  RefreshCw,
  ChevronLeft,
  Check,
  CheckCheck,
  AlertCircle,
  FileText,
  MessageSquare,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { ChatThreadItem, ChatMessageItem, ChatChannelType } from "../../api/chatsApi";
import { getAvatarColor, getInitials } from "../../utils/avatarUtils";
import ChatMessageComposer from "./ChatMessageComposer";

interface ChatConversationViewProps {
  activeThread: ChatThreadItem | null;
  messages: ChatMessageItem[];
  loadingMessages: boolean;
  onSendMessage: (message: string, file?: File | null) => Promise<boolean>;
  sending: boolean;
  onTogglePin: () => void;
  onRefresh: () => void;
  onBackToList: () => void;
  channelType: ChatChannelType;
}

export const ChatConversationView: FC<ChatConversationViewProps> = ({
  activeThread,
  messages,
  loadingMessages,
  onSendMessage,
  sending,
  onTogglePin,
  onRefresh,
  onBackToList,
  channelType,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loadingMessages]);

  if (!activeThread) {
    return (
      <div className="chat-no-thread-selected">
        <div style={{ maxWidth: "420px", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "var(--ads-blue-tint)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--ads-blue)",
            }}
          >
            <MessageSquare size={32} />
          </div>
          <div>
            <h3
              style={{
                fontSize: "1.375rem",
                fontWeight: 650,
                letterSpacing: "-0.019em",
                color: "var(--ads-ink)",
                marginBottom: "var(--ads-s2)",
              }}
            >
              Select a Conversation
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--ads-ink-secondary)", lineHeight: 1.5 }}>
              Choose a driver or inquiry thread from the left list to view chat history and send live dispatch messages.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const avatarBg = getAvatarColor(activeThread.name, "driver");
  const initials = getInitials(activeThread.name);

  // Group messages by date
  const groupedMessages: { [dateStr: string]: ChatMessageItem[] } = {};
  messages.forEach((msg) => {
    const rawDate = msg.created_at || msg.timestamp || new Date().toISOString();
    let dateKey = "Recent";
    try {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        const today = new Date();
        if (
          d.getDate() === today.getDate() &&
          d.getMonth() === today.getMonth() &&
          d.getFullYear() === today.getFullYear()
        ) {
          dateKey = "Today";
        } else {
          dateKey = d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
        }
      }
    } catch {
      // fallback
    }
    if (!groupedMessages[dateKey]) {
      groupedMessages[dateKey] = [];
    }
    groupedMessages[dateKey].push(msg);
  });

  const formatMsgTime = (timestamp?: string) => {
    if (!timestamp) return "";
    try {
      const d = new Date(timestamp);
      if (isNaN(d.getTime())) return timestamp;
      return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="chat-main-pane">
      {/* Top Header */}
      <div
        style={{
          padding: "var(--ads-s3) var(--ads-s5)",
          borderBottom: "1px solid var(--ads-hairline)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "var(--ads-s3)",
          background: "var(--ads-material-thin)",
          backdropFilter: "var(--ads-blur-lg)",
          WebkitBackdropFilter: "var(--ads-blur-lg)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
          {/* Mobile Back Button */}
          <button
            type="button"
            className="chat-header-btn chat-mobile-back-btn"
            onClick={onBackToList}
            aria-label="Back to conversations list"
            title="Back to conversations list"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Squircle Avatar */}
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "var(--ads-r-sm)",
              backgroundColor: avatarBg,
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.875rem",
              fontWeight: 700,
              flexShrink: 0,
              boxShadow: "var(--ads-shadow-xs)",
            }}
          >
            {initials}
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.0625rem",
                  fontWeight: 600,
                  color: "var(--ads-ink)",
                  letterSpacing: "-0.014em",
                }}
              >
                {activeThread.name}
              </h2>
              <span
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  padding: "3px 9px",
                  borderRadius: "var(--ads-r-pill)",
                  background: "var(--ads-green-tint)",
                  color: "var(--ads-green)",
                  border: "1px solid transparent",
                }}
              >
                {activeThread.status || "Active"}
              </span>
              <span
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  padding: "3px 9px",
                  borderRadius: "var(--ads-r-pill)",
                  background: "var(--ads-blue-tint)",
                  color: "#0058B0",
                  border: "1px solid transparent",
                }}
              >
                {channelType.toUpperCase().replace("_", " ")}
              </span>
            </div>

            <div
              style={{
                fontSize: "0.775rem",
                color: "var(--ads-ink-tertiary)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginTop: "2px",
              }}
            >
              {activeThread.phone && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                  <Phone size={12} />
                  {activeThread.phone}
                </span>
              )}
              {activeThread.transporter_id && (
                <span>• Transporter: {activeThread.transporter_id}</span>
              )}
              {activeThread.station_code && (
                <span>• Station: {activeThread.station_code}</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            type="button"
            className={`chat-header-btn ${activeThread.is_pinned ? "pinned" : ""}`}
            onClick={onTogglePin}
            aria-label={activeThread.is_pinned ? "Unpin conversation" : "Pin conversation to top"}
            title={activeThread.is_pinned ? "Unpin conversation" : "Pin conversation to top"}
          >
            <Pin size={15} fill={activeThread.is_pinned ? "#B25000" : "none"} />
          </button>

          <button
            type="button"
            className="chat-header-btn"
            onClick={onRefresh}
            aria-label="Refresh messages feed"
            title="Refresh messages feed"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Messages Scroll Feed */}
      <div className="chat-messages-scroll">
        {loadingMessages ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "2rem", color: "var(--ads-ink-tertiary)" }}>
            Loading message thread...
          </div>
        ) : Object.keys(groupedMessages).length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--ads-ink-tertiary)" }}>
            <MessageSquare size={36} color="#86868B" style={{ margin: "0 auto 0.75rem auto" }} />
            <div style={{ fontWeight: 600, color: "var(--ads-ink)" }}>No messages yet</div>
            <div style={{ fontSize: "0.8125rem", color: "var(--ads-ink-tertiary)", marginTop: "0.25rem" }}>
              Send an SMS or dispatch notification below to start communicating with {activeThread.name}.
            </div>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([dateLabel, msgs]) => (
            <React.Fragment key={dateLabel}>
              {/* Date Separator */}
              <div className="chat-date-separator">
                <span className="chat-date-pill">{dateLabel}</span>
              </div>

              {/* Messages */}
              {msgs.map((msg) => {
                const isDispatcher = msg.sender_type === "dispatcher" || !msg.is_driver;

                return (
                  <div
                    key={msg.id || msg._id}
                    className={`chat-message-row ${isDispatcher ? "outgoing" : "incoming"}`}
                  >
                    {!isDispatcher && (
                      <div
                        className="chat-avatar"
                        style={{
                          backgroundColor: avatarBg,
                          width: "30px",
                          height: "30px",
                          borderRadius: "var(--ads-r-xs)",
                          fontSize: "0.75rem",
                          flexShrink: 0,
                        }}
                      >
                        {initials}
                      </div>
                    )}

                    <div className={`chat-bubble ${isDispatcher ? "outgoing" : "incoming"}`}>
                      {/* Message Content */}
                      <div style={{ whiteSpace: "pre-wrap" }}>{msg.message}</div>

                      {/* Attachments */}
                      {msg.attachments &&
                        Array.isArray(msg.attachments) &&
                        msg.attachments.map((att: any, idx: number) => {
                          const url = typeof att === "string" ? att : att?.url;
                          if (!url) return null;
                          const isImg = /\.(jpeg|jpg|gif|png|webp)/i.test(url);

                          return (
                            <div key={idx} className="chat-attachment-card">
                              {isImg ? (
                                <a href={url} target="_blank" rel="noreferrer">
                                  <img src={url} alt="Attachment" className="chat-attachment-img" />
                                </a>
                              ) : (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.4rem",
                                    color: isDispatcher ? "#FFFFFF" : "var(--ads-blue)",
                                    fontSize: "0.75rem",
                                    textDecoration: "underline",
                                  }}
                                >
                                  <FileText size={14} />
                                  View Document
                                </a>
                              )}
                            </div>
                          );
                        })}

                      {/* Footer: Time & Status */}
                      <div className="chat-bubble-footer">
                        <span>{formatMsgTime(msg.created_at || msg.timestamp)}</span>

                        {isDispatcher && (
                          <span>
                            {msg.status === "failed" || msg.error_message ? (
                              <span
                                style={{ color: "#FFD5D9", display: "inline-flex", alignItems: "center", gap: "2px" }}
                                title={msg.error_message || "Delivery failed"}
                              >
                                <AlertCircle size={12} />
                                Failed
                              </span>
                            ) : msg.status === "read" ? (
                              <CheckCheck size={13} style={{ color: "#FFFFFF" }} />
                            ) : (
                              <Check size={13} style={{ color: "rgba(255,255,255,0.75)" }} />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Message Composer */}
      <ChatMessageComposer
        activeThread={activeThread}
        onSendMessage={onSendMessage}
        sending={sending}
        channelType={channelType}
      />
    </div>
  );
};

export default ChatConversationView;
