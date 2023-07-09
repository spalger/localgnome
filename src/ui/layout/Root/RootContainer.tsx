import { Outlet, Link } from "react-router-dom";

export const RootContainer: React.FC = () => {
  return (
    <div>
      <nav className="flex gap-2 p-2">
        <Link to="/">Home</Link>
        <Link to="/settings">Settings</Link>
      </nav>
      <Outlet />
    </div>
  );
};
