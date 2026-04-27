import LawyerNotificationsPageClient from "../lawyer-notifications/LawyerNotificationsPageClient";

export default function AuthorizationTasksPage() {
  return (
    <LawyerNotificationsPageClient
      taskType={2}
      authorization={1}
      title="Authorization Tasks"
      partyLabel="Lawyer"
      includeAuthorizationStatusOptions
    />
  );
}
