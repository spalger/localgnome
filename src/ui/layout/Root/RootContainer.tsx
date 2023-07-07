import { Outlet, useMatches } from "react-router-dom";

export const RootContainer: React.FC = () => {
  const matches = useMatches();

  return (
    <div>
      {matches
        .map(
          (m) =>
            m.pathname +
            (Object.keys(m.params).length
              ? ` (${JSON.stringify(m.params)})`
              : ""),
        )
        .join(" > ")}
      <Outlet />
    </div>
  );
};
