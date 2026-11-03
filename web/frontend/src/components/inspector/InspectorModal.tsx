import React, { useEffect, useState } from "react";
import { X, Layers, Code } from "lucide-react";
import { SpaceTreeItem } from "../../types/actuarial";
import { fetchSpaceTree } from "../../api/client";

interface InspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InspectorModal: React.FC<InspectorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [spaces, setSpaces] = useState<SpaceTreeItem[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && spaces.length === 0) {
      setIsLoading(true);
      fetchSpaceTree()
        .then((data) => {
          setSpaces(data);
          if (data.length > 0) setSelectedSpace(data[0].space);
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, spaces.length]);

  if (!isOpen) return null;

  const currentSpace = spaces.find((s) => s.space === selectedSpace);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-sky-600" />
            <h2 className="font-bold text-slate-900 text-base">
              modelx Space & Cell Inspector
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Space List Sidebar */}
          <div className="w-1/3 border-r border-slate-200 overflow-y-auto p-3 space-y-1 bg-slate-50/50">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
              Spaces ({spaces.length})
            </div>
            {spaces.map((s) => (
              <button
                key={s.space}
                onClick={() => setSelectedSpace(s.space)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                  selectedSpace === s.space
                    ? "bg-sky-600 text-white shadow-sm"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span className="truncate">{s.space}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded ${
                    selectedSpace === s.space
                      ? "bg-sky-700 text-sky-100"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {s.cells_count}
                </span>
              </button>
            ))}
          </div>

          {/* Cell List Content */}
          <div className="w-2/3 p-5 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                Loading modelx definitions...
              </div>
            ) : currentSpace ? (
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Space: <code className="text-sky-600 font-mono">{currentSpace.space}</code>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Total {currentSpace.cells_count} dynamic formula cells
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {currentSpace.cells.map((c) => (
                    <div
                      key={c}
                      className="p-2.5 rounded-lg border border-slate-200/80 bg-slate-50 text-xs font-mono text-slate-800 flex items-center space-x-2"
                    >
                      <Code className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      <span className="truncate">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-100 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

