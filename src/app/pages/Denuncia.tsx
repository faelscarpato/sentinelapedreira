import { useState } from "react";
import { Send, Shield, CheckCircle, AlertCircle } from "lucide-react";

export function Denuncia() {
  const [submitted, setSubmitted] = useState(false);
  const [protocol, setProtocol] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    category: "",
    subject: "",
    description: "",
    anonymous: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Generate protocol
    const newProtocol = `DEN-${Date.now().toString().slice(-8)}`;
    setProtocol(newProtocol);
    setSubmitted(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-mono mb-4">Denúncia Recebida</h1>
            <p className="text-neutral-600 mb-8">
              Sua denúncia foi registrada com sucesso e será analisada pela equipe responsável.
            </p>

            <div className="bg-neutral-50 border border-neutral-200 p-8 mb-8">
              <p className="text-sm font-mono text-neutral-600 mb-2">SEU PROTOCOLO</p>
              <p className="text-3xl font-mono mb-4">{protocol}</p>
              <p className="text-sm text-neutral-600">
                Guarde este número para acompanhar o andamento da sua denúncia
              </p>
            </div>

            <div className="space-y-3 text-sm text-neutral-600 mb-8">
              <p>✓ Denúncia registrada e protocolada</p>
              <p>✓ Você receberá atualizações no e-mail fornecido</p>
              <p>✓ Prazo médio de análise: 15 dias úteis</p>
            </div>

            <button
              onClick={() => {
                setSubmitted(false);
                setFormData({
                  name: "",
                  email: "",
                  phone: "",
                  category: "",
                  subject: "",
                  description: "",
                  anonymous: false,
                });
              }}
              className="px-6 py-3 bg-black text-white font-mono hover:bg-neutral-800 transition-colors"
            >
              FAZER NOVA DENÚNCIA
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-neutral-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 mb-4">
            <Shield className="w-10 h-10" />
            <div>
              <h1 className="text-3xl font-mono">Denúncia Pública</h1>
              <p className="text-neutral-300 mt-2">
                Canal oficial para denúncias relacionadas à gestão pública municipal
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Privacy Notice */}
        <div className="bg-blue-50 border border-blue-200 p-6 mb-8">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-mono mb-2">PRIVACIDADE E PROTEÇÃO DE DADOS</p>
              <p className="mb-2">
                Este canal é destinado a denúncias relacionadas à gestão pública municipal.
                Seus dados serão tratados conforme a LGPD e utilizados exclusivamente para
                análise e acompanhamento da denúncia.
              </p>
              <p className="italic">
                Nota: Esta plataforma não é destinada à coleta de dados pessoais sensíveis.
                Use apenas para questões de interesse público.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info */}
          <div className="border border-neutral-200 p-6">
            <h2 className="font-mono mb-4">IDENTIFICAÇÃO (Opcional)</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-mono text-neutral-700 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-neutral-300 focus:outline-none focus:border-black"
                  placeholder="Seu nome (opcional)"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-mono text-neutral-700 mb-2">
                    E-mail
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 focus:outline-none focus:border-black"
                    placeholder="seu@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-mono text-neutral-700 mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 focus:outline-none focus:border-black"
                    placeholder="(00) 00000-0000"
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

          {/* Complaint Details */}
          <div className="border border-neutral-200 p-6">
            <h2 className="font-mono mb-4">DETALHES DA DENÚNCIA</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-mono text-neutral-700 mb-2">
                  Categoria *
                </label>
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
                <label className="block text-sm font-mono text-neutral-700 mb-2">
                  Assunto *
                </label>
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
                <label className="block text-sm font-mono text-neutral-700 mb-2">
                  Descrição Detalhada *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={8}
                  className="w-full px-4 py-2 border border-neutral-300 focus:outline-none focus:border-black resize-none"
                  placeholder="Descreva os fatos de forma clara e objetiva. Inclua datas, locais, valores e outros detalhes relevantes."
                />
                <p className="text-xs text-neutral-500 mt-2">
                  Mínimo 50 caracteres. Seja específico e forneça o máximo de informações possível.
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-neutral-600">
              * Campos obrigatórios
            </p>
            <button
              type="submit"
              className="px-8 py-3 bg-black text-white font-mono hover:bg-neutral-800 transition-colors flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>ENVIAR DENÚNCIA</span>
            </button>
          </div>
        </form>

        {/* Legal Info */}
        <div className="mt-8 p-6 bg-neutral-50 border border-neutral-200">
          <h3 className="font-mono text-sm mb-3">INFORMAÇÕES IMPORTANTES</h3>
          <ul className="space-y-2 text-sm text-neutral-700">
            <li>• Denúncias falsas podem configurar crime (Art. 339 do Código Penal)</li>
            <li>• O prazo médio de análise é de 15 dias úteis</li>
            <li>• Você receberá atualizações no e-mail fornecido</li>
            <li>• Denúncias anônimas também são analisadas, mas têm menor prioridade</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
