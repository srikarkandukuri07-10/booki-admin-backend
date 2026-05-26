"use client";

import { motion } from "framer-motion";
import { useCustomerOrderStore } from "@/store/useCustomerOrderStore";
import { Utensils, AlertTriangle } from "lucide-react";

export default function TableSelect() {
  const setTable = useCustomerOrderStore((state) => state.setTable);

  const tables = Array.from({ length: 12 }, (_, i) => `Table ${i + 1}`);

  const handleSelectTable = (table: string) => {
    setTable(table);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 bg-[#0f0f0e] text-white">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.05)_0%,transparent_70%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md text-center z-10 flex flex-col items-center"
      >
        {/* Animated Gold Logo */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-[0_0_20px_rgba(245,158,11,0.3)] mb-4"
        >
          <Utensils className="w-8 h-8 text-neutral-950 stroke-[2.5]" />
        </motion.div>

        <h1 className="text-3xl font-bold tracking-tight mb-1">
          <span className="shimmer-text font-serif">L'Ambre Rustic</span>
        </h1>
        <p className="text-neutral-400 text-sm mb-10 tracking-widest uppercase">
          Smart Dining Experience
        </p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full"
        >
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-3xl mb-6 text-left max-w-sm mx-auto shadow-[0_4px_25px_rgba(239,68,68,0.05)]">
            <div className="flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-black text-red-400 uppercase tracking-widest block mb-0.5">
                  Important Notice
                </span>
                <span className="text-[11px] text-neutral-400 leading-relaxed block">
                  Please verify your physical table number carefully. Once selected, your ordering session is bound to this table and cannot be changed.
                </span>
              </div>
            </div>
          </div>

          <h2 className="text-neutral-200 text-lg font-medium mb-6">
            Select Your Table
          </h2>

          {/* Table Grid */}
          <div className="grid grid-cols-3 gap-4">
            {tables.map((table, index) => (
              <motion.button
                key={table}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.03, duration: 0.3 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => handleSelectTable(table)}
                className="glass-card flex flex-col items-center justify-center py-6 rounded-2xl cursor-pointer hover:border-amber-500/50 hover:bg-white/[0.04] transition-all group duration-300"
              >
                <span className="text-2xl font-semibold text-neutral-300 group-hover:text-amber-400 transition-colors">
                  {index + 1}
                </span>
                <span className="text-[10px] text-neutral-500 tracking-wider uppercase mt-1 group-hover:text-amber-500/70 transition-colors">
                  Table
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Footer micro info */}
        <p className="text-[11px] text-neutral-600 mt-12 tracking-wide">
          Scanning QR binds your order to this physical table instantly.
        </p>
      </motion.div>
    </div>
  );
}
