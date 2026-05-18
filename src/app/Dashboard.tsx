import { useState } from "react";
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

  // Ganhos: Fixos (quinzenais) + Comissões Recebidas
  const fixedIncome = 1300; // R$ 650 x 2 quinzenas
  const [commissionsReceived, setCommissionsReceived] = useState(23270.50);
  const totalIncome = fixedIncome + commissionsReceived;

  // Saldo = Ganhos - Gastos
  const balance = totalIncome - totalExpenses;

  const [projectedSales, setProjectedSales] = useState<ProjectedSale[]>([
    { id: "1", propertyValue: 450000, commission: 7875, month: "Jun", received: false },
    { id: "2", propertyValue: 320000, commission: 5600, month: "Jul", received: false },
  ]);

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
    const newSale: ProjectedSale = {
      ...sale,
      id: Date.now().toString()
    };
    setProjectedSales(prev => [...prev, newSale]);
  };

  const handleToggleReceived = (id: string) => {
    setProjectedSales(prev => prev.map(sale => {
      if (sale.id === id) {
        const newReceivedState = !sale.received;
        // Update balance when marking as received/unreceived
        if (newReceivedState) {
          handleAddCommission(sale.commission);
        } else {
          handleAddCommission(-sale.commission);
        }
        return { ...sale, received: newReceivedState };
      }
      return sale;
    }));
  };

  return (
    <div className="min-h-screen text-white font-sans relative pb-32 selection:bg-fuchsia-500/30">
      <BackgroundOrbs />

      {/* Mobile-first container */}
      <div className="max-w-md mx-auto w-full px-6 pt-10 flex flex-col items-center">

        {/* 1. Saldo do Mês */}
        <Header balance={balance} />

        {/* Navigation */}
        <MonthSelector
          selectedMonth={selectedMonth}
          onSelect={setSelectedMonth}
        />

        {/* Main Content Area */}
        <div className="w-full space-y-6 mt-2">

          {/* 2. Visão Detalhada */}
          <MonthDetailView month={selectedMonth} onUpdateBalance={handleUpdateBalance} />

          {/* 3. Gastos Variáveis + 4. Gastos Fixos */}
          <ExpenseAnalysis
            onUpdateBalance={handleUpdateBalance}
            onUpdateExpenses={handleUpdateExpenses}
            totalIncome={totalIncome}
          />

          {/* 5. Projeção de Gastos Extras */}
          <ExtraExpensesProjection />

          {/* 6. Metas Anuais */}
          <AnnualGoals
            projectedSales={projectedSales}
            onToggleReceived={handleToggleReceived}
          />

          {/* 7. Fundo de Reserva Semestral */}
          <SavingsModule />

        </div>
      </div>

      {/* Commission Calculator Bottom Sheet */}
      <CommissionCalculator
        onAddCommission={handleAddCommission}
        onAddProjectedSale={handleAddProjectedSale}
      />
    </div>
  );
}
