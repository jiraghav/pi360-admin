"use client";

import { useEffect, useRef, useState } from "react";
import {
  createPatientAppointment,
  deletePatientAppointment,
  getAppointmentFormOptions,
  getPatientAppointments,
  updatePatientAppointment,
  type AppointmentFormOption,
  type PatientAppointment,
  type RecurringPatientAppointment,
} from "@/lib/appointments";
import type { SelectedWorkspacePatient } from "@/lib/workspace";

interface WorkspaceAppointmentsCardProps {
  selectedPatient: SelectedWorkspacePatient;
}

const appointmentsOpenStorageKey = "pi360.ws.sidebar.appointments.open";

interface AppointmentDraft {
  categoryId: number;
  providerId: number;
  facilityId: number;
  statusCode: string;
  roomNumber: string;
  date: string;
  startTime: string;
  duration: number;
  title: string;
  comments: string;
  allDay: boolean;
  telemedAppointmentNotification: boolean;
  directorTelemed: boolean;
  patientAppointmentNotification: boolean;
  scheduledNotifications: string[];
  repeats: boolean;
  repeatEvery: number;
  repeatUnit: "day" | "week" | "month" | "year";
  repeatDaysOfWeek: string[];
  untilDate: string;
}

interface SearchableSelectProps {
  label: string;
  listId: string;
  value: string;
  placeholder: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  error?: string;
}

const emptyDraft: AppointmentDraft = {
  categoryId: 0,
  providerId: 0,
  facilityId: 0,
  statusCode: "-",
  roomNumber: "",
  date: "",
  startTime: "",
  duration: 60,
  title: "",
  comments: "",
  allDay: false,
  telemedAppointmentNotification: false,
  directorTelemed: false,
  patientAppointmentNotification: false,
  scheduledNotifications: [],
  repeats: false,
  repeatEvery: 1,
  repeatUnit: "day",
  repeatDaysOfWeek: [],
  untilDate: "",
};

function formatAppointmentDateTime(date: string | null, startTime: string | null) {
  if (!date) {
    return "N/A";
  }

  const combinedValue = startTime ? `${date}T${startTime}` : `${date}T00:00:00`;
  const parsed = new Date(combinedValue);

  if (Number.isNaN(parsed.getTime())) {
    return startTime ? `${date} ${startTime}` : date;
  }

  const datePart = new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(parsed);
  const weekdayPart = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
  }).format(parsed);

  if (!startTime) {
    return `${datePart} (${weekdayPart})`;
  }

  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(parsed);

  return `${datePart} - ${timePart} (${weekdayPart})`;
}

function AppointmentEmptyState() {
  return <div className="softbox hint">None</div>;
}

function SearchableSelect({
  label,
  listId,
  value,
  placeholder,
  options,
  onChange,
  error,
}: SearchableSelectProps) {
  return (
    <div className="field">
      <label>{label}</label>
      <input
        list={listId}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && (
        <div className="hint" style={{ marginTop: "6px", color: "var(--bad)" }}>
          {error}
        </div>
      )}
      <datalist id={listId}>
        {options.map((option) => (
          <option key={`${listId}-${option.value}`} value={option.label} />
        ))}
      </datalist>
    </div>
  );
}

function AppointmentListItem({
  appointment,
  canEdit,
  onEdit,
  onDelete,
  isDeleting,
}: {
  appointment: PatientAppointment;
  canEdit: boolean;
  onEdit: (appointment: PatientAppointment) => void;
  onDelete: (appointment: PatientAppointment) => void;
  isDeleting: boolean;
}) {
  const title = formatAppointmentDateTime(appointment.date, appointment.startTime);
  const statusCodeValue = appointment.statusCode?.trim() || "";
  const statusCode = statusCodeValue ? `(${statusCodeValue}) ` : "";
  const rawStatusText = appointment.status || appointment.category || "Office Visit";
  const normalizedStatusText = statusCodeValue && rawStatusText.trim().startsWith(statusCodeValue)
    ? rawStatusText.trim().slice(statusCodeValue.length).trimStart()
    : rawStatusText;
  const status = `${statusCode}${normalizedStatusText}`;
  const location = appointment.facility || null;
  const provider = appointment.provider || "N/A";
  const detailLine = location
    ? `Location: ${location} | Provider: ${provider}`
    : `Provider: ${provider}`;

  return (
    <div className="note">
      <div className="h">
        <div className="t">{title}</div>
        <div className="m">Status: {status}</div>
      </div>
      <div className="p">{detailLine}</div>
      {canEdit && (
        <div className="actions-row" style={{ marginTop: "8px" }}>
          <button
            className="mini"
            type="button"
            disabled={isDeleting}
            onClick={() => onEdit(appointment)}
          >
            Edit
          </button>
          <button
            className="mini bad"
            type="button"
            disabled={isDeleting}
            onClick={() => onDelete(appointment)}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      )}
    </div>
  );
}

