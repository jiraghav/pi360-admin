"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelectedPatient } from "@/app/components/SelectedPatientProvider";
import { WorkspaceDemographicsCard } from "@/app/(dashboard)/workspace/components/WorkspaceDemographicsCard";
import { WorkspaceHeader } from "@/app/(dashboard)/workspace/components/WorkspaceHeader";
import { WorkspaceProgressNoteCard } from "@/app/(dashboard)/workspace/components/WorkspaceProgressNoteCard";
import { WorkspaceSidebarSections } from "@/app/(dashboard)/workspace/components/WorkspaceSidebarSections";
import { WorkspaceUpdatesCard } from "@/app/(dashboard)/workspace/components/WorkspaceUpdatesCard";
import { LopRequestModal } from "@/app/(dashboard)/workspace/components/LopRequestModal";
import { RecipientModal } from "@/app/(dashboard)/workspace/components/RecipientModal";
import {
  fallbackNotesPagination,
  type ProgressNoteLopModalState,
  type ProgressNoteRecipientModalState,
  type WorkspaceDemographicsDraft,
} from "@/app/(dashboard)/workspace/types";
import {
  createWorkspaceDemographicsDraft,
  maskPhoneInput,
} from "@/app/(dashboard)/workspace/utils";
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

const workspaceDemographicsOpenStorageKey = "pi360.ws.card.demographics.open";
const workspaceAddNoteOpenStorageKey = "pi360.ws.card.add-note.open";
const workspaceUpdatesOpenStorageKey = "pi360.ws.card.updates.open";
const workspaceToggleAllCardsEventName = "pi360:workspace:toggleAllCards";
const workspaceSidebarAppointmentsOpenStorageKey = "pi360.ws.sidebar.appointments.open";
const workspaceSidebarDiagnosesOpenStorageKey = "pi360.ws.sidebar.diagnoses.open";
const workspaceSidebarCaseChecklistOpenStorageKey = "pi360.ws.sidebar.caseChecklist.open";
const workspaceSidebarCustomizeReportOpenStorageKey = "pi360.ws.sidebar.customizeReport.open";
const workspaceSidebarClaimsOpenStorageKey = "pi360.ws.sidebar.claims.open";
const workspaceSidebarTreatmentPlanOpenStorageKey = "pi360.ws.sidebar.treatmentPlan.open";

