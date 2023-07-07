import { useRouteError } from "react-router-dom";

import { toError } from "shared/errors";

export const RootErrorBoundary: React.FC = () => {
  const error = useRouteError();

  if (!error) return null;

  return (
    <div className="w-4/5 mx-auto my-12">
      <h1>On no, an error occurred</h1>
      <pre>{toError(error).stack}</pre>
    </div>
  );
};
