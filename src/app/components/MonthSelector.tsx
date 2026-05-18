import { motion } from "motion/react";
import { clsx } from "clsx";
import { useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthSelectorProps {
  selectedMonth: string;
  onSelect: (month: string) => void;
}

const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const currentMonthIndex = 4; // Maio (índice 4)

export function MonthSelector({ selectedMonth, onSelect }: MonthSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll para o mês atual (Maio) ao carregar pela primeira vez
    // Usar setTimeout para garantir que o DOM está completamente renderizado
    const timer = setTimeout(() => {
      if (scrollRef.current) {
        const currentButton = scrollRef.current.querySelector(`[data-month="Mai"]`);
        if (currentButton) {
          currentButton.scrollIntoView({ behavior: "auto", block: "nearest", inline: "center" });
        }
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full relative mb-2">
      {/* Timeline translúcida de fundo */}
      <div className="absolute top-1/2 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-y-1/2 z-0" />

      {/* Setas de navegação */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20 pl-2">
        <button
          onClick={() => scrollRef.current?.scrollBy({ left: -120, behavior: "smooth" })}
          className="w-8 h-8 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-all shadow-lg"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20 pr-2">
        <button
          onClick={() => scrollRef.current?.scrollBy({ left: 120, behavior: "smooth" })}
          className="w-8 h-8 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-all shadow-lg"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="w-full overflow-x-auto no-scrollbar py-4 px-12 scroll-smooth"
      >
        <div className="flex gap-3 min-w-max justify-center">
          {months.map((month, index) => {
            const isSelected = selectedMonth === month;
            const isCurrent = index === currentMonthIndex;
            const isPast = index < currentMonthIndex;

            return (
              <button
                key={month}
                data-month={month}
                onClick={() => onSelect(month)}
                className="relative px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 outline-none group"
              >
                <span className={clsx(
                  "relative z-10 transition-all duration-300 uppercase tracking-wide",
                  isSelected && isCurrent && "text-white font-bold drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]",
                  isSelected && !isCurrent && "text-white font-bold",
                  !isSelected && isCurrent && "text-white/70 group-hover:text-white",
                  !isSelected && isPast && "text-white/30 group-hover:text-white/60",
                  !isSelected && !isCurrent && !isPast && "text-white/50 group-hover:text-white/80"
                )}>
                  {month}
                </span>

                {/* Pílula neon para o mês atual selecionado */}
                {isSelected && isCurrent && (
                  <motion.div
                    layoutId="activeMonth"
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: "linear-gradient(135deg, rgba(249, 115, 22, 0.3), rgba(217, 70, 239, 0.3))",
                      boxShadow: "0 0 25px 5px rgba(217, 70, 239, 0.4), inset 0 0 15px rgba(255, 255, 255, 0.1)",
                      border: "1px solid rgba(255, 255, 255, 0.4)"
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                {/* Pílula translúcida para outros meses selecionados */}
                {isSelected && !isCurrent && (
                  <motion.div
                    layoutId="activeMonth"
                    className="absolute inset-0 bg-white/10 rounded-full border-[0.5px] border-white/30"
                    style={{
                      boxShadow: "0 0 10px 0px rgba(255, 255, 255, 0.1)",
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                {/* Indicador de mês atual (ponto neon) */}
                {isCurrent && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-fuchsia-400 shadow-[0_0_8px_rgba(217,70,239,0.8)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
