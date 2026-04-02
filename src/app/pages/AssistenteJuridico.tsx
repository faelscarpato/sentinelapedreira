import { useEffect } from "react";
import { useNavigate } from "react-router";
import { openAssistantChat } from "../lib/assistantEvents";

export function AssistenteJuridico() {
  const navigate = useNavigate();

  useEffect(() => {
    openAssistantChat();
    navigate("/", { replace: true });
  }, [navigate]);

  return null;
}
