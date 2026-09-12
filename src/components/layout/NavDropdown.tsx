import React, { FC, useState, useRef, useEffect, KeyboardEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronDown, Check, LucideIcon } from "lucide-react";

export interface NavDropdownItem {
  label: string;
  path: string;
  icon?: LucideIcon | React.ComponentType<{ size?: number; className?: string }>;
  description?: string;
  color?: string;
  bgColor?: string;
}

export interface NavDropdownProps {
  label: string;
  icon: LucideIcon | React.ComponentType<{ size?: number; className?: string }>;
  items: NavDropdownItem[];
  basePath: string;
  title?: string;
  categoryLabel?: string; // Kept optional for backward compatibility, not rendered
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  onItemSelect?: (item: NavDropdownItem) => void;
}

export const NavDropdown: FC<NavDropdownProps> = ({
  label,
  icon: Icon,
  items,
  basePath,
  title,
  isOpen: controlledIsOpen,
  onToggle,
  onItemSelect,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = typeof controlledIsOpen === "boolean";
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const setOpen = (open: boolean) => {
    if (onToggle) {
      onToggle(open);
    }
    if (!isControlled) {
      setInternalIsOpen(open);
    }
  };

  // Check if current route matches base path or any of the child items
  const isParentActive =
    location.pathname === basePath ||
    location.pathname.startsWith(`${basePath}/`) ||
    items.some((item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`));

  // Close menu on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(!isOpen);
  };

  const handleItemClick = (item: NavDropdownItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    if (onItemSelect) {
      onItemSelect(item);
    } else {
      navigate(item.path);
    }
  };

  const handleTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(!isOpen);
    }
  };

  return (
    <div className="nav-dropdown-wrap" ref={dropdownRef}>
      {/* Trigger Button styled identically to Navbar tabs with subtle rotating Chevron */}
      <button
        type="button"
        className={`navbar-tab-btn ${isParentActive ? "active" : ""}`}
        onClick={handleToggle}
        onKeyDown={handleTriggerKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={title || label}
        style={{
          transition: "all 0.15s ease",
          boxShadow: isOpen ? "0 0 0 2px rgba(37, 99, 235, 0.15)" : "none",
        }}
      >
        <Icon size={14} style={{ flexShrink: 0 }} />
        <span>{label}</span>
        <ChevronDown
          size={12}
          style={{
            transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            flexShrink: 0,
            opacity: 0.8,
          }}
        />
      </button>

      {/* Dropdown Menu Card Styled with Modern Elevated SaaS Aesthetics */}
      {isOpen && (
        <div role="menu" className="nav-dropdown-menu-card">
          {items.map((item) => {
            const isItemActive =
              location.pathname === item.path ||
              (item.path !== basePath && location.pathname.startsWith(`${item.path}/`));
            const ItemIcon = item.icon || Icon;
            const color = item.color || "#2563EB";
            const bgColor = item.bgColor || "#EFF6FF";

            return (
              <button
                key={item.path}
                type="button"
                role="menuitem"
                className={`nav-dropdown-compact-btn ${isItemActive ? "current" : ""}`}
                onClick={(e) => handleItemClick(item, e)}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.6rem 0.85rem",
                  paddingLeft: isItemActive ? "0.95rem" : "0.85rem",
                  borderRadius: "10px",
                  transition: "all 0.16s cubic-bezier(0.16, 1, 0.3, 1)",
                  width: "100%",
                  textAlign: "left",
                  backgroundColor: isItemActive ? "#EFF6FF" : "transparent",
                  border: isItemActive ? "1px solid #BFDBFE" : "1px solid transparent",
                  boxShadow: isItemActive ? "0 2px 6px -1px rgba(37, 99, 235, 0.12)" : "none",
                  cursor: "pointer",
                }}
              >
                {/* Active Left Indicator Bar */}
                {isItemActive && (
                  <span
                    style={{
                      position: "absolute",
                      left: "3px",
                      top: "22%",
                      bottom: "22%",
                      width: "3px",
                      borderRadius: "4px",
                      backgroundColor: "#2563EB",
                    }}
                  />
                )}

                {/* Icon Box */}
                <div
                  className="see-more-icon-box"
                  style={{
                    color: isItemActive ? "#2563EB" : color,
                    backgroundColor: isItemActive ? "#DBEAFE" : bgColor,
                    width: "34px",
                    height: "34px",
                    borderRadius: "9px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.16s ease",
                    border: isItemActive ? "1px solid rgba(37, 99, 235, 0.25)" : "1px solid transparent",
                    boxShadow: isItemActive ? "0 2px 4px rgba(37, 99, 235, 0.18)" : "none",
                  }}
                >
                  <ItemIcon size={16} />
                </div>

                {/* Label & Active Checkmark */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.84rem",
                      fontWeight: isItemActive ? 650 : 500,
                      color: isItemActive ? "#1D4ED8" : "#1E293B",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {item.label}
                  </span>

                  {/* Prominent Active Select State Checkmark Badge */}
                  {isItemActive && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "19px",
                        height: "19px",
                        borderRadius: "50%",
                        backgroundColor: "#2563EB",
                        color: "#FFFFFF",
                        flexShrink: 0,
                        boxShadow: "0 2px 5px rgba(37, 99, 235, 0.35)",
                        marginLeft: "0.5rem",
                      }}
                      title="Currently active"
                    >
                      <Check size={11} strokeWidth={3} style={{ color: "#FFFFFF" }} />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NavDropdown;
