import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GlassCard } from "./GlassCard";
import { ArrowUpRight, ArrowDownRight, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { clsx } from "clsx";

// 📍 1. Adicionamos a interface para ele entender o que é uma venda projetada
interface ProjectedSale {
  id: string;
  propertyValue: number;
  commission: number;
  month: string;
  received: boolean;
}

interface FixedIncome {
  id: string;
  description: string;
  amount: number;
  date: string;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'fixed' | 'variable';
}

interface ExtraExpense {
  id: string;
  description: string;
  amount: number;
  targetMonth: string;
  creationMonth: string;
}

interface MonthDetailViewProps {
  month: string;
  onUpdateBalance?: (amount: number) => void;
  projectedSales?: ProjectedSale[];
  extraExpenses?: ExtraExpense[]; // 📍
}

const monthNames: { [key: string]: string } = {
  "Jan": "Janeiro", "Fev": "Fevereiro", "Mar": "Março", "Abr": "Abril",
  "Mai": "Maio", "Jun": "Junho", "Jul": "Julho", "Ago": "Agosto",
  "Set": "Setembro", "Out": "Outubro", "Nov": "Novembro", "Dez": "Dezembro"
};

export function MonthDetailView({ month, onUpdateBalance, projectedSales = [], extraExpenses = [] }: MonthDetailViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const fullMonthName = monthNames[month] || month;

  const gastosExtrasDoMes = extraExpenses.filter(e => 
  e.targetMonth === month || e.creationMonth === month
  );

  // 📍 3. O SEGREDO: Filtra dinamicamente as comissões daquele mês que estão com CHECK
  const incomes = projectedSales
    .filter(sale => (sale.month === month || sale.month === fullMonthName) && sale.received)
    .map(sale => ({
      id: sale.id,
      description: "Comissão de Venda",
      amount: sale.commission,
      date: "Meta Concluída"
    }));

  const [fixedIncomes] = useState<FixedIncome[]>([
    { id: "f1", description: "Quinzena 1", amount: 650.00, date: "01/05" },
    { id: "f2", description: "Quinzena 2", amount: 650.00, date: "15/05" },
  ]);

  const [expenses] = useState<Expense[]>([
    { id: "e1", description: "Cigarro", amount: 345.00, date: "01/05", type: 'fixed' },
    { id: "e2", description: "Maconha", amount: 360.00, date: "01/05", type: 'fixed' },
    { id: "e3", description: "Academia", amount: 110.00, date: "01/05", type: 'fixed' },
  ]);

  const totalCommissions = incomes.reduce((sum, income) => sum + income.amount, 0);
  const totalFixedIncome = fixedIncomes.reduce((sum, income) => sum + income.amount, 0);
  const totalIncome = totalCommissions + totalFixedIncome;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="w-full mb-6 overflow-hidden"
    >
      <GlassCard className="p-5">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between group"
        >
          <h3 className="text-sm font-bold text-white">
            Visão Detalhada - {fullMonthName}
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-white/40 uppercase tracking-wide">Ganhos Totais</span>
              <span className="text-sm font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
                R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            {isExpanded ? (
              <ChevronUp size={18} className="text-white/50 group-hover:text-white/80 transition-colors" />
            ) : (
              <ChevronDown size={18} className="text-white/50 group-hover:text-white/80 transition-colors" />
            )}
          </div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-5 overflow-hidden mt-5 pt-5 border-t border-white/10"
            >
              {/* Ganhos Recebidos (Comissões) */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-cyan-400/80 uppercase tracking-wide flex items-center gap-2">
                  <ArrowUpRight size={14} />
                  Ganhos Recebidos
                </h4>
                {incomes.length === 0 && (
                  <p className="text-xs text-white/30 italic px-2">Nenhuma comissão recebida neste mês.</p>
                )}
                {incomes.map((income) => (
                  <div
                    key={income.id}
                    className="p-3 rounded-xl border bg-cyan-500/5 border-cyan-500/10 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                          <ArrowUpRight size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{income.description}</p>
                          <p className="text-xs text-white/40">{income.date}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
                        R$ {income.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Ganhos Fixos Quinzenais */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-cyan-400/80 uppercase tracking-wide flex items-center gap-2">
                  <Calendar size={14} />
                  Ganhos Fixos
                </h4>
                {fixedIncomes.map((income) => (
                  <div key={income.id} className="p-3 rounded-xl border bg-cyan-500/5 border-cyan-500/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                          <Calendar size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{income.description}</p>
                          <p className="text-xs text-white/40">{income.date}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
                        R$ {income.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Gastos (Fixos e Variáveis) */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-orange-400/80 uppercase tracking-wide flex items-center gap-2">
                  <ArrowDownRight size={14} />
                  Gastos
                </h4>
                {expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className={clsx(
                      "p-3 rounded-xl border transition-all",
                      expense.type === 'fixed'
                        ? "bg-orange-500/10 border-orange-500/30"
                        : "bg-orange-500/5 border-orange-500/15"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={clsx(
                          "w-8 h-8 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(249,115,22,0.3)]",
                          expense.type === 'fixed'
                            ? "bg-orange-500/30 text-orange-400"
                            : "bg-orange-500/15 text-orange-300"
                        )}>
                          <ArrowDownRight size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {expense.description}
                            <span className="ml-2 text-[10px] text-white/40 uppercase">
                              {expense.type === 'fixed' ? 'Fixo' : 'Variável'}
                            </span>
                          </p>
                          <p className="text-xs text-white/40">{expense.date}</p>
                        </div>
                      </div>
                      <span className={clsx(
                        "text-sm font-bold drop-shadow-[0_0_8px_rgba(249,115,22,0.3)]",
                        expense.type === 'fixed' ? "text-orange-400" : "text-orange-300"
                      )}>
                        R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}

{gastosExtrasDoMes.map((extra) => (

  <div key={extra.id} className="p-3 rounded-xl border bg-purple-500/10 border-purple-500/30 flex items-center justify-between">

    <div className="flex items-center gap-3">

      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">

        <ArrowDownRight size={16} />

      </div>

      <div>

        <p className="text-sm font-medium text-white">{extra.description}</p>

        <p className="text-xs text-white/40">Gasto Extra (Prog. para {extra.targetMonth})</p>

      </div>

    </div>

    <span className="text-sm font-bold text-purple-400">

      R$ {extra.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

    </span>

  </div>

))} 


              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
}