import { useState } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const suggestedQuestions = [
  "Qual é a Lei Orçamentária Anual (LOA)?",
  "Como funciona o processo de licitação?",
  "O que é a Lei de Responsabilidade Fiscal?",
  "Onde encontro o Diário Oficial do município?",
  "Quais são os limites de gastos com pessoal?",
  "Como acompanhar projetos de lei em andamento?",
];

const mockResponses: Record<string, string> = {
  "loa": "A **Lei Orçamentária Anual (LOA)** é o instrumento que estima as receitas e fixa as despesas do município para cada exercício financeiro.\n\nDe acordo com a Lei 4.320/64 e a Constituição Federal (Art. 165), a LOA deve:\n\n• Conter previsão de receitas e fixação de despesas\n• Ser compatível com o PPA e a LDO\n• Ser enviada pelo Executivo até 30 de setembro\n• Ser aprovada pela Câmara até 31 de dezembro\n\nVocê pode consultar a LOA atual na seção **Contas Públicas** desta plataforma.",
  
  "licitacao": "O processo de **licitação** é o procedimento administrativo que visa garantir a contratação mais vantajosa para a Administração Pública.\n\n**Lei 14.133/2021 (Nova Lei de Licitações)** estabelece:\n\n• Modalidades: Pregão, Concorrência, Concurso, Leilão, Diálogo Competitivo\n• Princípios: Legalidade, Impessoalidade, Moralidade, Publicidade, Eficiência\n• Critérios de julgamento: Menor preço, Melhor técnica, etc.\n\nTodos os editais e processos licitatórios devem ser publicados no Diário Oficial e no portal de transparência.",
  
  "lrf": "A **Lei de Responsabilidade Fiscal (LC 101/2000)** estabelece normas de finanças públicas voltadas para a responsabilidade na gestão fiscal.\n\n**Principais regras:**\n\n• Limites de gastos com pessoal (54% da RCL para municípios - Poder Executivo)\n• Publicação obrigatória do RREO (bimestral) e RGF (quadrimestral)\n• Controle da dívida pública\n• Metas fiscais e transparência\n\nVocê pode acompanhar o cumprimento da LRF na seção **Contas Públicas** e **Relatórios**.",
  
  "default": "Sou o **Assistente Jurídico Municipal**, uma ferramenta de apoio informativo sobre legislação e documentos públicos municipais.\n\nPosso ajudar com informações sobre:\n\n• Legislação municipal e base legal\n• Documentos públicos e onde encontrá-los\n• Explicações sobre termos técnicos\n• Processos e procedimentos administrativos\n\n⚠️ **Importante:** Não forneço pareceres jurídicos definitivos. Para questões complexas, consulte um advogado ou órgão oficial.\n\nComo posso ajudar?"
};

