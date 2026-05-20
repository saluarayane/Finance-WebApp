import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Cigarette, Leaf, Dumbbell, Coffee, ShoppingBag, Zap, Plus, Edit3, X, Trash2, Check, MoreHorizontal } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { clsx } from "clsx";

interface VariableExpense {
  id: string;
  amount: number;
  category: string;
  timestamp: Date;
}

interface FixedExpense {
  id: string | number;
  name: string;
  amount: number;
  icon: any;
  color: string;
}

const iconOptions = [
  { name: "Cigarro", icon: Cigarette, color: "text-cyan-400" },
  { name: "Maconha", icon: Leaf, color: "text-purple-400" },
  { name: "Academia", icon: Dumbbell, color: "text-fuchsia-400" },
  { name: "Alimentação", icon: Coffee, color: "text-orange-400" },
  { name: "Compras", icon: ShoppingBag, color: "text-pink-400" },
  { name: "Energia", icon: Zap, color: "text-yellow-400" },
];

const variableCategories = [
  { id: "alimentacao", name: "Alimentação", icon: Coffee, color: "bg-orange-500", pillColor: "from-orange-500 to-orange-600", borderColor: "border-orange-500/50" },
  { id: "lazer", name: "Lazer", icon: ShoppingBag, color: "bg-fuchsia-500", pillColor: "from-fuchsia-500 to-fuchsia-600", borderColor: "border-fuchsia-500/50" },
  { id: "transporte", name: "Transporte", icon: Zap, color: "bg-pink-500", pillColor: "from-pink-500 to-pink-600", borderColor: "border-pink-500/50" },
  { id: "outros", name: "Outros", icon: MoreHorizontal, color: "bg-cyan-500", pillColor: "from-cyan-500 to-cyan-600", borderColor: "border-cyan-500/50" },
];

interface ExpenseAnalysisProps {
  onUpdateBalance?: (amount: number) => void;
  onUpdateExpenses?: (totalExpenses: number) => void;
  totalIncome?: number;
  selectedMonth?: string;
}

const URL_NATIVA_GOOGLE = "https://script.google.com/macros/s/AKfycbxpk3OuNbMN-e_apaCakfHBtY_gnXWK5Yl_V-C0sGeSft1WRtHwaEmzZVXRC0jpYS9L/exec";

