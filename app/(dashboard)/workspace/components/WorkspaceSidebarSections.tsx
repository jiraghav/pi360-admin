"use client";

import { useEffect, useRef, useState } from "react";
import type { SelectedWorkspacePatient } from "@/lib/workspace";
import {
  formatWorkspaceCurrency,
  formatWorkspaceDate,
} from "@/lib/workspace";
import { getPatientCaseChecklist, type PatientCaseChecklist, type PatientReportTrackingRow } from "@/lib/case-checklist";
import { WorkspaceAppointmentsCard } from "@/app/(dashboard)/workspace/components/WorkspaceAppointmentsCard";
import { WorkspaceDiagnosesCard } from "@/app/(dashboard)/workspace/components/WorkspaceDiagnosesCard";

const caseChecklistOpenStorageKey = "pi360.ws.sidebar.caseChecklist.open";

interface WorkspaceSidebarSectionsProps {
  selectedPatient: SelectedWorkspacePatient;
  treatmentPlanValue: string;
}

export function WorkspaceSidebarSections({
  selectedPatient,
  treatmentPlanValue,
}: WorkspaceSidebarSectionsProps) {
  const [isCaseChecklistOpen, setIsCaseChecklistOpen] = useState(false);
  const skipPersistCaseChecklistOnceRef = useRef(true);
  const [caseChecklist, setCaseChecklist] = useState<PatientCaseChecklist | null>(null);
  const [caseChecklistReports, setCaseChecklistReports] = useState<PatientReportTrackingRow[]>([]);
  const [caseChecklistLoading, setCaseChecklistLoading] = useState(false);
  const [caseChecklistError, setCaseChecklistError] = useState("");

  useEffect(() => {
    try {
      const storedValue = window.sessionStorage.getItem(caseChecklistOpenStorageKey);
      if (storedValue === "1") {
        queueMicrotask(() => setIsCaseChecklistOpen(true));
      }
    } catch {
      // ignore - storage may be unavailable
    }
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
              <button className="mini" type="button" onClick={() => setIsCaseChecklistOpen((current) => !current)}>
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
          <div className="hd"><div className="title">Customize Report</div><div className="sub">(collapsed)</div><div className="right"><button className="mini primary">Save</button><button className="mini">Share w/ Lawyer</button></div></div>
          <div className="bd">
            <div className="three-col">
              <div className="field"><label>Custom Data - Balance</label><input defaultValue={selectedPatient.balance.toFixed(2)} /></div>
              <div className="field"><label>Initial visit</label><input defaultValue={formatWorkspaceDate(selectedPatient.doi)} /></div>
              <div className="field"><label>Total visits</label><input defaultValue="0" /></div>
              <div className="field"><label>Last visit</label><input defaultValue={formatWorkspaceDate(selectedPatient.lastVisit)} /></div>
              <div className="field"><label>Next visit</label><input defaultValue={formatWorkspaceDate(selectedPatient.nextVisit)} /></div>
              <div className="field"><label>Referrals received</label><input defaultValue="0" /></div>
            </div>
            <div className="hr"></div>
            <div className="hint">
              Real data mirror: Balance {selectedPatient.balance.toFixed(2)} | Last encounter{" "}
              {formatWorkspaceDate(selectedPatient.lastVisit)} | Facility {selectedPatient.facility || "N/A"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="hd"><div className="title">Claims</div><div className="sub">(collapsed)</div><div className="right"><button className="mini">Select all</button><button className="mini">Deselect all</button></div></div>
          <div className="bd">
            <div className="claims-list" id="claimsList">
              <div className="claim-item"><div>{formatWorkspaceDate(selectedPatient.doi)} - Intake</div><span>{selectedPatient.status || "Open"}</span></div>
              <div className="claim-item"><div>{formatWorkspaceDate(selectedPatient.lastVisit)} - Office Visit</div><span>Office Visit</span></div>
              <div className="claim-item"><div>{formatWorkspaceDate(selectedPatient.nextVisit)} - Scheduled Follow-up</div><span>Scheduled</span></div>
            </div>
            <div className="actions-row"><button className="mini primary">Download 837 Files</button></div>
          </div>
        </div>

        <div className="card">
          <div className="hd"><div className="title">🧾 Treatment Plan</div><div className="sub">(collapsed)</div><div className="right"><button className="mini primary">Save & Share with Lawyer</button><button className="mini">Save</button></div></div>
          <div className="bd">
            <div className="field"><label>Plan</label><textarea id="treatmentPlanText" defaultValue={treatmentPlanValue}></textarea></div>
            <div className="hr"></div>
            <div className="actions-row">
              <button className="mini primary" id="wsAddDoctorRequest">+ Add doctor requests</button>
              <button className="mini" id="wsAddLawyerTask">+ Add lawyer task</button>
              <button className="mini" id="wsAddAuthTask">+ Add authorization task</button>
              <button className="mini" id="wsAddAffiliateTask">+ Add affiliate task</button>
              <button className="mini" id="wsViewActivities">View Patient Activities</button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="hd"><div className="title">Billing</div><div className="sub">(collapsed)</div><div className="right"><button className="mini">Case information</button><button className="mini primary">Treatment status request</button></div></div>
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
              <div className="metric"><div className="k">Transportation cost</div><div className="v red">$0.00</div></div>
              <div className="metric"><div className="k">Patient balance due</div><div className="v red">{formatWorkspaceCurrency(selectedPatient.balance)}</div></div>
              <div className="metric"><div className="k">Insurance paid</div><div className="v blue">$0.00</div></div>
              <div className="metric"><div className="k">Cumulative total</div><div className="v">{formatWorkspaceCurrency(selectedPatient.balance)}</div></div>
            </div>
            <div className="hr"></div>
            <div className="hint">This card is designed to match the current EMR components but presented as readable KPIs.</div>
          </div>
        </div>
      </div>
    </>
  );
}
