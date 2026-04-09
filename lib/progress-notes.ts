import { apiRequest } from "@/lib/api-client";

export interface ProgressNoteTagState {
  urgent: boolean;
  importantToClinic: boolean;
  notifyLawyer: boolean;
  notifyClinicDirector: boolean;
  notifyBackOffice: boolean;
  shareToLawyerNotes: boolean;
  shareToAffiliateNotes: boolean;
  adminOnly: boolean;
  billingNotice: boolean;
  notifyIntake: boolean;
  notifyRecords: boolean;
  notifyReferrals: boolean;
  addToTreatmentPlan: boolean;
  finance: boolean;
}

export interface ProgressNoteEmailSelection {
  emails: string[];
  followEmailChain: boolean;
}

export interface ProgressNoteLawyerSelection extends ProgressNoteEmailSelection {
  updateLawyerPortal: boolean;
}

export interface ProgressNoteRecipientOptions {
  clinicEmails: string[];
  lawyerEmails: string[];
  defaults: {
    clinicFollowEmailChain: boolean;
    lawyerFollowEmailChain: boolean;
    lawyerUpdatePortal: boolean;
  };
}

export interface ProgressNoteLopRequestOptions {
  emails: string[];
}

export interface PatientProgressNote {
  id: number;
  body: string;
  date: string | null;
  user: string | null;
  userFullName: string | null;
  facilityName: string | null;
  superFacilityDescription: string | null;
  onlyAdmin: boolean;
  externalLawyerHasAccess: boolean;
  externalAffiliateHasAccess: boolean;
  types: number[];
}

export interface ProgressNotesPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ProgressNotesListFilters {
  includeUrgent: boolean;
  includeImportantToClinic: boolean;
  includeNotifyLawyer: boolean;
  includeNotifyBackOffice: boolean;
  includeNotifyClinicDirector: boolean;
  includeFinance: boolean;
  includeBillingNotice: boolean;
  includeWeeklyNoteUpdate: boolean;
  includeEmailChain: boolean;
  includeTreatmentPlan: boolean;
  includeNotifyRecords: boolean;
  includeProfileChanges: boolean;
  includeAdminOnly: boolean;
  excludeAdminOnly: boolean;
  excludeWeeklyUpdate: boolean;
  excludeCaseInfo: boolean;
}

interface ApiEnvelope {
  data?: unknown;
}

const toBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    return value === "1" || value.toLowerCase() === "true";
  }

  return false;
};

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
};

const toNullableString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() !== "" ? value : null;

function mapNotes(payload: unknown): PatientProgressNote[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const data = payload as Record<string, unknown>;
  const rawNotes = data.notes;

  if (!Array.isArray(rawNotes)) {
    return [];
  }

  return rawNotes.map((item) => {
    const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};

    return {
      id: toNumber(row.id, 0),
      body: typeof row.body === "string" ? row.body : "",
      date: toNullableString(row.date),
      user: toNullableString(row.user),
      userFullName: toNullableString(row.userFullName),
      facilityName: toNullableString(row.facilityName),
      superFacilityDescription: toNullableString(row.superFacilityDescription),
      onlyAdmin: toBoolean(row.onlyAdmin),
      externalLawyerHasAccess: toBoolean(row.externalLawyerHasAccess),
      externalAffiliateHasAccess: toBoolean(row.externalAffiliateHasAccess),
      types: Array.isArray(row.types) ? row.types.map((value) => toNumber(value, 0)).filter(Boolean) : [],
    };
  });
}

function mapPagination(payload: unknown): ProgressNotesPagination {
  if (!payload || typeof payload !== "object") {
    return {
      page: 1,
      pageSize: 20,
      totalItems: 0,
      totalPages: 1,
    };
  }

  const data = payload as Record<string, unknown>;
  const rawPagination = data.pagination && typeof data.pagination === "object"
    ? (data.pagination as Record<string, unknown>)
    : {};
  const page = Math.max(1, toNumber(rawPagination.page, 1));
  const pageSize = Math.max(1, toNumber(rawPagination.pageSize, 20));
  const totalItems = Math.max(0, toNumber(rawPagination.totalItems, 0));
  const totalPages = Math.max(1, toNumber(rawPagination.totalPages, 1));

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
  };
}

export const defaultProgressNoteTags = (): ProgressNoteTagState => ({
  urgent: false,
  importantToClinic: false,
  notifyLawyer: false,
  notifyClinicDirector: false,
  notifyBackOffice: false,
  shareToLawyerNotes: false,
  shareToAffiliateNotes: false,
  adminOnly: false,
  billingNotice: false,
  notifyIntake: false,
  notifyRecords: false,
  notifyReferrals: false,
  addToTreatmentPlan: false,
  finance: false,
});

export const defaultProgressNotesListFilters = (): ProgressNotesListFilters => ({
  includeUrgent: false,
  includeImportantToClinic: false,
  includeNotifyLawyer: false,
  includeNotifyBackOffice: false,
  includeNotifyClinicDirector: false,
  includeFinance: false,
  includeBillingNotice: false,
  includeWeeklyNoteUpdate: false,
  includeEmailChain: false,
  includeTreatmentPlan: false,
  includeNotifyRecords: false,
  includeProfileChanges: false,
  includeAdminOnly: false,
  excludeAdminOnly: true,
  excludeWeeklyUpdate: true,
  excludeCaseInfo: true,
});

