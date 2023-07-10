import { createHashRouter } from "react-router-dom";

import { RootContainer } from "./layout/Root/RootContainer";
import { RootErrorBoundary } from "./layout/Root/RootErrorBoundary";

import { ToasterContextProvider } from "./lib/Toaster";
import { AlertsProvider } from "./lib/Alerts";
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
            <AlertsProvider>
              <ToasterContextProvider>
                <RootContainer />
              </ToasterContextProvider>
            </AlertsProvider>
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
