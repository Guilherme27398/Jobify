/*
 * Cores e "chrome" dos gráficos da dashboard.
 *
 * A paleta categórica é a de referência da skill de dataviz (passos do modo escuro),
 * validada com scripts/validate_palette.js contra o fundo dos cartões (#0e0e12).
 * A ordem faz parte da validação: não reordenar nem gerar cores novas — a partir da
 * 9.ª série, o resto vai para "Outras". O azul/roxo da marca falha a separação para
 * daltonismo (ΔE 3.4), por isso não é usado para distinguir séries.
 */
export const SERIES = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'];

/** Cinzento para "Não indicado" e "Outras" (3.7:1 sobre o fundo). */
export const NEUTRAL = '#6b6b7a';
export const SURFACE = '#0e0e12';
export const GRID = '#1e1e26';
export const TICK = '#8a8aa0';
export const TICK_STYLE = { fill: TICK, fontSize: 12 };

/* A cor segue a área, nunca a posição na lista: filtrar áreas não repinta as restantes. */
const SECTOR_SLOTS = [
  'tecnologia', 'advocacia', 'saude', 'engenharia',
  'comercial-vendas', 'marketing-comunicacao', 'educacao', 'logistica-transportes',
];

export function sectorColor(slug: string): string {
  const slot = SECTOR_SLOTS.indexOf(slug);
  return slot >= 0 ? SERIES[slot] : NEUTRAL;
}

export const MODALITIES = [
  { key: 'remote', label: 'Remoto', color: SERIES[0] },
  { key: 'hybrid', label: 'Híbrido', color: SERIES[1] },
  { key: 'on_site', label: 'Presencial', color: SERIES[2] },
  { key: 'unknown', label: 'Não indicado', color: NEUTRAL },
];

export const SALARY_COLORS = { min: SERIES[0], max: SERIES[2] };

export const formatInt = (n: number) => Math.round(n).toLocaleString('pt-PT');

const compact = new Intl.NumberFormat('pt-PT', { notation: 'compact', maximumFractionDigits: 1 });
export const formatCompact = (n: number) => compact.format(n);
