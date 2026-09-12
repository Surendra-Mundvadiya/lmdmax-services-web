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
          bg: "#EFF6FF",
          color: "#2563EB",
          border: "#BFDBFE",
        };
      case 3:
        return {
          label: "Pending",
          bg: "#FFFBEB",
          color: "#D97706",
          border: "#FDE68A",
        };
      case 4:
        return {
          label: "Resolved",
          bg: "#ECFDF5",
          color: "#059669",
          border: "#A7F3D0",
        };
      case 5:
      default:
        return {
          label: "Closed",
          bg: "#F1F5F9",
          color: "#64748B",
          border: "#CBD5E1",
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
              backgroundColor: "#FFFFFF",
              borderRadius: "10px",
              border: "1px solid #E2E8F0",
              padding: "1.5rem",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.25rem",
                paddingBottom: "0.75rem",
                borderBottom: "1px solid #F1F5F9",
                flexWrap: "wrap",
                gap: "0.75rem",
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  color: "#0F172A",
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
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    color: "#475569",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
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
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: "#2563EB",
                    color: "#FFFFFF",
                    fontSize: "0.8125rem",
                    fontWeight: 650,
                    cursor: "pointer",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1D4ED8")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2563EB")}
                >
                  <MessageSquarePlus size={14} />
                  <span>New Query</span>
                </button>
              </div>
            </div>

            {loadingTickets ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "#64748B" }}>
                <Clock size={28} className="animate-spin" style={{ margin: "0 auto 0.75rem", color: "#2563EB" }} />
                <p style={{ margin: 0, fontSize: "0.875rem" }}>Loading your submitted queries...</p>
              </div>
            ) : ticketsError ? (
              <div
                style={{
                  padding: "1.5rem",
                  borderRadius: "8px",
                  backgroundColor: "#FEF2F2",
                  border: "1px solid #FECACA",
                  color: "#DC2626",
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
                  backgroundColor: "#F8FAFC",
                  borderRadius: "8px",
                  border: "1px dashed #CBD5E1",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: "#EFF6FF",
                    color: "#2563EB",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1rem",
                  }}
                >
                  <HelpCircle size={24} />
                </div>
                <h3 style={{ margin: "0 0 0.4rem", fontSize: "1rem", fontWeight: 700, color: "#1E293B" }}>
                  No Queries Found
                </h3>
                <p style={{ margin: "0 0 1.25rem", fontSize: "0.8125rem", color: "#64748B" }}>
                  You haven't submitted any support queries yet.
                </p>
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(true)}
                  style={{
                    padding: "0.5rem 1.125rem",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: "#2563EB",
                    color: "#FFFFFF",
                    fontSize: "0.8125rem",
                    fontWeight: 650,
                    cursor: "pointer",
                  }}
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
                        borderRadius: "8px",
                        border: "1px solid #E2E8F0",
                        backgroundColor: "#FFFFFF",
                        transition: "box-shadow 0.15s ease",
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
                        <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#2563EB" }}>
                          Query #{index + 1}
                        </span>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <span
                            style={{
                              fontSize: "0.71875rem",
                              fontWeight: 700,
                              padding: "0.2rem 0.55rem",
                              borderRadius: "9999px",
                              backgroundColor: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.border}`,
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            {badge.label}
                          </span>

                          <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 500 }}>
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
                          backgroundColor: "#EFF6FF",
                          borderRadius: "6px",
                          padding: "0.45rem 0.75rem",
                          fontSize: "0.75rem",
                          color: "#1E40AF",
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
                          color: "#0F172A",
                        }}
                      >
                        {ticket.subject}
                      </h4>

                      <p
                        style={{
                          margin: "0 0 0.75rem",
                          fontSize: "0.8125rem",
                          color: "#475569",
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
                              color: "#64748B",
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
                                  borderRadius: "6px",
                                  border: "1px solid #CBD5E1",
                                  backgroundColor: "#F8FAFC",
                                  fontSize: "0.75rem",
                                  color: "#2563EB",
                                  textDecoration: "none",
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
              backgroundColor: "#FFFFFF",
              borderRadius: "10px",
              border: "1px solid #E2E8F0",
              padding: "1.75rem 2rem",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
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
                    color: "#475569",
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
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: "#2563EB",
                    color: "#FFFFFF",
                    fontSize: "0.8125rem",
                    fontWeight: 650,
                    cursor: "pointer",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1D4ED8")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2563EB")}
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
                  color: "#0F172A",
                }}
              >
                Frequently Asked Questions
              </h1>
              <p style={{ margin: "0 0 1.25rem", fontSize: "0.875rem", color: "#64748B" }}>
                Find quick answers to common questions about inspections, vehicle assignments, and fleet setups
              </p>

              {/* Search Bar */}
              <div style={{ position: "relative", width: "100%" }}>
                <Search
                  size={16}
                  style={{
                    position: "absolute",
                    left: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94A3B8",
                  }}
                />
                <input
                  type="text"
                  placeholder="Search your issue or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: searchQuery ? "0.75rem 2.2rem 0.75rem 2.75rem" : "0.75rem 1rem 0.75rem 2.75rem",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.875rem",
                    outline: "none",
                    backgroundColor: "#F8FAFC",
                    color: "#0F172A",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s ease",
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
                      right: "0.85rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#94A3B8",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* Questions Accordion List */}
            <div style={{ width: "100%", maxWidth: "800px", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {filteredQuestions.length === 0 ? (
                <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "#64748B" }}>
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
                        borderRadius: "8px",
                        border: "1px solid #E2E8F0",
                        overflow: "hidden",
                        backgroundColor: "#FFFFFF",
                        transition: "border-color 0.15s ease",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleQuestion(q.id)}
                        style={{
                          width: "100%",
                          padding: "0.85rem 1.125rem",
                          backgroundColor: isOpen ? "#F8FAFC" : "#FFFFFF",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          textAlign: "left",
                          gap: "1rem",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: 650,
                            color: isOpen ? "#1D4ED8" : "#1E293B",
                            lineHeight: 1.4,
                          }}
                        >
                          {q.question}
                        </span>
                        {isOpen ? (
                          <ChevronUp size={16} style={{ color: "#2563EB", flexShrink: 0 }} />
                        ) : (
                          <ChevronDown size={16} style={{ color: "#94A3B8", flexShrink: 0 }} />
                        )}
                      </button>

                      {isOpen && (
                        <div
                          style={{
                            padding: "0.85rem 1.25rem 1.125rem 1.5rem",
                            borderTop: "1px solid #F1F5F9",
                            backgroundColor: "#FFFFFF",
                          }}
                        >
                          {q.steps.length === 1 ? (
                            <p
                              style={{
                                margin: 0,
                                fontSize: "0.8125rem",
                                color: "#334155",
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
                                    color: "#334155",
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
                borderRadius: "10px",
                backgroundColor: "#EFF6FF",
                border: "1px solid #BFDBFE",
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
                    color: "#1E3A8A",
                  }}
                >
                  Still have questions?
                </h4>
                <p style={{ margin: 0, fontSize: "0.8125rem", color: "#1D4ED8" }}>
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
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: "#2563EB",
                  color: "#FFFFFF",
                  fontSize: "0.8125rem",
                  fontWeight: 650,
                  cursor: "pointer",
                  transition: "background-color 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1D4ED8")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2563EB")}
              >
                <MessageSquarePlus size={15} />
                <span>Send query</span>
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
