import LawyerNotificationsPageClient from "../lawyer-notifications/LawyerNotificationsPageClient";

export default function RecordRequestsPage() {
  return (
    <LawyerNotificationsPageClient
      taskType={1}
      titleFilter="%Record Request from Back Office%"
      title="Record Requests"
      partyLabel="Lawyer"
    />
  );
}
