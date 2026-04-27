import LawyerNotificationsPageClient from "../lawyer-notifications/LawyerNotificationsPageClient";

export default function ReductionSubmissionsPage() {
  return (
    <LawyerNotificationsPageClient
      taskType={1}
      titleFilter="%Lawyer submitted reduction%"
      title="Reduction Submissions"
      partyLabel="Lawyer"
    />
  );
}
