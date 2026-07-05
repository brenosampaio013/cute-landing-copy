import { MessageCircle } from "lucide-react";

const WHATSAPP_URL = `https://wa.me/5513998068265?text=${encodeURIComponent(
  "Olá! Gostaria de solicitar um orçamento com a Maré Nobre."
)}`;

export function WhatsappFab() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Fale conosco no WhatsApp"
      className="group fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg ring-4 ring-[#25D366]/20 transition hover:scale-110 hover:shadow-2xl sm:bottom-6 sm:right-6 sm:h-16 sm:w-16"
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366]/40" aria-hidden="true" />
      <MessageCircle className="relative h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2.2} />
      <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-lg bg-[#0A1A2F] px-3 py-2 text-xs font-semibold text-white shadow-lg group-hover:block">
        Fale no WhatsApp
      </span>
    </a>
  );
}
