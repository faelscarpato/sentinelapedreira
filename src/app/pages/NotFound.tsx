import { Link } from "react-router";
import { AlertCircle } from "lucide-react";
import { PageContainer, PageState } from "../components/layout/PagePrimitives";

export function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <PageContainer>
        <div className="mx-auto max-w-2xl">
          <PageState
            mode="error"
            title="Página não encontrada"
            description="A rota solicitada não existe ou foi movida para outro endereço."
          />

          <div className="mt-6 text-center">
            <span className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <AlertCircle className="h-8 w-8" />
            </span>
            <p className="font-headline text-5xl font-black tracking-tight text-slate-900">404</p>
            <Link
              to="/"
              className="mt-5 inline-block rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Voltar para início
            </Link>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
