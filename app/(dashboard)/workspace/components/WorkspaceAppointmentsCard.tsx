"use client";

import { useEffect, useState } from "react";
import {
  getPatientAppointments,
  type PatientAppointment,
  type RecurringPatientAppointment,
} from "@/lib/appointments";
import type { SelectedWorkspacePatient } from "@/lib/workspace";

interface WorkspaceAppointmentsCardProps {
  selectedPatient: SelectedWorkspacePatient;
}

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

function AppointmentListItem({ appointment }: { appointment: PatientAppointment }) {
  const title = formatAppointmentDateTime(appointment.date, appointment.startTime);
  const statusCode = appointment.statusCode ? `(${appointment.statusCode}) ` : "";
  const status = `${statusCode}${appointment.status || appointment.category || "Office Visit"}`;
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

function RecurringAppointmentSummary({
  appointment,
}: {
  appointment: RecurringPatientAppointment;
}) {
  return (
    <div className="softbox">
      <div className="p">Appointment Category: <strong>{appointment.category || "Office Visit"}</strong></div>
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
}: {
  title: string;
  appointments: PatientAppointment[];
  loading: boolean;
  error: string;
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
            <AppointmentListItem key={`${title}-${appointment.id}`} appointment={appointment} />
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

export function WorkspaceAppointmentsCard({
  selectedPatient,
}: WorkspaceAppointmentsCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [recurringAppointments, setRecurringAppointments] = useState<RecurringPatientAppointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<PatientAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchAppointments = async () => {
      if (!selectedPatient.pid) {
        if (isMounted) {
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
        if (!isMounted) {
          return;
        }

        setAppointments(data.appointments);
        setRecurringAppointments(data.recurringAppointments);
        setPastAppointments(data.pastAppointments);
      } catch (fetchError) {
        console.error("Failed to load patient appointments:", fetchError);
        if (isMounted) {
          setAppointments([]);
          setRecurringAppointments([]);
          setPastAppointments([]);
          setError("Unable to load appointments right now.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAppointments();

    return () => {
      isMounted = false;
    };
  }, [selectedPatient.pid]);

  return (
    <div className="card">
      <div className="hd">
        <div className="title">📅 Appointments</div>
        <div className="sub">{isOpen ? "(expanded)" : "(collapsed)"}</div>
        <div className="right">
          <button className="mini primary" type="button">
            Add
          </button>
          <button className="mini" type="button" onClick={() => setIsOpen((current) => !current)}>
            {isOpen ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="bd grid">
          <AppointmentSection
            title="Appointments"
            appointments={appointments}
            loading={loading}
            error={error}
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
          />
        </div>
      )}
    </div>
  );
}
