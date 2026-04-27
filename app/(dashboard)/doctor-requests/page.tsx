import LawyerNotificationsPageClient from "../lawyer-notifications/LawyerNotificationsPageClient";

export default function DoctorRequestsPage() {
  return (
    <LawyerNotificationsPageClient
      taskType={3}
      title="Doctor Requests"
      partyLabel="Doctor"
      hideMessageType
      hidePartyColumn
    />
  );
}
