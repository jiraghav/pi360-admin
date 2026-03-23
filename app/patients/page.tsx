export const metadata = {
  title: "PI360 - Patients",
  description: "Manage and view patient records",
};

export default function DashboardPage() {
  return (
    <section>
      <div className="card">
        <div className="hd">
          <div className="title">Patients</div>
          <div className="sub">
            Collapsed rows (fast) + Expanded view (everything you need)
          </div>
          <div className="right">
            <div
              className="toolbar"
              style={{
                width: "min(820px, 100%)",
                justifyContent: "flex-end",
              }}
            >
              <div className="search-mini">
                🔎{" "}
                <input
                  id="patientSearch"
                  placeholder="Search patient, DOI, facility, status..."
                />
              </div>
              <button className="mini primary" id="addPatientBtn">
                + Add Patient
              </button>
            </div>
          </div>
        </div>
        <div className="bd" style={{ padding: 0 }}>
          <div
            className="patient-row"
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
          <div id="patientList">
            <div className="patient-row" data-pid="p1">
              <div>
                <div className="name">April Gonzales</div>
                <div className="meta">
                  (512) 574-1031 <span className="muted">|</span> Balance:
                  $19485.00
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 900 }}>DOB 04/14/1981</div>
                <div className="meta">DOI 01/22/2026</div>
              </div>
              <div>
                <div style={{ fontWeight: 900 }}>03/05/2026</div>
                <div className="meta">Last visit: 03/09/2026</div>
              </div>
              <div className="hide-md">
                <div style={{ fontWeight: 900 }}>
                  Marzban Family Chiropractic - Carrollton
                </div>
                <div className="meta">Next: 03/23/2026</div>
              </div>
              <div>
                <span className="chip bad blink">Needs update</span>
                <div style={{ marginTop: "6px" }}>
                  <span className="chip good">Active</span>
                </div>
              </div>
              <div className="right inline-actions">
                <span className="expander" data-toggle="p1">
                  Expand
                </span>
                <button className="mini primary" data-openemr="p1">
                  Open EMR
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
