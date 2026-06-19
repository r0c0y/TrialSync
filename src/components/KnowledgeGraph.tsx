'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { playClick } from '@/lib/sounds';
import { ZoomIn, ZoomOut, Maximize2, RefreshCw } from 'lucide-react';

interface KGNode {
  id: string;
  label: string;
  type: 'evidence' | 'protocol' | 'sap' | 'conflict' | 'signal' | 'decision' | 'trial';
  radius: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  glowColor: string;
  data?: any;
}

interface KGEdge {
  source: string;
  target: string;
  label: string;
  color: string;
  dashed?: boolean;
  weight?: number;
}

interface KnowledgeGraphProps {
  trialName?: string;
  evidenceBrief?: any;
  protocol?: any;
  sap?: any;
  conflicts?: any[];
  onNodeClick?: (node: KGNode) => void;
}

const COLORS: Record<string, string> = {
  trial:    '#ec4899',
  evidence: '#3b82f6',
  protocol: '#8b5cf6',
  sap:      '#f59e0b',
  conflict: '#ef4444',
  signal:   '#10b981',
  decision: '#ec4899',
};

const GLOW: Record<string, string> = {
  trial:    '#ec489960',
  evidence: '#3b82f640',
  protocol: '#8b5cf640',
  sap:      '#f59e0b40',
  conflict: '#ef444480',
  signal:   '#10b98140',
  decision: '#ec489960',
};

