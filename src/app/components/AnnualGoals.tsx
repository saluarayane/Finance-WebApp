import React from "react";
import { GlassCard } from "./GlassCard";
import { Check, Calendar } from "lucide-react";
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
  return (
    <GlassCard className="p-5">
      <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
        Metas Anuais e Projeções
        <Calendar size={16} className="text-fuchsia-400" />
      </h2>

      {projectedSales.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-white/10 rounded-xl bg-white/5">
          <p className="text-xs text-white/40 font-medium">
            Nenhuma comissão projetada. Use a calculadora abaixo para planejar!
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
          {projectedSales.map((sale) => (
            <div
              key={sale.id}
              className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3.5 backdrop-blur-sm"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-fuchsia-400">
                  Venda em {sale.month === "Mai" ? "Maio" : sale.month}
                </span>
                <span className="text-xs text-white/50">
                  Imóvel: {sale.propertyValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-fuchsia-400">
                  +{sale.commission.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>

                <button
                  onClick={() => onToggleReceived(sale.id)}
                  className={clsx(
                    "w-7 h-7 rounded-lg border flex items-center justify-center transition-all",
                    sale.received
                      ? "bg-green-500 border-green-400 text-white shadow-[0_0_10px_rgba(74,222,128,0.5)]"
                      : "border-white/20 bg-white/5 text-transparent hover:border-white/40"
                  )}
                >
                  <Check size={14} strokeWidth={3} className={clsx(!sale.received && "opacity-0")} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}