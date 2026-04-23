"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { SelectedWorkspacePatient } from "@/lib/workspace";
import {
  formatWorkspaceCurrency,
  formatWorkspaceDate,
} from "@/lib/workspace";
import { getPatientCaseChecklist, type PatientCaseChecklist, type PatientReportTrackingRow } from "@/lib/case-checklist";
import { downloadPatient837, getPatientClaims, type PatientClaimRow } from "@/lib/claims";
import {
  getPatientCustomReportData,
  markPatientProfileReviewed,
  removePatientProfileFromUpToDate,
  savePatientCustomReportData,
  type PatientRealReportData,
} from "@/lib/custom-report";
import { getPatientBillingSummary, type BillingGroupMode, type PatientBillingSummary } from "@/lib/billing";
import { getPatientTreatmentPlan, getPatientTreatmentPlanNotes, savePatientTreatmentPlan, type TreatmentPlanNote } from "@/lib/treatment-plan";
import { WorkspaceAppointmentsCard } from "@/app/(dashboard)/workspace/components/WorkspaceAppointmentsCard";
import { WorkspaceDiagnosesCard } from "@/app/(dashboard)/workspace/components/WorkspaceDiagnosesCard";

const caseChecklistOpenStorageKey = "pi360.ws.sidebar.caseChecklist.open";
const customizeReportOpenStorageKey = "pi360.ws.sidebar.customizeReport.open";
const claimsOpenStorageKey = "pi360.ws.sidebar.claims.open";
const treatmentPlanOpenStorageKey = "pi360.ws.sidebar.treatmentPlan.open";
const billingOpenStorageKey = "pi360.ws.sidebar.billing.open";
const billingGroupStorageKey = "pi360.ws.sidebar.billing.group";
const workspaceToggleAllCardsEventName = "pi360:workspace:toggleAllCards";
const useClientLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

interface WorkspaceSidebarSectionsProps {
  selectedPatient: SelectedWorkspacePatient;
  treatmentPlanValue: string;
}

