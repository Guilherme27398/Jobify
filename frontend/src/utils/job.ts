import type { Job } from '../api/types';

const CONTRACT_LABELS: Record<string, string> = {
  full_time: 'Tempo inteiro',
  part_time: 'Tempo parcial',
  internship: 'Estágio',
  freelance: 'Freelance',
  temporary: 'Temporário',
};

const REMOTE_LABELS: Record<string, string> = {
  on_site: 'Presencial',
  hybrid: 'Híbrido',
  remote: 'Remoto',
};

const SOURCE_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
};

export function contractLabel(value: string | null): string | null {
  return value ? CONTRACT_LABELS[value] ?? value : null;
}

export function remoteLabel(value: string | null): string | null {
  return value ? REMOTE_LABELS[value] ?? value : null;
}

export function sourceLabel(value: string): string {
  return SOURCE_LABELS[value] ?? value;
}

/** "4.200 € – 5.000 €", "a partir de 3.800 €" ou null quando a vaga não publica salário. */
const PERIOD_SUFFIX: Record<string, string> = { month: '/mês', year: '/ano' };

/** "1654 – 2100 €/mês", "24 000 – 36 000 €/ano" ou null quando a vaga não publica salário. */
export function salaryLabel(job: Job): string | null {
  const currency = job.salaryCurrency === 'EUR' || !job.salaryCurrency ? '€' : job.salaryCurrency;
  const unit = `${currency}${job.salaryPeriod ? PERIOD_SUFFIX[job.salaryPeriod] : ''}`;
  const fmt = (n: number) => Math.round(n).toLocaleString('pt-PT');
  if (job.salaryMin != null && job.salaryMax != null) {
    return `${fmt(job.salaryMin)} – ${fmt(job.salaryMax)} ${unit}`;
  }
  const single = job.salaryMin ?? job.salaryMax;
  return single != null ? `${fmt(single)} ${unit}` : null;
}

const SMALL_WORDS = new Set(['de', 'do', 'da', 'dos', 'das', 'e', 'em', 'para', 'com', 'por', 'a', 'o', 'as', 'os']);

/**
 * Converte títulos em "Title Case" (ou em maiúsculas) para frase normal.
 * Só mexe em títulos onde a maioria das palavras longas começa por maiúscula,
 * para não estragar títulos já bem escritos. Siglas de 2 a 4 letras
 * (TI, SAP, AWS) mantêm-se e o conteúdo de parênteses fica em minúsculas: (a), (m/f).
 */
export function normalizeTitle(title: string): string {
  const words = title.split(/\s+/).filter(Boolean);
  const longWords = words.filter(w => w.replace(/[^\p{L}]/gu, '').length >= 4);
  const capitalised = longWords.filter(w => /^\p{Lu}/u.test(w)).length;
  const looksAggressive = longWords.length > 0 && capitalised / longWords.length >= 0.7;
  const allCaps = title === title.toUpperCase() && /\p{L}{4,}/u.test(title);

  if (!looksAggressive && !allCaps) return title;

  return words
    .map((word, index) => {
      const letters = word.replace(/[^\p{L}]/gu, '');
      const isAcronym = letters.length >= 2 && letters.length <= 4 && letters === letters.toUpperCase();
      let out = isAcronym ? word : word.toLowerCase();
      out = out.replace(/\(([^)]+)\)/g, (_, inner: string) => `(${inner.toLowerCase()})`);
      if (index === 0) out = out.charAt(0).toUpperCase() + out.slice(1);
      return out;
    })
    .map((word, index) => (index > 0 && SMALL_WORDS.has(word.toLowerCase()) ? word.toLowerCase() : word))
    .join(' ');
}
