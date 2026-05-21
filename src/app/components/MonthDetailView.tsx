import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GlassCard } from "./GlassCard";
import { ArrowUpRight, ArrowDownRight, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { clsx } from "clsx";
// 📍 Lembrete: Mantenha o caminho de importação abaixo do jeito que funcionou para você no deploy!
import type { ProjectedSale, ExtraExpense } from "../Dashboard";

interface MonthDetailViewProps {
  month: string;
  projectedSales?: ProjectedSale[];
  extraExpenses?: ExtraExpense[];
  fixedExpensesData?: any[];
  variableExpensesData?: any[];
}

const monthNames: { [key: string]: string } = {
  "Jan": "Janeiro", "Fev": "Fevereiro", "Mar": "Março", "Abr": "Abril",
  "Mai": "Maio", "Jun": "Junho", "Jul": "Julho", "Ago": "Agosto",
  "Set": "Setembro", "Out": "Outubro", "Nov": "Novembro", "Dez": "Dezembro"
};

const categoryNames: Record<string, string> = {
  alimentacao: "Alimentação", lazer: "Lazer", transporte: "Transporte", outros: "Outros"
};

// 📍 FUNÇÃO NOVA: Limpa a data gigante do Google e transforma em "DD/MM"
const formatShortDate = (dateString: string) => {
  if (!dateString) return "";
  
  // Se for o formato ISO do Google (ex: 2026-05-21T03:00...)
  if (dateString.includes("T")) {
    const d = new Date(dateString);
    if (!isNaN(d.getTime())) {
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
  }
  
  // Se já for formato normal (DD/MM/YYYY), pega só os dois primeiros
  if (dateString.includes("/")) {
    const parts = dateString.split("/");
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}`;
    }
  }
  
  return dateString; 
};

export function MonthDetailView({ month, projectedSales = [], extraExpenses = [], fixedExpensesData = [], variableExpensesData = [] }: MonthDetailViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const fullMonthName = monthNames[month] || month;

  const gastosExtrasDoMes = extraExpenses.filter(e => e.targetMonth === month || e.targetMonth === fullMonthName);

  const incomes = projectedSales
    .filter(sale => (sale.month === month || sale.month === fullMonthName) && sale.received)
    .map(sale => ({ id: sale.id, description: "Comissão de Venda", amount: sale.commission, date: "Meta Concluída" }));

  const fixedIncomes = [
    { id: "f1", description: "Quinzena 1", amount: 650.00, date: "01/05" },
    { id: "f2", description: "Quinzena 2", amount: 650.00, date: "15/05" },
  ];

  const aggregatedVariables = variableExpensesData.reduce((acc, curr) => {
    if (!acc[curr.category]) acc[curr.category] = { amount: 0, lastDate: curr.dateStr };
    acc[curr.category].amount += curr.amount;
    acc[curr.category].lastDate = curr.dateStr;
    return acc;
  }, {} as Record<string, { amount: number, lastDate: string }>);

  const expensesDisplay = [
    ...fixedExpensesData.map(f => ({ id: f.id, description: f.name, amount: f.amount, date: "Fixo Mensal", type: 'fixed' as const })),
    ...Object.entries(aggregatedVariables).map(([catId, data]: [string, any]) => ({ 
      id: `var-${catId}`, 
      description: categoryNames[catId] || catId, 
      amount: data.amount, 
      // 📍 APLICANDO A LIMPEZA DA DATA AQUI
      date: `Atualizado em: ${formatShortDate(data.lastDate)}`, 
      type: 'variable' as const 
    }))
  ];

  const totalCommissions = incomes.reduce((sum, income) => sum + income.amount, 0);
  const totalFixedIncome = fixedIncomes.reduce((sum, income) => sum + income.amount, 0);
  const totalIncome = totalCommissions + totalFixedIncome;

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="w-full mb-6 overflow-hidden">
      <GlassCard className="p-5">
        <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex items-center justify-between group">
          <h3 className="text-sm font-bold text-white">Visão Detalhada - {fullMonthName}</h3>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-white/40 uppercase tracking-wide">Ganhos Totais</span>
              <span className="text-sm font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            {isExpanded ? <ChevronUp size={18} className="text-white/50 group-hover:text-white/80" /> : <ChevronDown size={18} className="text-white/50 group-hover:text-white/80" />}
          </div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-5 overflow-hidden mt-5 pt-5 border-t border-white/10">
              
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-cyan-400/80 uppercase tracking-wide flex items-center gap-2"><ArrowUpRight size={14} /> Ganhos Recebidos</h4>
                {incomes.length === 0 && <p className="text-xs text-white/30 italic px-2">Nenhuma comissão recebida.</p>}