
  import { createRoot } from "react-dom/client";
  import { registerSW } from "virtual:pwa-register";
  import App from "./app/App.tsx";
  import { AppProviders } from "./app/providers/AppProviders.tsx";
  import "./styles/index.css";

  registerSW({ immediate: true });

  createRoot(document.getElementById("root")!).render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
  
