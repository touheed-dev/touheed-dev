import React from 'react';
import {
  Shield, Search, Play, Pause, PanelLeft,
  PanelBottom, PanelRight, Bell, Terminal, RefreshCw,
  FolderLock
} from 'lucide-react';

interface TitleBarProps {
  onOpenCommandPalette: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isBottomPanelOpen: boolean;
  onToggleBottomPanel: () => void;
  isInspectorOpen: boolean;
  onToggleInspector: () => void;
  isTrafficGenerating: boolean;
  onToggleTraffic: () => void;
  activeFilePath?: string;
  unreadIncidentsCount: number;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  onOpenCommandPalette,
  isSidebarOpen,
  onToggleSidebar,
  isBottomPanelOpen,
  onToggleBottomPanel,
  isInspectorOpen,
  onToggleInspector,
  isTrafficGenerating,
  onToggleTraffic,
  activeFilePath = 'workspace',
  unreadIncidentsCount,
}) => {
  return (
    <header
      className="h-10 border-b flex items-center justify-between px-3 select-none text-xs z-30"
      style={{
        background: '#161616',
        borderColor: '#282828',
        color: '#cccccc',
      }}
    >
      {/* ── Left: Window Controls + Brand & Breadcrumb ── */}
      <div className="flex items-center gap-3">
        {/* macOS Style Window Dots */}
        <div className="flex items-center gap-1.5 mr-1">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]" />
        </div>

        {/* Brand */}
        <div className="flex items-center gap-2 font-semibold">
          <div className="w-5 h-5 rounded flex items-center justify-center bg-emerald-500/15 text-emerald-400">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold tracking-tight text-white font-mono text-xs">
            AgentGuard IDE
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-slate-400">
            v2.4.1
          </span>
        </div>

        {/* Breadcrumb */}
        <div className="hidden md:flex items-center gap-1 text-[11px] text-slate-400 font-mono">
          <span>/</span>
          <span className="text-slate-300">{activeFilePath}</span>
        </div>
      </div>

      {/* ── Center: Command Palette Search Bar ── */}
      <div className="flex-1 max-w-md mx-4">
        <button
          onClick={onOpenCommandPalette}
          className="w-full h-6.5 px-3 rounded flex items-center justify-between border text-[11px] font-mono transition-all hover:border-slate-500"
          style={{
            background: '#212121',
            borderColor: '#303030',
            color: '#8e8e8e',
          }}
          title="Press ⌘P or Ctrl+P to search agents, tools, policies, traces..."
        >
          <div className="flex items-center gap-2">
            <Search className="w-3 h-3 text-slate-400" />
            <span className="truncate">Search agents, tools, policies, incidents...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.2 text-[9px] font-mono bg-black/40 rounded border border-white/10 text-slate-400">
            ⌘P
          </kbd>
        </button>
      </div>

      {/* ── Right: Swarm Play/Pause & Layout Controls ── */}
      <div className="flex items-center gap-2">
        {/* Mesh Swarm Traffic Generator */}
        <button
          onClick={onToggleTraffic}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-semibold transition-all border cursor-pointer ${
            isTrafficGenerating
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
          }`}
          title={isTrafficGenerating ? 'Pause agent mesh traffic' : 'Simulate continuous agent traffic'}
        >
          {isTrafficGenerating ? (
            <>
              <Pause className="w-3 h-3 fill-current text-amber-400" />
              <span>PAUSE SWARM</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-current text-emerald-400" />
              <span>RUN SWARM</span>
            </>
          )}
        </button>

        <div className="w-[1px] h-4 bg-white/10 mx-1" />

        {/* Layout Panels Toggles */}
        <button
          onClick={onToggleSidebar}
          className={`p-1.5 rounded hover:bg-white/10 transition-colors ${isSidebarOpen ? 'text-blue-400' : 'text-slate-400'}`}
          title="Toggle Primary Sidebar (⌘B)"
        >
          <PanelLeft className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onToggleBottomPanel}
          className={`p-1.5 rounded hover:bg-white/10 transition-colors ${isBottomPanelOpen ? 'text-blue-400' : 'text-slate-400'}`}
          title="Toggle Terminal & Event Stream Panel (⌘J)"
        >
          <PanelBottom className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onToggleInspector}
          className={`p-1.5 rounded hover:bg-white/10 transition-colors ${isInspectorOpen ? 'text-blue-400' : 'text-slate-400'}`}
          title="Toggle Security Inspector Panel"
        >
          <PanelRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