export default function WorkspacePageClient() {
  const router = useRouter();
  const {
    isHydrated,
    selectedPatient,
    selectPatient,
    clearSelectedPatient,
  } = useSelectedPatient();
  const [isDemographicsOpen, setIsDemographicsOpen] = useState(() => {
    try {
      return typeof window === "undefined"
        ? true
        : window.sessionStorage.getItem(workspaceDemographicsOpenStorageKey) !== "0";
    } catch {
      return true;
    }
  });
  const [demographicsDraft, setDemographicsDraft] = useState<WorkspaceDemographicsDraft | null>(null);
  const [isSavingDemographics, setIsSavingDemographics] = useState(false);
  const [demographicsSaveMessage, setDemographicsSaveMessage] = useState("");
  const [demographicsSaveError, setDemographicsSaveError] = useState(false);
  const [facilities, setFacilities] = useState<FacilityOption[]>([]);
  const [facilityError, setFacilityError] = useState("");
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(() => {
    try {
      return typeof window === "undefined"
        ? true
        : window.sessionStorage.getItem(workspaceAddNoteOpenStorageKey) !== "0";
    } catch {
      return true;
    }
  });
  const [isUpdatesOpen, setIsUpdatesOpen] = useState(() => {
    try {
      return typeof window === "undefined"
        ? true
        : window.sessionStorage.getItem(workspaceUpdatesOpenStorageKey) !== "0";
    } catch {
      return true;
    }
  });
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

  const setAllWorkspaceCardsOpen = (open: boolean) => {
    setIsDemographicsOpen(open);
    setIsAddNoteOpen(open);
    setIsUpdatesOpen(open);

    if (typeof window !== "undefined") {
      try {
        const value = open ? "1" : "0";
        const keys = [
          workspaceDemographicsOpenStorageKey,
          workspaceAddNoteOpenStorageKey,
          workspaceUpdatesOpenStorageKey,
          workspaceSidebarAppointmentsOpenStorageKey,
          workspaceSidebarDiagnosesOpenStorageKey,
          workspaceSidebarCaseChecklistOpenStorageKey,
          workspaceSidebarCustomizeReportOpenStorageKey,
          workspaceSidebarClaimsOpenStorageKey,
          workspaceSidebarTreatmentPlanOpenStorageKey,
        ];

        keys.forEach((key) => window.sessionStorage.setItem(key, value));
      } catch {
        // ignore - storage may be unavailable
      }

      window.dispatchEvent(
        new CustomEvent(workspaceToggleAllCardsEventName, {
          detail: { open },
        }),
      );
    }
  };

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!selectedPatient) {
      router.replace("/patients");
    }
  }, [isHydrated, router, selectedPatient]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(workspaceDemographicsOpenStorageKey, isDemographicsOpen ? "1" : "0");
    } catch {
      // ignore - storage may be unavailable
    }
  }, [isDemographicsOpen]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(workspaceAddNoteOpenStorageKey, isAddNoteOpen ? "1" : "0");
    } catch {
      // ignore - storage may be unavailable
    }
  }, [isAddNoteOpen]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(workspaceUpdatesOpenStorageKey, isUpdatesOpen ? "1" : "0");
    } catch {
      // ignore - storage may be unavailable
    }
  }, [isUpdatesOpen]);

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

  const resetProgressNoteComposer = () => {
    setProgressNoteText("");
    setProgressNoteTags(defaultProgressNoteTags());
    setImportantToClinicSelection(null);
    setNotifyLawyerSelection(null);
    setRecipientModal(null);
  };

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

      setRecipientModal({
        type: "importantToClinic",
        selectedEmails: [...(importantToClinicSelection?.emails ?? recipientOptions?.clinicEmails ?? [])],
        followEmailChain:
          importantToClinicSelection?.followEmailChain ??
          recipientOptions?.defaults.clinicFollowEmailChain ??
          false,
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

      setRecipientModal({
        type: "notifyLawyer",
        selectedEmails: [...(notifyLawyerSelection?.emails ?? recipientOptions?.lawyerEmails ?? [])],
        followEmailChain:
          notifyLawyerSelection?.followEmailChain ??
          recipientOptions?.defaults.lawyerFollowEmailChain ??
          false,
        updateLawyerPortal:
          notifyLawyerSelection?.updateLawyerPortal ??
          recipientOptions?.defaults.lawyerUpdatePortal ??
          false,
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
      const options = await getPatientLopRequestOptions(selectedPatient.pid);
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
      resetProgressNoteComposer();
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
      resetProgressNoteComposer();
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
      <WorkspaceHeader
        patientName={selectedPatient.name}
        patientMeta={patientMeta}
        onCloseWorkspace={handleCloseWorkspace}
        onExpandAllCards={() => setAllWorkspaceCardsOpen(true)}
        onCollapseAllCards={() => setAllWorkspaceCardsOpen(false)}
      />

      <div className="workspace-grid">
        <div className="grid">
          <WorkspaceDemographicsCard
            isOpen={isDemographicsOpen}
            isSaving={isSavingDemographics}
            demographicsDraft={demographicsDraft}
            demographicsSaveMessage={demographicsSaveMessage}
            demographicsSaveError={demographicsSaveError}
            facilities={facilities}
            facilityError={facilityError}
            onSave={handleSaveDemographics}
            onToggleOpen={() => setIsDemographicsOpen((current) => !current)}
            onFieldChange={handleDemographicsFieldChange}
            onFacilityChange={handleFacilityInputChange}
          />

          <WorkspaceProgressNoteCard
            isOpen={isAddNoteOpen}
            progressNoteText={progressNoteText}
            progressNoteTags={progressNoteTags}
            recipientOptionsLoading={recipientOptionsLoading}
            recipientOptionsError={recipientOptionsError}
            importantToClinicSelection={importantToClinicSelection}
            notifyLawyerSelection={notifyLawyerSelection}
            progressNotesMessage={progressNotesMessage}
            isSavingProgressNote={isSavingProgressNote}
            lopRequestOptionsLoading={lopRequestOptionsLoading}
            isSendingLopRequest={isSendingLopRequest}
            onToggleOpen={() => setIsAddNoteOpen((current) => !current)}
            onSaveNote={handleSaveProgressNote}
            onOpenLopRequestModal={handleOpenLopRequestModal}
            onNoteChange={setProgressNoteText}
            onTagChange={handleProgressNoteTagChange}
          />

          <WorkspaceUpdatesCard
            isOpen={isUpdatesOpen}
            noteFilter={noteFilter}
            noteFilterQuery={noteFilterQuery}
            notesListFilters={notesListFilters}
            progressNotes={progressNotes}
            notesPagination={notesPagination}
            progressNotesLoading={progressNotesLoading}
            progressNotesError={progressNotesError}
            isNotesListFiltered={isNotesListFiltered}
            notesListRef={notesListRef}
            onToggleOpen={() => setIsUpdatesOpen((current) => !current)}
            onNoteFilterChange={setNoteFilter}
            onOpenNoteEditor={handleOpenNoteEditor}
            onResetNotesView={handleResetNotesView}
            onFiltersChange={(updater) => setNotesListFilters((current) => updater(current))}
            onPageChange={setNotesPage}
          />
        </div>

        <WorkspaceSidebarSections
          selectedPatient={selectedPatient}
          treatmentPlanValue={treatmentPlanValue}
        />
      </div>

      {lopRequestModal && (
        <LopRequestModal
          lopRequestModal={lopRequestModal}
          isSendingLopRequest={isSendingLopRequest}
          onClose={() => setLopRequestModal(null)}
          onToggleEmail={toggleLopRequestModalEmail}
          onSend={handleSendLopRequest}
        />
      )}

      {recipientModal && (
        <RecipientModal
          recipientModal={recipientModal}
          activeRecipientEmails={activeRecipientEmails}
          onCancel={handleRecipientModalCancel}
          onToggleEmail={toggleRecipientModalEmail}
          onToggleFollowEmailChain={(checked) =>
            setRecipientModal((current) =>
              current
                ? {
                    ...current,
                    followEmailChain: checked,
                  }
                : current,
            )
          }
          onToggleUpdateLawyerPortal={(checked) =>
            setRecipientModal((current) =>
              current
                ? {
                    ...current,
                    updateLawyerPortal: checked,
                  }
                : current,
            )
          }
          onSave={handleRecipientModalSave}
        />
      )}
    </section>
  );
}
