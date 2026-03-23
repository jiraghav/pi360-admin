export const metadata = {
  title: "PI360 - Facilities",
  description: "Manage facility information",
};

export default function DashboardPage() {
  return (
    <section>
      <div className="card">
        <div className="hd">
          <div className="title">Facilities</div>
          <div className="sub">
            Edit facility modal (matches screenshot sections)
          </div>
          <div className="right">
            <div className="toolbar">
              <div className="search-mini">
                🔎{" "}
                <input
                  id="facilitySearch"
                  placeholder="Search facility name, city, state..."
                />
              </div>
              <button className="mini primary" id="addFacilityBtn">
                + Add Facility
              </button>
            </div>
          </div>
        </div>
        <div className="bd" style={{ padding: 0 }}>
          <table className="table" id="facilityTable">
            <thead>
              <tr>
                <th>Facility</th>
                <th>Category</th>
                <th>City, State</th>
                <th>Phone</th>
                <th>Active</th>
                <th style={{ width: "160px" }}>Actions</th>
              </tr>
            </thead>
            <tbody id="facilityTbody">
              <tr>
                <td>
                  <strong>HQ Chiropractor</strong>
                  <div className="tiny muted">ID: f1</div>
                </td>
                <td>Chiropractic / Therapy</td>
                <td>Odessa, TX</td>
                <td className="mono">(432) 363-8182</td>
                <td>
                  <span className="chip good">Yes</span>
                </td>
                <td>
                  <div className="inline-actions">
                    <button className="mini primary" data-editfacility="f1">
                      Edit
                    </button>
                    <button className="mini" data-mapfacility="f1">
                      Map
                    </button>
                  </div>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Vanguard Imaging</strong>
                  <div className="tiny muted">ID: f2</div>
                </td>
                <td>Imaging</td>
                <td>Dallas, TX</td>
                <td className="mono">(214) 555-0100</td>
                <td>
                  <span className="chip good">Yes</span>
                </td>
                <td>
                  <div className="inline-actions">
                    <button className="mini primary" data-editfacility="f2">
                      Edit
                    </button>
                    <button className="mini" data-mapfacility="f2">
                      Map
                    </button>
                  </div>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Olympia Pharmacy</strong>
                  <div className="tiny muted">ID: f3</div>
                </td>
                <td>Pharmacy</td>
                <td>Plano, TX</td>
                <td className="mono">(469) 555-0121</td>
                <td>
                  <span className="chip good">Yes</span>
                </td>
                <td>
                  <div className="inline-actions">
                    <button className="mini primary" data-editfacility="f3">
                      Edit
                    </button>
                    <button className="mini" data-mapfacility="f3">
                      Map
                    </button>
                  </div>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Texas Pain Rehab</strong>
                  <div className="tiny muted">ID: f4</div>
                </td>
                <td>Pain / Surgery</td>
                <td>Houston, TX</td>
                <td className="mono">(713) 555-0144</td>
                <td>
                  <span className="chip">No</span>
                </td>
                <td>
                  <div className="inline-actions">
                    <button className="mini primary" data-editfacility="f4">
                      Edit
                    </button>
                    <button className="mini" data-mapfacility="f4">
                      Map
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
