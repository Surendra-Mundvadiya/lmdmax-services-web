import React, { FC, useState, useRef, useEffect } from "react";
import { Send, Paperclip, X, FileText, Loader2, Smile, FileCode2 } from "lucide-react";
import { ChatThreadItem } from "../../api/chatsApi";
import { templatesApi, TemplateItem } from "../../api/templatesApi";

interface ChatMessageComposerProps {
  activeThread: ChatThreadItem | null;
  onSendMessage: (message: string, file?: File | null) => Promise<boolean>;
  sending: boolean;
  channelType: string;
}

const COMMON_EMOJIS = ["👍", "✅", "⚠️", "🚗", "📦", "📍", "🕐", "😊", "🙏", "👋", "🔄", "❗"];

export const ChatMessageComposer: FC<ChatMessageComposerProps> = ({
  activeThread,
  onSendMessage,
  sending,
  channelType,
}) => {
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [liveTemplates, setLiveTemplates] = useState<TemplateItem[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const templateRef = useRef<HTMLDivElement>(null);

  // Auto-focus on active thread change
  useEffect(() => {
    setText("");
    setSelectedFile(null);
    setShowEmojiPicker(false);
    setShowTemplatePicker(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [activeThread?.id]);

  // Close popovers on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (templateRef.current && !templateRef.current.contains(e.target as Node)) {
        setShowTemplatePicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (showTemplatePicker && liveTemplates.length === 0) {
      setLoadingTemplates(true);
      templatesApi
        .getTemplates()
        .then((data) => setLiveTemplates(data.filter((t) => t.status === "active")))
        .catch(() => setLiveTemplates([]))
        .finally(() => setLoadingTemplates(false));
    }
  }, [showTemplatePicker, liveTemplates.length]);

  const handleInsertEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleApplyTemplate = (templateText: string, isHtml: boolean = false) => {
    const driverName = activeThread?.name || "Driver";
    let plain = templateText;
    if (isHtml) {
      const doc = new DOMParser().parseFromString(templateText, "text/html");
      plain = doc.body.textContent || "";
    }
    const replaced = plain
      .replace(/\$\{name\}/g, driverName)
      .replace(/\{driver_name\}/g, driverName)
      .replace(/\{name\}/g, driverName);
    setText((prev) => (prev ? `${prev}\n${replaced}` : replaced));
    setShowTemplatePicker(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert("File size exceeds 5MB limit. Please select a smaller file.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if ((!trimmed && !selectedFile) || sending) return;

    const success = await onSendMessage(trimmed, selectedFile);
    if (success) {
      setText("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // GSM Calculation (160 characters per SMS segment)
  const isSMS = channelType === "sms" || channelType === "secondary_sms";
  const charLength = text.length;
  const segments = isSMS ? Math.max(1, Math.ceil(charLength / 160)) : 1;

  return (
    <div className="chat-composer-box">

      {/* Selected File Chip */}
      {selectedFile && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div className="chat-file-preview-chip">
            <FileText size={13} />
            <span style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
            </span>
            <button
              type="button"
              onClick={handleRemoveFile}
              style={{ background: "none", border: "none", color: "#1D4ED8", cursor: "pointer", display: "flex", padding: 0 }}
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Input Row */}
      <div className="chat-composer-input-row">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: "none" }}
          accept="image/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileChange}
        />

        {/* Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="chat-header-btn chat-composer-icon-btn"
          title="Attach image or document (max 5MB)"
        >
          <Paperclip size={17} />
        </button>

        {/* Emoji Button + Popover */}
        <div className="chat-composer-popover-wrap" ref={emojiRef}>
          <button
            type="button"
            className={`chat-header-btn chat-composer-icon-btn${showEmojiPicker ? " active" : ""}`}
            title="Insert emoji"
            onClick={() => {
              setShowEmojiPicker((v) => !v);
              setShowTemplatePicker(false);
            }}
          >
            <Smile size={17} />
          </button>
          {showEmojiPicker && (
            <div className="chat-composer-popover emoji-popover">
              {COMMON_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  className="emoji-pick-btn"
                  onClick={() => handleInsertEmoji(em)}
                  title={em}
                >
                  {em}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Template Button + Popover */}
        <div className="chat-composer-popover-wrap" ref={templateRef}>
          <button
            type="button"
            className={`chat-header-btn chat-composer-icon-btn${showTemplatePicker ? " active" : ""}`}
            title="Insert message template"
            onClick={() => {
              setShowTemplatePicker((v) => !v);
              setShowEmojiPicker(false);
            }}
          >
            <FileCode2 size={17} />
          </button>
          {showTemplatePicker && (
            <div className="chat-composer-popover template-popover">
              <div className="template-popover-header">Communication Templates</div>
              {loadingTemplates ? (
                <div style={{ padding: "0.85rem", textAlign: "center", fontSize: "0.75rem", color: "#64748B" }}>
                  Loading templates...
                </div>
              ) : liveTemplates.length > 0 ? (
                liveTemplates.map((tmpl) => (
                  <button
                    key={tmpl._id}
                    type="button"
                    className="template-pick-btn"
                    onClick={() => handleApplyTemplate(tmpl.text, tmpl.type === "custom_template")}
                    title={tmpl.text}
                  >
                    <strong>{tmpl.title}</strong>
                    <span>
                      {(tmpl.type === "custom_template"
                        ? new DOMParser().parseFromString(tmpl.text, "text/html").body.textContent || ""
                        : tmpl.text
                      )
                        .replace(/\$\{name\}/g, activeThread?.name || "Driver")
                        .replace(/\{driver_name\}/g, activeThread?.name || "Driver")
                        .slice(0, 95)}
                    </span>
                  </button>
                ))
              ) : (
                <div style={{ padding: "0.85rem", textAlign: "center", fontSize: "0.8rem", color: "#64748B" }}>
                  No active templates found. Manage them in See More &gt; Templates.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          className="chat-composer-textarea"
          placeholder={`Type a message to ${activeThread?.name || "recipient"}... (Press Enter to send, Shift+Enter for new line)`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />

        {/* Send Button */}
        <button
          type="button"
          className="chat-composer-send-btn"
          onClick={handleSubmit}
          disabled={(!text.trim() && !selectedFile) || sending}
          title="Send message (Enter)"
        >
          {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>

      {/* GSM counter — only visible once user starts typing */}
      {isSMS && charLength > 0 && (
        <div className="chat-gsm-counter">
          <span>
            {charLength} / {segments * 160} ({segments} {segments === 1 ? "SMS" : "SMS segments"})
          </span>
        </div>
      )}
    </div>
  );
};

export default ChatMessageComposer;
