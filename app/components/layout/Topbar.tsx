"use client";

import { usePathname } from "next/navigation";

const pageConfig: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "Dashboard",
    subtitle: "Unified Affiliate + EMR prototype based on your screenshots",
  },
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Unified Affiliate + EMR prototype based on your screenshots",
  },
  "/patients": {
    title: "Patients",
    subtitle: "Collapsed list + expanded patient update + one-click actions",
  },
  "/facilities": {
    title: "Facilities",
    subtitle: "Facility profiles + schedules + permissions + assets",
  },
  "/emails": {
    title: "Emails",
    subtitle:
      "Templates for treatment status requests + weekly reports + onboarding",
  },
  "/reports": {
    title: "Reports",
    subtitle:
      "Generate reports, invoices, and preview recommendations/signature",
  },
  "/settings": {
    title: "Settings",
    subtitle: "Prototype controls + parity checklist",
  },
  "/workspace": {
    title: "Patient Workspace",
    subtitle: "EMR view with the same components, reorganized to be simple",
  },
};

export default function Topbar() {
  const pathname = usePathname();
  const config = pageConfig[pathname] || pageConfig["/"];

  return (
    <>
      <div className="topbar">
        <div className="crumb">
          <div className="h">{config.title}</div>
          <div className="s">{config.subtitle}</div>
        </div>

        <div className="searchbar">
          🔎{" "}
          <input placeholder="Search patient, facility, claim, template..." />
        </div>

        <div className="top-actions">
          <button className="btn secondary">
            🧾 <span>Open EMR</span>
          </button>
          <button className="btn">
            ➕ <span>New Task</span>
          </button>
          <button className="iconbtn">🔔</button>
        </div>
      </div>
      <div className="notif-strip">
        <div className="pill">
          Lawyer Notifications <strong id="lawyerNotif">(0)</strong>
        </div>
        <div className="pill">
          Affiliate Notifications <strong id="affNotif">(0)</strong>
        </div>
        <div className="pill">
          EMR Notifications <strong id="emrNotif">(0)</strong>
        </div>
        <div className="pill">
          Doctor Requests <strong id="docReq">(0)</strong>
        </div>
        <div className="pill">
          Authorization Tasks <strong id="authTasks">(0)</strong>
        </div>
        <div className="spacer"></div>
        <div className="pill" title="Selected patient">
          Patient: <strong id="selectedPatientPill">April Gonzales</strong>
        </div>
      </div>
    </>
  );
}
