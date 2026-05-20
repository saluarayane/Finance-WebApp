import React, { useState } from "react";
import { motion } from "motion/react";
import { GlassCard } from "./GlassCard";
import { Target, CheckCircle2, Circle, TrendingUp } from "lucide-react";
import { clsx } from "clsx";

export interface ProjectedSale {
  id: string;
  propertyValue: number;
  commission: number;
  month: string;
  received: boolean;
}

interface AnnualGoalsProps {
  projectedSales: ProjectedSale[];
  onToggleReceived: (id: string) => void;
}

export function AnnualGoals({ projectedSales, onToggleReceived }: AnnualGoalsProps) {
  const totalProjected = projectedSales.reduce((sum, sale) => sum + sale.commission, 0);
  const totalReceived = projectedSales
    .filter(sale => sale.received)
    .reduce((sum, sale) => sum + sale.commission, 0);
  const percentReceived = totalProjected > 0 ? (totalReceived / totalProjected) * 100 : 0;

  // Group sales by month
  const salesByMonth = projectedSales.reduce((acc, sale) => {
    if (!acc[sale.month]) {
      acc[sale.month] = [];
    }
    acc[sale.month].push(sale);
    return acc;
  }, {} as Record<string, ProjectedSale[]>);

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Target size={18} className="text-cyan-400" />
          <h2 className="text-lg font-bold text-white">Metas Anuais</h2>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/50">Projetado</p>
          <p className="text-sm font-bold text-cyan-400">
            R$ {totalProjected.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="mb-5 p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-white/60">Recebido</span>
          <span className="text-lg font-bold text-green-400">
            R$ {totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border-[0.5px] border-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentReceived}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-green-500 to-cyan-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]"
          />
        </div>
      </div>

      {/* Sales by Month */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
          <TrendingUp size={14} />
          Vendas Projetadas
        </h3>

        {Object.entries(salesByMonth).length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-white/40">Nenhuma venda projetada</p>
            <p className="text-xs text-white/30 mt-1">Use a calculadora para adicionar projeções</p>
          </div>
        ) : (
          Object.entries(salesByMonth).map(([month, sales]) => (
            <div key={month} className="space-y-2">
              <p className="text-xs font-medium text-white/50 uppercase tracking-wide">{month}</p>
              {sales.map((sale) => (
                <motion.div
                  key={sale.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={clsx(
                    "flex items-center justify-between p-3 rounded-xl border transition-all group cursor-pointer",
                    sale.received
                      ? "bg-green-500/10 border-green-500/30"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  )}
                  onClick={() => onToggleReceived(sale.id)}
                >
                  <div className="flex items-center gap-3">
                    {sale.received ? (
                      <CheckCircle2 size={20} className="text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
                    ) : (
                      <Circle size={20} className="text-white/30 group-hover:text-white/50 transition-colors" />
                    )}
                    <div>
                      <p className={clsx(
                        "text-sm font-medium",
                        sale.received ? "text-green-300" : "text-white"
                      )}>
                        Comissão de R$ {sale.propertyValue.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-xs text-white/40">
                        {sale.received ? "Recebido" : "Aguardando"}
                      </p>
                    </div>
                  </div>
                  <span className={clsx(
                    "text-sm font-bold",
                    sale.received ? "text-green-400" : "text-cyan-400"
                  )}>
                    R$ {sale.commission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </motion.div>
              ))}
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );
}