export default function KnowledgeGraph({
  trialName, evidenceBrief, protocol, sap, conflicts, onNodeClick,
}: KnowledgeGraphProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef     = useRef<KGNode[]>([]);
  const edgesRef     = useRef<KGEdge[]>([]);
  const animRef      = useRef<number>(0);
  const frameRef     = useRef<number>(0);
  const scaleRef     = useRef<number>(1);
  const offsetRef    = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragRef      = useRef<{ node: KGNode | null; ox: number; oy: number } | null>(null);
  const panRef       = useRef<{ active: boolean; sx: number; sy: number; ox: number; oy: number }>({ active: false, sx: 0, sy: 0, ox: 0, oy: 0 });

  const [hoveredNode, setHoveredNode]   = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<KGNode | null>(null);
  const [tooltip, setTooltip]           = useState<{ x: number; y: number; node: KGNode } | null>(null);
  const [dimensions, setDimensions]     = useState({ w: 800, h: 500 });
  const [zoom, setZoom]                 = useState(1);
  const [nodeCount, setNodeCount]       = useState(0);
  const [edgeCount, setEdgeCount]       = useState(0);
  const pulseRef = useRef(0);

  // ── Build graph from trial data ───────────────────────────────────────────
  const buildGraph = useCallback(() => {
    const nodes: KGNode[] = [];
    const edges: KGEdge[] = [];
    const cx = dimensions.w / 2;
    const cy = dimensions.h / 2;

    const mkNode = (
      id: string, label: string, type: KGNode['type'],
      x: number, y: number, radius: number, data?: any,
    ): KGNode => ({
      id, label: label.length > 22 ? label.slice(0, 20) + '…' : label,
      type, radius, x, y, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
      color: COLORS[type], glowColor: GLOW[type], data,
    });

    // Central trial node
    if (trialName) {
      nodes.push(mkNode('trial', trialName, 'trial', cx, cy, 12));
    }

    // Evidence Brief
    if (evidenceBrief?.content_json) {
      const brief = evidenceBrief.content_json;
      const ex = cx + Math.cos(-1.1) * 160;
      const ey = cy + Math.sin(-1.1) * 160;
      nodes.push(mkNode('evidence-brief', 'Evidence Brief', 'evidence', ex, ey, 8));
      edges.push({ source: 'trial', target: 'evidence-brief', label: 'informs', color: COLORS.evidence, weight: 2 });

      // Safety signals as child nodes
      (brief.safety_signals || []).forEach((sig: any, i: number) => {
        const sid = `sig-${i}`;
        const a = -1.1 + (i + 1) * (Math.PI / 7);
        const r = 200 + i * 10;
        nodes.push(mkNode(sid, sig.signal, 'signal', cx + Math.cos(a) * r, cy + Math.sin(a) * r, 5, sig));
        edges.push({ source: 'evidence-brief', target: sid, label: sig.severity === 'HIGH' ? 'HIGH' : 'MOD', color: sig.severity === 'HIGH' ? '#ef4444' : '#f59e0b', dashed: true });
      });

      // Efficacy endpoints
      (brief.efficacy || []).slice(0, 2).forEach((eff: any, i: number) => {
        const eid = `eff-${i}`;
        const a = -0.5 + i * 0.8;
        nodes.push(mkNode(eid, eff.endpoint?.slice(0, 18) || `Efficacy ${i+1}`, 'evidence', cx + Math.cos(a) * 260, cy + Math.sin(a) * 260, 5, eff));
        edges.push({ source: 'evidence-brief', target: eid, label: 'endpoint', color: COLORS.evidence + '99', dashed: true });
      });
    }

    // Protocol Draft
    if (protocol?.sections_json) {
      const sec = protocol.sections_json;
      const px = cx + Math.cos(1.1) * 160;
      const py = cy + Math.sin(1.1) * 160;
      nodes.push(mkNode('protocol-draft', 'Protocol Draft', 'protocol', px, py, 8));
      edges.push({ source: 'trial', target: 'protocol-draft', label: 'designs', color: COLORS.protocol, weight: 2 });
      if (evidenceBrief) edges.push({ source: 'evidence-brief', target: 'protocol-draft', label: 'aligns', color: COLORS.protocol, dashed: true });

      // Inclusion/Exclusion leaf nodes
      const inclCriteria = sec.inclusion_criteria || [];
      const exclCriteria = sec.exclusion_criteria || [];
      [...inclCriteria.slice(0, 3), ...exclCriteria.slice(0, 3)].forEach((crit: any, i: number) => {
        const isExcl = i >= inclCriteria.slice(0, 3).length;
        const nid = `crit-${i}`;
        const a = 1.1 + (i - 2.5) * 0.4;
        const r = 220 + i * 8;
        const label = typeof crit === 'string' ? crit : (crit.criterion || 'Criterion');
        nodes.push(mkNode(nid, label, 'protocol', cx + Math.cos(a) * r, cy + Math.sin(a) * r, 5, crit));
        edges.push({ source: 'protocol-draft', target: nid, label: isExcl ? 'excludes' : 'includes', color: isExcl ? '#ef444466' : '#8b5cf666', dashed: true });
      });
    }

    // SAP
    if (sap?.content_json) {
      const sc = sap.content_json;
      const sx = cx + Math.cos(Math.PI) * 160;
      const sy = cy + Math.sin(Math.PI) * 160;
      nodes.push(mkNode('stat-plan', 'Statistical Plan', 'sap', sx, sy, 8, sc));
      edges.push({ source: 'trial', target: 'stat-plan', label: 'analyzes', color: COLORS.sap, weight: 2 });
      if (protocol) edges.push({ source: 'protocol-draft', target: 'stat-plan', label: 'powers', color: COLORS.sap, dashed: true });

      // Power calc node
      if (sc.power_calculation) {
        const pcid = 'power-calc';
        nodes.push(mkNode(pcid, `N=${sc.power_calculation.calculated_sample_size?.match(/\d+/)?.[0] || '?'} per arm`, 'sap', cx + Math.cos(Math.PI - 0.4) * 230, cy + Math.sin(Math.PI - 0.4) * 230, 5, sc.power_calculation));
        edges.push({ source: 'stat-plan', target: pcid, label: 'powered', color: COLORS.sap, dashed: true });
      }
    }

    // Conflicts — pulsing red nodes
    (conflicts || []).forEach((c: any, i: number) => {
      const cid = `conflict-${i}`;
      const a = -Math.PI / 2 + (i + 1) * Math.PI / ((conflicts?.length || 1) + 1);
      nodes.push(mkNode(cid, c.id || `Conflict ${i+1}`, 'conflict', cx + Math.cos(a) * 190, cy + Math.sin(a) * 190, 8, c));
      if (protocol) edges.push({ source: 'protocol-draft', target: cid, label: c.severity || 'OPEN', color: '#ef4444', dashed: true });
      if (evidenceBrief) edges.push({ source: 'evidence-brief', target: cid, label: 'flags', color: '#ef4444cc', dashed: true });
    });

    nodesRef.current = nodes;
    edgesRef.current = edges;
    setNodeCount(nodes.length);
    setEdgeCount(edges.length);
  }, [trialName, evidenceBrief, protocol, sap, conflicts, dimensions]);

  // ── Resize observer ───────────────────────────────────────────────────────
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const r = containerRef.current.getBoundingClientRect();
        setDimensions({ w: r.width || 800, h: Math.max(450, r.height) });
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => { buildGraph(); }, [buildGraph]);

  // ── Canvas render loop ────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width  = dimensions.w * dpr;
    canvas.height = dimensions.h * dpr;
    ctx.scale(dpr, dpr);

    const REPULSION   = 9000;
    const ATTRACTION  = 0.006;
    const DAMPING     = 0.86;
    const MIN_DIST    = 80;
    const CENTER_FORCE = 0.025;

    const simulate = () => {
      frameRef.current++;
      pulseRef.current = (pulseRef.current + 0.05) % (Math.PI * 2);

      const scale  = scaleRef.current;
      const offset = offsetRef.current;

      ctx.clearRect(0, 0, dimensions.w, dimensions.h);

      // Grid will be drawn inside camera transform for infinite canvas effect

      const nodes = nodesRef.current;
      const edges = edgesRef.current;

      // Apply physics (runs 300 frames)
      if (frameRef.current < 300) {
        for (let i = 0; i < nodes.length; i++) {
          const a = nodes[i];
          a.vx += (dimensions.w / 2 - a.x) * CENTER_FORCE * 0.012;
          a.vy += (dimensions.h / 2 - a.y) * CENTER_FORCE * 0.012;
          for (let j = i + 1; j < nodes.length; j++) {
            const b = nodes[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx*dx + dy*dy) || 1;
            const force = REPULSION / (dist * dist);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            a.vx -= fx; a.vy -= fy;
            b.vx += fx; b.vy += fy;
          }
        }
        for (const edge of edges) {
          const src = nodes.find(n => n.id === edge.source);
          const tgt = nodes.find(n => n.id === edge.target);
          if (!src || !tgt) continue;
          const dx = tgt.x - src.x;
          const dy = tgt.y - src.y;
          const dist = Math.sqrt(dx*dx + dy*dy) || 1;
          if (dist > MIN_DIST) {
            const force = (dist - MIN_DIST) * ATTRACTION * (edge.weight || 1);
            src.vx += (dx/dist)*force; src.vy += (dy/dist)*force;
            tgt.vx -= (dx/dist)*force; tgt.vy -= (dy/dist)*force;
          }
        }
        for (const node of nodes) {
          if (dragRef.current?.node === node) continue;
          node.vx *= DAMPING; node.vy *= DAMPING;
          node.x  += node.vx; node.y  += node.vy;
          node.x = Math.max(node.radius + 8, Math.min(dimensions.w - node.radius - 8, node.x));
          node.y = Math.max(node.radius + 8, Math.min(dimensions.h - node.radius - 8, node.y));
        }
      }

      // ── Draw with camera transform ──────────────────────────────────────
      ctx.save();
      ctx.translate(offset.x, offset.y);
      ctx.scale(scale, scale);

      // Draw Obsidian-style dotted infinite canvas background
      ctx.save();
      const isDarkMode = document.documentElement.classList.contains('dark') || true;
      ctx.fillStyle = isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)';
      
      const dotSpacing = 40;
      const minX = Math.floor((-offset.x / scale) / dotSpacing) * dotSpacing - dotSpacing;
      const maxX = Math.ceil(((-offset.x + dimensions.w) / scale) / dotSpacing) * dotSpacing + dotSpacing;
      const minY = Math.floor((-offset.y / scale) / dotSpacing) * dotSpacing - dotSpacing;
      const maxY = Math.ceil(((-offset.y + dimensions.h) / scale) / dotSpacing) * dotSpacing + dotSpacing;
      
      for (let x = minX; x <= maxX; x += dotSpacing) {
        for (let y = minY; y <= maxY; y += dotSpacing) {
          ctx.beginPath();
          ctx.arc(x, y, 0.75, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // Draw curved bezier edges
      for (const edge of edges) {
        const src = nodes.find(n => n.id === edge.source);
        const tgt = nodes.find(n => n.id === edge.target);
        if (!src || !tgt) continue;

        const isConnected =
          hoveredNode === edge.source || hoveredNode === edge.target ||
          selectedNode?.id === edge.source || selectedNode?.id === edge.target;

        const dim = hoveredNode && !isConnected;

        // Bezier control point (perpendicular offset)
        const mx = (src.x + tgt.x) / 2;
        const my = (src.y + tgt.y) / 2;
        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const len = Math.sqrt(dx*dx + dy*dy) || 1;
        const curv = Math.min(len * 0.2, 40);
        const cpx = mx + (-dy / len) * curv;
        const cpy = my + (dx / len) * curv;

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.quadraticCurveTo(cpx, cpy, tgt.x, tgt.y);

        if (dim) {
          ctx.strokeStyle = edge.color + '12';
          ctx.lineWidth = 0.5;
        } else {
          ctx.strokeStyle = edge.color + (isConnected ? 'DD' : '45');
          ctx.lineWidth = isConnected ? (edge.weight || 1) * 2 : 1;
        }
        if (edge.dashed) ctx.setLineDash([5, 5]);
        else ctx.setLineDash([]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Arrowhead on non-dim edges
        if (!dim && len > 40) {
          const tParam = 0.92;
          const ax = (1-tParam)*(1-tParam)*src.x + 2*(1-tParam)*tParam*cpx + tParam*tParam*tgt.x;
          const ay = (1-tParam)*(1-tParam)*src.y + 2*(1-tParam)*tParam*cpy + tParam*tParam*tgt.y;
          const angle = Math.atan2(tgt.y - ay, tgt.x - ax);
          const alen = 7;
          ctx.beginPath();
          ctx.moveTo(ax + Math.cos(angle - 0.4) * (-alen), ay + Math.sin(angle - 0.4) * (-alen));
          ctx.lineTo(ax, ay);
          ctx.lineTo(ax + Math.cos(angle + 0.4) * (-alen), ay + Math.sin(angle + 0.4) * (-alen));
          ctx.strokeStyle = edge.color + (isConnected ? 'CC' : '45');
          ctx.lineWidth = isConnected ? 1.5 : 0.8;
          ctx.stroke();
        }

        // Edge label on connected or global (no hover)
        if (isConnected || (!hoveredNode && !selectedNode)) {
          const lx = (1-0.5)*(1-0.5)*src.x + 2*(1-0.5)*0.5*cpx + 0.5*0.5*tgt.x;
          const ly = (1-0.5)*(1-0.5)*src.y + 2*(1-0.5)*0.5*cpy + 0.5*0.5*tgt.y - 6;
          ctx.font = 'bold 7px ui-monospace, monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = edge.color + (isConnected ? 'CC' : '55');
          ctx.fillText(edge.label.toUpperCase(), lx, ly);
        }
      }

      // Draw nodes (sorted so hovered is on top)
      const sorted = [...nodes].sort((a, b) => (a.id === hoveredNode ? 1 : b.id === hoveredNode ? -1 : 0));

      for (const node of sorted) {
        const isHovered  = hoveredNode === node.id;
        const isSelected = selectedNode?.id === node.id;
        const isConflict = node.type === 'conflict';
        const isConnectedToHovered = hoveredNode && edges.some(
          e => (e.source === hoveredNode && e.target === node.id) || (e.target === hoveredNode && e.source === node.id)
        );

        let alpha = 1;
        if (hoveredNode && !isHovered && !isConnectedToHovered) alpha = 0.12;
        else if (selectedNode && !isSelected) {
          const conn = edges.some(e => (e.source === selectedNode.id && e.target === node.id) || (e.target === selectedNode.id && e.source === node.id));
          if (!conn && !isHovered) alpha = 0.1;
        }

        const r = isHovered ? node.radius * 1.25 : isSelected ? node.radius * 1.12 : node.radius;
        ctx.globalAlpha = alpha;

        // Pulsing glow ring for conflict nodes
        if (isConflict) {
          const pulse = Math.sin(pulseRef.current) * 0.5 + 0.5;
          const glowR = r * (2.5 + pulse * 0.8);
          const g1 = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowR);
          g1.addColorStop(0, '#ef444440');
          g1.addColorStop(0.5, '#ef444418');
          g1.addColorStop(1, '#ef444400');
          ctx.fillStyle = g1;
          ctx.beginPath();
          ctx.arc(node.x, node.y, glowR, 0, Math.PI * 2);
          ctx.fill();

          // Outer pulse ring
          ctx.beginPath();
          ctx.arc(node.x, node.y, r * 1.6 + pulse * 8, 0, Math.PI * 2);
          ctx.strokeStyle = '#ef4444' + Math.round(pulse * 60).toString(16).padStart(2, '0');
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Glow for hovered/selected
        if (isHovered || isSelected) {
          const glowCol = node.glowColor || '#3b82f640';
          const baseGlow = glowCol.startsWith('#') ? glowCol.slice(0, 7) : glowCol;
          const g2 = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 3);
          g2.addColorStop(0, glowCol);
          g2.addColorStop(1, baseGlow + '00');
          ctx.fillStyle = g2;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r * 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Orbit ring for selected
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, r + 8 + Math.sin(pulseRef.current * 2) * 2, 0, Math.PI * 2);
          ctx.strokeStyle = node.color + '80';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Node fill
        const nodeColor = node.color || '#3b82f6';
        const hexColor = nodeColor.startsWith('#') ? nodeColor.slice(0, 7) : nodeColor;
        const grad = ctx.createRadialGradient(node.x - r * 0.3, node.y - r * 0.3, 0, node.x, node.y, r);
        grad.addColorStop(0, hexColor + (isHovered || isSelected ? 'EE' : 'BB'));
        grad.addColorStop(1, hexColor + (isHovered || isSelected ? 'AA' : '77'));
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Border
        ctx.strokeStyle = nodeColor + (isHovered || isSelected ? 'FF' : 'BB');
        ctx.lineWidth = isHovered || isSelected ? 2.5 : 1.5;
        ctx.stroke();

        // Type icon text (center) - Obsidian style: only draw inside larger nodes
        if (r > 11) {
          ctx.fillStyle = '#fff';
          ctx.font = `bold ${Math.max(8, r * 0.42)}px ui-sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const icons: Record<string, string> = { trial: '⚡', evidence: '📄', protocol: '📋', sap: '📊', conflict: '⚠', signal: '🔬', decision: '⚡' };
          ctx.fillText(icons[node.type] || '●', node.x, node.y);
        }

        // Label below node - Obsidian style: only show on hover/select, central node, or when zoomed in
        const showLabel = isHovered || isSelected || node.type === 'trial' || scale > 1.3;
        if (showLabel) {
          const isDarkMode = document.documentElement.classList.contains('dark') || true;
          ctx.fillStyle = isDarkMode ? '#e4e4e7' : '#27272a';
          ctx.font = `${isHovered ? 'bold ' : ''}${isHovered ? 9 : 8}px ui-monospace, monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.globalAlpha = alpha * (isHovered ? 1 : 0.7);
          ctx.fillText(node.label, node.x, node.y + r + 4);
        }

        ctx.globalAlpha = 1;
      }

      ctx.restore();
      animRef.current = requestAnimationFrame(simulate);
    };

    frameRef.current = 0;
    animRef.current = requestAnimationFrame(simulate);
    return () => cancelAnimationFrame(animRef.current);
  }, [dimensions, hoveredNode, selectedNode]);

  // ── Coordinate helpers ───────────────────────────────────────────────────
  const canvasToWorld = useCallback((cx: number, cy: number) => ({
    x: (cx - offsetRef.current.x) / scaleRef.current,
    y: (cy - offsetRef.current.y) / scaleRef.current,
  }), []);

  const getNodeAt = useCallback((cx: number, cy: number) => {
    const { x, y } = canvasToWorld(cx, cy);
    return nodesRef.current.find(n => {
      const dx = x - n.x; const dy = y - n.y;
      return Math.sqrt(dx*dx + dy*dy) < n.radius + 8;
    });
  }, [canvasToWorld]);

  // ── Mouse handlers ───────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    // Drag node
    if (dragRef.current?.node) {
      const { x, y } = canvasToWorld(cx, cy);
      dragRef.current.node.x = x;
      dragRef.current.node.y = y;
      dragRef.current.node.vx = 0;
      dragRef.current.node.vy = 0;
      frameRef.current = 0; // Wake up physics simulation
      return;
    }

    // Pan canvas
    if (panRef.current.active) {
      offsetRef.current = {
        x: panRef.current.ox + cx - panRef.current.sx,
        y: panRef.current.oy + cy - panRef.current.sy,
      };
      return;
    }

    const found = getNodeAt(cx, cy);
    setHoveredNode(found?.id || null);
    canvas.style.cursor = found ? 'pointer' : 'grab';

    if (found) {
      setTooltip({ x: e.clientX, y: e.clientY, node: found });
    } else {
      setTooltip(null);
    }
  }, [canvasToWorld, getNodeAt]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const found = getNodeAt(cx, cy);
    if (found) {
      dragRef.current = { node: found, ox: cx, oy: cy };
    } else {
      panRef.current = { active: true, sx: cx, sy: cy, ox: offsetRef.current.x, oy: offsetRef.current.y };
      canvas.style.cursor = 'grabbing';
    }
  }, [getNodeAt]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (dragRef.current?.node) {
      // If barely moved, treat as click
      const rect = canvas!.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const moved = Math.abs(cx - dragRef.current.ox) + Math.abs(cy - dragRef.current.oy);
      if (moved < 5) {
        playClick();
        if (dragRef.current.node) {
          setSelectedNode(dragRef.current.node);
          onNodeClick?.(dragRef.current.node);
        }
      }
      dragRef.current = null;
    }
    panRef.current.active = false;
    if (canvas) canvas.style.cursor = 'grab';
  }, [onNodeClick]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(3, Math.max(0.3, scaleRef.current * delta));

    // Zoom toward mouse cursor
    offsetRef.current = {
      x: cx - (cx - offsetRef.current.x) * (newScale / scaleRef.current),
      y: cy - (cy - offsetRef.current.y) * (newScale / scaleRef.current),
    };
    scaleRef.current = newScale;
    setZoom(newScale);
  }, []);

  const doZoom = (dir: 1 | -1) => {
    const newScale = Math.min(3, Math.max(0.3, scaleRef.current * (dir > 0 ? 1.2 : 0.8)));
    // Zoom toward center
    const cx = dimensions.w / 2;
    const cy = dimensions.h / 2;
    offsetRef.current = {
      x: cx - (cx - offsetRef.current.x) * (newScale / scaleRef.current),
      y: cy - (cy - offsetRef.current.y) * (newScale / scaleRef.current),
    };
    scaleRef.current = newScale;
    setZoom(newScale);
  };

  const doReset = () => {
    scaleRef.current = 1;
    offsetRef.current = { x: 0, y: 0 };
    setZoom(1);
    frameRef.current = 0;
    buildGraph();
  };

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[450px] bg-background overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-grab"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { setHoveredNode(null); setTooltip(null); panRef.current.active = false; dragRef.current = null; }}
        onWheel={handleWheel}
      />

      {/* Zoom controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-1 z-20">
        <button onClick={() => doZoom(1)} className="w-8 h-8 rounded-lg border border-border bg-background/90 backdrop-blur-sm flex items-center justify-center text-muted hover:text-foreground hover:bg-surface transition-all shadow-sm">
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => doZoom(-1)} className="w-8 h-8 rounded-lg border border-border bg-background/90 backdrop-blur-sm flex items-center justify-center text-muted hover:text-foreground hover:bg-surface transition-all shadow-sm">
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button onClick={doReset} className="w-8 h-8 rounded-lg border border-border bg-background/90 backdrop-blur-sm flex items-center justify-center text-muted hover:text-foreground hover:bg-surface transition-all shadow-sm" title="Reset view">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
        <div className="w-8 text-center font-mono text-[8px] text-muted mt-0.5">{Math.round(zoom * 100)}%</div>
      </div>

      {/* Node stats */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <div className="px-2 py-1 rounded-md border border-border bg-background/90 backdrop-blur-sm font-mono text-[9px] text-muted">
          {nodeCount} nodes · {edgeCount} edges
        </div>
      </div>

      {/* Hover tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none px-3 py-2 rounded-lg border border-border bg-background/95 backdrop-blur-sm shadow-xl max-w-[220px]"
          style={{ left: tooltip.x + 14, top: tooltip.y - 10 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wide text-white"
              style={{ background: tooltip.node.color }}
            >
              {tooltip.node.type}
            </span>
          </div>
          <p className="text-[11px] font-bold text-foreground mb-1">{tooltip.node.label}</p>
          {tooltip.node.data?.severity && (
            <p className="text-[10px] font-mono text-muted">Severity: <span className="text-red-500 font-bold">{tooltip.node.data.severity}</span></p>
          )}
          {tooltip.node.data?.signal && (
            <p className="text-[10px] text-muted truncate">{tooltip.node.data.signal}</p>
          )}
          {tooltip.node.data?.criterion && (
            <p className="text-[10px] text-muted truncate">{tooltip.node.data.criterion}</p>
          )}
          {tooltip.node.data?.position_a && (
            <p className="text-[10px] text-muted truncate">Click to inspect conflict</p>
          )}
          <p className="text-[9px] font-mono text-muted/60 mt-1">Click to select · Drag to move</p>
        </div>
      )}

      {/* Selected node detail panel */}
      {selectedNode && !onNodeClick && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-72 p-4 rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-2xl z-20 animate-fade-up">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase tracking-wide text-white"
                style={{ background: selectedNode.color }}
              >
                {selectedNode.type}
              </span>
            </div>
            <button onClick={() => setSelectedNode(null)} className="text-muted hover:text-foreground text-lg leading-none transition-colors">×</button>
          </div>
          <h3 className="text-sm font-bold text-foreground mb-2 leading-snug">{selectedNode.label}</h3>

          {selectedNode.data && (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {typeof selectedNode.data === 'string' ? (
                <p className="text-[11px] text-muted">{selectedNode.data}</p>
              ) : (
                Object.entries(selectedNode.data).slice(0, 6).map(([k, v]) => (
                  <div key={k}>
                    <div className="font-mono text-[8px] uppercase tracking-wide text-muted/70">{k.replace(/_/g, ' ')}</div>
                    <p className="text-[11px] text-foreground/80 leading-snug">{String(v).slice(0, 100)}{String(v).length > 100 ? '…' : ''}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {nodeCount === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted font-mono gap-2">
          <div className="w-12 h-12 rounded-xl border border-dashed border-border flex items-center justify-center mb-2">
            <Maximize2 className="w-5 h-5 opacity-30" />
          </div>
          <span className="text-[11px] uppercase tracking-[0.2em]">Run agents to build knowledge graph</span>
          <span className="text-[9px] text-muted/60">Physics-based evidence chain visualization</span>
        </div>
      )}
    </div>
  );
}
