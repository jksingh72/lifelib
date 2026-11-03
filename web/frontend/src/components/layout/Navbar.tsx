import React from "react";
import { Activity, Layers, RefreshCw, Globe } from "lucide-react";
import { ModelInfo, ProductItem } from "../../types/actuarial";

interface NavbarProps {
  models: ModelInfo[];
  activeModelId: string;
  onSelectModel: (modelId: string) => void;
  allProducts: ProductItem[];
  activeProductId?: string;
  onSelectProduct: (productId: string) => void;
  isProductActive: boolean;
  onOpenInspector: () => void;
  onOpenCatalog: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  totalProductsCount: number;
}

const JURISDICTIONS = [
  { id: "uslib", label: "United States (USLIB)", flag: "🇺🇸" },
  { id: "uklib", label: "United Kingdom (UKLIB)", flag: "🇬🇧" },
  { id: "delib", label: "Germany (DELIB)", flag: "🇩🇪" },
  { id: "frlib", label: "France (FRLIB)", flag: "🇫🇷" },
  { id: "jplib", label: "Japan (JPLIB)", flag: "🇯🇵" },
  { id: "krlib", label: "South Korea (KRLIB)", flag: "🇰🇷" },
];

export const Navbar: React.FC<NavbarProps> = ({
  models,
  activeModelId,
  onSelectModel,
  allProducts,
  activeProductId,
  onSelectProduct,
  isProductActive,
  onOpenInspector,
  onOpenCatalog,
  onRefresh,
  isLoading,
  totalProductsCount,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Subtitle */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight">lifelib</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Actuarial Studio
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Multi-Product Actuarial Engine &middot; 57 Global Models
            </p>
          </div>
        </div>

        {/* Top Controls Toolbar */}
        <div className="flex items-center space-x-2.5">
          {/* Direct On-Screen Model & Product Selector */}
          <div className="flex items-center space-x-2 bg-slate-800/90 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span className="text-slate-400 font-medium shrink-0">Model / Product:</span>
            <select
              value={isProductActive && activeProductId ? `prod:${activeProductId}` : `model:${activeModelId}`}
              onChange={(e) => {
                const val = e.target.value;
                if (val.startsWith("model:")) {
                  onSelectModel(val.replace("model:", ""));
                } else if (val.startsWith("prod:")) {
                  onSelectProduct(val.replace("prod:", ""));
                }
              }}
              disabled={isLoading}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer pr-1 max-w-[240px] truncate"
            >
              <optgroup label="🏛️ Foundational Models" className="bg-slate-900 text-sky-300 font-bold">
                {models.map((m) => (
                  <option key={`model:${m.id}`} value={`model:${m.id}`} className="bg-slate-800 text-white font-normal">
                    {m.name}
                  </option>
                ))}
              </optgroup>

              {JURISDICTIONS.map((j) => {
                const prods = allProducts.filter((p) => p.country === j.id);
                if (prods.length === 0) return null;
                return (
                  <optgroup key={j.id} label={`${j.flag} ${j.label}`} className="bg-slate-900 text-sky-300 font-bold">
                    {prods.map((p) => (
                      <option key={`prod:${p.id}`} value={`prod:${p.id}`} className="bg-slate-800 text-white font-normal">
                        {p.name}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>

          {/* Product Catalog (57) Modal Button */}
          <button
            onClick={onOpenCatalog}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-lg font-semibold text-xs shadow-sm transition-all"
            title="Browse all 57 products in visual marketplace"
          >
            <Globe className="w-4 h-4" />
            <span>Product Catalog ({totalProductsCount || 57})</span>
          </button>

          {/* Formulas Inspector */}
          <button
            onClick={onOpenInspector}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            <Layers className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Spaces & Formulas</span>
          </button>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors disabled:opacity-50"
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
