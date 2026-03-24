"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  getPatientsPage,
  type PatientListItem,
  type PatientsPagination,
} from "@/lib/patients";

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

export default function PatientsPageClient() {
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [pagination, setPagination] = useState<PatientsPagination>(fallbackPagination);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
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
              <div
                key={`${patient.pid ?? patient.uuid ?? patient.name}-${patient.dob ?? "no-dob"}`}
                className="patient-row patients-row"
                data-pid={patient.pid ?? patient.uuid ?? patient.name}
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
                  <Link className="mini" href="/workspace" style={{ textDecoration: "none" }}>
                    Expand
                  </Link>
                  <Link className="mini primary" href="/workspace" style={{ textDecoration: "none" }}>
                    Open EMR
                  </Link>
                </div>
              </div>
            ))}
          </div>

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
    </section>
  );
}
