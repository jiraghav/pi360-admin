"use client";

import { useState } from "react";

export default function EmrTopnav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="emr-topnav">
      <div className="nav-cluster">
        <div
          className="nav-item active"
          onClick={() => setOpen(!open)}
        >
          Administration
          <span className="caret">▾</span>
        </div>

        <div className="nav-item">Flow Board</div>
        <div className="nav-item">Messages</div>
      </div>

      <div className="nav-cluster">
    <div className="nav-item" data-navgo="reports">Reports</div>
    <div className="nav-item" data-navgo="misc">Miscellaneous</div>
    <div className="nav-item" data-navgo="revenue">Revenue</div>
    <div className="nav-item" data-navgo="about">About</div>
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