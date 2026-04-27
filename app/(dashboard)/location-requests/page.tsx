import LawyerNotificationsPageClient from "../lawyer-notifications/LawyerNotificationsPageClient";

export default function LocationRequestsPage() {
  return (
    <LawyerNotificationsPageClient
      taskType={1}
      titleFilter="New Location Request%"
      title="Location Requests"
      partyLabel="Lawyer"
    />
  );
}
