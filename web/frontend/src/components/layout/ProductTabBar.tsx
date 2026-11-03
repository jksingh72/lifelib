import React from "react";
import { Plus, X, GitCompare } from "lucide-react";
import { ProductItem } from "../../types/actuarial";

interface TabItem {
  product: ProductItem;
  pointId: number;
}

interface ProductTabBarProps {
  tabs: TabItem[];
  activeTabIndex: number;
  onSelectTab: (index: number) => void;
  onCloseTab: (index: number) => void;
  onOpenCatalog: () => void;
  onOpenCompare: () => void;
  isClassicActive: boolean;
  onSelectClassic: () => void;
  activeModelName?: string;
}

const COUNTRY_FLAGS: Record<string, string> = {
  uslib: "🇺🇸",
  uklib: "🇬🇧",
  delib: "🇩🇪",
  frlib: "🇫🇷",
  jplib: "🇯🇵",
  krlib: "🇰🇷",
};

export const ProductTabBar: React.FC<ProductTabBarProps> = ({
  tabs,
  activeTabIndex,
  onSelectTab,
  onCloseTab,
  onOpenCatalog,
  onOpenCompare,
  isClassicActive,
  onSelectClassic,
  activeModelName,
}) => {
  return (
    <div className="bg-slate-900 px-4 sm:px-6 lg:px-8 border-b border-slate-800 flex items-center justify-between overflow-x-auto text-xs select-none">
      <div className="flex items-center space-x-1.5 py-1.5 overflow-x-auto max-w-full">
        {/* Foundational Model / 100-Policy Portfolio Tab */}
        <button
          onClick={onSelectClassic}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all border ${
            isClassicActive
              ? "bg-slate-800 text-white border-sky-500/50 shadow-sm"
              : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-transparent"
          }`}
          title="Switch to Foundational Model & 100-Policy Portfolio"
        >
          <span>🏛️</span>
          <span className="font-semibold">{activeModelName || "SimpleLife"}</span>
          <span className="text-[10px] text-slate-400 font-mono">100 Policies</span>
        </button>

        {tabs.map((tab, idx) => {
          const isActive = !isClassicActive && idx === activeTabIndex;
          const flag = COUNTRY_FLAGS[tab.product.country] || "🏛️";

          return (
            <div
              key={tab.product.id}
              onClick={() => onSelectTab(idx)}
              className={`group flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all border ${
                isActive
                  ? "bg-slate-800 text-white border-sky-500/50 shadow-sm"
                  : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-transparent"
              }`}
            >
              <span>{flag}</span>
              <span className="truncate max-w-[150px] font-semibold">{tab.product.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">Pt #{tab.pointId}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(idx);
                }}
                className="p-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-700/60 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Close product tab"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {/* Plus button to open catalog */}
        <button
          onClick={onOpenCatalog}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-slate-800/60 border border-dashed border-slate-700 transition-colors font-medium"
          title="Open Product Marketplace"
        >
          <Plus className="w-3.5 h-3.5 text-sky-400" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Action buttons on right */}
      <div className="flex items-center space-x-2 shrink-0 py-1 pl-2">
        {tabs.length >= 2 && (
          <button
            onClick={onOpenCompare}
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-sky-950/60 text-sky-300 hover:bg-sky-900/70 border border-sky-800/60 rounded-lg transition-colors font-medium text-[11px]"
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Compare Tabs</span>
          </button>
        )}
      </div>
    </div>
  );
};

