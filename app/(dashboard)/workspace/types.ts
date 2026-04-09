import type { ProgressNotesPagination } from "@/lib/progress-notes";

export interface WorkspaceDemographicsDraft {
  name: string;
  phone: string;
  email: string;
  facilityId: number | null;
  facility: string;
  dob: string;
  doi: string;
}

export type ProgressNoteModalType = "importantToClinic" | "notifyLawyer";

export interface ProgressNoteRecipientModalState {
  type: ProgressNoteModalType;
  selectedEmails: string[];
  followEmailChain: boolean;
  updateLawyerPortal: boolean;
}

export interface ProgressNoteLopModalState {
  emails: string[];
  selectedEmails: string[];
}

export const fallbackNotesPagination: ProgressNotesPagination = {
  page: 1,
  pageSize: 20,
  totalItems: 0,
  totalPages: 1,
};

export const progressNoteTypeLabels: Record<number, string> = {
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
