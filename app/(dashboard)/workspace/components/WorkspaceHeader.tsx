interface WorkspaceHeaderProps {
  patientName: string;
  patientMeta: string;
  onCloseWorkspace: () => void;
}

export function WorkspaceHeader({
  patientName,
  patientMeta,
  onCloseWorkspace,
}: WorkspaceHeaderProps) {
  return (
    <div className="workspace-header">
      <div className="pn">
        <div className="n" id="wsPatientName">
          {patientName || "Unnamed patient"}
        </div>
        <div className="s" id="wsPatientMeta">
          {patientMeta}
        </div>
      </div>
      <div className="quicklinks">
        <a href="#" title="Medical History Documents">
          🗂 Medical History Docs
        </a>
        <a href="#" title="Referrals">
          🧭 Referrals (2)
        </a>
        <a href="#" title="Ledger">
          📒 Ledger
        </a>
        <a href="#" title="Generate Full Report">
          📊 Generate Full Report
        </a>
        <a href="#" title="Generate Partial Report">
          📄 Generate Partial Report
        </a>
        <a href="#" title="Generate Invoice">
          💳 Generate Invoice
        </a>
        <a href="#" title="Send E-Script">
          💊 Send E-Script
        </a>
        <a href="#" title="Download CMS">
          ⬇ Download CMS
        </a>
      </div>
      <div className="spacer"></div>
      <div className="row">
        <button className="btn secondary" type="button" onClick={onCloseWorkspace}>
          Close Workspace
        </button>
        <button className="btn secondary" id="wsCopyDetails">
          Copy Details
        </button>
        <button className="btn" id="wsSaveAll">
          Save
        </button>
      </div>
    </div>
  );
}
