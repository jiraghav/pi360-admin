import LawyerNotificationsPageClient from "../lawyer-notifications/LawyerNotificationsPageClient";

export default function AffiliateNotificationsPage() {
  return (
    <LawyerNotificationsPageClient
      taskType={4}
      title="Affiliate Notifications"
      partyLabel="Affiliate"
    />
  );
}
