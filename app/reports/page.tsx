export const metadata = {
  title: "Pi360 - Reports",
  description: "Generate and view reports",
};

export default function DashboardPage() {
  return (
    <section>
      <div className="grid">
        <div className="card">
          <div className="hd">
            <div className="title">Generate Records / Reports</div>
            <div className="sub">
              Includes recommendations + signature preview (from screenshot)
            </div>
            <div className="right">
              <button className="mini">Generate Invoice</button>
              <button className="mini primary">Generate Full Report</button>
            </div>
          </div>
          <div className="bd">
            <div className="two-col">
              <div className="softbox">
                <div style={{ fontWeight: 950 }}>Recommendations (Today)</div>
                <ul
                  style={{
                    margin: "8px 0 0 18px",
                    color: "var(--muted)",
                    fontWeight: 700,
                    lineHeight: 1.5,
                  }}
                >
                  <li>Continue therapy and at-home therapies.</li>
                  <li>
                    Continue anti-inflammatory option, muscle relaxer option,
                    topical pain creams, and acetaminophen as needed, as
                    tolerated.
                  </li>
                  <li>
                    Follow up after MRI results are received for review and
                    correlation.
                  </li>
                  <li>
                    After MRI results are reviewed, specialty referral may be
                    considered if clinically indicated.
                  </li>
                </ul>
                <div className="hr"></div>
                <div className="hint">
                  UI note: We keep referral language conditional (no automatic
                  referral promises).
                </div>
              </div>

              <div className="softbox">
                <div style={{ fontWeight: 950 }}>
                  Electronic Signature Preview
                </div>
                <div className="hint" style={{ marginTop: "8px" }}>
                  Signature image placeholder (transparent PNG in production)
                </div>
                <div
                  style={{
                    height: "110px",
                    border: "1px dashed rgba(31,36,48,.18)",
                    borderRadius: "14px",
                    background: "rgba(255,255,255,.9)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: "10px",
                  }}
                >
                  <span className="mono" style={{ opacity: ".55" }}>
                    [signature image]
                  </span>
                </div>
                <div style={{ marginTop: "10px", fontWeight: 900 }}>
                  Electronically signed by Dr. Omar Hussain, D.O.
                </div>
                <div className="muted tiny" style={{ fontWeight: 800 }}>
                  Signed on: 03/05/2026
                </div>
              </div>
            </div>

            <div className="hr"></div>
            <div className="softbox">
              <div style={{ fontWeight: 950 }}>Export actions</div>
              <div className="actions-row">
                <button className="mini primary">Download PDF</button>
                <button className="mini">Email to lawyer</button>
                <button className="mini">Store in case documents</button>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="hd">
            <div className="title">
              Email Automation: Treatment + Weekly Updates
            </div>
            <div className="sub">Matches your Email Templates screens</div>
          </div>
          <div className="bd">
            <div className="three-col">
              <div className="softbox">
                <div style={{ fontWeight: 950 }}>Treatment Status Request</div>
                <div className="hint" style={{ marginTop: "6px" }}>
                  Triggered on a schedule per facility (e.g., Every 1 Week on
                  Thursday at 09:00 AM) or "send immediately".
                </div>
                <div className="actions-row">
                  <button className="mini primary">Send immediately</button>
                  <button className="mini">Edit schedule</button>
                </div>
              </div>
              <div className="softbox">
                <div style={{ fontWeight: 950 }}>Weekly Report (to lawyer)</div>
                <div className="hint" style={{ marginTop: "6px" }}>
                  Sends a weekly list of active patients and their status.
                </div>
                <div className="actions-row">
                  <button className="mini primary">Preview weekly email</button>
                  <button className="mini">Send now</button>
                </div>
              </div>
              <div className="softbox">
                <div style={{ fontWeight: 950 }}>Affiliate Onboarding</div>
                <div className="hint" style={{ marginTop: "6px" }}>
                  Sends login credentials and the dashboard link to the
                  affiliate.
                </div>
                <div className="actions-row">
                  <button className="mini primary">
                    Send login to affiliate
                  </button>
                  <button className="mini">View template</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
