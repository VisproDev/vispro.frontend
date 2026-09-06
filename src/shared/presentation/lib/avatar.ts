import type { CSSProperties } from 'react';

/** Iniciais (no máximo duas) exibidas no AvatarFallback do shadcn. */
export function iniciais(nome?: string) {
  if (!nome) return "?";
  return nome
    .split(" ")
    .slice(0, 2)
    .map(parte => parte[0])
    .join("")
    .toUpperCase();
}

/** Gradiente do avatar a partir da cor da conta, como no design original. */
export function gradienteAvatar(cor?: string): CSSProperties {
  const base = cor || "#6B7280";
  return { backgroundImage: `linear-gradient(135deg, ${base}, #333)` };
}
