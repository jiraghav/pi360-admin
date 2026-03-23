export const metadata = {
  title: "PI360 - Dashboard",
  description: "Dashboard overview",
};

export default function DashboardPage() {
  return (
    <section>
      <div className="grid">
        <div className="card">
          <div className="hd">
            <div className="title">Today at a glance</div>
            <div className="sub">What needs attention</div>
            <div className="right">
              <span className="chip warn">6 needs update</span>
              <span className="chip">3 new notes</span>
              <button className="mini primary" data-navgo="patients">
                Go to Patients
              </button>
            </div>
          </div>
          <div className="bd">
            <div className="kpi-row">
              <div className="kpi">
                <div className="k">Active patients</div>
                <div className="v">128</div>
              </div>
              <div className="kpi">
                <div className="k">Unpaid balance</div>
                <div className="v">$194,851.00</div>
              </div>
              <div className="kpi">
                <div className="k">Weekly updates sent</div>
                <div className="v">1,820</div>
              </div>
              <div className="kpi">
                <div className="k">Pending referrals</div>
                <div className="v">17</div>
              </div>
            </div>
            <div className="hr"></div>
            <div className="three-col">
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
        <div className="card">
          <div className="hd">
            <div className="title">Needs update</div>
            <div className="sub">Blinking indicator for affiliates</div>
            <div className="right">
              <button className="mini primary" data-navgo="patients">
                Review
              </button>
            </div>
          </div>
          <div className="bd">
            <div
              id="dashNeedsList"
              className="grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "10px",
              }}
            >
              <div className="softbox">
                <div className="row">
                  <div style={{ fontWeight: 1000 }}>April Gonzales</div>
                  <div className="spacer"></div>
                  <span className="chip bad blink">Needs update</span>
                </div>
                <div className="hint" style={{ marginTop: "6px" }}>
                  DOB 04/14/1981 | DOI 01/22/2026
                  <br />
                  Last updated: <span className="mono">03/05/2026</span>
                  <br />
                  Facility: Marzban Family Chiropractic - Carrollton
                </div>
                <div className="actions-row">
                  <button className="mini primary" data-openpatient="p1">
                    Open
                  </button>
                  <button className="mini" data-navgo="workspace">
                    Open EMR
                  </button>
                </div>
              </div>
              <div className="softbox">
                <div className="row">
                  <div style={{ fontWeight: 1000 }}>Suhey Chavez</div>
                  <div className="spacer"></div>
                  <span className="chip bad blink">Needs update</span>
                </div>
                <div className="hint" style={{ marginTop: "6px" }}>
                  DOB 05/30/1987 | DOI 10/10/2025
                  <br />
                  Last updated: <span className="mono">02/12/2026</span>
                  <br />
                  Facility: Vanguard Imaging
                </div>
                <div className="actions-row">
                  <button className="mini primary" data-openpatient="p1">
                    Open
                  </button>
                  <button className="mini" data-navgo="workspace">
                    Open EMR
                  </button>
                </div>
              </div>
              <div className="softbox">
                <div className="row">
                  <div style={{ fontWeight: 1000 }}>Kim Holmes</div>
                  <div className="spacer"></div>
                  <span className="chip bad blink">Needs update</span>
                </div>
                <div className="hint" style={{ marginTop: "6px" }}>
                  DOB 01/15/1966 | DOI 09/26/2025
                  <br />
                  Last updated: <span className="mono">10/02/2025</span>
                  <br />
                  Facility: Killeen Therapy
                </div>
                <div className="actions-row">
                  <button className="mini primary" data-openpatient="p1">
                    Open
                  </button>
                  <button className="mini" data-navgo="workspace">
                    Open EMR
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
