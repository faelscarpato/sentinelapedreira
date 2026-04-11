import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import {
  PageContainer,
  SectionBlock,
  SectionHeading,
} from "../components/layout/PagePrimitives";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { SEO } from "../components/ui/SEO";
import { ScrollArea } from "../components/ui/scroll-area";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function LegalAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Olá! Sou seu Assistente Jurídico. Posso ajudar com dúvidas sobre transparência pública, licitações, denúncias e legislação municipal. Como posso ajudá-lo?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Call Supabase Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/legal-assistant`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: input }),
        }
      );

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "Não consegui processar sua pergunta. Tente novamente.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Desculpe, ocorreu um erro. Tente novamente mais tarde.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer>
      <SEO title="Assistente Jurídico" description="Chatbot de assistência jurídica" />
      <SectionBlock>
        <div className="max-w-4xl mx-auto">
          <SectionHeading className="flex items-center gap-2 mb-6">
            <MessageCircle className="h-6 w-6" />
            Assistente Jurídico IA
          </SectionHeading>

          <Card className="flex flex-col h-[600px]">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Dúvidas Legais e Administrativas</CardTitle>
                <Badge>Ativo</Badge>
              </div>
            </CardHeader>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-muted text-muted-foreground rounded-bl-none"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <span className="text-xs opacity-75 mt-1 block">
                        {msg.timestamp.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted px-4 py-2 rounded-lg rounded-bl-none">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse" />
                        <div
                          className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse"
                          style={{ animationDelay: "0.2s" }}
                        />
                        <div
                          className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse"
                          style={{ animationDelay: "0.4s" }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="border-t p-4 space-y-2">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Digite sua pergunta..."
                  disabled={isLoading}
                />
                <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Dica: Pergunte sobre legislação, transparência, ou direitos administrativos.
              </p>
            </div>
          </Card>

          <Card className="mt-6 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-base">Exemplos de Perguntas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setInput("Qual é o processo correto para fazer uma denúncia?")}
              >
                Qual é o processo correto para fazer uma denúncia?
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  setInput("Como funciona a Lei de Acesso à Informação (LAI)?")
                }
              >
                Como funciona a Lei de Acesso à Informação (LAI)?
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setInput("Quais são os direitos dos cidadãos em relação a dados públicos?")}
              >
                Quais são os direitos dos cidadãos em relação a dados públicos?
              </Button>
            </CardContent>
          </Card>
        </div>
      </SectionBlock>
    </PageContainer>
  );
}
