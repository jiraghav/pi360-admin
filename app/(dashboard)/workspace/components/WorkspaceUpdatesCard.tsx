import type { RefObject } from "react";
import type {
  PatientProgressNote,
  ProgressNotesListFilters,
  ProgressNotesPagination,
} from "@/lib/progress-notes";
import { formatProgressNoteDate } from "@/app/(dashboard)/workspace/utils";
import { progressNoteTypeLabels } from "@/app/(dashboard)/workspace/types";

interface WorkspaceUpdatesCardProps {
  isOpen: boolean;
  noteFilter: string;
  noteFilterQuery: string;
  notesListFilters: ProgressNotesListFilters;
  progressNotes: PatientProgressNote[];
  notesPagination: ProgressNotesPagination;
  progressNotesLoading: boolean;
  progressNotesError: string;
  isNotesListFiltered: boolean;
  notesListRef: RefObject<HTMLDivElement | null>;
  onToggleOpen: () => void;
  onNoteFilterChange: (value: string) => void;
  onOpenNoteEditor: () => void;
  onResetNotesView: () => void;
  onFiltersChange: (updater: (current: ProgressNotesListFilters) => ProgressNotesListFilters) => void;
  onPageChange: (page: number) => void;
}

export function WorkspaceUpdatesCard({
  isOpen,
  noteFilter,
  noteFilterQuery,
  notesListFilters,
  progressNotes,
  notesPagination,
  progressNotesLoading,
  progressNotesError,
  isNotesListFiltered,
  notesListRef,
  onToggleOpen,
  onNoteFilterChange,
  onOpenNoteEditor,
  onResetNotesView,
  onFiltersChange,
  onPageChange,
}: WorkspaceUpdatesCardProps) {
  return (
    <div className="card">
      <div className="hd">
        <div className="title">📌 Patient Update Section</div>
        <div className="sub">{isOpen ? "(expanded)" : "(collapsed)"}</div>
        <div className="right">
          <button className="mini" type="button" onClick={onToggleOpen}>
            {isOpen ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="bd" id="updatesBody">
          <div className="toolbar" style={{ marginBottom: "10px" }}>
            <div className="search-mini" style={{ minWidth: "240px" }}>
              🔎{" "}
              <input
                id="noteFilter"
                placeholder="Search notes..."
                value={noteFilter}
                onChange={(event) => onNoteFilterChange(event.target.value)}
              />
            </div>
            <button className="mini primary" type="button" onClick={onOpenNoteEditor}>
              Add/Edit
            </button>
            {isNotesListFiltered && (
              <button className="mini" type="button" onClick={onResetNotesView}>
                Clear filters
              </button>
            )}
          </div>
          <div className="checkgrid" style={{ marginBottom: "10px" }}>
            <label className="checkline"><input type="checkbox" checked={notesListFilters.includeUrgent} onChange={(event) => onFiltersChange((current) => ({ ...current, includeUrgent: event.target.checked }))} /> Urgent</label>
            <label className="checkline"><input type="checkbox" checked={notesListFilters.includeImportantToClinic} onChange={(event) => onFiltersChange((current) => ({ ...current, includeImportantToClinic: event.target.checked }))} /> Important - to clinic</label>
            <label className="checkline"><input type="checkbox" checked={notesListFilters.includeNotifyLawyer} onChange={(event) => onFiltersChange((current) => ({ ...current, includeNotifyLawyer: event.target.checked }))} /> Notify Lawyer</label>
            <label className="checkline"><input type="checkbox" checked={notesListFilters.includeNotifyBackOffice} onChange={(event) => onFiltersChange((current) => ({ ...current, includeNotifyBackOffice: event.target.checked }))} /> Notify Back Office</label>
            <label className="checkline"><input type="checkbox" checked={notesListFilters.includeNotifyClinicDirector} onChange={(event) => onFiltersChange((current) => ({ ...current, includeNotifyClinicDirector: event.target.checked }))} /> Notify Clinic Director</label>
            <label className="checkline"><input type="checkbox" checked={notesListFilters.includeAdminOnly} onChange={(event) => onFiltersChange((current) => ({ ...current, includeAdminOnly: event.target.checked, excludeAdminOnly: event.target.checked ? false : current.excludeAdminOnly }))} /> Admin only</label>
            <label className="checkline"><input type="checkbox" checked={notesListFilters.includeFinance} onChange={(event) => onFiltersChange((current) => ({ ...current, includeFinance: event.target.checked }))} /> Finance</label>
            <label className="checkline"><input type="checkbox" checked={notesListFilters.includeBillingNotice} onChange={(event) => onFiltersChange((current) => ({ ...current, includeBillingNotice: event.target.checked }))} /> Billing Notice</label>
            <label className="checkline"><input type="checkbox" checked={notesListFilters.includeWeeklyNoteUpdate} onChange={(event) => onFiltersChange((current) => ({ ...current, includeWeeklyNoteUpdate: event.target.checked }))} /> Weekly Note Update</label>
            <label className="checkline"><input type="checkbox" checked={notesListFilters.includeEmailChain} onChange={(event) => onFiltersChange((current) => ({ ...current, includeEmailChain: event.target.checked }))} /> Email Chain</label>
            <label className="checkline"><input type="checkbox" checked={notesListFilters.includeTreatmentPlan} onChange={(event) => onFiltersChange((current) => ({ ...current, includeTreatmentPlan: event.target.checked }))} /> Treatment Plan</label>
            <label className="checkline"><input type="checkbox" checked={notesListFilters.includeNotifyRecords} onChange={(event) => onFiltersChange((current) => ({ ...current, includeNotifyRecords: event.target.checked }))} /> Notify Records</label>
            <label className="checkline"><input type="checkbox" checked={notesListFilters.includeProfileChanges} onChange={(event) => onFiltersChange((current) => ({ ...current, includeProfileChanges: event.target.checked }))} /> Profile changes</label>
            <label className="checkline"><input type="checkbox" checked={notesListFilters.excludeWeeklyUpdate} onChange={(event) => onFiltersChange((current) => ({ ...current, excludeWeeklyUpdate: event.target.checked }))} /> Exclude Weekly Update</label>
            <label className="checkline"><input type="checkbox" checked={notesListFilters.excludeCaseInfo} onChange={(event) => onFiltersChange((current) => ({ ...current, excludeCaseInfo: event.target.checked }))} /> Exclude Case info</label>
            <label className="checkline"><input type="checkbox" checked={notesListFilters.excludeAdminOnly} onChange={(event) => onFiltersChange((current) => ({ ...current, excludeAdminOnly: event.target.checked, includeAdminOnly: event.target.checked ? false : current.includeAdminOnly }))} /> Exclude Admin Only</label>
          </div>
          <div id="wsNotesList" ref={notesListRef} className="grid" style={{ gap: "10px", maxHeight: "420px", overflowY: "auto", paddingRight: "4px" }}>
            {progressNotesLoading && <div className="softbox hint">Loading progress notes...</div>}
            {!progressNotesLoading && progressNotesError && <div className="softbox hint">{progressNotesError}</div>}
            {!progressNotesLoading && !progressNotesError && progressNotes.length === 0 && (
              <div className="softbox hint">
                {noteFilterQuery ? "No notes match this search." : "No progress notes yet."}
              </div>
            )}
            {progressNotes.map((note) => (
              <div key={note.id} className="note">
                <div className="h">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="t">{note.superFacilityDescription || "N/A"}</div>
                    <div className="m">{note.facilityName || "N/A"}</div>
                  </div>
                  <div style={{ textAlign: "right", alignSelf: "flex-start", marginLeft: "12px", flexShrink: 0 }}>
                    <div className="m">{formatProgressNoteDate(note.date)}</div>
                    <div className="m">By {note.userFullName || note.user || "EMR user"}</div>
                  </div>
                </div>
                <div className="p" style={{ whiteSpace: "pre-wrap" }}>
                  {note.body}
                </div>
                {(note.externalLawyerHasAccess || note.externalAffiliateHasAccess || note.types.length > 0) && (
                  <div className="actions-row" style={{ marginTop: "8px" }}>
                    {note.externalLawyerHasAccess && <span className="chip">Shared With Lawyer</span>}
                    {note.externalAffiliateHasAccess && <span className="chip">Shared With Affiliate</span>}
                    {note.types.map((type) => (
                      <span key={`${note.id}-${type}`} className="chip">
                        {progressNoteTypeLabels[type] ?? `Type ${type}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="row wrap" style={{ marginTop: "10px", gap: "8px" }}>
            <div className="hint">
              Showing {progressNotes.length === 0 ? 0 : (notesPagination.page - 1) * notesPagination.pageSize + 1}
              -
              {Math.min(notesPagination.page * notesPagination.pageSize, notesPagination.totalItems)} of {notesPagination.totalItems}
            </div>
            <div className="spacer" />
            <div className="hint">
              Page {notesPagination.page} of {notesPagination.totalPages}
            </div>
            <button className="mini" type="button" disabled={progressNotesLoading || notesPagination.page <= 1} onClick={() => onPageChange(Math.max(1, notesPagination.page - 1))}>
              Prev
            </button>
            <button className="mini primary" type="button" disabled={progressNotesLoading || notesPagination.page >= notesPagination.totalPages} onClick={() => onPageChange(Math.min(notesPagination.totalPages, notesPagination.page + 1))}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
