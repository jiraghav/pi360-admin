import type { ProgressNoteRecipientModalState } from "@/app/(dashboard)/workspace/types";

interface RecipientModalProps {
  recipientModal: ProgressNoteRecipientModalState;
  activeRecipientEmails: string[];
  onCancel: () => void;
  onToggleEmail: (email: string, checked: boolean) => void;
  onToggleFollowEmailChain: (checked: boolean) => void;
  onToggleUpdateLawyerPortal: (checked: boolean) => void;
  onSave: () => void;
}

export function RecipientModal({
  recipientModal,
  activeRecipientEmails,
  onCancel,
  onToggleEmail,
  onToggleFollowEmailChain,
  onToggleUpdateLawyerPortal,
  onSave,
}: RecipientModalProps) {
  return (
    <div className="modal-backdrop show" role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="workspace-note-recipient-modal-title"
      >
        <div className="mhead">
          <div>
            <div className="mtitle" id="workspace-note-recipient-modal-title">
              {recipientModal.type === "importantToClinic" ? "Notify clinic" : "Notify Lawyer"}
            </div>
            <div className="hint">
              Please confirm the emails before this note is saved.
            </div>
          </div>
          <div className="right">
            <button className="mini" type="button" onClick={onCancel}>
              Close
            </button>
          </div>
        </div>
        <div className="mbody">
          {activeRecipientEmails.length === 0 ? (
            <div className="softbox hint">
              {recipientModal.type === "importantToClinic"
                ? "No emails added by clinic."
                : "No emails added by lawyer."}
            </div>
          ) : (
            <>
              <div className="checkgrid">
                {activeRecipientEmails.map((email) => (
                  <label key={`${recipientModal.type}-${email}`} className="checkline">
                    <input
                      type="checkbox"
                      checked={recipientModal.selectedEmails.includes(email)}
                      onChange={(event) => onToggleEmail(email, event.target.checked)}
                    /> {email}
                  </label>
                ))}
              </div>
              <div className="hr"></div>
            </>
          )}

          <div className="checkgrid">
            <label className="checkline">
              <input
                type="checkbox"
                checked={recipientModal.followEmailChain}
                onChange={(event) => onToggleFollowEmailChain(event.target.checked)}
              /> Follow Email Chain
            </label>
            {recipientModal.type === "notifyLawyer" && (
              <label className="checkline">
                <input
                  type="checkbox"
                  checked={recipientModal.updateLawyerPortal}
                  onChange={(event) => onToggleUpdateLawyerPortal(event.target.checked)}
                /> Update lawyer portal
              </label>
            )}
          </div>
        </div>
        <div className="mfoot">
          <button className="mini" type="button" onClick={onCancel}>
            No
          </button>
          <button className="mini primary" type="button" onClick={onSave}>
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}
