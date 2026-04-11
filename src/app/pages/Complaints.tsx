import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Send, Check } from "lucide-react";
import {
  PageContainer,
  SectionBlock,
  SectionHeading,
} from "../components/layout/PagePrimitives";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { SEO } from "../components/ui/SEO";
import { toast } from "sonner";

const complaintSchema = z.object({
  title: z.string().min(10, "Título deve ter pelo menos 10 caracteres"),
  category: z.string().min(1, "Selecione uma categoria"),
  description: z.string().min(50, "Descrição deve ter pelo menos 50 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  attachment: z.string().optional(),
});

type ComplaintForm = z.infer<typeof complaintSchema>;

export function Complaints() {
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<ComplaintForm>({
    resolver: zodResolver(complaintSchema),
  });

  const onSubmit = async (data: ComplaintForm) => {
    try {
      // Call Supabase Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/complaint-submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) throw new Error("Falha ao enviar denúncia");

      setSubmitted(true);
      toast.success("Denúncia enviada com sucesso!");
      setTimeout(() => form.reset(), 2000);
    } catch (error) {
      toast.error("Erro ao enviar denúncia");
      console.error(error);
    }
  };

  return (
    <PageContainer>
      <SEO title="Denúncias" description="Denuncie irregularidades públicas" />
      <SectionBlock>
        <SectionHeading>Denuncie Irregularidades</SectionHeading>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl">
          {/* Form */}
          <div className="lg:col-span-2">
            {submitted ? (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Denúncia Recebida!</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Sua denúncia foi registrada com sucesso. Você receberá atualizações por email.
                  </p>
                  <Button onClick={() => setSubmitted(false)}>Enviar outra denúncia</Button>
                </CardContent>
              </Card>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título da Denúncia</FormLabel>
                        <FormControl>
                          <Input placeholder="Descreva brevemente o problema" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="w-full px-3 py-2 border rounded-md"
                          >
                            <option value="">Selecione uma categoria</option>
                            <option value="financial">Irregularidades Financeiras</option>
                            <option value="procurement">Licitações Irregulares</option>
                            <option value="ethics">Ética e Conduta</option>
                            <option value="other">Outro</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição Detalhada</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Forneça detalhes sobre a irregularidade..."
                            className="h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Seja o mais específico possível, incluindo datas e pessoas envolvidas.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seu Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="seu@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone (Opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="(XX) XXXXX-XXXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" size="lg" className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Denúncia
                  </Button>
                </form>
              </Form>
            )}
          </div>

          {/* Info */}
          <div className="space-y-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-blue-600" />
                  Informações
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <p>
                  <strong>Confidencialidade:</strong> Sua identidade pode ser mantida em sigilo.
                </p>
                <p>
                  <strong>Segurança:</strong> Dados criptografados e protegidos.
                </p>
                <p>
                  <strong>Acompanhamento:</strong> Receba atualizações sobre sua denúncia.
                </p>
                <p>
                  <strong>Protegido por lei:</strong> Denunciantes têm proteção legal contra retaliação.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dúvidas?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>Acesse nossa página de</p>
                <Button variant="link" className="p-0 h-auto">
                  → Perguntas Frequentes
                </Button>
                <p>ou entre em contato:</p>
                <p className="text-muted-foreground">contato@sentinela.pedreira.sp</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </SectionBlock>
    </PageContainer>
  );
}
