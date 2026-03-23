import ProtectedLayout from "../components/ProtectedLayout";

export const metadata = {
  title: "PI360 - Dashboard",
  description: "Unified Affiliate + EMR prototype",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
