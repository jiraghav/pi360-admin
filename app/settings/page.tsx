export const metadata = {
  title: "PI360 - Settings",
  description: "Configure system settings",
};

export default function DashboardPage() {
  return (
    <section>
      <div className="card">
        <div className="hd">
          <div className="title">Settings</div>
          <div className="sub">
            Prototype controls (saved to browser localStorage)
          </div>
          <div className="right">
            <button className="mini bad" id="resetLocal">
              Reset local data
            </button>
          </div>
        </div>
        <div className="bd">
          <div className="two-col">
            <div className="softbox">
              <div style={{ fontWeight: 950 }}>
                How to validate parity with emr.cic.clinic
              </div>
              <ol className="hint" style={{ margin: "8px 0 0 18px" }}>
                <li>
                  As you browse the live EMR, take screenshots of any missing
                  pages.
                </li>
                <li>
                  Drop them here, and I'll update this prototype view-by-view.
                </li>
                <li>
                  We keep the same components, but simplify the layout and
                  flows.
                </li>
              </ol>
            </div>
            <div className="softbox">
              <div style={{ fontWeight: 950 }}>Data persistence</div>
              <div className="hint" style={{ margin: "6px 0 0 0" }}>
                Notes you create in this prototype can persist locally (in your
                browser) so you can demo the experience without backend wiring.
              </div>
              <div className="actions-row" style={{ margin: "10px 0 0 0" }}>
                <button className="mini primary" id="saveLocal">
                  Save local
                </button>
                <button className="mini" id="loadLocal">
                  Load local
                </button>
              </div>
            </div>
          </div>

          <div className="hr"></div>

          <div className="softbox">
            <div style={{ fontWeight: 950 }}>Developer handoff</div>
            <div className="hint" style={{ margin: "6px 0 0 0" }}>
              This is a single-file UI spec/prototype. Your dev can map each
              section to your actual endpoints: patients list, patient
              workspace, facilities, email templates, notifications, and report
              generation.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
