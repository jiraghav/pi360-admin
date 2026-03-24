"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { getFacilities, type FacilityOption } from "@/lib/facilities";
import {
  getPatientsPage,
  savePatientDemographics,
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

interface PatientDemographicsDraft {
  name: string;
  phone: string;
  email: string;
  facilityId: number | null;
  facilityName: string;
  dob: string;
  doi: string;
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

export default function PatientsPageClient() {
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [pagination, setPagination] = useState<PatientsPagination>(fallbackPagination);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPatientId, setExpandedPatientId] = useState<string | number | null>(null);
  const [facilities, setFacilities] = useState<FacilityOption[]>([]);
  const [facilityError, setFacilityError] = useState("");
  const [patientDrafts, setPatientDrafts] = useState<Record<string, PatientDemographicsDraft>>({});
  const [saveStateByPatient, setSaveStateByPatient] = useState<Record<string, { status: "idle" | "saving" | "saved" | "error"; message: string }>>({});
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

    setPatientDrafts((current) => ({
      ...current,
      [patientKey]: {
        ...(current[patientKey] ?? createDemographicsDraft(patient)),
        [field]: value,
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
                  const saveState = saveStateByPatient[String(patientKey)] ?? {
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
                    <Link className="mini primary" href="/workspace" style={{ textDecoration: "none" }}>
                      Open EMR
                    </Link>
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
                            <label>Name</label>
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
                            <label>Facility</label>
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
                          <button className="mini" type="button">Open facility</button>
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
                            <input defaultValue={formatDate(patient.lastVisit)} />
                          </div>
                          <div className="field">
                            <label>Next visit</label>
                            <input defaultValue={formatDate(patient.nextVisit)} />
                          </div>
                          <div className="field">
                            <label>Current bill amount</label>
                            <input defaultValue={currencyFormatter.format(patient.balance)} />
                          </div>
                          <div className="field">
                            <label>Payment status</label>
                            <select defaultValue={patient.balance > 0 ? "Balance due" : "Paid"}>
                              <option>Balance due</option>
                              <option>Paid</option>
                              <option>In review</option>
                            </select>
                          </div>
                        </div>
                        <div className="hint" style={{ marginTop: "8px" }}>
                          Affiliates update: last visit + next visit + bill amount + upload any records if applicable.
                        </div>
                        <div className="actions-row">
                          <button className="mini primary" type="button">Save updates</button>
                          <button className="mini" type="button">Upload doc</button>
                        </div>
                      </div>

                      <div className="softbox">
                        <div style={{ fontWeight: 950 }}>Notes</div>
                        <div className="sep"></div>
                        <div className="field">
                          <label>Add note</label>
                          <textarea placeholder="Quick note for CIC / clinic / lawyer (as appropriate)"></textarea>
                        </div>
                        <div className="actions-row">
                          <button className="mini primary" type="button">Add note</button>
                          <button className="mini" type="button">View all notes</button>
                        </div>
                        <div className="hint" style={{ marginTop: "8px" }}>
                          Tip: use checkbox tags (Urgent / Notify Lawyer / Admin only) in the full workspace for structured routing.
                        </div>
                      </div>
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
    </section>
  );
}
