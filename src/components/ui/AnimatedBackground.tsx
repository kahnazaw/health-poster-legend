"use client";

import { motion } from "framer-motion";

/**
 * AnimatedBackground - الخلفية المتحركة "نبض الصحة"
 * تستخدم Framer Motion لإنشاء تموجات الزمرد والسليت
 */
export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Mesh Gradient متحرك */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            "radial-gradient(at 0% 0%, rgba(5, 150, 105, 0.15) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(14, 165, 233, 0.1) 0px, transparent 50%), radial-gradient(at 50% 100%, rgba(245, 158, 11, 0.08) 0px, transparent 50%)",
            "radial-gradient(at 20% 10%, rgba(5, 150, 105, 0.18) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(14, 165, 233, 0.12) 0px, transparent 50%), radial-gradient(at 30% 100%, rgba(245, 158, 11, 0.1) 0px, transparent 50%)",
            "radial-gradient(at 0% 0%, rgba(5, 150, 105, 0.15) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(14, 165, 233, 0.1) 0px, transparent 50%), radial-gradient(at 50% 100%, rgba(245, 158, 11, 0.08) 0px, transparent 50%)",
          ],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          filter: "blur(80px)",
          transform: "scale(1)",
        }}
      />
      
      {/* تموجات إضافية */}
      <motion.div
        className="absolute inset-0"
        animate={{
          scale: [1, 1.1, 1],
          x: [0, 20, 0],
          y: [0, 20, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(5, 150, 105, 0.05) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
    </div>
  );
}

