import React, { FC, useRef, useState } from "react";
import {
  Camera,
  Shield,
  UploadCloud,
  CheckCircle2,
  Building2,
  Trash2,
} from "lucide-react";
import type { ProfileData, ProfileFormState } from "../../types/profile";
import { getAvatarColor, getInitials } from "../../utils/avatarUtils";

const sidebarCardStyle: React.CSSProperties = {
  backgroundColor: "var(--ads-material-thick)",
  backdropFilter: "var(--ads-blur-md)",
  WebkitBackdropFilter: "var(--ads-blur-md)",
  border: "1px solid var(--ads-hairline)",
  borderRadius: "var(--ads-r-lg)",
  boxShadow: "var(--ads-shadow-sm), var(--ads-bevel)",
};

interface ProfileSidebarProps {
  isEditing: boolean;
  isOwner: boolean;
  profileData: ProfileData;
  formState: ProfileFormState | null;
  onUserNameChange: (name: string) => void;
  onLogoFileSelect: (file: File | null) => void;
  onToggleEdit: () => void;
  onNotification: (msg: { text: string; type: "success" | "error" }) => void;
}

export const ProfileSidebar: FC<ProfileSidebarProps> = ({
  isEditing,
  isOwner,
  profileData,
  formState,
  onUserNameChange,
  onLogoFileSelect,
  onToggleEdit,
  onNotification,
}) => {
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isDropzoneHovered, setIsDropzoneHovered] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName =
    isEditing && formState
      ? formState.userName.value
      : profileData?.name || "User";
  const displayCompany =
    isEditing && formState
      ? formState.companyName.value
      : profileData?.company?.company_name || "Company Profile";
  const existingLogo = profileData?.company?.company_logo || "";
  const currentLogo = logoPreview || existingLogo;


  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      onNotification({
        text: "Please select a valid image file (PNG, JPG, SVG, or WEBP)",
        type: "error",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onNotification({
        text: "Logo image size must be less than 5MB",
        type: "error",
      });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);
    onLogoFileSelect(file);
    onNotification({
      text: "Logo ready. Click 'Save Changes' to update.",
      type: "success",
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveLogo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLogoPreview("");
    onLogoFileSelect(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onNotification({
      text: "Logo removed. Click 'Save Changes' to apply.",
      type: "success",
    });
  };

  return (
    <aside className="profile-sidebar-container">
      {/* 1. Compact User Identity Card */}
      <div className="sidebar-card user-identity-card" style={sidebarCardStyle}>
        <div className="avatar-circle-wrapper">
          <div
            className="sidebar-avatar-circle"
            style={{
              background: getAvatarColor(displayName, "admin"),
              border: "2px solid var(--ads-white)",
              boxShadow: "var(--ads-shadow-sm)",
              letterSpacing: "-0.01em",
            }}
          >
            <span style={{ color: "#FFFFFF" }}>{getInitials(displayName)}</span>
          </div>
          <div
            className="online-indicator"
            title="Active"
            style={{
              backgroundColor: "var(--ads-green)",
              border: "2px solid var(--ads-white)",
            }}
          />
        </div>

        {isEditing && formState ? (
          <div className="sidebar-input-group">
            <label
              htmlFor="sidebar_user_name"
              className="sidebar-field-label"
              style={{ color: "var(--ads-ink-secondary)" }}
            >
              Full Name
            </label>
            <input
              id="sidebar_user_name"
              type="text"
              className="styled-sidebar-input"
              placeholder="Your Name"
              value={formState.userName.value}
              onChange={(e) => onUserNameChange(e.target.value)}
            />
            {formState.userName.error && (
              <span
                className="sidebar-error-msg"
                style={{ color: "var(--ads-red)" }}
              >
                {formState.userName.helperText}
              </span>
            )}
          </div>
        ) : (
          <div className="sidebar-name-block">
            <h3
              className="sidebar-user-heading"
              style={{ color: "var(--ads-ink)", letterSpacing: "-0.015em" }}
            >
              {displayName}
            </h3>
            <span
              className="sidebar-user-email"
              style={{ color: "var(--ads-ink-tertiary)" }}
            >
              {profileData?.email || "—"}
            </span>
          </div>
        )}

        <div
          className="role-pill-badge"
          style={{
            backgroundColor: "var(--ads-amber-tint)",
            border: "1px solid transparent",
            color: "var(--ads-amber)",
            borderRadius: "var(--ads-r-pill)",
            letterSpacing: "0.01em",
          }}
        >
          <Shield size={11} style={{ color: "var(--ads-amber)" }} />
          <span style={{ color: "var(--ads-amber)" }}>
            {(profileData?.role || "Owner").toUpperCase()}
          </span>
        </div>
      </div>

      {/* 2. Company Brand Logo Card */}
      <div
        className="sidebar-card company-branding-card"
        style={sidebarCardStyle}
      >
        <div className="branding-card-header">
          <Building2
            size={14}
            className="text-blue-600"
            style={{ color: "var(--ads-blue)", flexShrink: 0 }}
          />
          <h4
            className="branding-card-title"
            style={{ color: "var(--ads-ink)", letterSpacing: "-0.01em" }}
          >
            Company Brand Logo
          </h4>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          aria-label="Upload company logo image"
          accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        {/* Interactive Logo Upload Dropzone */}
        <div
          className={`logo-dropzone ${isDragging ? "dragging" : ""} ${
            currentLogo ? "has-logo" : ""
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onMouseEnter={() => setIsDropzoneHovered(true)}
          onMouseLeave={() => setIsDropzoneHovered(false)}
          onClick={() => isOwner && fileInputRef.current?.click()}
          title={isOwner ? "Click to select logo" : "Company Logo"}
          style={{
            backgroundColor: currentLogo
              ? "var(--ads-material-thick)"
              : isDragging || isDropzoneHovered
              ? "var(--ads-blue-tint-strong)"
              : "var(--ads-blue-tint)",
            borderWidth: "1.5px",
            borderStyle: currentLogo ? "solid" : "dashed",
            borderColor:
              isDragging || isDropzoneHovered
                ? "var(--ads-blue)"
                : "var(--ads-hairline-strong)",
            borderRadius: "var(--ads-r-md)",
            transform:
              isDropzoneHovered && isOwner ? "translateY(-1px)" : "none",
            transition:
              "background-color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
          }}
        >
          {currentLogo ? (
            <div className="logo-preview-container">
              <img
                src={currentLogo}
                alt={displayCompany}
                className="logo-preview-img"
                style={{ borderRadius: "var(--ads-r-xs)" }}
              />
              <div
                className="logo-badge-overlay"
                style={{
                  backgroundColor: "var(--ads-green-tint)",
                  border: "1px solid transparent",
                  color: "var(--ads-green)",
                  borderRadius: "var(--ads-r-pill)",
                }}
              >
                <CheckCircle2 size={11} style={{ color: "var(--ads-green)" }} />
                <span style={{ color: "var(--ads-green)" }}>Uploaded</span>
              </div>
            </div>
          ) : (
            <div className="logo-empty-state">
              <div
                className="upload-icon-circle"
                style={{
                  backgroundColor: "var(--ads-white)",
                  border: "1px solid var(--ads-hairline)",
                  color: "var(--ads-blue)",
                  boxShadow: "var(--ads-shadow-xs)",
                }}
              >
                <UploadCloud size={18} style={{ color: "var(--ads-blue)" }} />
              </div>
              <span
                className="upload-prompt-text"
                style={{ color: "var(--ads-ink)", letterSpacing: "-0.01em" }}
              >
                {isOwner ? "Upload Logo" : "No Logo"}
              </span>
              <span
                className="upload-specs-text"
                style={{ color: "var(--ads-ink-tertiary)" }}
              >
                PNG, JPG, SVG (Max 5MB)
              </span>
            </div>
          )}
        </div>

        {/* Logo Action Buttons */}
        {isOwner && (
          <div className="logo-button-row">
            <button
              type="button"
              className="btn-blue-outline btn-sm flex-1"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera size={13} />
              <span>{currentLogo ? "Change" : "Upload"}</span>
            </button>
            {currentLogo && (
              <button
                type="button"
                className="btn-ghost-danger btn-sm"
                onClick={handleRemoveLogo}
                title="Remove logo"
                aria-label="Remove company logo"
                style={{
                  backgroundColor: "var(--ads-red-tint)",
                  border: "1px solid transparent",
                  color: "var(--ads-red)",
                  borderRadius: "var(--ads-r-pill)",
                  transition:
                    "background-color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease)",
                }}
              >
                <Trash2 size={13} style={{ color: "var(--ads-red)" }} />
              </button>
            )}
          </div>
        )}

      </div>

      {/* Terms and conditions & Privacy Policy Links (same as Fleet, Performance, Scheduler) */}
      <div className="sidebar-legal-footer">
        <a
          href="https://www.lmdmax.com/termsandcondition"
          target="_blank"
          rel="noopener noreferrer"
          className="sidebar-legal-link"
        >
          Terms and conditions
        </a>
        <span
          className="sidebar-legal-divider"
          style={{ color: "var(--ads-ink-quaternary)" }}
          aria-hidden="true"
        >
          •
        </span>
        <a
          href="https://www.lmdmax.com/privacypolicy"
          target="_blank"
          rel="noopener noreferrer"
          className="sidebar-legal-link"
        >
          Privacy Policy
        </a>
      </div>
    </aside>
  );
};

export default ProfileSidebar;
