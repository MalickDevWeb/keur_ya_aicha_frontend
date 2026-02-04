import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply persisted theme early to avoid flash
try {
	const persisted = localStorage.getItem('app_theme');
	if (persisted) {
		const root = document.documentElement;
		['theme-orange', 'theme-dark', 'theme-gray', 'theme-clinic', 'dark'].forEach((c) => root.classList.remove(c));
		if (persisted) root.classList.add(persisted);
	}
} catch (e) {
	// ignore
}

createRoot(document.getElementById("root")!).render(<App />);
