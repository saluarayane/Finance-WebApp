import { useState } from "react";
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
  
  const commissionPercentage = 0.05; 
  const agentCut = 0.35; 
  
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
    setSyncState("syncing");

    onAddProjectedSale({
      propertyValue: numericValue,
      commission: agentCommission,
      month: selectedMonth,
      received: false
    });

    setSyncState("success");
    setTimeout(() => {
      setSyncState("idle");
      setOpen(false);
      setPropertyValue("");
    }, 1000);
  };

  return (
    <>
      <div className="fixed bottom-6 inset-x-0 flex justify-center z-40 px-6">
        <button onClick={() => setOpen(true)} className="w-full flex items-center justify-center bg-gradient-to-r from-orange-500 to-fuchsia-600 p-[1px] rounded-2xl shadow-[0_10px_40px_-10px_rgba(255,0,255,0.5)] overflow-hidden">
          <div className="w-full bg-white/10 backdrop-blur-md rounded-[15px] px-6 py-4 flex items-center justify-between text-white font-medium">
            <div className="flex items-center gap-3"><Calculator size={20} /><span>Nova Venda</span></div>
            <ChevronUp size={20} className="text-white/50" />
          </div>
        </button>
      </div>

      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 h-[85vh] outline-none">
            <GlassCard intensity="high" className="h-full rounded-t-[32px] p-6 flex flex-col pb-10">
              <div className="mx-auto w-12 h-1.5 rounded-full bg-white/20 mb-6" />
              <Drawer.Title className="text-2xl font-bold text-white mb-4">Calcular Comissão</Drawer.Title>
              
              <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/60">Valor do Imóvel</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-medium">R$</span>
                    <input type="text" inputMode="numeric" value={propertyValue} onChange={handleFormatCurrency} placeholder="0,00" className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-xl font-bold text-white outline-none" />
                  </div>
                </div>

                <AnimatePresence>
                  {numericValue > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 bg-white/5 border border-white/10 rounded-2xl p-4">
                      <div className="flex justify-between text-xs text-white/50"><span>Comissão Total (5%)</span><span>{totalCommission.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
                      <div className="flex flex-col"><span className="text-white/50 text-xs mb-1">Sua Parte (35%)</span><span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-fuchsia-400">{agentCommission.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-white/60">Mês de Recebimento Previsto</label>
                        <div className="grid grid-cols-6 gap-1.5">
                          {months.map(m => <button key={m} onClick={() => setSelectedMonth(m)} className={clsx("py-1.5 rounded-md text-[10px] font-bold transition-all", selectedMonth === m ? "bg-gradient-to-r from-orange-500 to-fuchsia-600 text-white shadow-[0_0_8px_rgba(255,0,255,0.4)]" : "bg-white/5 text-white/40")}>{m}</button>)}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button onClick={handleSave} disabled={numericValue <= 0 || syncState !== "idle"} className="w-full h-12 mt-4 rounded-xl font-bold text-white relative overflow-hidden bg-gradient-to-r from-orange-500 to-fuchsia-600 flex items-center justify-center gap-2">
                {syncState === "idle" ? <><span>Projetar Venda</span></> : syncState === "syncing" ? <span>Gravando na Planilha...</span> : <><CheckCircle2 size={16} /><span>Projetado com Sucesso!</span></>}
              </button>
            </GlassCard>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}