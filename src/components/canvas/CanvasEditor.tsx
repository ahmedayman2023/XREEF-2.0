import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
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
  type OnConnectStart,
  type OnConnectStartParams,
  type OnConnectEnd,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Loader2 } from "lucide-react";
import {
  auth,
  db,
  storage,
  handleFirestoreError,
  OperationType,
} from "../../firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  setDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import ImageNode, { type ImageNodeType } from "./ImageNode";
import CanvasToolbar from "./CanvasToolbar";
import GeneratePopup from "./GeneratePopup";

interface HistoryItem {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  deleted?: boolean;
  sourceId?: string;
}

interface PendingItem {
  id: string;
  sourceId: string;
  flowPos: { x: number; y: number };
  status: "loading" | "error";
  errorMsg?: string;
}

const nodeTypes = { imageNode: ImageNode };

const NODE_WIDTH = 160;
const NODE_HEIGHT = 90;
const X_GAP = 220;
const Y_GAP = 160;
const Y_GAP_CHILD = 110;
const ROW_SIZE = 5;

function makeEdge(source: string, target: string, dashed = false): Edge {
  return {
    id: `e-${source}-${target}`,
    source,
    target,
    type: "smoothstep",
    style: {
      stroke: "#2dd4bf",
      strokeWidth: 1.5,
      opacity: 0.6,
      ...(dashed ? { strokeDasharray: "4 4" } : {}),
    },
  };
}

function historyToGraph(
  history: HistoryItem[],
  labelsVisible: boolean,
): { nodes: ImageNodeType[]; edges: Edge[] } {
  const active = history.filter((item) => !item.deleted);
  const byId = new Map(active.map((item) => [item.id, item]));

  const roots = active
    .filter((item) => !item.sourceId || !byId.has(item.sourceId))
    .sort((a, b) => a.timestamp - b.timestamp);

  const positions = new Map<string, { x: number; y: number }>();

  roots.forEach((item, i) => {
    const row = Math.floor(i / ROW_SIZE);
    const col = i % ROW_SIZE;
    const isReversedRow = row % 2 === 1;
    const x = (isReversedRow ? ROW_SIZE - 1 - col : col) * X_GAP;
    const y = row * Y_GAP;
    positions.set(item.id, { x, y });
  });

  const childrenOf = new Map<string, HistoryItem[]>();
  active.forEach((item) => {
    if (item.sourceId && byId.has(item.sourceId)) {
      const list = childrenOf.get(item.sourceId) || [];
      list.push(item);
      childrenOf.set(item.sourceId, list);
    }
  });
  childrenOf.forEach((list) => list.sort((a, b) => a.timestamp - b.timestamp));

  const childCounts = new Map<string, number>();
  const queue: HistoryItem[] = [...roots];
  while (queue.length) {
    const parent = queue.shift()!;
    const parentPos = positions.get(parent.id);
    if (!parentPos) continue;
    const children = childrenOf.get(parent.id) || [];
    children.forEach((child) => {
      if (positions.has(child.id)) return;
      const childIndex = childCounts.get(parent.id) || 0;
      positions.set(child.id, {
        x: parentPos.x + X_GAP,
        y: parentPos.y + childIndex * Y_GAP_CHILD,
      });
      childCounts.set(parent.id, childIndex + 1);
      queue.push(child);
    });
  }

  const nodes: ImageNodeType[] = active.map((item) => ({
    id: item.id,
    type: "imageNode",
    position: positions.get(item.id) || { x: 0, y: 0 },
    data: {
      url: item.url,
      prompt: labelsVisible ? item.prompt : "",
      timestamp: item.timestamp,
    },
  }));

  const edges: Edge[] = [];
  active.forEach((item) => {
    if (item.sourceId && byId.has(item.sourceId)) {
      edges.push(makeEdge(item.sourceId, item.id));
    }
  });
  for (let i = 1; i < roots.length; i++) {
    edges.push(makeEdge(roots[i - 1].id, roots[i].id));
  }

  return { nodes, edges };
}

