const OPEN_ASSISTANT_CHAT_EVENT = "civicwatch:open-assistant-chat";

export function openAssistantChat() {
  window.dispatchEvent(new CustomEvent(OPEN_ASSISTANT_CHAT_EVENT));
}

export function addOpenAssistantChatListener(listener: () => void) {
  window.addEventListener(OPEN_ASSISTANT_CHAT_EVENT, listener);
  return () => window.removeEventListener(OPEN_ASSISTANT_CHAT_EVENT, listener);
}
