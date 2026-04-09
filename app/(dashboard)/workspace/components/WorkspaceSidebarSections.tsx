import type { SelectedWorkspacePatient } from "@/lib/workspace";
import {
  formatWorkspaceCurrency,
  formatWorkspaceDate,
} from "@/lib/workspace";

interface WorkspaceSidebarSectionsProps {
  selectedPatient: SelectedWorkspacePatient;
  treatmentPlanValue: string;
}

export function WorkspaceSidebarSections({
  selectedPatient,
  treatmentPlanValue,
}: WorkspaceSidebarSectionsProps) {
  return (
    <>
      <div className="grid">
        <div className="card">
          <div className="hd"><div className="title">📅 Appointments</div><div className="sub">(collapsed)</div><div className="right"><button className="mini primary">Add</button></div></div>
          <div className="bd">
            <div className="note">
              <div className="h">
                <div className="t">Next visit: {formatWorkspaceDate(selectedPatient.nextVisit)}</div>
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
          <div className="hd"><div className="title">🩺 Diagnoses</div><div className="sub">(collapsed)</div><div className="right"><button className="mini">Edit</button></div></div>
          <div className="bd"><div className="hint">Nothing recorded</div></div>
        </div>

        <div className="card">
          <div className="hd"><div className="title">✅ Case Checklist + Report Tracking</div><div className="right"><button className="mini">Edit</button></div></div>
          <div className="bd">
            <div className="checkgrid">
              <label className="checkline"><input type="checkbox" /> Intake</label>
              <label className="checkline"><input type="checkbox" /> Liability cleared</label>
              <label className="checkline"><input type="checkbox" /> Police report</label>
              <label className="checkline"><input type="checkbox" /> Underinsured</label>
              <label className="checkline"><input type="checkbox" /> Uninsured</label>
              <label className="checkline"><input type="checkbox" /> LOP</label>
              <label className="checkline"><input type="checkbox" /> Hospital records received</label>
              <label className="checkline"><input type="checkbox" defaultChecked /> Bills and records</label>
            </div>
            <div className="hr"></div>
            <table className="table">
              <thead><tr><th>Report Name</th><th>Sent</th><th>Report received</th></tr></thead>
              <tbody>
                <tr><td>Chiro report</td><td><span className="chip warn">Pending</span></td><td>-</td></tr>
                <tr><td>MRI report</td><td><span className="chip">-</span></td><td><span className="chip good">Received</span></td></tr>
                <tr><td>Neuro report</td><td><span className="chip">-</span></td><td>-</td></tr>
                <tr><td>Ortho report</td><td><span className="chip">-</span></td><td>-</td></tr>
                <tr><td>Pain report</td><td><span className="chip">-</span></td><td>-</td></tr>
              </tbody>
            </table>
          </div>
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
