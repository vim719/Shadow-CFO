import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  type: "bank" | "leak" | "savings" | "center";
}

interface Edge {
  from: string;
  to: string;
  amount: string;
  isLeak?: boolean;
}

const NODES: Node[] = [
  { id: "center", label: "Your Accounts", x: 50, y: 50, type: "center" },
  { id: "chase", label: "Chase", x: 15, y: 25, type: "bank" },
  { id: "boa", label: "Bank of America", x: 15, y: 75, type: "bank" },
  { id: "marcus", label: "Marcus HYSA", x: 85, y: 25, type: "savings" },
  { id: "netflix", label: "Netflix ×2", x: 85, y: 55, type: "leak" },
  { id: "gym", label: "Unused Gym", x: 85, y: 75, type: "leak" },
];

const EDGES: Edge[] = [
  { from: "chase", to: "center", amount: "$4,200/mo" },
  { from: "boa", to: "center", amount: "$1,800/mo" },
  { from: "center", to: "marcus", amount: "+$0 saved" },
  { from: "center", to: "netflix", amount: "$34/mo", isLeak: true },
  { from: "center", to: "gym", amount: "$55/mo", isLeak: true },
];

export default function MoneyFlowGraph() {
  const nodeColor = (type: Node["type"]) => {
    if (type === "center") return "var(--accent-cyan)";
    if (type === "bank") return "#F1F5F9";
    if (type === "savings") return "var(--accent-emerald)";
    return "var(--accent-amber)";
  };

  const getNode = (id: string) => NODES.find((n) => n.id === id)!;

  return (
    <div className="relative w-full" style={{ paddingBottom: "60%" }}>
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <marker id="arrow-normal" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
            <path d="M0,0 L4,2 L0,4 Z" fill="rgba(125,143,168,0.5)" />
          </marker>
          <marker id="arrow-leak" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
            <path d="M0,0 L4,2 L0,4 Z" fill="var(--accent-amber)" />
          </marker>
          <filter id="glow-cyan-filter">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-amber-filter">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Edges */}
        {EDGES.map((edge, i) => {
          const from = getNode(edge.from);
          const to = getNode(edge.to);
          if (!from || !to) return null;
          const mx = (from.x + to.x) / 2;
          const my = (from.y + to.y) / 2;
          return (
            <g key={i}>
              <motion.line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={edge.isLeak ? "var(--accent-amber)" : "rgba(125,143,168,0.25)"}
                strokeWidth={edge.isLeak ? "0.4" : "0.25"}
                strokeDasharray={edge.isLeak ? "1 0.5" : "none"}
                markerEnd={edge.isLeak ? "url(#arrow-leak)" : "url(#arrow-normal)"}
                filter={edge.isLeak ? "url(#glow-amber-filter)" : undefined}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
              />
              <motion.text
                x={mx}
                y={my - 1.5}
                textAnchor="middle"
                fontSize="2.2"
                fill={edge.isLeak ? "var(--accent-amber)" : "var(--text-muted)"}
                fontFamily="var(--font-mono)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.15 + 0.3, duration: 0.4 }}
              >
                {edge.amount}
              </motion.text>
            </g>
          );
        })}

        {/* Nodes */}
        {NODES.map((node, i) => (
          <motion.g
            key={node.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 + 0.2, type: "spring", stiffness: 200 }}
            style={{ transformOrigin: `${node.x}% ${node.y}%` }}
          >
            <circle
              cx={node.x}
              cy={node.y}
              r={node.type === "center" ? 5 : 3.5}
              fill={nodeColor(node.type)}
              fillOpacity={node.type === "bank" ? 1 : 0.15}
              stroke={nodeColor(node.type)}
              strokeWidth={node.type === "center" ? "0.6" : "0.4"}
              filter={node.type === "center" ? "url(#glow-cyan-filter)" : node.type === "leak" ? "url(#glow-amber-filter)" : undefined}
            />
            <text
              x={node.x}
              y={node.y + (node.type === "center" ? 8 : 6)}
              textAnchor="middle"
              fontSize={node.type === "center" ? "3" : "2.5"}
              fill={nodeColor(node.type)}
              fontFamily="var(--font-body)"
              fontWeight={node.type === "center" ? "600" : "400"}
            >
              {node.label}
            </text>
          </motion.g>
        ))}
      </svg>
    </div>
  );
}
