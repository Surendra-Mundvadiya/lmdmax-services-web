import React, { FC, useState, useEffect, useMemo, useCallback } from "react";
import {
  CheckSquare,
  Plus,
  Search,
  RefreshCw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Trash2,
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertCircle,
  User,
  LayoutGrid,
  List as ListIcon,
  Tag,
  Send,
  X,
  TrendingUp,
  MessageCircle,
  GripVertical,
} from "lucide-react";
import { useAuthStore } from "../../../store/authStore";
import { useAdminStore } from "../../../store/adminStore";
import { notesTasksApi, type TaskItem, type TaskStatusType, type TaskComment } from "../../../api/notesTasksApi";
import { AddTaskModal } from "./AddTaskModal";
import { getAvatarColor, getInitials } from "../../../utils/avatarUtils";

export const TasksManagementView: FC = () => {
  const authStations = useAuthStore((state) => state.stations);
  const activeStationObj = authStations.find((s) => s.current) || authStations[0];
  const activeStationCode =
    activeStationObj?.station_code ||
    useAuthStore.getState().user?.station_code ||
    useAuthStore.getState().user?.company?.station_code ||
    "QUE4";

  const currentUser = useAuthStore((state) => state.user);

  // Admins from store for mapping account_ids to real names
  const admins = useAdminStore((state) => state.admins);
  const fetchAdmins = useAdminStore((state) => state.fetchAdmins);

  useEffect(() => {
    if (admins.length === 0) {
      fetchAdmins();
    }
  }, [admins.length, fetchAdmins]);

  // Helper to resolve admin/user name from account_id or email
  const getAdminName = useCallback(
    (idOrVal?: string | number) => {
      if (!idOrVal) return "Unassigned";
      const valStr = String(idOrVal).trim();
      const match = admins.find(
        (a) =>
          String(a.account_id || a.id) === valStr ||
          a.email?.toLowerCase() === valStr.toLowerCase() ||
          a.name?.toLowerCase() === valStr.toLowerCase()
      );
      if (match) return match.name || match.first_name || match.email || valStr;
      return valStr;
    },
    [admins]
  );

  // Date Range state: defaults to current week (Monday to Sunday)
  const [currentWeekOffset, setCurrentWeekOffset] = useState<number>(0);

  const { weekStart, weekEnd, weekFormatted } = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + currentWeekOffset * 7);

    // Get Monday of that week
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const formatISO = (date: Date) => date.toISOString().split("T")[0];
    const startStr = formatISO(monday);
    const endStr = formatISO(sunday);

    const mStr = monday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const sStr = sunday.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    return {
      weekStart: startStr,
      weekEnd: endStr,
      weekFormatted: `${mStr} – ${sStr}`,
    };
  }, [currentWeekOffset]);

  // Tasks state
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>("all");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  // Inline comment expansion state (Set of expanded task_ids)
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [inlineCommentInputs, setInlineCommentInputs] = useState<Record<string, string>>({});
  const [submittingCommentTaskId, setSubmittingCommentTaskId] = useState<string | number | null>(null);

  // Drag & Drop State
  const [draggedTaskId, setDraggedTaskId] = useState<string | number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatusType | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteConfirmTask, setDeleteConfirmTask] = useState<TaskItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  // Fetch Tasks for the selected week
  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await notesTasksApi.getTasks({
        start: weekStart,
        end: weekEnd,
      });
      setTasks(data || []);
    } catch (err: any) {
      console.error("Error loading tasks:", err);
      setError(err?.message || "Failed to load tasks from server");
    } finally {
      setIsLoading(false);
    }
  }, [weekStart, weekEnd]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Create Task Handler
  const handleCreateTask = async (data: {
    tag_message: string;
    tagged: string;
    type?: string;
  }) => {
    const newTask = await notesTasksApi.createTask(data);
    setTasks((prev) => [newTask, ...prev]);
    showToast("Task created successfully");
  };

  // Update Task Status
  const handleUpdateStatus = async (taskId: string | number, newStatus: TaskStatusType) => {
    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.tag_id === taskId ? { ...t, status: newStatus } : t))
      );
      await notesTasksApi.updateTaskStatus({
        tag_id: taskId,
        status: newStatus,
      });
      showToast(`Task moved to ${newStatus === "progress" ? "In Progress" : newStatus}`);
    } catch (err: any) {
      setError(err?.message || "Failed to update task status");
      fetchTasks(); // rollback
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, taskId: string | number) => {
    e.dataTransfer.setData("text/plain", String(taskId));
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatusType) => {
    e.preventDefault();
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatusType) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskIdStr = e.dataTransfer.getData("text/plain");
    const taskId = draggedTaskId || taskIdStr;
    if (!taskId) return;

    const task = tasks.find((t) => String(t.tag_id) === String(taskId));
    if (task && (task.status || "created") !== targetStatus) {
      await handleUpdateStatus(task.tag_id, targetStatus);
    }
    setDraggedTaskId(null);
  };

  // Delete Task Handler
  const handleConfirmDelete = async () => {
    if (!deleteConfirmTask) return;
    try {
      setIsDeleting(true);
      await notesTasksApi.deleteTask(deleteConfirmTask.tag_id);
      setTasks((prev) => prev.filter((t) => t.tag_id !== deleteConfirmTask.tag_id));
      showToast("Task deleted successfully");
      setDeleteConfirmTask(null);
    } catch (err: any) {
      setError(err?.message || "Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  };

  // Inline Comment submission
  const handleAddInlineComment = async (taskId: string | number, taggedUserVal?: string) => {
    const text = (inlineCommentInputs[String(taskId)] || "").trim();
    if (!text) return;

    try {
      setSubmittingCommentTaskId(taskId);
      const tagged = taggedUserVal || currentUser?.name || "User";
      await notesTasksApi.addTaskComment({
        tag_id: taskId,
        comment: text,
        tagged,
      });

      const newComment: TaskComment = {
        comment: text,
        tagged,
        created_by: currentUser?.name || currentUser?.email || "You",
        created_at: new Date().toISOString(),
      };

      setTasks((prev) =>
        prev.map((t) => {
          if (t.tag_id === taskId) {
            return { ...t, comments: [...(t.comments || []), newComment] };
          }
          return t;
        })
      );

      setInlineCommentInputs((prev) => ({ ...prev, [String(taskId)]: "" }));
      showToast("Comment posted");
    } catch (err: any) {
      setError(err?.message || "Failed to add comment");
    } finally {
      setSubmittingCommentTaskId(null);
    }
  };

  // Filtered tasks calculation
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // User filter
      if (selectedUserFilter !== "all") {
        const userMatch =
          String(t.tagged) === selectedUserFilter ||
          String(t.tagged_by) === selectedUserFilter ||
          String(t.account_id) === selectedUserFilter;
        if (!userMatch) return false;
      }

      // Type filter
      if (selectedTypeFilter !== "all") {
        const typeStr = (t.type || "general").toLowerCase();
        if (typeStr !== selectedTypeFilter.toLowerCase()) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesMsg = t.tag_message?.toLowerCase().includes(q);
        const matchesTagId = String(t.tag_id).includes(q);
        const matchesTagged = getAdminName(t.tagged).toLowerCase().includes(q);
        const matchesTaggedBy = getAdminName(t.tagged_by).toLowerCase().includes(q);
        if (!matchesMsg && !matchesTagId && !matchesTagged && !matchesTaggedBy) return false;
      }

      return true;
    });
  }, [tasks, selectedUserFilter, selectedTypeFilter, searchQuery, getAdminName]);

  // Metrics
  const totalTasks = tasks.length;
  const createdTasks = useMemo(() => tasks.filter((t) => !t.status || t.status === "created"), [tasks]);
  const inProgressTasks = useMemo(() => tasks.filter((t) => t.status === "progress"), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((t) => t.status === "completed"), [tasks]);
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  // Kanban Columns
  const kanbanCreated = useMemo(
    () => filteredTasks.filter((t) => !t.status || t.status === "created"),
    [filteredTasks]
  );
  const kanbanProgress = useMemo(
    () => filteredTasks.filter((t) => t.status === "progress"),
    [filteredTasks]
  );
  const kanbanCompleted = useMemo(
    () => filteredTasks.filter((t) => t.status === "completed"),
    [filteredTasks]
  );

  // Format date helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  // Render a Single Task Item Card
  const renderTaskCard = (task: TaskItem) => {
    const isCommentsOpen = Boolean(expandedComments[String(task.tag_id)]);
    const commentsCount = task.comments?.length || 0;
    const taskStatus = (task.status as TaskStatusType) || "created";
    const creatorName = getAdminName(task.tagged_by || task.account_id);
    const assignedName = getAdminName(task.tagged);

    return (
      <div
        key={task.tag_id}
        className={`task-item-card ${draggedTaskId === task.tag_id ? "is-dragging" : ""}`}
        draggable
        onDragStart={(e) => handleDragStart(e, task.tag_id)}
      >
        {/* Card Header */}
        <div className="task-card-header">
          <span className="task-id-badge">Tag: #{task.tag_id}</span>
          <span className={`task-type-badge ${task.type === "chat" ? "chat" : "general"}`}>
            {task.type || "General"}
          </span>
          <span className="task-date-text">{formatDate(task.created_at)}</span>
        </div>

        {/* Card Body */}
        <div className="task-card-body">
          <p className="task-message-text">{task.tag_message}</p>

          {/* Assignee mention */}
          <div className="task-tagged-pill">
            <span
              className="task-avatar"
              style={{
                backgroundColor: getAvatarColor(assignedName),
                width: 16,
                height: 16,
                fontSize: "0.55rem",
              }}
            >
              {getInitials(assignedName)}
            </span>
            <span>@{assignedName}</span>
          </div>

          {/* If Chat Type: Driver info */}
          {task.type === "chat" && task.driver_id && (
            <div className="task-driver-info">
              <span>Driver: {task.driver_id}</span>
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="task-card-footer">
          {/* Creator Avatar & Name */}
          <div className="task-creator-info" title={`Created by: ${creatorName}`}>
            <span
              className="task-avatar"
              style={{ backgroundColor: getAvatarColor(creatorName) }}
            >
              {getInitials(creatorName)}
            </span>
            <span>{creatorName}</span>
          </div>

          {/* Action Group */}
          <div className="task-actions-group">
            {/* Status Dropdown */}
            <select
              value={taskStatus}
              onChange={(e) => handleUpdateStatus(task.tag_id, e.target.value as TaskStatusType)}
              className="task-status-select"
              title="Change Status"
            >
              <option value="created">To Do</option>
              <option value="progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            {/* Comments Toggle Button with Badge */}
            <button
              type="button"
              onClick={() =>
                setExpandedComments((prev) => ({
                  ...prev,
                  [String(task.tag_id)]: !prev[String(task.tag_id)],
                }))
              }
              className={`task-comment-btn ${commentsCount > 0 ? "has-comments" : ""}`}
              title={`${commentsCount} Comments - Click to toggle discussion`}
            >
              <MessageSquare size={12} />
              {commentsCount > 0 && <span className="task-comment-count">{commentsCount}</span>}
            </button>

            {/* Delete Button */}
            <button
              type="button"
              onClick={() => setDeleteConfirmTask(task)}
              className="task-delete-btn"
              title="Delete Task"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Collapsible Comments Section */}
        {isCommentsOpen && (
          <div className="task-comments-panel">
            {/* Past Comments */}
            {task.comments && task.comments.length > 0 ? (
              <div className="task-comments-list">
                {task.comments.map((c, i) => (
                  <div key={c._id || i} className="task-comment-bubble">
                    <span
                      className="task-avatar"
                      style={{
                        backgroundColor: getAvatarColor(c.created_by || c.tagged || "User"),
                        width: 18,
                        height: 18,
                        fontSize: "0.6rem",
                      }}
                    >
                      {getInitials(c.created_by || c.tagged || "U")}
                    </span>
                    <div className="task-comment-content">
                      <div className="task-comment-author-row">
                        <span className="task-comment-author">
                          {c.created_by || getAdminName(c.tagged)}
                        </span>
                        {c.created_at && (
                          <span className="task-comment-date">{formatDate(c.created_at)}</span>
                        )}
                      </div>
                      <p className="task-comment-text">{c.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: "0.725rem", color: "#94A3B8", textAlign: "center", padding: "4px 0" }}>
                No comments yet. Start the conversation below.
              </div>
            )}

            {/* Comment Input */}
            <div className="task-comment-input-row">
              <input
                type="text"
                placeholder="Write a comment..."
                value={inlineCommentInputs[String(task.tag_id)] || ""}
                onChange={(e) =>
                  setInlineCommentInputs((prev) => ({
                    ...prev,
                    [String(task.tag_id)]: e.target.value,
                  }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddInlineComment(task.tag_id, task.tagged);
                  }
                }}
                className="task-comment-input"
              />
              <button
                type="button"
                onClick={() => handleAddInlineComment(task.tag_id, task.tagged)}
                disabled={
                  submittingCommentTaskId === task.tag_id ||
                  !(inlineCommentInputs[String(task.tag_id)] || "").trim()
                }
                className="task-comment-send-btn"
                title="Post Comment"
              >
                <Send size={12} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isAddModalOpen) {
    return (
      <div className="operations-main-content scrollable">
        <AddTaskModal
          isOpen={true}
          embedded={true}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleCreateTask}
        />
      </div>
    );
  }

  return (
    <div className="tasks-main-container">
      <div className="tasks-card-container">
        {/* 1. TOP HEADER & ACTION */}
        <div className="tasks-top-header">
          <div className="tasks-header-left">
            <div className="tasks-title-row">
              <h1 className="tasks-title">Tasks & Daily Duties</h1>
              <span className="tasks-station-badge">
                <span className="live-dot" />
                <span>Station: {activeStationCode}</span>
              </span>
            </div>
            <p className="tasks-subtitle">
              Manage operational action items, assign tasks to dispatchers & drivers
            </p>
          </div>

          <div className="tasks-header-right">
            {/* Rule 3: Blue button with pure white text and icon */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="btn-add-task"
            >
              <Plus size={15} style={{ color: "#FFFFFF" }} />
              <span style={{ color: "#FFFFFF" }}>Add Task</span>
            </button>
          </div>
        </div>

        {/* 2. SECONDARY FILTER TOOLBAR */}
        <div className="tasks-filter-toolbar">
          <div className="tasks-toolbar-left">
            {/* Filter by User */}
            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
              className="tasks-select-filter"
              title="Filter by Admin / User"
            >
              <option value="all">All Users</option>
              {admins.map((adm) => (
                <option key={adm.id || adm.account_id} value={String(adm.account_id || adm.id)}>
                  {adm.name || adm.email}
                </option>
              ))}
            </select>

            {/* Filter by Type */}
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="tasks-select-filter"
              title="Filter by Type"
            >
              <option value="all">All Types</option>
              <option value="general">General</option>
              <option value="chat">Chat</option>
            </select>

            {/* Search Input */}
            <div className="tasks-search-wrap">
              <Search size={14} className="tasks-search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="tasks-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="tasks-search-clear"
                  title="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="tasks-toolbar-right">
            {/* Week Picker Navigation */}
            <div className="tasks-week-nav">
              <button
                type="button"
                onClick={() => setCurrentWeekOffset((prev) => prev - 1)}
                className="tasks-week-nav-btn"
                title="Previous week"
              >
                <ChevronLeft size={14} />
              </button>

              <div
                className="tasks-week-display"
                onClick={() => setCurrentWeekOffset(0)}
                title="Click to jump to current week"
              >
                <Calendar size={13} style={{ color: "#2563EB" }} />
                <span>{weekFormatted}</span>
              </div>

              <button
                type="button"
                onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
                className="tasks-week-nav-btn"
                title="Next week"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Current week reset button */}
            {currentWeekOffset !== 0 && (
              <button
                type="button"
                onClick={() => setCurrentWeekOffset(0)}
                className="tasks-reset-week-btn"
              >
                This Week
              </button>
            )}

            {/* Refresh Button */}
            <button
              type="button"
              onClick={fetchTasks}
              disabled={isLoading}
              className="tasks-tool-btn"
              title="Refresh tasks"
            >
              <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
            </button>

            {/* View Mode Toggle */}
            <div className="tasks-view-toggle">
              <button
                type="button"
                onClick={() => setViewMode("kanban")}
                className={`tasks-view-btn ${viewMode === "kanban" ? "active" : ""}`}
                title="Kanban Board View"
              >
                <LayoutGrid size={13} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`tasks-view-btn ${viewMode === "list" ? "active" : ""}`}
                title="Dense List View"
              >
                <ListIcon size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* 3. KPI STAT STRIP */}
        <div className="tasks-kpi-bar">
          <div className="tasks-kpi-item">
            <div className="tasks-kpi-icon blue">
              <CheckSquare size={16} />
            </div>
            <div className="tasks-kpi-text">
              <span className="tasks-kpi-label">Total Tasks</span>
              <div className="tasks-kpi-value-row">
                <span className="tasks-kpi-value">{totalTasks}</span>
                <span className="tasks-kpi-subtext">this week</span>
              </div>
            </div>
          </div>

          <div className="tasks-kpi-item">
            <div className="tasks-kpi-icon slate">
              <Clock size={16} />
            </div>
            <div className="tasks-kpi-text">
              <span className="tasks-kpi-label">To Do</span>
              <div className="tasks-kpi-value-row">
                <span className="tasks-kpi-value">{createdTasks.length}</span>
                <span className="tasks-kpi-subtext">pending</span>
              </div>
            </div>
          </div>

          <div className="tasks-kpi-item">
            <div className="tasks-kpi-icon amber">
              <PlayCircle size={16} />
            </div>
            <div className="tasks-kpi-text">
              <span className="tasks-kpi-label">In Progress</span>
              <div className="tasks-kpi-value-row">
                <span className="tasks-kpi-value">{inProgressTasks.length}</span>
                <span className="tasks-kpi-subtext">underway</span>
              </div>
            </div>
          </div>

          <div className="tasks-kpi-item">
            <div className="tasks-kpi-icon emerald">
              <CheckCircle2 size={16} />
            </div>
            <div className="tasks-kpi-text">
              <span className="tasks-kpi-label">Completed</span>
              <div className="tasks-kpi-value-row">
                <span className="tasks-kpi-value">{completedTasks.length}</span>
                <span className="tasks-kpi-subtext">{completionRate}% rate</span>
              </div>
            </div>
          </div>
        </div>

        {/* Toast / Alert Feedback */}
        {successToast && (
          <div
            style={{
              padding: "0.5rem 1.25rem",
              backgroundColor: "#ECFDF5",
              color: "#065F46",
              borderBottom: "1px solid #A7F3D0",
              fontSize: "0.775rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CheckCircle2 size={15} style={{ color: "#059669" }} />
              <span>{successToast}</span>
            </div>
            <button
              onClick={() => setSuccessToast(null)}
              style={{ background: "none", border: "none", color: "#065F46", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "0.5rem 1.25rem",
              backgroundColor: "#FEF2F2",
              color: "#991B1B",
              borderBottom: "1px solid #FECACA",
              fontSize: "0.775rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <AlertCircle size={15} style={{ color: "#DC2626" }} />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              style={{ background: "none", border: "none", color: "#991B1B", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>
        )}

        {/* 4. MAIN CONTENT: KANBAN BOARD OR LIST VIEW */}
        {viewMode === "kanban" ? (
          <div className="tasks-board-grid">
            {/* Column 1: Created / To Do */}
            <div className="tasks-column">
              <div className="tasks-column-header created">
                <div className="tasks-column-title-wrap">
                  <span className="tasks-column-dot created" />
                  <h3 className="tasks-column-title">To Do</h3>
                </div>
                <span className="tasks-column-count">{kanbanCreated.length}</span>
              </div>
              <div
                className={`tasks-column-body ${dragOverColumn === "created" ? "drag-over" : ""}`}
                onDragOver={(e) => handleDragOver(e, "created")}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={(e) => handleDrop(e, "created")}
              >
                {kanbanCreated.length > 0 ? (
                  kanbanCreated.map(renderTaskCard)
                ) : (
                  <div className="tasks-column-empty">
                    <CheckSquare size={28} />
                    <span className="tasks-column-empty-text">No tasks to do</span>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: In Progress */}
            <div className="tasks-column">
              <div className="tasks-column-header progress">
                <div className="tasks-column-title-wrap">
                  <span className="tasks-column-dot progress" />
                  <h3 className="tasks-column-title">In Progress</h3>
                </div>
                <span className="tasks-column-count">{kanbanProgress.length}</span>
              </div>
              <div
                className={`tasks-column-body ${dragOverColumn === "progress" ? "drag-over" : ""}`}
                onDragOver={(e) => handleDragOver(e, "progress")}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={(e) => handleDrop(e, "progress")}
              >
                {kanbanProgress.length > 0 ? (
                  kanbanProgress.map(renderTaskCard)
                ) : (
                  <div className="tasks-column-empty">
                    <PlayCircle size={28} />
                    <span className="tasks-column-empty-text">No tasks in progress</span>
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: Completed */}
            <div className="tasks-column">
              <div className="tasks-column-header completed">
                <div className="tasks-column-title-wrap">
                  <span className="tasks-column-dot completed" />
                  <h3 className="tasks-column-title">Completed</h3>
                </div>
                <span className="tasks-column-count">{kanbanCompleted.length}</span>
              </div>
              <div
                className={`tasks-column-body ${dragOverColumn === "completed" ? "drag-over" : ""}`}
                onDragOver={(e) => handleDragOver(e, "completed")}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={(e) => handleDrop(e, "completed")}
              >
                {kanbanCompleted.length > 0 ? (
                  kanbanCompleted.map(renderTaskCard)
                ) : (
                  <div className="tasks-column-empty">
                    <CheckCircle2 size={28} />
                    <span className="tasks-column-empty-text">No completed tasks</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* List View Alternative */
          <div className="tasks-list-view-wrap">
            <table className="tasks-table">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>Tag ID</th>
                  <th>Task Message</th>
                  <th style={{ width: 140 }}>Assigned To</th>
                  <th style={{ width: 130 }}>Created By</th>
                  <th style={{ width: 100 }}>Type</th>
                  <th style={{ width: 120 }}>Status</th>
                  <th style={{ width: 110 }}>Created Date</th>
                  <th style={{ width: 110, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => {
                    const assignedName = getAdminName(task.tagged);
                    const creatorName = getAdminName(task.tagged_by || task.account_id);
                    const status = (task.status as TaskStatusType) || "created";
                    return (
                      <tr key={task.tag_id}>
                        <td style={{ fontWeight: 700, color: "#2563EB" }}>#{task.tag_id}</td>
                        <td style={{ fontWeight: 500 }}>{task.tag_message}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <span
                              className="task-avatar"
                              style={{
                                backgroundColor: getAvatarColor(assignedName),
                                width: 18,
                                height: 18,
                                fontSize: "0.6rem",
                              }}
                            >
                              {getInitials(assignedName)}
                            </span>
                            <span>{assignedName}</span>
                          </div>
                        </td>
                        <td>{creatorName}</td>
                        <td>
                          <span
                            className={`task-type-badge ${task.type === "chat" ? "chat" : "general"}`}
                          >
                            {task.type || "General"}
                          </span>
                        </td>
                        <td>
                          <select
                            value={status}
                            onChange={(e) =>
                              handleUpdateStatus(task.tag_id, e.target.value as TaskStatusType)
                            }
                            className="task-status-select"
                          >
                            <option value="created">To Do</option>
                            <option value="progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        </td>
                        <td style={{ color: "#64748B", fontSize: "0.75rem" }}>
                          {formatDate(task.created_at)}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedComments((prev) => ({
                                  ...prev,
                                  [String(task.tag_id)]: !prev[String(task.tag_id)],
                                }))
                              }
                              className={`task-comment-btn ${
                                (task.comments?.length || 0) > 0 ? "has-comments" : ""
                              }`}
                              title="Comments"
                            >
                              <MessageSquare size={12} />
                              {(task.comments?.length || 0) > 0 && (
                                <span className="task-comment-count">{task.comments?.length}</span>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmTask(task)}
                              className="task-delete-btn"
                              title="Delete Task"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "#94A3B8" }}>
                      No tasks found for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>



      {/* Delete Confirmation Modal */}
      {deleteConfirmTask && (
        <div
          className="tasks-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) setDeleteConfirmTask(null);
          }}
        >
          <div className="tasks-modal-card" style={{ maxWidth: 440 }}>
            <div className="tasks-modal-header">
              <h2 className="tasks-modal-title" style={{ color: "#EF4444" }}>
                Delete Task #{deleteConfirmTask.tag_id}
              </h2>
              <button
                type="button"
                onClick={() => setDeleteConfirmTask(null)}
                className="tasks-modal-close-btn"
              >
                <X size={16} />
              </button>
            </div>
            <div className="tasks-modal-body">
              <p style={{ margin: 0, fontSize: "0.8125rem", color: "#334155", lineHeight: 1.5 }}>
                Are you sure you want to permanently delete this task?
              </p>
              <div
                style={{
                  padding: "0.65rem 0.85rem",
                  backgroundColor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "8px",
                  fontSize: "0.775rem",
                  color: "#1E293B",
                  fontStyle: "italic",
                }}
              >
                "{deleteConfirmTask.tag_message}"
              </div>
            </div>
            <div className="tasks-modal-footer">
              <button
                type="button"
                onClick={() => setDeleteConfirmTask(null)}
                disabled={isDeleting}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{
                  backgroundColor: "#EF4444",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "7px",
                  padding: "0.45rem 0.95rem",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {isDeleting ? "Deleting..." : "Delete Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksManagementView;
