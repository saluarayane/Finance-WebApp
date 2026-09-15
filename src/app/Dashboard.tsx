import { useState, useEffect } from "react";
import { BackgroundOrbs } from "./components/BackgroundOrbs";
import { Header } from "./components/Header";
import { MonthSelector } from "./components/MonthSelector";
import { MonthDetailView } from "./components/MonthDetailView";
import { ExpenseAnalysis } from "./components/ExpenseAnalysis";
import { SavingsModule } from "./components/SavingsModule";
import { ExtraExpensesProjection } from "./components/ExtraExpensesProjection";
import { AnnualGoals, type ProjectedSale } from "./components/AnnualGoals";
import { CommissionCalculator } from "./components/CommissionCalculator";
import { fetchSheet, writeSheet } from "../config/api";
import { toFullMonthName, getCurrentShortMonth } from "./utils/months";

// 📍 CORREÇÃO: reexporta os tipos para que outros componentes (MonthDetailView, etc)
// possam importá-los diretamente daqui, como já faziam.
export type { ProjectedSale };

export interface ExtraExpense {
  id: string;
  description: string;
  amount: number;
  targetMonth: string;
  creationMonth: string;
}

export default function Dashboard() {
  // 📍 CORREÇÃO: antes começava fixo em "Mai" (Maio); agora reflete o mês real do sistema.
  const [selectedMonth, setSelectedMonth] = useState(getCurrentShortMonth());
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [commissionsReceived, setCommissionsReceived] = useState(0);
  const [projectedSales, setProjectedSales] = useState<ProjectedSale[]>([]);
  const [extraExpenses, setExtraExpenses] = useState<ExtraExpense[]>([]);
  const [fixedExpensesData, setFixedExpensesData] = useState<any[]>([]);
  const [variableExpensesData, setVariableExpensesData] = useState<any[]>([]);

  const carregarVendasDoBanco = () => {
    fetchSheet<{ GANHOS_E_COMISSOES?: any[] }>("GANHOS_E_COMISSOES")
      .then((data) => {
        if (data.GANHOS_E_COMISSOES) {
          const apenasComissoes = data.GANHOS_E_COMISSOES.filter(
            (item: any) => Number(item.VALOR_IMOVEL) > 0
          );
          setProjectedSales(
            apenasComissoes.map((item: any) => ({
              id: String(item.ID_GANHO),
              propertyValue: Number(item.VALOR_IMOVEL),
              commission: Number(item.VALOR),
              month: item.MES_REFERENCIA,
              received: String(item.RECEBIDO).toLowerCase() === "true",
            }))
          );
        }
      })
      .catch((err) => console.error("Erro ao carregar vendas:", err));
  };

  const carregarGastosExtrasDoBanco = () => {
    fetchSheet<{ GASTOS_EXTRAS?: any[] }>("GASTOS_EXTRAS")
      .then((data) => {
        if (data.GASTOS_EXTRAS) {
          const formatado: ExtraExpense[] = data.GASTOS_EXTRAS.map((item: any, index: number) => ({
            id: String(item.ID_EXTRA || item.id_extra || `gen-${index}-${Date.now()}`),
            description: item.DESCRICAO,
            amount: Number(item.VALOR || 0),
            targetMonth: item.MES_ALVO,
            creationMonth: item.MES_CRIACAO,
          }));
          setExtraExpenses(formatado);
        }
      })
      .catch((err) => console.error("Erro ao carregar gastos extras:", err));
  };

  // 📍 CORREÇÃO: essas duas funções buscam TODAS as linhas da aba (não filtram por mês
  // na própria consulta), então não faz sentido refazer a chamada de rede toda vez que o
  // usuário troca de mês no seletor — isso gastava cota da API do Google à toa.
  // Agora buscamos uma vez, ao montar o Dashboard, e a filtragem por mês continua
  // acontecendo localmente (nos componentes filhos, com os dados já em memória).
  useEffect(() => {
    carregarVendasDoBanco();
    carregarGastosExtrasDoBanco();
  }, []);

  const handleAddExtraExpense = (expenseData: { description: string; amount: number; targetMonth: string }) => {
    const novoId = `GE-${Date.now()}`;
    writeSheet({
      aba: "GASTOS_EXTRAS",
      action: "INSERT",
      data: {
        ID_EXTRA: novoId,
        DESCRICAO: expenseData.description,
        VALOR: expenseData.amount,
        MES_ALVO: expenseData.targetMonth,
        MES_CRIACAO: selectedMonth,
      },
    })
      .then(() => carregarGastosExtrasDoBanco())
      .catch((err) => console.error("Erro ao adicionar gasto extra:", err));
  };

  const handleToggleReceived = (id: string) => {
    const vendaAlvo = projectedSales.find((s) => s.id === id);
    if (!vendaAlvo) return;
    const novoStatus = !vendaAlvo.received;

    // Atualização otimista: já reflete na tela antes da confirmação do servidor.
    setProjectedSales((prev) => prev.map((s) => (s.id === id ? { ...s, received: novoStatus } : s)));

    writeSheet({
      aba: "GANHOS_E_COMISSOES",
      action: "UPDATE",
      id,
      data: { RECEBIDO: novoStatus },
    }).catch((err) => {
      console.error("Erro ao atualizar status de recebimento:", err);
      // Reverte em caso de falha, já que a planilha não foi atualizada de verdade.
      setProjectedSales((prev) => prev.map((s) => (s.id === id ? { ...s, received: !novoStatus } : s)));
    });
  };

  const handleAddProjectedSale = (sale: { propertyValue: number; commission: number; month: string; received: boolean }) => {
    writeSheet({
      aba: "GANHOS_E_COMISSOES",
      action: "INSERT",
      data: {
        ID_GANHO: `GN-${Date.now()}`,
        DESCRICAO: "Comissão de Venda Projetada",
        VALOR: sale.commission,
        MES_REFERENCIA: sale.month,
        RECEBIDO: false,
        VALOR_IMOVEL: sale.propertyValue,
      },
    })
      .then(() => carregarVendasDoBanco())
      .catch((err) => console.error("Erro ao projetar venda:", err));
  };

  const fixedIncome = 1300;
  const totalIncome = fixedIncome + commissionsReceived;
  const filtroMesExtenso = toFullMonthName(selectedMonth);
  const extrasDoMes = extraExpenses
    .filter((e) => e.targetMonth === selectedMonth || e.targetMonth === filtroMesExtenso)
    .reduce((sum, e) => sum + e.amount, 0);
  const balance = totalIncome - (totalExpenses + extrasDoMes);

  return (
    <div className="min-h-screen text-white font-sans relative pb-32 selection:bg-fuchsia-500/30">
      <BackgroundOrbs />
      <div className="max-w-md mx-auto w-full px-6 pt-10 flex flex-col items-center">
        <Header balance={balance} />
        <MonthSelector selectedMonth={selectedMonth} onSelect={setSelectedMonth} />
        <div className="w-full space-y-6 mt-2">
          <MonthDetailView
            month={selectedMonth}
            projectedSales={projectedSales}
            extraExpenses={extraExpenses}
            fixedExpensesData={fixedExpensesData}
            variableExpensesData={variableExpensesData}
          />
          <ExpenseAnalysis
            onUpdateExpenses={(amount) => setTotalExpenses(amount)}
            onExpensesDataLoad={(fixed, variable) => {
              setFixedExpensesData(fixed);
              setVariableExpensesData(variable);
            }}
            totalIncome={totalIncome}
            selectedMonth={selectedMonth}
          />

          <ExtraExpensesProjection
            selectedMonth={selectedMonth}
            extraExpenses={extraExpenses}
            onAddExtraExpense={handleAddExtraExpense}
            onDeleteExtraExpense={(id) => setExtraExpenses((prev) => prev.filter((e) => e.id !== id))}
          />

          <AnnualGoals projectedSales={projectedSales} onToggleReceived={handleToggleReceived} />
          <SavingsModule />
        </div>
      </div>
      <CommissionCalculator onAddProjectedSale={handleAddProjectedSale} />
    </div>
  );
}
