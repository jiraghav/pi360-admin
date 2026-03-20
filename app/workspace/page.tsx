export const metadata = {
  title: "Pi360 - Workspace",
  description: "Manage workspace",
};

export default function DashboardPage() {
  return (
    <section>
      <div className="workspace-header">
        <div className="pn">
          <div className="n" id="wsPatientName">
            April Gonzales
          </div>
          <div className="s" id="wsPatientMeta">
            DOB 04/14/1981 | DOI 01/22/2026 | Claim # 044146025 | PIP
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
          <button className="btn secondary" id="wsCopyDetails">
            📋 Copy Details
          </button>
          <button className="btn" id="wsSaveAll">
            💾 Save
          </button>
        </div>
      </div>

      <div className="workspace-grid">
        <div className="grid">
          <div className="card">
            <div className="hd">
              <div className="title">Edit Demographics</div>
              <div className="sub">(collapse)</div>
              <div className="right">
                <button className="mini" data-collapse="#demogBody">
                  Toggle
                </button>
              </div>
            </div>
            <div className="bd" id="demogBody">
              <div className="two-col">
                <div className="field">
                  <label>Name</label>
                  <input value={"April Gonzales"} />
                </div>
                <div className="field">
                  <label>Phone</label>
                  <input value={"(512) 574-1031"} />
                </div>
                <div className="field">
                  <label>DOB</label>
                  <input value={"04/14/1981"} />
                </div>
                <div className="field">
                  <label>DOI</label>
                  <input value={"01/22/2026"} />
                </div>
                <div className="field">
                  <label>Facility</label>
                  <input value={"Marzban Family Chiropractic - Carrollton"} />
                </div>
                <div className="field">
                  <label>Language</label>
                  <input value={"English"} />
                </div>
              </div>
              <div className="hr"></div>
              <div className="hint">
                Quick parity to emr.cic.clinic: Who / Case Team / Contact /
                Insurance / Choices / Employer / Tabs. This prototype keeps
                everything available but reduces clutter.
              </div>
            </div>
          </div>

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
                  🔎 <input id="noteFilter" placeholder="Search notes..." />
                </div>
                <button className="mini primary">Add/Edit</button>
                <button className="mini">View all</button>
                <span className="hint">Filtered</span>
              </div>
              <div
                id="wsNotesList"
                className="grid"
                style={{ gap: "10px" }}
              >
<div className="note">
          <div className="h">
            <div className="t">Pharmacy</div>
            <div className="m">03/05/2026 09:01 AM</div>
          </div>
          <div className="p">Sent patient in case of reminder: REFERRAL_PENDING_REPORT_FROM_FACILITY to cic: OLYMPIA_PHARMACY</div>
        </div>

        <div className="note">
          <div className="h">
            <div className="t">Medical Consults</div>
            <div className="m">03/05/2026 09:00 AM</div>
          </div>
          <div className="p">Sent patient in auto treatment status request to clinic: drmarzban@gmail.com</div>
        </div>

        <div className="note">
          <div className="h">
            <div className="t">Chiropractic / Therapy</div>
            <div className="m">03/02/2026 12:45 PM</div>
          </div>
          <div className="p">Patient: I have to reschedule. I had a death in the family this morning and have to go to Austin. Will text when I get back next week. (Notified Clinic) - Sent to: farshidmarzban1@gmail.com</div>
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
                  <div className="t">02/06/2026 - 01:00 PM (Friday)</div>
                  <div className="m">Status: Office Visit</div>
                </div>
                <div className="p">
                  Location: Marzban Family Chiropractic | Provider: Farshid
                  Marzban
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
                  <input type="checkbox" checked /> Bills and records
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
                  <input value="19485.00" />
                </div>
                <div className="field">
                  <label>Initial visit</label>
                  <input value="02/02/2026" />
                </div>
                <div className="field">
                  <label>Total visits</label>
                  <input value="44" />
                </div>
                <div className="field">
                  <label>Last visit</label>
                  <input value="03/09/2026" />
                </div>
                <div className="field">
                  <label>Next visit</label>
                  <input value="02/16/2026" />
                </div>
                <div className="field">
                  <label>Referrals received</label>
                  <input value="0" />
                </div>
              </div>
              <div className="hr"></div>
              <div className="hint">
                Real data mirror: Balance 19485.00 | Visits 44 | Schedule 1 |
                Referrals sent 0 | Last encounter 03/09/2026
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
                  <div>11/06/2025 - Office Visit</div>
                  <span>Office Visit</span>
                </div>
                <div className="claim-item">
                  <div>12/06/2025 - Office Visit</div>
                  <span>Office Visit</span>
                </div>
                <div className="claim-item">
                  <div>01/06/2026 - Office Visit</div>
                  <span>Office Visit</span>
                </div>
                <div className="claim-item">
                  <div>02/02/2026 - Office Visit</div>
                  <span>Office Visit</span>
                </div>
                <div className="claim-item">
                  <div>02/16/2026 - Office Visit</div>
                  <span>Office Visit</span>
                </div>
                <div className="claim-item">
                  <div>03/05/2026 - Office Visit</div>
                  <span>Office Visit</span>
                </div>
                <div className="claim-item">
                  <div>03/09/2026 - Office Visit</div>
                  <span>Office Visit</span>
                </div>
                <div className="claim-item">
                  <div>03/23/2026 - Office Visit</div>
                  <span>Office Visit</span>
                </div>
                <div className="claim-item">
                  <div>04/06/2026 - Office Visit</div>
                  <span>Office Visit</span>
                </div>
                <div className="claim-item">
                  <div>04/20/2026 - Office Visit</div>
                  <span>Office Visit</span>
                </div>
                <div className="claim-item">
                  <div>05/04/2026 - Office Visit</div>
                  <span>Office Visit</span>
                </div>
                <div className="claim-item">
                  <div>05/18/2026 - Office Visit</div>
                  <span>Office Visit</span>
                </div>
                <div className="claim-item">
                  <div>06/01/2026 - Office Visit</div>
                  <span>Office Visit</span>
                </div>
                <div className="claim-item">
                  <div>06/15/2026 - Office Visit</div>
                  <span>Office Visit</span>
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
                <button className="mini primary">
                  Save & Share with Lawyer
                </button>
                <button className="mini">Save</button>
              </div>
            </div>
            <div className="bd">
              <div className="field">
                <label>Plan</label>
                <textarea id="treatmentPlanText">
                  April Gonzales Claim # 044146025 USAA pip claim phone number
                  8005318722 claim rep Marisa mason. Backed into garage. DOB:
                  4/14/1981 DOI: 1/22/2026 Saw chiro and some terra neuro work.
                  Dr. Morales - will send records. Hips locked 1. Medications
                  reviewed (topical pain creams, ibuprofen, acetaminophen as
                  tolerated) 2. At-home therapies (AHT) and functional neurology
                  therapies (eye movements) 3. Records being sent to
                  records@cic.clinic
                </textarea>
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
                <button className="mini primary">
                  Treatment status request
                </button>
              </div>
            </div>
            <div className="bd">
              <div className="row wrap">
                <div className="field" style={{ minWidth: "220px" }}>
                  <label>Group</label>
                  <select>
                    <option>Super facility</option>
                    <option>Chiropractic / Therapy</option>
                    <option>Imaging</option>
                    <option>Pharmacy</option>
                  </select>
                </div>
                <div className="spacer"></div>
                <button className="mini">
                  Request transport authorization
                </button>
              </div>
              <div className="hr"></div>

              <div className="bill-grid">
                <div className="metric">
                  <div className="k">Transportation cost</div>
                  <div className="v red">$0.00</div>
                </div>
                <div className="metric">
                  <div className="k">Patient balance due</div>
                  <div className="v red">$19,485.00</div>
                </div>
                <div className="metric">
                  <div className="k">Insurance paid</div>
                  <div className="v blue">$0.00</div>
                </div>
                <div className="metric">
                  <div className="k">Cumulative total</div>
                  <div className="v">$19,485.00</div>
                </div>
              </div>

              <div className="hr"></div>
              <div className="hint">
                This card is designed to match the current EMR components but
                presented as readable KPIs.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