export function WorkspaceSidebarSections({
  selectedPatient,
  treatmentPlanValue,
}: WorkspaceSidebarSectionsProps) {
  const [isCaseChecklistOpen, setIsCaseChecklistOpen] = useState(true);
  const skipPersistCaseChecklistOnceRef = useRef(true);
  const [isCustomizeReportOpen, setIsCustomizeReportOpen] = useState(true);
  const skipPersistCustomizeReportOnceRef = useRef(true);
  const [isClaimsOpen, setIsClaimsOpen] = useState(true);
  const skipPersistClaimsOnceRef = useRef(true);
  const [isTreatmentPlanOpen, setIsTreatmentPlanOpen] = useState(true);
  const skipPersistTreatmentPlanOnceRef = useRef(true);
  const [isBillingOpen, setIsBillingOpen] = useState(true);
  const skipPersistBillingOnceRef = useRef(true);
  const [billingGroup, setBillingGroup] = useState<BillingGroupMode>("super_facility");
  const [billingMessage, setBillingMessage] = useState("");
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState("");
  const [billingSummary, setBillingSummary] = useState<PatientBillingSummary | null>(null);
  const [caseChecklist, setCaseChecklist] = useState<PatientCaseChecklist | null>(null);
  const [caseChecklistReports, setCaseChecklistReports] = useState<PatientReportTrackingRow[]>([]);
  const [caseChecklistLoading, setCaseChecklistLoading] = useState(false);
  const [caseChecklistError, setCaseChecklistError] = useState("");

  const [claims, setClaims] = useState<PatientClaimRow[]>([]);
  const [selectedClaimEncounters, setSelectedClaimEncounters] = useState<number[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [claimsDownloading, setClaimsDownloading] = useState(false);
  const [claimsError, setClaimsError] = useState("");

  const [treatmentPlanText, setTreatmentPlanText] = useState("");
  const [treatmentPlanOriginal, setTreatmentPlanOriginal] = useState("");
  const [treatmentPlanDirty, setTreatmentPlanDirty] = useState(false);
  const [treatmentPlanLoading, setTreatmentPlanLoading] = useState(false);
  const [treatmentPlanSaving, setTreatmentPlanSaving] = useState(false);
  const [treatmentPlanMessage, setTreatmentPlanMessage] = useState("");
  const [treatmentPlanError, setTreatmentPlanError] = useState("");
  const [treatmentPlanNotes, setTreatmentPlanNotes] = useState<TreatmentPlanNote[]>([]);
  const [treatmentPlanNotesLoading, setTreatmentPlanNotesLoading] = useState(false);
  const [treatmentPlanNotesError, setTreatmentPlanNotesError] = useState("");

  const [customReportLoading, setCustomReportLoading] = useState(false);
  const [customReportSaving, setCustomReportSaving] = useState(false);
  const [customReportMessage, setCustomReportMessage] = useState("");
  const [customReportError, setCustomReportError] = useState("");
  const [customReportRealData, setCustomReportRealData] = useState<PatientRealReportData | null>(null);

  const [customBalance, setCustomBalance] = useState("");
  const [customInitialVisit, setCustomInitialVisit] = useState("");
  const [customTotalVisits, setCustomTotalVisits] = useState("");
  const [customLastVisit, setCustomLastVisit] = useState("");
  const [customNextVisit, setCustomNextVisit] = useState("");
  const [customMissedVisit, setCustomMissedVisit] = useState("");
  const [customSchedule, setCustomSchedule] = useState("");
  const [customReferralsReceived, setCustomReferralsReceived] = useState("");
  const [customReferralsSent, setCustomReferralsSent] = useState("");
  const [profileUpToDateChecked, setProfileUpToDateChecked] = useState(false);
  const [profileIsUpToDate, setProfileIsUpToDate] = useState(false);
  const [customProfileUpToDateTime, setCustomProfileUpToDateTime] = useState<string | null>(null);
  const [customLastMarkedReviewed, setCustomLastMarkedReviewed] = useState<string | null>(null);

  const normalizeTreatmentPlanText = (value: string): string => value.replace(/\r\n/g, "\n").trim();

  useEffect(() => {
    setTreatmentPlanText("");
    setTreatmentPlanOriginal("");
    setTreatmentPlanDirty(false);
    setTreatmentPlanLoading(false);
    setTreatmentPlanSaving(false);
    setTreatmentPlanMessage("");
    setTreatmentPlanError("");
    setTreatmentPlanNotes([]);
    setTreatmentPlanNotesLoading(false);
    setTreatmentPlanNotesError("");
  }, [selectedPatient.pid]);

  useEffect(() => {
    let isMounted = true;

    const loadTreatmentPlanNotes = async () => {
      if (!selectedPatient.pid || !isTreatmentPlanOpen) {
        setTreatmentPlanNotes([]);
        setTreatmentPlanNotesLoading(false);
        setTreatmentPlanNotesError("");
        return;
      }

      setTreatmentPlanNotesLoading(true);
      setTreatmentPlanNotesError("");

      try {
        const notes = await getPatientTreatmentPlanNotes(selectedPatient.pid);
        if (!isMounted) {
          return;
        }
        setTreatmentPlanNotes(notes);
      } catch (error) {
        console.error("Failed to load treatment plan notes:", error);
        if (!isMounted) {
          return;
        }
        setTreatmentPlanNotes([]);
        setTreatmentPlanNotesError("Unable to load treatment plan notes right now.");
      } finally {
        if (isMounted) {
          setTreatmentPlanNotesLoading(false);
        }
      }
    };

    void loadTreatmentPlanNotes();

    return () => {
      isMounted = false;
    };
  }, [isTreatmentPlanOpen, selectedPatient.pid]);

  useEffect(() => {
    if (!treatmentPlanMessage) {
      return;
    }

    const timer = window.setTimeout(() => {
      setTreatmentPlanMessage("");
    }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [treatmentPlanMessage]);

  useEffect(() => {
    if (!customReportMessage) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCustomReportMessage("");
    }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [customReportMessage]);

  useEffect(() => {
    if (!billingMessage) {
      return;
    }

    const timer = window.setTimeout(() => {
      setBillingMessage("");
    }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [billingMessage]);

  useEffect(() => {
    let isMounted = true;

    const loadBillingSummary = async () => {
      if (!selectedPatient.pid || !isBillingOpen) {
        setBillingSummary(null);
        setBillingLoading(false);
        setBillingError("");
        return;
      }

      setBillingLoading(true);
      setBillingError("");

      try {
        const summary = await getPatientBillingSummary(selectedPatient.pid, billingGroup);
        if (!isMounted) {
          return;
        }

        setBillingSummary(summary);
        setBillingError(summary.columns.length === 0 ? "No billing data available." : "");
      } catch (error) {
        console.error("Failed to load billing summary:", error);
        if (!isMounted) {
          return;
        }
        setBillingSummary(null);
        setBillingError(error instanceof Error ? error.message : "Unable to load billing summary right now.");
      } finally {
        if (isMounted) {
          setBillingLoading(false);
        }
      }
    };

    void loadBillingSummary();

    return () => {
      isMounted = false;
    };
  }, [billingGroup, isBillingOpen, selectedPatient.pid]);

  useEffect(() => {
    let isMounted = true;

    const loadTreatmentPlan = async () => {
      if (!selectedPatient.pid || !isTreatmentPlanOpen) {
        setTreatmentPlanLoading(false);
        return;
      }

      if (treatmentPlanDirty) {
        return;
      }

      setTreatmentPlanLoading(true);
      setTreatmentPlanError("");

      try {
        const text = await getPatientTreatmentPlan(selectedPatient.pid);
        if (!isMounted) {
          return;
        }
        setTreatmentPlanText(text);
        setTreatmentPlanOriginal(text);
        setTreatmentPlanDirty(false);
      } catch (error) {
        console.error("Failed to load treatment plan:", error);
        if (!isMounted) {
          return;
        }
        setTreatmentPlanError("Unable to load treatment plan right now.");
      } finally {
        if (isMounted) {
          setTreatmentPlanLoading(false);
        }
      }
    };

    void loadTreatmentPlan();

    return () => {
      isMounted = false;
    };
  }, [isTreatmentPlanOpen, selectedPatient.pid, treatmentPlanDirty]);

  useClientLayoutEffect(() => {
    try {
      const storedValue = window.sessionStorage.getItem(caseChecklistOpenStorageKey);
      setIsCaseChecklistOpen(storedValue !== "0");
    } catch {
      // ignore - storage may be unavailable
    }
  }, []);

  useClientLayoutEffect(() => {
    try {
      const storedValue = window.sessionStorage.getItem(customizeReportOpenStorageKey);
      setIsCustomizeReportOpen(storedValue !== "0");
    } catch {
      // ignore - storage may be unavailable
    }
  }, []);

  useClientLayoutEffect(() => {
    try {
      const storedValue = window.sessionStorage.getItem(claimsOpenStorageKey);
      setIsClaimsOpen(storedValue !== "0");
    } catch {
      // ignore - storage may be unavailable
    }
  }, []);

  useClientLayoutEffect(() => {
    try {
      const storedValue = window.sessionStorage.getItem(treatmentPlanOpenStorageKey);
      setIsTreatmentPlanOpen(storedValue !== "0");
    } catch {
      // ignore - storage may be unavailable
    }
  }, []);

  useClientLayoutEffect(() => {
    try {
      const storedValue = window.sessionStorage.getItem(billingOpenStorageKey);
      setIsBillingOpen(storedValue !== "0");
    } catch {
      // ignore - storage may be unavailable
    }
  }, []);

  useClientLayoutEffect(() => {
    try {
      const storedGroup = window.sessionStorage.getItem(billingGroupStorageKey);
      const normalizedGroup = storedGroup?.trim();
      if (
        normalizedGroup === "super_facility" ||
        normalizedGroup === "patient_status" ||
        normalizedGroup === "case_type" ||
        normalizedGroup === "facility"
      ) {
        setBillingGroup(normalizedGroup);
        return;
      }

      if (normalizedGroup === "Super facility") {
        setBillingGroup("super_facility");
      } else if (normalizedGroup === "Patient Status") {
        setBillingGroup("patient_status");
      } else if (normalizedGroup === "Case Type") {
        setBillingGroup("case_type");
      } else if (normalizedGroup === "Facility") {
        setBillingGroup("facility");
      }
    } catch {
      // ignore - storage may be unavailable
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ open?: boolean }>;
      if (typeof customEvent.detail?.open !== "boolean") {
        return;
      }

      const open = customEvent.detail.open;
      setIsCaseChecklistOpen(open);
      setIsCustomizeReportOpen(open);
      setIsClaimsOpen(open);
      setIsTreatmentPlanOpen(open);
      setIsBillingOpen(open);
    };

    window.addEventListener(workspaceToggleAllCardsEventName, handler);
    return () => window.removeEventListener(workspaceToggleAllCardsEventName, handler);
  }, []);

  useEffect(() => {
    if (skipPersistCaseChecklistOnceRef.current) {
      skipPersistCaseChecklistOnceRef.current = false;
      return;
    }

    try {
      window.sessionStorage.setItem(caseChecklistOpenStorageKey, isCaseChecklistOpen ? "1" : "0");
    } catch {
      // ignore - storage may be unavailable
    }
  }, [isCaseChecklistOpen]);

  useEffect(() => {
    if (skipPersistCustomizeReportOnceRef.current) {
      skipPersistCustomizeReportOnceRef.current = false;
      return;
    }

    try {
      window.sessionStorage.setItem(customizeReportOpenStorageKey, isCustomizeReportOpen ? "1" : "0");
    } catch {
      // ignore - storage may be unavailable
    }
  }, [isCustomizeReportOpen]);

  useEffect(() => {
    if (skipPersistClaimsOnceRef.current) {
      skipPersistClaimsOnceRef.current = false;
      return;
    }

    try {
      window.sessionStorage.setItem(claimsOpenStorageKey, isClaimsOpen ? "1" : "0");
    } catch {
      // ignore - storage may be unavailable
    }
  }, [isClaimsOpen]);

  useEffect(() => {
    if (skipPersistTreatmentPlanOnceRef.current) {
      skipPersistTreatmentPlanOnceRef.current = false;
      return;
    }

    try {
      window.sessionStorage.setItem(treatmentPlanOpenStorageKey, isTreatmentPlanOpen ? "1" : "0");
    } catch {
      // ignore - storage may be unavailable
    }
  }, [isTreatmentPlanOpen]);

  useEffect(() => {
    if (skipPersistBillingOnceRef.current) {
      skipPersistBillingOnceRef.current = false;
      return;
    }

    try {
      window.sessionStorage.setItem(billingOpenStorageKey, isBillingOpen ? "1" : "0");
    } catch {
      // ignore - storage may be unavailable
    }
  }, [isBillingOpen]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(billingGroupStorageKey, billingGroup);
    } catch {
      // ignore - storage may be unavailable
    }
  }, [billingGroup]);

  useEffect(() => {
    let isMounted = true;

    const loadChecklist = async () => {
      if (!selectedPatient.pid) {
        setCaseChecklist(null);
        setCaseChecklistReports([]);
        setCaseChecklistLoading(false);
        setCaseChecklistError("");
        return;
      }

      setCaseChecklistLoading(true);
      setCaseChecklistError("");

      try {
        const data = await getPatientCaseChecklist(selectedPatient.pid);
        if (!isMounted) {
          return;
        }
        setCaseChecklist(data.checklist);
        setCaseChecklistReports(data.reports);
      } catch (error) {
        console.error("Failed to load case checklist:", error);
        if (!isMounted) {
          return;
        }
        setCaseChecklist(null);
        setCaseChecklistReports([]);
        setCaseChecklistError("Unable to load case checklist right now.");
      } finally {
        if (isMounted) {
          setCaseChecklistLoading(false);
        }
      }
    };

    void loadChecklist();

    return () => {
      isMounted = false;
    };
  }, [selectedPatient.pid]);

  useEffect(() => {
    let isMounted = true;

    const loadCustomReport = async () => {
      if (!selectedPatient.pid) {
        setCustomReportLoading(false);
        setCustomReportSaving(false);
        setCustomReportMessage("");
        setCustomReportError("");
        setCustomReportRealData(null);

        setCustomBalance("");
        setCustomInitialVisit("");
        setCustomTotalVisits("");
        setCustomLastVisit("");
        setCustomNextVisit("");
        setCustomMissedVisit("");
        setCustomSchedule("");
        setCustomReferralsReceived("");
        setCustomReferralsSent("");
        setProfileUpToDateChecked(false);
        setProfileIsUpToDate(false);
        setCustomProfileUpToDateTime(null);
        setCustomLastMarkedReviewed(null);
        return;
      }

      setCustomReportLoading(true);
      setCustomReportError("");

      try {
        const data = await getPatientCustomReportData(selectedPatient.pid);
        if (!isMounted) {
          return;
        }

        setCustomReportRealData(data.realData);

        const customData = data.customData;
        setCustomBalance(customData?.balance != null ? String(customData.balance) : "");
        setCustomInitialVisit(customData?.initialVisit ?? "");
        setCustomTotalVisits(customData?.visits != null ? String(customData.visits) : "");
        setCustomLastVisit(customData?.lastVisit ?? "");
        setCustomNextVisit(customData?.nextVisit ?? "");
        setCustomMissedVisit(customData?.missedVisit ?? "");
        setCustomSchedule(customData?.schedule != null ? String(customData.schedule) : "");
        setCustomReferralsReceived(customData?.referralsReceived != null ? String(customData.referralsReceived) : "");
        setCustomReferralsSent(customData?.referralsSent != null ? String(customData.referralsSent) : "");
        setProfileUpToDateChecked(false);
        setProfileIsUpToDate(Boolean(customData?.profileUpToDate));
        setCustomProfileUpToDateTime(customData?.profileUpToDateTime ?? null);
        setCustomLastMarkedReviewed(customData?.lastMarkedReviewed ?? null);
      } catch (error) {
        console.error("Failed to load custom report data:", error);
        if (!isMounted) {
          return;
        }
        setCustomReportRealData(null);
        setCustomReportError("Unable to load custom report data right now.");
      } finally {
        if (isMounted) {
          setCustomReportLoading(false);
        }
      }
    };

    void loadCustomReport();

    return () => {
      isMounted = false;
    };
  }, [selectedPatient.pid]);

  useEffect(() => {
    let isMounted = true;

    const loadClaims = async () => {
      if (!selectedPatient.pid || !isClaimsOpen) {
        setClaims([]);
        setSelectedClaimEncounters([]);
        setClaimsLoading(false);
        setClaimsDownloading(false);
        setClaimsError("");
        return;
      }

      setClaimsLoading(true);
      setClaimsError("");

      try {
        const rows = await getPatientClaims(selectedPatient.pid);
        if (!isMounted) {
          return;
        }
        setClaims(rows);
        setSelectedClaimEncounters([]);
      } catch (error) {
        console.error("Failed to load claims:", error);
        if (!isMounted) {
          return;
        }
        setClaims([]);
        setSelectedClaimEncounters([]);
        setClaimsError("Unable to load claims right now.");
      } finally {
        if (isMounted) {
          setClaimsLoading(false);
        }
      }
    };

    void loadClaims();

    return () => {
      isMounted = false;
    };
  }, [isClaimsOpen, selectedPatient.pid]);

  const setClaimEncounterSelected = (encounterId: number, selected: boolean) => {
    setSelectedClaimEncounters((current) => {
      const hasEncounter = current.includes(encounterId);
      if (selected) {
        return hasEncounter ? current : [...current, encounterId];
      }
      return hasEncounter ? current.filter((id) => id !== encounterId) : current;
    });
  };

  const handleSelectAllClaims = () => {
    setSelectedClaimEncounters(claims.map((row) => row.encounter));
  };

  const handleDeselectAllClaims = () => {
    setSelectedClaimEncounters([]);
  };

  const handleDownload837 = async () => {
    if (!selectedPatient.pid) {
      return;
    }

    if (selectedClaimEncounters.length === 0) {
      setClaimsError("Select at least one claim to download.");
      return;
    }

    setClaimsDownloading(true);
    setClaimsError("");

    try {
      const result = await downloadPatient837(selectedPatient.pid, selectedClaimEncounters);
      const blob = new Blob([result.content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename || "claims_837.txt";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download 837:", error);
      setClaimsError("Unable to download 837 files right now.");
    } finally {
      setClaimsDownloading(false);
    }
  };

  const handleSaveTreatmentPlan = async (action: "save" | "save_share") => {
    if (!selectedPatient.pid) {
      return;
    }

    if (!treatmentPlanDirty) {
      return;
    }

    setTreatmentPlanSaving(true);
    setTreatmentPlanMessage("");
    setTreatmentPlanError("");

    try {
      const result = await savePatientTreatmentPlan({
        pid: selectedPatient.pid,
        treatmentPlan: treatmentPlanText,
        action,
      });

      setTreatmentPlanText(result.treatmentPlan);
      setTreatmentPlanOriginal(result.treatmentPlan);
      setTreatmentPlanMessage(result.message || "Treatment plan saved.");
      setTreatmentPlanDirty(false);

      try {
        const notes = await getPatientTreatmentPlanNotes(selectedPatient.pid);
        setTreatmentPlanNotes(notes);
      } catch (error) {
        console.error("Failed to refresh treatment plan notes:", error);
      }
    } catch (error) {
      console.error("Failed to save treatment plan:", error);
      setTreatmentPlanError("Unable to save treatment plan right now.");
    } finally {
      setTreatmentPlanSaving(false);
    }
  };

  const handleSaveCustomReport = async (action: "save" | "save_share") => {
    if (!selectedPatient.pid) {
      return;
    }

    setCustomReportSaving(true);
    setCustomReportError("");
    setCustomReportMessage("");

    try {
      const result = await savePatientCustomReportData({
        pid: selectedPatient.pid,
        action,
        lastVisit: customLastVisit,
        initialVisit: customInitialVisit,
        nextVisit: customNextVisit,
        missedVisit: customMissedVisit,
        visits: customTotalVisits,
        schedule: customSchedule,
        referralsReceived: customReferralsReceived,
        referralsSent: customReferralsSent,
        profileUpToDate: profileUpToDateChecked,
        balance: customBalance,
      });

      setCustomReportMessage(result.message);
      if (result.patient) {
        setProfileIsUpToDate(result.patient.profileUpToDate);
      }
      if (result.patient?.profileUpToDateTime) {
        setCustomProfileUpToDateTime(result.patient.profileUpToDateTime);
      }
      if (result.patient?.lastUpdated) {
        setCustomLastMarkedReviewed(result.patient.lastUpdated);
      }
      setProfileUpToDateChecked(false);
    } catch (error) {
      console.error("Failed to save custom report data:", error);
      setCustomReportError("Unable to save custom report right now.");
    } finally {
      setCustomReportSaving(false);
    }
  };

  const formatDateTimeLabel = (value: string): string => {
    if (!value) {
      return "";
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const normalizeTreatmentPlanBody = (value: string): string => {
    const trimmed = (value ?? "").trim();
    if (!trimmed) {
      return "";
    }

    let cleaned = trimmed;
    const parts = cleaned.split(/\r?\n\r?\n/);
    if (parts.length > 1 && /^treatment plan updated/i.test(parts[0])) {
      cleaned = parts.slice(1).join("\n\n").trim();
    }

    return cleaned;
  };

  const billingColumns = billingSummary?.columns ?? [];
  const billingTotals = billingSummary?.totals ?? {
    cumulativeTotal: 0,
    totalBalance: 0,
    patientLimit: 0,
    availableFunds: 0,
  };

  const handleRemoveFromUpToDate = async () => {
    if (!selectedPatient.pid) {
      return;
    }

    setCustomReportSaving(true);
    setCustomReportError("");
    setCustomReportMessage("");

    try {
      const result = await removePatientProfileFromUpToDate(selectedPatient.pid);
      setProfileUpToDateChecked(false);
      setProfileIsUpToDate(false);
      setCustomProfileUpToDateTime(null);
      if (result.lastUpdated) {
        setCustomLastMarkedReviewed(result.lastUpdated);
      }
      setCustomReportMessage(result.message);
    } catch (error) {
      console.error("Failed to remove profile up to date:", error);
      setCustomReportError("Unable to update profile status right now.");
    } finally {
      setCustomReportSaving(false);
    }
  };

  const handleProfileReviewed = async () => {
    if (!selectedPatient.pid) {
      return;
    }

    setCustomReportSaving(true);
    setCustomReportError("");
    setCustomReportMessage("");

    try {
      const result = await markPatientProfileReviewed(selectedPatient.pid);
      if (result.lastUpdated) {
        setCustomLastMarkedReviewed(result.lastUpdated);
      }
      setCustomReportMessage(result.message);
    } catch (error) {
      console.error("Failed to mark profile reviewed:", error);
      setCustomReportError("Unable to mark profile reviewed right now.");
    } finally {
      setCustomReportSaving(false);
    }
  };

  return (
    <>
      <div className="grid">
        <WorkspaceAppointmentsCard selectedPatient={selectedPatient} />

        <WorkspaceDiagnosesCard selectedPatient={selectedPatient} />

        <div className="card">
          <div className="hd">
            <div className="title">✅ Case Checklist + Report Tracking</div>
            <div className="sub">{isCaseChecklistOpen ? "(expanded)" : "(collapsed)"}</div>
            <div className="right">
              <button
                className="mini"
                type="button"
                onClick={() => setIsCaseChecklistOpen((current) => !current)}
              >
                {isCaseChecklistOpen ? "Collapse" : "Expand"}
              </button>
            </div>
          </div>
          {isCaseChecklistOpen && (
            <div className="bd">
              {caseChecklistLoading && <div className="hint">Loading case checklist...</div>}
              {!caseChecklistLoading && caseChecklistError && (
                <div className="hint" style={{ color: "var(--bad)" }}>
                  {caseChecklistError}
                </div>
              )}
              <div className="checkgrid">
                <label className="checkline">
                  <input type="checkbox" disabled checked={Boolean(caseChecklist?.hasIdUploaded)} readOnly /> ID
                </label>
                <label className="checkline">
                  <input type="checkbox" disabled checked={Boolean(caseChecklist?.hasIntakeUploaded)} readOnly /> Intake
                </label>
                <label className="checkline">
                  <input type="checkbox" disabled checked={Boolean(caseChecklist?.liabilityCleared)} readOnly /> Liability Cleared
                </label>
                <div className="checkline" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input type="checkbox" disabled checked={Boolean(caseChecklist?.limits)} readOnly />
                  <span>Limit</span>
                  <span className="chip">{caseChecklist?.limits ?? "-"}</span>
                </div>
                <label className="checkline">
                  <input type="checkbox" disabled checked={Boolean(caseChecklist?.policeReport)} readOnly /> Police report
                </label>
                <label className="checkline">
                  <input type="checkbox" disabled checked={Boolean(caseChecklist?.underinsured)} readOnly /> Underinsured
                </label>
                <label className="checkline">
                  <input type="checkbox" disabled checked={Boolean(caseChecklist?.uninsured)} readOnly /> Uninsured
                </label>
                <label className="checkline">
                  <input type="checkbox" disabled checked={Boolean(caseChecklist?.hasLopUploaded)} readOnly /> LOP
                </label>
                <label className="checkline">
                  <input
                    type="checkbox"
                    disabled
                    checked={Boolean(caseChecklist?.hasOswestryDisabilityIndexUploaded)}
                    readOnly
                  />{" "}
                  Oswestry Disability Index
                </label>
                <label className="checkline">
                  <input
                    type="checkbox"
                    disabled
                    checked={Boolean(caseChecklist?.hasHeadacheDisabilityIndexUploaded)}
                    readOnly
                  />{" "}
                  Headache Disability Index
                </label>
                <label className="checkline">
                  <input
                    type="checkbox"
                    disabled
                    checked={Boolean(caseChecklist?.hasDutiesPerformedUnderDuressUploaded)}
                    readOnly
                  />{" "}
                  Duties Performed Under Duress at Work and Home
                </label>
                <label className="checkline">
                  <input
                    type="checkbox"
                    disabled
                    checked={Boolean(caseChecklist?.hasHospitalRecordsReceivedUploaded)}
                    readOnly
                  />{" "}
                  Hospital records received
                </label>
                <label className="checkline">
                  <input type="checkbox" disabled checked={Boolean(caseChecklist?.hasLienSentOutUploaded)} readOnly /> Lien sent out
                </label>
                <label className="checkline">
                  <input
                    type="checkbox"
                    disabled
                    checked={Boolean(caseChecklist?.hasBillsAndRecordsUploaded)}
                    readOnly
                  />{" "}
                  Bills and Records
                </label>
              </div>
              <div className="hr"></div>
              <table className="table">
                <thead><tr><th>Report Name</th><th>Sent</th><th>Report received</th></tr></thead>
                <tbody>
                  {caseChecklistReports.length === 0 && (
                    <tr>
                      <td colSpan={3} className="hint">
                        No report tracking yet.
                      </td>
                    </tr>
                  )}
                  {caseChecklistReports.map((row) => {
                    const sentLabel = row.sentDates.join(", ");
                    const receivedLabel = row.receivedDates.join(", ");

                    return (
                      <tr key={row.key}>
                        <td>{row.title}</td>
                        <td>{sentLabel ? <span className="chip good">✓ {sentLabel}</span> : "-"}</td>
                        <td>{receivedLabel ? <span className="chip good">✓ {receivedLabel}</span> : "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="hd">
            <div className="title">Customize Report</div>
            <div className="sub">{isCustomizeReportOpen ? "(expanded)" : "(collapsed)"}</div>
            <div className="right">
              <button
                className="mini"
                type="button"
                style={isCustomizeReportOpen ? undefined : { visibility: "hidden" }}
                aria-hidden={!isCustomizeReportOpen}
                tabIndex={isCustomizeReportOpen ? 0 : -1}
                disabled={!isCustomizeReportOpen || customReportSaving}
                onClick={() => void handleSaveCustomReport("save")}
              >
                {customReportSaving ? "Saving..." : "Save"}
              </button>
              <button
                className="mini primary"
                type="button"
                style={isCustomizeReportOpen ? undefined : { visibility: "hidden" }}
                aria-hidden={!isCustomizeReportOpen}
                tabIndex={isCustomizeReportOpen ? 0 : -1}
                disabled={!isCustomizeReportOpen || customReportSaving}
                onClick={() => void handleSaveCustomReport("save_share")}
              >
                {customReportSaving ? "Saving..." : "Save & Share with Lawyer"}
              </button>
              <button
                className="mini"
                type="button"
                onClick={() => setIsCustomizeReportOpen((current) => !current)}
              >
                {isCustomizeReportOpen ? "Collapse" : "Expand"}
              </button>
            </div>
          </div>
          {isCustomizeReportOpen && (
            <div className="bd">
              {customReportLoading && <div className="hint">Loading custom report data...</div>}
              {!customReportLoading && customReportError && (
                <div className="hint" style={{ color: "var(--bad)" }}>
                  {customReportError}
                </div>
              )}
              {!customReportLoading && customReportMessage && <div className="hint">{customReportMessage}</div>}

              <div className="three-col">
                <div className="field">
                  <label>Custom Data - Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    value={customBalance}
                    onChange={(e) => setCustomBalance(e.target.value)}
                    disabled={customReportSaving}
                  />
                </div>
                <div className="field">
                  <label>Initial visit</label>
                  <input
                    type="date"
                    value={customInitialVisit}
                    onChange={(e) => setCustomInitialVisit(e.target.value)}
                    disabled={customReportSaving}
                  />
                </div>
                <div className="field">
                  <label>Total visits</label>
                  <input
                    type="number"
                    min={0}
                    value={customTotalVisits}
                    onChange={(e) => setCustomTotalVisits(e.target.value)}
                    disabled={customReportSaving}
                  />
                </div>
                <div className="field">
                  <label>Last visit</label>
                  <input
                    type="date"
                    value={customLastVisit}
                    onChange={(e) => setCustomLastVisit(e.target.value)}
                    disabled={customReportSaving}
                  />
                </div>
                <div className="field">
                  <label>Next visit</label>
                  <input
                    type="date"
                    value={customNextVisit}
                    onChange={(e) => setCustomNextVisit(e.target.value)}
                    disabled={customReportSaving}
                  />
                </div>
                <div className="field">
                  <label>Missed visit</label>
                  <input
                    type="date"
                    value={customMissedVisit}
                    onChange={(e) => setCustomMissedVisit(e.target.value)}
                    disabled={customReportSaving}
                  />
                </div>
                <div className="field">
                  <label>Schedule</label>
                  <input
                    type="number"
                    min={0}
                    value={customSchedule}
                    onChange={(e) => setCustomSchedule(e.target.value)}
                    disabled={customReportSaving}
                  />
                </div>
                <div className="field">
                  <label>Referrals received</label>
                  <input
                    type="number"
                    min={0}
                    value={customReferralsReceived}
                    onChange={(e) => setCustomReferralsReceived(e.target.value)}
                    disabled={customReportSaving}
                  />
                </div>
                <div className="field">
                  <label>Referrals sent</label>
                  <input
                    type="number"
                    min={0}
                    value={customReferralsSent}
                    onChange={(e) => setCustomReferralsSent(e.target.value)}
                    disabled={customReportSaving}
                  />
                </div>
              </div>

              <div className="hr"></div>

              <label className="checkline" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input
                  type="checkbox"
                  checked={profileUpToDateChecked}
                  onChange={(e) => setProfileUpToDateChecked(e.target.checked)}
                  disabled={customReportSaving}
                />
                <span style={{ fontWeight: 900 }}>Mark profile up to date</span>
              </label>

              {profileIsUpToDate && customProfileUpToDateTime && (
                <div className="softbox" style={{ marginTop: "10px" }}>
                  <div className="row wrap" style={{ alignItems: "center", gap: "10px" }}>
                    <div className="hint">
                      Last up to date:{" "}
                      <span className="chip">{new Date(customProfileUpToDateTime).toLocaleString()}</span>
                    </div>
                    <div className="spacer" />
                    <button
                      className="mini"
                      type="button"
                      disabled={customReportSaving}
                      onClick={() => void handleRemoveFromUpToDate()}
                    >
                      Remove from up to date
                    </button>
                  </div>
                </div>
              )}

              <div className="hr"></div>

              <div className="row wrap" style={{ alignItems: "center", gap: "10px" }}>
                <div className="hint">
                  Last marked reviewed:{" "}
                  {customLastMarkedReviewed ? (
                    <span className="chip">{new Date(customLastMarkedReviewed).toLocaleString()}</span>
                  ) : (
                    <span className="chip">-</span>
                  )}
                </div>
                <div className="spacer" />
                <button
                  className="mini primary"
                  type="button"
                  disabled={customReportSaving}
                  onClick={() => void handleProfileReviewed()}
                >
                  Profile Reviewed
                </button>
              </div>

              <div className="hr"></div>

              <div className="hint" style={{ fontWeight: 900, marginBottom: "8px" }}>
                Real Data Mirror
              </div>
              <div className="kpi-row" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
                <div className="kpi">
                  <div className="k">Balance</div>
                  <div className="v">
                    {customReportRealData?.balance != null
                      ? formatWorkspaceCurrency(customReportRealData.balance)
                      : formatWorkspaceCurrency(selectedPatient.balance)}
                  </div>
                </div>
                <div className="kpi">
                  <div className="k">Visits</div>
                  <div className="v">{customReportRealData?.visits != null ? customReportRealData.visits : "-"}</div>
                </div>
                <div className="kpi">
                  <div className="k">Schedule</div>
                  <div className="v">{customReportRealData?.schedule != null ? customReportRealData.schedule : "-"}</div>
                </div>
              </div>
              <div
                className="kpi-row"
                style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))", marginTop: "10px" }}
              >
                <div className="kpi">
                  <div className="k">Last Encounter</div>
                  <div className="v">
                    {formatWorkspaceDate(customReportRealData?.lastEncounter ?? selectedPatient.lastVisit)}
                  </div>
                </div>
                <div className="kpi">
                  <div className="k">Referrals Sent</div>
                  <div className="v">
                    {customReportRealData?.referralsSent != null ? customReportRealData.referralsSent : "-"}
                  </div>
                </div>
                <div className="kpi">
                  <div className="k">Referrals Received</div>
                  <div className="v">
                    {customReportRealData?.referralsReceived != null ? customReportRealData.referralsReceived : "-"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="hd">
            <div className="title">Claims</div>
            <div className="sub">{isClaimsOpen ? "(expanded)" : "(collapsed)"}</div>
            <div className="right">
              {isClaimsOpen && (
                <>
                  <button
                    className="mini"
                    type="button"
                    onClick={handleSelectAllClaims}
                    disabled={claimsLoading || claims.length === 0}
                  >
                    Select all
                  </button>
                  <button
                    className="mini"
                    type="button"
                    onClick={handleDeselectAllClaims}
                    disabled={claimsLoading || selectedClaimEncounters.length === 0}
                  >
                    Deselect all
                  </button>
                </>
              )}
              <button
                className="mini"
                type="button"
                onClick={() => setIsClaimsOpen((current) => !current)}
              >
                {isClaimsOpen ? "Collapse" : "Expand"}
              </button>
            </div>
          </div>
          {isClaimsOpen && (
            <div className="bd">
              <div className="claims-list" id="claimsList">
                {claimsLoading && <div className="hint">Loading claims...</div>}
                {!claimsLoading && claimsError && (
                  <div className="hint" style={{ color: "var(--bad)" }}>
                    {claimsError}
                  </div>
                )}
                {!claimsLoading && !claimsError && claims.length === 0 && <div className="hint">None</div>}
                {!claimsLoading &&
                  !claimsError &&
                  claims.map((row) => {
                    const isSelected = selectedClaimEncounters.includes(row.encounter);

                    return (
                      <div key={row.encounter} className="claim-item">
                        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(event) => setClaimEncounterSelected(row.encounter, event.target.checked)}
                          />
                          <span>{row.label}</span>
                        </label>
                        <span>{row.lineCount ? `${row.lineCount} lines` : ""}</span>
                      </div>
                    );
                  })}
              </div>
              <div className="actions-row">
                <button
                  className="mini primary"
                  type="button"
                  onClick={() => void handleDownload837()}
                  disabled={claimsDownloading || claimsLoading || selectedClaimEncounters.length === 0}
                >
                  {claimsDownloading ? "Preparing..." : "Download 837 Files"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="hd">
            <div className="title">🧾 Treatment Plan</div>
            <div className="sub">{isTreatmentPlanOpen ? "(expanded)" : "(collapsed)"}</div>
            <div className="right">
              <button
                className="mini primary"
                type="button"
                style={isTreatmentPlanOpen ? undefined : { visibility: "hidden" }}
                aria-hidden={!isTreatmentPlanOpen}
                tabIndex={isTreatmentPlanOpen ? 0 : -1}
                disabled={!isTreatmentPlanOpen || treatmentPlanSaving || !treatmentPlanDirty}
                onClick={() => void handleSaveTreatmentPlan("save_share")}
              >
                {treatmentPlanSaving ? "Saving..." : "Save & Share with Lawyer"}
              </button>
              <button
                className="mini"
                type="button"
                style={isTreatmentPlanOpen ? undefined : { visibility: "hidden" }}
                aria-hidden={!isTreatmentPlanOpen}
                tabIndex={isTreatmentPlanOpen ? 0 : -1}
                disabled={!isTreatmentPlanOpen || treatmentPlanSaving || !treatmentPlanDirty}
                onClick={() => void handleSaveTreatmentPlan("save")}
              >
                {treatmentPlanSaving ? "Saving..." : "Save"}
              </button>
              <button className="mini" type="button" onClick={() => setIsTreatmentPlanOpen((current) => !current)}>
                {isTreatmentPlanOpen ? "Collapse" : "Expand"}
              </button>
            </div>
          </div>
          <div className="bd" hidden={!isTreatmentPlanOpen}>
            {treatmentPlanError && (
              <div className="hint" style={{ color: "var(--bad)" }}>
                {treatmentPlanError}
              </div>
            )}
            {treatmentPlanMessage && (
              <div className="hint" style={{ color: "var(--good)" }}>
                {treatmentPlanMessage}
              </div>
            )}
            <div className="field">
              <label>Plan</label>
              <textarea
                id="treatmentPlanText"
                value={treatmentPlanText}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setTreatmentPlanText(nextValue);
                  setTreatmentPlanDirty(
                    normalizeTreatmentPlanText(nextValue) !== normalizeTreatmentPlanText(treatmentPlanOriginal),
                  );
                }}
                disabled={treatmentPlanSaving}
              ></textarea>
            </div>
            <div className="hr"></div>
            <div className="section-hd">
              <div className="label">Treatment Plans</div>
              {!treatmentPlanNotesLoading && !treatmentPlanNotesError && treatmentPlanNotes.length > 0 && (
                <div className="count">{treatmentPlanNotes.length} saved</div>
              )}
            </div>
            {treatmentPlanNotesLoading && <div className="hint">Loading treatment plans...</div>}
            {!treatmentPlanNotesLoading && treatmentPlanNotesError && (
              <div className="hint" style={{ color: "var(--bad)" }}>
                {treatmentPlanNotesError}
              </div>
            )}
            {!treatmentPlanNotesLoading && !treatmentPlanNotesError && treatmentPlanNotes.length === 0 && (
              <div className="hint">No Treatment Plan Available</div>
            )}
            {!treatmentPlanNotesLoading && !treatmentPlanNotesError && treatmentPlanNotes.length > 0 && (
              <div className="treatment-notes">
                {treatmentPlanNotes.map((note) => {
                  const body = normalizeTreatmentPlanBody(note.body);
                  const noteClassName = note.shared ? "treatment-note shared" : "treatment-note";

                  return (
                    <div key={note.id} className={noteClassName}>
                      <div className="treatment-note-header">
                        <div className="treatment-note-badges">
                          {note.shared ? (
                            <span className="chip good">✓ Shared with Lawyer</span>
                          ) : (
                            <span className="chip">× Not Shared with Lawyer</span>
                          )}
                        </div>
                        {note.createdAt && (
                          <div className="treatment-note-time">Created on {formatDateTimeLabel(note.createdAt)}</div>
                        )}
                      </div>
                      <div className="treatment-note-body">{body || "-"}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="hd">
            <div className="title">Billing</div>
            <div className="sub">{isBillingOpen ? "(expanded)" : "(collapsed)"}</div>
            <div className="right">
              <button className="mini" type="button" onClick={() => setIsBillingOpen((current) => !current)}>
                {isBillingOpen ? "Collapse" : "Expand"}
              </button>
            </div>
          </div>
          <div className="bd" hidden={!isBillingOpen}>
            {billingMessage && <div className="hint">{billingMessage}</div>}
            {billingLoading && <div className="hint">Loading billing...</div>}
            {!billingLoading && billingError && (
              <div className="hint" style={{ color: "var(--bad)" }}>
                {billingError}
              </div>
            )}
            <div className="row wrap">
              <div className="field" style={{ minWidth: "220px" }}>
                <label>Group</label>
                <select
                  value={billingGroup}
                  onChange={(event) => setBillingGroup(event.target.value as BillingGroupMode)}
                  disabled={billingLoading}
                >
                  <option value="super_facility">Super facility</option>
                  <option value="patient_status">Patient Status</option>
                  <option value="case_type">Case Type</option>
                  <option value="facility">Facility</option>
                </select>
              </div>
            </div>
            <div className="hr"></div>
            <table border={0} style={{ width: "100%" }}>
              <tbody>
                <tr>
                  <td></td>
                  {billingColumns.map((col) => (
                    <td
                      key={`billing-h-${col.name}`}
                      style={{ fontWeight: 950, textAlign: "right", wordWrap: "break-word", width: "150px" }}
                    >
                      {col.name}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ fontWeight: 950, color: "var(--bad)" }}>Transportation Cost</td>
                  {billingColumns.map((col) => (
                    <td key={`billing-transport-${col.name}`} style={{ textAlign: "right" }}>
                      {formatWorkspaceCurrency(col.billing.transportationAmount)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ fontWeight: 950, color: "var(--bad)" }}>Patient balance due</td>
                  {billingColumns.map((col) => (
                    <td key={`billing-balance-${col.name}`} style={{ textAlign: "right" }}>
                      {formatWorkspaceCurrency(col.billing.patientBalance)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ fontWeight: 950 }}>Insurance paid</td>
                  {billingColumns.map((col) => (
                    <td key={`billing-ins-${col.name}`} style={{ textAlign: "right" }}>
                      {formatWorkspaceCurrency(col.billing.insurancePaymentsAmount)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ fontWeight: 950 }}>Patient paid</td>
                  {billingColumns.map((col) => (
                    <td key={`billing-ptpaid-${col.name}`} style={{ textAlign: "right" }}>
                      {formatWorkspaceCurrency(col.billing.patientPaymentsAmount)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ fontWeight: 950 }}>Adjustments</td>
                  {billingColumns.map((col) => (
                    <td key={`billing-adj-${col.name}`} style={{ textAlign: "right" }}>
                      {formatWorkspaceCurrency(col.billing.patientAdjustmentsAmount)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ fontWeight: 950, verticalAlign: "top" }}>Settlement</td>
                  {billingColumns.map((col) => {
                    const xCount = Math.min(col.billing.totalSettledCount, 20);
                    const settledMarks = xCount > 0 ? "x".repeat(xCount) : "";

                    return (
                      <td key={`billing-settle-${col.name}`} style={{ textAlign: "right", verticalAlign: "top" }}>
                        {formatWorkspaceCurrency(col.billing.settledAmount)}
                        <br />
                        <small style={{ color: "var(--muted)" }}>
                          (Reduction: {col.billing.reductionPercent}%)
                          <br />
                          {settledMarks ? `(${settledMarks})` : ""}
                        </small>
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td style={{ fontWeight: 950 }}>Write Off</td>
                  {billingColumns.map((col) => (
                    <td key={`billing-wo-${col.name}`} style={{ textAlign: "right" }}>
                      {formatWorkspaceCurrency(col.billing.patientWriteOffAmount)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ fontWeight: 950, color: "var(--bad)" }}>Cumulative Total</td>
                  {billingColumns.map((col) => (
                    <td key={`billing-cum-${col.name}`} style={{ textAlign: "right" }}>
                      {formatWorkspaceCurrency(col.billing.cumulativeTotal)}
                    </td>
                  ))}
                  <td></td>
                  <td style={{ fontWeight: 950, textAlign: "right" }}>{formatWorkspaceCurrency(billingTotals.cumulativeTotal)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 950, color: "var(--bad)" }}>Total balance due</td>
                  {billingColumns.map((col) => (
                    <td key={`billing-total-${col.name}`} style={{ textAlign: "right" }}>
                      {formatWorkspaceCurrency(col.billing.totalBalance)}
                    </td>
                  ))}
                  <td style={{ fontWeight: 950, paddingLeft: "7px" }}>Agg. Balance</td>
                  <td style={{ fontWeight: 950, textAlign: "right" }}>{formatWorkspaceCurrency(billingTotals.totalBalance)}</td>
                </tr>
                <tr>
                  <td></td>
                  {billingColumns.map((col) => (
                    <td key={`billing-limit-pad-${col.name}`}></td>
                  ))}
                  <td style={{ fontWeight: 950, paddingLeft: "7px" }}>LIMIT</td>
                  <td style={{ fontWeight: 950, textAlign: "right" }}>{formatWorkspaceCurrency(billingTotals.patientLimit)}</td>
                </tr>
                <tr>
                  <td></td>
                  {billingColumns.map((col) => (
                    <td key={`billing-avail-pad-${col.name}`}></td>
                  ))}
                  <td style={{ fontWeight: 950, paddingLeft: "7px" }}>Available Funds</td>
                  <td
                    style={{
                      fontWeight: 950,
                      textAlign: "right",
                      color: billingTotals.availableFunds > 0 ? "var(--bad)" : undefined,
                    }}
                  >
                    {formatWorkspaceCurrency(billingTotals.availableFunds)}
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="hr"></div>
          </div>
        </div>
      </div>
    </>
  );
}
