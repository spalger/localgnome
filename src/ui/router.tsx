import { createHashRouter } from "react-router-dom";

import { RootContainer } from "./layout/Root/RootContainer";
import { RootErrorBoundary } from "./layout/Root/RootErrorBoundary";

import { ToasterContextProvider, ToasterView } from "./lib/Toaster";
import { HomePage } from "./pages/Home/HomePage";
import { NotFoundPage } from "./pages/NotFound/NotFoundPage";
import { SettingsPage } from "./pages/Settings/SettingsPage";

export const router = createHashRouter(
  [
    {
      ErrorBoundary: RootErrorBoundary,
      children: [
        {
          element: (
            <ToasterContextProvider>
              <RootContainer />
              <ToasterView />
            </ToasterContextProvider>
          ),
          children: [
            {
              index: true,
              element: <HomePage />,
            },
            {
              path: "settings",
              element: <SettingsPage />,
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
  }
);
