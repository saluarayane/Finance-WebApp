import React, { useState } from "react";
import { GlassCard } from "./GlassCard";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import type { ExtraExpense } from "../app/Dashboard"; 

interface ExtraExpensesProjectionProps {
  selectedMonth?: string;
  extraExpenses?: ExtraExpense[];
  onAddExtraExpense?: (data: { description: string, amount: number, targetMonth: string }) => void;
  onDeleteExtraExpense?: (id: string) => void;
}

const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const URL_NATIVA_GOOGLE = "https://script.google.com/macros/s/AKfycbxpk3OuNbMN-e_apaCakfHBtY_gnXWK5Yl_V-C0sGeSft1WRtHwaEmzZVXRC0jpYS9L/exec";

export function ExtraExpensesProjection({ selectedMonth = "Mai", extraExpenses = [], onAddExtraExpense, onDeleteExtraExpense }: ExtraExpensesProjectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newExpense, setNewExpense] = useState({ name: "", amount: "", month: "Mai" });

  const handleAddClick = () => {
    const amount = parseFloat(newExpense.amount.replace(/\D/g, "")) / 100 || 0;
    if (newExpense.name && amount > 0 && onAddExtraExpense) {
      onAddExtraExpense({ description: newExpense.name, amount: amount, targetMonth: newExpense.month });
      setNewExpense({ name: "", amount: "", month: selectedMonth });
      setIsAdding(false);
    }
  };

  const handleDeleteExpense = (id: string) => {
    // 1. Avisa o Dashboard para remover da memória instantaneamente e recalcular os totais
    if (onDeleteExtraExpense) {
      onDeleteExtraExpense(id);
    }

    // 2. Manda a ordem de exclusão silenciosa para o Google Sheets
    fetch(URL_NATIVA_GOOGLE, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ aba: "GASTOS_EXTRAS", action: "DELETE", id: id })
    }).catch(err => console.error("Erro ao deletar no Google:", err));
  };

  const currentMonthIndex = months.indexOf(selectedMonth);
  const expensesFiltradas = extraExpenses.filter((e) => months.indexOf(e.targetMonth) >= currentMonthIndex);
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
        {expensesFiltradas.map((expense) => (
          <div key={expense.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 group hover:border-white/20 transition-all backdrop-blur-sm">
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{expense.description}</p>
              <p className="text-xs text-white/30">Programado para {expense.targetMonth}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-orange-400">R$ {expense.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              <button onClick={() => handleDeleteExpense(expense.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/20 text-red-400">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {isAdding && (
          <div className="p-3 rounded-xl bg-white/5 border border-fuchsia-500/30 space-y-3">
             <input type="text" value={newExpense.name} onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })} placeholder="Nome do gasto" className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white outline-none" />
             <input type="text" value={newExpense.amount} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setNewExpense({ ...newExpense, amount: v ? (parseInt(v)/100).toLocaleString('pt-BR', {minimumFractionDigits:2}) : ""})}} placeholder="0,00" className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white outline-none" />
             <select value={newExpense.month} onChange={(e) => setNewExpense({ ...newExpense, month: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-lg py-2 px-3 text-sm text-white outline-none">
               {months.map(m => <option key={m} value={m}>{m}</option>)}
             </select>
             <div className="flex gap-2">
               <button onClick={handleAddClick} className="flex-1 py-2 rounded-lg bg-fuchsia-600 text-white text-sm">Adicionar</button>
               <button onClick={() => setIsAdding(false)} className="py-2 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm">Cancelar</button>
             </div>
          </div>
        )}
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="w-full py-3 rounded-xl border border-dashed border-white/20 text-white/50 text-sm flex items-center justify-center gap-2 hover:bg-white/5 hover:text-white transition-all">
            <Plus size={16} /> Novo Gasto Sazonal
          </button>
        )}
      </div>
    </GlassCard>
  );
}