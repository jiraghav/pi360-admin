"use client";

import { useEffect } from "react";

export default function MobileMenuToggle() {
  useEffect(() => {
    const toggleBtn = document.querySelector(".sidebar-toggle");
    const sidebar = document.querySelector(".sidebar");
    const overlay = document.querySelector(".sidebar-overlay");

    if (!toggleBtn || !sidebar || !overlay) return;

    const openSidebar = () => {
      sidebar.classList.add("mobile-open");
      overlay.classList.add("open");
      document.body.style.overflow = "hidden";
    };

    const closeSidebar = () => {
      sidebar.classList.remove("mobile-open");
      overlay.classList.remove("open");
      document.body.style.overflow = "";
    };

    // Toggle button click
    const handleToggle = () => {
      if (sidebar.classList.contains("mobile-open")) {
        closeSidebar();
      } else {
        openSidebar();
      }
    };

    // Overlay click to close
    const handleOverlayClick = () => {
      closeSidebar();
    };

    // Close sidebar when link is clicked
    const handleNavLinkClick = () => {
      closeSidebar();
    };

    toggleBtn.addEventListener("click", handleToggle);
    overlay.addEventListener("click", handleOverlayClick);

    // Add event listeners to all navigation links
    const navLinks = sidebar.querySelectorAll("a, button");
    navLinks.forEach((link) => {
      link.addEventListener("click", handleNavLinkClick);
    });

    return () => {
      toggleBtn.removeEventListener("click", handleToggle);
      overlay.removeEventListener("click", handleOverlayClick);
      navLinks.forEach((link) => {
        link.removeEventListener("click", handleNavLinkClick);
      });
    };
  }, []);

  return (
    <button className="sidebar-toggle" title="Toggle Menu">
      ☰
    </button>
  );
}
