import classNames from "classnames";
import { Outlet, NavLink } from "react-router-dom";

export const RootContainer: React.FC = () => {
  return (
    <div className="font-mono">
      <nav className="flex gap-2 p-2">
        <NavLink
          to="/"
          className={({ isActive }) =>
            classNames("p-2", isActive && "bg-active")
          }
        >
          Home
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            classNames("p-2", isActive && "bg-active")
          }
        >
          Settings
        </NavLink>
      </nav>
      <Outlet />
    </div>
  );
};
