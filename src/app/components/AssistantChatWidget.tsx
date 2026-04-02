import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, MessageCircle, RotateCcw, Send, Sparkles, StopCircle, User, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { askGroqAssistantStream, type GroqMessage } from "../../lib/groqService";
import { allDocuments } from "../data/realData";
import { addOpenAssistantChatListener } from "../lib/assistantEvents";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  error?: boolean;
}

const suggestedQuestions = [
  "Como funciona o limite de gastos com pessoal?",
  "Onde vejo os documentos da LOA?",
  "Como acompanhar licitações do município?",
];

const initialAssistantMessage: Message = {
  id: "welcome-floating",
  role: "assistant",
  content:
    "Olá! Sou o **Assistente Jurídico**. Posso te ajudar com legislação, documentos públicos e transparência municipal.",
};

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce"
          style={{ animationDelay: `${index * 0.15}s` }}
        />
      ))}
    </div>
  );
}

export function AssistantChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([initialAssistantMessage]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const abortRef = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return addOpenAssistantChatListener(() => {
      setIsOpen(true);
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [isOpen, messages]);

  const buildGroqMessages = useCallback(
    (items: Message[]): GroqMessage[] =>
      items
        .filter((item) => !item.error && !item.streaming)
        .map((item) => ({
          role: item.role,
          content: item.content,
        })),
    [],
  );

  const handleSend = useCallback(
    async (text?: string) => {
      const query = (text ?? input).trim();
      if (!query || isStreaming) return;

      abortRef.current = false;
      setInput("");

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: query,
      };

      const assistantMessageId = `assistant-${Date.now()}`;
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        streaming: true,
      };

      setMessages((previous) => [...previous, userMessage, assistantMessage]);
      setIsStreaming(true);

      try {
        const history = buildGroqMessages([...messages, userMessage]);
        let accumulated = "";

        for await (const token of askGroqAssistantStream(history, query, allDocuments)) {
          if (abortRef.current) break;
          accumulated += token;
          setMessages((previous) =>
            previous.map((message) =>
              message.id === assistantMessageId
                ? { ...message, content: accumulated, streaming: true }
                : message,
            ),
          );
        }

        setMessages((previous) =>
          previous.map((message) =>
            message.id === assistantMessageId ? { ...message, streaming: false } : message,
          ),
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Falha ao consultar a IA.";
        setMessages((previous) =>
          previous.map((message) =>
            message.id === assistantMessageId
              ? { ...message, content: `❌ ${errorMessage}`, streaming: false, error: true }
              : message,
          ),
        );
      } finally {
        setIsStreaming(false);
        abortRef.current = false;
        inputRef.current?.focus();
      }
    },
    [buildGroqMessages, input, isStreaming, messages],
  );

  const handleStop = () => {
    abortRef.current = true;
    setIsStreaming(false);
  };

  const handleReset = () => {
    setMessages([initialAssistantMessage]);
    setInput("");
    setIsStreaming(false);
    abortRef.current = false;
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed z-50 border border-neutral-700 bg-neutral-950 shadow-2xl flex flex-col inset-x-2 bottom-2 top-20 sm:top-auto sm:inset-x-auto sm:bottom-5 sm:right-6 sm:w-[min(94vw,420px)] sm:h-[min(78vh,640px)]">
          <div className="px-4 py-3 border-b border-neutral-800 bg-neutral-900">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-teal-900 border border-teal-700 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-teal-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-mono text-white">Assistente Jurídico</p>
                <p className="text-[11px] text-neutral-500 font-mono">IA com Groq</p>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 text-neutral-500 hover:text-white transition-colors"
                title="Nova conversa"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-neutral-500 hover:text-white transition-colors"
                title="Fechar chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="w-6 h-6 bg-teal-900 border border-teal-700 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 text-teal-400" />
                  </div>
                )}

                <div
                  className={`max-w-[86%] sm:max-w-[82%] px-3 py-2 text-xs leading-relaxed break-words ${
                    message.role === "user"
                      ? "bg-neutral-700 text-white"
                      : message.error
                        ? "bg-red-950 border border-red-800 text-red-300"
                        : "bg-neutral-900 border border-neutral-800 text-neutral-200"
                  }`}
                >
                  {message.streaming && !message.content ? (
                    <TypingIndicator />
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                    </div>
                  )}
                </div>

                {message.role === "user" && (
                  <div className="w-6 h-6 bg-neutral-700 border border-neutral-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-3.5 h-3.5 text-neutral-300" />
                  </div>
                )}
              </div>
            ))}

            {messages.length <= 1 && (
              <div className="pt-1">
                <p className="text-[11px] text-neutral-500 font-mono mb-2">SUGESTOES</p>
                <div className="space-y-1.5">
                  {suggestedQuestions.map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => void handleSend(question)}
                      className="w-full text-left px-3 py-2 text-xs font-mono border border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-teal-700 hover:text-white transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>

          <div className="border-t border-neutral-800 p-3 bg-neutral-900">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  event.target.style.height = "auto";
                  event.target.style.height = `${Math.min(event.target.scrollHeight, 150)}px`;
                }}
                onKeyDown={handleKeyDown}
                disabled={isStreaming}
                placeholder="Digite sua pergunta..."
                className="flex-1 bg-neutral-800 border border-neutral-700 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-teal-600 resize-none overflow-hidden font-mono leading-relaxed"
              />

              {isStreaming ? (
                <button
                  type="button"
                  onClick={handleStop}
                  className="w-9 h-9 bg-red-900 border border-red-700 text-red-300 flex items-center justify-center hover:bg-red-800 transition-colors"
                  title="Parar resposta"
                >
                  <StopCircle className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={!input.trim()}
                  className="w-9 h-9 bg-teal-900 border border-teal-700 text-teal-200 flex items-center justify-center hover:bg-teal-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Enviar"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-5 sm:right-6 z-50 w-14 h-14 rounded-full bg-black text-white border border-neutral-700 shadow-xl hover:bg-neutral-800 transition-colors flex items-center justify-center"
          aria-label="Abrir assistente jurídico"
          title="Assistente Jurídico"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
    </>
  );
}