export async function getPatientProgressNotes(
  pid: number,
  search = "",
  page = 1,
  pageSize = 20,
  filters: ProgressNotesListFilters = defaultProgressNotesListFilters(),
): Promise<{ notes: PatientProgressNote[]; pagination: ProgressNotesPagination }> {
  const query = search.trim();
  const queryParams = new URLSearchParams();
  queryParams.set("pid", String(pid));
  queryParams.set("page", String(page));
  queryParams.set("pageSize", String(pageSize));
  if (query) {
    queryParams.set("search", query);
  }
  queryParams.set("includeUrgent", filters.includeUrgent ? "1" : "0");
  queryParams.set("includeImportantToClinic", filters.includeImportantToClinic ? "1" : "0");
  queryParams.set("includeNotifyLawyer", filters.includeNotifyLawyer ? "1" : "0");
  queryParams.set("includeNotifyBackOffice", filters.includeNotifyBackOffice ? "1" : "0");
  queryParams.set("includeNotifyClinicDirector", filters.includeNotifyClinicDirector ? "1" : "0");
  queryParams.set("includeFinance", filters.includeFinance ? "1" : "0");
  queryParams.set("includeBillingNotice", filters.includeBillingNotice ? "1" : "0");
  queryParams.set("includeWeeklyNoteUpdate", filters.includeWeeklyNoteUpdate ? "1" : "0");
  queryParams.set("includeEmailChain", filters.includeEmailChain ? "1" : "0");
  queryParams.set("includeTreatmentPlan", filters.includeTreatmentPlan ? "1" : "0");
  queryParams.set("includeNotifyRecords", filters.includeNotifyRecords ? "1" : "0");
  queryParams.set("includeProfileChanges", filters.includeProfileChanges ? "1" : "0");
  queryParams.set("includeAdminOnly", filters.includeAdminOnly ? "1" : "0");
  queryParams.set("excludeAdminOnly", filters.excludeAdminOnly ? "1" : "0");
  queryParams.set("excludeWeeklyUpdate", filters.excludeWeeklyUpdate ? "1" : "0");
  queryParams.set("excludeCaseInfo", filters.excludeCaseInfo ? "1" : "0");

  const endpoint = `get_patient_progress_notes.php?${queryParams.toString()}`;

  const response = await apiRequest<ApiEnvelope>(endpoint, {
    method: "GET",
    withAuth: true,
    cache: "no-store",
  });

  return {
    notes: mapNotes(response.data),
    pagination: mapPagination(response.data),
  };
}

export async function getPatientProgressNoteRecipientOptions(
  pid: number,
): Promise<ProgressNoteRecipientOptions> {
  const response = await apiRequest<ApiEnvelope>(`get_patient_progress_note_recipients.php?pid=${pid}`, {
    method: "GET",
    withAuth: true,
    cache: "no-store",
  });

  const payload = response.data && typeof response.data === "object"
    ? (response.data as Record<string, unknown>)
    : {};

  const defaults = payload.defaults && typeof payload.defaults === "object"
    ? (payload.defaults as Record<string, unknown>)
    : {};

  return {
    clinicEmails: Array.isArray(payload.clinicEmails)
      ? payload.clinicEmails.filter((value): value is string => typeof value === "string" && value.trim() !== "")
      : [],
    lawyerEmails: Array.isArray(payload.lawyerEmails)
      ? payload.lawyerEmails.filter((value): value is string => typeof value === "string" && value.trim() !== "")
      : [],
    defaults: {
      clinicFollowEmailChain: toBoolean(defaults.clinicFollowEmailChain),
      lawyerFollowEmailChain: toBoolean(defaults.lawyerFollowEmailChain),
      lawyerUpdatePortal: toBoolean(defaults.lawyerUpdatePortal),
    },
  };
}

export async function getPatientLopRequestOptions(
  pid: number,
): Promise<ProgressNoteLopRequestOptions> {
  const response = await apiRequest<ApiEnvelope>(`get_patient_lop_request_recipients.php?pid=${pid}`, {
    method: "GET",
    withAuth: true,
    cache: "no-store",
  });

  const payload = response.data && typeof response.data === "object"
    ? (response.data as Record<string, unknown>)
    : {};

  return {
    emails: Array.isArray(payload.emails)
      ? payload.emails.filter((value): value is string => typeof value === "string" && value.trim() !== "")
      : [],
  };
}

export async function sendPatientLopRequest(input: {
  pid: number;
  note?: string;
  emails: string[];
}): Promise<{ message: string }> {
  const response = await apiRequest<ApiEnvelope>("send_patient_lop_request.php", {
    method: "POST",
    withAuth: true,
    cache: "no-store",
    body: input,
  });

  const payload = response.data && typeof response.data === "object"
    ? (response.data as Record<string, unknown>)
    : {};

  return {
    message: typeof payload.message === "string" ? payload.message : "Mail successfully sent",
  };
}

export async function createPatientProgressNote(input: {
  pid: number;
  body: string;
  tags: ProgressNoteTagState;
  importantToClinicSelection?: ProgressNoteEmailSelection | null;
  notifyLawyerSelection?: ProgressNoteLawyerSelection | null;
}): Promise<{ note: PatientProgressNote | null; message: string }> {
  const response = await apiRequest<ApiEnvelope>("create_patient_progress_note.php", {
    method: "POST",
    withAuth: true,
    cache: "no-store",
    body: input,
  });

  const payload = response.data && typeof response.data === "object"
    ? (response.data as Record<string, unknown>)
    : {};

  const notes = mapNotes({ notes: payload.note ? [payload.note] : [] });

  return {
    note: notes[0] ?? null,
    message: typeof payload.message === "string" ? payload.message : "Progress note saved.",
  };
}