function getEventClientCoords(event: MouseEvent | TouchEvent) {
  if ("changedTouches" in event && event.changedTouches.length > 0) {
    return {
      x: event.changedTouches[0].clientX,
      y: event.changedTouches[0].clientY,
    };
  }
  const mouseEvent = event as MouseEvent;
  return { x: mouseEvent.clientX, y: mouseEvent.clientY };
}

function CanvasEditorInner() {
  const { employeeId, projectId } = useParams();
  const navigate = useNavigate();
  const { zoomIn, fitView, screenToFlowPosition } = useReactFlow();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const connectStartRef = useRef<OnConnectStartParams | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [labelsVisible, setLabelsVisible] = useState(true);

  const [nodes, setNodes, onNodesChange] = useNodesState<ImageNodeType>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const [pendingPrompt, setPendingPrompt] = useState<{
    sourceId: string;
    screenPos: { x: number; y: number };
    flowPos: { x: number; y: number };
  } | null>(null);
  const [popupError, setPopupError] = useState<string | null>(null);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);

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

  // Drop any pending placeholder once its real item has landed in history
  useEffect(() => {
    if (pendingItems.length === 0) return;
    const historyIds = new Set(history.map((h) => h.id));
    setPendingItems((prev) => prev.filter((p) => !historyIds.has(p.id)));
  }, [history]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const dismissPendingItem = useCallback((id: string) => {
    setPendingItems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const saveGeneratedImage = useCallback(
    async (id: string, outputUrl: string, promptText: string, sourceId: string) => {
      if (user && employeeId) {
        let finalUrl: string;
        try {
          const res = await fetch(`/api/proxy?url=${encodeURIComponent(outputUrl)}`);
          if (!res.ok) throw new Error(`proxy fetch failed: ${res.status}`);
          const blob = await res.blob();
          const imageRef = ref(
            storage,
            `users/${user.uid}/employees/${employeeId}/projects/${projectId}/history/${id}.png`,
          );
          await uploadBytes(imageRef, blob);
          finalUrl = await getDownloadURL(imageRef);
        } catch (err) {
          console.error("Failed to upload generated image to Storage", err);
          throw new Error("فشل حفظ الصورة الناتجة بشكل دائم. حاول مرة أخرى.");
        }
        try {
          await setDoc(
            doc(db, `users/${user.uid}/employees/${employeeId}/projects/${projectId}/history`, id),
            {
              id,
              url: finalUrl,
              prompt: promptText,
              timestamp: Date.now(),
              userId: user.uid,
              projectId,
              projectName,
              employeeId,
              sourceId,
            },
          );
        } catch (err) {
          handleFirestoreError(
            err,
            OperationType.CREATE,
            `users/${user.uid}/employees/${employeeId}/projects/${projectId}/history`,
          );
          throw err;
        }
      } else {
        const newItem: HistoryItem = {
          id,
          url: outputUrl,
          prompt: promptText,
          timestamp: Date.now(),
          sourceId,
        };
        setHistory((prev) => {
          const next = [newItem, ...prev].slice(0, 50);
          localStorage.setItem(`xreef_history_${projectId}`, JSON.stringify(next));
          return next;
        });
      }
    },
    [user, employeeId, projectId, projectName],
  );

  const generateFromNode = useCallback(
    async (sourceId: string, promptText: string) => {
      const sourceItem = history.find((h) => h.id === sourceId);
      if (!sourceItem) return;

      const newId = Math.random().toString(36).substring(2, 9);
      setPendingItems((prev) => [
        ...prev,
        {
          id: newId,
          sourceId,
          flowPos: pendingPrompt?.flowPos || { x: 0, y: 0 },
          status: "loading",
        },
      ]);

      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: promptText,
            images: [sourceItem.url],
            aspectRatio: "16:9",
            resolution: "1K",
            model: "google/nano-banana-pro",
          }),
        });

        const contentType = response.headers.get("content-type");
        let data: any;
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          throw new Error(`الخادم لم يرجع استجابة صحيحة. رمز الخطأ: ${response.status}`);
        }
        if (!response.ok) throw new Error(data.error || "حدث خطأ أثناء توليد الصورة");

        const outputUrl: string | undefined = Array.isArray(data.outputs)
          ? data.outputs[0]
          : undefined;
        if (!outputUrl) throw new Error("تنسيق الاستجابة غير متوقع");

        await saveGeneratedImage(newId, outputUrl, promptText, sourceId);
      } catch (err: any) {
        const msg = err?.message || "حدث خطأ أثناء توليد الصورة";
        setPendingItems((prev) =>
          prev.map((p) => (p.id === newId ? { ...p, status: "error", errorMsg: msg } : p)),
        );
      }
    },
    [history, pendingPrompt, saveGeneratedImage],
  );

  const handlePopupSubmit = useCallback(
    (promptText: string) => {
      const activeCount = history.filter((h) => !h.deleted).length;
      if (activeCount >= 20) {
        setPopupError("عذراً، لقد وصلت للحد الأقصى لهذا المشروع (20 صورة).");
        return;
      }
      if (!pendingPrompt) return;
      const { sourceId } = pendingPrompt;
      setPendingPrompt(null);
      setPopupError(null);
      generateFromNode(sourceId, promptText);
    },
    [history, pendingPrompt, generateFromNode],
  );

  const onConnectStart: OnConnectStart = useCallback((_event, params) => {
    connectStartRef.current = params;
  }, []);

  const onConnectEnd: OnConnectEnd = useCallback(
    (event, connectionState) => {
      const start = connectStartRef.current;
      connectStartRef.current = null;
      if (!start || start.handleType !== "source" || !start.nodeId) return;
      if (connectionState.isValid) return;

      const { x: clientX, y: clientY } = getEventClientCoords(event);
      const bounds = wrapperRef.current?.getBoundingClientRect();
      const screenPos = {
        x: clientX - (bounds?.left ?? 0),
        y: clientY - (bounds?.top ?? 0),
      };
      const flowPos = screenToFlowPosition({ x: clientX, y: clientY });

      setPopupError(null);
      setPendingPrompt({ sourceId: start.nodeId, screenPos, flowPos });
    },
    [screenToFlowPosition],
  );

  const pendingNodes: ImageNodeType[] = useMemo(
    () =>
      pendingItems.map((p) => ({
        id: p.id,
        type: "imageNode",
        position: p.flowPos,
        data: {
          url: "",
          prompt: "",
          timestamp: Date.now(),
          loading: p.status === "loading",
          error: p.status === "error" ? p.errorMsg : undefined,
          onDismiss: () => dismissPendingItem(p.id),
        },
      })),
    [pendingItems, dismissPendingItem],
  );

  const pendingEdges: Edge[] = useMemo(
    () => pendingItems.map((p) => makeEdge(p.sourceId, p.id, true)),
    [pendingItems],
  );

  const handleBack = useCallback(() => {
    navigate(`/employee/${employeeId}/project/${projectId}`);
  }, [navigate, employeeId, projectId]);

  return (
    <div
      ref={wrapperRef}
      className="w-screen h-screen bg-[#030712] relative overflow-hidden"
    >
      {!isAuthReady ? (
        <div className="w-full h-full flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-teal-500" />
        </div>
      ) : (
        <>
          <ReactFlow
            nodes={[...nodes, ...pendingNodes]}
            edges={[...edges, ...pendingEdges]}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnectStart={onConnectStart}
            onConnectEnd={onConnectEnd}
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

          {pendingPrompt && (
            <GeneratePopup
              screenPos={pendingPrompt.screenPos}
              onSubmit={handlePopupSubmit}
              onClose={() => {
                setPendingPrompt(null);
                setPopupError(null);
              }}
              errorMessage={popupError}
            />
          )}

          <CanvasToolbar
            projectName={projectName}
            imageCount={history.filter((h) => !h.deleted).length}
            user={user}
            onBack={handleBack}
            onZoomIn={() => zoomIn({ duration: 200 })}
            labelsVisible={labelsVisible}
            onToggleLabels={() => setLabelsVisible((v) => !v)}
          />

          {history.length === 0 && pendingItems.length === 0 && (
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
