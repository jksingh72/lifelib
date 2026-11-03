import React from "react";
import { Activity, Layers, RefreshCw } from "lucide-react";

interface NavbarProps {
  onOpenInspector: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenInspector,
  onRefresh,
  isLoading,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight">lifelib</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Studio
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive Actuarial Cashflow Engine
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-md border border-slate-700/60 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300">Model:</span>
            <span className="font-semibold text-white">simplelife</span>
          </div>

          <button
            onClick={onOpenInspector}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors"
          >
            <Layers className="w-4 h-4 text-sky-400" />
            <span>Spaces & Formulas</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors disabled:opacity-50"
            title="Refresh current policy"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-sky-400" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>
    </header>
  );
};

