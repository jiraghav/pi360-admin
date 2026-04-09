"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelectedPatient } from "@/app/components/SelectedPatientProvider";
import { getFacilities, type FacilityOption } from "@/lib/facilities";
import {
  createPatientProgressNote,
  defaultProgressNotesListFilters,
  defaultProgressNoteTags,
  getPatientLopRequestOptions,
  getPatientProgressNotes,
  getPatientProgressNoteRecipientOptions,
  sendPatientLopRequest,
  type PatientProgressNote,
  type ProgressNoteEmailSelection,
  type ProgressNoteLopRequestOptions,
  type ProgressNoteLawyerSelection,
  type ProgressNotesListFilters,
  type ProgressNotesPagination,
  type ProgressNoteRecipientOptions,
  type ProgressNoteTagState,
} from "@/lib/progress-notes";
import { savePatientDemographics } from "@/lib/patients";
import {
  formatWorkspaceCurrency,
  formatWorkspaceDate,
} from "@/lib/workspace";

interface WorkspaceDemographicsDraft {
  name: string;
  phone: string;
  email: string;
  facilityId: number | null;
  facility: string;
  dob: string;
  doi: string;
}

const fallbackNotesPagination: ProgressNotesPagination = {
  page: 1,
  pageSize: 20,
  totalItems: 0,
  totalPages: 1,
};

const progressNoteTypeLabels: Record<number, string> = {
  1: "Urgent",
  2: "Important - to clinic",
  3: "Notify Lawyer",
  4: "Notify Back Office",
  5: "Notify Clinic Director",
  6: "Admin only",
  7: "Finance",
  8: "Billing Notice",
  9: "Weekly Note Update",
  10: "Email Chain",
  11: "Add to treatment plan",
  12: "Notify Intake",
  13: "Notify Referrals",
  14: "Profile changes",
  15: "Notify Records",
};

function maskPhoneInput(value: string) {
  const digits = value.replace(/\D/g, "");
  const normalizedDigits =
    digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  const limited = normalizedDigits.slice(0, 10);

  if (limited.length === 0) {
    return "";
  }

  if (limited.length <= 3) {
    return `(${limited}`;
  }

  if (limited.length <= 6) {
    return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  }

  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
}

