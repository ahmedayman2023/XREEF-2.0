import React, { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Loader2, AlertTriangle, X } from "lucide-react";

export interface ImageNodeData {
  url: string;
  prompt: string;
  timestamp: number;
  loading?: boolean;
  error?: string;
  onDismiss?: () => void;
  [key: string]: unknown;
}

export type ImageNodeType = Node<ImageNodeData, "imageNode">;

function ImageNode({ data, selected }: NodeProps<ImageNodeType>) {
  return (
    <div className="group relative w-[160px] h-[90px]">
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-teal-400/70 !border-none !z-10"
      />

      <div
        className={`w-full h-full rounded-xl overflow-hidden border transition-all ${
          data.error
            ? "border-red-500/40"
            : selected
              ? "border-teal-400/70 shadow-[0_0_0_2px_rgba(45,212,191,0.35),0_0_20px_rgba(45,212,191,0.25)]"
              : "border-white/10 hover:border-white/20"
        } bg-[#0a0a0a]`}
      >
        {data.loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-white/[0.03]">
            <Loader2 className="w-5 h-5 text-teal-400 animate-spin" />
            <span className="text-[10px] text-neutral-500">جارٍ التوليد...</span>
          </div>
        ) : data.error ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-red-500/[0.04] px-2 relative">
            <button
              onClick={data.onDismiss}
              className="absolute top-1 left-1 text-neutral-500 hover:text-white p-0.5 rounded"
              title="إغلاق"
            >
              <X size={12} />
            </button>
            <AlertTriangle className="w-4 h-4 text-red-400/80" />
            <span className="text-[9px] text-red-400/80 text-center leading-tight line-clamp-2" dir="rtl">
              {data.error}
            </span>
          </div>
        ) : (
          <>
            <img
              src={data.url}
              alt={data.prompt || "generated image"}
              className="w-full h-full object-cover pointer-events-none select-none"
              draggable={false}
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-[10px] text-neutral-200 truncate" dir="rtl">
                {data.prompt}
              </p>
            </div>
          </>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-teal-400/70 !border-none !z-10"
      />
    </div>
  );
}

export default memo(ImageNode);
