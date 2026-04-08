import type { NeedsUpdatePatient } from "@/lib/dashboard";
import type { PatientListItem } from "@/lib/patients";

export const selectedWorkspacePatientStorageKey = "pi360:selected-workspace-patient";

export interface SelectedWorkspacePatient {
  pid: number | null;
  uuid: string | null;
  name: string;
  facilityId: number | null;
  dob: string | null;
  doi: string | null;
  lastUpdated: string | null;
  lastVisit: string | null;
  nextVisit: string | null;
  phone: string | null;
  email: string | null;
  balance: number;
  facility: string | null;
  status: string | null;
  needsUpdate: boolean;
}

export function createWorkspacePatientFromListItem(
  patient: PatientListItem,
): SelectedWorkspacePatient {
  return {
    pid: patient.pid,
    uuid: patient.uuid,
    name: patient.name,
    facilityId: patient.facilityId,
    dob: patient.dob,
    doi: patient.doi,
    lastUpdated: patient.lastUpdated,
    lastVisit: patient.lastVisit,
    nextVisit: patient.nextVisit,
    phone: patient.phone,
    email: patient.email,
    balance: patient.balance,
    facility: patient.facility,
    status: patient.status,
    needsUpdate: patient.needsUpdate,
  };
}

export function createWorkspacePatientFromNeedsUpdate(
  patient: NeedsUpdatePatient,
): SelectedWorkspacePatient {
  return {
    pid: null,
    uuid: null,
    name: patient.name,
    facilityId: null,
    dob: patient.dob,
    doi: patient.doi,
    lastUpdated: patient.lastUpdated,
    lastVisit: null,
    nextVisit: null,
    phone: null,
    email: null,
    balance: 0,
    facility: patient.facility,
    status: null,
    needsUpdate: true,
  };
}

export function formatWorkspaceDate(value: string | null) {
  if (!value) {
    return "N/A";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

export function formatWorkspacePhone(value: string | null) {
  if (!value) {
    return "N/A";
  }

  const digits = value.replace(/\D/g, "");
  const normalizedDigits =
    digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;

  if (normalizedDigits.length !== 10) {
    return value;
  }

  return `(${normalizedDigits.slice(0, 3)}) ${normalizedDigits.slice(3, 6)}-${normalizedDigits.slice(6)}`;
}

export function formatWorkspaceCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}
