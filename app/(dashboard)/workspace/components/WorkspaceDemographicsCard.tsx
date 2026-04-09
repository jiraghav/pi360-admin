import type { FacilityOption } from "@/lib/facilities";
import type { WorkspaceDemographicsDraft } from "@/app/(dashboard)/workspace/types";

interface WorkspaceDemographicsCardProps {
  isOpen: boolean;
  isSaving: boolean;
  demographicsDraft: WorkspaceDemographicsDraft | null;
  demographicsSaveMessage: string;
  demographicsSaveError: boolean;
  facilities: FacilityOption[];
  facilityError: string;
  onSave: () => void;
  onToggleOpen: () => void;
  onFieldChange: (field: keyof WorkspaceDemographicsDraft, value: string) => void;
  onFacilityChange: (value: string) => void;
}

export function WorkspaceDemographicsCard({
  isOpen,
  isSaving,
  demographicsDraft,
  demographicsSaveMessage,
  demographicsSaveError,
  facilities,
  facilityError,
  onSave,
  onToggleOpen,
  onFieldChange,
  onFacilityChange,
}: WorkspaceDemographicsCardProps) {
  return (
    <>
      <div className="card">
        <div className="hd">
          <div className="title">🪪 Edit Demographics</div>
          <div className="sub">{isOpen ? "(expanded)" : "(collapsed)"}</div>
          <div className="right">
            {isOpen && (
              <button
                className="mini primary"
                type="button"
                disabled={isSaving}
                onClick={onSave}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            )}
            <button className="mini" type="button" onClick={onToggleOpen}>
              {isOpen ? "Collapse" : "Expand"}
            </button>
          </div>
        </div>
        {isOpen && demographicsDraft && (
          <div className="bd" id="demogBody">
            <div className="two-col">
              <div className="field">
                <label>Name</label>
                <input
                  value={demographicsDraft.name}
                  onChange={(event) => onFieldChange("name", event.target.value)}
                />
              </div>
              <div className="field">
                <label>Phone</label>
                <input
                  value={demographicsDraft.phone}
                  onChange={(event) => onFieldChange("phone", event.target.value)}
                />
              </div>
              <div className="field">
                <label>Email</label>
                <input
                  value={demographicsDraft.email}
                  onChange={(event) => onFieldChange("email", event.target.value)}
                />
              </div>
              <div className="field">
                <label>Facility</label>
                <input
                  list="workspace-facility-options"
                  value={demographicsDraft.facility}
                  onChange={(event) => onFacilityChange(event.target.value)}
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
                  onChange={(event) => onFieldChange("dob", event.target.value)}
                />
              </div>
              <div className="field">
                <label>DOI</label>
                <input
                  type="date"
                  value={demographicsDraft.doi}
                  onChange={(event) => onFieldChange("doi", event.target.value)}
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
    </>
  );
}
