"use client";

import { Fragment, useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSelectedPatient } from "@/app/components/SelectedPatientProvider";
import {
  addLawyerTaskNote,
  deleteLawyerTask,
  getEmrNotifications,
  getLawyerTaskNotes,
  markEmrNotificationRead,
  updateLawyerTaskStatus,
  type EmrNotification,
  type LawyerTaskNote,
} from "@/lib/lawyer-notifications";
import { subscribeToNotificationRefresh } from "@/app/components/PusherNotifications";

const readStatusOptions = [
  { value: "0", label: "Unread" },
  { value: "", label: "All" },
  { value: "1", label: "Read" },
];

export default function EmrNotificationsPageClient() {
  const router = useRouter();
  const { selectPatient } = useSelectedPatient();
  const [notifications, setNotifications] = useState<EmrNotification[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filteredItems, setFilteredItems] = useState(0);
  const [lawyerFilter, setLawyerFilter] = useState("");
  const [patientFilter, setPatientFilter] = useState("");
  const [titleFilter, setTitleFilter] = useState("");
  const [readStatus, setReadStatus] = useState("0");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [busyTaskId, setBusyTaskId] = useState<number | null>(null);
  const [notesByTaskId, setNotesByTaskId] = useState<Record<number, LawyerTaskNote[]>>({});
  const [openNotesTaskId, setOpenNotesTaskId] = useState<number | null>(null);
  const [notesLoadingTaskId, setNotesLoadingTaskId] = useState<number | null>(null);
  const [replyNotification, setReplyNotification] = useState<EmrNotification | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSavingReply, setIsSavingReply] = useState(false);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredItems / pageSize)),
    [filteredItems, pageSize],
  );
  const showingStart = filteredItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const showingEnd = Math.min(page * pageSize, filteredItems);

  const fetchNotifications = useCallback(async (nextPage = page) => {
    setLoading(true);
    setError("");

    try {
      const result = await getEmrNotifications({
        page: nextPage,
        pageSize,
        readStatus,
        lawyer: lawyerFilter,
        patient: patientFilter,
        title: titleFilter,
      });

      setNotifications(result.notifications);
      setFilteredItems(result.filteredItems);
      setPage(result.page);
    } catch (err) {
      console.error("Failed to load EMR notifications:", err);
      setNotifications([]);
      setFilteredItems(0);
      setError("Unable to load EMR notifications right now.");
    } finally {
      setLoading(false);
    }
  }, [lawyerFilter, page, pageSize, patientFilter, readStatus, titleFilter]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchNotifications(page);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchNotifications, page]);

  useEffect(() => {
    return subscribeToNotificationRefresh(() => {
      void fetchNotifications(page);
    });
  }, [fetchNotifications, page]);

  const handleFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void fetchNotifications(1);
  };

  const handleResetFilters = () => {
    setLawyerFilter("");
    setPatientFilter("");
    setTitleFilter("");
    setReadStatus("0");
    window.setTimeout(() => {
      void fetchNotifications(1);
    }, 0);
  };

  const handleReadStatus = async (notification: EmrNotification, status: number) => {
    setBusyId(notification.id);
    setMessage("");

    try {
      await markEmrNotificationRead(notification.id, status);
      setMessage(status === 1 ? "Notification marked as read." : "Notification marked as unread.");
      await fetchNotifications(page);
    } catch (err) {
      console.error("Failed to update EMR notification read status:", err);
      setMessage("Unable to update notification status.");
    } finally {
      setBusyId(null);
    }
  };

  const handleOpenPatient = (notification: EmrNotification) => {
    if (!notification.pid) {
      return;
    }

    selectPatient({
      pid: notification.pid,
      uuid: null,
      name: notification.patientName || `Patient ${notification.pid}`,
      facilityId: null,
      dob: null,
      doi: null,
      lastUpdated: null,
      lastVisit: null,
      nextVisit: null,
      phone: null,
      email: null,
      balance: 0,
      facility: null,
      status: null,
      needsUpdate: false,
    });
    router.push("/workspace");
  };

  const handleToggleNotes = async (notification: EmrNotification) => {
    if (!notification.taskId) {
      return;
    }

    if (openNotesTaskId === notification.taskId) {
      setOpenNotesTaskId(null);
      return;
    }

    setOpenNotesTaskId(notification.taskId);
    setNotesLoadingTaskId(notification.taskId);

    try {
      const notes = await getLawyerTaskNotes(notification.taskId);
      setNotesByTaskId((current) => ({ ...current, [notification.taskId as number]: notes }));
    } catch (err) {
      console.error("Failed to load task notes:", err);
      setNotesByTaskId((current) => ({ ...current, [notification.taskId as number]: [] }));
    } finally {
      setNotesLoadingTaskId(null);
    }
  };

  const handleSaveReply = async () => {
    if (!replyNotification?.taskId || !replyText.trim()) {
      return;
    }

    setIsSavingReply(true);
    try {
      await addLawyerTaskNote({
        taskId: replyNotification.taskId,
        pid: replyNotification.pid,
        note: replyText.trim(),
      });
      setReplyText("");
      setReplyNotification(null);
      await fetchNotifications(page);
    } catch (err) {
      console.error("Failed to save task reply:", err);
      setMessage("Unable to save reply.");
    } finally {
      setIsSavingReply(false);
    }
  };

  const handleTaskStatusChange = async (notification: EmrNotification, status: number) => {
    if (!notification.taskId) {
      return;
    }

    setBusyTaskId(notification.taskId);
    try {
      await updateLawyerTaskStatus(notification.taskId, status);
      await fetchNotifications(page);
    } catch (err) {
      console.error("Failed to update task status:", err);
      setMessage("Unable to update task status.");
    } finally {
      setBusyTaskId(null);
    }
  };

  const handleDeleteTask = async (notification: EmrNotification) => {
    if (!notification.taskId || !window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    setBusyTaskId(notification.taskId);
    try {
      await deleteLawyerTask(notification.taskId);
      await fetchNotifications(page);
    } catch (err) {
      console.error("Failed to delete task:", err);
      setMessage("Unable to delete task.");
    } finally {
      setBusyTaskId(null);
    }
  };

  const renderTaskStatusActions = (notification: EmrNotification) => {
    if (!notification.taskId || notification.authorization) {
      return null;
    }

    if (notification.taskStatus === 1) {
      return (
        <>
          <button className="emr-btn warning" disabled={busyTaskId === notification.taskId} onClick={() => void handleTaskStatusChange(notification, 3)} type="button">
            Move to In Progress
          </button>
          <button className="emr-btn success" disabled={busyTaskId === notification.taskId} onClick={() => void handleTaskStatusChange(notification, 2)} type="button">
            Mark Completed
          </button>
        </>
      );
    }

    if (notification.taskStatus === 3) {
      return (
        <button className="emr-btn success" disabled={busyTaskId === notification.taskId} onClick={() => void handleTaskStatusChange(notification, 2)} type="button">
          Mark Completed
        </button>
      );
    }

    if (notification.taskStatus === 2) {
      return (
        <button className="emr-btn warning" disabled={busyTaskId === notification.taskId} onClick={() => void handleTaskStatusChange(notification, 3)} type="button">
          Move to In Progress
        </button>
      );
    }

    return null;
  };

  return (
    <section className="lawyer-emr-page">
      <div className="lawyer-emr-card">
        <div className="lawyer-emr-title-row">
          <div className="lawyer-emr-title">EMR Notifications</div>
        </div>

        <form className="lawyer-emr-filters" onSubmit={handleFilterSubmit}>
          <label>
            Lawyer:
            <input value={lawyerFilter} onChange={(event) => setLawyerFilter(event.target.value)} placeholder="Search Lawyer" />
          </label>
          <label>
            Patient:
            <input value={patientFilter} onChange={(event) => setPatientFilter(event.target.value)} placeholder="Search Patient" />
          </label>
          <label>
            Title:
            <input value={titleFilter} onChange={(event) => setTitleFilter(event.target.value)} placeholder="Search Title" />
          </label>
          <label>
            Status:
            <select value={readStatus} onChange={(event) => setReadStatus(event.target.value)}>
              {readStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <div className="lawyer-emr-filter-actions">
            <button className="emr-btn primary" type="submit">Filter</button>
            <button className="emr-btn" type="button" onClick={handleResetFilters}>Reset</button>
          </div>
        </form>

        {error && <div className="lawyer-emr-message error">{error}</div>}
        {message && <div className="lawyer-emr-message">{message}</div>}

        <div className="lawyer-emr-table-controls">
          <label>
            Show{" "}
            <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>{" "}
            entries
          </label>
        </div>

        <div className="lawyer-emr-table-wrap">
          <table className="lawyer-emr-table">
            <thead>
              <tr>
                <th>Lawyer</th>
                <th>From</th>
                <th>Patient</th>
                <th>Title</th>
                <th>Description</th>
                <th>Date</th>
                <th>Status</th>
                <th>Task Status</th>
                <th>Authorization Task</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10}>Loading notifications...</td></tr>
              ) : notifications.length === 0 ? (
                <tr><td colSpan={10}>No notifications found.</td></tr>
              ) : notifications.map((notification) => (
                <Fragment key={notification.id}>
                  <tr>
                    <td>{notification.lawyerName || "N/A"}</td>
                    <td>{notification.fromUser || "N/A"}</td>
                    <td>
                      {notification.pid ? (
                        <button className="link-button" type="button" onClick={() => handleOpenPatient(notification)}>
                          {notification.patientName || "N/A"}
                        </button>
                      ) : (
                        notification.patientName || "N/A"
                      )}
                    </td>
                    <td style={{ whiteSpace: "pre-line" }}>{notification.title || notification.taskTitle || "Notification"}</td>
                    <td style={{ whiteSpace: "pre-line" }}>{notification.message || "N/A"}</td>
                    <td>{notification.createdAt || "N/A"}</td>
                    <td>
                      <span className={`badge ${notification.isRead ? "green" : "red"}`}>
                        {notification.isRead ? "Read" : "Unread"}
                      </span>
                      {notification.readBy && (
                        <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4, whiteSpace: "pre-line" }}>
                          {notification.readBy.replace(/<br\s*\/?>/gi, "\n")}
                        </div>
                      )}
                    </td>
                    <td>{notification.taskStatusLabel || ""}</td>
                    <td>{notification.authorizationTask || "No"}</td>
                    <td>
                      <div className="lawyer-emr-actions">
                        {notification.isRead ? (
                          <button
                            className="emr-btn warning"
                            type="button"
                            disabled={busyId === notification.id}
                            onClick={() => void handleReadStatus(notification, 0)}
                          >
                            Mark as Unread
                          </button>
                        ) : (
                          <button
                            className="emr-btn primary"
                            type="button"
                            disabled={busyId === notification.id}
                            onClick={() => void handleReadStatus(notification, 1)}
                          >
                            Mark as Read
                          </button>
                        )}
                        {notification.taskId && (
                          <>
                            <button className="emr-btn default" type="button" onClick={() => setReplyNotification(notification)}>
                              Reply
                            </button>
                            <button className="emr-btn info" type="button" onClick={() => void handleToggleNotes(notification)}>
                              View Notes ({notification.notesCount})
                            </button>
                            {renderTaskStatusActions(notification)}
                            <button className="emr-btn danger" disabled={busyTaskId === notification.taskId} type="button" onClick={() => void handleDeleteTask(notification)}>
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {notification.taskId && openNotesTaskId === notification.taskId && (
                    <tr key={`${notification.id}-notes`}>
                      <td colSpan={10}>
                        <div className="lawyer-emr-notes">
                          {notesLoadingTaskId === notification.taskId && <div>Loading notes...</div>}
                          {notesLoadingTaskId !== notification.taskId && (notesByTaskId[notification.taskId] ?? []).length === 0 && <div>No notes found.</div>}
                          {notesLoadingTaskId !== notification.taskId && (notesByTaskId[notification.taskId] ?? []).length > 0 && (
                            <table className="lawyer-emr-notes-table">
                              <thead>
                                <tr>
                                  <th>Note</th>
                                  <th>Added By</th>
                                  <th>Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(notesByTaskId[notification.taskId] ?? []).map((note) => (
                                  <tr key={`${notification.taskId}-${note.id}-${note.createdAt}`}>
                                    <td>{note.note}</td>
                                    <td>{note.createdBy}</td>
                                    <td>{note.createdAt}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="lawyer-emr-footer">
          <div>Showing {showingStart} to {showingEnd} of {filteredItems} entries</div>
          <div className="lawyer-emr-pagination">
            <button className="emr-page-btn" type="button" disabled={page <= 1 || loading} onClick={() => void fetchNotifications(page - 1)}>Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button className="emr-page-btn" type="button" disabled={page >= totalPages || loading} onClick={() => void fetchNotifications(page + 1)}>Next</button>
          </div>
        </div>
      </div>
      {replyNotification && (
        <div className="modal-backdrop show">
          <div className="modal lawyer-emr-reply-modal">
            <div className="mhead">
              <div className="mtitle">Reply to Task</div>
              <div className="right">
                <button className="mini" type="button" onClick={() => setReplyNotification(null)}>Close</button>
              </div>
            </div>
            <div className="mbody">
              <div className="hint">
                {replyNotification.patientName} | {replyNotification.taskTitle || replyNotification.title}
              </div>
              <div className="field" style={{ marginTop: "12px" }}>
                <label>Note</label>
                <textarea value={replyText} onChange={(event) => setReplyText(event.target.value)} placeholder="Enter reply..." />
              </div>
            </div>
            <div className="mfoot">
              <button className="mini" type="button" onClick={() => setReplyNotification(null)}>Cancel</button>
              <button className="mini primary" type="button" disabled={isSavingReply || !replyText.trim()} onClick={() => void handleSaveReply()}>
                {isSavingReply ? "Saving..." : "Save Reply"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
