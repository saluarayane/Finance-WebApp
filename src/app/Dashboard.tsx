import { useState, useEffect } from "react"; // 📍 CORREÇÃO: Importado o useEffect que faltava
import { BackgroundOrbs } from "./components/BackgroundOrbs";
import { Header } from "./components/Header";
import { MonthSelector } from "./components/MonthSelector";
import { MonthDetailView } from "./components/MonthDetailView";
import { ExpenseAnalysis } from "./components/ExpenseAnalysis";
import { SavingsModule } from "./components/SavingsModule";
import { ExtraExpensesProjection } from "./components/ExtraExpensesProjection";
import { AnnualGoals, type ProjectedSale } from "./components/AnnualGoals";
import { CommissionCalculator } from "./components/CommissionCalculator";

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState("Mai");

  const [totalExpenses, setTotalExpenses] = useState(0);
  const [commissionsReceived, setCommissionsReceived] = useState(0);
  const [projectedSales, setProjectedSales] = useState<ProjectedSale[]>([]);

  const fixedIncome = 1300; 
  const totalIncome = fixedIncome + commissionsReceived;
  const balance = totalIncome - totalExpenses;

  const URL_DASHBOARD = "https://api.sheety.co/b848ca0bc11ef70702138c361ae712a0/webAppPlanejamentoFinanceiro/dashboardMensal";
  const URL_GANHOS    = "https://api.sheety.co/b848ca0bc11ef70702138c361ae712a0/webAppPlanejamentoFinanceiro/ganhosEComissoes";

  useEffect(() => {
    fetch(URL_DASHBOARD)
      .then(res => res.json())
      .then(data => {
        if (data.dashboardMensal && data.dashboardMensal.length > 0) {
          const dadosMes = data.dashboardMensal[0]; 
          setTotalExpenses(Number(dadosMes.gastosTotaisMensais || 0));
          setCommissionsReceived(Number(dadosMes.comissoesRecebidas || 0));
        }
      })
      .catch(err => console.error("Erro ao buscar Dashboard:", err));

    fetch(URL_GANHOS)
      .then(res => res.json())
      .then(data => {
        if (data.ganhosEComissoes) {
          const formatado: ProjectedSale[] = data.ganhosEComissoes.map((item: any) => ({
            id: String(item.idGanhos || item.id),
            propertyValue: Number(item.valorImovel || 0),
            commission: Number(item.valorComissao || 0),
            month: item.mesReferencia || "Jun",
            received: item.recebido === "TRUE" || item.recebido === true
          }));
          setProjectedSales(formatado);
        }
      })
      .catch(err => console.error("Erro ao buscar Ganhos:", err));
  }, [selectedMonth]); 

  const handleUpdateBalance = (amount: number) => {
    setCommissionsReceived(prev => prev + amount);
  };

  const handleUpdateExpenses = (amount: number) => {
    setTotalExpenses(amount);
  };

  const handleAddCommission = (amount: number) => {
    setCommissionsReceived(prev => prev + amount);
  };

  const handleAddProjectedSale = (sale: Omit<ProjectedSale, 'id'>) => {
    const payload = {
      ganhosEComissao: {
        idGanhos: `GN-${Date.now()}`,
        descricao: "Comissão de Venda Projetada",
        valorImovel: sale.propertyValue,
        valorComissao: sale.commission,
        mesReferencia: sale.month,
        recebido: false
      }
    };

    fetch(URL_GANHOS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
      const novaVenda: ProjectedSale = {
        ...sale,
        id: data.ganhosEComissao.idGanhos
      };
      setProjectedSales(prev => [...prev, novaVenda]);
    })
    .catch(err => console.error("Erro ao salvar comissão:", err));
  };

  const handleToggleReceived = (id: string) => {
    const vendaAlvo = projectedSales.find(s => s.id === id);
    if (!vendaAlvo) return;

    const novoStatus = !vendaAlvo.received;

    fetch(`${URL_GANHOS}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ganhosEComissao: {
          recebido: novoStatus
        }
      })
    })
    .then(() => {
      setProjectedSales(prev => prev.map(sale => {
        if (sale.id === id) {
          if (novoStatus) {
            handleAddCommission(sale.commission);
          } else {
            handleAddCommission(-sale.commission);
          }
          return { ...sale, received: novoStatus };
        }
        return sale;
      }));
    })
    .catch(err => console.error("Erro ao atualizar status:", err));
  };

  return (
    <div className="min-h-screen text-white font-sans relative pb-32 selection:bg-fuchsia-500/30">
      <BackgroundOrbs />

      <div className="max-w-md mx-auto w-full px-6 pt-10 flex flex-col items-center">

        <Header balance={balance} />

        <MonthSelector
          selectedMonth={selectedMonth}
          onSelect={setSelectedMonth}
        />

        <div className="w-full space-y-6 mt-2">

          <MonthDetailView month={selectedMonth} onUpdateBalance={handleUpdateBalance} />

          {/* 📍 CORREÇÃO: Passando o selectedMonth dinâmico para as rotas internas de gastos */}
          <ExpenseAnalysis
            onUpdateBalance={handleUpdateBalance}
            onUpdateExpenses={handleUpdateExpenses}
            totalIncome={totalIncome}
            selectedMonth={selectedMonth}
          />

          <ExtraExpensesProjection />

          <AnnualGoals
            projectedSales={projectedSales}
            onToggleReceived={handleToggleReceived}
          />

          <SavingsModule />

        </div>
      </div>

      <CommissionCalculator
        onAddCommission={handleAddCommission}
        onAddProjectedSale={handleAddProjectedSale}
      />
    </div>
  );
}