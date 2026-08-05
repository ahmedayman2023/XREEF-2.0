import React, { useEffect, useRef, useState } from "react";
import { Wand2, X } from "lucide-react";

interface GeneratePopupProps {
  screenPos: { x: number; y: number };
  onSubmit: (prompt: string) => void;
  onClose: () => void;
  errorMessage?: string | null;
}

export default function GeneratePopup({
  screenPos,
  onSubmit,
  onClose,
  errorMessage,
}: GeneratePopupProps) {
  const [prompt, setPrompt] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <div
      ref={containerRef}
      className="absolute z-30 w-64 bg-[#0a0a0a]/95 backdrop-blur border border-white/10 rounded-2xl shadow-2xl p-3"
      style={{ left: screenPos.x, top: screenPos.y }}
      dir="rtl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-300">توليد صورة جديدة</span>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-500 hover:text-white p-1 rounded-lg hover:bg-white/5"
            title="إغلاق"
          >
            <X size={14} />
          </button>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="صف التعديل المطلوب..."
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-teal-400/50"
        />

        {errorMessage && (
          <p className="text-[10px] text-red-400/90 leading-tight">{errorMessage}</p>
        )}

        <button
          type="submit"
          disabled={!prompt.trim()}
          className="flex items-center justify-center gap-1.5 bg-teal-500/90 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-black text-xs font-bold py-2 rounded-lg transition-colors"
        >
          <Wand2 size={13} />
          توليد
        </button>
      </form>
    </div>
  );
}
