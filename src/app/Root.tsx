import { Suspense } from "react";
import { Outlet } from "react-router";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { AssistantChatWidget } from "./components/AssistantChatWidget";

function PageLoadingFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
        <p className="text-sm text-slate-500">Carregando…</p>
      </div>
    </div>
  );
}

export function Root() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <main className="min-h-[calc(100vh-18rem)]">
        <Suspense fallback={<PageLoadingFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <AssistantChatWidget />
    </div>
  );
}
