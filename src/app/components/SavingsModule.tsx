import React, { useState, useEffect } from "react"; // 📍 CORREÇÃO: Adicionado useEffect
import { motion, AnimatePresence } from "motion/react";
import { PieChart, Pie, Cell } from "recharts";
import { GlassCard } from "./GlassCard";
import { Vault, Plus, TrendingUp, Calendar } from "lucide-react";

const URL_RESERVA = "https://api.sheety.co/b848ca0bc11ef70702138c361ae712a0/webAppPlanejamentoFinanceiro/reservaSemestral"; // 📍 CORREÇÃO: Link da Reserva Semestral

export function SavingsModule() {
  const [lockedAmount, setLockedAmount] = useState(0); // 📍 CORREÇÃO: Inicia em 0 até ler a planilha
  const [newAmount, setNewAmount] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const currentFixedIncome = 1300; 
  const monthlyIncrement = lockedAmount / 6; 

  const total = currentFixedIncome + monthlyIncrement;
  const incrementPercentage = total > 0 ? (monthlyIncrement / total) * 100 : 0;

  const data = [
    { name: "Ganho Fixo Atual", value: currentFixedIncome, color: "#22d3ee" }, 
    { name: "Incremento Projetado", value: monthlyIncrement, color: "#d946ef" } 
  ];

  // 🔄 📍 CORREÇÃO: Puxar a reserva em tempo real do banco de dados Sheets
  useEffect(() => {
    fetch(URL_RESERVA)
      .then(res => res.json())
      .then(data => {
        if (data.reservaSemestral && data.reservaSemestral.length > 0) {
          setLockedAmount(Number(data.reservaSemestral[0].valorRetido || 0));
        }
      })
      .catch(err => console.error("Erro ao ler Reserva:", err));
  }, []);

  // 🚀 📍 CORREÇÃO: Salvando e atualizando a linha no Sheets via PUT
  const handleAddAmount = () => {
    const value = parseFloat(newAmount.replace(/\D/g, '')) / 100 || 0;
    if (value > 0) {
      const novoTotalReserva = lockedAmount + value;

      fetch(`${URL_RESERVA}/2`, { // Atualiza a linha 2 da aba
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservaSemestral: {
            valorRetido: novoTotalReserva
          }
        })
      })
      .then(() => {
        setLockedAmount(novoTotalReserva);
        setNewAmount("");
        setIsAdding(false);
      })
      .catch(err => console.error("Erro ao atualizar poupança:", err));
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
          <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-orange-400">
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
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-xs text-white/50">+{incrementPercentage.toFixed(0)}%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-fuchsia-500/20 to-orange-500/20 border border-fuchsia-500/30 rounded-xl p-4 mb-3 relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-fuchsia-400" />
            <span className="text-xs text-white/70 font-semibold uppercase tracking-wide">Incremento Mensal</span>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-orange-400">
            +R$ {monthlyIncrement.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-sm text-white/50">/mês</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3 relative z-10">
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3">
          <span className="text-[10px] text-cyan-400/80 block mb-1">FIXO ATUAL</span>
          <span className="text-lg font-bold text-cyan-400">R$ {currentFixedIncome.toLocaleString('pt-BR')}</span>
        </div>
        <div className="bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-xl p-3">
          <span className="text-[10px] text-fuchsia-400/80 block mb-1">PROJETADO</span>
          <span className="text-lg font-bold text-fuchsia-400">R$ {total.toLocaleString('pt-BR')}</span>
        </div>
      </div>

      <AnimatePresence>
        {isAdding ? (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
            <input type="text" inputMode="numeric" value={newAmount} onChange={handleFormatCurrency} className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white outline-none" placeholder="0,00" />
            <div className="flex gap-2">
              <button onClick={handleAddAmount} className="flex-1 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-fuchsia-600 text-white text-sm font-medium">Travar Valor</button>
              <button onClick={() => setIsAdding(false)} className="py-2 px-3 rounded-lg bg-white/5 text-white text-sm">Cancelar</button>
            </div>
          </motion.div>
        ) : (
          <button onClick={() => setIsAdding(true)} className="w-full py-2.5 rounded-xl border border-dashed border-white/20 text-white/50 hover:text-white flex items-center justify-center gap-2"><Plus size={16} /><span className="text-sm font-medium">Adicionar Valor à Reserva</span></button>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}