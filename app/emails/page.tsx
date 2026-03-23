export const metadata = {
  title: "PI360 - Emails",
  description: "Email communications",
};

export default function DashboardPage() {
  return (
    <section>
      <div className="card">
        <div className="hd">
          <div className="title">Email Templates</div>
          <div className="sub">Search + add (matches screenshots)</div>
          <div className="right">
            <button className="mini primary" id="addEmailTemplateBtn">
              + Add Email Template
            </button>
            <div className="search-mini" style={{ minWidth: "260px" }}>
              🔎 <input id="emailSearch" placeholder="Search templates..." />
            </div>
          </div>
        </div>
        <div className="bd" style={{ padding: 0 }}>
          <table className="table" id="emailTable">
            <thead>
              <tr>
                <th>Super Facility</th>
                <th>From Email</th>
                <th>Type</th>
                <th>Template Name</th>
                <th>Enabled</th>
                <th>Subject</th>
                <th>Additional info</th>
              </tr>
            </thead>
            <tbody id="emailTbody">
              <tr>
                <td>
                  <a href="#" className="expander">
                    Chiropractic / Therapy
                  </a>
                </td>
                <td className="mono">schedule@cic.clinic</td>
                <td>-</td>
                <td className="mono">
                  <a href="#" className="expander">
                    AUTO_TREATMENT_STATUS_REQUEST_FROM_CLINIC
                  </a>
                </td>
                <td>
                  <span className="chip good">Yes</span>
                </td>
                <td>
                  Action Required: Please Update Visits &amp; Current Balances
                </td>
                <td className="muted">
                  Used for sending treatment status info email to clinics
                </td>
              </tr>
              <tr>
                <td>
                  <a href="#" className="expander">
                    Medical Consults
                  </a>
                </td>
                <td className="mono">schedule@cic.clinic</td>
                <td>-</td>
                <td className="mono">
                  <a href="#" className="expander">
                    AUTO_TREATMENT_STATUS_REQUEST_FROM_CLINIC
                  </a>
                </td>
                <td>
                  <span className="chip good">Yes</span>
                </td>
                <td>CIC Active patients treatment status request</td>
                <td className="muted">
                  Used for sending treatment status info email to clinics
                </td>
              </tr>
              <tr>
                <td>
                  <a href="#" className="expander">
                    Pain / Surgery
                  </a>
                </td>
                <td className="mono">schedule@cic.clinic</td>
                <td>-</td>
                <td className="mono">
                  <a href="#" className="expander">
                    AUTO_TREATMENT_STATUS_REQUEST_FROM_CLINIC
                  </a>
                </td>
                <td>
                  <span className="chip good">Yes</span>
                </td>
                <td>CIC Active patients treatment status request</td>
                <td className="muted">
                  Used for sending treatment status info email to clinics
                </td>
              </tr>
              <tr>
                <td>
                  <a href="#" className="expander">
                    Imaging
                  </a>
                </td>
                <td className="mono">schedule@cic.clinic</td>
                <td>-</td>
                <td className="mono">
                  <a href="#" className="expander">
                    AUTO_TREATMENT_STATUS_REQUEST_FROM_CLINIC
                  </a>
                </td>
                <td>
                  <span className="chip good">Yes</span>
                </td>
                <td>CIC Active patients treatment status request</td>
                <td className="muted">
                  Used for sending treatment status info email to clinics
                </td>
              </tr>
              <tr>
                <td>
                  <a href="#" className="expander">
                    Pharmacy
                  </a>
                </td>
                <td className="mono">schedule@cic.clinic</td>
                <td>-</td>
                <td className="mono">
                  <a href="#" className="expander">
                    AUTO_TREATMENT_STATUS_REQUEST_FROM_CLINIC
                  </a>
                </td>
                <td>
                  <span className="chip good">Yes</span>
                </td>
                <td>CIC Active patients treatment status request</td>
                <td className="muted">
                  Used for sending treatment status info email to clinics
                </td>
              </tr>
              <tr>
                <td>
                  <a href="#" className="expander">
                    Neurology
                  </a>
                </td>
                <td className="mono">schedule@cic.clinic</td>
                <td>-</td>
                <td className="mono">
                  <a href="#" className="expander">
                    AUTO_TREATMENT_STATUS_REQUEST_FROM_CLINIC
                  </a>
                </td>
                <td>
                  <span className="chip good">Yes</span>
                </td>
                <td>CIC Active patients treatment status request</td>
                <td className="muted">
                  Used for sending treatment status info email to clinics
                </td>
              </tr>
              <tr>
                <td>
                  <a href="#" className="expander">
                    Orthopedics
                  </a>
                </td>
                <td className="mono">schedule@cic.clinic</td>
                <td>-</td>
                <td className="mono">
                  <a href="#" className="expander">
                    AUTO_TREATMENT_STATUS_REQUEST_FROM_CLINIC
                  </a>
                </td>
                <td>
                  <span className="chip good">Yes</span>
                </td>
                <td>CIC Active patients treatment status request</td>
                <td className="muted">
                  Used for sending treatment status info email to clinics
                </td>
              </tr>
              <tr>
                <td>
                  <a href="#" className="expander">
                    Other
                  </a>
                </td>
                <td className="mono">schedule@cic.clinic</td>
                <td>-</td>
                <td className="mono">
                  <a href="#" className="expander">
                    AUTO_TREATMENT_STATUS_REQUEST_FROM_CLINIC
                  </a>
                </td>
                <td>
                  <span className="chip good">Yes</span>
                </td>
                <td>CIC Active patients treatment status request</td>
                <td className="muted">
                  Used for sending treatment status info email to clinics
                </td>
              </tr>
              <tr>
                <td>
                  <a href="#" className="expander">
                    Chiropractic / Therapy
                  </a>
                </td>
                <td className="mono">schedule@cic.clinic</td>
                <td>Follow Up Template</td>
                <td className="mono">
                  <a href="#" className="expander">
                    REMINDER_TO_SCHEDULE_PATIENT_FOR_TREATMENT
                  </a>
                </td>
                <td>
                  <span className="chip good">Yes</span>
                </td>
                <td>Reminder - Scheduling Needed for Treatment</td>
                <td className="muted">
                  Reminder to facility to schedule patient for treatment
                </td>
              </tr>
              <tr>
                <td>
                  <a href="#" className="expander">
                    Chiropractic / Therapy
                  </a>
                </td>
                <td className="mono">schedule@cic.clinic</td>
                <td>-</td>
                <td className="mono">
                  <a href="#" className="expander">
                    FACILITY_ONBOARDING_NOTIFICATION
                  </a>
                </td>
                <td>
                  <span className="chip good">Yes</span>
                </td>
                <td>
                  Your CIC Affiliate Dashboard Login (Weekly Updates + Payment
                  Status + EMR Access)
                </td>
                <td className="muted">Sends affiliate login credentials</td>
              </tr>
              <tr>
                <td>
                  <a href="#" className="expander">
                    Chiropractic / Therapy
                  </a>
                </td>
                <td className="mono">schedule@cic.clinic</td>
                <td>-</td>
                <td className="mono">
                  <a href="#" className="expander">
                    WEEKLY_REPORT
                  </a>
                </td>
                <td>
                  <span className="chip good">Yes</span>
                </td>
                <td>Complete Injury Centers - Weekly Updates</td>
                <td className="muted">
                  Weekly report to lawyer for active patients
                </td>
              </tr>
              <tr>
                <td>
                  <a href="#" className="expander">
                    Imaging
                  </a>
                </td>
                <td className="mono">schedule@cic.clinic</td>
                <td>-</td>
                <td className="mono">
                  <a href="#" className="expander">
                    WEEKLY_REPORT
                  </a>
                </td>
                <td>
                  <span className="chip good">Yes</span>
                </td>
                <td>Complete Injury Centers - Weekly Updates</td>
                <td className="muted">
                  Weekly report to lawyer for active patients
                </td>
              </tr>
              <tr>
                <td>
                  <a href="#" className="expander">
                    VANGUARD IMAGING
                  </a>
                </td>
                <td className="mono">schedule@cic.clinic</td>
                <td>-</td>
                <td className="mono">
                  <a href="#" className="expander">
                    WEEKLY_REPORT
                  </a>
                </td>
                <td>
                  <span className="chip good">Yes</span>
                </td>
                <td>Complete Injury Centers - Weekly Updates</td>
                <td className="muted">
                  Weekly report to lawyer for active patients
                </td>
              </tr>
            </tbody>
          </table>
          <div className="bd">
            <div className="hint">
              Examples included: AUTO_TREATMENT_STATUS_REQUEST_FROM_CLINIC,
              FACILITY_ONBOARDING_NOTIFICATION, WEEKLY_REPORT.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
