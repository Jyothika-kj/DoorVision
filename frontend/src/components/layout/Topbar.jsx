import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const titleMap = {
  "/dashboard": "Command Dashboard",
  "/live-camera": "Main Entrance Control",
  "/cameras": "Camera Setup",
  "/reports": "Occupancy Reports",
  "/settings": "System Settings",
};

function Topbar() {
  const location = useLocation();
  const { user } = useAuth();

  const pageTitle = titleMap[location.pathname] || "DoorVision AI";

  return (
    <header className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-outline-variant/30 bg-surface/60 px-4 backdrop-blur-xl md:left-64 md:px-8">
      <div className="flex items-center">
        <h2 className="mr-6 text-xl font-bold text-primary md:hidden">
          DoorVision AI
        </h2>

        <h2 className="hidden text-base font-semibold text-on-background md:block">
          {pageTitle}
        </h2>
      </div>

      <div className="flex items-center space-x-4">
        {/* <button className="rounded-full p-2 text-on-surface-variant transition hover:bg-surface-variant/50">
          <span className="material-symbols-outlined">notifications</span>
        </button>

        <button className="rounded-full p-2 text-on-surface-variant transition hover:bg-surface-variant/50">
          <span className="material-symbols-outlined">help</span>
        </button> */}

        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-on-background">
            {user?.name || "Admin"}
          </p>
          <p className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
            {user?.role || "ADMIN"}
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant/40 bg-primary-container text-primary">
          <span className="material-symbols-outlined">person</span>
        </div>
      </div>
    </header>
  );
}

export default Topbar;