import { useState } from "react";
import { Send, Shield, CheckCircle, Paperclip } from "lucide-react";
import { complaintFormSchema, type ComplaintFormInput } from "../../features/complaints/schema";
import { submitComplaint, type ComplaintRecord } from "../services/complaintsService";
import { useAuth } from "../../features/auth/useAuth";
import {
  InlineStatus,
  PageContainer,
  PageHero,
  PageState,
  SectionBlock,
} from "../components/layout/PagePrimitives";

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
      <div className="min-h-screen bg-slate-50 py-12">
        <PageContainer>
          <PageState
            mode="empty"
            title="Denúncia recebida com sucesso"
            description="Seu relato foi persistido com protocolo oficial e trilha de eventos para acompanhamento."
            className="mb-6"
          />

          <SectionBlock>
            <div className="text-center">
              <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Protocolo</p>
              <p className="font-headline mt-1 text-3xl font-black tracking-tight text-slate-900">
                {submittedComplaint.protocol}
              </p>
              <p className="mt-2 text-sm text-slate-600">Status inicial: {submittedComplaint.status}</p>

              <div className="mt-6 space-y-2 text-sm text-slate-600">
                <p>Registro persistido em banco oficial</p>
                <p>Histórico de eventos e mudanças de status habilitado</p>
                <p>Prazo médio de triagem: 15 dias úteis</p>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Fazer nova denúncia
                </button>
                {auth.isAuthenticated ? (
                  <a
                    href="/minha-conta"
                    className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:border-slate-900 hover:text-slate-900"
                  >
                    Ver minhas denúncias
                  </a>
                ) : null}
              </div>
            </div>
          </SectionBlock>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <PageHero
        title="Canal de Denúncia"
        description="Relate irregularidades com protocolo real, trilha de status e proteção de dados conforme LGPD."
        eyebrow="Canal Oficial"
        icon={Shield}
      />

      <PageContainer className="pt-8">
        <InlineStatus kind="info" className="mb-6">
          Esta denúncia é persistida com auditoria de eventos. Evite incluir dados sensíveis desnecessários.
        </InlineStatus>

        {!auth.isSupabaseEnabled ? (
          <InlineStatus kind="warning" className="mb-6">
            Supabase não configurado no frontend. Defina `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` para registrar denúncias reais.
          </InlineStatus>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-6">
          <SectionBlock title="Identificação (Opcional)">
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Nome Completo</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name ?? ""}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder="Seu nome (opcional)"
                  disabled={formData.anonymous}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">E-mail</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email ?? ""}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-slate-900 focus:outline-none"
                    placeholder="seu@email.com"
                    disabled={formData.anonymous}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Telefone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone ?? ""}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-slate-900 focus:outline-none"
                    placeholder="(00) 00000-0000"
                    disabled={formData.anonymous}
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="anonymous"
                  checked={formData.anonymous}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Quero fazer uma denúncia anônima
              </label>
            </div>
          </SectionBlock>

          <SectionBlock title="Detalhes da Denúncia">
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Categoria *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-slate-900 focus:outline-none"
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
                <label className="mb-2 block text-sm font-semibold text-slate-700">Assunto *</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder="Título resumido da denúncia"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Descrição detalhada *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={8}
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder="Descreva os fatos com datas, locais, valores e evidências."
                />
                <p className="mt-2 text-xs text-slate-500">Mínimo de 50 caracteres.</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Anexos (opcional)</label>
                <label className="flex w-full cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm hover:bg-slate-100">
                  <Paperclip className="h-4 w-4" />
                  <span>
                    {files.length > 0
                      ? `${files.length} arquivo(s) selecionado(s)`
                      : "Selecionar arquivos"}
                  </span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
                    disabled={!auth.isAuthenticated}
                  />
                </label>
                {!auth.isAuthenticated ? (
                  <p className="mt-2 text-xs text-slate-500">Faça login para anexar documentos com trilha de custódia.</p>
                ) : null}
              </div>
            </div>
          </SectionBlock>

          {formError ? <InlineStatus kind="error">{formError}</InlineStatus> : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">* Campos obrigatórios</p>
            <button
              type="submit"
              disabled={!auth.isSupabaseEnabled || submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-8 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Send className="h-4 w-4" />
              {submitting ? "Enviando..." : "Enviar denúncia"}
            </button>
          </div>
        </form>

        <SectionBlock title="Informações Importantes" className="mt-8">
          <ul className="space-y-2 text-sm text-slate-700">
            <li>Denúncias falsas podem configurar crime (Art. 339 do Código Penal).</li>
            <li>Todo status gera evento e histórico de acompanhamento.</li>
            <li>Análise inicial prevista em até 15 dias úteis.</li>
            <li>Denúncias anônimas são aceitas e avaliadas.</li>
          </ul>
        </SectionBlock>
      </PageContainer>
    </div>
  );
}
