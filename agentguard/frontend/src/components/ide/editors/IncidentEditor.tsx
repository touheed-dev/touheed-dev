import React from 'react';
import {
  AlertTriangle, ShieldAlert, CheckCircle2, RotateCcw, Ban,
  RefreshCw, Download, FileText, Lock
} from 'lucide-react';
import { IncidentRecord } from '../../../types/ide';

interface IncidentEditorProps {
  incidentId: string;
  incident?: IncidentRecord;
  onQuarantineAgent: (agentId: string) => void;
  onResetAgent: (agentId: string) => void;
  onBumpEpoch: (agentId: string) => void;
}

export const IncidentEditor: React.FC<IncidentEditorProps> = ({
  incidentId,
  incident,
  onQuarantineAgent,
  onResetAgent,
  onBumpEpoch,
}) => {
  if (!incident) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-slate-500 font-mono text-xs">
        Incident {incidentId} not found.
      </div>
    );
  }

  const handleExportForensics = () => {
    const blob = new Blob([JSON.stringify(incident, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agentguard-incident-${incidentId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto p-6 font-mono text-xs select-text space-y-6" style={{ background: '#1e1e1e', color: '#e0e0e0' }}>

      {/* ── Top Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#2d2d2d]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white font-sans">{incident.title}</h1>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  incident.severity === 'CRITICAL'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : incident.severity === 'HIGH'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                }`}
              >
                {incident.severity}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  incident.status === 'CONTAINED'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}
              >
                STATUS: {incident.status}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              Incident ID: {incident.incident_id} • Logged at: {new Date(incident.timestamp).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportForensics}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#252526] hover:bg-[#333333] border border-[#3c3c3c] text-slate-200 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Forensic Dossier</span>
        </button>
      </div>

      {/* ── Containment & Breach Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Description & Breach Details */}
        <div className="p-4 rounded-xl bg-[#252526] border border-[#2d2d2d] space-y-2">
          <span className="text-xs uppercase font-bold tracking-wider text-slate-300 block">
            Incident Synopsis & Forensics
          </span>
          <p className="text-slate-300 leading-relaxed text-xs">
            {incident.description}
          </p>

          <div className="pt-2 border-t border-[#2d2d2d] space-y-1.5 text-[11px]">
            <div>
              <span className="text-slate-500 block text-[9px] uppercase">Agent Identity</span>
              <strong className="text-white">{incident.agent_id}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase">Security Policy Violated</span>
              <span className="text-red-400 font-bold">{incident.rule_violated || 'POL-001 (Tripwire Canary)'}</span>
            </div>
            {incident.tripwire_token && (
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">Tripped Canary Token</span>
                <code className="text-amber-300 bg-black/40 px-1 py-0.5 rounded">{incident.tripwire_token}</code>
              </div>
            )}
          </div>
        </div>

        {/* Containment Protocol Execution */}
        <div className="p-4 rounded-xl bg-[#252526] border border-[#2d2d2d] space-y-3">
          <span className="text-xs uppercase font-bold tracking-wider text-slate-300 block">
            Active Containment Protocol
          </span>
          <div className="p-3 rounded bg-red-500/10 border border-red-500/30 text-red-200 text-xs">
            {incident.containment_action}
          </div>

          <div className="space-y-2 pt-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Remediation Action Gates:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onQuarantineAgent(incident.agent_id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Re-Enforce Quarantine</span>
              </button>
              <button
                onClick={() => onBumpEpoch(incident.agent_id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Invalidate Token Epoch</span>
              </button>
              <button
                onClick={() => onResetAgent(incident.agent_id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Agent to Clean</span>
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
