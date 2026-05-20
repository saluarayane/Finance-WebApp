import { useState, useEffect } from "react";
import { Drawer } from "vaul";
import { motion, AnimatePresence } from "motion/react";
import { Calculator, TrendingUp, CheckCircle2, ChevronUp } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { clsx } from "clsx";
import type { ProjectedSale } from "./AnnualGoals";

interface CommissionCalculatorProps {
  onAddCommission: (amount: number) => void;
  onAddProjectedSale: (sale: Omit<ProjectedSale, 'id'>) => void;
}

const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function CommissionCalculator({ onAddCommission, onAddProjectedSale }: CommissionCalculatorProps) {
  const [open, setOpen] = useState(false);
  const [propertyValue, setPropertyValue] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("Mai");
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "success">("idle");

  const numericValue = parseFloat(propertyValue.replace(/\D/g, '')) / 100 || 0;
  
  const commissionPercentage = 0.05; // 5% total commission
  const agentCut = 0.35; // 35% for the agent
  
  const totalCommission = numericValue * commissionPercentage;
  const agentCommission = totalCommission * agentCut;

  const handleFormatCurrency = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/\D/g, "");
    if (value) {
      value = (parseInt(value) / 100).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      setPropertyValue(value);
    } else {
      setPropertyValue("");
    }
  };

  const handleSave = () => {
    if (agentCommission <= 0) return;

    // 1. Coloca o botão no modo de carregamento animado ("Projetando...")
    setSyncState("syncing");

    // 2. Dispara a gravação REAL na API do Sheety lá no Dashboard
    if (onAddProjectedSale) {
      onAddProjectedSale({
        propertyValue: numericValue,
        commission: agentCommission,
        month: selectedMonth,
        received: false
      });
    }

    // 3. Ativa o aviso de sucesso e agenda o fechamento suave do painel
    setSyncState("success");
    
    setTimeout(() => {
      setSyncState("idle");
      setOpen(false);
      setPropertyValue("");
    }, 1200); 
  };

  return (
    <>
      <div className="fixed bottom-6 inset-x-0 flex justify-center z-40 px-6">
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-fuchsia-600 p-[1px] rounded-2xl shadow-[0_10px_40px_-10px_rgba(255,0,255,0.5)] overflow-hidden transition-transform active:scale-95"
        >
          <div className="w-full bg-white/10 backdrop-blur-md rounded-[15px] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-white font-medium">
              <Calculator size={20} className="text-white/80" />
              <span>Nova Venda</span>
            </div>
            <ChevronUp size={20} className="text-white/50" />
          </div>
        </button>
      </div>

      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <Drawer.Content className="bg-transparent flex flex-col rounded-t-[32px] mt-24 fixed bottom-0 left-0 right-0 z-50 h-[85vh] outline-none">
            <GlassCard intensity="high" className="flex-1 rounded-t-[32px] rounded-b-none border-b-0 p-6 flex flex-col pb-10">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/20 mb-8" />
              
              <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
                <Drawer.Title className="text-2xl font-bold text-white mb-6">
                  Calcular Comissão
                </Drawer.Title>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/60">
                      Valor do Imóvel
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-medium">R$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={propertyValue}
                        onChange={handleFormatCurrency}
                        placeholder="0,00"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-2xl font-bold text-white outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all placeholder:text-white/20 shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]"
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {numericValue > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: 10 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-white/50">Comissão Total (5%)</span>
                            <span className="text-white/80">
                              {totalCommission.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          </div>

                          <div className="h-px bg-white/10 w-full" />

                          <div className="flex flex-col">
                            <span className="text-white/50 text-sm mb-1">Sua Parte (35%)</span>
                            <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-fuchsia-400 drop-shadow-[0_0_15px_rgba(255,0,255,0.3)]">
                              {agentCommission.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          </div>

                          <div className="h-px bg-white/10 w-full" />

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-white/60 flex items-center gap-2">
                              <TrendingUp size={14} />
                              Mês de Recebimento Previsto
                            </label>
                            <div className="grid grid-cols-6 gap-2">
                              {months.map((month) => (
                                <button
                                  key={month}
                                  onClick={() => setSelectedMonth(month)}
                                  className={clsx(
                                    "py-2 px-1 rounded-lg text-xs font-medium transition-all",
                                    selectedMonth === month
                                      ? "bg-gradient-to-r from-orange-500 to-fuchsia-600 text-white shadow-[0_0_10px_rgba(255,0,255,0.4)]"
                                      : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
                                  )}
                                >
                                  {month}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="mt-auto pt-4">
                <button
                  onClick={handleSave}
                  disabled={numericValue <= 0 || syncState !== "idle"}
                  className="relative w-full h-14 rounded-2xl font-bold text-white overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95 group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-fuchsia-600 opacity-90 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
                  
                  <div className="relative h-full flex items-center justify-center gap-2 z-10">
                    {syncState === "idle" ? (
                      <>
                        <TrendingUp size={20} />
                        <span>Projetar Venda</span>
                      </>
                    ) : syncState === "syncing" ? (
                      <div className="flex items-center gap-2">
                        <motion.div
                          animate={{ x: ["-100%", "200%"] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-1/2 skew-x-12"
                        />
                        <TrendingUp size={20} className="animate-pulse" />
                        <span>Projetando...</span>
                      </div>
                    ) : (
                      <>
                        <CheckCircle2 size={20} className="text-green-300 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                        <span>Projetado!</span>
                      </>
                    )}
                  </div>
                </button>
              </div>
            </GlassCard>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}