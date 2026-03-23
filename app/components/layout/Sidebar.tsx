"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getUser } from "@/lib/auth";

interface SidebarProps {
  onLogout?: () => void;
}

export default function Sidebar({ onLogout }: SidebarProps) {
  const path = usePathname();
  const user = getUser();

  const isActive = (route: string) => path.includes(route);

  const getInitials = (username: string) => {
    return username
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
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
      {/* Mobile Close Button */}
      <button
        className="mobile-close-btn"
        onClick={closeMobileSidebar}
        title="Close Menu"
      >
        ✕
      </button>

      {/* Brand */}
      <div className="brandbar">
        <div className="logo"></div>
        <div className="brandtext">
          <div className="t1">CIC PI-360</div>
          <div className="t2">Affiliate + EMR UI</div>
        </div>
      </div>

      {/* Actions */}
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

      {/* Navigation */}
      <nav className="nav">
        <div className="group-label">Core</div>

        <Link
          href="/dashboard"
          className={isActive("dashboard") ? "active" : ""}
          onClick={closeMobileSidebar}
        >
          <div className="ico">🏠</div>
          <div>Dashboard</div>
          <div className="meta">
            <span className="badge blue" id="badgeWork">
              15
            </span>
          </div>
        </Link>

        <Link
          href="/patients"
          className={isActive("patients") ? "active" : ""}
          onClick={closeMobileSidebar}
        >
          <div className="ico">🧑‍⚕️</div>
          <div>Patients</div>
          <div className="meta">
            <span className="badge red" id="badgeNeeds">
              3
            </span>
          </div>
        </Link>

        <Link
          href="/workspace"
          className={isActive("workspace") ? "active" : ""}
          onClick={closeMobileSidebar}
        >
          <div className="ico">🧾</div>
          <div>Patient Workspace</div>
          <div className="meta">
            <span className="badge">EMR</span>
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
          <div className="meta">
            <span className="badge">42</span>
          </div>
        </Link>

        <Link
          href="/emails"
          className={isActive("emails") ? "active" : ""}
          onClick={closeMobileSidebar}
        >
          <div className="ico">✉️</div>
          <div>Email Templates</div>
          <div className="meta">
            <span className="badge">271</span>
          </div>
        </Link>

        <Link
          href="/reports"
          className={isActive("reports") ? "active" : ""}
          onClick={closeMobileSidebar}
        >
          <div className="ico">📄</div>
          <div>Reports</div>
          <div className="meta">
            <span className="badge green">Ready</span>
          </div>
        </Link>

        <div className="group-label">Admin</div>

        <Link
          href="/settings"
          className={isActive("settings") ? "active" : ""}
          onClick={closeMobileSidebar}
        >
          <div className="ico">⚙️</div>
          <div>Settings</div>
          <div className="meta">
            <span className="badge">Beta</span>
          </div>
        </Link>
      </nav>

      {/* Footer */}
      <div className="sidebar-foot">
        <div className="miniuser">{user ? getInitials(user.username) : 'U'}</div>
        <div className="uinfo">
          <div className="n">{user ? user.username : 'User'}</div>
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
