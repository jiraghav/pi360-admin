import "./globals.css";
import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import EmrTopnav from "./components/layout/EmrTopnav";
import MobileMenuToggle from "./components/layout/MobileMenuToggle";
import "./globals.css";

export const metadata = {
  title: "PI360 - Dashboard",
  description: "Unified Affiliate + EMR prototype",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=5.0"
        />
      </head>
      <body>
        <div className="app">
          <MobileMenuToggle />
          <Sidebar />

          <main className="main">
            <EmrTopnav />
            <Topbar />

            <div className="content">{children}</div>
          </main>

          <div className="sidebar-overlay" id="sidebarOverlay"></div>
        </div>
      </body>
    </html>
  );
}
