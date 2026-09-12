import React, { FC, useState, useEffect } from "react";
import { X, ArrowLeft, Image as ImageIcon, Link2, Check, FileText } from "lucide-react";
import { ScorecardSendOptions } from "../../../../api/thresholdApi";

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
    <div className="modal-backdrop-custom">
      <div className="modal-container-custom max-w-xl">
        {/* Modal Header */}
        <div className="modal-header-custom flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step === 2 && (
              <button
                type="button"
                className="p-1 hover:bg-slate-100 rounded text-slate-600 transition"
                onClick={() => setStep(1)}
                title="Go Back"
              >
                <ArrowLeft size={17} />
              </button>
            )}
            <div>
              <h3 className="modal-title-custom">
                {step === 1 ? "Send Scorecard As" : "Confirm Scorecard Link Message"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {step === 1
                  ? "Choose whether drivers receive an image or a web link"
                  : "Step 2 of 2: Message sent with the scorecard link"}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
            onClick={onClose}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="modal-body-custom p-5">
          {step === 1 ? (
            <div className="space-y-4">
              {/* Option 1: Scorecard by (LMD) Image */}
              <div
                className={`send-option-card ${selected === "scorecard_lmd" ? "selected" : ""}`}
                onClick={() => setSelected("scorecard_lmd")}
              >
                <div className="send-option-icon lmd">
                  <ImageIcon size={22} className="text-blue-600" />
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
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Green (Good)</span>
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 ml-1" />
                    <span>Orange (Neutral)</span>
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 ml-1" />
                    <span>Red (Bad)</span>
                  </div>
                </div>
                <div className="send-option-radio">
                  {selected === "scorecard_lmd" && <Check size={14} className="text-white" />}
                </div>
              </div>

              {/* Option 2: Scorecard by Image (Generic) */}
              <div
                className={`send-option-card ${selected === "scorecard_image" ? "selected" : ""}`}
                onClick={() => setSelected("scorecard_image")}
              >
                <div className="send-option-icon generic">
                  <ImageIcon size={22} className="text-purple-600" />
                </div>
                <div className="send-option-content">
                  <span className="send-option-title">Scorecard by Image</span>
                  <p className="send-option-desc">
                    Colors are pre-decided for each metric based on Amazon performance tiers:
                    Platinum, Gold, Silver, and Bronze.
                  </p>
                </div>
                <div className="send-option-radio">
                  {selected === "scorecard_image" && <Check size={14} className="text-white" />}
                </div>
              </div>

              {/* Option 3: Scorecard by Link */}
              <div
                className={`send-option-card ${selected === "scorecard_link" ? "selected" : ""}`}
                onClick={() => setSelected("scorecard_link")}
              >
                <div className="send-option-icon link">
                  <Link2 size={22} className="text-indigo-600" />
                </div>
                <div className="send-option-content">
                  <span className="send-option-title">Scorecard by Web Link</span>
                  <p className="send-option-desc">
                    The driver&apos;s data will be sent via an interactive mobile-optimized link
                    accompanied by a custom text message.
                  </p>
                </div>
                <div className="send-option-radio">
                  {selected === "scorecard_link" && <Check size={14} className="text-white" />}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800 flex items-start gap-2">
                <FileText size={15} className="mt-0.5 text-blue-600 shrink-0" />
                <span>
                  This notification message will accompany the personalized scorecard link sent
                  to each active driver.
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <span className="text-xs font-semibold text-slate-500 capitalize tracking-normal block mb-2">
                  Preview template
                </span>
                <p className="text-sm font-medium text-slate-700">Hi [Driver Name],</p>
                <textarea
                  className="w-full mt-2 p-2.5 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 resize-y min-h-[100px]"
                  value={templateText}
                  onChange={(e) => setTemplateText(e.target.value)}
                  placeholder="Enter message body here..."
                />
                <p className="text-xs text-blue-600 font-mono mt-2">
                  https://staging-viewer.prr.ai/scorecard-link
                </p>
                <p className="text-sm font-medium text-slate-700 mt-2">Thanks!</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer-custom flex items-center justify-end gap-2.5 p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl">
          <button
            type="button"
            className="btn-outline-secondary"
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
