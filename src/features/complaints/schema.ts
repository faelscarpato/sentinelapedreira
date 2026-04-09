import { z } from "zod";

export const complaintCategories = [
  "licitacao",
  "obras",
  "recursos",
  "patrimonio",
  "pessoal",
  "servicos",
  "outro",
] as const;

export const complaintFormSchema = z
  .object({
    name: z.string().max(120).optional().or(z.literal("")),
    email: z.string().email("E-mail inválido.").max(160).optional().or(z.literal("")),
    phone: z.string().max(40).optional().or(z.literal("")),
    category: z.enum(complaintCategories, { message: "Selecione uma categoria." }),
    subject: z.string().min(8, "Assunto deve ter pelo menos 8 caracteres.").max(180),
    description: z.string().min(50, "Descrição deve ter pelo menos 50 caracteres.").max(10000),
    anonymous: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.anonymous) {
      return;
    }

    if (!value.email && !value.phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe e-mail ou telefone para acompanhamento da denúncia.",
        path: ["email"],
      });
    }
  });

export type ComplaintFormInput = z.infer<typeof complaintFormSchema>;
