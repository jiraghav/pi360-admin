import { apiRequest } from "@/lib/api-client";

interface ApiEnvelope {
  data?: unknown;
}

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const toString = (value: unknown): string => (typeof value === "string" ? value : value == null ? "" : String(value));

export type BillingGroupMode = "super_facility" | "patient_status" | "case_type" | "facility";

export interface BillingColumnBilling {
  transportationAmount: number;
  patientBalance: number;
  insurancePaymentsAmount: number;
  patientPaymentsAmount: number;
  patientAdjustmentsAmount: number;
  settledAmount: number;
  totalPendingAmount: number;
  reductionPercent: number;
  totalSettledCount: number;
  patientWriteOffAmount: number;
  cumulativeTotal: number;
  totalBalance: number;
  patientLimit: number;
}

export interface BillingColumn {
  name: string;
  billing: BillingColumnBilling;
}

export interface BillingSummaryTotals {
  cumulativeTotal: number;
  totalBalance: number;
  patientLimit: number;
  availableFunds: number;
}

export interface PatientBillingSummary {
  pid: number | null;
  billingGroup: BillingGroupMode;
  columns: BillingColumn[];
  totals: BillingSummaryTotals;
}

const parseBilling = (input: Record<string, unknown>): BillingColumnBilling => ({
  transportationAmount: toNumber(input.transportationAmount, 0),
  patientBalance: toNumber(input.patientBalance, 0),
  insurancePaymentsAmount: toNumber(input.insurancePaymentsAmount, 0),
  patientPaymentsAmount: toNumber(input.patientPaymentsAmount, 0),
  patientAdjustmentsAmount: toNumber(input.patientAdjustmentsAmount, 0),
  settledAmount: toNumber(input.settledAmount, 0),
  totalPendingAmount: toNumber(input.totalPendingAmount, 0),
  reductionPercent: toNumber(input.reductionPercent, 0),
  totalSettledCount: Math.trunc(toNumber(input.totalSettledCount, 0)),
  patientWriteOffAmount: toNumber(input.patientWriteOffAmount, 0),
  cumulativeTotal: toNumber(input.cumulativeTotal, 0),
  totalBalance: toNumber(input.totalBalance, 0),
  patientLimit: toNumber(input.patientLimit, 0),
});

const parseBillingGroupMode = (value: unknown): BillingGroupMode => {
  const normalized = toString(value).trim();
  if (
    normalized === "super_facility" ||
    normalized === "patient_status" ||
    normalized === "case_type" ||
    normalized === "facility"
  ) {
    return normalized;
  }
  return "super_facility";
};

export async function getPatientBillingSummary(pid: number, billingGroup: BillingGroupMode): Promise<PatientBillingSummary> {
  const response = await apiRequest<ApiEnvelope>(
    `get_patient_billing_summary.php?pid=${encodeURIComponent(String(pid))}&billingGroup=${encodeURIComponent(billingGroup)}`,
    {
      method: "GET",
      withAuth: true,
      cache: "no-store",
    },
  );

  const payload = response.data && typeof response.data === "object" ? (response.data as Record<string, unknown>) : {};
  const columnsRaw = Array.isArray(payload.columns) ? payload.columns : [];
  const totalsRaw = payload.totals && typeof payload.totals === "object" ? (payload.totals as Record<string, unknown>) : {};

  return {
    pid: typeof payload.pid === "number" ? payload.pid : payload.pid != null ? Number(payload.pid) : null,
    billingGroup: parseBillingGroupMode(payload.billingGroup),
    columns: columnsRaw
      .map((item) => (item && typeof item === "object" ? (item as Record<string, unknown>) : {}))
      .map((item) => {
        const billingRaw = item.billing && typeof item.billing === "object" ? (item.billing as Record<string, unknown>) : {};
        return {
          name: toString(item.name) || "-",
          billing: parseBilling(billingRaw),
        };
      }),
    totals: {
      cumulativeTotal: toNumber(totalsRaw.cumulativeTotal, 0),
      totalBalance: toNumber(totalsRaw.totalBalance, 0),
      patientLimit: toNumber(totalsRaw.patientLimit, 0),
      availableFunds: toNumber(totalsRaw.availableFunds, 0),
    },
  };
}

