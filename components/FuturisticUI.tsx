import React from 'react';

// --- Layout Containers ---

export const GlassCard: React.FC<React.HTMLAttributes<HTMLDivElement> & { noPadding?: boolean }> = ({ children, className = '', noPadding = false, ...props }) => (
  <div className={`relative overflow-hidden backdrop-blur-xl bg-purple-900/10 border border-purple-500/30 shadow-[0_0_20px_rgba(124,58,237,0.15)] rounded-2xl ${noPadding ? '' : 'p-6'} ${className}`} {...props}>
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />
    {children}
  </div>
);

export const NeonBar: React.FC = () => (
  <div className="h-1 w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-glow-bar bg-[length:200%_100%]" />
);

// --- Inputs & Buttons ---

export const NeonInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className, ...props }) => (
  <div className="mb-4 group">
    {label && <label className="block text-purple-200 text-sm mb-1 font-sans tracking-wide">{label}</label>}
    <div className="relative">
      <input 
        className={`w-full bg-slate-900/60 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(34,211,238,0.4)] transition-all duration-300 font-sans ${className}`}
        {...props}
      />
      <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-cyan-400 transition-all duration-300 group-hover:w-full" />
    </div>
  </div>
);

export const NeonSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }> = ({ label, children, className, ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-purple-200 text-sm mb-1 font-sans tracking-wide">{label}</label>}
    <select 
      className={`w-full bg-slate-900/60 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400 font-sans appearance-none ${className}`}
      {...props}
    >
      {children}
    </select>
  </div>
);

export const NeonTextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }> = ({ label, className, ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-purple-200 text-sm mb-1 font-sans tracking-wide">{label}</label>}
    <textarea 
      className={`w-full bg-slate-900/60 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(34,211,238,0.4)] transition-all duration-300 font-sans ${className}`}
      {...props}
    />
  </div>
);

export const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: React.ReactNode }> = ({ children, icon, className, ...props }) => (
  <button 
    className={`relative group overflow-hidden bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(139,92,246,0.6)] flex items-center justify-center gap-2 ${className}`}
    {...props}
  >
    <span className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full skew-x-12 group-hover:translate-x-full transition-transform duration-700" />
    {icon}
    <span className="relative font-display tracking-wider uppercase text-sm">{children}</span>
  </button>
);

export const SecondaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: React.ReactNode }> = ({ children, icon, className, ...props }) => (
  <button 
    className={`bg-slate-800/50 border border-purple-500/30 hover:bg-slate-700/50 text-purple-100 py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${className}`}
    {...props}
  >
    {icon}
    <span className="font-sans font-medium">{children}</span>
  </button>
);

export const Badge: React.FC<{ children: React.ReactNode; color?: 'purple' | 'cyan' | 'red' | 'green' }> = ({ children, color = 'purple' }) => {
  const colors = {
    purple: 'bg-purple-900/50 text-purple-300 border-purple-500/50',
    cyan: 'bg-cyan-900/50 text-cyan-300 border-cyan-500/50',
    red: 'bg-red-900/50 text-red-300 border-red-500/50',
    green: 'bg-green-900/50 text-green-300 border-green-500/50',
  };
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colors[color]} shadow-sm backdrop-blur-sm`}>
      {children}
    </span>
  );
};