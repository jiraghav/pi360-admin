"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, logout } from "@/lib/auth";
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
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Loading...</h2>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
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
  );
}
