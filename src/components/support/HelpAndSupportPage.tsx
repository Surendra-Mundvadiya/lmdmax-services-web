import React, { FC, useState, useEffect, useMemo, useCallback } from "react";
import {
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  MessageSquarePlus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  X,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import GlassAppLayout from "../layout/GlassAppLayout";
import { FAQ_QUESTIONS, FaqQuestion } from "./faqQuestions";
import { SubmitQueryModal } from "./SubmitQueryModal";
import { SupportApi, SupportTicket } from "../../api/supportApi";

export const HelpAndSupportPage: FC = () => {
  const [showPreviousQueries, setShowPreviousQueries] = useState<boolean>(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [openQuestionIds, setOpenQuestionIds] = useState<Set<number>>(new Set([1]));

  // Live queries state
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState<boolean>(false);
  const [ticketsError, setTicketsError] = useState<string | null>(null);

  // Fetch live tickets
  const fetchTickets = useCallback(async () => {
    try {
      setLoadingTickets(true);
      setTicketsError(null);
      const data = await SupportApi.getTickets();
      setTickets(data);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to load previous queries";
      setTicketsError(msg);
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Expand / collapse single accordion question
  const toggleQuestion = (id: number) => {
    setOpenQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filter FAQ questions based on search input
  const filteredQuestions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return FAQ_QUESTIONS;

    return FAQ_QUESTIONS.filter((item) => {
      const matchesTitle = item.question.toLowerCase().includes(q);
      const matchesSteps = item.steps.some((step) => step.toLowerCase().includes(q));
      return matchesTitle || matchesSteps;
    });
  }, [searchQuery]);

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 2:
        return {
          label: "Open",
          bg: "var(--ads-blue-tint)",
          color: "var(--ads-blue)",
          border: "var(--ads-blue-tint-strong)",
        };
      case 3:
        return {
          label: "Pending",
          bg: "var(--ads-amber-tint)",
          color: "var(--ads-amber)",
          border: "var(--ads-amber-tint)",
        };
      case 4:
        return {
          label: "Resolved",
          bg: "var(--ads-green-tint)",
          color: "var(--ads-green)",
          border: "var(--ads-green-tint)",
        };
      case 5:
      default:
        return {
          label: "Closed",
          bg: "var(--ads-canvas)",
          color: "var(--ads-ink-tertiary)",
          border: "var(--ads-hairline)",
        };
    }
  };

  return (
    <GlassAppLayout
      currentRoute="help_and_support"
      activeBreadcrumb={{ section: "Support", page: "Help & Support" }}
    >
      {/* Main Content Area */}
      <main
        className="operations-main-content"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1.25rem 1.5rem 2rem",
          maxWidth: "1280px",
          width: "100%",
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        {/* Single Unified View: Previous Queries vs FAQ */}
        {showPreviousQueries ? (
          /* =========================================================================
              VIEW 1: PREVIOUS QUERIES
             ========================================================================= */
          <div
            style={{
              background: "var(--ads-material-thick)",
              backdropFilter: "var(--ads-blur-md)",
              WebkitBackdropFilter: "var(--ads-blur-md)",
              borderRadius: "var(--ads-r-lg)",
              border: "1px solid var(--ads-hairline)",
              padding: "1.5rem",
              boxShadow: "var(--ads-shadow-sm), var(--ads-bevel)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.25rem",
                paddingBottom: "0.75rem",
                borderBottom: "1px solid var(--ads-hairline)",
                flexWrap: "wrap",
                gap: "0.75rem",
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  letterSpacing: "-0.015em",
                  color: "var(--ads-ink)",
                }}
              >
                Previous Queries ({tickets.length})
              </h1>

              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <button
                  type="button"
                  onClick={() => setShowPreviousQueries(false)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.45rem 0.85rem",
                    borderRadius: "var(--ads-r-xs)",
                    border: "1px solid var(--ads-hairline-strong)",
                    backgroundColor: "var(--ads-white)",
                    color: "var(--ads-ink-secondary)",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition:
                      "background-color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--ads-canvas)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "var(--ads-shadow-xs)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--ads-white)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
                  onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                >
                  <ArrowLeft size={14} />
                  <span>Back to FAQs</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.45rem 0.95rem",
                    borderRadius: "var(--ads-r-xs)",
                    border: "none",
                    backgroundColor: "var(--ads-blue)",
                    color: "#FFFFFF",
                    fontSize: "0.8125rem",
                    fontWeight: 650,
                    cursor: "pointer",
                    boxShadow: "var(--ads-shadow-xs)",
                    transition:
                      "background-color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--ads-blue-hover)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "var(--ads-shadow-sm)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--ads-blue)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "var(--ads-shadow-xs)";
                  }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
                  onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                >
                  <MessageSquarePlus size={14} style={{ color: "#FFFFFF" }} />
                  <span style={{ color: "#FFFFFF" }}>New Query</span>
                </button>
              </div>
            </div>

            {loadingTickets ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "var(--ads-ink-tertiary)" }}>
                <Clock size={28} className="animate-spin" style={{ margin: "0 auto 0.75rem", color: "var(--ads-blue)" }} />
                <p style={{ margin: 0, fontSize: "0.875rem" }}>Loading your submitted queries...</p>
              </div>
            ) : ticketsError ? (
              <div
                style={{
                  padding: "1.5rem",
                  borderRadius: "var(--ads-r-sm)",
                  backgroundColor: "var(--ads-red-tint)",
                  border: "1px solid var(--ads-red)",
                  color: "var(--ads-red)",
                  textAlign: "center",
                }}
              >
                <AlertCircle size={24} style={{ margin: "0 auto 0.5rem" }} />
                <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600 }}>{ticketsError}</p>
              </div>
            ) : tickets.length === 0 ? (
              <div
                style={{
                  padding: "3.5rem 1rem",
                  textAlign: "center",
                  backgroundColor: "var(--ads-canvas)",
                  borderRadius: "var(--ads-r-md)",
                  border: "1px dashed var(--ads-hairline-strong)",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: "var(--ads-blue-tint)",
                    color: "var(--ads-blue)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1rem",
                  }}
                >
                  <HelpCircle size={24} />
                </div>
                <h3 style={{ margin: "0 0 0.4rem", fontSize: "1rem", fontWeight: 700, color: "var(--ads-ink)" }}>
                  No Queries Found
                </h3>
                <p style={{ margin: "0 0 1.25rem", fontSize: "0.8125rem", color: "var(--ads-ink-tertiary)" }}>
                  You haven't submitted any support queries yet.
                </p>
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(true)}
                  style={{
                    padding: "0.5rem 1.125rem",
                    borderRadius: "var(--ads-r-xs)",
                    border: "none",
                    backgroundColor: "var(--ads-blue)",
                    color: "#FFFFFF",
                    fontSize: "0.8125rem",
                    fontWeight: 650,
                    cursor: "pointer",
                    boxShadow: "var(--ads-shadow-xs)",
                    transition:
                      "background-color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--ads-blue-hover)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "var(--ads-shadow-sm)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--ads-blue)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "var(--ads-shadow-xs)";
                  }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
                  onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                >
                  Submit a Query
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {tickets.map((ticket, index) => {
                  const badge = getStatusBadge(ticket.status);
                  const attachmentsList = ticket.attachments || ticket.attachment || [];

                  return (
                    <div
                      key={ticket._id || ticket.id || index}
                      style={{
                        padding: "1.125rem 1.25rem",
                        borderRadius: "var(--ads-r-md)",
                        border: "1px solid var(--ads-hairline)",
                        backgroundColor: "var(--ads-white)",
                        boxShadow: "var(--ads-shadow-xs)",
                        transition:
                          "box-shadow var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = "var(--ads-shadow-md)";
                        e.currentTarget.style.borderColor = "var(--ads-hairline-strong)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = "var(--ads-shadow-xs)";
                        e.currentTarget.style.borderColor = "var(--ads-hairline)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "0.5rem",
                          marginBottom: "0.75rem",
                        }}
                      >
                        <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--ads-blue)" }}>
                          Query #{index + 1}
                        </span>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <span
                            style={{
                              fontSize: "0.71875rem",
                              fontWeight: 700,
                              padding: "0.2rem 0.55rem",
                              borderRadius: "var(--ads-r-pill)",
                              backgroundColor: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.border}`,
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            {badge.label}
                          </span>

                          <span style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)", fontWeight: 500 }}>
                            {ticket.created_at
                              ? new Date(ticket.created_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "Recent"}
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          backgroundColor: "var(--ads-blue-tint)",
                          border: "1px solid var(--ads-blue-tint-strong)",
                          borderRadius: "var(--ads-r-xs)",
                          padding: "0.45rem 0.75rem",
                          fontSize: "0.75rem",
                          lineHeight: 1.5,
                          color: "var(--ads-blue)",
                          marginBottom: "0.75rem",
                        }}
                      >
                        <em>If you are not able to find the response email, please check your junk/spam email folder.</em>
                      </div>

                      <h4
                        style={{
                          margin: "0 0 0.35rem",
                          fontSize: "0.9375rem",
                          fontWeight: 650,
                          color: "var(--ads-ink)",
                        }}
                      >
                        {ticket.subject}
                      </h4>

                      <p
                        style={{
                          margin: "0 0 0.75rem",
                          fontSize: "0.8125rem",
                          color: "var(--ads-ink-secondary)",
                          lineHeight: 1.5,
                          whiteSpace: "pre-line",
                        }}
                      >
                        {ticket.description || ticket.description_text || "No additional description provided."}
                      </p>

                      {attachmentsList.length > 0 && (
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "0.71875rem",
                              fontWeight: 650,
                              color: "var(--ads-ink-tertiary)",
                              letterSpacing: "0.4px",
                              marginBottom: "0.35rem",
                              textTransform: "uppercase",
                            }}
                          >
                            Attachments ({attachmentsList.length}):
                          </span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                            {attachmentsList.map((attUrl, aIdx) => (
                              <a
                                key={aIdx}
                                href={attUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.3rem",
                                  padding: "0.25rem 0.6rem",
                                  borderRadius: "var(--ads-r-xs)",
                                  border: "1px solid var(--ads-hairline)",
                                  backgroundColor: "var(--ads-canvas)",
                                  fontSize: "0.75rem",
                                  color: "var(--ads-blue)",
                                  textDecoration: "none",
                                  transition:
                                    "background-color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = "var(--ads-blue-tint)";
                                  e.currentTarget.style.borderColor = "var(--ads-blue-tint-strong)";
                                  e.currentTarget.style.transform = "translateY(-1px)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = "var(--ads-canvas)";
                                  e.currentTarget.style.borderColor = "var(--ads-hairline)";
                                  e.currentTarget.style.transform = "translateY(0)";
                                }}
                              >
                                <Paperclip size={12} />
                                <span>Attachment {aIdx + 1}</span>
                                <ExternalLink size={11} />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* =========================================================================
              VIEW 2: FREQUENTLY ASKED QUESTIONS (DEFAULT)
             ========================================================================= */
          <div
            style={{
              background: "var(--ads-material-thick)",
              backdropFilter: "var(--ads-blur-md)",
              WebkitBackdropFilter: "var(--ads-blur-md)",
              borderRadius: "var(--ads-r-lg)",
              border: "1px solid var(--ads-hairline)",
              padding: "1.75rem 2rem",
              boxShadow: "var(--ads-shadow-sm), var(--ads-bevel)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Top Row inside Card: Check Previous Queries Status */}
            <div
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                marginBottom: "0.75rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--ads-ink-secondary)",
                    fontWeight: 500,
                  }}
                >
                  Check status of your previous queries
                </span>
                <button
                  type="button"
                  onClick={() => setShowPreviousQueries(true)}
                  style={{
                    padding: "0.45rem 1.1rem",
                    borderRadius: "var(--ads-r-xs)",
                    border: "none",
                    backgroundColor: "var(--ads-blue)",
                    color: "#FFFFFF",
                    fontSize: "0.8125rem",
                    fontWeight: 650,
                    cursor: "pointer",
                    boxShadow: "var(--ads-shadow-xs)",
                    transition:
                      "background-color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--ads-blue-hover)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "var(--ads-shadow-sm)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--ads-blue)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "var(--ads-shadow-xs)";
                  }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
                  onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                >
                  View
                </button>
              </div>
            </div>

            {/* FAQ Header & Search Input */}
            <div style={{ width: "100%", maxWidth: "680px", textAlign: "center", marginBottom: "1.75rem" }}>
              <h1
                style={{
                  margin: "0 0 0.5rem",
                  fontSize: "1.5rem",
                  fontWeight: 750,
                  letterSpacing: "-0.02em",
                  color: "var(--ads-ink)",
                }}
              >
                Frequently Asked Questions
              </h1>
              <p style={{ margin: "0 0 1.25rem", fontSize: "0.875rem", lineHeight: 1.5, color: "var(--ads-ink-tertiary)" }}>
                Find quick answers to common questions about inspections, vehicle assignments, and fleet setups
              </p>

              {/* Search Bar */}
              <div style={{ position: "relative", width: "100%" }}>
                <label
                  htmlFor="faq-search-input"
                  style={{
                    position: "absolute",
                    width: "1px",
                    height: "1px",
                    padding: 0,
                    margin: "-1px",
                    overflow: "hidden",
                    clip: "rect(0, 0, 0, 0)",
                    whiteSpace: "nowrap",
                    border: 0,
                  }}
                >
                  Search frequently asked questions
                </label>
                <Search
                  size={16}
                  style={{
                    position: "absolute",
                    left: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--ads-ink-tertiary)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  id="faq-search-input"
                  type="text"
                  placeholder="Search your issue or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: searchQuery ? "0.75rem 2.2rem 0.75rem 2.75rem" : "0.75rem 1rem 0.75rem 2.75rem",
                    borderRadius: "var(--ads-r-sm)",
                    border: "1px solid var(--ads-hairline-strong)",
                    fontSize: "0.875rem",
                    outline: "none",
                    backgroundColor: "var(--ads-white)",
                    color: "var(--ads-ink)",
                    boxSizing: "border-box",
                    transition:
                      "border-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), background-color var(--ads-dur-fast) var(--ads-ease)",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--ads-blue)";
                    e.target.style.boxShadow = "var(--ads-shadow-focus)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--ads-hairline-strong)";
                    e.target.style.boxShadow = "none";
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    style={{
                      position: "absolute",
                      right: "0.85rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "var(--ads-ink-tertiary)",
                      cursor: "pointer",
                      padding: 0,
                      display: "flex",
                      transition: "color var(--ads-dur-fast) var(--ads-ease), opacity var(--ads-dur-fast) var(--ads-ease)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ads-ink)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ads-ink-tertiary)")}
                    aria-label="Clear search"
                    title="Clear search"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* Questions Accordion List */}
            <div style={{ width: "100%", maxWidth: "800px", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {filteredQuestions.length === 0 ? (
                <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "var(--ads-ink-tertiary)" }}>
                  <p style={{ margin: "0 0 0.5rem", fontSize: "0.9375rem", fontWeight: 600 }}>
                    No matching questions found
                  </p>
                  <p style={{ margin: 0, fontSize: "0.8125rem" }}>
                    Try searching with another keyword, or send your question directly below.
                  </p>
                </div>
              ) : (
                filteredQuestions.map((q) => {
                  const isOpen = openQuestionIds.has(q.id);

                  return (
                    <div
                      key={q.id}
                      style={{
                        borderRadius: "var(--ads-r-md)",
                        border: isOpen
                          ? "1px solid var(--ads-blue-tint-strong)"
                          : "1px solid var(--ads-hairline)",
                        overflow: "hidden",
                        backgroundColor: "var(--ads-white)",
                        boxShadow: isOpen ? "var(--ads-shadow-sm)" : "var(--ads-shadow-xs)",
                        transition:
                          "border-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleQuestion(q.id)}
                        aria-expanded={isOpen}
                        style={{
                          width: "100%",
                          padding: "0.85rem 1.125rem",
                          backgroundColor: isOpen ? "var(--ads-blue-tint)" : "transparent",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          textAlign: "left",
                          gap: "1rem",
                          transition: "background-color var(--ads-dur-fast) var(--ads-ease)",
                        }}
                        onMouseEnter={(e) => {
                          if (!isOpen) e.currentTarget.style.backgroundColor = "var(--ads-canvas)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isOpen
                            ? "var(--ads-blue-tint)"
                            : "transparent";
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: 650,
                            color: isOpen ? "var(--ads-blue)" : "var(--ads-ink)",
                            lineHeight: 1.4,
                            transition: "color var(--ads-dur-fast) var(--ads-ease)",
                          }}
                        >
                          {q.question}
                        </span>
                        {isOpen ? (
                          <ChevronUp size={16} style={{ color: "var(--ads-blue)", flexShrink: 0 }} />
                        ) : (
                          <ChevronDown size={16} style={{ color: "var(--ads-ink-tertiary)", flexShrink: 0 }} />
                        )}
                      </button>

                      {isOpen && (
                        <div
                          style={{
                            padding: "0.85rem 1.25rem 1.125rem 1.5rem",
                            borderTop: "1px solid var(--ads-hairline)",
                            backgroundColor: "var(--ads-white)",
                          }}
                        >
                          {q.steps.length === 1 ? (
                            <p
                              style={{
                                margin: 0,
                                fontSize: "0.8125rem",
                                color: "var(--ads-ink-secondary)",
                                lineHeight: 1.6,
                              }}
                            >
                              {q.steps[0]}
                            </p>
                          ) : (
                            <ol
                              style={{
                                margin: 0,
                                paddingLeft: "1.25rem",
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.4rem",
                              }}
                            >
                              {q.steps.map((step, idx) => (
                                <li
                                  key={idx}
                                  style={{
                                    fontSize: "0.8125rem",
                                    color: "var(--ads-ink-secondary)",
                                    lineHeight: 1.55,
                                  }}
                                >
                                  {step}
                                </li>
                              ))}
                            </ol>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Still have questions? Callout Card */}
            <div
              style={{
                width: "100%",
                maxWidth: "800px",
                marginTop: "1.75rem",
                padding: "1.125rem 1.5rem",
                borderRadius: "var(--ads-r-lg)",
                backgroundColor: "var(--ads-blue-tint)",
                border: "1px solid var(--ads-blue-tint-strong)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <div>
                <h4
                  style={{
                    margin: "0 0 0.25rem",
                    fontSize: "0.9375rem",
                    fontWeight: 700,
                    color: "var(--ads-ink)",
                  }}
                >
                  Still have questions?
                </h4>
                <p style={{ margin: 0, fontSize: "0.8125rem", lineHeight: 1.5, color: "var(--ads-ink-secondary)" }}>
                  Can’t find the answer you are looking for? Please leave your query here.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.55rem 1.125rem",
                  borderRadius: "var(--ads-r-xs)",
                  border: "none",
                  backgroundColor: "var(--ads-blue)",
                  color: "#FFFFFF",
                  fontSize: "0.8125rem",
                  fontWeight: 650,
                  cursor: "pointer",
                  boxShadow: "var(--ads-shadow-xs)",
                  transition:
                    "background-color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--ads-blue-hover)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "var(--ads-shadow-sm)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--ads-blue)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "var(--ads-shadow-xs)";
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
                onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
              >
                <MessageSquarePlus size={15} style={{ color: "#FFFFFF" }} />
                <span style={{ color: "#FFFFFF" }}>Send query</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modal for Creating New Query */}
      <SubmitQueryModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSuccess={() => {
          if (showPreviousQueries) {
            fetchTickets();
          }
        }}
      />
    </GlassAppLayout>
  );
};

export default HelpAndSupportPage;