export function AssistenteJuridico() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: mockResponses.default
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async (question?: string) => {
    const messageText = question || input;
    if (!messageText.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate response delay
    setTimeout(() => {
      let responseText = mockResponses.default;
      
      const lowerMessage = messageText.toLowerCase();
      if (lowerMessage.includes('loa') || lowerMessage.includes('orçament')) {
        responseText = mockResponses.loa;
      } else if (lowerMessage.includes('licitação') || lowerMessage.includes('licitacao')) {
        responseText = mockResponses.licitacao;
      } else if (lowerMessage.includes('lrf') || lowerMessage.includes('responsabilidade fiscal')) {
        responseText = mockResponses.lrf;
      } else if (lowerMessage.includes('diário') || lowerMessage.includes('diario')) {
        responseText = "Você pode acessar o **Diário Oficial** do município diretamente na seção [Diário Oficial](/diario-oficial) desta plataforma.\n\nAs edições são publicadas diariamente e contêm:\n\n• Leis e decretos municipais\n• Editais de licitação\n• Nomeações e exonerações\n• Contratos administrativos\n• Avisos e publicações oficiais\n\nTodas as edições são indexadas e podem ser consultadas por data.";
      } else if (lowerMessage.includes('pessoal') || lowerMessage.includes('limite')) {
        responseText = "Os **limites de gastos com pessoal** são estabelecidos pela LRF:\n\n**Para o Poder Executivo Municipal:**\n• Limite total: 54% da Receita Corrente Líquida\n• Limite prudencial: 90% do limite (48,6% da RCL)\n• Limite de alerta: 95% do limite (51,3% da RCL)\n\n**Consequências ao ultrapassar o limite prudencial:**\n• Vedada criação de cargo ou função\n• Vedado aumento ou reajuste\n• Vedada contratação de pessoal\n\nVocê pode acompanhar a evolução dos gastos com pessoal na seção **Relatórios**.";
      } else if (lowerMessage.includes('projeto') || lowerMessage.includes('lei')) {
        responseText = "Você pode acompanhar todos os **projetos de lei em andamento** na seção [Câmara Legislativa](/camara).\n\nLá você encontra:\n\n• PLO - Projetos de Lei Orçamentária\n• PLC - Projetos de Lei Complementar\n• Moções e Requerimentos\n• Indicações\n\nCada projeto contém:\n• Número e data\n• Assunto\n• Texto original\n• Análise técnica (quando disponível)\n• Status de tramitação";
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-neutral-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <Bot className="w-7 h-7 text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-mono">Assistente Jurídico Municipal</h1>
              <p className="text-neutral-300 mt-2">
                Tire dúvidas sobre legislação, documentos e processos públicos municipais
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 p-4 mb-6">
          <div className="flex items-start space-x-2">
            <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="mb-2">
                Este assistente fornece informações baseadas em legislação municipal e documentos públicos.
              </p>
              <p className="italic">
                ⚠️ Não constitui consultoria jurídica. Para questões complexas, consulte profissionais habilitados.
              </p>
            </div>
          </div>
        </div>

        {/* Suggested Questions */}
        {messages.length === 1 && (
          <div className="mb-6">
            <p className="text-sm font-mono text-neutral-600 mb-3">PERGUNTAS SUGERIDAS</p>
            <div className="grid md:grid-cols-2 gap-3">
              {suggestedQuestions.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(question)}
                  className="text-left px-4 py-3 border border-neutral-300 hover:border-black hover:bg-neutral-50 transition-all text-sm"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-6 mb-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex space-x-3 max-w-3xl ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'assistant' ? 'bg-black text-white' : 'bg-neutral-200 text-neutral-700'
                }`}>
                  {message.role === 'assistant' ? (
                    <Bot className="w-5 h-5" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>

                {/* Message */}
                <div className={`flex-1 ${
                  message.role === 'user' 
                    ? 'bg-black text-white px-4 py-3' 
                    : 'bg-neutral-50 border border-neutral-200 px-4 py-3'
                }`}>
                  <div className="prose prose-sm max-w-none
                    prose-headings:font-mono prose-headings:mt-3 prose-headings:mb-2
                    prose-p:mb-2
                    prose-ul:mb-2 prose-ul:list-disc prose-ul:pl-6
                    prose-li:mb-1
                    prose-strong:font-semibold
                    prose-a:text-blue-600 prose-a:underline
                  ">
                    {message.content.split('\n').map((line, i) => {
                      if (line.startsWith('• ')) {
                        return <li key={i}>{line.substring(2)}</li>;
                      }
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return <strong key={i}>{line.replace(/\*\*/g, '')}</strong>;
                      }
                      if (line.includes('**')) {
                        const parts = line.split('**');
                        return (
                          <p key={i}>
                            {parts.map((part, j) => 
                              j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                            )}
                          </p>
                        );
                      }
                      return line ? <p key={i}>{line}</p> : <br key={i} />;
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex space-x-3 max-w-3xl">
                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-neutral-50 border border-neutral-200 px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="sticky bottom-0 bg-white pt-4 pb-6 border-t border-neutral-200">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua pergunta sobre legislação ou documentos municipais..."
              className="flex-1 px-4 py-3 border border-neutral-300 focus:outline-none focus:border-black font-mono text-sm"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-6 py-3 bg-black text-white font-mono hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">ENVIAR</span>
            </button>
          </form>
          <p className="text-xs text-neutral-500 mt-2 font-mono">
            Pressione Enter para enviar • Respostas baseadas em legislação vigente
          </p>
        </div>
      </div>
    </div>
  );
}
