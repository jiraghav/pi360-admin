"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useSelectedPatient } from "@/app/components/SelectedPatientProvider";
import { getFacilities, type FacilityOption } from "@/lib/facilities";
import {
  getPatientsPage,
  savePatientDemographics,
  savePatientVisitsBilling,
  type PatientListItem,
  type PatientsPagination,
} from "@/lib/patients";
import {
  createPatientProgressNote,
  defaultProgressNoteTags,
  getPatientProgressNoteRecipientOptions,
  type ProgressNoteEmailSelection,
  type ProgressNoteLawyerSelection,
  type ProgressNoteRecipientOptions,
  type ProgressNoteTagState,
} from "@/lib/progress-notes";
import { createWorkspacePatientFromListItem } from "@/lib/workspace";
import { WorkspaceProgressNoteCard } from "@/app/(dashboard)/workspace/components/WorkspaceProgressNoteCard";
import { RecipientModal } from "@/app/(dashboard)/workspace/components/RecipientModal";
import type {
  ProgressNoteRecipientModalState,
} from "@/app/(dashboard)/workspace/types";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const fallbackPagination: PatientsPagination = {
  page: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 1,
};

interface PatientDemographicsDraft {
  name: string;
  phone: string;
  email: string;
  facilityId: number | null;
  facilityName: string;
  dob: string;
  doi: string;
}

interface PatientVisitsBillingDraft {
  lastVisit: string;
  nextVisit: string;
  balance: string;
  paymentStatus: string;
}

