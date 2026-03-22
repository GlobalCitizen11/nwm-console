import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ExportPreviewRoute } from "./export/ExportPreviewRoute";
import "./index.css";

const isExportRoute = window.location.pathname.startsWith("/export/");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {isExportRoute ? <ExportPreviewRoute /> : <App />}
  </React.StrictMode>,
);
