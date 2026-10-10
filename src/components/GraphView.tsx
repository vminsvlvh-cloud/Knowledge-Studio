import { useEffect, useRef, useState, useMemo } from 'react';
import { KnowledgeNote, GraphNode, GraphEdge } from '../types';
import { buildGraphData, STATUS_META } from '../utils/wikiLinks';
import { translations } from '../utils/i18n';
import { ZoomIn, ZoomOut, RotateCcw, Filter, Tag, Play, Pause, Sparkles, Maximize2, Minimize2, Activity } from 'lucide-react';
import GraphStatsOverlay from './GraphStatsOverlay';

interface GraphViewProps {
  notes: KnowledgeNote[];
  activeNoteId?: string;
  lang?: 'en' | 'ar';
  onSelectNote: (noteId: string) => void;
}

export default function GraphView({ notes, activeNoteId, lang = 'en', onSelectNote }: GraphViewProps) {
  const t = translations[lang] || translations.en;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Controls state
  const [includeTags, setIncludeTags] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [layoutStyle, setLayoutStyle] = useState<'force' | 'hierarchical'>('force');
  const [colorMode, setColorMode] = useState<'folder' | 'status'>('folder');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPhysicsRunning, setIsPhysicsRunning] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Real-time Vault Statistics Overlay state
  const [isStatsOverlayOpen, setIsStatsOverlayOpen] = useState(true);
  const [highlightedHubId, setHighlightedHubId] = useState<string | null>(null);
  const highlightedHubIdRef = useRef<string | null>(null);

  const handleHoverHub = (hubId: string | null) => {
    setHighlightedHubId(hubId);
    highlightedHubIdRef.current = hubId;
  };

  // Tooltip & Hover state
  const [hoveredNode, setHoveredNode] = useState<{ node: GraphNode; screenX: number; screenY: number } | null>(null);

  // Transform (pan & zoom)
  const transformRef = useRef({ x: 0, y: 0, scale: 1 });
  const isDraggingCanvasRef = useRef(false);
  const draggedNodeRef = useRef<GraphNode | null>(null);
  const dragStartPosRef = useRef({ x: 0, y: 0 });

  // Center and focus node helper from Hub click
  const handleFocusNode = (nodeId: string) => {
    const simNode = simNodesRef.current.get(nodeId);
    if (!simNode || !containerRef.current) return;
    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 600;
    const targetScale = 1.35;
    transformRef.current = {
      x: (width / 2 - (simNode.x || width / 2)) * targetScale,
      y: (height / 2 - (simNode.y || height / 2)) * targetScale,
      scale: targetScale,
    };
    setHoveredNode({
      node: simNode,
      screenX: width / 2,
      screenY: height / 2,
    });
  };

  // Extract unique folders
  const folders = useMemo(() => {
    const set = new Set(notes.map((n) => n.folder));
    return ['all', ...Array.from(set)];
  }, [notes]);

  // Extract all unique tags with count
  const allTags = useMemo(() => {
    const tagCountMap = new Map<string, number>();
    notes.forEach((n) => {
      (n.tags || []).forEach((t) => {
        const clean = t.replace(/^#/, '');
        tagCountMap.set(clean, (tagCountMap.get(clean) || 0) + 1);
      });
    });
    return Array.from(tagCountMap.entries()).sort((a, b) => b[1] - a[1]);
  }, [notes]);

  // Build graph data
  const rawGraph = useMemo(() => {
    return buildGraphData(notes, includeTags);
  }, [notes, includeTags]);

  // Filtered graph
  const filteredData = useMemo(() => {
    let filteredNodes = rawGraph.nodes;

    if (selectedFolder !== 'all') {
      filteredNodes = filteredNodes.filter((n) => n.folder === selectedFolder || n.type === 'tag');
    }

    if (selectedTag !== 'all') {
      const cleanSelected = selectedTag.toLowerCase().replace(/^#/, '');
      filteredNodes = filteredNodes.filter((n) => {
        if (n.type === 'tag') {
          const cleanTitle = n.title.toLowerCase().replace(/^#/, '');
          return cleanTitle === cleanSelected;
        }
        return (n.tags || []).some((t) => t.toLowerCase().replace(/^#/, '') === cleanSelected);
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filteredNodes = filteredNodes.filter((n) => n.title.toLowerCase().includes(q) || n.tags.some((t) => t.toLowerCase().includes(q)));
    }

    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredEdges = rawGraph.edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));

    return { nodes: filteredNodes, edges: filteredEdges };
  }, [rawGraph, selectedFolder, selectedTag, searchQuery]);

  // Calculate Hierarchical Layout targets and tiers
  const { hierarchicalTargets, hierarchicalTiers } = useMemo(() => {
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;
    const cx = width / 2;
    const cy = height / 2;

    const degrees = new Map<string, number>();
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    filteredData.nodes.forEach((n) => {
      degrees.set(n.id, 0);
      inDegree.set(n.id, 0);
      adjacency.set(n.id, []);
    });

    filteredData.edges.forEach((e) => {
      degrees.set(e.source, (degrees.get(e.source) || 0) + 1);
      degrees.set(e.target, (degrees.get(e.target) || 0) + 1);
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
      adjacency.get(e.source)?.push(e.target);
      adjacency.get(e.target)?.push(e.source);
    });

    // Sort by connectivity for root identification
    const sortedByDegree = [...filteredData.nodes].sort(
      (a, b) => (degrees.get(b.id) || 0) - (degrees.get(a.id) || 0)
    );

    const nodeLevel = new Map<string, number>();
    const visited = new Set<string>();
    const queue: string[] = [];

    const rootCount = Math.max(1, Math.min(4, Math.ceil(filteredData.nodes.length * 0.25)));
    const roots = sortedByDegree.slice(0, rootCount);

    roots.forEach((r) => {
      nodeLevel.set(r.id, 0);
      visited.add(r.id);
      queue.push(r.id);
    });

    // BFS assignment of levels (0: Hubs, 1: Primary branches, 2: Secondary notes, 3: Leaves/tags)
    while (queue.length > 0) {
      const currId = queue.shift()!;
      const currLvl = nodeLevel.get(currId)!;
      const neighbors = adjacency.get(currId) || [];

      neighbors.forEach((nbrId) => {
        if (!visited.has(nbrId)) {
          visited.add(nbrId);
          const nextLvl = Math.min(3, currLvl + 1);
          nodeLevel.set(nbrId, nextLvl);
          queue.push(nbrId);
        }
      });
    }

    // Unvisited nodes
    filteredData.nodes.forEach((n) => {
      if (!visited.has(n.id)) {
        nodeLevel.set(n.id, n.type === 'tag' ? 3 : 2);
        visited.add(n.id);
      }
    });

    // Group nodes by level
    const levelGroups = new Map<number, GraphNode[]>();
    filteredData.nodes.forEach((n) => {
      const lvl = nodeLevel.get(n.id) ?? 1;
      if (!levelGroups.has(lvl)) levelGroups.set(lvl, []);
      levelGroups.get(lvl)!.push(n);
    });

    const activeLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b);
    const totalLevels = Math.max(1, activeLevels.length);
    const verticalSpacing = Math.min(130, Math.max(85, (height - 180) / Math.max(1, totalLevels - 1)));
    const startY = cy - ((totalLevels - 1) * verticalSpacing) / 2;

    const targets = new Map<string, { x: number; y: number; level: number }>();
    const tiers: { y: number; level: number; label: string }[] = [];

    activeLevels.forEach((lvl, lvlIdx) => {
      const rowNodes = levelGroups.get(lvl) || [];
      rowNodes.sort((a, b) => a.title.localeCompare(b.title));

      const rowY = startY + lvlIdx * verticalSpacing;
      const rowWidth = Math.min(width - 120, Math.max(180, rowNodes.length * 115));
      const startX = cx - rowWidth / 2;
      const stepX = rowNodes.length > 1 ? rowWidth / (rowNodes.length - 1) : 0;

      rowNodes.forEach((node, idx) => {
        const x = rowNodes.length === 1 ? cx : startX + idx * stepX;
        targets.set(node.id, { x, y: rowY, level: lvl });
      });

      let tierLabel = t.tierBranches;
      if (lvl === 0) tierLabel = t.tierHubs;
      else if (lvl >= 2) tierLabel = t.tierLeaves;

      tiers.push({ y: rowY, level: lvl, label: tierLabel });
    });

    return { hierarchicalTargets: targets, hierarchicalTiers: tiers };
  }, [filteredData, t]);

  // Persistent simulation nodes to keep positions smooth across renders
  const simNodesRef = useRef<Map<string, GraphNode>>(new Map());

  // Setup/sync simulation nodes
  useEffect(() => {
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;

    const currentMap = simNodesRef.current;
    const newMap = new Map<string, GraphNode>();

    filteredData.nodes.forEach((node) => {
      const existing = currentMap.get(node.id);
      if (existing) {
        newMap.set(node.id, {
          ...node,
          x: existing.x,
          y: existing.y,
          vx: existing.vx || 0,
          vy: existing.vy || 0,
        });
      } else {
        // Random initial position around center
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 200 + 40;
        newMap.set(node.id, {
          ...node,
          x: width / 2 + Math.cos(angle) * radius,
          y: height / 2 + Math.sin(angle) * radius,
          vx: 0,
          vy: 0,
        });
      }
    });

    simNodesRef.current = newMap;
  }, [filteredData.nodes]);

  // Reset transform to center
  const resetView = () => {
    if (!containerRef.current) return;
    transformRef.current = { x: 0, y: 0, scale: 1 };
  };

  // Zoom helpers
  const handleZoom = (delta: number) => {
    const current = transformRef.current;
    const newScale = Math.max(0.2, Math.min(3, current.scale + delta));
    transformRef.current.scale = newScale;
  };

  // Canvas Force Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const handleResize = () => {
      if (!containerRef.current || !canvas) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const simulationTick = () => {
      const nodes = Array.from(simNodesRef.current.values());
      const width = containerRef.current?.clientWidth || 800;
      const height = containerRef.current?.clientHeight || 600;
      const cx = width / 2;
      const cy = height / 2;

      if (isPhysicsRunning) {
        if (layoutStyle === 'hierarchical') {
          // Hierarchical smooth glide & tier alignment
          nodes.forEach((n) => {
            if (draggedNodeRef.current === n) return;
            const target = hierarchicalTargets.get(n.id);
            if (!target) return;

            const dx = target.x - (n.x || target.x);
            const dy = target.y - (n.y || target.y);

            // Restorative pull towards hierarchical grid slot
            n.vx = ((n.vx || 0) + dx * 0.09) * 0.78;
            n.vy = ((n.vy || 0) + dy * 0.09) * 0.78;

            n.x = (n.x || 0) + (n.vx || 0);
            n.y = (n.y || 0) + (n.vy || 0);
          });

          // Horizontal spacing repulsion to prevent overlapping cards on the same tier
          for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
              const n1 = nodes[i];
              const n2 = nodes[j];
              const dx = (n2.x || 0) - (n1.x || 0);
              const dy = (n2.y || 0) - (n1.y || 0);
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              const minDist = (n1.val + n2.val) * 2.4;
              if (dist < minDist) {
                const force = ((minDist - dist) / dist) * 0.4;
                const fx = dx * force;
                const fy = dy * force * 0.2; // keep y largely pinned to tier line
                if (draggedNodeRef.current !== n1) {
                  n1.x = (n1.x || 0) - fx * 0.5;
                  n1.y = (n1.y || 0) - fy * 0.5;
                }
                if (draggedNodeRef.current !== n2) {
                  n2.x = (n2.x || 0) + fx * 0.5;
                  n2.y = (n2.y || 0) + fy * 0.5;
                }
              }
            }
          }
        } else {
          // 1. Repulsion between all pairs of nodes (Organic Force-Directed)
          for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
              const n1 = nodes[i];
              const n2 = nodes[j];
              const dx = (n2.x || 0) - (n1.x || 0);
              const dy = (n2.y || 0) - (n1.y || 0);
              const distSq = dx * dx + dy * dy || 1;
              const dist = Math.sqrt(distSq);

              const minDist = (n1.val + n2.val) * 2.5;
              const force = (5000 / distSq) * (dist < minDist ? 2.5 : 1);

              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;

              if (draggedNodeRef.current !== n1) {
                n1.vx = (n1.vx || 0) - fx;
                n1.vy = (n1.vy || 0) - fy;
              }
              if (draggedNodeRef.current !== n2) {
                n2.vx = (n2.vx || 0) + fx;
                n2.vy = (n2.vy || 0) + fy;
              }
            }
          }

          // 2. Spring attraction along edges
          filteredData.edges.forEach((edge) => {
            const s = simNodesRef.current.get(edge.source);
            const t = simNodesRef.current.get(edge.target);
            if (!s || !t) return;

            const dx = (t.x || 0) - (s.x || 0);
            const dy = (t.y || 0) - (s.y || 0);
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const targetDist = 90;
            const springForce = (dist - targetDist) * 0.035;

            const fx = (dx / dist) * springForce;
            const fy = (dy / dist) * springForce;

            if (draggedNodeRef.current !== s) {
              s.vx = (s.vx || 0) + fx;
              s.vy = (s.vy || 0) + fy;
            }
            if (draggedNodeRef.current !== t) {
              t.vx = (t.vx || 0) - fx;
              t.vy = (t.vy || 0) - fy;
            }
          });

          // 3. Gentle center pull & velocity damping
          nodes.forEach((n) => {
            if (draggedNodeRef.current === n) return;

            const pullX = (cx - (n.x || cx)) * 0.004;
            const pullY = (cy - (n.y || cy)) * 0.004;

            n.vx = ((n.vx || 0) + pullX) * 0.85;
            n.vy = ((n.vy || 0) + pullY) * 0.85;

            n.x = (n.x || 0) + (n.vx || 0);
            n.y = (n.y || 0) + (n.vy || 0);
          });
        }
      }

      // Render Canvas
      const rect = containerRef.current?.getBoundingClientRect();
      const w = rect?.width || 800;
      const h = rect?.height || 600;

      ctx.clearRect(0, 0, w, h);
      ctx.save();

      const { x, y, scale } = transformRef.current;
      ctx.translate(x + w / 2, y + h / 2);
      ctx.scale(scale, scale);
      ctx.translate(-w / 2, -h / 2);

      // In hierarchical mode, draw delicate tier guidelines and tier badges in background
      if (layoutStyle === 'hierarchical' && hierarchicalTiers.length > 0) {
        ctx.save();
        ctx.setLineDash([4, 6]);
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.45)';
        ctx.lineWidth = 1;
        ctx.font = '11px sans-serif';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
        ctx.textAlign = lang === 'ar' ? 'right' : 'left';

        hierarchicalTiers.forEach((tier) => {
          ctx.beginPath();
          ctx.moveTo(w / 2 - 380, tier.y);
          ctx.lineTo(w / 2 + 380, tier.y);
          ctx.stroke();

          const labelX = lang === 'ar' ? w / 2 + 370 : w / 2 - 370;
          ctx.fillText(tier.label, labelX, tier.y - 8);
        });
        ctx.restore();
      }

      const activeHoverId = hoveredNode?.node?.id || highlightedHubIdRef.current;
      const highlightedIds = new Set<string>();

      if (activeHoverId) {
        highlightedIds.add(activeHoverId);
        filteredData.edges.forEach((e) => {
          if (e.source === activeHoverId) highlightedIds.add(e.target);
          if (e.target === activeHoverId) highlightedIds.add(e.source);
        });
      }

      // Draw Edges
      filteredData.edges.forEach((edge) => {
        const s = simNodesRef.current.get(edge.source);
        const t = simNodesRef.current.get(edge.target);
        if (!s || !t) return;

        const isRelated = activeHoverId && (edge.source === activeHoverId || edge.target === activeHoverId);
        const isDimmed = activeHoverId && !isRelated;

        ctx.beginPath();
        ctx.moveTo(s.x || 0, s.y || 0);
        ctx.lineTo(t.x || 0, t.y || 0);

        if (isRelated) {
          ctx.strokeStyle = '#6366f1';
          ctx.lineWidth = 2.5;
        } else if (isDimmed) {
          ctx.strokeStyle = 'rgba(156, 163, 175, 0.12)';
          ctx.lineWidth = 1;
        } else {
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
          ctx.lineWidth = 1.2;
        }
        ctx.stroke();
      });

      // Draw Nodes
      nodes.forEach((node) => {
        const nx = node.x || 0;
        const ny = node.y || 0;
        const isHovered = activeHoverId === node.id;
        const isActiveSelected = activeNoteId === node.id;
        const isHubHovered = highlightedHubIdRef.current === node.id;
        const isHighlighted = highlightedIds.has(node.id);
        const isDimmed = activeHoverId && !isHighlighted;

        let nodeColor = node.color;
        if (colorMode === 'status' && node.status) {
          if (node.status === 'seed') nodeColor = '#10b981';
          else if (node.status === 'growing') nodeColor = '#f59e0b';
          else if (node.status === 'evergreen') nodeColor = '#6366f1';
          else nodeColor = '#71717a';
        }

        ctx.save();
        ctx.globalAlpha = isDimmed ? 0.2 : 1;

        // Outer halo / glow for active, hovered, or hub-highlighted
        if (isActiveSelected || isHovered || isHubHovered) {
          ctx.beginPath();
          ctx.arc(nx, ny, node.val + (isHubHovered ? 8 : 6), 0, Math.PI * 2);
          ctx.fillStyle = isHubHovered
            ? 'rgba(99, 102, 241, 0.35)'
            : isActiveSelected
            ? 'rgba(99, 102, 241, 0.25)'
            : 'rgba(236, 72, 153, 0.25)';
          ctx.fill();
        }

        // Node Circle
        ctx.beginPath();
        ctx.arc(nx, ny, node.val, 0, Math.PI * 2);
        ctx.fillStyle = nodeColor;
        ctx.fill();

        ctx.strokeStyle = isActiveSelected ? '#4338ca' : '#ffffff';
        ctx.lineWidth = isActiveSelected ? 2.5 : 1.5;
        ctx.stroke();

        // Node Label
        const showLabel = scale > 0.6 || isHovered || isActiveSelected || node.val > 10;
        if (showLabel) {
          ctx.font = `${isHovered || isActiveSelected ? 'bold ' : ''}${Math.max(10, Math.min(13, 11 / scale))}px sans-serif`;
          ctx.fillStyle = isDimmed ? 'rgba(100, 116, 139, 0.3)' : '#1e293b';
          ctx.textAlign = 'center';
          ctx.fillText(node.title, nx, ny + node.val + 13);
        }

        ctx.restore();
      });

      ctx.restore();

      animationId = requestAnimationFrame(simulationTick);
    };

    animationId = requestAnimationFrame(simulationTick);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [filteredData, colorMode, activeNoteId, hoveredNode, isPhysicsRunning]);

  // Pointer coordinate conversions
  const getCanvasCoords = (clientX: number, clientY: number) => {
    if (!canvasRef.current || !containerRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const rawX = clientX - rect.left;
    const rawY = clientY - rect.top;

    const w = rect.width;
    const h = rect.height;
    const { x, y, scale } = transformRef.current;

    // Inverse of: (pt - center) * scale + center + offset
    const worldX = (rawX - (x + w / 2)) / scale + w / 2;
    const worldY = (rawY - (y + h / 2)) / scale + h / 2;

    return { x: worldX, y: worldY };
  };

  // Find node under mouse
  const findNodeAt = (worldX: number, worldY: number): GraphNode | null => {
    const nodes = Array.from(simNodesRef.current.values());
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const dx = worldX - (n.x || 0);
      const dy = worldY - (n.y || 0);
      if (dx * dx + dy * dy <= (n.val + 4) * (n.val + 4)) {
        return n;
      }
    }
    return null;
  };

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    const clickedNode = findNodeAt(x, y);

    if (clickedNode) {
      draggedNodeRef.current = clickedNode;
    } else {
      isDraggingCanvasRef.current = true;
      dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);

    if (draggedNodeRef.current) {
      draggedNodeRef.current.x = x;
      draggedNodeRef.current.y = y;
      draggedNodeRef.current.vx = 0;
      draggedNodeRef.current.vy = 0;
      return;
    }

    if (isDraggingCanvasRef.current) {
      const dx = e.clientX - dragStartPosRef.current.x;
      const dy = e.clientY - dragStartPosRef.current.y;
      dragStartPosRef.current = { x: e.clientX, y: e.clientY };
      transformRef.current.x += dx;
      transformRef.current.y += dy;
      return;
    }

    // Check hover
    const nodeUnder = findNodeAt(x, y);
    if (nodeUnder) {
      const rect = containerRef.current?.getBoundingClientRect();
      setHoveredNode({
        node: nodeUnder,
        screenX: e.clientX - (rect?.left || 0),
        screenY: e.clientY - (rect?.top || 0),
      });
    } else {
      setHoveredNode(null);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (draggedNodeRef.current) {
      draggedNodeRef.current = null;
    }
    isDraggingCanvasRef.current = false;
  };

  const handleClick = (e: React.MouseEvent) => {
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    const clicked = findNodeAt(x, y);
    if (clicked && clicked.type === 'note') {
      onSelectNote(clicked.id);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.08 : -0.08;
    handleZoom(zoomDelta);
  };

  return (
    <div
      ref={containerRef}
      id="knowledge-graph-container"
      className={`relative w-full h-full bg-stone-50/60 overflow-hidden flex flex-col select-none ${
        isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''
      }`}
    >
      {/* Top Floating Control Bar */}
      <div
        id="graph-controls-bar"
        className="absolute top-4 start-4 end-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none"
      >
        <div className="flex items-center gap-2 pointer-events-auto bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-xs border border-stone-200">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-semibold text-stone-800 tracking-tight">{t.interactiveGraph}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium">
            {filteredData.nodes.length} {t.nodes} · {filteredData.edges.length} {t.connections}
          </span>
        </div>

        {/* Filter & Display Settings */}
        <div className="flex items-center gap-2 pointer-events-auto bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-xs border border-stone-200">
          {/* Folder filter */}
          <div className="flex items-center gap-1.5 text-xs text-stone-600">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <select
              id="graph-folder-select"
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              aria-label="Filter graph by folder"
              className="bg-transparent border-0 text-xs font-medium text-stone-800 focus:ring-0 cursor-pointer"
            >
              {folders.map((f) => (
                <option key={f} value={f}>
                  {f === 'all' ? (lang === 'ar' ? 'جميع المجلدات' : 'All Folders') : f}
                </option>
              ))}
            </select>
          </div>

          <div className="h-4 w-px bg-stone-200 mx-1" />

          {/* Color Mode Toggle */}
          <button
            id="graph-color-mode-toggle"
            type="button"
            onClick={() => setColorMode((prev) => (prev === 'folder' ? 'status' : 'folder'))}
            className="text-xs px-2 py-1 rounded-lg hover:bg-stone-100 text-stone-700 font-medium transition-colors cursor-pointer"
            title={lang === 'ar' ? 'تبديل تلوين العقد بين التصنيف وحالة النمو' : 'Switch color coding between Category and Growth Status'}
          >
            {lang === 'ar' ? 'اللون:' : 'Color:'}{' '}
            <span className="text-indigo-600 font-semibold">
              {colorMode === 'folder' ? (lang === 'ar' ? 'التصنيف' : 'Category') : (lang === 'ar' ? 'النمو' : 'Growth')}
            </span>
          </button>

          <div className="h-4 w-px bg-stone-200 mx-1" />

          {/* Tags Hubs Toggle */}
          <button
            id="graph-tags-toggle"
            type="button"
            onClick={() => setIncludeTags((prev) => !prev)}
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              includeTags ? 'bg-pink-50 text-pink-600 border border-pink-200' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Tag className="w-3 h-3" />
            <span>{lang === 'ar' ? '#وسوم' : '#Tags'}</span>
          </button>

          <div className="h-4 w-px bg-stone-200 mx-1" />

          {/* Real-time Stats Overlay Toggle */}
          <button
            id="graph-stats-overlay-toggle"
            type="button"
            onClick={() => setIsStatsOverlayOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              isStatsOverlayOpen
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
            title={
              isStatsOverlayOpen
                ? lang === 'ar'
                  ? 'إخفاء لوحة الإحصائيات'
                  : 'Hide Stats Overlay'
                : lang === 'ar'
                ? 'إظهار لوحة الإحصائيات'
                : 'Show Stats Overlay'
            }
          >
            <Activity className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">{t.statsOverlayToggle}</span>
          </button>

          <div className="h-4 w-px bg-stone-200 mx-1" />

          {/* Physics Pause/Play */}
          <button
            id="graph-physics-toggle"
            type="button"
            onClick={() => setIsPhysicsRunning((prev) => !prev)}
            className="p-1 text-stone-600 hover:text-stone-900 rounded-md hover:bg-stone-100 cursor-pointer"
            title={isPhysicsRunning ? (lang === 'ar' ? 'إيقاف المحاكاة مؤقتاً' : 'Pause simulation physics') : (lang === 'ar' ? 'استئناف المحاكاة' : 'Resume simulation physics')}
          >
            {isPhysicsRunning ? <Pause className="w-3.5 h-3.5 text-stone-500" /> : <Play className="w-3.5 h-3.5 text-indigo-600" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            id="graph-fullscreen-toggle"
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="p-1 text-stone-600 hover:text-stone-900 rounded-md hover:bg-stone-100 cursor-pointer"
            title={isFullscreen ? (lang === 'ar' ? 'إنهاء ملء الشاشة' : 'Exit Fullscreen') : (lang === 'ar' ? 'ملء الشاشة' : 'Fullscreen Graph')}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Real-time Vault Analytics Overlay */}
      <GraphStatsOverlay
        notes={notes}
        tags={allTags}
        selectedTag={selectedTag}
        onSelectTag={setSelectedTag}
        layoutStyle={layoutStyle}
        onToggleLayoutStyle={setLayoutStyle}
        visibleNodesCount={filteredData.nodes.length}
        visibleEdgesCount={filteredData.edges.length}
        isFiltered={selectedFolder !== 'all' || selectedTag !== 'all' || searchQuery.trim().length > 0}
        activeFilterLabel={
          [
            selectedFolder !== 'all' ? selectedFolder : null,
            selectedTag !== 'all' ? `#${selectedTag}` : null,
            searchQuery.trim() ? `"${searchQuery.trim()}"` : null,
          ]
            .filter(Boolean)
            .join(' · ') || undefined
        }
        lang={lang}
        onFocusNode={handleFocusNode}
        onSelectNote={onSelectNote}
        onHoverHub={handleHoverHub}
        isOpen={isStatsOverlayOpen}
        onClose={() => setIsStatsOverlayOpen(false)}
      />

      {/* Floating Bottom Zoom Controls */}
      <div id="graph-zoom-controls" className="absolute bottom-5 end-5 z-20 flex flex-col gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-xl shadow-xs border border-stone-200">
        <button
          id="graph-zoom-in-btn"
          type="button"
          onClick={() => handleZoom(0.2)}
          aria-label="Zoom in"
          className="p-2 text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
          title={lang === 'ar' ? 'تكبير' : 'Zoom In'}
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          id="graph-zoom-out-btn"
          type="button"
          onClick={() => handleZoom(-0.2)}
          aria-label="Zoom out"
          className="p-2 text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
          title={lang === 'ar' ? 'تصغير' : 'Zoom Out'}
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          id="graph-reset-view-btn"
          type="button"
          onClick={resetView}
          aria-label="Reset zoom and center view"
          className="p-2 text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
          title={lang === 'ar' ? 'إعادة ضبط العرض' : 'Reset View'}
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        id="knowledge-graph-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Interactive Tooltip on Hover */}
      {hoveredNode && (
        <div
          id="graph-node-tooltip"
          className="absolute z-30 pointer-events-none bg-stone-900/95 backdrop-blur-md text-white px-3.5 py-2.5 rounded-xl shadow-lg border border-stone-700 max-w-xs transition-opacity duration-150"
          style={{
            left: Math.min(window.innerWidth - 260, hoveredNode.screenX + 15),
            top: Math.min(window.innerHeight - 150, hoveredNode.screenY + 15),
          }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            {hoveredNode.node.status && (
              <span className="text-xs">{STATUS_META[hoveredNode.node.status]?.icon}</span>
            )}
            <span className="text-xs font-semibold tracking-tight text-stone-100 truncate">
              {hoveredNode.node.title}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-stone-400">
            <span className="capitalize">{hoveredNode.node.folder}</span>
            <span>·</span>
            <span>{lang === 'ar' ? 'انقر لفتح الملاحظة' : 'Click to open note'}</span>
          </div>
          {hoveredNode.node.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {hoveredNode.node.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-300">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subtle Legend footer */}
      <div className="absolute bottom-4 start-4 z-10 hidden sm:flex items-center gap-4 text-[11px] text-stone-500 bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-stone-200">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span>{lang === 'ar' ? 'أنظمة المعرفة' : 'Knowledge Systems'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          <span>{lang === 'ar' ? 'النماذج الذهنية' : 'Mental Models'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
          <span>{lang === 'ar' ? 'الهندسة' : 'Engineering'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>{lang === 'ar' ? 'العلوم الإدراكية' : 'Cognitive Science'}</span>
        </div>
      </div>
    </div>
  );
}
