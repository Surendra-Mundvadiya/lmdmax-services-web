import React, { FC, useState, useEffect } from "react";
import { X, ArrowLeft, Image as ImageIcon, Link2, Check, FileText } from "lucide-react";
import { ScorecardSendOptions } from "../../../../api/thresholdApi";

const ICON_BUTTON_STYLE: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "32px",
  height: "32px",
  border: "none",
  background: "transparent",
  borderRadius: "var(--ads-r-sm)",
  color: "var(--ads-ink-tertiary)",
  cursor: "pointer",
};

const LEGEND_DOT_STYLE: React.CSSProperties = {
  display: "inline-block",
  width: "10px",
  height: "10px",
  borderRadius: "50%",
  flexShrink: 0,
};

interface ScorecardSendOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOption: ScorecardSendOptions;
  currentTemplate?: string;
  onSave: (option: ScorecardSendOptions, template?: string) => Promise<void>;
}

const extractMessage = (template?: string) => {
  if (!template) {
    return "Please find your weekly performance scorecard details below.";
  }
  return template
    .replace(/Hi\s*\$\{driver_name\},?\s*/i, "")
    .replace(/\$\{link\}/i, "")
    .replace(/Thanks!?/i, "")
    .trim();
};

export const ScorecardSendOptionModal: FC<ScorecardSendOptionModalProps> = ({
  isOpen,
  onClose,
  currentOption,
  currentTemplate,
  onSave,
}) => {
  const [selected, setSelected] = useState<ScorecardSendOptions>(currentOption);
  const [step, setStep] = useState<1 | 2>(1);
  const [templateText, setTemplateText] = useState(extractMessage(currentTemplate));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelected(currentOption);
      setStep(1);
      setTemplateText(extractMessage(currentTemplate));
    }
  }, [isOpen, currentOption, currentTemplate]);

  if (!isOpen) return null;

  const handleSaveStep1 = async () => {
    if (selected === "scorecard_link") {
      setStep(2);
      return;
    }
    setIsSubmitting(true);
    try {
      await onSave(selected);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveStep2 = async () => {
    setIsSubmitting(true);
    try {
      const fullTemplate = `Hi \${driver_name},\n${templateText}\n\${link}\nThanks!`;
      await onSave(selected, fullTemplate);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="ads-scrim"
      style={{
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--ads-s5)",
      }}
    >
      <div
        className="ads-sheet"
        style={{
          maxWidth: "640px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--ads-s3)",
            padding: "var(--ads-s5) var(--ads-s6) var(--ads-s4)",
            borderBottom: "1px solid var(--ads-hairline)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s2)" }}>
            {step === 2 && (
              <button
                type="button"
                style={ICON_BUTTON_STYLE}
                onClick={() => setStep(1)}
                title="Go Back"
                aria-label="Go back to send options"
              >
                <ArrowLeft size={17} />
              </button>
            )}
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.0625rem",
                  fontWeight: 600,
                  letterSpacing: "-0.014em",
                  color: "var(--ads-ink)",
                }}
              >
                {step === 1 ? "Send Scorecard As" : "Confirm Scorecard Link Message"}
              </h3>
              <p
                style={{
                  margin: "var(--ads-s1) 0 0",
                  fontSize: "0.75rem",
                  color: "var(--ads-ink-tertiary)",
                }}
              >
                {step === 1
                  ? "Choose whether drivers receive an image or a web link"
                  : "Step 2 of 2: Message sent with the scorecard link"}
              </p>
            </div>
          </div>
          <button
            type="button"
            style={ICON_BUTTON_STYLE}
            onClick={onClose}
            title="Close"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: "var(--ads-s5) var(--ads-s6)", flex: 1 }}>
          {step === 1 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--ads-s4)" }}>
              {/* Option 1: Scorecard by (LMD) Image */}
              <div
                className={`send-option-card ${selected === "scorecard_lmd" ? "selected" : ""}`}
                onClick={() => setSelected("scorecard_lmd")}
              >
                <div className="send-option-icon lmd">
                  <ImageIcon size={22} style={{ color: "var(--ads-blue)" }} />
                </div>
                <div className="send-option-content">
                  <div className="send-option-title-row">
                    <span className="send-option-title">Scorecard by Image (LMD max)</span>
                    <span className="badge-custom blue">Recommended</span>
                  </div>
                  <p className="send-option-desc">
                    Colors for each metric can be decided by entering minimum and maximum
                    threshold ranges.
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "var(--ads-s2)",
                      marginTop: "var(--ads-s2)",
                      fontSize: "0.75rem",
                      color: "var(--ads-ink-tertiary)",
                    }}
                  >
                    <span style={{ ...LEGEND_DOT_STYLE, background: "var(--ads-green)" }} />
                    <span>Green (Good)</span>
                    <span style={{ ...LEGEND_DOT_STYLE, background: "var(--ads-amber)" }} />
                    <span>Orange (Neutral)</span>
                    <span style={{ ...LEGEND_DOT_STYLE, background: "var(--ads-red)" }} />
                    <span>Red (Bad)</span>
                  </div>
                </div>
                <div className="send-option-radio">
                  {selected === "scorecard_lmd" && <Check size={14} style={{ color: "#FFFFFF" }} />}
                </div>
              </div>

              {/* Option 2: Scorecard by Image (Generic) */}
              <div
                className={`send-option-card ${selected === "scorecard_image" ? "selected" : ""}`}
                onClick={() => setSelected("scorecard_image")}
              >
                <div className="send-option-icon generic">
                  <ImageIcon size={22} style={{ color: "var(--ads-purple)" }} />
                </div>
                <div className="send-option-content">
                  <span className="send-option-title">Scorecard by Image</span>
                  <p className="send-option-desc">
                    Colors are pre-decided for each metric based on Amazon performance tiers:
                    Platinum, Gold, Silver, and Bronze.
                  </p>
                </div>
                <div className="send-option-radio">
                  {selected === "scorecard_image" && <Check size={14} style={{ color: "#FFFFFF" }} />}
                </div>
              </div>

              {/* Option 3: Scorecard by Link */}
              <div
                className={`send-option-card ${selected === "scorecard_link" ? "selected" : ""}`}
                onClick={() => setSelected("scorecard_link")}
              >
                <div className="send-option-icon link">
                  <Link2 size={22} style={{ color: "var(--ads-green)" }} />
                </div>
                <div className="send-option-content">
                  <span className="send-option-title">Scorecard by Web Link</span>
                  <p className="send-option-desc">
                    The driver&apos;s data will be sent via an interactive mobile-optimized link
                    accompanied by a custom text message.
                  </p>
                </div>
                <div className="send-option-radio">
                  {selected === "scorecard_link" && <Check size={14} style={{ color: "#FFFFFF" }} />}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--ads-s4)" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "var(--ads-s2)",
                  padding: "var(--ads-s3) var(--ads-s4)",
                  fontSize: "0.75rem",
                  lineHeight: 1.5,
                  color: "var(--ads-ink-secondary)",
                  background: "var(--ads-blue-tint)",
                  borderRadius: "var(--ads-r-md)",
                }}
              >
                <FileText size={15} style={{ color: "var(--ads-blue)", flexShrink: 0, marginTop: "2px" }} />
                <span>
                  This notification message will accompany the personalized scorecard link sent
                  to each active driver.
                </span>
              </div>

              <div
                style={{
                  padding: "var(--ads-s4)",
                  background: "rgba(0, 0, 0, 0.025)",
                  border: "1px solid var(--ads-hairline)",
                  borderRadius: "var(--ads-r-md)",
                }}
              >
                <span className="ads-overline" style={{ display: "block", marginBottom: "var(--ads-s2)" }}>
                  Preview template
                </span>
                <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 550, color: "var(--ads-ink-secondary)" }}>
                  Hi [Driver Name],
                </p>
                <textarea
                  className="ads-textarea"
                  style={{
                    marginTop: "var(--ads-s2)",
                    padding: "var(--ads-s3)",
                    resize: "vertical",
                    minHeight: "100px",
                  }}
                  aria-label="Scorecard link message body"
                  value={templateText}
                  onChange={(e) => setTemplateText(e.target.value)}
                  placeholder="Enter message body here..."
                />
                <p
                  style={{
                    margin: "var(--ads-s2) 0 0",
                    fontSize: "0.75rem",
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    color: "var(--ads-blue)",
                  }}
                >
                  https://staging-viewer.prr.ai/scorecard-link
                </p>
                <p
                  style={{
                    margin: "var(--ads-s2) 0 0",
                    fontSize: "0.875rem",
                    fontWeight: 550,
                    color: "var(--ads-ink-secondary)",
                  }}
                >
                  Thanks!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "var(--ads-s3)",
            padding: "var(--ads-s4) var(--ads-s6) var(--ads-s5)",
            borderTop: "1px solid var(--ads-hairline)",
          }}
        >
          <button
            type="button"
            className="btn-outline-cancel"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-blue-primary"
            style={{ color: "#FFFFFF" }}
            onClick={step === 1 ? handleSaveStep1 : handleSaveStep2}
            disabled={isSubmitting}
          >
            <span style={{ color: "#FFFFFF" }}>
              {isSubmitting
                ? "Saving..."
                : step === 1 && selected === "scorecard_link"
                ? "Continue to Preview"
                : "Save Preference"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScorecardSendOptionModal;
