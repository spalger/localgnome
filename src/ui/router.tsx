import { createHashRouter } from "react-router-dom";

import { RootContainer } from "./layout/Root/RootContainer";
import { RootErrorBoundary } from "./layout/Root/RootErrorBoundary";

import { HomePage } from "./pages/Home/HomePage";
import { NotFoundPage } from "./pages/NotFound/NotFoundPage";

export const router = createHashRouter(
  [
    {
      ErrorBoundary: RootErrorBoundary,
      children: [
        {
          element: <RootContainer />,
          children: [
            {
              index: true,
              element: <HomePage />,
            },
            {
              path: "*",
              element: <NotFoundPage />,
            },
          ],
        },
      ],
    },
  ],
  {
    future: {
      v7_normalizeFormMethod: true,
    },
  },
);
