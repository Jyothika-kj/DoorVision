import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import MobileBottomNav from "./MobileBottomNav";

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background text-on-background">
      <Sidebar />
      <Topbar />

      <main className="min-h-screen px-4 pb-24 pt-20 md:ml-64 md:px-8 md:pb-8">
        <div className="mx-auto max-w-[1440px]">
          <Outlet />
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}

export default DashboardLayout;