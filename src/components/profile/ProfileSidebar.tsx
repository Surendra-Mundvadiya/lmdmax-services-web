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
      <div className="sidebar-card user-identity-card">
        <div className="avatar-circle-wrapper">
          <div
            className="sidebar-avatar-circle"
            style={{ background: getAvatarColor(displayName, "admin") }}
          >
            <span style={{ color: "#FFFFFF" }}>{getInitials(displayName)}</span>
          </div>
          <div className="online-indicator" title="Active" />
        </div>

        {isEditing && formState ? (
          <div className="sidebar-input-group">
            <label className="sidebar-field-label">Full Name</label>
            <input
              type="text"
              className="styled-sidebar-input"
              placeholder="Your Name"
              value={formState.userName.value}
              onChange={(e) => onUserNameChange(e.target.value)}
            />
            {formState.userName.error && (
              <span className="sidebar-error-msg">
                {formState.userName.helperText}
              </span>
            )}
          </div>
        ) : (
          <div className="sidebar-name-block">
            <h3 className="sidebar-user-heading">{displayName}</h3>
            <span className="sidebar-user-email">
              {profileData?.email || "—"}
            </span>
          </div>
        )}

        <div className="role-pill-badge">
          <Shield size={11} />
          <span>{(profileData?.role || "Owner").toUpperCase()}</span>
        </div>
      </div>

      {/* 2. Company Brand Logo Card */}
      <div className="sidebar-card company-branding-card">
        <div className="branding-card-header">
          <Building2 size={14} className="text-blue-600" />
          <h4 className="branding-card-title">Company Brand Logo</h4>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
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
          onClick={() => isOwner && fileInputRef.current?.click()}
          title={isOwner ? "Click to select logo" : "Company Logo"}
        >
          {currentLogo ? (
            <div className="logo-preview-container">
              <img
                src={currentLogo}
                alt={displayCompany}
                className="logo-preview-img"
              />
              <div className="logo-badge-overlay">
                <CheckCircle2 size={11} />
                <span>Uploaded</span>
              </div>
            </div>
          ) : (
            <div className="logo-empty-state">
              <div className="upload-icon-circle">
                <UploadCloud size={18} />
              </div>
              <span className="upload-prompt-text">
                {isOwner ? "Upload Logo" : "No Logo"}
              </span>
              <span className="upload-specs-text">
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
              >
                <Trash2 size={13} />
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
        <span className="sidebar-legal-divider">•</span>
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
