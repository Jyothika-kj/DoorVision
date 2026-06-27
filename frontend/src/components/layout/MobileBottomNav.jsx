import { NavLink } from "react-router-dom";
import { menuItems } from "../../constants/menuItems";

function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-outline-variant/40 bg-surface-container-low/95 backdrop-blur-xl md:hidden">
      {menuItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            [
              "flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold uppercase tracking-wide",
              isActive ? "text-primary" : "text-on-surface-variant",
            ].join(" ")
          }
        >
          <span className="material-symbols-outlined text-[22px]">
            {item.icon}
          </span>
          <span>{item.label.split(" ")[0]}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default MobileBottomNav;