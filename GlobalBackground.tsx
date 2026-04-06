import React from 'react';
import { motion } from 'framer-motion';

export const GlobalBackground = () => (
  <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
    {/* Base Gradient */}
    <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0d0d1a] to-[#1a1a3a]" />
    
    {/* Subtle Glow Orbs */}
    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/5 rounded-full blur-[120px]" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/5 rounded-full blur-[120px]" />
    
    {/* Floating Particles (Very Low Opacity) */}
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={`particle-${i}`}
        className="data-particle"
        style={{ 
          background: 'rgba(255, 255, 255, 0.05)',
          width: '1px',
          height: '1px'
        }}
        initial={{ 
          x: Math.random() * 100 + '%', 
          y: Math.random() * 100 + '%',
          opacity: 0.05
        }}
        animate={{ 
          y: [null, (Math.random() > 0.5 ? '-' : '+') + '=50', (Math.random() > 0.5 ? '+' : '-') + '=50'],
          x: [null, (Math.random() > 0.5 ? '+' : '-') + '=30', (Math.random() > 0.5 ? '-' : '+') + '=30'],
          opacity: [0.02, 0.08, 0.02]
        }}
        transition={{ 
          duration: Math.random() * 30 + 30, 
          repeat: Infinity, 
          ease: "linear" 
        }}
      />
    ))}
  </div>
);
