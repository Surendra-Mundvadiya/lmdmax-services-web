import React, { FC, useState, useRef, useEffect } from "react";
import { X, Send, MessageSquare, AlertCircle } from "lucide-react";
import { notesTasksApi, type TaskItem, type TaskComment } from "../../../api/notesTasksApi";
import { useAuthStore } from "../../../store/authStore";
import { getAvatarColor, getInitials } from "../../../utils/avatarUtils";

interface TaskCommentsModalProps {
  isOpen: boolean;
  task: TaskItem | null;
  onClose: () => void;
  onCommentAdded: (taskId: string | number, newComment: TaskComment) => void;
}

export const TaskCommentsModal: FC<TaskCommentsModalProps> = ({
  isOpen,
  task,
  onClose,
  onCommentAdded,
}) => {
  const currentUser = useAuthStore((state) => state.user);
  const [commentText, setCommentText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCommentText("");
      setError(null);
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [isOpen, task]);

  if (!isOpen || !task) return null;

  const comments = task.comments || [];

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setIsSending(true);
      setError(null);
      const taggedUser = task.tagged || currentUser?.name || "User";
      await notesTasksApi.addTaskComment({
        tag_id: task.tag_id,
        comment: commentText.trim(),
        tagged: taggedUser,
      });

      const newCommentObj: TaskComment = {
        comment: commentText.trim(),
        tagged: taggedUser,
        created_by: currentUser?.name || currentUser?.email || "You",
        created_at: new Date().toISOString(),
      };

      onCommentAdded(task.tag_id, newCommentObj);
      setCommentText("");
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    } catch (err: any) {
      setError(err?.message || "Failed to post comment");
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      className="tasks-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSending) onClose();
      }}
    >
      <div className="tasks-modal-card" style={{ height: "550px", maxWidth: "520px" }}>
        {/* Header */}
        <div className="tasks-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "var(--ads-r-xs)",
                backgroundColor: "var(--ads-blue-tint)",
                color: "var(--ads-blue)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MessageSquare size={15} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <h2 className="tasks-modal-title">Task Discussion</h2>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--ads-blue)" }}>
                  #{task.tag_id}
                </span>
              </div>
              <div
                style={{
                  fontSize: "0.725rem",
                  color: "var(--ads-ink-tertiary)",
                  maxWidth: "360px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {task.tag_message}
              </div>
            </div>
          </div>
          <button aria-label="Close" title="Close"
            type="button"
            onClick={onClose}
            disabled={isSending}
            className="tasks-modal-close-btn"
          >
            <X size={16} />
          </button>
        </div>

        {/* Comment Thread Body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1rem 1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            backgroundColor: "rgba(0, 0, 0, 0.025)",
          }}
        >
          {error && (
            <div
              style={{
                padding: "0.6rem 0.85rem",
                backgroundColor: "var(--ads-red-tint)",
                border: "1px solid transparent",
                borderRadius: "var(--ads-r-sm)",
                color: "var(--ads-red)",
                fontSize: "0.775rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {comments.length > 0 ? (
            comments.map((c, i) => {
              const authorName = c.created_by || "User";
              const isMe =
                currentUser &&
                (authorName === currentUser.name || authorName === currentUser.email || authorName === "You");

              return (
                <div
                  key={c._id || i}
                  style={{
                    display: "flex",
                    gap: "0.6rem",
                    alignItems: "flex-start",
                  }}
                >
                  <span
                    className="task-avatar"
                    style={{
                      backgroundColor: getAvatarColor(authorName),
                      width: 26,
                      height: 26,
                      fontSize: "0.7rem",
                      marginTop: 2,
                    }}
                  >
                    {getInitials(authorName)}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      backgroundColor: isMe ? "var(--ads-blue-tint)" : "#FFFFFF",
                      border: isMe ? "1px solid transparent" : "1px solid var(--ads-hairline)",
                      borderRadius: "var(--ads-r-sm)",
                      padding: "0.6rem 0.8rem",
                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.02)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "0.2rem",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: isMe ? "var(--ads-blue)" : "var(--ads-ink)",
                        }}
                      >
                        {authorName}
                      </span>
                      {c.created_at && (
                        <span style={{ fontSize: "0.675rem", color: "var(--ads-ink-tertiary)" }}>
                          {formatDate(c.created_at)}
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.8rem",
                        color: "var(--ads-ink-secondary)",
                        lineHeight: 1.4,
                        wordBreak: "break-word",
                      }}
                    >
                      {c.comment}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div
              style={{
                margin: "auto",
                textAlign: "center",
                color: "var(--ads-ink-tertiary)",
                fontSize: "0.8rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <MessageSquare size={32} style={{ color: "var(--ads-ink-quaternary)" }} />
              <span>No comments yet. Post the first update below.</span>
            </div>
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSendComment}
          style={{
            padding: "0.75rem 1.25rem",
            backgroundColor: "var(--ads-material-thick)",
            borderTop: "1px solid var(--ads-hairline)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <input
            type="text"
            placeholder="Type your message..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            disabled={isSending}
            className="tasks-form-input"
            style={{ flex: 1, padding: "0.5rem 0.75rem", fontSize: "0.8125rem" }}
            autoFocus
          />
          {/* Rule 3: Blue button with pure white text */}
          <button
            type="submit"
            disabled={isSending || !commentText.trim()}
            className="btn-add-task"
            style={{ padding: "0.5rem 0.85rem", height: 38 }}
            title="Send Comment"
            aria-label="Send Comment"
          >
            <Send size={14} style={{ color: "#FFFFFF" }} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default TaskCommentsModal;
