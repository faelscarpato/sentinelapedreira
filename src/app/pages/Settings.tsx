import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import {
  PageContainer,
  SectionBlock,
  SectionHeading,
} from "../components/layout/PagePrimitives";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
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
import { SEO } from "../components/ui/SEO";
import { toast } from "sonner";

const profileSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    newPassword: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Senhas não correspondem",
    path: ["confirmPassword"],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export function Settings() {
  const [showPassword, setShowPassword] = useState(false);
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "João Silva",
      email: "joao@example.com",
      phone: "(11) 98765-4321",
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileSubmit = async (data: ProfileForm) => {
    try {
      console.log("Updating profile:", data);
      toast.success("Perfil atualizado com sucesso!");
    } catch {
      toast.error("Erro ao atualizar perfil");
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    try {
      console.log("Changing password");
      toast.success("Senha alterada com sucesso!");
      passwordForm.reset();
    } catch {
      toast.error("Erro ao alterar senha");
    }
  };

  return (
    <PageContainer>
      <SEO title="Configurações" description="Gerenciar perfil e preferências" />
      <SectionBlock>
        <SectionHeading>Configurações da Conta</SectionHeading>

        <Tabs defaultValue="profile" className="max-w-4xl">
          <TabsList>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="privacy">Privacidade</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>Atualize seus dados de perfil</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form
                    onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormDescription>
                            Seu email será usado para notificações e recuperação de conta
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit">Salvar Alterações</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Alterar Senha</CardTitle>
                <CardDescription>Mantenha sua conta segura</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form
                    onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha Atual</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input type={showPassword ? "text" : "password"} {...field} />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 top-1/2 -translate-y-1/2"
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nova Senha</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormDescription>
                            Use pelo menos 6 caracteres, incluindo números
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmar Senha</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit">Alterar Senha</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preferências de Notificações</CardTitle>
                <CardDescription>Controle como você recebe atualizações</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Notificações de denúncias, documentos e análises serão implementadas em breve.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Privacidade e Dados</CardTitle>
                <CardDescription>Gerencie sua privacidade</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Download de Dados</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Baixe uma cópia de seus dados pessoais
                  </p>
                  <Button variant="outline">Baixar Dados</Button>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Deletar Conta</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Esta ação é irreversível e removerá todos os seus dados
                  </p>
                  <Button variant="destructive">Deletar Conta</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </SectionBlock>
    </PageContainer>
  );
}
