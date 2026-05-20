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

  // 📍 MANTENHA A SUA URL DO APPS SCRIPT AQUI
  const URL_NATIVA_GOOGLE = "https://script.google.com/macros/s/AKfycbxpk3OuNbMN-e_apaCakfHBtY_gnXWK5Yl_V-C0sGeSft1WRtHwaEmzZVXRC0jpYS9L/exec";

  const carregarVendasDoBanco = () => {
    // 📍 CORREÇÃO 1: Pedindo a aba com o nome MAIÚSCULO exato
    fetch(`${URL_NATIVA_GOOGLE}?aba=GANHOS_E_COMISSOES`)
      .then(res => res.json())
      .then(data => {
        // 📍 O Google devolve o objeto com a chave idêntica ao nome da aba
        if (data.GANHOS_E_COMISSOES) {
          const formatado: ProjectedSale[] = data.GANHOS_E_COMISSOES.map((item: any) => ({
            id: String(item.id), 
            propertyValue: Number(item.valorImovel || item.valor_imovel || 0), 
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
    fetch(`${URL_NATIVA_GOOGLE}?aba=DASHBOARD_MENSAL`)
      .then(res => res.json())
      .then(data => {
        if (data.DASHBOARD_MENSAL && data.DASHBOARD_MENSAL.length > 0) {
          const dadosMes = data.DASHBOARD_MENSAL[0]; 
          setTotalExpenses(Number(dadosMes.gastosTotaisMensais || 0));
        }
      })
      .catch(err => console.error("Erro ao buscar Dashboard:", err));

    carregarVendasDoBanco();
  }, [selectedMonth]); 

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

const handleAddProjectedSale = (sale: Omit<ProjectedSale, 'id'>) => {
    const payload = {
      aba: "GANHOS_E_COMISSOES", 
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
      headers: { "Content-Type": "text/plain;charset=utf-8" }, 
      body: JSON.stringify(payload)
    })
    .then(async res => {
      // Pega a resposta pura do Google antes de tentar ler como JSON
      const text = await res.text();
      
      try {
        const data = JSON.parse(text);
        if (data.error) {
          alert("🚨 O GOOGLE REJEITOU: " + data.error);
          throw new Error(data.error);
        }
        return data;
      } catch (e) {
        alert("🚨 ERRO BIZARRO DE CONEXÃO. O Google respondeu isso: \n" + text.substring(0, 150));
        throw new Error("Falha no parse do Google");
      }
    })
    .then(() => {
      alert("✅ DEU CERTO! O Google salvou e o Card vai atualizar agora.");
      carregarVendasDoBanco(); 
    })
    .catch(err => {
      alert("🛑 ERRO CRÍTICO (Provável CORS ou Link quebrado): " + err.message);
      console.error(err);
    });
  };

  const handleToggleReceived = (id: string) => {
    const vendaAlvo = projectedSales.find(s => s.id === id);
    if (!vendaAlvo) return;

    const novoStatus = !vendaAlvo.received;

    const payload = {
      aba: "GANHOS_E_COMISSOES",
      action: "UPDATE",
      id: id,
      data: {
        recebido: novoStatus
      }
    };

    fetch(URL_NATIVA_GOOGLE, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
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