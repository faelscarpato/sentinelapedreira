import { useState } from "react";
import { Send, Shield, CheckCircle, AlertCircle, Paperclip } from "lucide-react";
import { complaintFormSchema, type ComplaintFormInput } from "../../features/complaints/schema";
import { submitComplaint, type ComplaintRecord } from "../services/complaintsService";
import { useAuth } from "../../features/auth/useAuth";

const initialFormState: ComplaintFormInput = {
  name: "",
  email: "",
  phone: "",
  category: "outro",
  subject: "",
  description: "",
  anonymous: false,
};

export function Denuncia() {
  const auth = useAuth();

  const [submittedComplaint, setSubmittedComplaint] = useState<ComplaintRecord | null>(null);
  const [formData, setFormData] = useState<ComplaintFormInput>(initialFormState);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsed = complaintFormSchema.safeParse(formData);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      setFormError(firstIssue?.message ?? "Dados inválidos no formulário de denúncia.");
      return;
    }

    setSubmitting(true);

    try {
      const complaint = await submitComplaint(parsed.data, files, auth.user?.id);
      setSubmittedComplaint(complaint);
      setFormData(initialFormState);
      setFiles([]);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Falha ao registrar denúncia.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleReset = () => {
    setSubmittedComplaint(null);
    setFormData(initialFormState);
    setFiles([]);
    setFormError(null);
  };

  if (submittedComplaint) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-mono mb-4">Denúncia Recebida</h1>
            <p className="text-neutral-600 mb-8">
              Sua denúncia foi registrada com persistência oficial e trilha de status.
            </p>

            <div className="bg-neutral-50 border border-neutral-200 p-8 mb-8">
              <p className="text-sm font-mono text-neutral-600 mb-2">PROTOCOLO</p>
              <p className="text-3xl font-mono mb-4">{submittedComplaint.protocol}</p>
              <p className="text-sm text-neutral-600">Status inicial: {submittedComplaint.status}</p>
            </div>

            <div className="space-y-3 text-sm text-neutral-600 mb-8">
              <p>✓ Registro persistido em banco oficial</p>
              <p>✓ Histórico de eventos e mudanças de status habilitado</p>
              <p>✓ Prazo médio de triagem: 15 dias úteis</p>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-black text-white font-mono hover:bg-neutral-800 transition-colors"
              >
                FAZER NOVA DENÚNCIA
              </button>
              {auth.isAuthenticated && (
                <a
                  href="/minha-conta"
                  className="px-6 py-3 border border-black text-black font-mono hover:bg-black hover:text-white transition-colors"
                >
                  VER MINHAS DENÚNCIAS
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-neutral-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 mb-4">
            <Shield className="w-10 h-10" />
            <div>
              <h1 className="text-3xl font-mono">Denúncia Pública</h1>
              <p className="text-neutral-300 mt-2">
                Canal oficial com protocolo real, status e rastreabilidade de eventos.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-blue-50 border border-blue-200 p-6 mb-8">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-mono mb-2">PRIVACIDADE E PROTEÇÃO DE DADOS</p>
              <p className="mb-2">
                Esta denúncia é persistida com trilha de auditoria. Nunca inclua dados sensíveis sem necessidade.
              </p>
              <p className="italic">
                Para anexar arquivos, faça login. Isso protege integridade e cadeia de custódia dos documentos.
              </p>
            </div>
          </div>
        </div>

        {!auth.isSupabaseEnabled && (
          <div className="border border-orange-300 bg-orange-50 p-4 mb-6 text-sm text-orange-900">
            Supabase não configurado no frontend. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para registrar denúncias reais.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border border-neutral-200 p-6">
            <h2 className="font-mono mb-4">IDENTIFICAÇÃO (Opcional)</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-mono text-neutral-700 mb-2">Nome Completo</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name ?? ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-neutral-300 focus:outline-none focus:border-black"
                  placeholder="Seu nome (opcional)"
                  disabled={formData.anonymous}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-mono text-neutral-700 mb-2">E-mail</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email ?? ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 focus:outline-none focus:border-black"
                    placeholder="seu@email.com"
                    disabled={formData.anonymous}
                  />
                </div>

                <div>
                  <label className="block text-sm font-mono text-neutral-700 mb-2">Telefone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone ?? ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 focus:outline-none focus:border-black"
                    placeholder="(00) 00000-0000"
                    disabled={formData.anonymous}
                  />
                </div>
              </div>

              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  name="anonymous"
                  checked={formData.anonymous}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <span>Quero fazer uma denúncia anônima</span>
              </label>
            </div>
          </div>

          <div className="border border-neutral-200 p-6">
            <h2 className="font-mono mb-4">DETALHES DA DENÚNCIA</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-mono text-neutral-700 mb-2">Categoria *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-neutral-300 focus:outline-none focus:border-black bg-white"
                >
                  <option value="">Selecione uma categoria</option>
                  <option value="licitacao">Licitações e Contratos</option>
                  <option value="obras">Obras Públicas</option>
                  <option value="recursos">Desvio de Recursos</option>
                  <option value="patrimonio">Patrimônio Público</option>
                  <option value="pessoal">Gestão de Pessoal</option>
                  <option value="servicos">Serviços Públicos</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-mono text-neutral-700 mb-2">Assunto *</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-neutral-300 focus:outline-none focus:border-black"
                  placeholder="Título resumido da denúncia"
                />
              </div>

              <div>
                <label className="block text-sm font-mono text-neutral-700 mb-2">Descrição Detalhada *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={8}
                  className="w-full px-4 py-2 border border-neutral-300 focus:outline-none focus:border-black resize-none"
                  placeholder="Descreva os fatos com datas, locais, valores e evidências."
                />
                <p className="text-xs text-neutral-500 mt-2">Mínimo de 50 caracteres.</p>
              </div>

              <div>
                <label className="block text-sm font-mono text-neutral-700 mb-2">Anexos (opcional)</label>
                <label className="w-full border border-dashed border-neutral-300 p-4 flex items-center gap-2 text-sm cursor-pointer hover:bg-neutral-50">
                  <Paperclip className="w-4 h-4" />
                  <span>{files.length > 0 ? `${files.length} arquivo(s) selecionado(s)` : "Selecionar arquivos"}</span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
                    disabled={!auth.isAuthenticated}
                  />
                </label>
                {!auth.isAuthenticated && (
                  <p className="text-xs text-neutral-500 mt-2">Faça login para anexar documentos com trilha de custódia.</p>
                )}
              </div>
            </div>
          </div>

          {formError && (
            <div className="border border-red-300 bg-red-50 p-4 text-sm text-red-900">{formError}</div>
          )}

          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-neutral-600">* Campos obrigatórios</p>
            <button
              type="submit"
              disabled={!auth.isSupabaseEnabled || submitting}
              className="px-8 py-3 bg-black text-white font-mono hover:bg-neutral-800 transition-colors flex items-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? "ENVIANDO..." : "ENVIAR DENÚNCIA"}</span>
            </button>
          </div>
        </form>

        <div className="mt-8 p-6 bg-neutral-50 border border-neutral-200">
          <h3 className="font-mono text-sm mb-3">INFORMAÇÕES IMPORTANTES</h3>
          <ul className="space-y-2 text-sm text-neutral-700">
            <li>• Denúncias falsas podem configurar crime (Art. 339 do Código Penal)</li>
            <li>• Todo status gera evento e histórico de acompanhamento</li>
            <li>• Análise inicial prevista em até 15 dias úteis</li>
            <li>• Denúncias anônimas são aceitas e avaliadas</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
