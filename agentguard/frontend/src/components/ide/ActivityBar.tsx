import React from 'react';
import {
  Files, Bot, Wrench, ShieldCheck, ShieldAlert,
  AlertTriangle, GitCommit, Zap, UserCheck, Database,
  Network, Settings
} from 'lucide-react';
import { SidebarView } from '../../types/ide';

interface ActivityBarProps {
  activeView: SidebarView;
  onSelectView: (view: SidebarView) => void;
  incidentsBadgeCount: number;
  approvalsBadgeCount: number;
  blockedBadgeCount: number;
  compromisedAgentsCount: number;
}

export const ActivityBar: React.FC<ActivityBarProps> = ({
  activeView,
  onSelectView,
  incidentsBadgeCount,
  approvalsBadgeCount,
  blockedBadgeCount,
  compromisedAgentsCount,
}) => {
  const topNavItems: Array<{
    id: SidebarView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: 'red' | 'amber' | 'blue';
  }> = [
    { id: 'explorer', label: 'Explorer', icon: Files },
    { id: 'agents', label: 'Autonomous Agents', icon: Bot, badge: compromisedAgentsCount, badgeColor: 'red' },
    { id: 'tools', label: 'Capability Tools', icon: Wrench },
    { id: 'policies', label: 'CEL Policies', icon: ShieldCheck },
    { id: 'security', label: 'Security Invariants', icon: ShieldAlert, badge: blockedBadgeCount, badgeColor: 'red' },
    { id: 'incidents', label: 'Incidents & Containment', icon: AlertTriangle, badge: incidentsBadgeCount, badgeColor: 'red' },
    { id: 'traces', label: 'Pipeline Traces', icon: GitCommit },
    { id: 'attack-lab', label: 'Attack Scenario Lab', icon: Zap },
    { id: 'approvals', label: 'Human Approval Cockpit', icon: UserCheck, badge: approvalsBadgeCount, badgeColor: 'amber' },
    { id: 'audit', label: 'Cryptographic Audit Ledger', icon: Database },
    { id: 'graph', label: 'Agent Mesh Topology Graph', icon: Network },
  ];

  return (
    <aside
      className="w-12 border-r flex flex-col justify-between py-2 select-none z-20 shrink-0"
      style={{
        background: '#161616',
        borderColor: '#282828',
      }}
    >
      {/* Top Primary Actions */}
      <div className="flex flex-col items-center gap-1.5">
        {topNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className="relative w-10 h-10 rounded-lg flex items-center justify-center transition-all cursor-pointer group"
              style={{
                background: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                color: isActive ? '#ffffff' : '#858585',
              }}
              title={item.label}
            >
              {/* Active Left Indicator Bar */}
              {isActive && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-blue-500" />
              )}

              <Icon className="w-5 h-5 transition-transform group-hover:scale-105" />

              {/* Notification Badges */}
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`absolute top-1.5 right-1.5 min-w-[15px] h-[15px] px-1 rounded-full text-[9px] font-mono font-bold flex items-center justify-center text-white ${
                    item.badgeColor === 'red'
                      ? 'bg-red-600 pulse-red-glow'
                      : item.badgeColor === 'amber'
                      ? 'bg-amber-600'
                      : 'bg-blue-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Settings */}
      <div className="flex flex-col items-center">
        <button
          onClick={() => onSelectView('settings')}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
            activeView === 'settings' ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white'
          }`}
          title="IDE & Security Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
};
