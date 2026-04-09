import { Outlet } from "react-router";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { AssistantChatWidget } from "./components/AssistantChatWidget";

export function Root() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <main className="min-h-[calc(100vh-18rem)]">
        <Outlet />
      </main>
      <Footer />
      <AssistantChatWidget />
    </div>
  );
}