export function ExpenseAnalysis({ onUpdateBalance, onUpdateExpenses, totalIncome = 23270.50, selectedMonth = "Mai" }: ExpenseAnalysisProps) {
  const [quickExpense, setQuickExpense] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [todayExpenses, setTodayExpenses] = useState<VariableExpense[]>([]);
  const [showTodayExpenses, setShowTodayExpenses] = useState(false);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);

  const [editingFixed, setEditingFixed] = useState(false);
  const [addingFixed, setAddingFixed] = useState(false);
  const [newFixed, setNewFixed] = useState({ name: "", amount: "", iconIndex: 0 });

  useEffect(() => {
    // 🔄 Buscar Gastos Fixos via API Google
    fetch(`${URL_NATIVA_GOOGLE}?aba=gastosFixos`)
      .then(res => res.json())
      .then(data => {
        if (data.gastosFixos) {
          const carregados = data.gastosFixos.map((item: any) => {
            const iconObj = iconOptions.find(o => o.name.toLowerCase() === String(item.iconeRef || "").toLowerCase()) || iconOptions[0];
            return {
              id: String(item.id),
              name: item.categoria,
              amount: Number(item.valor || 0),
              icon: iconObj.icon,
              color: iconObj.color
            };
          });
          setFixedExpenses(carregados);
        }
      });

    // 🔄 Buscar Gastos Variáveis via API Google
    fetch(`${URL_NATIVA_GOOGLE}?aba=movimentacaoVariavel`)
      .then(res => res.json())
      .then(data => {
        if (data.movimentacaoVariavel) {
          const filtroMes = selectedMonth === "Mai" ? "Maio" : selectedMonth;
          const filtrados = data.movimentacaoVariavel
            .filter((item: any) => item.mesReferencia === filtroMes)
            .map((item: any) => {
              const catId = variableCategories.find(c => c.name === item.categoria)?.id || "outros";
              return {
                id: String(item.id),
                amount: Number(item.valor || 0),
                category: catId,
                timestamp: new Date()
              };
            });
          setTodayExpenses(filtrados);
        }
      });
  }, [selectedMonth]);

  const categoryTotals = variableCategories.map(cat => ({
    ...cat,
    spent: todayExpenses
      .filter(exp => exp.category === cat.id)
      .reduce((sum, exp) => sum + exp.amount, 0)
  }));

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

  const handleExpenseInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = handleFormatCurrency(e.target.value);
    setQuickExpense(formatted);
    setShowCategorySelector(formatted !== "");
    setSelectedCategory(null);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const value = parseFloat(quickExpense.replace(/\D/g, '')) / 100 || 0;
    const nomeCategoriaExibicao = variableCategories.find(c => c.id === categoryId)?.name || "Outros";

    if (value > 0) {
      const payload = {
        aba: "movimentacaoVariavel",
        action: "INSERT",
        data: {
          data: new Date().toLocaleDateString('pt-BR'),
          categoria: nomeCategoriaExibicao,
          valor: value,
          mesReferencia: selectedMonth === "Mai" ? "Maio" : selectedMonth
        }
      };

      fetch(URL_NATIVA_GOOGLE, {
        method: "POST",
        body: JSON.stringify(payload)
      })
      .then(res => res.json())
      .then(data => {
        const newExpense: VariableExpense = {
          id: String(data.id), // Pega o ID gerado pelo GAS
          amount: value,
          category: categoryId,
          timestamp: new Date()
        };

        setTodayExpenses(prev => [...prev, newExpense]);
        if (onUpdateBalance) onUpdateBalance(-value);
        setQuickExpense("");
        setSelectedCategory(null);
        setShowCategorySelector(false);
      })
      .catch(err => console.error("Erro ao salvar gasto variável:", err));
    }
  };

  const handleRemoveTodayExpense = (id: string) => {
    const expense = todayExpenses.find(exp => exp.id === id);
    if (!expense) return;

    fetch(URL_NATIVA_GOOGLE, {
      method: "POST",
      body: JSON.stringify({ aba: "movimentacaoVariavel", action: "DELETE", id: id })
    })
    .then(() => {
      if (onUpdateBalance) onUpdateBalance(expense.amount);
      setTodayExpenses(prev => prev.filter(exp => exp.id !== id));
    })
    .catch(err => console.error("Erro ao deletar:", err));
  };

  const handleDeleteFixed = (id: number | string) => {
    fetch(URL_NATIVA_GOOGLE, {
      method: "POST",
      body: JSON.stringify({ aba: "gastosFixos", action: "DELETE", id: String(id) })
    })
    .then(() => {
      setFixedExpenses(prev => prev.filter(exp => exp.id !== id));
    })
    .catch(err => console.error("Erro ao deletar gasto fixo:", err));
  };

  const handleAddFixed = () => {
    const amount = parseFloat(newFixed.amount.replace(/\D/g, '')) / 100 || 0;
    if (newFixed.name && amount > 0) {
      const selectedIcon = iconOptions[newFixed.iconIndex];
      
      const payload = {
        aba: "gastosFixos",
        action: "INSERT",
        data: {
          categoria: newFixed.name,
          valor: amount,
          iconeRef: selectedIcon.name.toLowerCase()
        }
      };

      fetch(URL_NATIVA_GOOGLE, {
        method: "POST",
        body: JSON.stringify(payload)
      })
      .then(res => res.json())
      .then(data => {
        const newExpense: FixedExpense = {
          id: String(data.id),
          name: newFixed.name,
          amount,
          icon: selectedIcon.icon,
          color: selectedIcon.color
        };
        setFixedExpenses(prev => [...prev, newExpense]);
        setNewFixed({ name: "", amount: "", iconIndex: 0 });
        setAddingFixed(false);
      })
      .catch(err => console.error("Erro ao adicionar gasto fixo:", err));
    }
  };

  const totalFixed = fixedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalVariable = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalExpenses = totalFixed + totalVariable;

  useEffect(() => {
    if (onUpdateExpenses) {
      onUpdateExpenses(totalExpenses);
    }
  }, [totalExpenses, onUpdateExpenses]);

  return (
    <div className="space-y-6 w-full">
      {/* 📍 A PARTIR DAQUI O VISUAL CONTINUA 100% IDÊNTICO */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Gastos Variáveis
          </h2>
          {todayExpenses.length > 0 && (
            <button
              onClick={() => setShowTodayExpenses(!showTodayExpenses)}
              className={clsx(
                "p-2 rounded-lg transition-all",
                showTodayExpenses
                  ? "bg-fuchsia-500/20 text-fuchsia-400"
                  : "bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/10"
              )}
            >
              <Edit3 size={16} />
            </button>
          )}
        </div>

        <div className="mb-5 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
          <p className="text-xs text-white/50 mb-2 font-medium">Adicionar gasto de hoje</p>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">R$</span>
              <input
                type="text"
                inputMode="numeric"
                value={quickExpense}
                onChange={handleExpenseInput}
                placeholder="0,00"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-white outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all placeholder:text-white/20"
              />
            </div>
          </div>

          <AnimatePresence>
            {showCategorySelector && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {variableCategories.map(category => {
                    const Icon = category.icon;
                    const isOrange = category.id === "alimentacao";
                    const isPurple = category.id === "lazer";
                    const isPink = category.id === "transporte";
                    const isCyan = category.id === "outros";

                    return (
                      <button
                        key={category.id}
                        onClick={() => handleCategorySelect(category.id)}
                        className={clsx(
                          "py-2.5 px-3 rounded-xl border-2 transition-all backdrop-blur-md flex items-center justify-center gap-2",
                          "bg-white/5 hover:bg-white/10",
                          isOrange && "border-orange-500/60 text-orange-400 hover:border-orange-500/80",
                          isPurple && "border-fuchsia-500/60 text-fuchsia-400 hover:border-fuchsia-500/80",
                          isPink && "border-pink-500/60 text-pink-400 hover:border-pink-500/80",
                          isCyan && "border-cyan-500/60 text-cyan-400 hover:border-cyan-500/80"
                        )}
                      >
                        <Icon size={14} className="drop-shadow-[0_0_8px_currentColor]" />
                        <span className="text-xs font-semibold drop-shadow-[0_0_8px_currentColor]">{category.name}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showTodayExpenses && todayExpenses.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-2 overflow-hidden"
              >
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm space-y-2">
                  {todayExpenses.map(expense => {
                    const category = variableCategories.find(c => c.id === expense.category);
                    return (
                      <div
                        key={expense.id}
                        className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-2.5"
                      >
                        <div className="text-xs text-white/70 font-medium flex-1 text-left">
                          {category?.name}
                        </div>
                        <div className="text-sm font-bold text-white flex-1 text-center">
                          R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="flex-1 flex justify-end">
                          <button
                            onClick={() => handleRemoveTodayExpense(expense.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-5">
          {categoryTotals.map((category) => {
            const percent = Math.min((category.spent / totalIncome) * 100, 100);
            const isOrange = category.id === "alimentacao";
            const isPurple = category.id === "lazer";
            const isPink = category.id === "transporte";
            const valueColor = isOrange ? "text-orange-400" : isPurple ? "text-fuchsia-400" : isPink ? "text-pink-400" : "text-cyan-400";

            return (
              <div key={category.id} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium text-white/90">{category.name}</span>
                  <span className="text-sm font-medium">
                    <span className={valueColor}>R$ {category.spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span className="text-white/50"> / </span>
                    <span className="text-white/50">R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </span>
                </div>
                <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border-[0.5px] border-white/10 relative">
                  <motion.div
                    animate={{ width: `${percent}%` }}
                    className={clsx("h-full rounded-full relative overflow-hidden", category.color)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Gastos Fixos
            <span className="text-xs font-normal text-white/50 bg-white/10 px-2 py-1 rounded-full">
              R$ {totalFixed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </h2>
          <button onClick={() => setEditingFixed(!editingFixed)} className="p-2 rounded-lg bg-white/5 text-white/50"><Edit3 size={16} /></button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          {fixedExpenses.map((expense) => {
            const Icon = expense.icon;
            return (
              <div key={expense.id} className="relative group flex flex-col items-center gap-2">
                {editingFixed && (
                  <button onClick={() => handleDeleteFixed(expense.id)} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white z-10"><X size={12} /></button>
                )}
                <div className={clsx("w-12 h-12 rounded-2xl border flex items-center justify-center bg-white/5", expense.color)}>
                  <Icon size={20} />
                </div>
                <span className="text-[10px] text-white/60 truncate w-full text-center">{expense.name}</span>
                <span className="text-xs text-orange-400 font-bold">R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            );
          })}
        </div>

        {editingFixed && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
            {!addingFixed ? (
              <button onClick={() => setAddingFixed(true)} className="w-full py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-all flex items-center justify-center gap-2">
                <Plus size={16} /> <span className="text-sm">Adicionar Categoria Fixa</span>
              </button>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-3">
                <input type="text" value={newFixed.name} onChange={(e) => setNewFixed({ ...newFixed, name: e.target.value })} placeholder="Nome da categoria" className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white outline-none focus:border-fuchsia-500/50 transition-all placeholder:text-white/30" />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">R$</span>
                  <input type="text" inputMode="numeric" value={newFixed.amount} onChange={(e) => setNewFixed({ ...newFixed, amount: handleFormatCurrency(e.target.value) })} placeholder="0,00" className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-fuchsia-500/50" />
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {iconOptions.map((option, index) => {
                    const Icon = option.icon;
                    return (
                      <button key={index} onClick={() => setNewFixed({ ...newFixed, iconIndex: index })} className={clsx("w-10 h-10 rounded-lg flex items-center justify-center transition-all", newFixed.iconIndex === index ? "bg-fuchsia-500/30 border-fuchsia-400/50 border" : "bg-white/5 border border-white/10", option.color)}>
                        <Icon size={16} />
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAddFixed} className="flex-1 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-fuchsia-600 text-white text-sm font-medium transition-all active:scale-95">Adicionar</button>
                  <button onClick={() => { setAddingFixed(false); setNewFixed({ name: "", amount: "", iconIndex: 0 }); }} className="py-2 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm">Cancelar</button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </GlassCard>
    </div>
  );
}