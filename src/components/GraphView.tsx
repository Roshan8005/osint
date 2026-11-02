import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { GraphEdge, GraphNode } from '../types/osint';

interface GraphViewProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  targetName: string;
}

export const GraphView: React.FC<GraphViewProps> = ({ nodes: rawNodes, edges: rawEdges, targetName }) => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [filterType, setFilterType] = useState<string>('all');

  // Simulated node positions
  const [simNodes, setSimNodes] = useState<GraphNode[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  // Layout initialization
  useEffect(() => {
    if (rawNodes.length === 0) {
      setSimNodes([]);
      return;
    }

    const width = 800;
    const height = 500;
    const centerX = width / 2;
    const centerY = height / 2;

    const initialized: GraphNode[] = rawNodes.map((n, i) => {
      if (n.type === 'target') {
        return { ...n, x: centerX, y: centerY };
      }
      // Radial layout based on index and type
      const angle = (i / Math.max(rawNodes.length - 1, 1)) * 2 * Math.PI;
      const radius = n.type === 'contact' ? 240 : n.type === 'username' ? 180 : 130;
      return {
        ...n,
        x: centerX + Math.cos(angle) * radius + (Math.random() * 20 - 10),
        y: centerY + Math.sin(angle) * radius + (Math.random() * 20 - 10),
      };
    });

    setSimNodes(initialized);
  }, [rawNodes]);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).tagName === 'rect') {
      setIsPanning(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Node Dragging
  const handleNodeDrag = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const targetNode = simNodes.find((n) => n.id === nodeId);
    if (!targetNode) return;
    const initialNodeX = targetNode.x || 0;
    const initialNodeY = targetNode.y || 0;

    const onMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startX) / zoom;
      const dy = (moveEvent.clientY - startY) / zoom;
      setSimNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId ? { ...n, x: initialNodeX + dx, y: initialNodeY + dy } : n
        )
      );
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const filteredNodes = simNodes.filter((n) => filterType === 'all' || n.type === filterType);
  const activeNodeIds = new Set(filteredNodes.map((n) => n.id));
  const filteredEdges = rawEdges.filter(
    (e) => activeNodeIds.has(e.source) && activeNodeIds.has(e.target)
  );

  const getNodeColor = (type: GraphNode['type']) => {
    switch (type) {
      case 'target':
        return '#06b6d4'; // Cyan
      case 'username':
        return '#10b981'; // Emerald
      case 'domain':
        return '#3b82f6'; // Blue
      case 'email':
        return '#8b5cf6'; // Purple
      case 'ip':
        return '#f59e0b'; // Amber
      case 'contact':
        return '#ec4899'; // Pink
      default:
        return '#64748b'; // Slate
    }
  };

  return (
    <div className="relative w-full h-[600px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex flex-col shadow-inner">
      {/* Top Toolbar */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-lg p-1.5 backdrop-blur">
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.2, 2.5))}
          className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z - 0.2, 0.4))}
          className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1" />

        {/* Filters */}
        <div className="flex items-center gap-1 text-xs">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-slate-300 text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Entities ({rawNodes.length})</option>
            <option value="username">Usernames</option>
            <option value="domain">Domains</option>
            <option value="ip">IPs & Infrastructure</option>
            <option value="email">Emails</option>
            <option value="contact">Contacts</option>
          </select>
        </div>
      </div>

      {/* Legend Badge */}
      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-3 bg-slate-900/80 border border-slate-800/80 rounded-lg px-3 py-1.5 text-[11px] font-mono text-slate-400 backdrop-blur">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Target
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Identity
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Domain
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> IP
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-pink-400" /> Verified Contact
        </span>
      </div>

      {/* Interactive SVG Canvas */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <defs>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeOpacity="0.4" />
          </pattern>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="22"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
          </marker>
        </defs>

        <rect width="100%" height="100%" fill="url(#grid)" />

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Edges */}
          {filteredEdges.map((edge) => {
            const sourceNode = simNodes.find((n) => n.id === edge.source);
            const targetNode = simNodes.find((n) => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            return (
              <g key={edge.id} className="transition-all">
                <line
                  x1={sourceNode.x || 0}
                  y1={sourceNode.y || 0}
                  x2={targetNode.x || 0}
                  y2={targetNode.y || 0}
                  stroke="#334155"
                  strokeWidth="1.5"
                  strokeDasharray={edge.relationshipType === 'owns' ? '4 2' : 'none'}
                  markerEnd="url(#arrow)"
                />
                <text
                  x={((sourceNode.x || 0) + (targetNode.x || 0)) / 2}
                  y={((sourceNode.y || 0) + (targetNode.y || 0)) / 2 - 4}
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {edge.label}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {filteredNodes.map((node) => {
            const isSelected = selectedNode?.id === node.id;
            const color = getNodeColor(node.type);
            const isTarget = node.type === 'target';

            return (
              <g
                key={node.id}
                transform={`translate(${node.x || 0}, ${node.y || 0})`}
                onMouseDown={(e) => handleNodeDrag(node.id, e)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode(node);
                }}
                className="cursor-pointer group"
              >
                {/* Node Aura */}
                <circle
                  r={isTarget ? 24 : 16}
                  fill={color}
                  fillOpacity={isSelected ? 0.35 : 0.15}
                  stroke={color}
                  strokeWidth={isSelected ? 3 : 1.5}
                  className="transition-all duration-150 group-hover:scale-110"
                />

                {/* Inner Icon / Dot */}
                <circle r={isTarget ? 8 : 5} fill={color} />

                {/* Label */}
                <text
                  y={isTarget ? 36 : 26}
                  fill="#f1f5f9"
                  fontSize={isTarget ? 12 : 10}
                  fontFamily="monospace"
                  fontWeight={isTarget ? 'bold' : 'normal'}
                  textAnchor="middle"
                  className="pointer-events-none drop-shadow"
                >
                  {node.label.length > 24 ? `${node.label.slice(0, 22)}...` : node.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Selected Node Details Drawer */}
      {selectedNode && (
        <div className="absolute top-3 right-3 z-30 w-80 bg-slate-900/95 border border-slate-800 rounded-xl p-4 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getNodeColor(selectedNode.type) }}
              />
              <span className="text-xs uppercase font-mono font-bold text-slate-300">
                {selectedNode.type} Entity
              </span>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-slate-800"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <p className="text-[10px] uppercase font-mono text-slate-500">Node Identifier</p>
              <p className="font-mono text-slate-200 font-semibold break-all">{selectedNode.label}</p>
            </div>

            {selectedNode.status && (
              <div>
                <p className="text-[10px] uppercase font-mono text-slate-500">Verification Posture</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {selectedNode.status === 'PUBLIC_VERIFIED' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                      <ShieldCheck className="w-3 h-3" /> Publicly Verified
                    </span>
                  ) : selectedNode.status === 'OWNER_AUTHORIZED' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800">
                      <ShieldCheck className="w-3 h-3" /> Owner Authorized
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800">
                      <AlertTriangle className="w-3 h-3" /> Unverified Match
                    </span>
                  )}
                </div>
              </div>
            )}

            {selectedNode.details && (
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[11px] font-mono space-y-1">
                {Object.entries(selectedNode.details).map(([k, v]) => {
                  if (!v || typeof v === 'object') return null;
                  return (
                    <div key={k} className="flex justify-between gap-2">
                      <span className="text-slate-500 uppercase">{k}:</span>
                      <span className="text-slate-300 truncate max-w-[150px]">{String(v)}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedNode.details?.url && (
              <a
                href={selectedNode.details.url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 flex items-center justify-center gap-1.5 w-full py-1.5 px-3 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 rounded text-xs transition"
              >
                <span>Inspect Source Online</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
