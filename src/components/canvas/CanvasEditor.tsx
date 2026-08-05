import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Loader2 } from "lucide-react";
import { auth, db } from "../../firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, doc, onSnapshot, query, orderBy } from "firebase/firestore";
import ImageNode, { type ImageNodeType } from "./ImageNode";
import CanvasToolbar from "./CanvasToolbar";

interface HistoryItem {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  deleted?: boolean;
}

const nodeTypes = { imageNode: ImageNode };

const NODE_WIDTH = 160;
const NODE_HEIGHT = 90;
const X_GAP = 220;
const Y_GAP = 160;
const ROW_SIZE = 5;

function historyToGraph(
  history: HistoryItem[],
  labelsVisible: boolean,
): { nodes: ImageNodeType[]; edges: Edge[] } {
  const ordered = [...history]
    .filter((item) => !item.deleted)
    .sort((a, b) => a.timestamp - b.timestamp);

  const nodes: ImageNodeType[] = ordered.map((item, i) => {
    const row = Math.floor(i / ROW_SIZE);
    const col = i % ROW_SIZE;
    const isReversedRow = row % 2 === 1;
    const x = (isReversedRow ? ROW_SIZE - 1 - col : col) * X_GAP;
    const y = row * Y_GAP;
    return {
      id: item.id,
      type: "imageNode",
      position: { x, y },
      data: {
        url: item.url,
        prompt: labelsVisible ? item.prompt : "",
        timestamp: item.timestamp,
      },
    };
  });

  const edges: Edge[] = ordered.slice(1).map((item, i) => ({
    id: `e-${ordered[i].id}-${item.id}`,
    source: ordered[i].id,
    target: item.id,
    type: "smoothstep",
    style: { stroke: "#2dd4bf", strokeWidth: 1.5, opacity: 0.6 },
  }));

  return { nodes, edges };
}

function CanvasEditorInner() {
  const { employeeId, projectId } = useParams();
  const navigate = useNavigate();
  const { zoomIn, fitView } = useReactFlow();

  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [labelsVisible, setLabelsVisible] = useState(true);

  const [nodes, setNodes, onNodesChange] = useNodesState<ImageNodeType>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;

    if (user && employeeId) {
      const historyRef = collection(
        db,
        `users/${user.uid}/employees/${employeeId}/projects/${projectId}/history`,
      );
      const qHistory = query(historyRef, orderBy("timestamp", "desc"));
      const unsubHistory = onSnapshot(qHistory, (snapshot) => {
        const historyData: HistoryItem[] = [];
        snapshot.forEach((d) => historyData.push(d.data() as HistoryItem));
        setHistory(historyData);
      });

      const projectRef = doc(
        db,
        `users/${user.uid}/employees/${employeeId}/projects`,
        projectId!,
      );
      const unsubProject = onSnapshot(projectRef, (docSnap) => {
        if (docSnap.exists()) {
          setProjectName(docSnap.data().folderName || docSnap.data().name || "");
        }
      });

      return () => {
        unsubHistory();
        unsubProject();
      };
    } else {
      try {
        const savedHistory = localStorage.getItem(`xreef_history_${projectId}`);
        setHistory(savedHistory ? JSON.parse(savedHistory) : []);
      } catch {
        setHistory([]);
      }
    }
  }, [user, isAuthReady, employeeId, projectId]);

  const { nodes: derivedNodes, edges: derivedEdges } = useMemo(
    () => historyToGraph(history, labelsVisible),
    [history, labelsVisible],
  );

  useEffect(() => {
    setNodes(derivedNodes);
    setEdges(derivedEdges);
  }, [derivedNodes, derivedEdges, setNodes, setEdges]);

  const didFitRef = useRef(false);
  useEffect(() => {
    if (!didFitRef.current && derivedNodes.length > 0) {
      didFitRef.current = true;
      requestAnimationFrame(() => fitView({ padding: 0.3, duration: 400 }));
    }
  }, [derivedNodes, fitView]);

  const handleBack = useCallback(() => {
    navigate(`/employee/${employeeId}/project/${projectId}`);
  }, [navigate, employeeId, projectId]);

  return (
    <div className="w-screen h-screen bg-[#030712] relative overflow-hidden">
      {!isAuthReady ? (
        <div className="w-full h-full flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-teal-500" />
        </div>
      ) : (
        <>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.1}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
            className="xreef-canvas"
          >
            <Background color="#ffffff" gap={28} size={1} style={{ opacity: 0.06 }} />
            <Controls
              position="bottom-right"
              className="!bg-[#0a0a0a]/90 !border !border-white/10 !rounded-xl !shadow-lg [&>button]:!bg-transparent [&>button]:!border-white/10 [&>button]:!text-neutral-300 [&>button:hover]:!bg-white/5"
            />
          </ReactFlow>

          <CanvasToolbar
            projectName={projectName}
            imageCount={history.filter((h) => !h.deleted).length}
            user={user}
            onBack={handleBack}
            onZoomIn={() => zoomIn({ duration: 200 })}
            labelsVisible={labelsVisible}
            onToggleLabels={() => setLabelsVisible((v) => !v)}
          />

          {history.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-neutral-500 text-sm" dir="rtl">
                لا توجد صور في سجل هذا المشروع بعد
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function CanvasEditor() {
  return (
    <ReactFlowProvider>
      <CanvasEditorInner />
    </ReactFlowProvider>
  );
}
