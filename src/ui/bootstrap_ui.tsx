import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import "./index.css";
import { router } from "./router";
import { FullPageLoading } from "./components/FullPageLoading";

const div = document.getElementById("root");

if (!div) {
  throw new Error("missing application root div");
}

createRoot(div).render(
  <RouterProvider router={router} fallbackElement={<FullPageLoading />} />
);
