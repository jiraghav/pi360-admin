import "./globals.css";
import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import EmrTopnav from "./components/layout/EmrTopnav";
import "./globals.css";

export const metadata = {
  title: "Pi360 - Dashboard",
  description: "Unified Affiliate + EMR prototype",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <div className="app">
          <Sidebar />

          <main className="main">
            <EmrTopnav />
            <Topbar />

            <div className="content">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
