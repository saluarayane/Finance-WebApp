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

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState("Mai");

  const [totalExpenses, setTotalExpenses] = useState(0);
  const [commissionsReceived, setCommissionsReceived] = useState(0);
  const [projectedSales, setProjectedSales] = useState<ProjectedSale[]>([]);

  const fixedIncome = 1300; 
  // 📍 LÓGICA 4: O totalIncome agora junta dinamicamente o Fixo + as Comissões do mês que estão com CHECK
  const totalIncome = fixedIncome + commissionsReceived;
  const balance = totalIncome - totalExpenses;

  const URL_DASHBOARD = "https://api.sheety.co/b848ca0bc11ef70702138c361ae712a0/webAppPlanejamentoFinanceiro/dashboardMensal";
  const URL_GANHOS    = "https://api.sheety.co/b848ca0bc11ef70702138c361ae712a0/webAppPlanejamentoFinanceiro/ganhosEComissoes";

  // 🔄 Função isolada para recarregar as vendas sempre em sincronia com o banco
  const carregarVendasDoBanco = () => {
    fetch(URL_GANHOS)
      .then(res => res.json())
      .then(data => {
        if (data.ganhosEComissoes) {
          const formatado: ProjectedSale[] = data.ganhosEComissoes.map((item: any) => ({
            id: String(item.id), 
            propertyValue: Number(item.valorImovel || 0), // Agora vai ler da coluna nova
            commission: Number(item.valor || 0), // 📍 CORREÇÃO: Lê o ganho da coluna VALOR
            month: item.mesReferencia || "Jun",
            received: item.recebido === "TRUE" || item.recebido === true || String(item.recebido).toLowerCase() === "true"
          }));
          setProjectedSales(formatado);
        }
      })
      .catch(err => console.error("Erro ao buscar Ganhos:", err));
  };

  useEffect(() => {
    fetch(URL_DASHBOARD)
      .then(res => res.json())
      .then(data => {
        if (data.dashboardMensal && data.dashboardMensal.length > 0) {
          const dadosMes = data.dashboardMensal[0]; 
          setTotalExpenses(Number(dadosMes.gastosTotaisMensais || 0));
        }
      })
      .catch(err => console.error("Erro ao buscar Dashboard:", err));

    carregarVendasDoBanco();
  }, [selectedMonth]); 

  // Recalcula o somatório do cabeçalho local toda vez que o array de vendas mudar
  useEffect(() => {
    const filtroMesExtenso = selectedMonth === "Mai" ? "Maio" : selectedMonth;
    const comissoesDoMesComCheck = projectedSales
      .filter(sale => (sale.month === filtroMesExtenso || sale.month === selectedMonth) && sale.received)
      .reduce((sum, sale) => sum + sale.commission, 0);

    setCommissionsReceived(comissoesDoMesComCheck);
  }, [projectedSales, selectedMonth]);

  const handleUpdateBalance = (amount: number) => {
    setCommissionsReceived(prev => prev + amount);
  };

  const handleUpdateExpenses = (amount: number) => {
    setTotalExpenses(amount);
  };

  const handleAddCommission = (amount: number) => {
    setCommissionsReceived(prev => prev + amount);
  };

  // 🚀 LÓGICA 1 e 2: Salva a partir da calculadora, com o mês escolhido e check obrigatoriamente FALSE
const handleAddProjectedSale = (sale: Omit<ProjectedSale, 'id'>) => {
    // Mantenha aqui a palavra exata que você confirmou no Sheety
    const payload = {
      ganhosEComissoes: { 
        descricao: "Comissão de Venda Projetada",
        valorImovel: sale.propertyValue,
        valor: sale.commission,
        mesReferencia: sale.month,
        recebido: false
      }
    };

    fetch(URL_GANHOS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    .then(async res => {
      const data = await res.json();
      
      // Se o Sheety bloquear, ele vai avisar o motivo exato aqui!
      if (!res.ok) {
        alert("🚨 ERRO DO SHEETY: " + JSON.stringify(data));
        throw new Error("Sheety bloqueou o envio");
      }
      
      return data;
    })
    .then(() => {
      // Se passar, ele vai dar sucesso e atualizar a tela!
      alert("✅ SALVOU COM SUCESSO NA PLANILHA!");
      carregarVendasDoBanco();
    })
    .catch(err => {
      console.error("Erro interno:", err);
    });
  };

  // 🔘 LÓGICA 4: Altera o status do check na planilha e atualiza o saldo na hora
  const handleToggleReceived = (id: string) => {
    const vendaAlvo = projectedSales.find(s => s.id === id);
    if (!vendaAlvo) return;

    const novoStatus = !vendaAlvo.received;

    const payload = {
      ganhosEComissoe: {
        recebido: novoStatus
      }
    };

    fetch(`${URL_GANHOS}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    .then(() => {
      setProjectedSales(prev => prev.map(sale => {
        if (sale.id === id) {
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
        <MonthSelector selectedMonth={selectedMonth} onSelect={setSelectedMonth} />

        <div className="w-full space-y-6 mt-2">
          <MonthDetailView month={selectedMonth} onUpdateBalance={handleUpdateBalance} />
          
          <ExpenseAnalysis
            onUpdateBalance={handleUpdateBalance}
            onUpdateExpenses={handleUpdateExpenses}
            totalIncome={totalIncome}
            selectedMonth={selectedMonth}
          />

          <ExtraExpensesProjection selectedMonth={selectedMonth} />

          <AnnualGoals projectedSales={projectedSales} onToggleReceived={handleToggleReceived} />

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