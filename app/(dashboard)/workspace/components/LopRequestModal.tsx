import type { ProgressNoteLopModalState } from "@/app/(dashboard)/workspace/types";

interface LopRequestModalProps {
  lopRequestModal: ProgressNoteLopModalState;
  isSendingLopRequest: boolean;
  onClose: () => void;
  onToggleEmail: (email: string, checked: boolean) => void;
  onSend: () => void;
}

export function LopRequestModal({
  lopRequestModal,
  isSendingLopRequest,
  onClose,
  onToggleEmail,
  onSend,
}: LopRequestModalProps) {
  return (
    <div className="modal-backdrop show" role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="workspace-lop-request-modal-title"
      >
        <div className="mhead">
          <div>
            <div className="mtitle" id="workspace-lop-request-modal-title">
              Send LOP Request
            </div>
            <div className="hint">
              Please confirm the emails before sending this LOP request.
            </div>
          </div>
          <div className="right">
            <button className="mini" type="button" disabled={isSendingLopRequest} onClick={onClose}>
              Close
            </button>
          </div>
        </div>
        <div className="mbody">
          {lopRequestModal.emails.length === 0 ? (
            <div className="softbox hint">No emails added by lawyer in LOP.</div>
          ) : (
            <div className="checkgrid">
              {lopRequestModal.emails.map((email) => (
                <label key={`lop-${email}`} className="checkline">
                  <input
                    type="checkbox"
                    checked={lopRequestModal.selectedEmails.includes(email)}
                    onChange={(event) => onToggleEmail(email, event.target.checked)}
                  /> {email}
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="mfoot">
          <button className="mini" type="button" disabled={isSendingLopRequest} onClick={onClose}>
            No
          </button>
          <button
            className="mini primary"
            type="button"
            disabled={isSendingLopRequest || lopRequestModal.selectedEmails.length === 0}
            onClick={onSend}
          >
            {isSendingLopRequest ? "Sending..." : "Yes"}
          </button>
        </div>
      </div>
    </div>
  );
}
