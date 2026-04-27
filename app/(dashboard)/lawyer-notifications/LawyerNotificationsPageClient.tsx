"use client";

import { Fragment, useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { subscribeToNotificationRefresh } from "@/app/components/PusherNotifications";
import { useSelectedPatient } from "@/app/components/SelectedPatientProvider";
import {
  addLawyerTaskNote,
  deleteLawyerTask,
  getLawyerTaskNotes,
  getLawyerTasks,
  getOpenEmrDocumentUrl,
  updateLawyerTaskStatus,
  type LawyerTask,
  type LawyerTaskNote,
} from "@/lib/lawyer-notifications";

const priorityOptions = [
  { value: "", label: "All" },
  { value: "1", label: "Low" },
  { value: "2", label: "Medium" },
  { value: "3", label: "High" },
];

const statusOptions = [
  { value: "", label: "All" },
  { value: "99", label: "Not Completed" },
  { value: "1", label: "Pending" },
  { value: "2", label: "Completed" },
  { value: "3", label: "In Progress" },
];

interface TaskNotificationsPageConfig {
  taskType?: number;
  authorization?: number;
  titleFilter?: string;
  title?: string;
  partyLabel?: string;
  hideMessageType?: boolean;
  hidePartyColumn?: boolean;
}

const formatTaskDateOnly = (value: string | null) => {
  if (!value) {
    return "N/A";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-US");
};

export default function LawyerNotificationsPageClient({
  taskType = 1,
  authorization = 0,
  titleFilter = "",
  title = "Lawyer Notifications",
  partyLabel = "Lawyer",
  hideMessageType = false,
  hidePartyColumn = false,
}: TaskNotificationsPageConfig = {}) {
  const router = useRouter();
  const { selectPatient } = useSelectedPatient();
  const [tasks, setTasks] = useState<LawyerTask[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [filteredItems, setFilteredItems] = useState(0);
  const [lawyerFilter, setLawyerFilter] = useState("");
  const [patientFilter, setPatientFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("99");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [busyTaskId, setBusyTaskId] = useState<number | null>(null);
  const [notesByTaskId, setNotesByTaskId] = useState<Record<number, LawyerTaskNote[]>>({});
  const [openNotesTaskId, setOpenNotesTaskId] = useState<number | null>(null);
  const [notesLoadingTaskId, setNotesLoadingTaskId] = useState<number | null>(null);
  const [replyTask, setReplyTask] = useState<LawyerTask | null>(null);
  const [detailTask, setDetailTask] = useState<LawyerTask | null>(null);
  const [detailStatus, setDetailStatus] = useState("");
  const [replyText, setReplyText] = useState("");
  const [isSavingReply, setIsSavingReply] = useState(false);
  const [documentPreview, setDocumentPreview] = useState<{ url: string; title: string } | null>(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredItems / pageSize)),
    [filteredItems, pageSize],
  );
  const showingStart = filteredItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const showingEnd = Math.min(page * pageSize, filteredItems);
  const tableColumnCount = 9 - (hideMessageType ? 1 : 0) - (hidePartyColumn ? 1 : 0);

  const fetchTasks = useCallback(async (nextPage = page) => {
    setLoading(true);
    setError("");

    try {
      const result = await getLawyerTasks({
        page: nextPage,
        pageSize,
        type: taskType,
        authorization,
        title: titleFilter,
        lawyer: lawyerFilter,
        patient: patientFilter,
        priority: priorityFilter,
        status: statusFilter,
      });

      setTasks(result.tasks);
      setTotalItems(result.totalItems);
      setFilteredItems(result.filteredItems);
      setPage(result.page);
    } catch (err) {
      console.error("Failed to load lawyer task notifications:", err);
      setTasks([]);
      setTotalItems(0);
      setFilteredItems(0);
      setError("Unable to load lawyer notifications right now.");
    } finally {
      setLoading(false);
    }
  }, [authorization, lawyerFilter, page, pageSize, patientFilter, priorityFilter, statusFilter, taskType, titleFilter]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchTasks(page);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [fetchTasks, page]);

  useEffect(() => {
    return subscribeToNotificationRefresh(() => {
      void fetchTasks(page);
    });
  }, [fetchTasks, page]);

  const handleFilterSubmit = (event?: FormEvent) => {
    event?.preventDefault();
    setPage(1);
    void fetchTasks(1);
  };

  const handleOpenPatient = (task: LawyerTask) => {
    if (!task.pid) {
      return;
    }

    selectPatient({
      pid: task.pid,
      uuid: null,
      name: task.patientName || `Patient ${task.pid}`,
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

  const handleViewDocument = (task: LawyerTask) => {
    if (!task.pid || !task.documentId) {
      return;
    }

    setDocumentPreview({
      url: getOpenEmrDocumentUrl(task.pid, task.documentId),
      title: `${task.patientName || "Patient"} - Document #${task.documentId}`,
    });
  };

  const handleStatusChange = async (task: LawyerTask, status: number) => {
    setBusyTaskId(task.id);
    setActionMessage("");

    try {
      await updateLawyerTaskStatus(task.id, status);
      setActionMessage("Task status updated.");
      await fetchTasks(page);
    } catch (err) {
      console.error("Failed to update task status:", err);
      setError("Unable to update task status.");
    } finally {
      setBusyTaskId(null);
    }
  };

  const handleDeleteTask = async (task: LawyerTask) => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    setBusyTaskId(task.id);
    setActionMessage("");

    try {
      await deleteLawyerTask(task.id);
      setActionMessage("Task deleted.");
      await fetchTasks(page);
    } catch (err) {
      console.error("Failed to delete task:", err);
      setError("Unable to delete task.");
    } finally {
      setBusyTaskId(null);
    }
  };

  const loadTaskNotes = async (task: LawyerTask) => {
    if (notesByTaskId[task.id]) {
      return;
    }

    setNotesLoadingTaskId(task.id);

    try {
      const notes = await getLawyerTaskNotes(task.id);
      setNotesByTaskId((current) => ({ ...current, [task.id]: notes }));
    } catch (err) {
      console.error("Failed to load task notes:", err);
      setNotesByTaskId((current) => ({ ...current, [task.id]: [] }));
      setError("Unable to load task notes.");
    } finally {
      setNotesLoadingTaskId(null);
    }
  };

  const handleToggleNotes = async (task: LawyerTask) => {
    if (openNotesTaskId === task.id) {
      setOpenNotesTaskId(null);
      return;
    }

    setOpenNotesTaskId(task.id);
    await loadTaskNotes(task);
  };

  const handleOpenTaskDetails = async (task: LawyerTask) => {
    setDetailTask(task);
    setDetailStatus(String(task.status || 1));
    await loadTaskNotes(task);
  };

  const handleSaveReply = async () => {
    if (!replyTask || !replyText.trim()) {
      return;
    }

    setIsSavingReply(true);
    setActionMessage("");

    try {
      await addLawyerTaskNote({
        taskId: replyTask.id,
        pid: replyTask.pid,
        note: replyText.trim(),
      });
      setActionMessage("Reply added.");
      setNotesByTaskId((current) => {
        const next = { ...current };
        delete next[replyTask.id];
        return next;
      });
      setReplyTask(null);
      setReplyText("");
      await fetchTasks(page);
    } catch (err) {
      console.error("Failed to add task reply:", err);
      setError("Unable to save reply.");
    } finally {
      setIsSavingReply(false);
    }
  };

  const handleSaveTaskDetails = async () => {
    if (!detailTask || !detailStatus) {
      return;
    }

    const nextStatus = Number(detailStatus);
    if (nextStatus === detailTask.status) {
      setDetailTask(null);
      return;
    }

    await handleStatusChange(detailTask, nextStatus);
    setDetailTask(null);
  };

  const renderStatusActions = (task: LawyerTask) => {
    if (task.type === 2) {
      return null;
    }

    if (task.status === 1) {
      return (
        <>
          <button className="emr-btn warning" disabled={busyTaskId === task.id} onClick={() => void handleStatusChange(task, 3)} type="button">
            Move to In Progress
          </button>
          <button className="emr-btn success" disabled={busyTaskId === task.id} onClick={() => void handleStatusChange(task, 2)} type="button">
            Mark Completed
          </button>
        </>
      );
    }

    if (task.status === 3) {
      return (
        <button className="emr-btn success" disabled={busyTaskId === task.id} onClick={() => void handleStatusChange(task, 2)} type="button">
          Mark Completed
        </button>
      );
    }

    if (task.status === 2) {
      return (
        <button className="emr-btn warning" disabled={busyTaskId === task.id} onClick={() => void handleStatusChange(task, 3)} type="button">
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
          <div className="lawyer-emr-title">
            {title}
          </div>
        </div>

        <form className="lawyer-emr-filters" onSubmit={handleFilterSubmit}>
          <label>
            {partyLabel}:
            <input value={lawyerFilter} onChange={(event) => setLawyerFilter(event.target.value)} placeholder={`Search ${partyLabel}`} />
          </label>
          <label>
            Patient:
            <input value={patientFilter} onChange={(event) => setPatientFilter(event.target.value)} placeholder="Search Patient" />
          </label>
          <label>
            Priority:
            <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label>
            Status:
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <button className="emr-btn primary" type="submit" disabled={loading}>
            {loading ? "Loading..." : "Filter / Refresh"}
          </button>
        </form>

        {(error || actionMessage) && (
          <div className={`lawyer-emr-message${error ? " error" : ""}`}>
            {error || actionMessage}
          </div>
        )}

        <div className="lawyer-emr-table-controls">
          <label>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            entries per page
          </label>
        </div>

        <div className="lawyer-emr-table-wrap">
          <table className="lawyer-emr-table">
            <thead>
              <tr>
                {!hidePartyColumn && <th>{partyLabel}</th>}
                <th>Patient</th>
                <th>Staff</th>
                {!hideMessageType && <th>Message Type</th>}
                <th>Description</th>
                <th>Priority</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={tableColumnCount}>Loading...</td>
                </tr>
              )}
              {!loading && tasks.length === 0 && (
                <tr>
                  <td colSpan={tableColumnCount}>No data found</td>
                </tr>
              )}
              {!loading && tasks.map((task) => (
                <Fragment key={task.id}>
                  <tr key={task.id}>
                    {!hidePartyColumn && (
                      <td>
                        {task.lawyerName || "N/A"}
                      </td>
                    )}
                    <td>
                      <button className="link-button" type="button" onClick={() => handleOpenPatient(task)}>
                        {task.patientName || "N/A"}
                      </button>
                    </td>
                    <td>{task.staffNames.length > 0 ? task.staffNames.map((name) => <div key={`${task.id}-${name}`}>{name}</div>) : ""}</td>
                    {!hideMessageType && (
                      <td>
                        <button
                          className="link-button"
                          type="button"
                          onClick={() => void handleOpenTaskDetails(task)}
                        >
                          {task.title}
                        </button>
                      </td>
                    )}
                    <td className="lawyer-emr-description">
                      <button
                        className="link-button"
                        type="button"
                        onClick={() => void handleOpenTaskDetails(task)}
                      >
                        {task.description}
                      </button>
                    </td>
                    <td>{task.priorityLabel}</td>
                    <td>{task.taskDate}</td>
                    <td>{task.statusLabel}</td>
                    <td>
                      <div className="lawyer-emr-actions">
                        <button className="emr-btn default" type="button" onClick={() => setReplyTask(task)}>
                          Reply
                        </button>
                        {task.notesCount > 0 && (
                          <button className="emr-btn info" type="button" onClick={() => void handleToggleNotes(task)}>
                            View Notes ({task.notesCount})
                          </button>
                        )}
                        {task.pid && task.documentId ? (
                          <button className="emr-btn primary" type="button" onClick={() => handleViewDocument(task)}>
                            View Document
                          </button>
                        ) : null}
                        {renderStatusActions(task)}
                        <button className="emr-btn danger" disabled={busyTaskId === task.id} type="button" onClick={() => void handleDeleteTask(task)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  {openNotesTaskId === task.id && (
                    <tr key={`${task.id}-notes`}>
                      <td colSpan={tableColumnCount}>
                        <div className="lawyer-emr-notes">
                          {notesLoadingTaskId === task.id && <div>Loading notes...</div>}
                          {notesLoadingTaskId !== task.id && (notesByTaskId[task.id] ?? []).length === 0 && <div>No notes found.</div>}
                          {notesLoadingTaskId !== task.id && (notesByTaskId[task.id] ?? []).length > 0 && (
                            <table className="lawyer-emr-notes-table">
                              <thead>
                                <tr>
                                  <th>Note</th>
                                  <th>Added By</th>
                                  <th>Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(notesByTaskId[task.id] ?? []).map((note) => (
                                  <tr key={`${task.id}-${note.id}-${note.createdAt}`}>
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
          <div>
            Showing {showingStart} to {showingEnd} of {filteredItems} entries
            {filteredItems !== totalItems ? ` (filtered from ${totalItems} total entries)` : ""}
          </div>
          <div className="lawyer-emr-pagination">
            <button className="emr-page-btn" disabled={loading || page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} type="button">
              ‹
            </button>
            <button className="emr-page-btn active" type="button">{page}</button>
            <button className="emr-page-btn" disabled={loading || page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} type="button">
              ›
            </button>
          </div>
        </div>
      </div>

      {replyTask && (
        <div className="modal-backdrop show">
          <div className="modal lawyer-emr-reply-modal">
            <div className="mhead">
              <div className="mtitle">Reply to Task</div>
              <div className="right">
                <button className="mini" type="button" onClick={() => setReplyTask(null)}>Close</button>
              </div>
            </div>
            <div className="mbody">
              <div className="hint">
                {replyTask.patientName} | {replyTask.title}
              </div>
              <div className="field" style={{ marginTop: "12px" }}>
                <label>Note</label>
                <textarea value={replyText} onChange={(event) => setReplyText(event.target.value)} placeholder="Enter reply..." />
              </div>
            </div>
            <div className="mfoot">
              <button className="mini" type="button" onClick={() => setReplyTask(null)}>Cancel</button>
              <button className="mini primary" type="button" disabled={isSavingReply || !replyText.trim()} onClick={() => void handleSaveReply()}>
                {isSavingReply ? "Saving..." : "Save Reply"}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailTask && (
        <div className="modal-backdrop show">
          <div className="modal lawyer-emr-task-form-modal">
            <div className="mhead">
              <div className="mtitle">Edit Task</div>
              <div className="right">
                <button className="mini" type="button" onClick={() => setDetailTask(null)}>Close</button>
              </div>
            </div>
            <div className="mbody">
              <table className="lawyer-task-form-table">
                <tbody>
                  <tr>
                    <td colSpan={2}>
                      <h4 className="lawyer-task-form-heading">
                        Edit Task
                        <span className="lawyer-task-patient-summary">
                          Patient: {detailTask.patientName || "N/A"}
                          <br />
                          DOB: {formatTaskDateOnly(detailTask.dob)}
                          <br />
                          DOI: {formatTaskDateOnly(detailTask.doi)}
                        </span>
                      </h4>
                    </td>
                  </tr>
                  <tr>
                    <td className="lawyer-task-form-label">Title:</td>
                    <td>
                      <input className="lawyer-task-form-control" disabled value={detailTask.title || ""} readOnly />
                    </td>
                  </tr>
                  <tr>
                    <td className="lawyer-task-form-label">Description:</td>
                    <td>
                      <textarea className="lawyer-task-form-control lawyer-task-form-textarea" disabled value={detailTask.description || ""} readOnly />
                    </td>
                  </tr>
                  <tr>
                    <td className="lawyer-task-form-label">Status:</td>
                    <td>
                      <select className="lawyer-task-form-select" value={detailStatus} onChange={(event) => setDetailStatus(event.target.value)}>
                        <option value="1">Pending</option>
                        <option value="2">Done</option>
                        <option value="3">In Progress</option>
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td className="lawyer-task-form-label">Priority:</td>
                    <td>
                      <select className="lawyer-task-form-select" disabled value={detailTask.priorityLabel === "High" ? "3" : detailTask.priorityLabel === "Medium" ? "2" : "1"}>
                        <option value="1">Low</option>
                        <option value="2">Medium</option>
                        <option value="3">High</option>
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td className="lawyer-task-form-label">Document:</td>
                    <td>
                      <input className="lawyer-task-form-control-file" disabled type="file" />
                      {detailTask.documentId ? (
                        <div className="hint" style={{ marginTop: "8px" }}>
                          Attached document #{detailTask.documentId}
                          {detailTask.pid ? (
                            <button
                              className="emr-btn primary"
                              style={{ marginLeft: "8px" }}
                              type="button"
                              onClick={() => handleViewDocument(detailTask)}
                            >
                              View Document
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                </tbody>
              </table>

              <hr />

              <div className="lawyer-task-notes-head">
                <h4>Task Notes</h4>
                <button className="mini primary" type="button" onClick={() => {
                  setReplyTask(detailTask);
                  setDetailTask(null);
                }}>
                  + Add Reply
                </button>
              </div>

              <table className="lawyer-emr-notes-table" style={{ marginTop: "10px" }}>
                <thead>
                  <tr>
                    <th style={{ width: "55%" }}>Note</th>
                    <th style={{ width: "20%" }}>Added By</th>
                    <th style={{ width: "25%" }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {notesLoadingTaskId === detailTask.id && (
                    <tr>
                      <td colSpan={3}>Loading notes...</td>
                    </tr>
                  )}
                  {notesLoadingTaskId !== detailTask.id && (notesByTaskId[detailTask.id] ?? []).length === 0 && (
                    <tr>
                      <td colSpan={3}>No notes found.</td>
                    </tr>
                  )}
                  {notesLoadingTaskId !== detailTask.id && (notesByTaskId[detailTask.id] ?? []).map((note) => (
                    <tr key={`${detailTask.id}-modal-${note.id}-${note.createdAt}`}>
                      <td>{note.note}</td>
                      <td>{note.createdBy}</td>
                      <td>{note.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mfoot">
              <button className="mini" type="button" onClick={() => setDetailTask(null)}>Cancel</button>
              <button className="mini primary" type="button" disabled={busyTaskId === detailTask.id} onClick={() => void handleSaveTaskDetails()}>
                {busyTaskId === detailTask.id ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {documentPreview && (
        <div className="modal-backdrop show">
          <div className="modal" style={{ maxWidth: "min(1100px, 96vw)", width: "96vw" }}>
            <div className="mhead">
              <div className="mtitle">{documentPreview.title}</div>
              <div className="right">
                <button className="mini" type="button" onClick={() => setDocumentPreview(null)}>Close</button>
              </div>
            </div>
            <div className="mbody" style={{ padding: 0 }}>
              <iframe
                src={documentPreview.url}
                title={documentPreview.title}
                style={{
                  border: 0,
                  display: "block",
                  height: "75vh",
                  width: "100%",
                }}
              />
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
