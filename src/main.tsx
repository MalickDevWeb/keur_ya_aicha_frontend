import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { installDomMutationGuard } from "./lib/domMutationGuard";
import "./index.css";

installDomMutationGuard();

createRoot(document.getElementById("root")!).render(<App />);
