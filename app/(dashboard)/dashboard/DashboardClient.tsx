"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getDashboardSummary,
  getNeedsUpdatePatientsPage,
  type DashboardSummary,
  type NeedsUpdatePagination,
  type NeedsUpdatePatient,
} from "@/lib/dashboard";

const defaultSummary: DashboardSummary = {
  activePatients: 0,
  unpaidBalance: 0,
  totalSubmitted: 0,
  pendingReferrals: 0,
  needsUpdate: 0,
  newNotes: 0,
};

export default function DashboardClient() {
  const [summary, setSummary] = useState<DashboardSummary>(defaultSummary);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [needsLoading, setNeedsLoading] = useState(true);
  const [error, setError] = useState("");
  const [needsUpdatePage, setNeedsUpdatePage] = useState(1);
  const needsUpdatePageSize = 10;
  const [needsUpdatePatients, setNeedsUpdatePatients] = useState<NeedsUpdatePatient[]>([]);
  const [needsUpdatePagination, setNeedsUpdatePagination] = useState<NeedsUpdatePagination>({
    page: 1,
    pageSize: needsUpdatePageSize,
    totalItems: 0,
    totalPages: 1,
  });
  const needsCardRef = useRef<HTMLDivElement | null>(null);
  const hasLoadedNeedsPageRef = useRef(false);

  useEffect(() => {
    const fetchSummary = async () => {
      setSummaryLoading(true);
      try {
        const data = await getDashboardSummary();
        setSummary(data);
      } catch (err) {
        console.error("Failed to load dashboard summary:", err);
        setError("Unable to load latest dashboard data.");
      } finally {
        setSummaryLoading(false);
      }
    };

    fetchSummary();
  }, []);

  useEffect(() => {
    const fetchNeedsUpdate = async () => {
      setNeedsLoading(true);
      try {
        const data = await getNeedsUpdatePatientsPage({
          page: needsUpdatePage,
          pageSize: needsUpdatePageSize,
        });
        setNeedsUpdatePatients(data.patients);
        setNeedsUpdatePagination(data.pagination);
      } catch (err) {
        console.error("Failed to load needs update patients:", err);
        setError("Unable to load latest dashboard data.");
      } finally {
        setNeedsLoading(false);
      }
    };

    fetchNeedsUpdate();
  }, [needsUpdatePage]);

  useEffect(() => {
    if (needsLoading) {
      return;
    }

    if (!hasLoadedNeedsPageRef.current) {
      hasLoadedNeedsPageRef.current = true;
      return;
    }

    needsCardRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [needsLoading]);

  const currency = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }),
    [],
  );

  const shortDate = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [],
  );

  const formatDate = (value: string | null) => {
    if (!value) {
      return "N/A";
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return shortDate.format(parsed);
  };

  const needsStart = needsUpdatePagination.totalItems === 0
    ? 0
    : (needsUpdatePagination.page - 1) * needsUpdatePagination.pageSize + 1;
  const needsEnd = needsUpdatePagination.totalItems === 0
    ? 0
    : Math.min(
        needsUpdatePagination.page * needsUpdatePagination.pageSize,
        needsUpdatePagination.totalItems,
      );

  return (
    <section className="dashboard-page">
      <div className="grid dashboard-grid">
        <div className="card">
          <div className="hd dashboard-card-head">
            <div className="dashboard-card-copy">
              <div className="title">Today at a glance</div>
              <div className="sub">What needs attention</div>
            </div>
            <div className="right dashboard-card-actions">
              <span className="chip warn">
                {summaryLoading ? "..." : summary.needsUpdate} needs update
              </span>
              <span className="chip">{summary.newNotes} new notes</span>
              <Link className="mini primary" href="/patients" style={{ textDecoration: "none" }}>
                Go to Patients
              </Link>
            </div>
          </div>
          <div className="bd">
            {error && (
              <div style={{ marginBottom: "10px" }} className="hint">
                {error} Showing fallback values.
              </div>
            )}
            <div className="kpi-row dashboard-kpi-row">
              <div className="kpi">
                <div className="k">Active patients</div>
                <div className="v">
                  {summaryLoading ? "..." : summary.activePatients}
                </div>
              </div>
              <div className="kpi">
                <div className="k">Unpaid balance</div>
                <div className="v">
                  {summaryLoading ? "..." : currency.format(summary.unpaidBalance)}
                </div>
              </div>
              <div className="kpi">
                <div className="k">Total submitted</div>
                <div className="v">
                  {summaryLoading ? "..." : summary.totalSubmitted}
                </div>
              </div>
              <div className="kpi">
                <div className="k">Pending referrals</div>
                <div className="v">
                  {summaryLoading ? "..." : summary.pendingReferrals}
                </div>
              </div>
            </div>
            <div className="hr"></div>
            <div className="three-col dashboard-info-grid">
              <div className="softbox">
                <div style={{ fontWeight: 950 }}>Fast Actions</div>
                <div className="hint" style={{ marginTop: "6px" }}>
                  Everything an affiliate or admin needs should be one click
                  away. Use these quick actions or open the patient workspace.
                </div>
                <div className="actions-row">
                  <button className="mini primary" id="dashCreateWeekly">
                    Send weekly update email
                  </button>
                  <button className="mini" id="dashCreateTreatmentReq">
                    Send treatment status request
                  </button>
                  <button className="mini" id="dashAddFacility">
                    Add facility
                  </button>
                  <button className="mini" id="dashAddTemplate">
                    Add email template
                  </button>
                </div>
              </div>
              <div className="softbox">
                <div style={{ fontWeight: 950 }}>What affiliates do here</div>
                <ul className="hint" style={{ margin: "8px 0 0 18px" }}>
                  <li>Update patient demographics and visit dates</li>
                  <li>Enter current bill amount and upload supporting docs</li>
                  <li>Send referral / message / tasks to CIC</li>
                  <li>See payment status and open EMR view if needed</li>
                </ul>
              </div>
              <div className="softbox">
                <div style={{ fontWeight: 950 }}>
                  EMR parity checklist (from screenshots)
                </div>
                <ul className="hint" style={{ margin: "8px 0 0 18px" }}>
                  <li>Progress notes + notify checkboxes</li>
                  <li>
                    Appointments, diagnoses, reminders, allergies, medications
                  </li>
                  <li>Claims list, case checklist, report tracking</li>
                  <li>Billing summary + custom report fields</li>
                  <li>Treatment plan editor + share with lawyer</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="card" ref={needsCardRef}>
          <div className="hd dashboard-card-head">
            <div className="dashboard-card-copy">
              <div className="title">Needs update</div>
              <div className="sub">Blinking indicator for affiliates</div>
            </div>
            <div className="right dashboard-card-actions">
              <Link className="mini primary" href="/patients" style={{ textDecoration: "none" }}>
                Review
              </Link>
            </div>
          </div>
          <div className="bd">
            <div
              id="dashNeedsList"
              className="grid dashboard-needs-list"
            >
              {needsLoading && needsUpdatePatients.length === 0 && (
                <div className="softbox hint">Loading needs update patients...</div>
              )}
              {!needsLoading && needsUpdatePatients.length === 0 && (
                <div className="softbox hint">No patients currently need updates.</div>
              )}
              {needsUpdatePatients.map((patient, index) => (
                <div
                  key={`${patient.name}-${patient.dob ?? "no-dob"}-${index}`}
                  className="softbox"
                >
                  <div className="row">
                    <div style={{ fontWeight: 1000 }}>
                      {patient.name || "Unnamed patient"}
                    </div>
                    <div className="spacer"></div>
                    <span className="chip bad blink">Needs update</span>
                  </div>
                  <div className="hint" style={{ marginTop: "6px" }}>
                    DOB {formatDate(patient.dob)} | DOI {formatDate(patient.doi)}
                    <br />
                    Last updated:{" "}
                    <span className="mono">{formatDate(patient.lastUpdated)}</span>
                    <br />
                    Facility: {patient.facility || "N/A"}
                  </div>
                  <div className="actions-row">
                    <Link
                      className="mini primary"
                      href="/patients"
                      style={{ textDecoration: "none" }}
                    >
                      Open
                    </Link>
                    <Link className="mini" href="/workspace" style={{ textDecoration: "none" }}>
                      Open EMR
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <div className="row wrap dashboard-pagination-row" style={{ marginTop: "10px" }}>
              <div className="hint">
                Showing {needsStart}-{needsEnd} of {needsUpdatePagination.totalItems}
              </div>
              <div className="spacer" />
              <div className="hint dashboard-pagination-meta">
                Page {needsUpdatePagination.page} of {needsUpdatePagination.totalPages}
              </div>
              <button
                className="mini"
                disabled={needsLoading || needsUpdatePagination.page <= 1}
                onClick={() => setNeedsUpdatePage((prev) => Math.max(1, prev - 1))}
                style={{ opacity: needsLoading || needsUpdatePagination.page <= 1 ? 0.5 : 1 }}
              >
                Prev
              </button>
              <button
                className="mini primary"
                disabled={needsLoading || needsUpdatePagination.page >= needsUpdatePagination.totalPages}
                onClick={() =>
                  setNeedsUpdatePage((prev) =>
                    Math.min(needsUpdatePagination.totalPages, prev + 1),
                  )
                }
                style={{
                  opacity:
                    needsLoading || needsUpdatePagination.page >= needsUpdatePagination.totalPages
                      ? 0.5
                      : 1,
                }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
