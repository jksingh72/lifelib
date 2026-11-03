import React, { useState, useMemo } from "react";
import { X, Search, Globe, Shield, Sparkles, Layers, CheckCircle2, ArrowRight } from "lucide-react";
import { ProductItem } from "../../types/actuarial";

interface ProductCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  onOpenProduct: (productId: string) => void;
  openingProductId: string | null;
}

const COUNTRY_FILTERS = [
  { id: "all", label: "All Jurisdictions", flag: "🌐" },
  { id: "uslib", label: "United States (US)", flag: "🇺🇸" },
  { id: "uklib", label: "United Kingdom (UK)", flag: "🇬🇧" },
  { id: "delib", label: "Germany (DE)", flag: "🇩🇪" },
  { id: "frlib", label: "France (FR)", flag: "🇫🇷" },
  { id: "jplib", label: "Japan (JP)", flag: "🇯🇵" },
  { id: "krlib", label: "South Korea (KR)", flag: "🇰🇷" },
];

const JURISDICTION_ORDER: Record<string, number> = {
  uslib: 1,
  uklib: 2,
  delib: 3,
  frlib: 4,
  jplib: 5,
  krlib: 6,
};

const CATEGORIES = [
  "All Categories",
  "Universal Life & Savings",
  "Life & Protection",
  "Annuities",
  "Health & Critical Illness",
  "Pensions",
];

export const ProductCatalogModal: React.FC<ProductCatalogModalProps> = ({
  isOpen,
  onClose,
  products,
  onOpenProduct,
  openingProductId,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchCountry = selectedCountry === "all" || p.country === selectedCountry;
        const matchCategory =
          selectedCategory === "All Categories" || p.category === selectedCategory;
        const matchSearch =
          searchQuery === "" ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase());

        return matchCountry && matchCategory && matchSearch;
      })
      .sort((a, b) => {
        const orderA = JURISDICTION_ORDER[a.country] || 99;
        const orderB = JURISDICTION_ORDER[b.country] || 99;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
      });
  }, [products, selectedCountry, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-bold text-lg">Actuarial Product Marketplace</h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/30 text-sky-200 border border-sky-400/30">
                  {products.length} Products
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Discover, initialize, and project models across 6 global actuarial jurisdictions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-3">
          {/* Search & Country Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Country Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {COUNTRY_FILTERS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCountry(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all ${
                    selectedCountry === c.id
                      ? "bg-sky-600 text-white shadow-sm font-semibold"
                      : "bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200"
                  }`}
                >
                  <span>{c.flag}</span>
                  <span>{c.label}</span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search 57 products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Category:
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  selectedCategory === cat
                    ? "bg-slate-900 text-white font-semibold"
                    : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Shield className="w-12 h-12 text-slate-300 mb-2 stroke-1" />
              <p className="font-semibold text-sm">No products found matching criteria</p>
              <p className="text-xs">Try selecting a different jurisdiction or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((p) => {
                const isOpening = openingProductId === p.id;
                const flag =
                  COUNTRY_FILTERS.find((c) => c.id === p.country)?.flag || "🏛️";

                return (
                  <div
                    key={p.id}
                    className={`bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                      p.is_open
                        ? "border-sky-300 ring-1 ring-sky-300/40 bg-sky-50/10"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      {/* Country & Category Badge */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
                          <span>{flag}</span>
                          <span>{p.country_label}</span>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80">
                          {p.category}
                        </span>
                      </div>

                      {/* Product Name */}
                      <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center justify-between">
                        <span>{p.name}</span>
                        {p.is_open && (
                          <span className="flex items-center space-x-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        )}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                        {p.description}
                      </p>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {p.has_account_value && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 flex items-center space-x-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>Account Value Roll-Forward</span>
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                          {p.id}
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-3 border-t border-slate-100 mt-2">
                      <button
                        onClick={() => onOpenProduct(p.id)}
                        disabled={isOpening}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                          p.is_open
                            ? "bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200"
                            : "bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
                        } disabled:opacity-50`}
                      >
                        {isOpening ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                            <span>Provisioning Environment...</span>
                          </>
                        ) : p.is_open ? (
                          <>
                            <span>Switch to Tab</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        ) : (
                          <>
                            <Layers className="w-3.5 h-3.5" />
                            <span>Launch Product Environment</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 px-5">
          <span>
            Showing <strong>{filteredProducts.length}</strong> of {products.length} products
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
          >
            Close Catalog
          </button>
        </div>
      </div>
    </div>
  );
};

