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
  { id: "alimentacao", name: "Alimentação", icon: Coffee, color: "bg-orange-500" },
  { id: "lazer", name: "Lazer", icon: ShoppingBag, color: "bg-fuchsia-500" },
  { id: "transporte", name: "Transporte", icon: Zap, color: "bg-pink-500" },
  { id: "outros", name: "Outros", icon: MoreHorizontal, color: "bg-cyan-500" },
];

interface ExpenseAnalysisProps {
  onUpdateBalance?: (amount: number) => void;
  onUpdateExpenses?: (totalExpenses: number) => void;
  totalIncome?: number;
  selectedMonth?: string;
}

const URL_MOVIMENTACAO = "https://api.sheety.co/b848ca0bc11ef70702138c361ae712a0/webAppPlanejamentoFinanceiro/movimentacaoVariavel";
const URL_FIXOS = "https://api.sheety.co/b848ca0bc11ef70702138c361ae712a0/webAppPlanejamentoFinanceiro/gastosFixos";

export function ExpenseAnalysis({ onUpdateBalance, onUpdateExpenses, totalIncome = 1300, selectedMonth = "Mai" }: ExpenseAnalysisProps) {
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
    fetch(URL_FIXOS)
      .then(res => res.json())
      .then(data => {
        if (data.gastosFixos) {
          const carregados = data.gastosFixos.map((item: any) => {
            const iconObj = iconOptions.find(o => o.name.toLowerCase() === String(item.iconeRef || "").toLowerCase()) || iconOptions[0];
            return {
              id: item.id,
              name: item.categoria,
              amount: Number(item.valor || 0),
              icon: iconObj.icon,
              color: iconObj.color
            };
          });
          setFixedExpenses(carregados);
        }
      });

    fetch(URL_MOVIMENTACAO)
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
        movimentacaoVariavel: {
          idMov: `MV-${Date.now()}`,
          data: new Date().toLocaleDateString('pt-BR'),
          categoria: nomeCategoriaExibicao,
          valor: value,
          mesReferencia: selectedMonth === "Mai" ? "Maio" : selectedMonth
        }
      };

      fetch(URL_MOVIMENTACAO, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      .then(res => res.json())
      .then(data => {
        const newExpense: VariableExpense = {
          id: String(data.movimentacaoVariavel.id),
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
      .catch(err => console.error(err));
    }
  };

  const handleRemoveTodayExpense = (id: string) => {
    const expense = todayExpenses.find(exp => exp.id === id);
    if (!expense) return;

    fetch(`${URL_MOVIMENTACAO}/${id}`, { method: "DELETE" })
    .then(() => {
      if (onUpdateBalance) onUpdateBalance(expense.amount);
      setTodayExpenses(prev => prev.filter(exp => exp.id !== id));
    });
  };

  const handleDeleteFixed = (id: number | string) => {
    fetch(`${URL_FIXOS}/${id}`, { method: "DELETE" })
    .then(() => {
      setFixedExpenses(prev => prev.filter(exp => exp.id !== id));
    });
  };

  const handleAddFixed = () => {
    const amount = parseFloat(newFixed.amount.replace(/\D/g, '')) / 100 || 0;
    if (newFixed.name && amount > 0) {
      const selectedIcon = iconOptions[newFixed.iconIndex];
      
      const payload = {
        gastosFixo: {
          idFixo: `FX-${Date.now()}`,
          categoria: newFixed.name,
          valor: amount,
          iconeRef: selectedIcon.name.toLowerCase()
        }
      };

      fetch(URL_FIXOS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      .then(res => res.json())
      .then(data => {
        const newExpense: FixedExpense = {
          id: data.gastosFixo.id,
          name: newFixed.name,
          amount,
          icon: selectedIcon.icon,
          color: selectedIcon.color
        };
        setFixedExpenses(prev => [...prev, newExpense]);
        setNewFixed({ name: "", amount: "", iconIndex: 0 });
        setAddingFixed(false);
      });
    }
  };

  const totalFixed = fixedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalVariable = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalExpenses = totalFixed + totalVariable;

  useEffect(() => {
    if (onUpdateExpenses) onUpdateExpenses(totalExpenses);
  }, [totalExpenses, onUpdateExpenses]);

  return (
    <div className="space-y-6 w-full">
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Gastos Variáveis</h2>
          {todayExpenses.length > 0 && (
            <button onClick={() => setShowTodayExpenses(!showTodayExpenses)} className={clsx("p-2 rounded-lg text-white/50", showTodayExpenses && "bg-fuchsia-500/20 text-fuchsia-400")}>
              <Edit3 size={16} />
            </button>
          )}
        </div>

        <div className="mb-5 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
          <p className="text-xs text-white/50 mb-2 font-medium">Adicionar gasto de hoje</p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">R$</span>
            <input type="text" inputMode="numeric" value={quickExpense} onChange={handleExpenseInput} placeholder="0,00" className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-white outline-none" />
          </div>

          <AnimatePresence>
            {showCategorySelector && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 grid grid-cols-2 gap-2">
                {variableCategories.map(cat => {
                  const Icon = cat.icon;
                  return (
                    <button key={cat.id} onClick={() => handleCategorySelect(cat.id)} className={clsx("py-2 px-3 rounded-xl border-2 bg-white/5 text-white/70 flex items-center gap-2", cat.id === "alimentacao" && "border-orange-500/50 text-orange-400", cat.id === "lazer" && "border-fuchsia-500/50 text-fuchsia-400", cat.id === "transporte" && "border-pink-500/50 text-pink-400", cat.id === "outros" && "border-cyan-500/50 text-cyan-400")}>
                      <Icon size={14} />
                      <span className="text-xs font-semibold">{cat.name}</span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showTodayExpenses && todayExpenses.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 space-y-2 max-h-[150px] overflow-y-auto no-scrollbar">
                {todayExpenses.map(exp => (
                  <div key={exp.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-2">
                    <span className="text-xs text-white/70">{variableCategories.find(c => c.id === exp.category)?.name}</span>
                    <span className="text-sm font-bold text-white">R$ {exp.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <button onClick={() => handleRemoveTodayExpense(exp.id)} className="text-red-400 p-1 hover:bg-red-500/20 rounded"><Trash2 size={14} /></button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-5">
          {categoryTotals.map((category) => {
            const percent = Math.min((category.spent / totalIncome) * 100, 100);
            const valueColor = category.id === "alimentacao" ? "text-orange-400" : category.id === "lazer" ? "text-fuchsia-400" : category.id === "transporte" ? "text-pink-400" : "text-cyan-400";

            return (
              <div key={category.id} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium text-white/90">{category.name}</span>
                  <span className="text-sm font-medium">
                    <span className={valueColor}>R$ {category.spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span className="text-white/30"> / R$ </span>
                    {/* 📍 COMPARAÇÃO CRÍTICA DINÂMICA COMPATÍVEL COM BASE EM PORTUGUÊS */}
                    <span className="text-white/50">{(totalIncome * (category.id === "alimentacao" ? 0.40 : category.id === "lazer" ? 0.30 : 0.15)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </span>
                </div>
                <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border-[0.5px] border-white/10 relative">
                  <motion.div animate={{ width: `${percent}%` }} className={clsx("h-full rounded-full relative", category.color)} />
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* CARD DE GASTOS FIXOS COM RECURSO PODEROSO DE ADIÇÃO ADICIONADO */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Gastos Fixos
            <span className="text-xs font-normal text-white/50 bg-white/10 px-2 py-1 rounded-full">
              R$ {totalFixed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </h2>
          <button onClick={() => setEditingFixed(!editingFixed)} className={clsx("p-2 rounded-lg text-white/50", editingFixed && "bg-fuchsia-500/20 text-fuchsia-400")}><Edit3 size={16} /></button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          {fixedExpenses.map((expense) => {
            const Icon = expense.icon;
            return (
              <div key={expense.id} className="relative group flex flex-col items-center gap-2 bg-white/5 p-3 rounded-2xl border border-white/5">
                {editingFixed && (
                  <button onClick={() => handleDeleteFixed(expense.id)} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white z-10"><X size={12} /></button>
                )}
                <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center text-white/80", expense.color)}>
                  <Icon size={18} />
                </div>
                <span className="text-[10px] text-white/60 truncate w-full text-center">{expense.name}</span>
                <span className="text-xs font-bold text-white">R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            );
          })}
        </div>

        {editingFixed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
            {!addingFixed ? (
              <button onClick={() => setAddingFixed(true)} className="w-full py-2 rounded-xl bg-white/5 border border-dashed border-white/20 hover:bg-white/10 text-xs text-white/60 flex items-center justify-center gap-2"><Plus size={14} /> Adicionar Item Fixo</button>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-3">
                <input type="text" value={newFixed.name} onChange={(e) => setNewFixed({ ...newFixed, name: e.target.value })} placeholder="Nome (Ex: Aluguel)" className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white outline-none" />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-xs">R$</span>
                  <input type="text" inputMode="numeric" value={newFixed.amount} onChange={(e) => setNewFixed({ ...newFixed, amount: handleFormatCurrency(e.target.value) })} placeholder="0,00" className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white outline-none" />
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {iconOptions.map((opt, idx) => {
                    const Icon = opt.icon;
                    return <button key={idx} onClick={() => setNewFixed({ ...newFixed, iconIndex: idx })} className={clsx("w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border text-white/40", newFixed.iconIndex === idx ? "border-fuchsia-500 text-fuchsia-400 bg-fuchsia-500/10" : "border-white/10")}><Icon size={14} /></button>
                  })}
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAddFixed} className="flex-1 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-fuchsia-600 text-xs font-bold text-white">Adicionar</button>
                  <button onClick={() => setAddingFixed(false)} className="py-1.5 px-3 rounded-lg bg-white/5 border border-white/10 text-xs text-white">Sair</button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </GlassCard>
    </div>
  );
}