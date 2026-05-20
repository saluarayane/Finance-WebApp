import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GlassCard } from "./GlassCard";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { clsx } from "clsx";

interface ExtraExpense {
  id: string;
  name: string;
  amount: number;
  month: string;
}

// Interface para receber o mês selecionado no topo do aplicativo
interface ExtraExpensesProjectionProps {
  selectedMonth?: string;
}

const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// 📍 URL da sua nova aba configurada e ativa no Sheety
const URL_GASTOS_EXTRAS = "https://api.sheety.co/b848ca0bc11ef70702138c361ae712a0/webAppPlanejamentoFinanceiro/gastosExtras";

export function ExtraExpensesProjection({ selectedMonth = "Mai" }: ExtraExpensesProjectionProps) {
  const [expenses, setExpenses] = useState<ExtraExpense[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newExpense, setNewExpense] = useState({ name: "", amount: "", month: "Mai" });

  // Converte o mês resumido do topo para o extenso correspondente da planilha se necessário
  const filtroMesExtenso = selectedMonth === "Mai" ? "Maio" : selectedMonth;

  // 🔄 1. BUSCAR GASTOS EXTRAS DA PLANILHA
  useEffect(() => {
    fetch(URL_GASTOS_EXTRAS)
      .then((res) => res.json())
      .then((data) => {
        if (data.gastosExtras) {
          const carregados = data.gastosExtras.map((item: any) => ({
            id: String(item.id), // Sheety ID sequencial para manipulação de rotas
            name: item.descricao,
            amount: Number(item.valor || 0),
            month: item.mesReferencia,
          }));
          setExpenses(carregados);
        }
      })
      .catch((err) => console.error("Erro ao buscar Gastos Extras:", err));
  }, [selectedMonth]); // Recarrega se mudar o mês ou salvar algo novo

  // 🚀 2. SALVAR NOVO GASTO EXTRA NO GOOGLE SHEETS
  const handleAddExpense = () => {
    const amount = parseFloat(newExpense.amount.replace(/\D/g, "")) / 100 || 0;
    const mesParaSalvar = newExpense.month === "Mai" ? "Maio" : newExpense.month;

    if (newExpense.name && amount > 0) {
      const payload = {
        gastosExtra: {
          idExtra: `EX-${Date.now()}`,
          descricao: newExpense.name,
          valor: amount,
          mesReferencia: mesParaSalvar, // Salva o mês escolhido no seletor do card
        },
      };

      fetch(URL_GASTOS_EXTRAS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => res.json())
        .then((data) => {
          const novoGasto: ExtraExpense = {
            id: String(data.gastosExtra.id),
            name: newExpense.name,
            amount,
            month: mesParaSalvar,
          };

          setExpenses((prev) => [...prev, novoGasto]);
          setNewExpense({ name: "", amount: "", month: selectedMonth });
          setIsAdding(false);
        })
        .catch((err) => console.error("Erro ao salvar gasto extra:", err));
    }
  };

  // 🗑️ 3. DELETAR GASTO EXTRA DA PLANILHA
  const handleDeleteExpense = (id: string) => {
    fetch(`${URL_GASTOS_EXTRAS}/${id}`, {
      method: "DELETE",
    })
      .then(() => {
        setExpenses((prev) => prev.filter((e) => e.id !== id));
      })
      .catch((err) => console.error("Erro ao deletar gasto extra:", err));
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

  // 📍 FILTRO CRÍTICO: Exibe no card apenas os gastos cujo mês bate com o seletor do topo
  const expensesFiltradas = expenses.filter(
    (e) => e.month === filtroMesExtenso || e.month === selectedMonth
  );

  const totalProjected = expensesFiltradas.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays size={18} className="text-fuchsia-400" />
          <h2 className="text-lg font-bold text-white">Projeção de Gastos Extras</h2>
        </div>
        <span className="text-xs font-normal text-white/50 bg-white/10 px-2 py-1 rounded-full">
          R$ {totalProjected.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </span>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {expensesFiltradas.map((expense) => (
            <motion.div
              key={expense.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 group hover:border-white/20 transition-all backdrop-blur-sm"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{expense.name}</p>
                <p className="text-xs text-white/30">Programado para {expense.month}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]">
                  R$ {expense.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
                <button
                  onClick={() => handleDeleteExpense(expense.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/20 text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-3 rounded-xl bg-white/5 border border-fuchsia-500/30 space-y-3">
                <input
                  type="text"
                  value={newExpense.name}
                  onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
                  placeholder="Nome do gasto (Ex: Viagem, IPTU)"
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white outline-none focus:border-fuchsia-500/50 transition-all placeholder:text-white/30"
                />
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-xs">R$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={newExpense.amount}
                      onChange={(e) =>
                        setNewExpense({ ...newExpense, amount: handleFormatCurrency(e.target.value) })
                      }
                      placeholder="0,00"
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-fuchsia-500/50 transition-all placeholder:text-white/30"
                    />
                  </div>
                  <select
                    value={newExpense.month}
                    onChange={(e) => setNewExpense({ ...newExpense, month: e.target.value })}
                    className="bg-slate-900/80 border border-white/10 rounded-lg py-2 px-3 text-sm text-white outline-none focus:border-fuchsia-500/50"
                  >
                    {months.map((month) => (
                      <option key={month} value={month} className="bg-slate-900">
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddExpense}
                    className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-orange-500 to-fuchsia-600 text-white text-sm font-medium transition-all active:scale-95"
                  >
                    Adicionar
                  </button>
                  <button
                    onClick={() => {
                      setIsAdding(false);
                      setNewExpense({ name: "", amount: "", month: selectedMonth });
                    }}
                    className="py-2 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-medium transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-3 rounded-xl border border-dashed border-white/20 text-white/50 hover:text-white/80 hover:border-white/40 transition-all flex items-center justify-center gap-2 group"
          >
            <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
            <span className="text-sm font-medium">Novo Gasto Sazonal</span>
          </button>
        )}
      </div>
    </GlassCard>
  );
}