"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, logout } from "@/lib/auth";
import { SelectedPatientProvider } from "./SelectedPatientProvider";
import Sidebar from "./layout/Sidebar";
import Topbar from "./layout/Topbar";
import EmrTopnav from "./layout/EmrTopnav";
import MobileMenuToggle from "./layout/MobileMenuToggle";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    } else {
      const timeoutId = window.setTimeout(() => {
        setIsLoading(false);
      }, 0);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }
  }, [router]);

  if (isLoading) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "white",
          zIndex: 50,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "#111827",
            }}
          >
            Loading...
          </h2>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <SelectedPatientProvider>
      <div className="app">
        <MobileMenuToggle />
        <Sidebar onLogout={handleLogout} />

        <main className="main">
          <EmrTopnav onLogout={handleLogout} />
          <Topbar />

          <div className="content">{children}</div>
        </main>

        <div className="sidebar-overlay" id="sidebarOverlay"></div>
      </div>
    </SelectedPatientProvider>
  );
}
