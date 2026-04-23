import type {
  ProgressNoteEmailSelection,
  ProgressNoteLawyerSelection,
  ProgressNoteTagState,
} from "@/lib/progress-notes";

interface WorkspaceProgressNoteCardProps {
  isOpen: boolean;
  showToggleButton?: boolean;
  secondaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    id?: string;
  };
  progressNoteText: string;
  progressNoteTags: ProgressNoteTagState;
  recipientOptionsLoading: boolean;
  recipientOptionsError: string;
  importantToClinicSelection: ProgressNoteEmailSelection | null;
  notifyLawyerSelection: ProgressNoteLawyerSelection | null;
  progressNotesMessage: string;
  isSavingProgressNote: boolean;
  lopRequestOptionsLoading: boolean;
  isSendingLopRequest: boolean;
  onToggleOpen: () => void;
  onSaveNote: () => void;
  onOpenLopRequestModal: () => void;
  onNoteChange: (value: string) => void;
  onTagChange: (field: keyof ProgressNoteTagState, checked: boolean) => void;
}

export function WorkspaceProgressNoteCard({
  isOpen,
  showToggleButton = true,
  secondaryAction,
  progressNoteText,
  progressNoteTags,
  recipientOptionsLoading,
  recipientOptionsError,
  importantToClinicSelection,
  notifyLawyerSelection,
  progressNotesMessage,
  isSavingProgressNote,
  lopRequestOptionsLoading,
  isSendingLopRequest,
  onToggleOpen,
  onSaveNote,
  onOpenLopRequestModal,
  onNoteChange,
  onTagChange,
}: WorkspaceProgressNoteCardProps) {
  return (
    <div className="card">
      <div className="hd">
        <div className="title">📝 Add Progress Note - Updates Here</div>
        <div className="sub">
          {isOpen ? "(expanded | back office adds too)" : "(collapsed | back office adds too)"}
        </div>
        <div className="right">
          {isOpen && (
            <button
              className="mini primary"
              id="wsSaveNote"
              type="button"
              disabled={isSavingProgressNote}
              onClick={onSaveNote}
            >
              {isSavingProgressNote ? "Saving..." : "Save note"}
            </button>
          )}
          {secondaryAction ? (
            <button
              className="mini"
              id={secondaryAction.id}
              type="button"
              disabled={secondaryAction.disabled}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </button>
          ) : (
            <button
              className="mini"
              id="wsSendLOP"
              type="button"
              disabled={lopRequestOptionsLoading || isSendingLopRequest}
              onClick={onOpenLopRequestModal}
            >
              {lopRequestOptionsLoading
                ? "Loading LOP..."
                : isSendingLopRequest
                  ? "Sending LOP..."
                  : "Send LOP request"}
            </button>
          )}
          {showToggleButton && (
            <button className="mini" type="button" onClick={onToggleOpen}>
              {isOpen ? "Collapse" : "Expand"}
            </button>
          )}
        </div>
      </div>
      {isOpen && (
        <div className="bd">
          <div className="field">
            <label>Note</label>
            <textarea
              id="wsNoteText"
              value={progressNoteText}
              onChange={(event) => onNoteChange(event.target.value)}
              placeholder="Ex: patient missed, patient not answering calls, update on case, etc."
            ></textarea>
          </div>
          <div className="hr"></div>
          <div className="checkgrid">
            <label className="checkline"><input type="checkbox" checked={progressNoteTags.urgent} onChange={(event) => onTagChange("urgent", event.target.checked)} /> Urgent</label>
            <label className="checkline"><input type="checkbox" checked={progressNoteTags.importantToClinic} onChange={(event) => onTagChange("importantToClinic", event.target.checked)} /> Important - to clinic</label>
            <label className="checkline"><input type="checkbox" checked={progressNoteTags.notifyLawyer} onChange={(event) => onTagChange("notifyLawyer", event.target.checked)} /> Notify Lawyer</label>
            <label className="checkline"><input type="checkbox" checked={progressNoteTags.notifyClinicDirector} onChange={(event) => onTagChange("notifyClinicDirector", event.target.checked)} /> Notify Clinic Director</label>
            <label className="checkline"><input type="checkbox" checked={progressNoteTags.notifyBackOffice} onChange={(event) => onTagChange("notifyBackOffice", event.target.checked)} /> Notify Back Office</label>
            <label className="checkline"><input type="checkbox" checked={progressNoteTags.shareToLawyerNotes} onChange={(event) => onTagChange("shareToLawyerNotes", event.target.checked)} /> Share to Lawyer Notes</label>
            <label className="checkline"><input type="checkbox" checked={progressNoteTags.shareToAffiliateNotes} onChange={(event) => onTagChange("shareToAffiliateNotes", event.target.checked)} /> Share to Affiliate Notes</label>
            <label className="checkline"><input type="checkbox" checked={progressNoteTags.adminOnly} onChange={(event) => onTagChange("adminOnly", event.target.checked)} /> Admin only</label>
            <label className="checkline"><input type="checkbox" checked={progressNoteTags.billingNotice} onChange={(event) => onTagChange("billingNotice", event.target.checked)} /> Billing Notice</label>
            <label className="checkline"><input type="checkbox" checked={progressNoteTags.notifyIntake} onChange={(event) => onTagChange("notifyIntake", event.target.checked)} /> Notify Intake</label>
            <label className="checkline"><input type="checkbox" checked={progressNoteTags.notifyRecords} onChange={(event) => onTagChange("notifyRecords", event.target.checked)} /> Notify Records</label>
            <label className="checkline"><input type="checkbox" checked={progressNoteTags.notifyReferrals} onChange={(event) => onTagChange("notifyReferrals", event.target.checked)} /> Notify Referrals</label>
            <label className="checkline"><input type="checkbox" checked={progressNoteTags.addToTreatmentPlan} onChange={(event) => onTagChange("addToTreatmentPlan", event.target.checked)} /> Add to treatment plan</label>
            <label className="checkline"><input type="checkbox" checked={progressNoteTags.finance} onChange={(event) => onTagChange("finance", event.target.checked)} /> Finance</label>
          </div>
          {recipientOptionsLoading && (
            <div className="hint" style={{ marginTop: "10px" }}>
              Loading notification email options...
            </div>
          )}
          {recipientOptionsError && (
            <div className="hint" style={{ marginTop: "10px", color: "var(--bad)" }}>
              {recipientOptionsError}
            </div>
          )}
          {importantToClinicSelection && (
            <div className="hint" style={{ marginTop: "10px" }}>
              Clinic email on save: {importantToClinicSelection.emails.join(", ")}
            </div>
          )}
          {notifyLawyerSelection && (
            <div className="hint" style={{ marginTop: "6px" }}>
              Lawyer email on save: {notifyLawyerSelection.emails.join(", ")}
              {notifyLawyerSelection.updateLawyerPortal ? " | Update lawyer portal" : ""}
            </div>
          )}
          {progressNotesMessage && (
            <div className="hint" style={{ marginTop: "10px" }}>
              {progressNotesMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
