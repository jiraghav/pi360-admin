import { redirect } from "next/navigation";

export default function DashboardHomePage() {
  // Redirect to the main dashboard page
  redirect("/dashboard");
}
