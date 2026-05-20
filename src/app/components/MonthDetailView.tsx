import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GlassCard } from "./GlassCard";
import { ArrowUpRight, ArrowDownRight, ChevronDown, ChevronUp, Edit2, Trash2, Calendar } from "lucide-react";
import { clsx } from "clsx";

interface Income {
  id: string;
  description: string;
  amount: number;
  date: string;
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

interface MonthDetailViewProps {
  month: string;
  onUpdateBalance?: (amount: number) => void;
}

const monthNames: { [key: string]: string } = {
  "Jan": "Janeiro",
  "Fev": "Fevereiro",
  "Mar": "Março",
  "Abr": "Abril",
  "Mai": "Maio",
  "Jun": "Junho",
  "Jul": "Julho",
  "Ago": "Agosto",
  "Set": "Setembro",
  "Out": "Outubro",
  "Nov": "Novembro",
  "Dez": "Dezembro"
};

export function MonthDetailView({ month, onUpdateBalance }: MonthDetailViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Ganhos Recebidos (Comissões)
  const [incomes, setIncomes] = useState<Income[]>([]);

  // Ganhos Fixos Quinzenais
  const [fixedIncomes] = useState<FixedIncome[]>([
    { id: "f1", description: "Quinzena 1", amount: 650.00, date: "01/05" },
    { id: "f2", description: "Quinzena 2", amount: 650.00, date: "15/05" },
  ]);

  // Gastos (Fixos e Variáveis)
  const [expenses] = useState<Expense[]>([
    { id: "e1", description: "Cigarro", amount: 345.00, date: "01/05", type: 'fixed' },
    { id: "e2", description: "Maconha", amount: 360.00, date: "01/05", type: 'fixed' },
    { id: "e3", description: "Academia", amount: 110.00, date: "01/05", type: 'fixed' },
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState({ description: "", amount: "" });

  const totalCommissions = incomes.reduce((sum, income) => sum + income.amount, 0);
  const totalFixedIncome = fixedIncomes.reduce((sum, income) => sum + income.amount, 0);
  const totalIncome = totalCommissions + totalFixedIncome;

  const handleDelete = (id: string) => {
    const income = incomes.find(i => i.id === id);
    if (income && onUpdateBalance) {
      onUpdateBalance(-income.amount);
    }
    setIncomes(incomes.filter(i => i.id !== id));
  };

  const handleEditStart = (income: Income) => {
    setEditingId(income.id);
    setEditValue({
      description: income.description,
      amount: income.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
    });
  };

  const handleEditSave = (id: string) => {
    const amount = parseFloat(editValue.amount.replace(/\D/g, '')) / 100 || 0;
    const oldIncome = incomes.find(i => i.id === id);

    if (oldIncome && onUpdateBalance) {
      const difference = amount - oldIncome.amount;
      onUpdateBalance(difference);
    }

    setIncomes(incomes.map(i =>
      i.id === id
        ? { ...i, description: editValue.description, amount }
        : i
    ));
    setEditingId(null);
  };

  const handleFormatCurrency = (value: string) => {
    value = value.replace(/\D/g, "");
    if (value) {
      return (parseInt(value) / 100).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return "";
  };

  const fullMonthName = monthNames[month] || month;

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
                {incomes.map((income) => (
                  <div
                    key={income.id}
                    className={clsx(
                      "p-3 rounded-xl border transition-all group",
                      editingId === income.id
                        ? "bg-cyan-500/10 border-cyan-500/30"
                        : "bg-cyan-500/5 border-cyan-500/10 hover:border-cyan-500/30"
                    )}
                  >
                    {editingId === income.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editValue.description}
                          onChange={(e) => setEditValue({ ...editValue, description: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white outline-none focus:border-cyan-500/50 transition-all"
                          autoFocus
                        />
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">R$</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={editValue.amount}
                            onChange={(e) => setEditValue({ ...editValue, amount: handleFormatCurrency(e.target.value) })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-cyan-500/50 transition-all"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditSave(income.id)}
                            className="flex-1 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-400 text-white text-sm font-medium transition-all active:scale-95"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="py-1.5 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-medium transition-all active:scale-95"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
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
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
                            R$ {income.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <button
                              onClick={() => handleEditStart(income)}
                              className="p-1.5 rounded-lg hover:bg-cyan-500/20 text-cyan-400 transition-all"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(income.id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
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
                  <div
                    key={income.id}
                    className="p-3 rounded-xl border bg-cyan-500/5 border-cyan-500/10"
                  >
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
}
