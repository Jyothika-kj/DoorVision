import { NavLink } from "react-router-dom";
import { menuItems } from "../../constants/menuItems";
import { useAuth } from "../../context/AuthContext";

function Sidebar() {
  const { logout } = useAuth();

  return (
    <nav className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-64 flex-col overflow-y-auto bg-surface-container-low py-8">
      <div className="mb-8 px-6">
        <h1 className="text-3xl font-bold text-primary">DoorVision AI</h1>
        <p className="mt-1 font-mono text-xs uppercase tracking-wider text-on-surface-variant">
          Facility Command
        </p>
      </div>

      <ul className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                [
                  "flex items-center px-6 py-3 text-sm font-semibold uppercase tracking-wider transition-colors duration-200",
                  isActive
                    ? "border-r-4 border-primary bg-primary-container/30 text-primary"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-background",
                ].join(" ")
              }
            >
              <span className="material-symbols-outlined mr-4">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="px-6">
        <button
          onClick={logout}
          className="flex w-full items-center py-3 text-sm font-semibold uppercase tracking-wider text-on-surface-variant transition-colors duration-200 hover:text-error"
        >
          <span className="material-symbols-outlined mr-4">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}

export default Sidebar;