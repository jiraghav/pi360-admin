"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelectedPatient } from "@/app/components/SelectedPatientProvider";
import { getFacilities, type FacilityOption } from "@/lib/facilities";
import { savePatientDemographics } from "@/lib/patients";
import {
  formatWorkspaceCurrency,
  formatWorkspaceDate,
  formatWorkspacePhone,
} from "@/lib/workspace";

interface WorkspaceDemographicsDraft {
  name: string;
  phone: string;
  email: string;
  facilityId: number | null;
  facility: string;
  dob: string;
  doi: string;
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

function createWorkspaceDemographicsDraft(
  patient: NonNullable<ReturnType<typeof useSelectedPatient>["selectedPatient"]>,
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

export default function WorkspacePageClient() {
  const router = useRouter();
  const {
    isHydrated,
    selectedPatient,
    selectPatient,
    clearSelectedPatient,
  } = useSelectedPatient();
  const [isDemographicsOpen, setIsDemographicsOpen] = useState(true);
  const [demographicsDraft, setDemographicsDraft] = useState<WorkspaceDemographicsDraft | null>(null);
  const [isSavingDemographics, setIsSavingDemographics] = useState(false);
  const [demographicsSaveMessage, setDemographicsSaveMessage] = useState("");
  const [demographicsSaveError, setDemographicsSaveError] = useState(false);
  const [facilities, setFacilities] = useState<FacilityOption[]>([]);
  const [facilityError, setFacilityError] = useState("");

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!selectedPatient) {
      router.replace("/patients");
    }
  }, [isHydrated, router, selectedPatient]);

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
      } catch (error) {
        console.error("Failed to load facilities for workspace:", error);
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
    if (!selectedPatient) {
      return;
    }

    setDemographicsDraft(createWorkspaceDemographicsDraft(selectedPatient));
    setDemographicsSaveMessage("");
    setDemographicsSaveError(false);
  }, [selectedPatient]);

  if (!isHydrated || !selectedPatient) {
    return (
      <section>
        <div className="softbox hint">Loading patient workspace...</div>
      </section>
    );
  }

  const patientMeta = [
    `DOB ${formatWorkspaceDate(selectedPatient.dob)}`,
    `DOI ${formatWorkspaceDate(selectedPatient.doi)}`,
    `Facility ${selectedPatient.facility || "N/A"}`,
    selectedPatient.status || "Active",
  ].join(" | ");

  const treatmentPlanValue = `${selectedPatient.name || "Patient"} DOB: ${formatWorkspaceDate(selectedPatient.dob)} DOI: ${formatWorkspaceDate(selectedPatient.doi)} Facility: ${selectedPatient.facility || "N/A"} Last visit: ${formatWorkspaceDate(selectedPatient.lastVisit)} Next visit: ${formatWorkspaceDate(selectedPatient.nextVisit)} Balance: ${formatWorkspaceCurrency(selectedPatient.balance)}.`;

  const handleCloseWorkspace = () => {
    clearSelectedPatient();
    router.push("/patients");
  };

  const handleDemographicsFieldChange = (
    field: keyof WorkspaceDemographicsDraft,
    value: string,
  ) => {
    setDemographicsDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [field]: field === "phone" ? maskPhoneInput(value) : value,
      };
    });
  };

  const handleFacilityInputChange = (value: string) => {
    const matchedFacility = facilities.find(
      (facility) => facility.name.toLowerCase() === value.trim().toLowerCase(),
    );

    setDemographicsDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        facility: matchedFacility?.name ?? value,
        facilityId: matchedFacility?.id ?? null,
      };
    });
  };

  const handleSaveDemographics = async () => {
    if (!selectedPatient.pid) {
      setDemographicsSaveError(true);
      setDemographicsSaveMessage("This workspace patient is read-only here. Open from Patients list to save.");
      return;
    }

    if (!demographicsDraft) {
      return;
    }

    setIsSavingDemographics(true);
    setDemographicsSaveMessage("");
    setDemographicsSaveError(false);

    try {
      const result = await savePatientDemographics({
        pid: selectedPatient.pid,
        name: demographicsDraft.name,
        phone: demographicsDraft.phone,
        email: demographicsDraft.email,
        facilityId: demographicsDraft.facilityId,
        dob: demographicsDraft.dob,
        doi: demographicsDraft.doi,
      });

      const nextPatient = {
        ...selectedPatient,
        ...result.patient,
        facility: result.patient?.facility ?? demographicsDraft.facility,
        facilityId: result.patient?.facilityId ?? demographicsDraft.facilityId,
      };

      selectPatient(nextPatient);
      setDemographicsDraft(createWorkspaceDemographicsDraft(nextPatient));
      setDemographicsSaveError(false);
      setDemographicsSaveMessage(result.message);
    } catch (error) {
      console.error("Failed to save workspace demographics:", error);
      setDemographicsSaveError(true);
      setDemographicsSaveMessage("Unable to save demographics right now.");
    } finally {
      setIsSavingDemographics(false);
    }
  };

  return (
    <section>
      <div className="workspace-header">
        <div className="pn">
          <div className="n" id="wsPatientName">
            {selectedPatient.name || "Unnamed patient"}
          </div>
          <div className="s" id="wsPatientMeta">
            {patientMeta}
          </div>
        </div>
        <div className="quicklinks">
          <a href="#" title="Medical History Documents">
            Medical History Docs
          </a>
          <a href="#" title="Referrals">
            Referrals (2)
          </a>
          <a href="#" title="Ledger">
            Ledger
          </a>
          <a href="#" title="Generate Full Report">
            Generate Full Report
          </a>
          <a href="#" title="Generate Partial Report">
            Generate Partial Report
          </a>
          <a href="#" title="Generate Invoice">
            Generate Invoice
          </a>
          <a href="#" title="Send E-Script">
            Send E-Script
          </a>
          <a href="#" title="Download CMS">
            Download CMS
          </a>
        </div>
        <div className="spacer"></div>
        <div className="row">
          <button className="btn secondary" type="button" onClick={handleCloseWorkspace}>
            Close Workspace
          </button>
          <button className="btn secondary" id="wsCopyDetails">
            Copy Details
          </button>
          <button className="btn" id="wsSaveAll">
            Save
          </button>
        </div>
      </div>

      <div className="workspace-grid">
        <div className="grid">
          <div className="card">
            <div className="hd">
              <div className="title">Edit Demographics</div>
              <div className="sub">{isDemographicsOpen ? "(expanded)" : "(collapsed)"}</div>
              <div className="right">
                <button
                  className="mini primary"
                  type="button"
                  disabled={isSavingDemographics}
                  onClick={handleSaveDemographics}
                >
                  {isSavingDemographics ? "Saving..." : "Save"}
                </button>
                <button
                  className="mini"
                  type="button"
                  onClick={() => setIsDemographicsOpen((current) => !current)}
                >
                  {isDemographicsOpen ? "Collapse" : "Expand"}
                </button>
              </div>
            </div>
            {isDemographicsOpen && demographicsDraft && (
              <div className="bd" id="demogBody">
                <div className="two-col">
                  <div className="field">
                    <label>Name</label>
                    <input
                      value={demographicsDraft.name}
                      onChange={(event) => handleDemographicsFieldChange("name", event.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Phone</label>
                    <input
                      value={demographicsDraft.phone}
                      onChange={(event) => handleDemographicsFieldChange("phone", event.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Email</label>
                    <input
                      value={demographicsDraft.email}
                      onChange={(event) => handleDemographicsFieldChange("email", event.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Facility</label>
                    <input
                      list="workspace-facility-options"
                      value={demographicsDraft.facility}
                      onChange={(event) => handleFacilityInputChange(event.target.value)}
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
                      value={demographicsDraft.dob}
                      onChange={(event) => handleDemographicsFieldChange("dob", event.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>DOI</label>
                    <input
                      type="date"
                      value={demographicsDraft.doi}
                      onChange={(event) => handleDemographicsFieldChange("doi", event.target.value)}
                    />
                  </div>
                </div>
                {demographicsSaveMessage && (
                  <div
                    className="hint"
                    style={{
                      marginTop: "8px",
                      color: demographicsSaveError ? "var(--bad)" : undefined,
                    }}
                  >
                    {demographicsSaveMessage}
                  </div>
                )}

                <div className="hr"></div>
                <div className="hint">
                  Quick parity to emr.cic.clinic: Who / Case Team / Contact / Insurance / Choices /
                  Employer / Tabs. This prototype keeps everything available but reduces clutter.
                </div>
              </div>
            )}
          </div>
          <datalist id="workspace-facility-options">
            {facilities.map((facility) => {
              const suffix = [facility.city, facility.state].filter(Boolean).join(", ");
              const label = suffix ? `${facility.name} (${suffix})` : facility.name;

              return <option key={facility.id} value={facility.name} label={label} />;
            })}
          </datalist>

          <div className="card">
            <div className="hd">
              <div className="title">Add Progress Note - Updates Here</div>
              <div className="sub">(back office adds too)</div>
              <div className="right">
                <button className="mini primary" id="wsSaveNote">
                  Save note
                </button>
                <button className="mini" id="wsSendLOP">
                  Send LOP request
                </button>
              </div>
            </div>
            <div className="bd">
              <div className="field">
                <label>Note</label>
                <textarea
                  id="wsNoteText"
                  placeholder="Ex: patient missed, patient not answering calls, update on case, etc."
                ></textarea>
              </div>
              <div className="hr"></div>
              <div className="checkgrid">
                <label className="checkline">
                  <input type="checkbox" /> Urgent
                </label>
                <label className="checkline">
                  <input type="checkbox" /> Important - to clinic
                </label>
                <label className="checkline">
                  <input type="checkbox" /> Notify Lawyer
                </label>
                <label className="checkline">
                  <input type="checkbox" /> Notify Clinic Director
                </label>
                <label className="checkline">
                  <input type="checkbox" /> Notify Back Office
                </label>
                <label className="checkline">
                  <input type="checkbox" /> Share to Affiliate Notes
                </label>
                <label className="checkline">
                  <input type="checkbox" /> Admin only
                </label>
                <label className="checkline">
                  <input type="checkbox" /> Billing notice
                </label>
                <label className="checkline">
                  <input type="checkbox" /> Notify referrals
                </label>
                <label className="checkline">
                  <input type="checkbox" /> Finance
                </label>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="hd">
              <div className="title">Patient Update Section</div>
              <div className="sub">(collapse)</div>
              <div className="right">
                <button className="mini" data-collapse="#updatesBody">
                  Toggle
                </button>
              </div>
            </div>
            <div className="bd" id="updatesBody">
              <div className="toolbar" style={{ marginBottom: "10px" }}>
                <div className="search-mini" style={{ minWidth: "240px" }}>
                  Search <input id="noteFilter" placeholder="Search notes..." />
                </div>
                <button className="mini primary">Add/Edit</button>
                <button className="mini">View all</button>
                <span className="hint">Filtered</span>
              </div>
              <div id="wsNotesList" className="grid" style={{ gap: "10px" }}>
                <div className="note">
                  <div className="h">
                    <div className="t">Patient profile</div>
                    <div className="m">{formatWorkspaceDate(selectedPatient.lastUpdated)}</div>
                  </div>
                  <div className="p">
                    Current facility: {selectedPatient.facility || "N/A"} | Last visit:{" "}
                    {formatWorkspaceDate(selectedPatient.lastVisit)} | Next visit:{" "}
                    {formatWorkspaceDate(selectedPatient.nextVisit)}
                  </div>
                </div>

                <div className="note">
                  <div className="h">
                    <div className="t">Contact</div>
                    <div className="m">{selectedPatient.status || "Active"}</div>
                  </div>
                  <div className="p">
                    Phone: {formatWorkspacePhone(selectedPatient.phone)} | Email:{" "}
                    {selectedPatient.email || "N/A"}
                  </div>
                </div>

                <div className="note">
                  <div className="h">
                    <div className="t">Billing snapshot</div>
                    <div className="m">
                      {selectedPatient.needsUpdate ? "Needs update" : "Up to date"}
                    </div>
                  </div>
                  <div className="p">
                    Current balance: {formatWorkspaceCurrency(selectedPatient.balance)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid">
          <div className="card">
            <div className="hd">
              <div className="title">Appointments</div>
              <div className="sub">(collapse)</div>
              <div className="right">
                <button className="mini primary">Add</button>
              </div>
            </div>
            <div className="bd">
              <div className="note">
                <div className="h">
                  <div className="t">
                    Next visit: {formatWorkspaceDate(selectedPatient.nextVisit)}
                  </div>
                  <div className="m">Status: {selectedPatient.status || "Active"}</div>
                </div>
                <div className="p">
                  Location: {selectedPatient.facility || "N/A"} | Last visit:{" "}
                  {formatWorkspaceDate(selectedPatient.lastVisit)}
                </div>
              </div>
              <div className="sep"></div>
              <div className="hint">Recurrent appointments: none</div>
            </div>
          </div>

          <div className="card">
            <div className="hd">
              <div className="title">Diagnoses</div>
              <div className="sub">(collapse)</div>
              <div className="right">
                <button className="mini">Edit</button>
              </div>
            </div>
            <div className="bd">
              <div className="hint">Nothing recorded</div>
            </div>
          </div>

          <div className="card">
            <div className="hd">
              <div className="title">Case Checklist + Report Tracking</div>
              <div className="right">
                <button className="mini">Edit</button>
              </div>
            </div>
            <div className="bd">
              <div className="checkgrid">
                <label className="checkline">
                  <input type="checkbox" /> Intake
                </label>
                <label className="checkline">
                  <input type="checkbox" /> Liability cleared
                </label>
                <label className="checkline">
                  <input type="checkbox" /> Police report
                </label>
                <label className="checkline">
                  <input type="checkbox" /> Underinsured
                </label>
                <label className="checkline">
                  <input type="checkbox" /> Uninsured
                </label>
                <label className="checkline">
                  <input type="checkbox" /> LOP
                </label>
                <label className="checkline">
                  <input type="checkbox" /> Hospital records received
                </label>
                <label className="checkline">
                  <input type="checkbox" defaultChecked /> Bills and records
                </label>
              </div>
              <div className="hr"></div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Report Name</th>
                    <th>Sent</th>
                    <th>Report received</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Chiro report</td>
                    <td>
                      <span className="chip warn">Pending</span>
                    </td>
                    <td>-</td>
                  </tr>
                  <tr>
                    <td>MRI report</td>
                    <td>
                      <span className="chip">-</span>
                    </td>
                    <td>
                      <span className="chip good">Received</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Neuro report</td>
                    <td>
                      <span className="chip">-</span>
                    </td>
                    <td>-</td>
                  </tr>
                  <tr>
                    <td>Ortho report</td>
                    <td>
                      <span className="chip">-</span>
                    </td>
                    <td>-</td>
                  </tr>
                  <tr>
                    <td>Pain report</td>
                    <td>
                      <span className="chip">-</span>
                    </td>
                    <td>-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="hd">
              <div className="title">Customize Report</div>
              <div className="sub">(collapse)</div>
              <div className="right">
                <button className="mini primary">Save</button>
                <button className="mini">Share w/ Lawyer</button>
              </div>
            </div>
            <div className="bd">
              <div className="three-col">
                <div className="field">
                  <label>Custom Data - Balance</label>
                  <input defaultValue={selectedPatient.balance.toFixed(2)} />
                </div>
                <div className="field">
                  <label>Initial visit</label>
                  <input defaultValue={formatWorkspaceDate(selectedPatient.doi)} />
                </div>
                <div className="field">
                  <label>Total visits</label>
                  <input defaultValue="0" />
                </div>
                <div className="field">
                  <label>Last visit</label>
                  <input defaultValue={formatWorkspaceDate(selectedPatient.lastVisit)} />
                </div>
                <div className="field">
                  <label>Next visit</label>
                  <input defaultValue={formatWorkspaceDate(selectedPatient.nextVisit)} />
                </div>
                <div className="field">
                  <label>Referrals received</label>
                  <input defaultValue="0" />
                </div>
              </div>
              <div className="hr"></div>
              <div className="hint">
                Real data mirror: Balance {selectedPatient.balance.toFixed(2)} | Last encounter{" "}
                {formatWorkspaceDate(selectedPatient.lastVisit)} | Facility{" "}
                {selectedPatient.facility || "N/A"}
              </div>
            </div>
          </div>
        </div>

        <div className="grid">
          <div className="card">
            <div className="hd">
              <div className="title">Claims</div>
              <div className="sub">(collapse)</div>
              <div className="right">
                <button className="mini">Select all</button>
                <button className="mini">Deselect all</button>
              </div>
            </div>
            <div className="bd">
              <div className="claims-list" id="claimsList">
                <div className="claim-item">
                  <div>{formatWorkspaceDate(selectedPatient.doi)} - Intake</div>
                  <span>{selectedPatient.status || "Open"}</span>
                </div>
                <div className="claim-item">
                  <div>{formatWorkspaceDate(selectedPatient.lastVisit)} - Office Visit</div>
                  <span>Office Visit</span>
                </div>
                <div className="claim-item">
                  <div>{formatWorkspaceDate(selectedPatient.nextVisit)} - Scheduled Follow-up</div>
                  <span>Scheduled</span>
                </div>
              </div>
              <div className="actions-row">
                <button className="mini primary">Download 837 Files</button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="hd">
              <div className="title">Treatment Plan</div>
              <div className="sub">(collapse)</div>
              <div className="right">
                <button className="mini primary">Save & Share with Lawyer</button>
                <button className="mini">Save</button>
              </div>
            </div>
            <div className="bd">
              <div className="field">
                <label>Plan</label>
                <textarea id="treatmentPlanText" defaultValue={treatmentPlanValue}></textarea>
              </div>
              <div className="hr"></div>
              <div className="actions-row">
                <button className="mini primary" id="wsAddDoctorRequest">
                  + Add doctor requests
                </button>
                <button className="mini" id="wsAddLawyerTask">
                  + Add lawyer task
                </button>
                <button className="mini" id="wsAddAuthTask">
                  + Add authorization task
                </button>
                <button className="mini" id="wsAddAffiliateTask">
                  + Add affiliate task
                </button>
                <button className="mini" id="wsViewActivities">
                  View Patient Activities
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="hd">
              <div className="title">Billing</div>
              <div className="sub">(collapse)</div>
              <div className="right">
                <button className="mini">Case information</button>
                <button className="mini primary">Treatment status request</button>
              </div>
            </div>
            <div className="bd">
              <div className="row wrap">
                <div className="field" style={{ minWidth: "220px" }}>
                  <label>Group</label>
                  <select defaultValue="Super facility">
                    <option>Super facility</option>
                    <option>Chiropractic / Therapy</option>
                    <option>Imaging</option>
                    <option>Pharmacy</option>
                  </select>
                </div>
                <div className="spacer"></div>
                <button className="mini">Request transport authorization</button>
              </div>
              <div className="hr"></div>

              <div className="bill-grid">
                <div className="metric">
                  <div className="k">Transportation cost</div>
                  <div className="v red">$0.00</div>
                </div>
                <div className="metric">
                  <div className="k">Patient balance due</div>
                  <div className="v red">{formatWorkspaceCurrency(selectedPatient.balance)}</div>
                </div>
                <div className="metric">
                  <div className="k">Insurance paid</div>
                  <div className="v blue">$0.00</div>
                </div>
                <div className="metric">
                  <div className="k">Cumulative total</div>
                  <div className="v">{formatWorkspaceCurrency(selectedPatient.balance)}</div>
                </div>
              </div>

              <div className="hr"></div>
              <div className="hint">
                This card is designed to match the current EMR components but presented as
                readable KPIs.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
