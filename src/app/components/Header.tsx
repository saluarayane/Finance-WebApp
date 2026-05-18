import { motion } from "motion/react";
import { Wallet } from "lucide-react";
import { clsx } from "clsx";

interface HeaderProps {
  balance: number;
}

export function Header({ balance }: HeaderProps) {
  const isPositive = balance >= 0;
  const formattedBalance = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(balance);

  return (
    <div className="flex flex-col items-center justify-center py-8 relative">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 mb-2"
      >
        <div className={clsx(
          "p-2 rounded-full border-[0.5px] bg-white/5 backdrop-blur-md",
          isPositive ? "border-cyan-400/30 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]" : "border-orange-500/30 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]"
        )}>
          <Wallet size={16} />
        </div>
        <span className="text-white/60 text-sm font-medium tracking-wide uppercase">Saldo do Mês</span>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <h1 className={clsx(
          "text-5xl font-bold tracking-tight",
          isPositive ? "text-white drop-shadow-[0_0_20px_rgba(34,211,238,0.4)]" : "text-white drop-shadow-[0_0_20px_rgba(249,115,22,0.4)]"
        )}>
          {formattedBalance}
        </h1>
      </motion.div>
    </div>
  );
}
