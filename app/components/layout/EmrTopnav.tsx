"use client";

import { useState } from "react";

interface EmrTopnavProps {
  onLogout?: () => void;
}

export default function EmrTopnav({ onLogout }: EmrTopnavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="emr-topnav">
      <div className="nav-cluster">
        <div className="nav-item active" onClick={() => setOpen(!open)}>
          Administration
          <span className="caret">▾</span>
        </div>

        <div className="nav-item">Flow Board</div>
        <div className="nav-item">Messages</div>
      </div>

      <div className="nav-cluster">
        <div className="nav-item" data-navgo="reports">
          Reports
        </div>
        <div className="nav-item" data-navgo="misc">
          Miscellaneous
        </div>
        <div className="nav-item" data-navgo="revenue">
          Revenue
        </div>
        <div className="nav-item" data-navgo="about">
          About
        </div>
        {onLogout && (
          <button
            className="nav-item cursor-pointer text-red-600 hover:text-red-700"
            onClick={onLogout}
          >
            Logout
          </button>
        )}
      </div>

      {open && (
        <div className="admin-dd">
          <button className="dd-item">Globals</button>
          <button className="dd-item">Facilities</button>
          <button className="dd-item">Users</button>
          <button className="dd-item">Email Templates</button>
        </div>
      )}
    </div>
  );
}
