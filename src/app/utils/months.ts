export const MONTHS_SHORT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export const MONTH_FULL_NAMES: Record<string, string> = {
  Jan: "Janeiro", Fev: "Fevereiro", Mar: "Março", Abr: "Abril",
  Mai: "Maio", Jun: "Junho", Jul: "Julho", Ago: "Agosto",
  Set: "Setembro", Out: "Outubro", Nov: "Novembro", Dez: "Dezembro",
};

/** Converte "Mai" -> "Maio". Usado para bater com o formato salvo na planilha. */
export function toFullMonthName(shortMonth: string): string {
  return MONTH_FULL_NAMES[shortMonth] || shortMonth;
}

/** Retorna o mês curto atual (ex: "Jul") com base na data do sistema. */
export function getCurrentShortMonth(): string {
  return MONTHS_SHORT[new Date().getMonth()];
}
