import { useEffect } from "react";
import { useNavigate } from "react-router";
import { openAssistantChat } from "../lib/assistantEvents";
import { PageContainer, PageState } from "../components/layout/PagePrimitives";

export function AssistenteJuridico() {
  const navigate = useNavigate();

  useEffect(() => {
    openAssistantChat();
    navigate("/", { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <PageContainer>
        <PageState
          mode="loading"
          title="Abrindo assistente jurídico"
          description="Inicializando chat e redirecionando para a tela principal."
        />
      </PageContainer>
    </div>
  );
}