function toDateInputValue(value: string | null) {
  if (!value) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const monthDayYearMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (monthDayYearMatch) {
    const [, month, day, year] = monthDayYearMatch;
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = `${parsed.getMonth() + 1}`.padStart(2, "0");
  const day = `${parsed.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createWorkspaceDemographicsDraft(
  patient: NonNullable<ReturnType<typeof useSelectedPatient>["selectedPatient"]>,
): WorkspaceDemographicsDraft {
  return {
    name: patient.name || "",
    phone: maskPhoneInput(patient.phone || ""),
    email: patient.email || "",
    facilityId: patient.facilityId,
    facility: patient.facility || "",
    dob: toDateInputValue(patient.dob),
    doi: toDateInputValue(patient.doi),
  };
}

function formatProgressNoteDate(value: string | null) {
  if (!value) {
    return "N/A";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

type ProgressNoteModalType = "importantToClinic" | "notifyLawyer";

interface ProgressNoteRecipientModalState {
  type: ProgressNoteModalType;
  selectedEmails: string[];
  followEmailChain: boolean;
  updateLawyerPortal: boolean;
}

interface ProgressNoteLopModalState {
  emails: string[];
  selectedEmails: string[];
}

export default function WorkspacePageClient() {
  const router = useRouter();
  const {
    isHydrated,
    selectedPatient,
    selectPatient,
    clearSelectedPatient,
  } = useSelectedPatient();
  const [isDemographicsOpen, setIsDemographicsOpen] = useState(true);
  const [demographicsDraft, setDemographicsDraft] = useState<WorkspaceDemographicsDraft | null>(null);
  const [isSavingDemographics, setIsSavingDemographics] = useState(false);
  const [demographicsSaveMessage, setDemographicsSaveMessage] = useState("");
  const [demographicsSaveError, setDemographicsSaveError] = useState(false);
  const [facilities, setFacilities] = useState<FacilityOption[]>([]);
  const [facilityError, setFacilityError] = useState("");
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(true);
  const [isUpdatesOpen, setIsUpdatesOpen] = useState(true);
  const previousPatientKeyRef = useRef<string | null>(null);
  const [progressNoteText, setProgressNoteText] = useState("");
  const [progressNoteTags, setProgressNoteTags] = useState<ProgressNoteTagState>(defaultProgressNoteTags());
  const [progressNotes, setProgressNotes] = useState<PatientProgressNote[]>([]);
  const [notesPagination, setNotesPagination] = useState<ProgressNotesPagination>(fallbackNotesPagination);
  const [notesPage, setNotesPage] = useState(1);
  const [progressNotesLoading, setProgressNotesLoading] = useState(false);
  const [progressNotesError, setProgressNotesError] = useState("");
  const [progressNotesMessage, setProgressNotesMessage] = useState("");
  const [isSavingProgressNote, setIsSavingProgressNote] = useState(false);
  const [noteFilter, setNoteFilter] = useState("");
  const [noteFilterQuery, setNoteFilterQuery] = useState("");
  const [notesListFilters, setNotesListFilters] = useState<ProgressNotesListFilters>(defaultProgressNotesListFilters());
  const [recipientOptions, setRecipientOptions] = useState<ProgressNoteRecipientOptions | null>(null);
  const [recipientOptionsLoading, setRecipientOptionsLoading] = useState(false);
  const [recipientOptionsError, setRecipientOptionsError] = useState("");
  const [importantToClinicSelection, setImportantToClinicSelection] = useState<ProgressNoteEmailSelection | null>(null);
  const [notifyLawyerSelection, setNotifyLawyerSelection] = useState<ProgressNoteLawyerSelection | null>(null);
  const [recipientModal, setRecipientModal] = useState<ProgressNoteRecipientModalState | null>(null);
  const [lopRequestModal, setLopRequestModal] = useState<ProgressNoteLopModalState | null>(null);
  const [lopRequestOptionsLoading, setLopRequestOptionsLoading] = useState(false);
  const [isSendingLopRequest, setIsSendingLopRequest] = useState(false);
  const notesListRef = useRef<HTMLDivElement | null>(null);
  const defaultNotesListFiltersRef = useRef(defaultProgressNotesListFilters());

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!selectedPatient) {
      router.replace("/patients");
    }
  }, [isHydrated, router, selectedPatient]);

  useEffect(() => {
    let isMounted = true;

    const fetchFacilities = async () => {
      try {
        const data = await getFacilities();
        if (!isMounted) {
          return;
        }

        setFacilities(data);
        setFacilityError("");
      } catch (error) {
        console.error("Failed to load facilities for workspace:", error);
        if (isMounted) {
          setFacilityError("Facility list could not be loaded.");
        }
      }
    };

    fetchFacilities();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedPatient) {
      return;
    }

    const nextPatientKey = String(
      selectedPatient.pid ?? selectedPatient.uuid ?? selectedPatient.name,
    );
    const hasSwitchedPatient =
      previousPatientKeyRef.current !== null && previousPatientKeyRef.current !== nextPatientKey;

    previousPatientKeyRef.current = nextPatientKey;
    setDemographicsDraft(createWorkspaceDemographicsDraft(selectedPatient));

    if (hasSwitchedPatient) {
      setDemographicsSaveMessage("");
      setDemographicsSaveError(false);
    }
  }, [selectedPatient]);

  useEffect(() => {
    let isMounted = true;

    const fetchRecipientOptions = async () => {
      if (!selectedPatient?.pid) {
        if (isMounted) {
          setRecipientOptions(null);
          setRecipientOptionsError("");
        }
        return;
      }

      setRecipientOptionsLoading(true);
      setRecipientOptionsError("");

      try {
        const data = await getPatientProgressNoteRecipientOptions(selectedPatient.pid);
        if (!isMounted) {
          return;
        }

        setRecipientOptions(data);
      } catch (error) {
        console.error("Failed to load note recipient options:", error);
        if (isMounted) {
          setRecipientOptions(null);
          setRecipientOptionsError("Notification email options could not be loaded.");
        }
      } finally {
        if (isMounted) {
          setRecipientOptionsLoading(false);
        }
      }
    };

    fetchRecipientOptions();

    return () => {
      isMounted = false;
    };
  }, [selectedPatient?.pid]);

  useEffect(() => {
    setProgressNoteTags(defaultProgressNoteTags());
    setImportantToClinicSelection(null);
    setNotifyLawyerSelection(null);
    setRecipientModal(null);
    setLopRequestModal(null);
    setProgressNotesMessage("");
    setNotesPage(1);
    setNotesPagination(fallbackNotesPagination);
  }, [selectedPatient?.pid]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setNoteFilterQuery(noteFilter.trim());
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [noteFilter]);

  useEffect(() => {
    setNotesPage(1);
  }, [noteFilterQuery, notesListFilters]);

  useEffect(() => {
    if (!notesListRef.current) {
      return;
    }

    notesListRef.current.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [notesPage]);

  useEffect(() => {
    let isMounted = true;

    const fetchProgressNotes = async () => {
      if (!selectedPatient?.pid) {
        if (isMounted) {
          setProgressNotes([]);
          setNotesPagination(fallbackNotesPagination);
          setProgressNotesError("Patient notes are available once a patient record with an id is selected.");
        }
        return;
      }

      setProgressNotesLoading(true);
      setProgressNotesError("");

      try {
        const data = await getPatientProgressNotes(
          selectedPatient.pid,
          noteFilterQuery,
          notesPage,
          notesPagination.pageSize,
          notesListFilters,
        );
        if (!isMounted) {
          return;
        }

        setProgressNotes(data.notes);
        setNotesPagination(data.pagination);
      } catch (error) {
        console.error("Failed to load patient progress notes:", error);
        if (isMounted) {
          setProgressNotes([]);
          setNotesPagination(fallbackNotesPagination);
          setProgressNotesError("Unable to load patient notes right now.");
        }
      } finally {
        if (isMounted) {
          setProgressNotesLoading(false);
        }
      }
    };

    fetchProgressNotes();

    return () => {
      isMounted = false;
    };
  }, [selectedPatient?.pid, noteFilterQuery, notesPage, notesPagination.pageSize, notesListFilters]);

  if (!isHydrated || !selectedPatient) {
    return (
      <section>
        <div className="softbox hint">Loading patient workspace...</div>
      </section>
    );
  }

  const patientMeta = [
    `DOB ${formatWorkspaceDate(selectedPatient.dob)}`,
    `DOI ${formatWorkspaceDate(selectedPatient.doi)}`,
    `Facility ${selectedPatient.facility || "N/A"}`,
    selectedPatient.status || "Active",
  ].join(" | ");

  const treatmentPlanValue = `${selectedPatient.name || "Patient"} DOB: ${formatWorkspaceDate(selectedPatient.dob)} DOI: ${formatWorkspaceDate(selectedPatient.doi)} Facility: ${selectedPatient.facility || "N/A"} Last visit: ${formatWorkspaceDate(selectedPatient.lastVisit)} Next visit: ${formatWorkspaceDate(selectedPatient.nextVisit)} Balance: ${formatWorkspaceCurrency(selectedPatient.balance)}.`;
  const notesFiltersChanged = Object.entries(notesListFilters).some(([key, value]) => {
    const defaultValue =
      defaultNotesListFiltersRef.current[key as keyof ProgressNotesListFilters];
    return value !== defaultValue;
  });
  const isNotesListFiltered = noteFilter.trim() !== "" || notesFiltersChanged;

  const handleCloseWorkspace = () => {
    clearSelectedPatient();
    router.push("/patients");
  };

  const handleResetNotesView = () => {
    setNoteFilter("");
    setNoteFilterQuery("");
    setNotesListFilters(defaultProgressNotesListFilters());
    setNotesPage(1);
  };

  const handleOpenNoteEditor = () => {
    if (!isAddNoteOpen) {
      setIsAddNoteOpen(true);
    }

    window.setTimeout(() => {
      document.getElementById("wsNoteText")?.focus();
    }, 0);
  };

  const handleDemographicsFieldChange = (
    field: keyof WorkspaceDemographicsDraft,
    value: string,
  ) => {
    setDemographicsDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [field]: field === "phone" ? maskPhoneInput(value) : value,
      };
    });
  };

  const handleFacilityInputChange = (value: string) => {
    const matchedFacility = facilities.find(
      (facility) => facility.name.toLowerCase() === value.trim().toLowerCase(),
    );

    setDemographicsDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        facility: matchedFacility?.name ?? value,
        facilityId: matchedFacility?.id ?? null,
      };
    });
  };

  const handleSaveDemographics = async () => {
    if (!selectedPatient.pid) {
      setDemographicsSaveError(true);
      setDemographicsSaveMessage("This workspace patient is read-only here. Open from Patients list to save.");
      return;
    }

    if (!demographicsDraft) {
      return;
    }

    setIsSavingDemographics(true);
    setDemographicsSaveMessage("");
    setDemographicsSaveError(false);

    try {
      const result = await savePatientDemographics({
        pid: selectedPatient.pid,
        name: demographicsDraft.name,
        phone: demographicsDraft.phone,
        email: demographicsDraft.email,
        facilityId: demographicsDraft.facilityId,
        dob: demographicsDraft.dob,
        doi: demographicsDraft.doi,
      });

      const nextPatient = {
        ...selectedPatient,
        ...result.patient,
        facility: result.patient?.facility ?? demographicsDraft.facility,
        facilityId: result.patient?.facilityId ?? demographicsDraft.facilityId,
      };

      selectPatient(nextPatient);
      setDemographicsDraft(createWorkspaceDemographicsDraft(nextPatient));
      setDemographicsSaveError(false);
      setDemographicsSaveMessage(result.message || "Patient demographics saved.");
    } catch (error) {
      console.error("Failed to save workspace demographics:", error);
      setDemographicsSaveError(true);
      setDemographicsSaveMessage("Unable to save demographics right now.");
    } finally {
      setIsSavingDemographics(false);
    }
  };

  const handleProgressNoteTagChange = (
    field: keyof ProgressNoteTagState,
    checked: boolean,
  ) => {
    if (field === "importantToClinic") {
      if (!checked) {
        setProgressNoteTags((current) => ({ ...current, importantToClinic: false }));
        setImportantToClinicSelection(null);
        if (recipientModal?.type === "importantToClinic") {
          setRecipientModal(null);
        }
        return;
      }

      const nextEmails = importantToClinicSelection?.emails
        ?? recipientOptions?.clinicEmails
        ?? [];
      const nextFollowChain = importantToClinicSelection?.followEmailChain
        ?? recipientOptions?.defaults.clinicFollowEmailChain
        ?? false;

      setRecipientModal({
        type: "importantToClinic",
        selectedEmails: [...nextEmails],
        followEmailChain: nextFollowChain,
        updateLawyerPortal: false,
      });
      return;
    }

    if (field === "notifyLawyer") {
      if (!checked) {
        setProgressNoteTags((current) => ({ ...current, notifyLawyer: false }));
        setNotifyLawyerSelection(null);
        if (recipientModal?.type === "notifyLawyer") {
          setRecipientModal(null);
        }
        return;
      }

      const nextEmails = notifyLawyerSelection?.emails
        ?? recipientOptions?.lawyerEmails
        ?? [];
      const nextFollowChain = notifyLawyerSelection?.followEmailChain
        ?? recipientOptions?.defaults.lawyerFollowEmailChain
        ?? false;
      const nextUpdatePortal = notifyLawyerSelection?.updateLawyerPortal
        ?? recipientOptions?.defaults.lawyerUpdatePortal
        ?? false;

      setRecipientModal({
        type: "notifyLawyer",
        selectedEmails: [...nextEmails],
        followEmailChain: nextFollowChain,
        updateLawyerPortal: nextUpdatePortal,
      });
      return;
    }

    setProgressNoteTags((current) => ({
      ...current,
      [field]: checked,
    }));
  };

  const toggleRecipientModalEmail = (email: string, checked: boolean) => {
    setRecipientModal((current) => {
      if (!current) {
        return current;
      }

      const nextEmails = checked
        ? Array.from(new Set([...current.selectedEmails, email]))
        : current.selectedEmails.filter((item) => item !== email);

      return {
        ...current,
        selectedEmails: nextEmails,
      };
    });
  };

  const handleRecipientModalCancel = () => {
    if (recipientModal?.type === "importantToClinic") {
      setProgressNoteTags((current) => ({ ...current, importantToClinic: false }));
      setImportantToClinicSelection(null);
    }

    if (recipientModal?.type === "notifyLawyer") {
      setProgressNoteTags((current) => ({ ...current, notifyLawyer: false }));
      setNotifyLawyerSelection(null);
    }

    setRecipientModal(null);
  };

  const handleRecipientModalSave = () => {
    if (!recipientModal) {
      return;
    }

    if (recipientModal.type === "importantToClinic") {
      if (recipientModal.selectedEmails.length === 0) {
        setProgressNoteTags((current) => ({ ...current, importantToClinic: false }));
        setImportantToClinicSelection(null);
      } else {
        setProgressNoteTags((current) => ({ ...current, importantToClinic: true }));
        setImportantToClinicSelection({
          emails: recipientModal.selectedEmails,
          followEmailChain: recipientModal.followEmailChain,
        });
      }
    }

    if (recipientModal.type === "notifyLawyer") {
      if (recipientModal.selectedEmails.length === 0) {
        setProgressNoteTags((current) => ({ ...current, notifyLawyer: false }));
        setNotifyLawyerSelection(null);
      } else {
        setProgressNoteTags((current) => ({ ...current, notifyLawyer: true }));
        setNotifyLawyerSelection({
          emails: recipientModal.selectedEmails,
          followEmailChain: recipientModal.followEmailChain,
          updateLawyerPortal: recipientModal.updateLawyerPortal,
        });
      }
    }

    setRecipientModal(null);
  };

  const refreshWorkspaceProgressNotes = async () => {
    if (!selectedPatient?.pid) {
      return;
    }

    const refreshedNotes = await getPatientProgressNotes(
      selectedPatient.pid,
      noteFilterQuery,
      notesPage,
      notesPagination.pageSize,
      notesListFilters,
    );

    setProgressNotes(refreshedNotes.notes);
    setNotesPagination(refreshedNotes.pagination);
  };

  const handleOpenLopRequestModal = async () => {
    if (!selectedPatient.pid) {
      setProgressNotesMessage("This workspace patient is read-only here. Open from Patients or Dashboard to send LOP.");
      return;
    }

    setLopRequestOptionsLoading(true);
    setProgressNotesMessage("");

    try {
      const options: ProgressNoteLopRequestOptions = await getPatientLopRequestOptions(selectedPatient.pid);
      setLopRequestModal({
        emails: options.emails,
        selectedEmails: [...options.emails],
      });
    } catch (error) {
      console.error("Failed to load LOP request emails:", error);
      setProgressNotesMessage("Unable to load LOP request emails right now.");
    } finally {
      setLopRequestOptionsLoading(false);
    }
  };

  const toggleLopRequestModalEmail = (email: string, checked: boolean) => {
    setLopRequestModal((current) => {
      if (!current) {
        return current;
      }

      const nextEmails = checked
        ? Array.from(new Set([...current.selectedEmails, email]))
        : current.selectedEmails.filter((item) => item !== email);

      return {
        ...current,
        selectedEmails: nextEmails,
      };
    });
  };

  const handleSendLopRequest = async () => {
    if (!selectedPatient?.pid || !lopRequestModal) {
      return;
    }

    if (lopRequestModal.selectedEmails.length === 0) {
      setProgressNotesMessage("Please select at least one email for the LOP request.");
      return;
    }

    setIsSendingLopRequest(true);
    setProgressNotesMessage("");

    try {
      const result = await sendPatientLopRequest({
        pid: selectedPatient.pid,
        note: progressNoteText.trim() || undefined,
        emails: lopRequestModal.selectedEmails,
      });

      await refreshWorkspaceProgressNotes();

      setProgressNoteText("");
      setProgressNoteTags(defaultProgressNoteTags());
      setImportantToClinicSelection(null);
      setNotifyLawyerSelection(null);
      setRecipientModal(null);
      setLopRequestModal(null);
      setProgressNotesError("");
      setProgressNotesMessage(result.message);
    } catch (error) {
      console.error("Failed to send LOP request:", error);
      setProgressNotesMessage("Unable to send LOP request right now.");
    } finally {
      setIsSendingLopRequest(false);
    }
  };

  const handleSaveProgressNote = async () => {
    if (!selectedPatient.pid) {
      setProgressNotesMessage("This workspace patient is read-only here. Open from Patients or Dashboard to add notes.");
      return;
    }

    if (!progressNoteText.trim()) {
      setProgressNotesMessage("Please enter a note before saving.");
      return;
    }

    setIsSavingProgressNote(true);
    setProgressNotesMessage("");

    try {
      const result = await createPatientProgressNote({
        pid: selectedPatient.pid,
        body: progressNoteText.trim(),
        tags: progressNoteTags,
        importantToClinicSelection,
        notifyLawyerSelection,
      });

      await refreshWorkspaceProgressNotes();

      setProgressNoteText("");
      setProgressNoteTags(defaultProgressNoteTags());
      setImportantToClinicSelection(null);
      setNotifyLawyerSelection(null);
      setProgressNotesMessage(result.message);
      setProgressNotesError("");
    } catch (error) {
      console.error("Failed to save progress note:", error);
      setProgressNotesMessage("Unable to save progress note right now.");
    } finally {
      setIsSavingProgressNote(false);
    }
  };

  const activeRecipientEmails = recipientModal?.type === "importantToClinic"
    ? recipientOptions?.clinicEmails ?? []
    : recipientModal?.type === "notifyLawyer"
      ? recipientOptions?.lawyerEmails ?? []
      : [];

  return (
    <section>
      <div className="workspace-header">
        <div className="pn">
          <div className="n" id="wsPatientName">
            {selectedPatient.name || "Unnamed patient"}
          </div>
          <div className="s" id="wsPatientMeta">
            {patientMeta}
          </div>
        </div>
        <div className="quicklinks">
          <a href="#" title="Medical History Documents">
            🗂 Medical History Docs
          </a>
          <a href="#" title="Referrals">
            🧭 Referrals (2)
          </a>
          <a href="#" title="Ledger">
            📒 Ledger
          </a>
          <a href="#" title="Generate Full Report">
            📊 Generate Full Report
          </a>
          <a href="#" title="Generate Partial Report">
            📄 Generate Partial Report
          </a>
          <a href="#" title="Generate Invoice">
            💳 Generate Invoice
          </a>
          <a href="#" title="Send E-Script">
            💊 Send E-Script
          </a>
          <a href="#" title="Download CMS">
            ⬇ Download CMS
          </a>
        </div>
        <div className="spacer"></div>
        <div className="row">
          <button className="btn secondary" type="button" onClick={handleCloseWorkspace}>
            Close Workspace
          </button>
          <button className="btn secondary" id="wsCopyDetails">
            Copy Details
          </button>
          <button className="btn" id="wsSaveAll">
            Save
          </button>
        </div>
      </div>

      <div className="workspace-grid">
        <div className="grid">
          <div className="card">
            <div className="hd">
              <div className="title">🪪 Edit Demographics</div>
              <div className="sub">{isDemographicsOpen ? "(expanded)" : "(collapsed)"}</div>
              <div className="right">
                <button
                  className="mini primary"
                  type="button"
                  disabled={isSavingDemographics}
                  onClick={handleSaveDemographics}
                >
                  {isSavingDemographics ? "Saving..." : "Save"}
                </button>
                <button
                  className="mini"
                  type="button"
                  onClick={() => setIsDemographicsOpen((current) => !current)}
                >
                  {isDemographicsOpen ? "Collapse" : "Expand"}
                </button>
              </div>
            </div>
            {isDemographicsOpen && demographicsDraft && (
              <div className="bd" id="demogBody">
                <div className="two-col">
                  <div className="field">
                    <label>Name</label>
                    <input
                      value={demographicsDraft.name}
                      onChange={(event) => handleDemographicsFieldChange("name", event.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Phone</label>
                    <input
                      value={demographicsDraft.phone}
                      onChange={(event) => handleDemographicsFieldChange("phone", event.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Email</label>
                    <input
                      value={demographicsDraft.email}
                      onChange={(event) => handleDemographicsFieldChange("email", event.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Facility</label>
                    <input
                      list="workspace-facility-options"
                      value={demographicsDraft.facility}
                      onChange={(event) => handleFacilityInputChange(event.target.value)}
                      placeholder="Search facility"
                    />
                    {facilityError && (
                      <div className="hint" style={{ marginTop: "6px" }}>
                        {facilityError}
                      </div>
                    )}
                  </div>
                  <div className="field">
                    <label>DOB</label>
                    <input
                      type="date"
                      value={demographicsDraft.dob}
                      onChange={(event) => handleDemographicsFieldChange("dob", event.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>DOI</label>
                    <input
                      type="date"
                      value={demographicsDraft.doi}
                      onChange={(event) => handleDemographicsFieldChange("doi", event.target.value)}
                    />
                  </div>
                </div>
                {demographicsSaveMessage && (
                  <div
                    className="hint"
                    style={{
                      marginTop: "8px",
                      color: demographicsSaveError ? "var(--bad)" : undefined,
                    }}
                  >
                    {demographicsSaveMessage}
                  </div>
                )}

                <div className="hr"></div>
                <div className="hint">
                  Quick parity to emr.cic.clinic: Who / Case Team / Contact / Insurance / Choices /
                  Employer / Tabs. This prototype keeps everything available but reduces clutter.
                </div>
              </div>
            )}
          </div>
          <datalist id="workspace-facility-options">
            {facilities.map((facility) => {
              const suffix = [facility.city, facility.state].filter(Boolean).join(", ");
              const label = suffix ? `${facility.name} (${suffix})` : facility.name;

              return <option key={facility.id} value={facility.name} label={label} />;
            })}
          </datalist>

          <div className="card">
            <div className="hd">
              <div className="title">📝 Add Progress Note - Updates Here</div>
              <div className="sub">
                {isAddNoteOpen ? "(expanded | back office adds too)" : "(collapsed | back office adds too)"}
              </div>
              <div className="right">
                <button
                  className="mini primary"
                  id="wsSaveNote"
                  type="button"
                  disabled={isSavingProgressNote}
                  onClick={handleSaveProgressNote}
                >
                  {isSavingProgressNote ? "Saving..." : "Save note"}
                </button>
                <button
                  className="mini"
                  id="wsSendLOP"
                  type="button"
                  disabled={lopRequestOptionsLoading || isSendingLopRequest}
                  onClick={handleOpenLopRequestModal}
                >
                  {lopRequestOptionsLoading ? "Loading LOP..." : isSendingLopRequest ? "Sending LOP..." : "Send LOP request"}
                </button>
                <button
                  className="mini"
                  type="button"
                  onClick={() => setIsAddNoteOpen((current) => !current)}
                >
                  {isAddNoteOpen ? "Collapse" : "Expand"}
                </button>
              </div>
            </div>
            {isAddNoteOpen && (
            <div className="bd">
              <div className="field">
                <label>Note</label>
                <textarea
                  id="wsNoteText"
                  value={progressNoteText}
                  onChange={(event) => setProgressNoteText(event.target.value)}
                  placeholder="Ex: patient missed, patient not answering calls, update on case, etc."
                ></textarea>
              </div>
              <div className="hr"></div>
              <div className="checkgrid">
                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={progressNoteTags.urgent}
                    onChange={(event) => handleProgressNoteTagChange("urgent", event.target.checked)}
                  /> Urgent
                </label>
                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={progressNoteTags.importantToClinic}
                    onChange={(event) => handleProgressNoteTagChange("importantToClinic", event.target.checked)}
                  /> Important - to clinic
                </label>
                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={progressNoteTags.notifyLawyer}
                    onChange={(event) => handleProgressNoteTagChange("notifyLawyer", event.target.checked)}
                  /> Notify Lawyer
                </label>
                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={progressNoteTags.notifyClinicDirector}
                    onChange={(event) => handleProgressNoteTagChange("notifyClinicDirector", event.target.checked)}
                  /> Notify Clinic Director
                </label>
                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={progressNoteTags.notifyBackOffice}
                    onChange={(event) => handleProgressNoteTagChange("notifyBackOffice", event.target.checked)}
                  /> Notify Back Office
                </label>
                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={progressNoteTags.shareToLawyerNotes}
                    onChange={(event) => handleProgressNoteTagChange("shareToLawyerNotes", event.target.checked)}
                  /> Share to Lawyer Notes
                </label>
                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={progressNoteTags.shareToAffiliateNotes}
                    onChange={(event) => handleProgressNoteTagChange("shareToAffiliateNotes", event.target.checked)}
                  /> Share to Affiliate Notes
                </label>
                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={progressNoteTags.adminOnly}
                    onChange={(event) => handleProgressNoteTagChange("adminOnly", event.target.checked)}
                  /> Admin only
                </label>
                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={progressNoteTags.billingNotice}
                    onChange={(event) => handleProgressNoteTagChange("billingNotice", event.target.checked)}
                  /> Billing Notice
                </label>
                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={progressNoteTags.notifyIntake}
                    onChange={(event) => handleProgressNoteTagChange("notifyIntake", event.target.checked)}
                  /> Notify Intake
                </label>
                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={progressNoteTags.notifyRecords}
                    onChange={(event) => handleProgressNoteTagChange("notifyRecords", event.target.checked)}
                  /> Notify Records
                </label>
                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={progressNoteTags.notifyReferrals}
                    onChange={(event) => handleProgressNoteTagChange("notifyReferrals", event.target.checked)}
                  /> Notify Referrals
                </label>
                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={progressNoteTags.addToTreatmentPlan}
                    onChange={(event) => handleProgressNoteTagChange("addToTreatmentPlan", event.target.checked)}
                  /> Add to treatment plan
                </label>
                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={progressNoteTags.finance}
                    onChange={(event) => handleProgressNoteTagChange("finance", event.target.checked)}
                  /> Finance
                </label>
              </div>
              {recipientOptionsLoading && (
                <div className="hint" style={{ marginTop: "10px" }}>
                  Loading notification email options...
                </div>
              )}
              {recipientOptionsError && (
                <div className="hint" style={{ marginTop: "10px", color: "var(--bad)" }}>
                  {recipientOptionsError}
                </div>
              )}
              {importantToClinicSelection && (
                <div className="hint" style={{ marginTop: "10px" }}>
                  Clinic email on save: {importantToClinicSelection.emails.join(", ")}
                </div>
              )}
              {notifyLawyerSelection && (
                <div className="hint" style={{ marginTop: "6px" }}>
                  Lawyer email on save: {notifyLawyerSelection.emails.join(", ")}
                  {notifyLawyerSelection.updateLawyerPortal ? " | Update lawyer portal" : ""}
                </div>
              )}
              {progressNotesMessage && (
                <div className="hint" style={{ marginTop: "10px" }}>
                  {progressNotesMessage}
                </div>
              )}
            </div>
            )}
          </div>

          <div className="card">
            <div className="hd">
              <div className="title">📌 Patient Update Section</div>
              <div className="sub">{isUpdatesOpen ? "(expanded)" : "(collapsed)"}</div>
              <div className="right">
                <button
                  className="mini"
                  type="button"
                  onClick={() => setIsUpdatesOpen((current) => !current)}
                >
                  {isUpdatesOpen ? "Collapse" : "Expand"}
                </button>
              </div>
            </div>
            {isUpdatesOpen && (
            <div className="bd" id="updatesBody">
              <div className="toolbar" style={{ marginBottom: "10px" }}>
                <div className="search-mini" style={{ minWidth: "240px" }}>
                  🔎{" "}
                  <input
                    id="noteFilter"
                    placeholder="Search notes..."
                    value={noteFilter}
                    onChange={(event) => setNoteFilter(event.target.value)}
                  />
                </div>
                <button
                  className="mini primary"
                  type="button"
                  onClick={handleOpenNoteEditor}
                >
                  Add/Edit
                </button>
                {isNotesListFiltered && (
                  <button
                    className="mini"
                    type="button"
                    onClick={handleResetNotesView}
                  >
                    Clear filters
                  </button>
                )}
              </div>
              <div className="checkgrid" style={{ marginBottom: "10px" }}>
                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={notesListFilters.includeUrgent}
                    onChange={(event) =>
                      setNotesListFilters((current) => ({
                        ...current,
                        includeUrgent: event.target.checked,
                      }))
                    }
                  /> Urgent
                </label>
                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={notesListFilters.includeImportantToClinic}
                    onChange={(event) =>
                      setNotesListFilters((current) => ({
                        ...current,
                        includeImportantToClinic: event.target.checked,
                      }))
                    }
                  /> Important - to clinic
                </label>
                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={notesListFilters.includeNotifyLawyer}
                    onChange={(event) =>
                      setNotesListFilters((current) => ({
                        ...current,
                        includeNotifyLawyer: event.target.checked,
                      }))
                    }
                  /> Notify Lawyer
                </label>
                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={notesListFilters.includeNotifyBackOffice}
                    onChange={(event) =>
                      setNotesListFilters((current) => ({
                        ...current,
                        includeNotifyBackOffice: event.target.checked,
                      }))
                    }
                  /> Notify Back Office
                </label>
                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={notesListFilters.includeNotifyClinicDirector}
                    onChange={(event) =>
                      setNotesListFilters((current) => ({
                        ...current,
                        includeNotifyClinicDirector: event.target.checked,
                      }))
                    }
                  /> Notify Clinic Director
                </label>
                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={notesListFilters.includeAdminOnly}
                    onChange={(event) =>
                      setNotesListFilters((current) => ({
                        ...current,
                        includeAdminOnly: event.target.checked,
                        excludeAdminOnly: event.target.checked ? false : current.excludeAdminOnly,
                      }))
                    }
                  /> Admin only
                </label>
                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={notesListFilters.includeFinance}
                    onChange={(event) =>
                      setNotesListFilters((current) => ({
                        ...current,
                        includeFinance: event.target.checked,
                      }))
                    }
                  /> Finance
                </label>
                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={notesListFilters.includeBillingNotice}
                    onChange={(event) =>
                      setNotesListFilters((current) => ({
                        ...current,
                        includeBillingNotice: event.target.checked,
                      }))
                    }
                  /> Billing Notice
                </label>
                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={notesListFilters.includeWeeklyNoteUpdate}
                    onChange={(event) =>
                      setNotesListFilters((current) => ({
                        ...current,
                        includeWeeklyNoteUpdate: event.target.checked,
                      }))
                    }
                  /> Weekly Note Update
                </label>
                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={notesListFilters.includeEmailChain}
                    onChange={(event) =>
                      setNotesListFilters((current) => ({
                        ...current,
                        includeEmailChain: event.target.checked,
                      }))
                    }
                  /> Email Chain
                </label>
                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={notesListFilters.includeTreatmentPlan}
                    onChange={(event) =>
                      setNotesListFilters((current) => ({
                        ...current,
                        includeTreatmentPlan: event.target.checked,
                      }))
                    }
                  /> Treatment Plan
                </label>
                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={notesListFilters.includeNotifyRecords}
                    onChange={(event) =>
                      setNotesListFilters((current) => ({
                        ...current,
                        includeNotifyRecords: event.target.checked,
                      }))
                    }
                  /> Notify Records
                </label>
                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={notesListFilters.includeProfileChanges}
                    onChange={(event) =>
                      setNotesListFilters((current) => ({
                        ...current,
                        includeProfileChanges: event.target.checked,
                      }))
                    }
                  /> Profile changes
                </label>
                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={notesListFilters.excludeWeeklyUpdate}
                    onChange={(event) =>
                      setNotesListFilters((current) => ({
                        ...current,
                        excludeWeeklyUpdate: event.target.checked,
                      }))
                    }
                  /> Exclude Weekly Update
                </label>
                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={notesListFilters.excludeCaseInfo}
                    onChange={(event) =>
                      setNotesListFilters((current) => ({
                        ...current,
                        excludeCaseInfo: event.target.checked,
                      }))
                    }
                  /> Exclude Case info
                </label>
                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={notesListFilters.excludeAdminOnly}
                    onChange={(event) =>
                      setNotesListFilters((current) => ({
                        ...current,
                        excludeAdminOnly: event.target.checked,
                        includeAdminOnly: event.target.checked ? false : current.includeAdminOnly,
                      }))
                    }
                  /> Exclude Admin Only
                </label>
              </div>
              <div
                id="wsNotesList"
                ref={notesListRef}
                className="grid"
                style={{
                  gap: "10px",
                  maxHeight: "420px",
                  overflowY: "auto",
                  paddingRight: "4px",
                }}
              >
                {progressNotesLoading && (
                  <div className="softbox hint">Loading progress notes...</div>
                )}
                {!progressNotesLoading && progressNotesError && (
                  <div className="softbox hint">{progressNotesError}</div>
                )}
                {!progressNotesLoading && !progressNotesError && progressNotes.length === 0 && (
                  <div className="softbox hint">
                    {noteFilterQuery ? "No notes match this search." : "No progress notes yet."}
                  </div>
                )}
                {progressNotes.map((note) => (
                  <div key={note.id} className="note">
                    <div className="h">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="t">{note.superFacilityDescription || "N/A"}</div>
                        <div className="m">{note.facilityName || "N/A"}</div>
                      </div>
                      <div style={{ textAlign: "right", alignSelf: "flex-start", marginLeft: "12px", flexShrink: 0 }}>
                        <div className="m">{formatProgressNoteDate(note.date)}</div>
                        <div className="m">
                          By {note.userFullName || note.user || "EMR user"}
                        </div>
                      </div>
                    </div>
                    <div className="p" style={{ whiteSpace: "pre-wrap" }}>
                      {note.body}
                    </div>
                    {(note.externalLawyerHasAccess || note.externalAffiliateHasAccess || note.types.length > 0) && (
                      <div className="actions-row" style={{ marginTop: "8px" }}>
                        {note.externalLawyerHasAccess && (
                          <span className="chip">Shared With Lawyer</span>
                        )}
                        {note.externalAffiliateHasAccess && (
                          <span className="chip">Shared With Affiliate</span>
                        )}
                        {note.types.map((type) => (
                          <span key={`${note.id}-${type}`} className="chip">
                            {progressNoteTypeLabels[type] ?? `Type ${type}`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="row wrap" style={{ marginTop: "10px", gap: "8px" }}>
                <div className="hint">
                  Showing {progressNotes.length === 0 ? 0 : (notesPagination.page - 1) * notesPagination.pageSize + 1}
                  -
                  {Math.min(notesPagination.page * notesPagination.pageSize, notesPagination.totalItems)} of {notesPagination.totalItems}
                </div>
                <div className="spacer" />
                <div className="hint">
                  Page {notesPagination.page} of {notesPagination.totalPages}
                </div>
                <button
                  className="mini"
                  type="button"
                  disabled={progressNotesLoading || notesPagination.page <= 1}
                  onClick={() => setNotesPage((current) => Math.max(1, current - 1))}
                >
                  Prev
                </button>
                <button
                  className="mini primary"
                  type="button"
                  disabled={progressNotesLoading || notesPagination.page >= notesPagination.totalPages}
                  onClick={() =>
                    setNotesPage((current) =>
                      Math.min(notesPagination.totalPages, current + 1),
                    )
                  }
                >
                  Next
                </button>
              </div>
            </div>
            )}
          </div>
        </div>

        <div className="grid">
          <div className="card">
            <div className="hd">
              <div className="title">📅 Appointments</div>
              <div className="sub">(collapsed)</div>
              <div className="right">
                <button className="mini primary">Add</button>
              </div>
            </div>
            <div className="bd">
              <div className="note">
                <div className="h">
                  <div className="t">
                    Next visit: {formatWorkspaceDate(selectedPatient.nextVisit)}
                  </div>
                  <div className="m">Status: {selectedPatient.status || "Active"}</div>
                </div>
                <div className="p">
                  Location: {selectedPatient.facility || "N/A"} | Last visit:{" "}
                  {formatWorkspaceDate(selectedPatient.lastVisit)}
                </div>
              </div>
              <div className="sep"></div>
              <div className="hint">Recurrent appointments: none</div>
            </div>
          </div>

          <div className="card">
            <div className="hd">
              <div className="title">🩺 Diagnoses</div>
              <div className="sub">(collapsed)</div>
              <div className="right">
                <button className="mini">Edit</button>
              </div>
            </div>
            <div className="bd">
              <div className="hint">Nothing recorded</div>
            </div>
          </div>

          <div className="card">
            <div className="hd">
              <div className="title">✅ Case Checklist + Report Tracking</div>
              <div className="right">
                <button className="mini">Edit</button>
              </div>
            </div>
            <div className="bd">
              <div className="checkgrid">
                <label className="checkline">
                  <input type="checkbox" /> Intake
                </label>
                <label className="checkline">
                  <input type="checkbox" /> Liability cleared
                </label>
                <label className="checkline">
                  <input type="checkbox" /> Police report
                </label>
                <label className="checkline">
                  <input type="checkbox" /> Underinsured
                </label>
                <label className="checkline">
                  <input type="checkbox" /> Uninsured
                </label>
                <label className="checkline">
                  <input type="checkbox" /> LOP
                </label>
                <label className="checkline">
                  <input type="checkbox" /> Hospital records received
                </label>
                <label className="checkline">
                  <input type="checkbox" defaultChecked /> Bills and records
                </label>
              </div>
              <div className="hr"></div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Report Name</th>
                    <th>Sent</th>
                    <th>Report received</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Chiro report</td>
                    <td>
                      <span className="chip warn">Pending</span>
                    </td>
                    <td>-</td>
                  </tr>
                  <tr>
                    <td>MRI report</td>
                    <td>
                      <span className="chip">-</span>
                    </td>
                    <td>
                      <span className="chip good">Received</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Neuro report</td>
                    <td>
                      <span className="chip">-</span>
                    </td>
                    <td>-</td>
                  </tr>
                  <tr>
                    <td>Ortho report</td>
                    <td>
                      <span className="chip">-</span>
                    </td>
                    <td>-</td>
                  </tr>
                  <tr>
                    <td>Pain report</td>
                    <td>
                      <span className="chip">-</span>
                    </td>
                    <td>-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="hd">
              <div className="title">Customize Report</div>
              <div className="sub">(collapsed)</div>
              <div className="right">
                <button className="mini primary">Save</button>
                <button className="mini">Share w/ Lawyer</button>
              </div>
            </div>
            <div className="bd">
              <div className="three-col">
                <div className="field">
                  <label>Custom Data - Balance</label>
                  <input defaultValue={selectedPatient.balance.toFixed(2)} />
                </div>
                <div className="field">
                  <label>Initial visit</label>
                  <input defaultValue={formatWorkspaceDate(selectedPatient.doi)} />
                </div>
                <div className="field">
                  <label>Total visits</label>
                  <input defaultValue="0" />
                </div>
                <div className="field">
                  <label>Last visit</label>
                  <input defaultValue={formatWorkspaceDate(selectedPatient.lastVisit)} />
                </div>
                <div className="field">
                  <label>Next visit</label>
                  <input defaultValue={formatWorkspaceDate(selectedPatient.nextVisit)} />
                </div>
                <div className="field">
                  <label>Referrals received</label>
                  <input defaultValue="0" />
                </div>
              </div>
              <div className="hr"></div>
              <div className="hint">
                Real data mirror: Balance {selectedPatient.balance.toFixed(2)} | Last encounter{" "}
                {formatWorkspaceDate(selectedPatient.lastVisit)} | Facility{" "}
                {selectedPatient.facility || "N/A"}
              </div>
            </div>
          </div>
        </div>

        <div className="grid">
          <div className="card">
            <div className="hd">
              <div className="title">Claims</div>
              <div className="sub">(collapsed)</div>
              <div className="right">
                <button className="mini">Select all</button>
                <button className="mini">Deselect all</button>
              </div>
            </div>
            <div className="bd">
              <div className="claims-list" id="claimsList">
                <div className="claim-item">
                  <div>{formatWorkspaceDate(selectedPatient.doi)} - Intake</div>
                  <span>{selectedPatient.status || "Open"}</span>
                </div>
                <div className="claim-item">
                  <div>{formatWorkspaceDate(selectedPatient.lastVisit)} - Office Visit</div>
                  <span>Office Visit</span>
                </div>
                <div className="claim-item">
                  <div>{formatWorkspaceDate(selectedPatient.nextVisit)} - Scheduled Follow-up</div>
                  <span>Scheduled</span>
                </div>
              </div>
              <div className="actions-row">
                <button className="mini primary">Download 837 Files</button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="hd">
              <div className="title">🧾 Treatment Plan</div>
              <div className="sub">(collapsed)</div>
              <div className="right">
                <button className="mini primary">Save & Share with Lawyer</button>
                <button className="mini">Save</button>
              </div>
            </div>
            <div className="bd">
              <div className="field">
                <label>Plan</label>
                <textarea id="treatmentPlanText" defaultValue={treatmentPlanValue}></textarea>
              </div>
              <div className="hr"></div>
              <div className="actions-row">
                <button className="mini primary" id="wsAddDoctorRequest">
                  + Add doctor requests
                </button>
                <button className="mini" id="wsAddLawyerTask">
                  + Add lawyer task
                </button>
                <button className="mini" id="wsAddAuthTask">
                  + Add authorization task
                </button>
                <button className="mini" id="wsAddAffiliateTask">
                  + Add affiliate task
                </button>
                <button className="mini" id="wsViewActivities">
                  View Patient Activities
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="hd">
              <div className="title">Billing</div>
              <div className="sub">(collapsed)</div>
              <div className="right">
                <button className="mini">Case information</button>
                <button className="mini primary">Treatment status request</button>
              </div>
            </div>
            <div className="bd">
              <div className="row wrap">
                <div className="field" style={{ minWidth: "220px" }}>
                  <label>Group</label>
                  <select defaultValue="Super facility">
                    <option>Super facility</option>
                    <option>Chiropractic / Therapy</option>
                    <option>Imaging</option>
                    <option>Pharmacy</option>
                  </select>
                </div>
                <div className="spacer"></div>
                <button className="mini">Request transport authorization</button>
              </div>
              <div className="hr"></div>

              <div className="bill-grid">
                <div className="metric">
                  <div className="k">Transportation cost</div>
                  <div className="v red">$0.00</div>
                </div>
                <div className="metric">
                  <div className="k">Patient balance due</div>
                  <div className="v red">{formatWorkspaceCurrency(selectedPatient.balance)}</div>
                </div>
                <div className="metric">
                  <div className="k">Insurance paid</div>
                  <div className="v blue">$0.00</div>
                </div>
                <div className="metric">
                  <div className="k">Cumulative total</div>
                  <div className="v">{formatWorkspaceCurrency(selectedPatient.balance)}</div>
                </div>
              </div>

              <div className="hr"></div>
              <div className="hint">
                This card is designed to match the current EMR components but presented as
                readable KPIs.
              </div>
            </div>
          </div>
        </div>
      </div>

      {lopRequestModal && (
        <div className="modal-backdrop show" role="presentation">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="workspace-lop-request-modal-title"
          >
            <div className="mhead">
              <div>
                <div className="mtitle" id="workspace-lop-request-modal-title">
                  Send LOP Request
                </div>
                <div className="hint">
                  Please confirm the emails before sending this LOP request.
                </div>
              </div>
              <div className="right">
                <button
                  className="mini"
                  type="button"
                  disabled={isSendingLopRequest}
                  onClick={() => setLopRequestModal(null)}
                >
                  Close
                </button>
              </div>
            </div>
            <div className="mbody">
              {lopRequestModal.emails.length === 0 ? (
                <div className="softbox hint">No emails added by lawyer in LOP.</div>
              ) : (
                <div className="checkgrid">
                  {lopRequestModal.emails.map((email) => (
                    <label key={`lop-${email}`} className="checkline">
                      <input
                        type="checkbox"
                        checked={lopRequestModal.selectedEmails.includes(email)}
                        onChange={(event) => toggleLopRequestModalEmail(email, event.target.checked)}
                      /> {email}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="mfoot">
              <button
                className="mini"
                type="button"
                disabled={isSendingLopRequest}
                onClick={() => setLopRequestModal(null)}
              >
                No
              </button>
              <button
                className="mini primary"
                type="button"
                disabled={isSendingLopRequest || lopRequestModal.selectedEmails.length === 0}
                onClick={handleSendLopRequest}
              >
                {isSendingLopRequest ? "Sending..." : "Yes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {recipientModal && (
        <div className="modal-backdrop show" role="presentation">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="workspace-note-recipient-modal-title"
          >
            <div className="mhead">
              <div>
                <div className="mtitle" id="workspace-note-recipient-modal-title">
                  {recipientModal.type === "importantToClinic" ? "Notify clinic" : "Notify Lawyer"}
                </div>
                <div className="hint">
                  Please confirm the emails before this note is saved.
                </div>
              </div>
              <div className="right">
                <button className="mini" type="button" onClick={handleRecipientModalCancel}>
                  Close
                </button>
              </div>
            </div>
            <div className="mbody">
              {activeRecipientEmails.length === 0 ? (
                <div className="softbox hint">
                  {recipientModal.type === "importantToClinic"
                    ? "No emails added by clinic."
                    : "No emails added by lawyer."}
                </div>
              ) : (
                <>
                  <div className="checkgrid">
                    {activeRecipientEmails.map((email) => (
                      <label key={`${recipientModal.type}-${email}`} className="checkline">
                        <input
                          type="checkbox"
                          checked={recipientModal.selectedEmails.includes(email)}
                          onChange={(event) => toggleRecipientModalEmail(email, event.target.checked)}
                        /> {email}
                      </label>
                    ))}
                  </div>
                  <div className="hr"></div>
                </>
              )}

              <div className="checkgrid">
                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={recipientModal.followEmailChain}
                    onChange={(event) =>
                      setRecipientModal((current) =>
                        current
                          ? {
                              ...current,
                              followEmailChain: event.target.checked,
                            }
                          : current,
                      )
                    }
                  /> Follow Email Chain
                </label>
                {recipientModal.type === "notifyLawyer" && (
                  <label className="checkline">
                    <input
                      type="checkbox"
                      checked={recipientModal.updateLawyerPortal}
                      onChange={(event) =>
                        setRecipientModal((current) =>
                          current
                            ? {
                                ...current,
                                updateLawyerPortal: event.target.checked,
                              }
                            : current,
                        )
                      }
                    /> Update lawyer portal
                  </label>
                )}
              </div>
            </div>
            <div className="mfoot">
              <button className="mini" type="button" onClick={handleRecipientModalCancel}>
                No
              </button>
              <button className="mini primary" type="button" onClick={handleRecipientModalSave}>
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
