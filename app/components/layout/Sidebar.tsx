"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getUser } from "@/lib/auth";
import { useSelectedPatient } from "../SelectedPatientProvider";

interface SidebarProps {
  onLogout?: () => void;
}

export default function Sidebar({ onLogout }: SidebarProps) {
  const path = usePathname();
  const user = getUser();
  const { selectedPatient } = useSelectedPatient();

  const isActive = (route: string) => path.includes(route);

  const getInitials = (username: string) => {
    return username
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  };

  const closeMobileSidebar = () => {
    const sidebar = document.querySelector(".sidebar");
    const overlay = document.querySelector(".sidebar-overlay");
    if (sidebar && overlay) {
      sidebar.classList.remove("mobile-open");
      overlay.classList.remove("open");
    }
  };

  return (
    <aside className="sidebar">
      <button
        className="mobile-close-btn"
        onClick={closeMobileSidebar}
        title="Close Menu"
      >
        ✕
      </button>

      <div className="brandbar">
        <div className="logo"></div>
        <div className="brandtext">
          <div className="t1">CIC PI-360</div>
          <div className="t2">Affiliate + EMR UI</div>
        </div>
      </div>

      <div className="side-actions">
        <button className="pillbtn" onClick={closeMobileSidebar}>
          📝 <span>New Note</span>
        </button>
        <button className="pillbtn" onClick={closeMobileSidebar}>
          🔎 <span>Search</span>
        </button>
        {onLogout && (
          <button
            className="pillbtn text-red-600 hover:text-red-700"
            onClick={onLogout}
          >
            🚪 <span>Logout</span>
          </button>
        )}
      </div>

      <nav className="nav">
        <div className="group-label">Core</div>

        <Link
          href="/dashboard"
          className={isActive("dashboard") ? "active" : ""}
          onClick={closeMobileSidebar}
        >
          <div className="ico">🏠</div>
          <div>Dashboard</div>
        </Link>

        <Link
          href="/patients"
          className={isActive("patients") ? "active" : ""}
          onClick={closeMobileSidebar}
        >
          <div className="ico">🧑‍⚕️</div>
          <div>Patients</div>
        </Link>

        <Link
          href={selectedPatient ? "/workspace" : "/patients"}
          className={isActive("workspace") ? "active" : ""}
          onClick={closeMobileSidebar}
          aria-disabled={!selectedPatient}
          title={selectedPatient ? `Open ${selectedPatient.name}` : "Select a patient first"}
          style={!selectedPatient ? { opacity: 0.6 } : undefined}
        >
          <div className="ico">🧾</div>
          <div>
            <div>Patient Workspace</div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--muted)",
                marginTop: "2px",
              }}
            >
              {selectedPatient ? selectedPatient.name : "Select patient first"}
            </div>
          </div>
        </Link>

        <div className="group-label">Operations</div>

        <Link
          href="/facilities"
          className={isActive("facilities") ? "active" : ""}
          onClick={closeMobileSidebar}
        >
          <div className="ico">🏥</div>
          <div>Facilities</div>
        </Link>

        <Link
          href="/emails"
          className={isActive("emails") ? "active" : ""}
          onClick={closeMobileSidebar}
        >
          <div className="ico">✉️</div>
          <div>Email Templates</div>
        </Link>

        <Link
          href="/reports"
          className={isActive("reports") ? "active" : ""}
          onClick={closeMobileSidebar}
        >
          <div className="ico">📄</div>
          <div>Reports</div>
        </Link>

        <div className="group-label">Admin</div>

        <Link
          href="/settings"
          className={isActive("settings") ? "active" : ""}
          onClick={closeMobileSidebar}
        >
          <div className="ico">⚙️</div>
          <div>Settings</div>
        </Link>
      </nav>

      <div className="sidebar-foot">
        <div className="miniuser">{user ? getInitials(user.username) : "U"}</div>
        <div className="uinfo">
          <div className="n">{user ? user.username : "User"}</div>
          <div className="r">Admin | CIC</div>
        </div>
        <div className="spacer"></div>
        <button className="iconbtn" id="helpBtn" title="Help">
          ❓
        </button>
      </div>
    </aside>
  );
}
