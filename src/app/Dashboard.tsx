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

export interface ExtraExpense {
  id: string;
  description: string;
  amount: number;
  targetMonth: string;
  creationMonth: string;
}

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState("Mai");

  const [totalExpenses, setTotalExpenses] = useState(0); // Apenas do card de Analysis
  const [commissionsReceived, setCommissionsReceived] = useState(0);
  const [projectedSales, setProjectedSales] = useState<ProjectedSale[]>([]);
  const [extraExpenses, setExtraExpenses] = useState<ExtraExpense[]>([]);
  
  // 📍 Novos Estados para alimentar a Visão Detalhada
  const [fixedExpensesData, setFixedExpensesData] = useState<any[]>([]);
  const [variableExpensesData, setVariableExpensesData] = useState<any[]>([]);

  const URL_NATIVA_GOOGLE = "https://script.google.com/macros/s/AKfycbxpk3OuNbMN-e_apaCakfHBtY_gnXWK5Yl_V-C0sGeSft1WRtHwaEmzZVXRC0jpYS9L/exec";

  const carregarVendasDoBanco = () => {
    fetch(`${URL_NATIVA_GOOGLE}?aba=GANHOS_E_COMISSOES`)
      .then(res => res.json())
      .then(data => {
        if (data.GANHOS_E_COMISSOES) {
          const apenasComissoes = data.GANHOS_E_COMISSOES.filter((item: any) => Number(item.VALOR_IMOVEL) > 0);
          const formatado: ProjectedSale[] = apenasComissoes.map((item: any) => ({
            id: String(item.ID_GANHO), 
            propertyValue: Number(item.VALOR_IMOVEL), 
            commission: Number(item.VALOR), 
            month: item.MES_REFERENCIA,
            received: item.RECEBIDO === "TRUE" || item.RECEBIDO === true || String(item.RECEBIDO).toLowerCase() === "true"
          }));
          setProjectedSales(formatado);
        }
      });
  };

  const carregarGastosExtrasDoBanco = () => {
    fetch(`${URL_NATIVA_GOOGLE}?aba=GASTOS_EXTRAS`)
      .then(res => res.json())
      .then(data => {
        if (data.GASTOS_EXTRAS) {
          const formatado: ExtraExpense[] = data.GASTOS_EXTRAS.map((item: any) => ({
            id: String(item.ID),
            description: item.DESCRICAO,
            amount: Number(item.VALOR || 0),
            targetMonth: item.MES_ALVO,
            creationMonth: item.MES_CRIACAO
          }));
          setExtraExpenses(formatado);
        }
      });
  };

  useEffect(() => {
    carregarVendasDoBanco();
    carregarGastosExtrasDoBanco();
  }, [selectedMonth]); 

  useEffect(() => {
    const filtroMesExtenso = selectedMonth === "Mai" ? "Maio" : selectedMonth;
    const comissoesDoMesComCheck = projectedSales
      .filter(sale => (sale.month === filtroMesExtenso || sale.month === selectedMonth) && sale.received)
      .reduce((sum, sale) => sum + sale.commission, 0);

    setCommissionsReceived(comissoesDoMesComCheck);
  }, [projectedSales, selectedMonth]);

  const handleAddProjectedSale = (sale: Omit<ProjectedSale, 'id'>) => {
    const payload = {
      aba: "GANHOS_E_COMISSOES", action: "INSERT",
      data: { ID_GANHO: `GN-${Date.now()}`, DESCRICAO: "Comissão de Venda Projetada", VALOR: sale.commission, MES_REFERENCIA: sale.month, RECEBIDO: false, VALOR_IMOVEL: sale.propertyValue }
    };
    fetch(URL_NATIVA_GOOGLE, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) })
    .then(() => carregarVendasDoBanco());
  };

  const handleAddExtraExpense = (expenseData: { description: string, amount: number, targetMonth: string }) => {
    const payload = {
      aba: "GASTOS_EXTRAS", action: "INSERT",
      data: { DESCRICAO: expenseData.description, VALOR: expenseData.amount, MES_ALVO: expenseData.targetMonth, MES_CRIACAO: selectedMonth }
    };
    fetch(URL_NATIVA_GOOGLE, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) })
    .then(() => carregarGastosExtrasDoBanco());
  };

  const handleToggleReceived = (id: string) => {
    const vendaAlvo = projectedSales.find(s => s.id === id);
    if (!vendaAlvo) return;
    const novoStatus = !vendaAlvo.received;
    const payload = { aba: "GANHOS_E_COMISSOES", action: "UPDATE", id: id, data: { RECEBIDO: novoStatus } };
    fetch(URL_NATIVA_GOOGLE, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) })
    .then(() => {
      setProjectedSales(prev => prev.map(sale => sale.id === id ? { ...sale, received: novoStatus } : sale));
    });
  };

  // 📍 PONTO 1: MATEMÁTICA DO SALDO TOTAL CORRETA (TUDO SUBTRAÍDO)
  const fixedIncome = 1300; 
  const totalIncome = fixedIncome + commissionsReceived;
  const filtroMesExtenso = selectedMonth === "Mai" ? "Maio" : selectedMonth;
  const extrasDoMes = extraExpenses.filter(e => e.targetMonth === selectedMonth || e.targetMonth === filtroMesExtenso).reduce((sum, e) => sum + e.amount, 0);
  
  const allExpenses = totalExpenses + extrasDoMes; 
  const balance = totalIncome - allExpenses;

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
            onExpensesDataLoad={(fixed, variable) => { setFixedExpensesData(fixed); setVariableExpensesData(variable); }}
            totalIncome={totalIncome}
            selectedMonth={selectedMonth}
          />

          <ExtraExpensesProjection 
            selectedMonth={selectedMonth}
            extraExpenses={extraExpenses}
            onAddExtraExpense={handleAddExtraExpense}
          />

          <AnnualGoals projectedSales={projectedSales} onToggleReceived={handleToggleReceived} />
          <SavingsModule />
        </div>
      </div>
      <CommissionCalculator onAddProjectedSale={handleAddProjectedSale} />
    </div>
  );
}