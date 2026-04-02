import { Link } from "react-router";
import { AlertCircle } from "lucide-react";

export function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-neutral-100 mb-6">
          <AlertCircle className="w-10 h-10 text-neutral-400" />
        </div>
        <h1 className="text-6xl font-mono mb-4">404</h1>
        <h2 className="text-2xl font-mono mb-4">Página Não Encontrada</h2>
        <p className="text-neutral-600 mb-8 max-w-md mx-auto">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-black text-white font-mono hover:bg-neutral-800 transition-colors"
        >
          VOLTAR PARA INÍCIO
        </Link>
      </div>
    </div>
  );
}