function formatShortDate(value: string | null) {
  if (!value) {
    return "N/A";
  }

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(parsed);
}

function RecurringAppointmentSummary({ appointment }: { appointment: RecurringPatientAppointment }) {
  return (
    <div className="softbox">
      <div className="p">
        Appointment Category: <strong>{appointment.category || "Office Visit"}</strong>
      </div>
      <div className="p">Recurrence: {appointment.recurrence || "Recurring"}</div>
      <div className="p">End Date: {formatShortDate(appointment.endDate)}</div>
    </div>
  );
}

function AppointmentSection({
  title,
  appointments,
  loading,
  error,
  canEdit,
  onEdit,
  onDelete,
  deletingAppointmentId,
}: {
  title: string;
  appointments: PatientAppointment[];
  loading: boolean;
  error: string;
  canEdit: boolean;
  onEdit: (appointment: PatientAppointment) => void;
  onDelete: (appointment: PatientAppointment) => void;
  deletingAppointmentId: number | null;
}) {
  return (
    <div>
      <div className="hint" style={{ marginBottom: "8px" }}>
        {title}
      </div>
      {loading ? (
        <div className="softbox hint">Loading appointments...</div>
      ) : error ? (
        <div className="softbox hint">{error}</div>
      ) : appointments.length === 0 ? (
        <AppointmentEmptyState />
      ) : (
        <div className="grid" style={{ gap: "8px" }}>
          {appointments.map((appointment) => (
            <AppointmentListItem
              key={`${title}-${appointment.id}-${appointment.date}-${appointment.startTime}`}
              appointment={appointment}
              canEdit={canEdit}
              onEdit={onEdit}
              onDelete={onDelete}
              isDeleting={deletingAppointmentId === appointment.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RecurringAppointmentSection({
  appointments,
  loading,
  error,
}: {
  appointments: RecurringPatientAppointment[];
  loading: boolean;
  error: string;
}) {
  return (
    <div>
      <div className="hint" style={{ marginBottom: "8px" }}>
        Recurring Appointments
      </div>
      {loading ? (
        <div className="softbox hint">Loading appointments...</div>
      ) : error ? (
        <div className="softbox hint">{error}</div>
      ) : appointments.length === 0 ? (
        <AppointmentEmptyState />
      ) : (
        <div className="grid" style={{ gap: "8px" }}>
          {appointments.map((appointment) => (
            <RecurringAppointmentSummary
              key={`recurring-${appointment.id}`}
              appointment={appointment}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function WorkspaceAppointmentsCard({ selectedPatient }: WorkspaceAppointmentsCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const skipPersistOpenOnceRef = useRef(true);
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [recurringAppointments, setRecurringAppointments] = useState<RecurringPatientAppointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<PatientAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [providers, setProviders] = useState<AppointmentFormOption[]>([]);
  const [categories, setCategories] = useState<AppointmentFormOption[]>([]);
  const [facilities, setFacilities] = useState<AppointmentFormOption[]>([]);
  const [statuses, setStatuses] = useState<{ code: string; name: string }[]>([]);
  const [rooms, setRooms] = useState<AppointmentFormOption[]>([]);
  const [notificationOptions, setNotificationOptions] = useState<{ code: string; name: string }[]>([]);
  const [canManageAppointments, setCanManageAppointments] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [isSavingAppointment, setIsSavingAppointment] = useState(false);
  const [deletingAppointmentId, setDeletingAppointmentId] = useState<number | null>(null);
  const [appointmentActionError, setAppointmentActionError] = useState("");
  const [appointmentFormError, setAppointmentFormError] = useState("");
  const [appointmentFormMessage, setAppointmentFormMessage] = useState("");
  const [showFormValidation, setShowFormValidation] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<number | null>(null);
  const [facilitySearch, setFacilitySearch] = useState("");
  const [providerSearch, setProviderSearch] = useState("");
  const [appointmentDraft, setAppointmentDraft] = useState<AppointmentDraft>(emptyDraft);

  useEffect(() => {
    try {
      const storedValue = window.sessionStorage.getItem(appointmentsOpenStorageKey);
      if (storedValue === "0") {
        queueMicrotask(() => setIsOpen(false));
      }
    } catch {
      // ignore - storage may be unavailable
    }
  }, []);

  useEffect(() => {
    if (skipPersistOpenOnceRef.current) {
      skipPersistOpenOnceRef.current = false;
      return;
    }

    try {
      window.sessionStorage.setItem(appointmentsOpenStorageKey, isOpen ? "1" : "0");
    } catch {
      // ignore - storage may be unavailable
    }
  }, [isOpen]);

  const fetchAppointments = async (isMountedRef?: { current: boolean }) => {
    if (!selectedPatient.pid) {
      if (!isMountedRef || isMountedRef.current) {
        setAppointments([]);
        setRecurringAppointments([]);
        setPastAppointments([]);
        setError("");
      }
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await getPatientAppointments(selectedPatient.pid);
      if (isMountedRef && !isMountedRef.current) {
        return;
      }

      setAppointments(data.appointments);
      setRecurringAppointments(data.recurringAppointments);
      setPastAppointments(data.pastAppointments);
    } catch (fetchError) {
      console.error("Failed to load patient appointments:", fetchError);
      if (!isMountedRef || isMountedRef.current) {
        setAppointments([]);
        setRecurringAppointments([]);
        setPastAppointments([]);
        setError("Unable to load appointments right now.");
      }
    } finally {
      if (!isMountedRef || isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const isMountedRef = { current: true };
    fetchAppointments(isMountedRef);

    return () => {
      isMountedRef.current = false;
    };
  }, [selectedPatient.pid]);

  useEffect(() => {
    let isMounted = true;

    const loadPermissions = async () => {
      if (!selectedPatient.pid) {
        if (isMounted) {
          setCanManageAppointments(false);
        }
        return;
      }

      try {
        const options = await getAppointmentFormOptions(selectedPatient.pid);
        if (!isMounted) {
          return;
        }

        setCanManageAppointments(options.permissions.canAdd);
      } catch (permissionError) {
        console.error("Failed to load appointment permissions:", permissionError);
        if (isMounted) {
          setCanManageAppointments(false);
        }
      }
    };

    loadPermissions();

    return () => {
      isMounted = false;
    };
  }, [selectedPatient.pid]);

  const syncSearchLabels = (
    nextDraft: AppointmentDraft,
    nextProviders: AppointmentFormOption[],
    nextFacilities: AppointmentFormOption[],
  ) => {
    setProviderSearch(nextProviders.find((item) => item.id === nextDraft.providerId)?.name ?? "");
    setFacilitySearch(nextFacilities.find((item) => item.id === nextDraft.facilityId)?.name ?? "");
  };

  const getFallbackAppointmentFormOptions = () => {
    const fallbackFacilityId = selectedPatient.facilityId ?? 1;
    const fallbackFacilityName = selectedPatient.facility ?? "Facility";

    return {
      providers: [{ id: 1, name: "Provider" }],
      categories: [
        { id: 1, name: "Office Visit" },
        { id: 2, name: "Intake" },
        { id: 3, name: "Follow-up" },
        { id: 4, name: "Telemed Visit" },
        { id: 5, name: "PT Session" },
        { id: 6, name: "OT Session" },
        { id: 7, name: "Re-evaluation" },
        { id: 8, name: "Procedure" },
        { id: 9, name: "Discharge" },
      ],
      facilities: [{ id: fallbackFacilityId, name: fallbackFacilityName }],
      statuses: [{ code: "-", name: "Scheduled" }],
      rooms: [] as AppointmentFormOption[],
      notificationOptions: [] as { code: string; name: string }[],
      patient: {
        name: selectedPatient.name || null,
        homePhone: null,
      },
      permissions: {
        canAdd: true,
      },
      defaults: {
        providerId: 1,
        facilityId: fallbackFacilityId,
        categoryId: 1,
        duration: 60,
        statusCode: "-",
        allDay: false,
        scheduledNotifications: [] as string[],
      },
    };
  };

  const loadModalOptions = async (
    draftBuilder?: (options: Awaited<ReturnType<typeof getAppointmentFormOptions>>) => AppointmentDraft,
  ) => {
    if (!selectedPatient.pid) {
      setAppointmentFormError("Select a patient with a valid id before managing an appointment.");
      return;
    }

    if (!canManageAppointments) {
      setAppointmentFormError("You do not have permission to manage appointments.");
      return;
    }

    setIsModalOpen(true);
    setModalLoading(true);
    setAppointmentActionError("");
    setAppointmentFormError("");
    setAppointmentFormMessage("");
    setShowFormValidation(false);

    try {
      const options = await getAppointmentFormOptions(selectedPatient.pid);
      setProviders(options.providers);
      setCategories(options.categories);
      setFacilities(options.facilities);
      setStatuses(options.statuses);
      setRooms(options.rooms);
      setNotificationOptions(options.notificationOptions);
      setCanManageAppointments(options.permissions.canAdd);

      const nextDraft = draftBuilder
        ? draftBuilder(options)
        : {
            ...emptyDraft,
            categoryId: options.defaults.categoryId ?? options.categories[0]?.id ?? 0,
            providerId: 0,
            facilityId:
              options.defaults.facilityId ?? selectedPatient.facilityId ?? options.facilities[0]?.id ?? 0,
            statusCode: options.defaults.statusCode ?? "-",
            date: new Date().toISOString().slice(0, 10),
            startTime: "09:00",
            duration: options.defaults.duration || 60,
            title:
              options.categories.find(
                (item) => item.id === (options.defaults.categoryId ?? options.categories[0]?.id ?? 0),
              )?.name ?? "Office Visit",
            allDay: options.defaults.allDay,
            scheduledNotifications: options.defaults.scheduledNotifications,
          };

      setAppointmentDraft(nextDraft);
      syncSearchLabels(nextDraft, options.providers, options.facilities);
    } catch (loadError) {
      console.error("Failed to load appointment form options:", loadError);

      const fallbackOptions = getFallbackAppointmentFormOptions();
      setProviders(fallbackOptions.providers);
      setCategories(fallbackOptions.categories);
      setFacilities(fallbackOptions.facilities);
      setStatuses(fallbackOptions.statuses);
      setRooms(fallbackOptions.rooms);
      setNotificationOptions(fallbackOptions.notificationOptions);
      setCanManageAppointments(fallbackOptions.permissions.canAdd);

      const nextDraft = draftBuilder
        ? draftBuilder(fallbackOptions)
        : {
            ...emptyDraft,
            categoryId: fallbackOptions.defaults.categoryId ?? fallbackOptions.categories[0]?.id ?? 0,
            providerId: 0,
            facilityId:
              fallbackOptions.defaults.facilityId ?? selectedPatient.facilityId ?? fallbackOptions.facilities[0]?.id ?? 0,
            statusCode: fallbackOptions.defaults.statusCode ?? "-",
            date: new Date().toISOString().slice(0, 10),
            startTime: "09:00",
            duration: fallbackOptions.defaults.duration || 60,
            title:
              fallbackOptions.categories.find(
                (item) => item.id === (fallbackOptions.defaults.categoryId ?? fallbackOptions.categories[0]?.id ?? 0),
              )?.name ?? "Office Visit",
            allDay: fallbackOptions.defaults.allDay,
            scheduledNotifications: fallbackOptions.defaults.scheduledNotifications,
          };

      setAppointmentDraft(nextDraft);
      syncSearchLabels(nextDraft, fallbackOptions.providers, fallbackOptions.facilities);
      setAppointmentFormMessage("Appointment options could not be loaded; using fallback options.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenAddModal = async () => {
    setEditingAppointmentId(null);
    await loadModalOptions();
  };

  const handleOpenEditModal = async (appointment: PatientAppointment) => {
    setEditingAppointmentId(appointment.id);
    await loadModalOptions((options) => ({
      categoryId: appointment.categoryId ?? options.defaults.categoryId ?? options.categories[0]?.id ?? 0,
      providerId: appointment.providerId ?? options.defaults.providerId ?? options.providers[0]?.id ?? 0,
      facilityId:
        appointment.facilityId ??
        options.defaults.facilityId ??
        selectedPatient.facilityId ??
        options.facilities[0]?.id ??
        0,
      statusCode: appointment.statusCode ?? options.defaults.statusCode ?? "-",
      roomNumber: appointment.roomNumber ?? "",
      date: appointment.date ?? new Date().toISOString().slice(0, 10),
      startTime: (appointment.startTime ?? "09:00:00").slice(0, 5),
      duration: appointment.duration ?? options.defaults.duration ?? 60,
      title: appointment.title ?? appointment.category ?? "Office Visit",
      comments: appointment.comments ?? "",
      allDay: appointment.allDay,
      telemedAppointmentNotification: appointment.telemedAppointmentNotification,
      directorTelemed: appointment.directorTelemed,
      patientAppointmentNotification: appointment.patientAppointmentNotification,
      scheduledNotifications: appointment.scheduledNotifications,
      repeats: appointment.repeats,
      repeatEvery: appointment.repeatEvery || 1,
      repeatUnit: appointment.repeatUnit || "day",
      repeatDaysOfWeek: appointment.repeatDaysOfWeek,
      untilDate: appointment.untilDate ?? "",
    }));
  };

  const handleSaveAppointment = async () => {
    if (!canManageAppointments) {
      setAppointmentFormError("You do not have permission to manage appointments.");
      return;
    }

    if (!selectedPatient.pid) {
      setAppointmentFormError("Select a patient with a valid id before managing an appointment.");
      return;
    }

    setShowFormValidation(true);

    const isStartTimeRequired = !appointmentDraft.allDay;

    if (!appointmentDraft.providerId) return;
    if (!appointmentDraft.facilityId) return;
    if (!appointmentDraft.categoryId) return;
    if (!appointmentDraft.date) return;
    if (isStartTimeRequired && !appointmentDraft.startTime) return;

    setIsSavingAppointment(true);
    setAppointmentActionError("");
    setAppointmentFormError("");
    setAppointmentFormMessage("");

    try {
      const payload = {
        pid: selectedPatient.pid,
        categoryId: appointmentDraft.categoryId,
        providerId: appointmentDraft.providerId,
        facilityId: appointmentDraft.facilityId,
        date: appointmentDraft.date,
        startTime: appointmentDraft.startTime,
        duration: appointmentDraft.duration,
        title: appointmentDraft.title.trim() || "Office Visit",
        statusCode: appointmentDraft.statusCode,
        roomNumber: appointmentDraft.roomNumber.trim() || undefined,
        comments: appointmentDraft.comments.trim() || undefined,
        allDay: appointmentDraft.allDay,
        telemedAppointmentNotification: appointmentDraft.telemedAppointmentNotification,
        directorTelemed: appointmentDraft.directorTelemed,
        patientAppointmentNotification: appointmentDraft.patientAppointmentNotification,
        scheduledNotifications: appointmentDraft.scheduledNotifications,
        repeats: appointmentDraft.repeats,
        repeatEvery: appointmentDraft.repeatEvery,
        repeatUnit: appointmentDraft.repeatUnit,
        repeatDaysOfWeek: appointmentDraft.repeatDaysOfWeek,
        untilDate: appointmentDraft.untilDate || undefined,
      };

      const result = editingAppointmentId
        ? await updatePatientAppointment({ appointmentId: editingAppointmentId, ...payload })
        : await createPatientAppointment(payload);

      await fetchAppointments();
      setIsModalOpen(false);
      setEditingAppointmentId(null);
      setAppointmentDraft(emptyDraft);
      setAppointmentFormMessage(result.message);
    } catch (saveError) {
      console.error("Failed to save appointment:", saveError);
      setAppointmentFormError(
        editingAppointmentId
          ? "Unable to update the appointment right now."
          : "Unable to create the appointment right now.",
      );
    } finally {
      setIsSavingAppointment(false);
    }
  };

  const handleDeleteAppointment = async (appointment: {
    id: number;
    date: string | null;
    startTime: string | null;
  }) => {
    if (!canManageAppointments) {
      setAppointmentFormError("You do not have permission to manage appointments.");
      return;
    }

    if (!selectedPatient.pid) {
      setAppointmentFormError("Select a patient with a valid id before managing an appointment.");
      return;
    }

    if (!appointment.id) {
      setAppointmentFormError("Select a valid appointment to delete.");
      return;
    }

    const appointmentLabel = formatAppointmentDateTime(appointment.date, appointment.startTime);
    const confirmed = window.confirm(
      `Delete this appointment (${appointmentLabel})? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingAppointmentId(appointment.id);
    setAppointmentActionError("");
    setAppointmentFormError("");
    setAppointmentFormMessage("");

    try {
      const result = await deletePatientAppointment({
        appointmentId: appointment.id,
        pid: selectedPatient.pid,
      });

      await fetchAppointments();

      if (editingAppointmentId === appointment.id) {
        setIsModalOpen(false);
        setEditingAppointmentId(null);
        setAppointmentDraft(emptyDraft);
      }

      setAppointmentActionError("");
      setAppointmentFormMessage(result.message);
    } catch (deleteError) {
      console.error("Failed to delete appointment:", deleteError);
      setAppointmentActionError("Unable to delete the appointment right now.");
    } finally {
      setDeletingAppointmentId(null);
    }
  };

  const handleFacilitySearchChange = (value: string) => {
    setFacilitySearch(value);

    if (!value.trim()) {
      setAppointmentDraft((current) => ({
        ...current,
        facilityId: 0,
      }));
      return;
    }

    const matchedFacility = facilities.find(
      (option) => option.name.trim().toLowerCase() === value.trim().toLowerCase(),
    );

    if (!matchedFacility) {
      setAppointmentDraft((current) => ({
        ...current,
        facilityId: 0,
      }));
      return;
    }

    setAppointmentDraft((current) => ({
      ...current,
      facilityId: matchedFacility.id,
    }));
  };

  const handleProviderSearchChange = (value: string) => {
    setProviderSearch(value);

    if (!value.trim()) {
      setAppointmentDraft((current) => ({
        ...current,
        providerId: 0,
      }));
      return;
    }

    const matchedProvider = providers.find(
      (option) => option.name.trim().toLowerCase() === value.trim().toLowerCase(),
    );

    if (!matchedProvider) {
      setAppointmentDraft((current) => ({
        ...current,
        providerId: 0,
      }));
      return;
    }

    setAppointmentDraft((current) => ({
      ...current,
      providerId: matchedProvider.id,
    }));
  };

  return (
    <>
      <div className="card">
        <div className="hd">
          <div className="title">Appointments</div>
          <div className="sub">{isOpen ? "(expanded)" : "(collapsed)"}</div>
          <div className="right">
            {canManageAppointments && (
              <button className="mini primary" type="button" onClick={handleOpenAddModal}>
                Add
              </button>
            )}
            <button className="mini" type="button" onClick={() => setIsOpen((current) => !current)}>
              {isOpen ? "Collapse" : "Expand"}
            </button>
          </div>
        </div>
        {isOpen && (
          <div className="bd grid">
            {appointmentFormMessage && <div className="hint">{appointmentFormMessage}</div>}
            {appointmentActionError && (
              <div className="hint" style={{ color: "var(--bad)" }}>
                {appointmentActionError}
              </div>
            )}
            {!canManageAppointments && (
              <div className="hint">Appointment management is unavailable for this role.</div>
            )}
            <AppointmentSection
              title="Appointments"
              appointments={appointments}
              loading={loading}
              error={error}
              canEdit={canManageAppointments}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteAppointment}
              deletingAppointmentId={deletingAppointmentId}
            />
            <RecurringAppointmentSection
              appointments={recurringAppointments}
              loading={loading}
              error={error}
            />
            <AppointmentSection
              title="Past Appointments"
              appointments={pastAppointments}
              loading={loading}
              error={error}
              canEdit={canManageAppointments}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteAppointment}
              deletingAppointmentId={deletingAppointmentId}
            />
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-backdrop show" role="presentation">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="workspace-appointment-modal-title"
          >
            <div className="mhead">
              <div>
                <div className="mtitle" id="workspace-appointment-modal-title">
                  {editingAppointmentId ? "Edit Appointment" : "Add Appointment"}
                </div>
                <div className="hint">
                  {editingAppointmentId
                    ? `Update the appointment for ${selectedPatient.name || "this patient"}.`
                    : `Create a new appointment for ${selectedPatient.name || "this patient"}.`}
                </div>
              </div>
              <div className="right">
                <button
                  className="mini"
                  type="button"
                  disabled={isSavingAppointment}
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingAppointmentId(null);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
            <div className="mbody">
              {modalLoading ? (
                <div className="softbox hint">Loading appointment options...</div>
              ) : (
                <div className="grid" style={{ gap: "10px" }}>
                  {appointmentFormError && (
                    <div className="hint" style={{ color: "var(--bad)" }}>
                      {appointmentFormError}
                    </div>
                  )}
                  <div className="softbox">
                    <div style={{ fontWeight: 950 }}>Appointment</div>
                    <div className="sep"></div>
                    <div className="two-col">
                      <div className="field">
                        <label>Category *</label>
                        <select
                          value={appointmentDraft.categoryId}
                          onChange={(event) => {
                            const selectedId = Number(event.target.value);
                            const selectedCategory = categories.find((option) => option.id === selectedId);

                            setAppointmentDraft((current) => {
                              const currentTitle = current.title.trim();
                              const nextCategoryTitle = selectedCategory?.name ?? current.title;
                              const currentCategory = categories.find(
                                (option) => option.id === current.categoryId,
                              );
                              const shouldUpdateTitle =
                                !currentTitle ||
                                (currentCategory?.name && currentTitle === currentCategory.name);

                              return {
                                ...current,
                                categoryId: selectedId,
                                title: shouldUpdateTitle ? nextCategoryTitle : current.title,
                              };
                            });
                          }}
                        >
                          <option value={0} disabled>
                            Select category
                          </option>
                          {categories.map((option) => (
                            <option key={`category-${option.id}`} value={option.id}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                        {showFormValidation && !appointmentDraft.categoryId && (
                          <div className="hint" style={{ marginTop: "6px", color: "var(--bad)" }}>
                            Category is required.
                          </div>
                        )}
                      </div>
                      <div className="field">
                        <label>Title</label>
                        <input
                          value={appointmentDraft.title}
                          onChange={(event) =>
                            setAppointmentDraft((current) => ({
                              ...current,
                              title: event.target.value,
                            }))
                          }
                          placeholder="Appointment title"
                        />
                      </div>
                    </div>
                    <div className="two-col">
                      <div className="field">
                        <label>Date *</label>
                        <input
                          type="date"
                          value={appointmentDraft.date}
                          onChange={(event) =>
                            setAppointmentDraft((current) => ({
                              ...current,
                              date: event.target.value,
                            }))
                          }
                        />
                        {showFormValidation && !appointmentDraft.date && (
                          <div className="hint" style={{ marginTop: "6px", color: "var(--bad)" }}>
                            Date is required.
                          </div>
                        )}
                      </div>
                      <div className="field">
                        <label>Start time{appointmentDraft.allDay ? "" : " *"}</label>
                        <input
                          type="time"
                          value={appointmentDraft.startTime}
                          disabled={appointmentDraft.allDay}
                          onChange={(event) =>
                            setAppointmentDraft((current) => ({
                              ...current,
                              startTime: event.target.value,
                            }))
                          }
                        />
                        {showFormValidation && !appointmentDraft.allDay && !appointmentDraft.startTime && (
                          <div className="hint" style={{ marginTop: "6px", color: "var(--bad)" }}>
                            Start time is required.
                          </div>
                        )}
                      </div>
                      <div className="field">
                        <label>All day event</label>
                        <label className="checkline">
                          <input
                            type="checkbox"
                            checked={appointmentDraft.allDay}
                            onChange={(event) =>
                              setAppointmentDraft((current) => ({
                                ...current,
                                allDay: event.target.checked,
                              }))
                            }
                          /> All day event
                        </label>
                      </div>
                      <div className="field">
                        <label>Duration *</label>
                        <select
                          value={appointmentDraft.duration}
                          onChange={(event) =>
                            setAppointmentDraft((current) => ({
                              ...current,
                              duration: Number(event.target.value),
                            }))
                          }
                        >
                          {[15, 30, 45, 60, 90, 120].map((minutes) => (
                            <option key={`duration-${minutes}`} value={minutes}>
                              {minutes} minutes
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="field">
                      <label>Repeats</label>
                      <label className="checkline">
                        <input
                          type="checkbox"
                          checked={appointmentDraft.repeats}
                          onChange={(event) =>
                            setAppointmentDraft((current) => ({
                              ...current,
                              repeats: event.target.checked,
                            }))
                          }
                        /> Repeats
                      </label>
                    </div>
                    {appointmentDraft.repeats && (
                      <>
                        <div className="two-col">
                          <div className="field">
                            <label>Repeat every</label>
                            <div className="row">
                              <input
                                type="number"
                                min={1}
                                value={appointmentDraft.repeatEvery}
                                onChange={(event) =>
                                  setAppointmentDraft((current) => ({
                                    ...current,
                                    repeatEvery: Math.max(1, Number(event.target.value) || 1),
                                  }))
                                }
                              />
                              <select
                                value={appointmentDraft.repeatUnit}
                                onChange={(event) =>
                                  setAppointmentDraft((current) => ({
                                    ...current,
                                    repeatUnit: event.target.value as AppointmentDraft["repeatUnit"],
                                  }))
                                }
                              >
                                <option value="day">day</option>
                                <option value="week">week</option>
                                <option value="month">month</option>
                                <option value="year">year</option>
                              </select>
                            </div>
                          </div>
                          <div className="field">
                            <label>Until date</label>
                            <input
                              type="date"
                              value={appointmentDraft.untilDate}
                              onChange={(event) =>
                                setAppointmentDraft((current) => ({
                                  ...current,
                                  untilDate: event.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                        {appointmentDraft.repeatUnit === "week" && (
                          <div className="field">
                            <label>Days of Week</label>
                            <div className="checkgrid">
                              {[
                                { code: "1", label: "Su" },
                                { code: "2", label: "Mo" },
                                { code: "3", label: "Tu" },
                                { code: "4", label: "We" },
                                { code: "5", label: "Th" },
                                { code: "6", label: "Fr" },
                                { code: "7", label: "Sa" },
                              ].map((day) => (
                                <label key={`repeat-day-${day.code}`} className="checkline">
                                  <input
                                    type="checkbox"
                                    checked={appointmentDraft.repeatDaysOfWeek.includes(day.code)}
                                    onChange={(event) =>
                                      setAppointmentDraft((current) => ({
                                        ...current,
                                        repeatDaysOfWeek: event.target.checked
                                          ? Array.from(new Set([...current.repeatDaysOfWeek, day.code]))
                                          : current.repeatDaysOfWeek.filter((item) => item !== day.code),
                                      }))
                                    }
                                  /> {day.label}
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="softbox">
                    <div style={{ fontWeight: 950 }}>Assignment</div>
                    <div className="sep"></div>
                    <div className="two-col">
                      <SearchableSelect
                        label="Facility *"
                        listId="appointment-facility-options"
                        value={facilitySearch}
                        placeholder="Search facility"
                        options={facilities.map((option) => ({
                          value: String(option.id),
                          label: option.name,
                        }))}
                        onChange={handleFacilitySearchChange}
                        error={
                          showFormValidation && !appointmentDraft.facilityId
                            ? "Facility is required."
                            : ""
                        }
                      />
                      <SearchableSelect
                        label="Provider *"
                        listId="appointment-provider-options"
                        value={providerSearch}
                        placeholder="Search provider"
                        options={providers.map((option) => ({
                          value: String(option.id),
                          label: option.name,
                        }))}
                        onChange={handleProviderSearchChange}
                        error={
                          showFormValidation && !appointmentDraft.providerId
                            ? "Provider is required."
                            : ""
                        }
                      />
                      <div className="field">
                        <label>Status *</label>
                        <select
                          value={appointmentDraft.statusCode}
                          onChange={(event) =>
                            setAppointmentDraft((current) => ({
                              ...current,
                              statusCode: event.target.value,
                            }))
                          }
                        >
                          {statuses.length === 0 && <option value="-">Scheduled</option>}
                          {statuses.map((option) => (
                            <option key={`status-${option.code}`} value={option.code}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="softbox">
                    <div style={{ fontWeight: 950 }}>Notifications</div>
                    <div className="sep"></div>
                    <div className="hint" style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                      <span>Immediate (choose one)</span>
                      <span>Scheduled (up to 3)</span>
                    </div>
                    <div className="checkgrid" style={{ marginTop: "6px", gap: "6px" }}>
                      <label className="checkline">
                        <input
                          type="checkbox"
                          checked={appointmentDraft.telemedAppointmentNotification}
                          onChange={(event) =>
                            setAppointmentDraft((current) => {
                              const nextChecked = event.target.checked;

                              return {
                                ...current,
                                telemedAppointmentNotification: nextChecked,
                                directorTelemed: nextChecked ? false : current.directorTelemed,
                                patientAppointmentNotification: nextChecked
                                  ? false
                                  : current.patientAppointmentNotification,
                              };
                            })
                          }
                        /> Telemed visit appointment notification
                      </label>
                      <label className="checkline">
                        <input
                          type="checkbox"
                          checked={appointmentDraft.directorTelemed}
                          onChange={(event) =>
                            setAppointmentDraft((current) => {
                              const nextChecked = event.target.checked;

                              return {
                                ...current,
                                telemedAppointmentNotification: nextChecked
                                  ? false
                                  : current.telemedAppointmentNotification,
                                directorTelemed: nextChecked,
                                patientAppointmentNotification: nextChecked
                                  ? false
                                  : current.patientAppointmentNotification,
                              };
                            })
                          }
                        /> Director telemed
                      </label>
                      <label className="checkline">
                        <input
                          type="checkbox"
                          checked={appointmentDraft.patientAppointmentNotification}
                          onChange={(event) =>
                            setAppointmentDraft((current) => {
                              const nextChecked = event.target.checked;

                              return {
                                ...current,
                                telemedAppointmentNotification: nextChecked
                                  ? false
                                  : current.telemedAppointmentNotification,
                                directorTelemed: nextChecked ? false : current.directorTelemed,
                                patientAppointmentNotification: nextChecked,
                              };
                            })
                          }
                        /> Patient appointment notification
                      </label>
                    </div>
                    {notificationOptions.length > 0 ? (
                      <div className="checkgrid" style={{ marginTop: "8px", gap: "6px" }}>
                        {(() => {
                          const selectedCount = appointmentDraft.scheduledNotifications.length;
                          const limitReached = selectedCount >= 3;

                          return notificationOptions.map((option) => {
                            const isSelected = appointmentDraft.scheduledNotifications.includes(option.code);
                            const isDisabled = !isSelected && limitReached;

                            return (
                              <label key={`scheduled-notification-${option.code}`} className="checkline">
                                <input
                                  type="checkbox"
                                  disabled={isDisabled}
                                  checked={isSelected}
                                  onChange={(event) =>
                                    setAppointmentDraft((current) => {
                                      const nextSelected = new Set(current.scheduledNotifications);

                                      if (event.target.checked) {
                                        if (nextSelected.size >= 3) {
                                          return current;
                                        }

                                        nextSelected.add(option.code);
                                      } else {
                                        nextSelected.delete(option.code);
                                      }

                                      return {
                                        ...current,
                                        scheduledNotifications: Array.from(nextSelected),
                                      };
                                    })
                                  }
                                /> {option.name}
                              </label>
                            );
                          });
                        })()}
                      </div>
                    ) : (
                      <div className="hint" style={{ marginTop: "8px" }}>
                        No scheduled notification options available.
                      </div>
                    )}
                  </div>

                  <div className="softbox">
                    <div style={{ fontWeight: 950 }}>Notes</div>
                    <div className="sep"></div>
                    <div className="field">
                      <label>Room Number</label>
                      <input
                        list="appointment-room-options"
                        value={appointmentDraft.roomNumber}
                        onChange={(event) =>
                          setAppointmentDraft((current) => ({
                            ...current,
                            roomNumber: event.target.value,
                          }))
                        }
                      />
                      <datalist id="appointment-room-options">
                        {rooms.map((option) => (
                          <option key={`room-${option.id}`} value={option.name} />
                        ))}
                      </datalist>
                    </div>
                    <div className="field">
                      <label>Comments</label>
                      <textarea
                        value={appointmentDraft.comments}
                        onChange={(event) =>
                          setAppointmentDraft((current) => ({
                            ...current,
                            comments: event.target.value,
                          }))
                        }
                        placeholder="Appointment comments"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="mfoot">
              {editingAppointmentId && (
                <button
                  className="mini bad"
                  type="button"
                  disabled={modalLoading || isSavingAppointment || deletingAppointmentId === editingAppointmentId}
                  onClick={() =>
                    handleDeleteAppointment({
                      id: editingAppointmentId,
                      date: appointmentDraft.date || null,
                      startTime: appointmentDraft.startTime || null,
                    })
                  }
                >
                  {deletingAppointmentId === editingAppointmentId ? "Deleting..." : "Delete"}
                </button>
              )}
              <button
                className="mini"
                type="button"
                disabled={isSavingAppointment || deletingAppointmentId !== null}
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingAppointmentId(null);
                }}
              >
                Cancel
              </button>
              <button
                className="mini primary"
                type="button"
                disabled={modalLoading || isSavingAppointment || deletingAppointmentId !== null}
                onClick={handleSaveAppointment}
              >
                {isSavingAppointment
                  ? "Saving..."
                  : editingAppointmentId
                    ? "Update appointment"
                    : "Create appointment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