function formatDate(value: string | null) {
  if (!value) {
    return "N/A";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return shortDateFormatter.format(parsed);
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

function formatPhone(value: string | null) {
  if (!value) {
    return null;
  }

  const digits = value.replace(/\D/g, "");
  const normalizedDigits = digits.length === 11 && digits.startsWith("1")
    ? digits.slice(1)
    : digits;

  if (normalizedDigits.length !== 10) {
    return value;
  }

  return `(${normalizedDigits.slice(0, 3)}) ${normalizedDigits.slice(3, 6)}-${normalizedDigits.slice(6)}`;
}

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

function getPatientMeta(patient: PatientListItem) {
  const segments: string[] = [];

  const formattedPhone = formatPhone(patient.phone);

  if (formattedPhone) {
    segments.push(formattedPhone);
  }

  if (patient.email) {
    segments.push(patient.email);
  }

  segments.push(`Balance: ${currencyFormatter.format(patient.balance)}`);

  return segments.join(" | ");
}

function getPatientKey(patient: PatientListItem) {
  return patient.pid ?? patient.uuid ?? patient.name;
}

function createDemographicsDraft(patient: PatientListItem): PatientDemographicsDraft {
  return {
    name: patient.name || "",
    phone: formatPhone(patient.phone) || patient.phone || "",
    email: patient.email || "",
    facilityId: patient.facilityId,
    facilityName: patient.facility || "",
    dob: toDateInputValue(patient.dob),
    doi: toDateInputValue(patient.doi),
  };
}

function createVisitsBillingDraft(patient: PatientListItem): PatientVisitsBillingDraft {
  return {
    lastVisit: toDateInputValue(patient.lastVisit),
    nextVisit: toDateInputValue(patient.nextVisit),
    balance: String(patient.balance ?? 0),
    paymentStatus: patient.balance > 0 ? "Balance due" : "Paid",
  };
}

const patientsSearchStorageKey = "pi360.patients.search";
const workspaceAddNoteOpenStorageKey = "pi360.ws.card.add-note.open";
const workspaceUpdatesOpenStorageKey = "pi360.ws.card.updates.open";

export default function PatientsPageClient() {
  const router = useRouter();
  const { selectPatient } = useSelectedPatient();
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [pagination, setPagination] = useState<PatientsPagination>(fallbackPagination);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const didInitSearchRef = useRef(false);
  const skipDebounceOnceRef = useRef(false);
  const skipPersistOnceRef = useRef(true);
  const [expandedPatientId, setExpandedPatientId] = useState<string | number | null>(null);
  const [facilities, setFacilities] = useState<FacilityOption[]>([]);
  const [facilityError, setFacilityError] = useState("");
  const [patientDrafts, setPatientDrafts] = useState<Record<string, PatientDemographicsDraft>>({});
  const [patientVisitsDrafts, setPatientVisitsDrafts] = useState<Record<string, PatientVisitsBillingDraft>>({});
  const [saveStateByPatient, setSaveStateByPatient] = useState<Record<string, { status: "idle" | "saving" | "saved" | "error"; message: string }>>({});
  const [visitsSaveStateByPatient, setVisitsSaveStateByPatient] = useState<Record<string, { status: "idle" | "saving" | "saved" | "error"; message: string }>>({});
  const [notesBodyByPatient, setNotesBodyByPatient] = useState<Record<string, string>>({});
  const [notesSaveStateByPatient, setNotesSaveStateByPatient] = useState<Record<string, { status: "idle" | "saving" | "saved" | "error"; message: string }>>({});
  const [progressNoteTagsByPatient, setProgressNoteTagsByPatient] = useState<Record<string, ProgressNoteTagState>>({});
  const [importantToClinicSelectionByPatient, setImportantToClinicSelectionByPatient] = useState<Record<string, ProgressNoteEmailSelection | null>>({});
  const [notifyLawyerSelectionByPatient, setNotifyLawyerSelectionByPatient] = useState<Record<string, ProgressNoteLawyerSelection | null>>({});
  const [recipientOptionsByPatient, setRecipientOptionsByPatient] = useState<Record<string, ProgressNoteRecipientOptions | null>>({});
  const [recipientOptionsLoadingByPatient, setRecipientOptionsLoadingByPatient] = useState<Record<string, boolean>>({});
  const [recipientOptionsErrorByPatient, setRecipientOptionsErrorByPatient] = useState<Record<string, string>>({});
  const [recipientModal, setRecipientModal] = useState<{ patientKey: string; state: ProgressNoteRecipientModalState } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const expandedPatient =
    expandedPatientId == null
      ? null
      : patients.find((patient) => getPatientKey(patient) === expandedPatientId) ?? null;

  useEffect(() => {
    if (!expandedPatient?.pid) {
      return;
    }

    const patientKey = String(getPatientKey(expandedPatient));
    const hasRecipientOptions = Object.prototype.hasOwnProperty.call(recipientOptionsByPatient, patientKey);
    if (hasRecipientOptions || recipientOptionsLoadingByPatient[patientKey]) {
      return;
    }

    let isMounted = true;

    const fetchRecipientOptions = async () => {
      setRecipientOptionsLoadingByPatient((current) => ({ ...current, [patientKey]: true }));
      setRecipientOptionsErrorByPatient((current) => ({ ...current, [patientKey]: "" }));

      try {
        const data = await getPatientProgressNoteRecipientOptions(expandedPatient.pid as number);
        if (!isMounted) {
          return;
        }
        setRecipientOptionsByPatient((current) => ({ ...current, [patientKey]: data }));
      } catch (err) {
        console.error("Failed to load recipient options:", err);
        if (!isMounted) {
          return;
        }
        setRecipientOptionsByPatient((current) => ({ ...current, [patientKey]: null }));
        setRecipientOptionsErrorByPatient((current) => ({ ...current, [patientKey]: "Notification email options could not be loaded." }));
      } finally {
        if (isMounted) {
          setRecipientOptionsLoadingByPatient((current) => ({ ...current, [patientKey]: false }));
        }
      }
    };

    void fetchRecipientOptions();

    return () => {
      isMounted = false;
    };
  }, [expandedPatient?.pid, expandedPatientId]);

  useEffect(() => {
    if (didInitSearchRef.current) {
      return;
    }

    didInitSearchRef.current = true;

    try {
      const storedSearch = window.sessionStorage.getItem(patientsSearchStorageKey) ?? "";
      if (!storedSearch.trim()) {
        return;
      }

      skipDebounceOnceRef.current = true;
      setSearchInput(storedSearch);
      setSearchQuery(storedSearch.trim());
      startTransition(() => {
        setPagination((current) => (current.page === 1 ? current : { ...current, page: 1 }));
      });
    } catch {
      // ignore - localStorage may be unavailable (privacy mode / blocked)
    }
  }, []);

  useEffect(() => {
    if (skipDebounceOnceRef.current) {
      skipDebounceOnceRef.current = false;
      setSearchQuery(searchInput.trim());
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchInput]);

  useEffect(() => {
    if (skipPersistOnceRef.current) {
      skipPersistOnceRef.current = false;
      return;
    }

    try {
      const nextValue = searchInput.trim() ? searchInput : "";
      if (nextValue) {
        window.sessionStorage.setItem(patientsSearchStorageKey, nextValue);
      } else {
        window.sessionStorage.removeItem(patientsSearchStorageKey);
      }
    } catch {
      // ignore - localStorage may be unavailable (privacy mode / blocked)
    }
  }, [searchInput]);

  useEffect(() => {
    startTransition(() => {
      setPagination((current) => {
        if (current.page === 1) {
          return current;
        }

        return {
          ...current,
          page: 1,
        };
      });
    });
  }, [searchQuery]);

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
      } catch (err) {
        console.error("Failed to load facilities:", err);
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
    let isMounted = true;

    const fetchPatients = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getPatientsPage({
          page: pagination.page,
          pageSize: pagination.pageSize,
          search: searchQuery,
        });

        if (!isMounted) {
          return;
        }

        setPatients(data.patients);
        setPagination(data.pagination);
        setPatientDrafts((current) => {
          const nextDrafts = { ...current };

          for (const patient of data.patients) {
            const key = String(getPatientKey(patient));
            if (!nextDrafts[key]) {
              nextDrafts[key] = createDemographicsDraft(patient);
            }
          }

          return nextDrafts;
        });
        setPatientVisitsDrafts((current) => {
          const nextDrafts = { ...current };

          for (const patient of data.patients) {
            const key = String(getPatientKey(patient));
            if (!nextDrafts[key]) {
              nextDrafts[key] = createVisitsBillingDraft(patient);
            }
          }

          return nextDrafts;
        });
      } catch (err) {
        console.error("Failed to load patients:", err);

        if (!isMounted) {
          return;
        }

        setPatients([]);
        setError("Unable to load patient records right now.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPatients();

    return () => {
      isMounted = false;
    };
  }, [pagination.page, pagination.pageSize, searchQuery]);

  const patientsStart = pagination.totalItems === 0
    ? 0
    : (pagination.page - 1) * pagination.pageSize + 1;
  const patientsEnd = pagination.totalItems === 0
    ? 0
    : Math.min(pagination.page * pagination.pageSize, pagination.totalItems);

  const toggleExpandedPatient = (patient: PatientListItem) => {
    const patientKey = getPatientKey(patient);
    setExpandedPatientId((current) => (current === patientKey ? null : patientKey));
  };

  const handleDraftChange = (
    patient: PatientListItem,
    field: keyof PatientDemographicsDraft,
    value: string | number | null,
  ) => {
    const patientKey = String(getPatientKey(patient));
    const normalizedValue =
      field === "phone" && typeof value === "string" ? maskPhoneInput(value) : value;

    setPatientDrafts((current) => ({
      ...current,
      [patientKey]: {
        ...(current[patientKey] ?? createDemographicsDraft(patient)),
        [field]: normalizedValue,
      },
    }));
  };

  const handleFacilityInputChange = (patient: PatientListItem, value: string) => {
    const matchedFacility = facilities.find(
      (facility) => facility.name.toLowerCase() === value.trim().toLowerCase(),
    );

    const facilityName = matchedFacility?.name ?? value;
    const facilityId = matchedFacility?.id ?? null;

    handleDraftChange(patient, "facilityName", facilityName);
    handleDraftChange(patient, "facilityId", facilityId);
  };

  const handleVisitsDraftChange = (
    patient: PatientListItem,
    field: keyof PatientVisitsBillingDraft,
    value: string,
  ) => {
    const patientKey = String(getPatientKey(patient));

    setPatientVisitsDrafts((current) => ({
      ...current,
      [patientKey]: {
        ...(current[patientKey] ?? createVisitsBillingDraft(patient)),
        [field]: value,
      },
    }));
  };

  const handleSaveDemographics = async (patient: PatientListItem) => {
    if (!patient.pid) {
      return;
    }

    const patientKey = String(getPatientKey(patient));
    const draft = patientDrafts[patientKey] ?? createDemographicsDraft(patient);

    setSaveStateByPatient((current) => ({
      ...current,
      [patientKey]: {
        status: "saving",
        message: "Saving demographics...",
      },
    }));

    try {
      const result = await savePatientDemographics({
        pid: patient.pid,
        name: draft.name,
        phone: draft.phone,
        email: draft.email,
        facilityId: draft.facilityId,
        dob: draft.dob,
        doi: draft.doi,
      });

      if (result.patient) {
        setPatients((current) =>
          current.map((item) =>
            item.pid === patient.pid
              ? {
                  ...item,
                  ...result.patient,
                }
              : item,
          ),
        );

        setPatientDrafts((current) => ({
          ...current,
          [patientKey]: createDemographicsDraft({
            ...patient,
            ...result.patient,
          }),
        }));
      }

      setSaveStateByPatient((current) => ({
        ...current,
        [patientKey]: {
          status: "saved",
          message: result.message,
        },
      }));
    } catch (err) {
      console.error("Failed to save demographics:", err);
      setSaveStateByPatient((current) => ({
        ...current,
        [patientKey]: {
          status: "error",
          message: "Unable to save demographics right now.",
        },
      }));
    }
  };

  const handleSaveVisitsBilling = async (patient: PatientListItem) => {
    if (!patient.pid) {
      return;
    }

    const patientKey = String(getPatientKey(patient));
    const draft = patientVisitsDrafts[patientKey] ?? createVisitsBillingDraft(patient);

    setVisitsSaveStateByPatient((current) => ({
      ...current,
      [patientKey]: {
        status: "saving",
        message: "Saving visits and billing...",
      },
    }));

    try {
      const result = await savePatientVisitsBilling({
        pid: patient.pid,
        lastVisit: draft.lastVisit,
        nextVisit: draft.nextVisit,
        balance: draft.balance,
      });

      if (result.patient) {
        setPatients((current) =>
          current.map((item) =>
            item.pid === patient.pid
              ? {
                  ...item,
                  ...result.patient,
                }
              : item,
          ),
        );

        setPatientVisitsDrafts((current) => ({
          ...current,
          [patientKey]: {
            ...(current[patientKey] ?? createVisitsBillingDraft(patient)),
            ...createVisitsBillingDraft({
              ...patient,
              ...result.patient,
            }),
            paymentStatus: draft.paymentStatus,
          },
        }));
      }

      setVisitsSaveStateByPatient((current) => ({
        ...current,
        [patientKey]: {
          status: "saved",
          message: result.message,
        },
      }));
    } catch (err) {
      console.error("Failed to save visits and billing:", err);
      setVisitsSaveStateByPatient((current) => ({
        ...current,
        [patientKey]: {
          status: "error",
          message: "Unable to save visits and billing right now.",
        },
      }));
    }
  };

  const handleOpenWorkspace = (patient: PatientListItem) => {
    selectPatient(createWorkspacePatientFromListItem(patient));
    router.push("/workspace");
  };

  const handleViewAllNotes = (patient: PatientListItem) => {
    try {
      window.sessionStorage.setItem(workspaceAddNoteOpenStorageKey, "0");
      window.sessionStorage.setItem(workspaceUpdatesOpenStorageKey, "1");
    } catch {
      // ignore - sessionStorage may be unavailable (privacy mode / blocked)
    }

    handleOpenWorkspace(patient);
  };

  const handleNotesBodyChange = (patientKey: string, value: string) => {
    setNotesBodyByPatient((current) => ({
      ...current,
      [patientKey]: value,
    }));
  };

  const handleSaveNote = async (patient: PatientListItem) => {
    const patientKey = String(getPatientKey(patient));
    const body = (notesBodyByPatient[patientKey] ?? "").trim();

    if (!body) {
      setNotesSaveStateByPatient((current) => ({
        ...current,
        [patientKey]: { status: "error", message: "Please enter a note first." },
      }));
      return;
    }

    if (!patient.pid) {
      setNotesSaveStateByPatient((current) => ({
        ...current,
        [patientKey]: { status: "error", message: "Notes are available once a patient record with an id is selected." },
      }));
      return;
    }

    const tags = progressNoteTagsByPatient[patientKey] ?? defaultProgressNoteTags();
    const importantToClinicSelection = importantToClinicSelectionByPatient[patientKey] ?? null;
    const notifyLawyerSelection = notifyLawyerSelectionByPatient[patientKey] ?? null;

    setNotesSaveStateByPatient((current) => ({
      ...current,
      [patientKey]: { status: "saving", message: "" },
    }));

    try {
      const result = await createPatientProgressNote({
        pid: patient.pid,
        body,
        tags,
        importantToClinicSelection,
        notifyLawyerSelection,
      });

      setNotesBodyByPatient((current) => ({
        ...current,
        [patientKey]: "",
      }));
      setProgressNoteTagsByPatient((current) => ({
        ...current,
        [patientKey]: defaultProgressNoteTags(),
      }));
      setImportantToClinicSelectionByPatient((current) => ({
        ...current,
        [patientKey]: null,
      }));
      setNotifyLawyerSelectionByPatient((current) => ({
        ...current,
        [patientKey]: null,
      }));

      setNotesSaveStateByPatient((current) => ({
        ...current,
        [patientKey]: { status: "saved", message: result.message },
      }));
    } catch (err) {
      console.error("Failed to save progress note:", err);
      setNotesSaveStateByPatient((current) => ({
        ...current,
        [patientKey]: { status: "error", message: "Unable to save note right now." },
      }));
    }
  };

  const handleProgressNoteTagChange = (
    patient: PatientListItem,
    field: keyof ProgressNoteTagState,
    checked: boolean,
  ) => {
    const patientKey = String(getPatientKey(patient));
    const recipientOptions = recipientOptionsByPatient[patientKey] ?? null;

    if (field === "importantToClinic") {
      if (!checked) {
        setProgressNoteTagsByPatient((current) => ({
          ...current,
          [patientKey]: {
            ...(current[patientKey] ?? defaultProgressNoteTags()),
            importantToClinic: false,
          },
        }));
        setImportantToClinicSelectionByPatient((current) => ({ ...current, [patientKey]: null }));
        if (recipientModal?.patientKey === patientKey && recipientModal.state.type === "importantToClinic") {
          setRecipientModal(null);
        }
        return;
      }

      setRecipientModal({
        patientKey,
        state: {
          type: "importantToClinic",
          selectedEmails: [
            ...(importantToClinicSelectionByPatient[patientKey]?.emails ?? recipientOptions?.clinicEmails ?? []),
          ],
          followEmailChain:
            importantToClinicSelectionByPatient[patientKey]?.followEmailChain ??
            recipientOptions?.defaults.clinicFollowEmailChain ??
            false,
          updateLawyerPortal: false,
        },
      });
      return;
    }

    if (field === "notifyLawyer") {
      if (!checked) {
        setProgressNoteTagsByPatient((current) => ({
          ...current,
          [patientKey]: {
            ...(current[patientKey] ?? defaultProgressNoteTags()),
            notifyLawyer: false,
          },
        }));
        setNotifyLawyerSelectionByPatient((current) => ({ ...current, [patientKey]: null }));
        if (recipientModal?.patientKey === patientKey && recipientModal.state.type === "notifyLawyer") {
          setRecipientModal(null);
        }
        return;
      }

      setRecipientModal({
        patientKey,
        state: {
          type: "notifyLawyer",
          selectedEmails: [
            ...(notifyLawyerSelectionByPatient[patientKey]?.emails ?? recipientOptions?.lawyerEmails ?? []),
          ],
          followEmailChain:
            notifyLawyerSelectionByPatient[patientKey]?.followEmailChain ??
            recipientOptions?.defaults.lawyerFollowEmailChain ??
            false,
          updateLawyerPortal:
            notifyLawyerSelectionByPatient[patientKey]?.updateLawyerPortal ??
            recipientOptions?.defaults.lawyerUpdatePortal ??
            false,
        },
      });
      return;
    }

    setProgressNoteTagsByPatient((current) => ({
      ...current,
      [patientKey]: {
        ...(current[patientKey] ?? defaultProgressNoteTags()),
        [field]: checked,
      },
    }));
  };

  const toggleRecipientModalEmail = (email: string, checked: boolean) => {
    setRecipientModal((current) => {
      if (!current) {
        return current;
      }

      const nextEmails = checked
        ? Array.from(new Set([...current.state.selectedEmails, email]))
        : current.state.selectedEmails.filter((item) => item !== email);

      return {
        ...current,
        state: {
          ...current.state,
          selectedEmails: nextEmails,
        },
      };
    });
  };

  const handleRecipientModalCancel = () => {
    if (!recipientModal) {
      return;
    }

    const patientKey = recipientModal.patientKey;

    if (recipientModal.state.type === "importantToClinic") {
      setProgressNoteTagsByPatient((current) => ({
        ...current,
        [patientKey]: {
          ...(current[patientKey] ?? defaultProgressNoteTags()),
          importantToClinic: false,
        },
      }));
      setImportantToClinicSelectionByPatient((current) => ({ ...current, [patientKey]: null }));
    }

    if (recipientModal.state.type === "notifyLawyer") {
      setProgressNoteTagsByPatient((current) => ({
        ...current,
        [patientKey]: {
          ...(current[patientKey] ?? defaultProgressNoteTags()),
          notifyLawyer: false,
        },
      }));
      setNotifyLawyerSelectionByPatient((current) => ({ ...current, [patientKey]: null }));
    }

    setRecipientModal(null);
  };

  const handleRecipientModalSave = () => {
    if (!recipientModal) {
      return;
    }

    const patientKey = recipientModal.patientKey;

    if (recipientModal.state.type === "importantToClinic") {
      if (recipientModal.state.selectedEmails.length === 0) {
        setProgressNoteTagsByPatient((current) => ({
          ...current,
          [patientKey]: {
            ...(current[patientKey] ?? defaultProgressNoteTags()),
            importantToClinic: false,
          },
        }));
        setImportantToClinicSelectionByPatient((current) => ({ ...current, [patientKey]: null }));
      } else {
        setProgressNoteTagsByPatient((current) => ({
          ...current,
          [patientKey]: {
            ...(current[patientKey] ?? defaultProgressNoteTags()),
            importantToClinic: true,
          },
        }));
        setImportantToClinicSelectionByPatient((current) => ({
          ...current,
          [patientKey]: {
            emails: recipientModal.state.selectedEmails,
            followEmailChain: recipientModal.state.followEmailChain,
          },
        }));
      }
    }

    if (recipientModal.state.type === "notifyLawyer") {
      if (recipientModal.state.selectedEmails.length === 0) {
        setProgressNoteTagsByPatient((current) => ({
          ...current,
          [patientKey]: {
            ...(current[patientKey] ?? defaultProgressNoteTags()),
            notifyLawyer: false,
          },
        }));
        setNotifyLawyerSelectionByPatient((current) => ({ ...current, [patientKey]: null }));
      } else {
        setProgressNoteTagsByPatient((current) => ({
          ...current,
          [patientKey]: {
            ...(current[patientKey] ?? defaultProgressNoteTags()),
            notifyLawyer: true,
          },
        }));
        setNotifyLawyerSelectionByPatient((current) => ({
          ...current,
          [patientKey]: {
            emails: recipientModal.state.selectedEmails,
            followEmailChain: recipientModal.state.followEmailChain,
            updateLawyerPortal: recipientModal.state.updateLawyerPortal,
          },
        }));
      }
    }

    setRecipientModal(null);
  };


  return (
    <section className="patients-page">
      <div className="card patients-card">
        <div className="hd patients-card-head">
          <div className="patients-card-copy">
            <div className="title">Patients</div>
            <div className="sub">Collapsed rows (fast) + Expanded view (everything you need)</div>
          </div>
          <div className="right patients-card-actions">
            <div
              className="toolbar patients-toolbar"
              style={{
                width: "min(820px, 100%)",
                justifyContent: "flex-end",
              }}
            >
              <div className="search-mini patients-search">
                <input
                  id="patientSearch"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search patient, DOI, facility, status..."
                />
              </div>
              <button className="mini primary" id="addPatientBtn" type="button">
                + Add Patient
              </button>
            </div>
          </div>
        </div>

        <div className="bd" style={{ padding: 0 }}>
          <div
            className="patient-row patients-row patients-row-head"
            style={{
              background: "rgba(255,255,255,.7)",
              fontWeight: 950,
              color: "var(--muted)",
              fontSize: "12px",
            }}
          >
            <div>Patient</div>
            <div>DOB / DOI</div>
            <div>Last update</div>
            <div className="hide-md">Facility</div>
            <div>Status</div>
            <div className="right">Actions</div>
          </div>

          {error && (
            <div className="softbox hint" style={{ margin: "12px" }}>
              {error}
            </div>
          )}

          {loading && (
            <div className="softbox hint" style={{ margin: "12px" }}>
              Loading patient records...
            </div>
          )}

          {!loading && patients.length === 0 && (
            <div className="softbox hint" style={{ margin: "12px" }}>
              No patients matched this search.
            </div>
          )}

          <div id="patientList">
            {patients.map((patient) => (
              <div key={`${patient.pid ?? patient.uuid ?? patient.name}-${patient.dob ?? "no-dob"}`}>
                {(() => {
                  const patientKey = getPatientKey(patient);
                  const draft = patientDrafts[String(patientKey)] ?? createDemographicsDraft(patient);
                  const visitsDraft = patientVisitsDrafts[String(patientKey)] ?? createVisitsBillingDraft(patient);
                  const saveState = saveStateByPatient[String(patientKey)] ?? {
                    status: "idle" as const,
                    message: "",
                  };
                  const visitsSaveState = visitsSaveStateByPatient[String(patientKey)] ?? {
                    status: "idle" as const,
                    message: "",
                  };

                  return (
                    <>
                <div
                  className="patient-row patients-row"
                  data-pid={patientKey}
                >
                  <div className="patients-primary">
                    <div className="name">{patient.name || "Unnamed patient"}</div>
                    <div className="meta">{getPatientMeta(patient)}</div>
                  </div>

                  <div className="patients-dates">
                    <div style={{ fontWeight: 900 }}>DOB {formatDate(patient.dob)}</div>
                    <div className="meta">DOI {formatDate(patient.doi)}</div>
                  </div>

                  <div className="patients-updated">
                    <div style={{ fontWeight: 900 }}>{formatDate(patient.lastUpdated)}</div>
                    <div className="meta">Last visit: {formatDate(patient.lastVisit)}</div>
                  </div>

                  <div className="hide-md patients-facility">
                    <div style={{ fontWeight: 900 }}>{patient.facility || "N/A"}</div>
                    <div className="meta">Next: {formatDate(patient.nextVisit)}</div>
                  </div>

                  <div className="patients-status">
                    {patient.needsUpdate ? (
                      <span className="chip bad blink">Needs update</span>
                    ) : (
                      <span className="chip good">Up to date</span>
                    )}
                    <div style={{ marginTop: "6px" }}>
                      <span className="chip good">{patient.status || "Active"}</span>
                    </div>
                  </div>

                  <div className="right inline-actions patients-actions">
                    <button
                      className="mini"
                      type="button"
                      onClick={() => toggleExpandedPatient(patient)}
                    >
                      {expandedPatientId === patientKey ? "Collapse" : "Expand"}
                    </button>
                    <button
                      className="mini primary"
                      type="button"
                      onClick={() => handleOpenWorkspace(patient)}
                    >
                      Open EMR
                    </button>
                  </div>
                </div>

                {expandedPatientId === patientKey && (
                  <div className="patient-expanded">
                    <div className="actions">
                      <button className="mini primary" type="button">Send referral</button>
                      <button className="mini" type="button">Send CIC message</button>
                      <button className="mini" type="button">Send CIC task</button>
                      <button className="mini good" type="button">Mark updated</button>
                      <button className="mini" type="button">Copy patient</button>
                    </div>

                    <div className="three-col">
                      <div className="softbox">
                        <div style={{ fontWeight: 950 }}>Demographics</div>
                        <div className="sep"></div>
                        <div className="two-col">
                          <div className="field">
                            <label>Name *</label>
                            <input
                              value={draft.name}
                              onChange={(event) => handleDraftChange(patient, "name", event.target.value)}
                            />
                          </div>
                          <div className="field">
                            <label>Phone</label>
                            <input
                              value={draft.phone}
                              onChange={(event) => handleDraftChange(patient, "phone", event.target.value)}
                            />
                          </div>
                          <div className="field">
                            <label>Email</label>
                            <input
                              value={draft.email}
                              onChange={(event) => handleDraftChange(patient, "email", event.target.value)}
                            />
                          </div>
                          <div className="field">
                            <label>Facility *</label>
                            <input
                              list="patients-facility-options"
                              value={draft.facilityName}
                              onChange={(event) => handleFacilityInputChange(patient, event.target.value)}
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
                              value={draft.dob}
                              onChange={(event) => handleDraftChange(patient, "dob", event.target.value)}
                            />
                          </div>
                          <div className="field">
                            <label>DOI</label>
                            <input
                              type="date"
                              value={draft.doi}
                              onChange={(event) => handleDraftChange(patient, "doi", event.target.value)}
                            />
                          </div>
                        </div>
                        <div className="actions-row">
                          <button
                            className="mini primary"
                            type="button"
                            disabled={saveState.status === "saving"}
                            onClick={() => handleSaveDemographics(patient)}
                          >
                            {saveState.status === "saving" ? "Saving..." : "Save"}
                          </button>
                        </div>
                        {saveState.message && (
                          <div
                            className="hint"
                            style={{
                              marginTop: "8px",
                              color: saveState.status === "error" ? "var(--bad)" : undefined,
                            }}
                          >
                            {saveState.message}
                          </div>
                        )}
                      </div>

                      <div className="softbox">
                        <div style={{ fontWeight: 950 }}>Visits + Billing</div>
                        <div className="sep"></div>
                        <div className="two-col">
                          <div className="field">
                            <label>Last visit</label>
                            <input
                              type="date"
                              value={visitsDraft.lastVisit}
                              onChange={(event) => handleVisitsDraftChange(patient, "lastVisit", event.target.value)}
                            />
                          </div>
                          <div className="field">
                            <label>Next visit</label>
                            <input
                              type="date"
                              value={visitsDraft.nextVisit}
                              onChange={(event) => handleVisitsDraftChange(patient, "nextVisit", event.target.value)}
                            />
                          </div>
                          <div className="field">
                            <label>Current bill amount</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={visitsDraft.balance}
                              onChange={(event) => handleVisitsDraftChange(patient, "balance", event.target.value)}
                            />
                          </div>
                        </div>
                        <div className="actions-row">
                          <button
                            className="mini primary"
                            type="button"
                            disabled={visitsSaveState.status === "saving"}
                            onClick={() => handleSaveVisitsBilling(patient)}
                          >
                            {visitsSaveState.status === "saving" ? "Saving..." : "Save updates"}
                          </button>
                        </div>
                        {visitsSaveState.message && (
                          <div
                            className="hint"
                            style={{
                              marginTop: "8px",
                              color: visitsSaveState.status === "error" ? "var(--bad)" : undefined,
                            }}
                          >
                            {visitsSaveState.message}
                          </div>
                        )}
                      </div>

                      {(() => {
                        const patientKey = String(getPatientKey(patient));
                        const isOpen = true;
                        const progressNoteText = notesBodyByPatient[patientKey] ?? "";
                        const progressNoteTags = progressNoteTagsByPatient[patientKey] ?? defaultProgressNoteTags();
                        const saveState = notesSaveStateByPatient[patientKey] ?? { status: "idle", message: "" };
                        const recipientOptionsLoading = recipientOptionsLoadingByPatient[patientKey] ?? false;
                        const recipientOptionsError = recipientOptionsErrorByPatient[patientKey] ?? "";

                        return (
                          <WorkspaceProgressNoteCard
                            isOpen={isOpen}
                            showToggleButton={false}
                            progressNoteText={progressNoteText}
                            progressNoteTags={progressNoteTags}
                            recipientOptionsLoading={recipientOptionsLoading}
                            recipientOptionsError={recipientOptionsError}
                            importantToClinicSelection={importantToClinicSelectionByPatient[patientKey] ?? null}
                            notifyLawyerSelection={notifyLawyerSelectionByPatient[patientKey] ?? null}
                            progressNotesMessage={saveState.message}
                            isSavingProgressNote={saveState.status === "saving"}
                            lopRequestOptionsLoading={false}
                            isSendingLopRequest={false}
                            secondaryAction={{
                              label: "View all notes",
                              onClick: () => handleViewAllNotes(patient),
                              id: "patientsViewAllNotes",
                            }}
                            onToggleOpen={() => {}}
                            onSaveNote={() => void handleSaveNote(patient)}
                            onOpenLopRequestModal={() => {}}
                            onNoteChange={(value) => handleNotesBodyChange(patientKey, value)}
                            onTagChange={(field, checked) => handleProgressNoteTagChange(patient, field, checked)}
                          />
                        );
                      })()}
                    </div>
                  </div>
                )}
                    </>
                  );
                })()}
              </div>
            ))}
          </div>

          <datalist id="patients-facility-options">
            {facilities.map((facility) => {
              const suffix = [facility.city, facility.state].filter(Boolean).join(", ");
              const label = suffix ? `${facility.name} (${suffix})` : facility.name;

              return <option key={facility.id} value={facility.name} label={label} />;
            })}
          </datalist>

          <div className="row wrap dashboard-pagination-row patients-pagination" style={{ padding: "12px" }}>
            <div className="hint patients-pagination-summary">
              Showing {patientsStart}-{patientsEnd} of {pagination.totalItems}
            </div>
            <div className="spacer" />
            <div className="hint dashboard-pagination-meta patients-pagination-meta">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <button
              className="mini"
              type="button"
              disabled={loading || isPending || pagination.page <= 1}
              onClick={() =>
                startTransition(() => {
                  setPagination((current) => ({
                    ...current,
                    page: Math.max(1, current.page - 1),
                  }));
                })
              }
              style={{
                opacity: loading || isPending || pagination.page <= 1 ? 0.5 : 1,
              }}
            >
              Prev
            </button>
            <button
              className="mini primary"
              type="button"
              disabled={loading || isPending || pagination.page >= pagination.totalPages}
              onClick={() =>
                startTransition(() => {
                  setPagination((current) => ({
                    ...current,
                    page: Math.min(current.totalPages, current.page + 1),
                  }));
                })
              }
              style={{
                opacity:
                  loading || isPending || pagination.page >= pagination.totalPages ? 0.5 : 1,
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {recipientModal && (
        <RecipientModal
          recipientModal={recipientModal.state}
          activeRecipientEmails={(() => {
            const options = recipientOptionsByPatient[recipientModal.patientKey];
            if (!options) {
              return [];
            }
            return recipientModal.state.type === "importantToClinic" ? options.clinicEmails : options.lawyerEmails;
          })()}
          onCancel={handleRecipientModalCancel}
          onToggleEmail={toggleRecipientModalEmail}
          onToggleFollowEmailChain={(checked) =>
            setRecipientModal((current) =>
              current
                ? {
                    ...current,
                    state: {
                      ...current.state,
                      followEmailChain: checked,
                    },
                  }
                : current,
            )
          }
          onToggleUpdateLawyerPortal={(checked) =>
            setRecipientModal((current) =>
              current
                ? {
                    ...current,
                    state: {
                      ...current.state,
                      updateLawyerPortal: checked,
                    },
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
