import type { SelectedWorkspacePatient } from "@/lib/workspace";
import type { WorkspaceDemographicsDraft } from "@/app/(dashboard)/workspace/types";

export function maskPhoneInput(value: string) {
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

export function toDateInputValue(value: string | null) {
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

export function createWorkspaceDemographicsDraft(
  patient: SelectedWorkspacePatient,
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

export function formatProgressNoteDate(value: string | null) {
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
