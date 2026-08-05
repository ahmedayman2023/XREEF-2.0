import React, { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";

export interface ImageNodeData {
  url: string;
  prompt: string;
  timestamp: number;
  [key: string]: unknown;
}

export type ImageNodeType = Node<ImageNodeData, "imageNode">;

function ImageNode({ data, selected }: NodeProps<ImageNodeType>) {
  return (
    <div
      className={`group relative w-[160px] h-[90px] rounded-xl overflow-hidden border transition-all ${
        selected
          ? "border-teal-400/70 shadow-[0_0_0_2px_rgba(45,212,191,0.35),0_0_20px_rgba(45,212,191,0.25)]"
          : "border-white/10 hover:border-white/20"
      } bg-[#0a0a0a]`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-teal-400/70 !border-none"
      />
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
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-teal-400/70 !border-none"
      />
    </div>
  );
}

export default memo(ImageNode);
