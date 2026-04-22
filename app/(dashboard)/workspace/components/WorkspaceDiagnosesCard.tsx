"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SelectedWorkspacePatient } from "@/lib/workspace";
import {
  deletePatientDiagnosis,
  getDiagnosisIssueOptions,
  getPatientDiagnoses,
  savePatientDiagnosis,
  type DiagnosisIssueOption,
  type DiagnosisIssueSubtypeOption,
  type PatientDiagnosisRecord,
} from "@/lib/diagnoses";

const diagnosesOpenStorageKey = "pi360.ws.sidebar.diagnoses.open";

interface DiagnosisDraft {
  subtypeOptionId: string;
  issueOptionIds: string[];
}

const emptyDraft: DiagnosisDraft = {
  subtypeOptionId: "",
  issueOptionIds: [],
};

export function WorkspaceDiagnosesCard({ selectedPatient }: { selectedPatient: SelectedWorkspacePatient }) {
  const [isOpen, setIsOpen] = useState(false);
  const skipPersistOnceRef = useRef(true);
  const miniToggleStyle = { minWidth: "74px", textAlign: "center" } as const;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState<DiagnosisDraft>(emptyDraft);
  const [showValidation, setShowValidation] = useState(false);

  const [diagnoses, setDiagnoses] = useState<PatientDiagnosisRecord[]>([]);
  const [diagnosesLoading, setDiagnosesLoading] = useState(false);
  const [diagnosesError, setDiagnosesError] = useState("");

  const [issueSubtypes, setIssueSubtypes] = useState<DiagnosisIssueSubtypeOption[]>([]);
  const [issueOptions, setIssueOptions] = useState<DiagnosisIssueOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState("");

  const [subtypeFilter, setSubtypeFilter] = useState("");
  const [issueFilter, setIssueFilter] = useState("");

  const summary = useMemo(() => {
    if (diagnoses.length === 0) {
      return isOpen ? "(expanded)" : "(collapsed)";
    }

    const countLabel = `${diagnoses.length} dx`;
    return isOpen ? `(expanded • ${countLabel})` : `(collapsed • ${countLabel})`;
  }, [diagnoses.length, isOpen]);

  const refreshDiagnoses = async () => {
    if (!selectedPatient.pid) {
      setDiagnoses([]);
      setDiagnosesError("");
      return;
    }

    setDiagnosesLoading(true);
    setDiagnosesError("");

    try {
      const rows = await getPatientDiagnoses(selectedPatient.pid, "medical_problem");
      setDiagnoses(rows);
    } catch (error) {
      console.error("Failed to load diagnoses:", error);
      setDiagnoses([]);
      setDiagnosesError("Unable to load diagnoses right now.");
    } finally {
      setDiagnosesLoading(false);
    }
  };

  useEffect(() => {
    try {
      const storedValue = window.sessionStorage.getItem(diagnosesOpenStorageKey);
      if (storedValue === "1") {
        queueMicrotask(() => setIsOpen(true));
      }
    } catch {
      // ignore - storage may be unavailable
    }
  }, []);

  useEffect(() => {
    if (skipPersistOnceRef.current) {
      skipPersistOnceRef.current = false;
      return;
    }

    try {
      window.sessionStorage.setItem(diagnosesOpenStorageKey, isOpen ? "1" : "0");
    } catch {
      // ignore - storage may be unavailable
    }
  }, [isOpen]);

  useEffect(() => {
    void refreshDiagnoses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPatient.pid, selectedPatient.uuid, selectedPatient.name]);

  useEffect(() => {
    let isMounted = true;

    const loadOptions = async () => {
      setOptionsLoading(true);
      setOptionsError("");

      try {
        const data = await getDiagnosisIssueOptions("medical_problem");
        if (!isMounted) {
          return;
        }

        setIssueSubtypes(data.subtypes);
        setIssueOptions(data.issues);
      } catch (error) {
        console.error("Failed to load diagnosis issue options:", error);
        if (isMounted) {
          setIssueSubtypes([]);
          setIssueOptions([]);
          setOptionsError("Unable to load diagnosis options right now.");
        }
      } finally {
        if (isMounted) {
          setOptionsLoading(false);
        }
      }
    };

    loadOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  const resetDraft = () => {
    setDraft(emptyDraft);
    setShowValidation(false);
    setSubtypeFilter("");
    setIssueFilter("");
  };

  const openAddModal = () => {
    setIsModalOpen(true);
    resetDraft();
  };

  const handleSaveDiagnosis = async (closeAfterSave: boolean) => {
    if (!selectedPatient.pid) {
      return;
    }

    setShowValidation(true);
    const selectedIssueIds = draft.issueOptionIds.map((value) => value.trim()).filter(Boolean);
    if (selectedIssueIds.length === 0) {
      return;
    }

    await savePatientDiagnosis({
      pid: selectedPatient.pid,
      issueType: "medical_problem",
      issueOptionIds: selectedIssueIds,
    });

    await refreshDiagnoses();
    if (closeAfterSave) {
      setIsModalOpen(false);
      resetDraft();
    } else {
      setShowValidation(false);
      setIssueFilter("");
      setDraft((current) => ({ ...current, issueOptionIds: [] }));
    }
  };

  const handleDeleteDiagnosis = async (diagnosisId: number) => {
    if (!selectedPatient.pid) {
      return;
    }

    const confirmed = window.confirm("Remove this diagnosis?");
    if (!confirmed) {
      return;
    }

    await deletePatientDiagnosis({
      pid: selectedPatient.pid,
      diagnosisId,
    });

    await refreshDiagnoses();
  };

  const filteredSubtypes = issueSubtypes.filter((item) =>
    subtypeFilter.trim()
      ? item.title.toLowerCase().includes(subtypeFilter.trim().toLowerCase())
      : true,
  );

  const filteredIssues = issueOptions
    .filter((item) => (draft.subtypeOptionId ? (item.subtypeId ?? "") === draft.subtypeOptionId : true))
    .filter((item) =>
      issueFilter.trim()
        ? item.title.toLowerCase().includes(issueFilter.trim().toLowerCase())
        : true,
    );

  const existingIssueIds = useMemo(() => new Set(diagnoses.map((item) => item.issueOptionId).filter(Boolean)), [diagnoses]);

  return (
    <div className="card">
      <div className="hd">
        <div className="title">🩺 Diagnoses</div>
        <div className="sub">{summary}</div>
        <div className="right">
          <button className="mini" type="button" onClick={openAddModal}>
            Manage
          </button>
          <button
            className="mini"
            type="button"
            style={miniToggleStyle}
            onClick={() => setIsOpen((current) => !current)}
          >
            {isOpen ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="bd">
          {diagnosesLoading && <div className="softbox hint">Loading diagnoses...</div>}
          {!diagnosesLoading && diagnosesError && <div className="softbox hint">{diagnosesError}</div>}

          {!diagnosesLoading && !diagnosesError && diagnoses.length === 0 && (
            <div className="hint">
              {selectedPatient.pid
                ? "Nothing recorded"
                : "This patient is read-only here. Open from Patients/Dashboard to manage diagnoses."}
            </div>
          )}

          {!diagnosesLoading && !diagnosesError && diagnoses.length > 0 && (
            <div className="grid" style={{ gap: "8px" }}>
              {diagnoses.map((item) => (
                <div key={item.id} className="note">
                  <div className="h" style={{ alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="t" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 950 }}>{item.issueTitle || "Diagnosis"}</span>
                        {item.subtypeTitle && <span className="chip">{item.subtypeTitle}</span>}
                        {item.codes && <span className="chip">{item.codes}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button className="mini bad" type="button" onClick={() => void handleDeleteDiagnosis(item.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-backdrop show" role="presentation">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="workspace-diagnoses-modal-title">
            <div className="mhead">
              <div>
                <div className="mtitle" id="workspace-diagnoses-modal-title">
                  Diagnoses
                </div>
                <div className="hint">Manage diagnoses for {selectedPatient.name || "this patient"}.</div>
              </div>
              <div className="right">
                <button
                  className="mini"
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetDraft();
                  }}
                >
                  Close
                </button>
              </div>
            </div>

            <div className="mbody">
              <div className="grid" style={{ gap: "10px" }}>
                <div className="two-col">
                  <div className="field">
                    <label>Subtype</label>
                    <input
                      value={subtypeFilter}
                      onChange={(event) => setSubtypeFilter(event.target.value)}
                      placeholder="Filter by subtype..."
                      style={{ marginBottom: "6px" }}
                    />
                    <select
                      size={8}
                      value={draft.subtypeOptionId}
                      onChange={(event) => {
                        const nextSubtype = event.target.value;
                        setIssueFilter("");
                        setDraft((current) => ({
                          ...current,
                          subtypeOptionId: nextSubtype,
                          issueOptionIds: [],
                        }));
                      }}
                      style={{ width: "100%" }}
                    >
                      <option value="">Filter by subtype...</option>
                      {filteredSubtypes.map((item) => (
                        <option key={`subtype-${item.id}`} value={item.id}>
                          {item.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>Issue (select multiple)</label>
                    <input
                      value={issueFilter}
                      onChange={(event) => setIssueFilter(event.target.value)}
                      placeholder="Select issue below..."
                      style={{ marginBottom: "6px" }}
                    />
                    <select
                      multiple
                      size={8}
                      value={draft.issueOptionIds}
                      onChange={(event) => {
                        const selected = Array.from(event.target.selectedOptions).map((option) => option.value);
                        setDraft((current) => ({ ...current, issueOptionIds: selected }));
                      }}
                      style={{ width: "100%" }}
                    >
                      <option value="">Select issue below...</option>
                      {filteredIssues.map((item) => (
                        <option
                          key={`issue-${draft.subtypeOptionId || "all"}-${item.id}`}
                          value={item.id}
                          disabled={existingIssueIds.has(item.id)}
                        >
                          {item.title}
                        </option>
                      ))}
                    </select>
                    {diagnoses.length > 0 && (
                      <div className="hint">Already-added issues are disabled.</div>
                    )}
                  </div>
                </div>

                {optionsLoading && <div className="hint">Loading diagnosis options...</div>}
                {!optionsLoading && optionsError && (
                  <div className="hint" style={{ color: "var(--bad)" }}>
                    {optionsError}
                  </div>
                )}

                {showValidation && draft.issueOptionIds.length === 0 && (
                  <div className="hint" style={{ color: "var(--bad)" }}>
                    Select an issue.
                  </div>
                )}

                {diagnoses.length > 0 && (
                  <>
                    <div className="hr"></div>
                    <div style={{ fontWeight: 950 }}>Current Diagnoses</div>
                    <div className="grid" style={{ gap: "8px", maxHeight: "240px", overflowY: "auto" }}>
                      {diagnoses.map((item) => (
                        <div key={`modal-${item.id}`} className="note">
                          <div className="h" style={{ alignItems: "flex-start" }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="t" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                <span style={{ fontWeight: 950 }}>{item.issueTitle || "Diagnosis"}</span>
                                {item.subtypeTitle && <span className="chip">{item.subtypeTitle}</span>}
                                {item.codes && <span className="chip">{item.codes}</span>}
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                className="mini bad"
                                type="button"
                                onClick={() => void handleDeleteDiagnosis(item.id)}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="mfoot">
              <button className="mini primary" type="button" onClick={() => void handleSaveDiagnosis(true)}>
                Add & Close
              </button>
              <button className="mini" type="button" onClick={() => void handleSaveDiagnosis(false)}>
                Add & Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
