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
  const totalIncome = fixedIncome + commissionsReceived;
  const balance = totalIncome - totalExpenses;

  const URL_NATIVA_GOOGLE = "https://script.google.com/macros/s/AKfycbxpk3OuNbMN-e_apaCakfHBtY_gnXWK5Yl_V-C0sGeSft1WRtHwaEmzZVXRC0jpYS9L/exec";

  // 🔄 BUSCA AS VENDAS DA API DO GOOGLE
  const carregarVendasDoBanco = () => {
    fetch(`${URL_NATIVA_GOOGLE}?aba=ganhosEComissoes`)
      .then(res => res.json())
      .then(data => {
        if (data.ganhosEComissoes) {
          const formatado: ProjectedSale[] = data.ganhosEComissoes.map((item: any) => ({
            id: String(item.id), 
            propertyValue: Number(item.valorImovel || 0), 
            commission: Number(item.valor || 0), 
            month: item.mesReferencia || "Jun",
            received: item.recebido === "TRUE" || item.recebido === true || String(item.recebido).toLowerCase() === "true"
          }));
          setProjectedSales(formatado);
        }
      })
      .catch(err => console.error("Erro ao buscar Ganhos no Google Script:", err));
  };

  useEffect(() => {
    // Busca os dados da dashboard mensal usando o parâmetro da aba
    fetch(`${URL_NATIVA_GOOGLE}?aba=dashboardMensal`)
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

  // 🚀 LÓGICA 1 e 2: Salva via POST informando a ação INSERT para a API nativa
  const handleAddProjectedSale = (sale: Omit<ProjectedSale, 'id'>) => {
    const payload = {
      aba: "ganhosEComissoes",
      action: "INSERT",
      data: {
        descricao: "Comissão de Venda Projetada",
        valorImovel: sale.propertyValue, 
        valor: sale.commission, 
        mesReferencia: sale.month,
        recebido: false
      }
    };

    fetch(URL_NATIVA_GOOGLE, {
      method: "POST",
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(() => {
      carregarVendasDoBanco(); // 📍 LÓGICA 3: Força o card a se preencher sozinho na hora
    })
    .catch(err => console.error("Erro crítico ao salvar no Google Sheets:", err));
  };

  // 🔘 LÓGICA 4: Faz o check enviando um POST com a ação UPDATE para a API nativa
  const handleToggleReceived = (id: string) => {
    const vendaAlvo = projectedSales.find(s => s.id === id);
    if (!vendaAlvo) return;

    const novoStatus = !vendaAlvo.received;

    const payload = {
      aba: "ganhosEComissoes",
      action: "UPDATE",
      id: id,
      data: {
        recebido: novoStatus
      }
    };

    fetch(URL_NATIVA_GOOGLE, {
      method: "POST",
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