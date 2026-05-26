"use client";

import { motion } from "framer-motion";
import { CATEGORIES } from "@/data/menuData";
import { useEffect, useRef } from "react";

interface CategoryNavProps {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}

export default function CategoryNav({ activeCategory, setActiveCategory }: CategoryNavProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activePillRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll active pill into view within the horizontal category scrollbar
  useEffect(() => {
    if (activePillRef.current && containerRef.current) {
      const container = containerRef.current;
      const pill = activePillRef.current;
      
      const containerScrollLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;
      const pillOffsetLeft = pill.offsetLeft;
      const pillWidth = pill.clientWidth;

      const targetScroll = pillOffsetLeft - containerWidth / 2 + pillWidth / 2;
      container.scrollTo({
        left: targetScroll,
        behavior: "smooth",
      });
    }
  }, [activeCategory]);

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    
    // Find the category header element on the page
    const element = document.getElementById(`category-${category.toLowerCase().replace(/\s+/g, "-")}`);
    if (element) {
      // Calculate sticky offset (header + category nav is roughly 120px)
      const offset = 130;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="sticky top-16 z-20 w-full glass-panel border-b border-white/[0.05] py-3 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
      <div 
        ref={containerRef}
        className="flex items-center gap-3 overflow-x-auto px-4 no-scrollbar whitespace-nowrap scroll-smooth"
      >
        {CATEGORIES.map((category) => {
          const isActive = activeCategory === category;
          return (
            <button
              key={category}
              ref={isActive ? activePillRef : null}
              onClick={() => handleCategoryClick(category)}
              className={`relative px-5 py-2 text-xs font-semibold rounded-full tracking-wider uppercase transition-all duration-300 ${
                isActive 
                  ? "text-[#0f0f0e] active-category-pill" 
                  : "text-neutral-400 hover:text-neutral-200 bg-white/[0.03] border border-white/[0.03]"
              }`}
            >
              <span className="relative z-10">{category}</span>
              {isActive && (
                <motion.div
                  layoutId="activeCategoryPillBackground"
                  className="absolute inset-0 bg-amber-500 rounded-full -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
