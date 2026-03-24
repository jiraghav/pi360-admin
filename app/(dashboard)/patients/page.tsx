import PatientsPageClient from "./PatientsPageClient";

export const metadata = {
  title: "PI360 - Patients",
  description: "Manage and view patient records",
};

export default function PatientsPage() {
  return <PatientsPageClient />;
}
