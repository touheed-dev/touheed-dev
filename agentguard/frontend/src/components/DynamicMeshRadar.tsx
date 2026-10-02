import React, { useState } from 'react';
import { Shield, Server, Radio, AlertTriangle, ShieldAlert, Cpu, Eye, Filter } from 'lucide-react';
import { AgentRecord, InterceptionDecision } from '../types';

interface DynamicMeshRadarProps {
  agents: AgentRecord[];
  latestInterception: InterceptionDecision | null;
  selectedAgentId: string | null;
  onSelectAgent: (agentId: string | null) => void;
  onQuickSimulate?: (payload: any) => void;
}

export const DynamicMeshRadar: React.FC<DynamicMeshRadarProps> = ({
  agents,
  latestInterception,
  selectedAgentId,
  onSelectAgent,
  onQuickSimulate,
}) => {
  const [hoveredAgent, setHoveredAgent] = useState<AgentRecord | null>(null);

  // Radar geometry
  const size = 300;
  const center = size / 2;
  const radius = 105;

  const agentNodes = agents.map((agent, index) => {
    const total = Math.max(agents.length, 1);
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    const isLatest = latestInterception?.agent_id === agent.agent_id;
    const isSelected = selectedAgentId === agent.agent_id;

    return {
      agent,
      x,
      y,
      angle,
      isLatest,
      isSelected,
    };
  });

  const healthyCount = agents.filter((a) => a.status === 'HEALTHY').length;
  const quarantinedCount = agents.filter((a) => a.status === 'QUARANTINED').length;

  return (
    <div
      className="rounded-xl border p-4 flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden"
      style={{ background: '#EDE8DE', borderColor: '#D6CFC3' }}
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-40 h-40 bg-emerald-500/5 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-amber-500/5 blur-3xl pointer-events-none rounded-full" />

      {/* Left info column */}
      <div className="space-y-3 min-w-[200px] z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center border" style={{ background: '#E2DBD0', borderColor: '#D6CFC3' }}>
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#1E232A]" style={{ fontFamily: 'Space Grotesk' }}>
              Autonomous Swarm Radar
            </h3>
            <p className="text-[10px] font-mono text-[#7A6F62]">
              Real-Time Mesh Topology & Gate
            </p>
          </div>
        </div>

        <div className="space-y-1.5 text-xs font-mono">
          <div className="flex items-center justify-between px-2.5 py-1 rounded border" style={{ background: '#FAF7F2', borderColor: '#D6CFC3' }}>
            <span className="text-[#7A6F62] text-[10px]">Active Mesh Nodes:</span>
            <span className="font-bold text-[#1E232A]">{agents.length}</span>
          </div>
          <div className="flex items-center justify-between px-2.5 py-1 rounded border" style={{ background: '#FAF7F2', borderColor: '#D6CFC3' }}>
            <span className="text-[#7A6F62] text-[10px]">Healthy (Green):</span>
            <span className="font-bold text-emerald-700">{healthyCount}</span>
          </div>
          <div className="flex items-center justify-between px-2.5 py-1 rounded border" style={{ background: '#FAF7F2', borderColor: '#D6CFC3' }}>
            <span className="text-[#7A6F62] text-[10px]">Quarantined (Red):</span>
            <span className="font-bold text-red-700">{quarantinedCount}</span>
          </div>
        </div>

        {selectedAgentId && (
          <div className="p-2 rounded-lg border font-mono text-[10px]" style={{ background: '#F5F0E8', borderColor: '#B8AE9F' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-[#1E232A]">Filtered to Agent:</span>
              <button
                onClick={() => onSelectAgent(null)}
                className="text-amber-700 hover:underline font-bold cursor-pointer"
              >
                [Clear Filter]
              </button>
            </div>
            <div className="text-emerald-700 font-semibold">{selectedAgentId}</div>
          </div>
        )}
      </div>

      {/* Center Radar SVG */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg width={size} height={size} className="overflow-visible">
          {/* Radar Circles */}
          <circle cx={center} cy={center} r="35" fill="none" stroke="#D6CFC3" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx={center} cy={center} r="70" fill="none" stroke="#D6CFC3" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx={center} cy={center} r="105" fill="none" stroke="#D6CFC3" strokeWidth="1.5" />
          <circle cx={center} cy={center} r="130" fill="none" stroke="#D6CFC3" strokeWidth="0.7" opacity="0.6" />

          {/* Crosshairs */}
          <line x1={center} y1="10" x2={center} y2={size - 10} stroke="#D6CFC3" strokeWidth="0.8" opacity="0.7" />
          <line x1="10" y1={center} x2={size - 10} y2={center} stroke="#D6CFC3" strokeWidth="0.8" opacity="0.7" />

          {/* Radar Sweep Line */}
          <g className="anim-radar-sweep" style={{ transformOrigin: `${center}px ${center}px` }}>
            <line x1={center} y1={center} x2={center + radius + 25} y2={center} stroke="rgba(5,150,105,0.7)" strokeWidth="1.5" />
            <path
              d={`M ${center} ${center} L ${center + radius + 25} ${center} A ${radius + 25} ${radius + 25} 0 0 0 ${center} ${center - radius - 25} Z`}
              fill="url(#radarGradient)"
              opacity="0.3"
            />
          </g>

          <defs>
            <radialGradient id="radarGradient" cx="0%" cy="0%" r="100%">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Beams from Agents to Kernel */}
          {agentNodes.map(({ agent, x, y, isLatest, isSelected }) => {
            const isQuarantined = agent.status === 'QUARANTINED';
            const beamColor = isQuarantined ? '#DC2626' : isLatest ? '#D97706' : '#059669';
            return (
              <line
                key={`beam-${agent.agent_id}`}
                x1={x}
                y1={y}
                x2={center}
                y2={center}
                stroke={beamColor}
                strokeWidth={isLatest || isSelected ? 2 : 1}
                strokeDasharray="4 3"
                className="anim-beam-pulse"
                opacity={isLatest || isSelected ? 0.9 : 0.4}
              />
            );
          })}

          {/* Central Kernel Hub */}
          <g transform={`translate(${center - 22}, ${center - 22})`} className="cursor-pointer">
            <rect
              width="44"
              height="44"
              rx="10"
              fill="#FAF7F2"
              stroke="#059669"
              strokeWidth="2"
              filter="drop-shadow(0px 2px 8px rgba(5,150,105,0.25))"
            />
            <foreignObject width="44" height="44">
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-0.5">
                <Shield className="w-4 h-4 text-emerald-600 mb-0.5" />
                <span className="text-[7px] font-mono font-bold text-slate-800 leading-none">KERNEL</span>
                <span className="text-[6px] font-mono text-emerald-700 leading-none">P0 GATE</span>
              </div>
            </foreignObject>
          </g>

          {/* Surrounding Agent Nodes */}
          {agentNodes.map(({ agent, x, y, isLatest, isSelected }) => {
            const isQuarantined = agent.status === 'QUARANTINED';
            const nodeFill = isQuarantined ? '#FEE2E2' : isLatest ? '#FEF3C7' : '#DCFCE7';
            const nodeStroke = isQuarantined ? '#DC2626' : isLatest ? '#D97706' : '#059669';

            return (
              <g
                key={agent.agent_id}
                transform={`translate(${x}, ${y})`}
                onClick={() => onSelectAgent(isSelected ? null : agent.agent_id)}
                onMouseEnter={() => setHoveredAgent(agent)}
                onMouseLeave={() => setHoveredAgent(null)}
                className="cursor-pointer group"
              >
                {/* Glow ring for latest activity or selection */}
                {(isLatest || isSelected) && (
                  <circle
                    cx="0"
                    cy="0"
                    r="18"
                    fill="none"
                    stroke={nodeStroke}
                    strokeWidth="1.5"
                    className="animate-ping"
                    opacity="0.6"
                  />
                )}

                <circle
                  cx="0"
                  cy="0"
                  r={isSelected ? 14 : 11}
                  fill={nodeFill}
                  stroke={nodeStroke}
                  strokeWidth={isSelected ? 2.5 : 1.8}
                />

                <circle
                  cx="0"
                  cy="0"
                  r="3.5"
                  fill={nodeStroke}
                  className={isQuarantined ? 'pulse-red' : 'pulse-green'}
                />

                {/* Node Label */}
                <text
                  x="0"
                  y={isSelected ? 24 : 20}
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="bold"
                  fontFamily="JetBrains Mono"
                  fill="#1E232A"
                  className="select-none"
                >
                  {agent.agent_id.length > 10 ? agent.agent_id.slice(0, 9) + '…' : agent.agent_id}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover HUD Tooltip */}
        {hoveredAgent && (
          <div
            className="absolute top-2 right-2 p-2.5 rounded-lg border shadow-xl z-30 font-mono text-[10px] space-y-1 pointer-events-none anim-drawer max-w-[190px]"
            style={{ background: '#FAF7F2', borderColor: '#B8AE9F', color: '#1E232A' }}
          >
            <div className="font-bold flex items-center justify-between">
              <span>{hoveredAgent.agent_id}</span>
              <span className={`px-1 rounded text-[8px] ${hoveredAgent.status === 'HEALTHY' ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>
                {hoveredAgent.status}
              </span>
            </div>
            <div className="text-[#5C5245]">Role: <span className="font-semibold text-slate-800">{hoveredAgent.role}</span></div>
            <div className="text-[#5C5245]">Epoch: <span className="font-semibold text-slate-800">v{hoveredAgent.security_epoch}</span></div>
            <div className="text-[#5C5245]">Blocked: <span className="font-semibold text-red-700">{hoveredAgent.blocked_count}</span></div>
            <div className="text-[9px] text-[#7A6F62] pt-0.5 border-t border-[#DDD8CE]">Click node to filter stream</div>
          </div>
        )}
      </div>

      {/* Right Quick Action column */}
      <div className="space-y-2 text-xs font-mono z-10 w-full md:w-auto">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#7A6F62] mb-1">
          Active Defense Invariants
        </div>

        <div className="p-2 rounded-lg border text-[11px] space-y-1" style={{ background: '#FAF7F2', borderColor: '#D6CFC3' }}>
          <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>RFC-8785 Hash-Chain Commit</span>
          </div>
          <p className="text-[10px] text-[#5C5245]">
            Canonical JSON cryptographic integrity recorded per interception.
          </p>
        </div>

        <div className="p-2 rounded-lg border text-[11px] space-y-1" style={{ background: '#FAF7F2', borderColor: '#D6CFC3' }}>
          <div className="flex items-center gap-1.5 text-red-800 font-bold">
            <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
            <span>0.00% Zero-Byte Invariant</span>
          </div>
          <p className="text-[10px] text-[#5C5245]">
            Guaranteed short-circuit abort before sandbox or socket dispatch.
          </p>
        </div>

        {onQuickSimulate && (
          <button
            onClick={() => {
              // Rapid attack sequence
              onQuickSimulate({
                agent_id: 'crawler-03',
                tool_name: 'read_file',
                arguments: { path: '/etc/secrets/aws_canary_key' },
                task_id: 'TASK-SWARM-BREACH',
                trace_id: `TRC-SWARM-${Date.now().toString().slice(-4)}`
              });
            }}
            className="w-full mt-2 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold border transition-all hover-lift cursor-pointer flex items-center justify-center gap-1.5"
            style={{ background: '#FAF7F2', borderColor: '#D97706', color: '#92400E' }}
          >
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>Test Swarm Tripwire (Canary)</span>
          </button>
        )}
      </div>
    </div>
  );
};
