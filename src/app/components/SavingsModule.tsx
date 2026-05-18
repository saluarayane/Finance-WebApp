import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PieChart, Pie, Cell } from "recharts";
import { GlassCard } from "./GlassCard";
import { Vault, Plus, TrendingUp, Calendar } from "lucide-react";

export function SavingsModule() {
  const [lockedAmount, setLockedAmount] = useState(3000);
  const [newAmount, setNewAmount] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const currentFixedIncome = 1300; // Ganho Fixo Atual (R$ 1.300,00)
  const monthlyIncrement = lockedAmount / 6; // Incremento mensal proveniente da reserva

  // Dados para o gráfico donut: Ganho Fixo Atual vs Incremento Projetado
  const total = currentFixedIncome + monthlyIncrement;
  const incrementPercentage = (monthlyIncrement / total) * 100;

  const data = [
    { name: "Ganho Fixo Atual", value: currentFixedIncome, color: "#22d3ee" }, // cyan-400
    { name: "Incremento Projetado", value: monthlyIncrement, color: "#d946ef" } // fuchsia-500
  ];

  const handleAddAmount = () => {
    const value = parseFloat(newAmount.replace(/\D/g, '')) / 100 || 0;
    if (value > 0) {
      setLockedAmount(prev => prev + value);
      setNewAmount("");
      setIsAdding(false);
    }
  };

  const handleFormatCurrency = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/\D/g, "");
    if (value) {
      value = (parseInt(value) / 100).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      setNewAmount(value);
    } else {
      setNewAmount("");
    }
  };

  return (
    <GlassCard className="p-5 flex flex-col relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-32 h-32 bg-fuchsia-600/20 blur-[40px] rounded-full pointer-events-none" />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
            Reserva e Projeção de Crescimento
            <Vault size={16} className="text-fuchsia-400" />
          </h2>
          <p className="text-sm text-white/50">Investimento para aumento do ganho fixo</p>
        </div>
      </div>

      <div className="flex items-center justify-between relative z-10 mb-4">
        <div className="flex flex-col flex-1">
          <span className="text-sm text-white/50 mb-1">Reserva Semestral</span>
          <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-orange-400 drop-shadow-[0_0_10px_rgba(217,70,239,0.3)]">
            R$ {lockedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="w-28 h-28 relative">
          <PieChart width={112} height={112}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={50}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
              cornerRadius={8}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  style={{ filter: `drop-shadow(0px 0px 10px ${entry.color})` }}
                />
              ))}
            </Pie>
          </PieChart>
          {/* Centro do donut com percentual */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-xs text-white/50">+{incrementPercentage.toFixed(0)}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Incremento Mensal em Destaque */}
      <div className="bg-gradient-to-r from-fuchsia-500/20 to-orange-500/20 border border-fuchsia-500/30 rounded-xl p-4 mb-3 relative z-10 shadow-[0_0_20px_rgba(217,70,239,0.2)]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-fuchsia-400" />
            <span className="text-xs text-white/70 font-semibold uppercase tracking-wide">Incremento Mensal</span>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-orange-400 drop-shadow-[0_0_15px_rgba(217,70,239,0.5)]">
            +R$ {monthlyIncrement.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-sm text-white/50">/mês</span>
        </div>
        <p className="text-xs text-white/40 mt-2">
          Adicionado ao ganho fixo dos próximos 6 meses
        </p>
      </div>

      {/* Breakdown: Ganho Fixo Atual + Incremento */}
      <div className="grid grid-cols-2 gap-3 mb-3 relative z-10">
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
            <span className="text-[10px] text-cyan-400/80 uppercase tracking-wide">Fixo Atual</span>
          </div>
          <span className="text-lg font-bold text-cyan-400">
            R$ {currentFixedIncome.toLocaleString('pt-BR')}
          </span>
        </div>

        <div className="bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-fuchsia-400 shadow-[0_0_8px_rgba(217,70,239,0.6)]" />
            <span className="text-[10px] text-fuchsia-400/80 uppercase tracking-wide">Projetado</span>
          </div>
          <span className="text-lg font-bold text-fuchsia-400">
            R$ {total.toLocaleString('pt-BR')}
          </span>
        </div>
      </div>

      {/* Add amount button */}
      <AnimatePresence>
        {isAdding ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden relative z-10"
          >
            <div className="bg-white/5 border border-fuchsia-500/30 rounded-xl p-3 space-y-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={newAmount}
                  onChange={handleFormatCurrency}
                  placeholder="0,00"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddAmount()}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-fuchsia-500/50 transition-all placeholder:text-white/30"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddAmount}
                  className="flex-1 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-fuchsia-600 text-white text-sm font-medium transition-all active:scale-95"
                >
                  Travar Valor
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewAmount("");
                  }}
                  className="py-2 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-medium transition-all active:scale-95"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-2.5 rounded-xl border border-dashed border-white/20 text-white/50 hover:text-white/80 hover:border-white/40 transition-all flex items-center justify-center gap-2 group relative z-10"
          >
            <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
            <span className="text-sm font-medium">Adicionar Valor à Reserva</span>
          </button>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
