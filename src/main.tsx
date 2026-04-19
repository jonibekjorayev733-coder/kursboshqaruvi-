import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { setupBackendStatusMonitoring } from "./services/api";
import "./index.css";

setupBackendStatusMonitoring();

createRoot(document.getElementById("root")!).render(<App />);
