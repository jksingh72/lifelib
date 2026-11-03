import React from "react";
import { Sliders, RotateCcw } from "lucide-react";
import { ShockRequest } from "../../types/actuarial";

interface SensitivityPanelProps {
  shocks: ShockRequest;
  onChange: (updated: ShockRequest) => void;
  onReset: () => void;
  isShocked: boolean;
}

export const SensitivityPanel: React.FC<SensitivityPanelProps> = ({
  shocks,
  onChange,
  onReset,
  isShocked,
}) => {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-sky-600" />
          <h3 className="font-bold text-slate-800 text-sm">
            Real-Time Sensitivity & Stress Testing
          </h3>
        </div>

        {isShocked && (
          <button
            onClick={onReset}
            className="flex items-center space-x-1 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-md transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset to Base</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Interest Rate Shock */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-medium text-slate-700">Interest Rate Shift:</span>
            <span className="font-bold font-mono text-sky-600">
              {shocks.interest_shock_bps > 0 ? "+" : ""}
              {shocks.interest_shock_bps} bps ({(shocks.interest_shock_bps / 100).toFixed(2)}%)
            </span>
          </div>
          <input
            type="range"
            min="-200"
            max="200"
            step="25"
            value={shocks.interest_shock_bps}
            onChange={(e) =>
              onChange({ ...shocks, interest_shock_bps: Number(e.target.value) })
            }
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>-200 bps</span>
            <span>Base (0)</span>
            <span>+200 bps</span>
          </div>
        </div>

        {/* Mortality Multiplier */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-medium text-slate-700">Mortality Multiplier:</span>
            <span className="font-bold font-mono text-rose-600">
              {(shocks.mortality_multiplier * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0.7"
            max="1.5"
            step="0.05"
            value={shocks.mortality_multiplier}
            onChange={(e) =>
              onChange({ ...shocks, mortality_multiplier: Number(e.target.value) })
            }
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>70% (-30%)</span>
            <span>100% (Base)</span>
            <span>150% (+50%)</span>
          </div>
        </div>

        {/* Lapse / Surrender Multiplier */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-medium text-slate-700">Lapse / Surrender Rate:</span>
            <span className="font-bold font-mono text-amber-600">
              {(shocks.lapse_multiplier * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0.7"
            max="1.5"
            step="0.05"
            value={shocks.lapse_multiplier}
            onChange={(e) =>
              onChange({ ...shocks, lapse_multiplier: Number(e.target.value) })
            }
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>70%</span>
            <span>100% (Base)</span>
            <span>150%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

