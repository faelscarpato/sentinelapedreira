import { AlertTriangle } from "lucide-react";

export function DocumentosFaltantes() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-neutral-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 mb-4">
            <AlertTriangle className="w-10 h-10 text-orange-400" />
            <div>
              <h1 className="text-3xl font-mono">Documentos Faltantes</h1>
              <p className="text-neutral-300 mt-2">
                Seção temporariamente sem dados publicados
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-20 border border-dashed border-neutral-300 bg-neutral-50">
          <AlertTriangle className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-700 font-mono mb-2">
            Nenhum documento listado no momento.
          </p>
          <p className="text-sm text-neutral-500">
            Esta seção ficará em branco até a próxima etapa de implantação.
          </p>
        </div>
      </div>
    </div>
  );
}

