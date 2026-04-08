"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSelectedPatient } from "../SelectedPatientProvider";

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
  const router = useRouter();
  const config = pageConfig[pathname] || pageConfig["/"];
  const { selectedPatient, clearSelectedPatient } = useSelectedPatient();

  const handleCloseWorkspace = () => {
    clearSelectedPatient();
    router.push("/patients");
  };

  return (
    <>
      <div className="topbar">
        <div className="crumb">
          <div className="h">{config.title}</div>
          <div className="s">{config.subtitle}</div>
        </div>

        <div className="searchbar">
          {"\u{1F50E}"} <input placeholder="Search patient, facility, claim, template..." />
        </div>

        <div className="top-actions">
          <Link
            className="btn secondary"
            href={selectedPatient ? "/workspace" : "/patients"}
            aria-disabled={!selectedPatient}
            title={selectedPatient ? `Open ${selectedPatient.name}` : "Select a patient first"}
            style={!selectedPatient ? { opacity: 0.6 } : undefined}
          >
            {"\u{1F9FE}"} <span>{selectedPatient ? "Open EMR" : "Select Patient"}</span>
          </Link>
          <button className="btn">
            {"\u2795"} <span>New Task</span>
          </button>
          <button className="iconbtn">{"\u{1F514}"}</button>
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
          Patient:{" "}
          <strong id="selectedPatientPill">
            {selectedPatient ? selectedPatient.name : "Not selected"}
          </strong>
          {selectedPatient && (
            <button
              type="button"
              onClick={handleCloseWorkspace}
              title="Close patient workspace"
              aria-label="Close patient workspace"
              style={{
                marginLeft: "8px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: 0,
                fontSize: "14px",
                lineHeight: 1,
                color: "inherit",
              }}
            >
              {"\u00D7"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
