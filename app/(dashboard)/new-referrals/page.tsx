import LawyerNotificationsPageClient from "../lawyer-notifications/LawyerNotificationsPageClient";

export default function NewReferralsPage() {
  return (
    <LawyerNotificationsPageClient
      taskType={1}
      titleFilter="New Referral"
      title="New Referrals"
      partyLabel="Lawyer"
    />
  );
}
