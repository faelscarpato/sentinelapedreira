import { HelpCircle, FileText, Search, Mail, ExternalLink } from "lucide-react";
import {
  PageContainer,
  SectionBlock,
  SectionHeading,
} from "../components/layout/PagePrimitives";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { useState } from "react";
import { SEO } from "../components/ui/SEO";

export function Help() {
  const [searchQuery, setSearchQuery] = useState("");

  const faqs = [
    {
      category: "Geral",
      questions: [
        {
          q: "O que é a Sentinela Pedreira?",
          a: "A Sentinela Pedreira é uma plataforma de transparência pública que facilita o acesso a informações financeiras, documentos administrativos e permite denúncias de irregularidades no município.",
        },
        {
          q: "É necessário se registrar para usar a plataforma?",
          a: "Não é obrigatório para visualizar documentos. No entanto, para fazer denúncias, comentários ou acompanhar solicitações, é necessário criar uma conta.",
        },
      ],
    },
    {
      category: "Documentos",
      questions: [
        {
          q: "Como buscar documentos?",
          a: "Use a barra de busca na página de Documentos. Você pode filtrar por tipo (relatório, licitação, parecer), data e origem. Todos os documentos são indexados para melhor busca.",
        },
        {
          q: "Posso baixar os documentos?",
          a: "Sim! Todos os documentos podem ser visualizados e baixados. Use o botão 'Download' disponível em cada documento.",
        },
        {
          q: "Com que frequência novos documentos são adicionados?",
          a: "Novos documentos são adicionados diariamente. A plataforma sincroniza automaticamente com as bases de dados municipais e estaduais.",
        },
      ],
    },
    {
      category: "Denúncias",
      questions: [
        {
          q: "Minha identidade será revelada?",
          a: "Não. Você pode fazer denúncias de forma anônima. Seus dados são protegidos por criptografia e confidencialidade é garantida por lei.",
        },
        {
          q: "O que acontece após enviar uma denúncia?",
          a: "Sua denúncia é registrada, analisada e encaminhada aos órgãos competentes. Você receberá um número de protocolo para acompanhamento.",
        },
        {
          q: "Tenho proteção legal contra retaliação?",
          a: "Sim! Denunciantes têm proteção garantida pela lei. Qualquer retaliação é crime.",
        },
      ],
    },
    {
      category: "Análises",
      questions: [
        {
          q: "Como são calculados os riscos de irregularidade?",
          a: "Usamos algoritmos baseados em análise de padrões, comparação com legislação, e inteligência artificial para identificar possíveis inconsistências.",
        },
        {
          q: "Os relatórios são auditados?",
          a: "Sim, todas as análises passam por revisão e são validadas por especialistas.",
        },
      ],
    },
    {
      category: "Assistente Jurídico",
      questions: [
        {
          q: "O assistente pode dar parecer jurídico vinculante?",
          a: "Não. O assistente fornece informações educacionais. Para parecer jurídico formal, consulte um advogado.",
        },
        {
          q: "O chat é confidencial?",
          a: "Sim, suas perguntas são confidenciais e não são compartilhadas.",
        },
      ],
    },
  ];

  const filteredFaqs = faqs
    .map((category) => ({
      ...category,
      questions: category.questions.filter(
        (q) =>
          q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.a.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.questions.length > 0);

  return (
    <PageContainer>
      <SEO title="Ajuda" description="Perguntas frequentes e suporte" />
      <SectionBlock>
        <SectionHeading className="flex items-center gap-2">
          <HelpCircle className="h-6 w-6" />
          Perguntas Frequentes
        </SectionHeading>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar na FAQ..."
              className="pl-10"
            />
          </div>

          {/* FAQs */}
          <div className="space-y-6">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((category) => (
                <div key={category.category}>
                  <h3 className="text-lg font-semibold mb-4">{category.category}</h3>
                  <Accordion type="single" collapsible>
                    {category.questions.map((item, idx) => (
                      <AccordionItem key={idx} value={`${category.category}-${idx}`}>
                        <AccordionTrigger className="hover:text-foreground">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma pergunta encontrada</p>
              </div>
            )}
          </div>

          {/* Support Cards */}
          <div className="grid md:grid-cols-2 gap-4 mt-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Envie suas dúvidas por email
                </p>
                <Button variant="outline" asChild>
                  <a href="mailto:suporte@sentinela.pedreira.sp">
                    suporte@sentinela.pedreira.sp
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documentação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Leia nossa documentação completa
                </p>
                <Button variant="outline" asChild>
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    Acessar <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Legal Links */}
          <Card className="bg-muted">
            <CardHeader>
              <CardTitle className="text-base">Links Importantes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-primary hover:underline">
                    Termos de Serviço
                  </a>
                </li>
                <li>
                  <a href="#" className="text-primary hover:underline">
                    Política de Privacidade
                  </a>
                </li>
                <li>
                  <a href="#" className="text-primary hover:underline">
                    Lei de Acesso à Informação (LAI)
                  </a>
                </li>
                <li>
                  <a href="#" className="text-primary hover:underline">
                    Lei Geral de Proteção de Dados (LGPD)
                  </a>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </SectionBlock>
    </PageContainer>
  );
}
