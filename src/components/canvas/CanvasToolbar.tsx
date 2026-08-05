import React, { useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Plus,
  Settings2,
  History as HistoryIcon,
  Folder,
  ChevronDown,
} from "lucide-react";
import type { User } from "firebase/auth";

interface CanvasToolbarProps {
  projectName: string;
  imageCount: number;
  user: User | null;
  onBack: () => void;
  onZoomIn: () => void;
  labelsVisible: boolean;
  onToggleLabels: () => void;
}

export default function CanvasToolbar({
  projectName,
  imageCount,
  user,
  onBack,
  onZoomIn,
  labelsVisible,
  onToggleLabels,
}: CanvasToolbarProps) {
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);

  return (
    <>
      {/* Top-left project dropdown */}
      <div className="absolute top-4 left-4 z-20" dir="rtl">
        <button
          onClick={() => setProjectMenuOpen((v) => !v)}
          className="flex items-center gap-2 px-3 py-2 bg-[#0a0a0a]/90 backdrop-blur border border-white/10 rounded-xl shadow-lg hover:border-white/20 transition-all"
        >
          <Folder className="w-3.5 h-3.5 text-teal-400" />
          <span className="text-xs font-medium text-neutral-200 max-w-[160px] truncate">
            {projectName || "بدون اسم"}
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
            {imageCount}
          </span>
          <ChevronDown
            size={14}
            className={`text-neutral-500 transition-transform ${projectMenuOpen ? "rotate-180" : ""}`}
          />
        </button>

        {projectMenuOpen && (
          <div className="mt-1 w-48 bg-[#0a0a0a]/95 backdrop-blur border border-white/10 rounded-xl shadow-lg overflow-hidden">
            <button
              onClick={onBack}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-neutral-300 hover:bg-white/5 transition-colors text-right"
            >
              <ArrowLeft size={14} />
              الرجوع لمساحة العمل
            </button>
          </div>
        )}
      </div>

      {/* Left vertical toolbar */}
      <div className="absolute top-1/2 left-4 -translate-y-1/2 z-20 flex flex-col items-center gap-1.5 p-1.5 bg-[#0a0a0a]/90 backdrop-blur border border-white/10 rounded-2xl shadow-lg">
        <ToolbarButton title="الرجوع" onClick={onBack}>
          <ArrowLeft size={18} />
        </ToolbarButton>
        <ToolbarButton
          title={labelsVisible ? "إخفاء الأوصاف" : "إظهار الأوصاف"}
          onClick={onToggleLabels}
          active={labelsVisible}
        >
          {labelsVisible ? <Eye size={18} /> : <EyeOff size={18} />}
        </ToolbarButton>
        <ToolbarButton title="تكبير" onClick={onZoomIn}>
          <Plus size={18} />
        </ToolbarButton>
        <ToolbarButton title="الإعدادات (قريباً)" disabled>
          <Settings2 size={18} />
        </ToolbarButton>
        <ToolbarButton title="السجل (قريباً)" disabled>
          <HistoryIcon size={18} />
        </ToolbarButton>

        <div className="w-6 h-px bg-white/10 my-1" />

        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || "المستخدم"}
            className="w-8 h-8 rounded-full border border-white/10"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center border border-teal-500/30">
            <span className="text-xs text-teal-400">
              {user?.displayName?.charAt(0) || "U"}
            </span>
          </div>
        )}
      </div>
    </>
  );
}

function ToolbarButton({
  children,
  title,
  onClick,
  active,
  disabled,
}: {
  children: React.ReactNode;
  title: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`p-2.5 rounded-xl transition-all ${
        disabled
          ? "text-neutral-700 cursor-not-allowed"
          : active
            ? "text-teal-400 bg-teal-500/10"
            : "text-neutral-400 hover:text-white hover:bg-white/5"
      }`}
    >
      {children}
    </button>
  );
}
