// URL do Google Apps Script Web App que atua como "backend" lendo/escrevendo na planilha.
// Centralizado aqui para não precisar copiar e colar em cada componente.
// Se um dia você reimplantar o Apps Script, só precisa trocar essa linha.
export const GOOGLE_SHEETS_API_URL =
  "https://script.google.com/macros/s/AKfycbxpk3OuNbMN-e_apaCakfHBtY_gnXWK5Yl_V-C0sGeSft1WRtHwaEmzZVXRC0jpYS9L/exec";

type SheetAction = "INSERT" | "UPDATE" | "DELETE";

interface SheetWritePayload {
  aba: string;
  action: SheetAction;
  id?: string;
  data?: Record<string, unknown>;
}

/** Lê todas as linhas de uma aba da planilha. */
export async function fetchSheet<T = any>(aba: string): Promise<T> {
  const res = await fetch(`${GOOGLE_SHEETS_API_URL}?aba=${encodeURIComponent(aba)}`);
  if (!res.ok) throw new Error(`Erro ao ler a aba ${aba}: ${res.status}`);
  return res.json();
}

/** Envia um INSERT, UPDATE ou DELETE para a planilha. */
export async function writeSheet(payload: SheetWritePayload): Promise<any> {
  const res = await fetch(GOOGLE_SHEETS_API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Erro ao escrever na aba ${payload.aba}: ${res.status}`);
  return res.json().catch(() => ({}));
}
