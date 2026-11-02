import React, { useState } from 'react';
import {
  FolderLock,
  Plus,
  Trash2,
  Calendar,
  Tag,
  Bookmark,
  FileText,
  User,
  ShieldCheck,
  ExternalLink,
  Edit3,
  Check,
} from 'lucide-react';
import type { InvestigationCase, VerificationStatus } from '../types/osint';

interface CasesViewProps {
  cases: InvestigationCase[];
  activeCaseId: string;
  onSelectCase: (c: InvestigationCase) => void;
  onCreateCase: (title: string, target: string, targetType: any) => void;
  onDeleteCase: (id: string) => void;
  onUpdateCaseNotes: (id: string, notes: string) => void;
  onRemoveBookmark: (caseId: string, findingId: string) => void;
}

export const CasesView: React.FC<CasesViewProps> = ({
  cases,
  activeCaseId,
  onSelectCase,
  onCreateCase,
  onDeleteCase,
  onUpdateCaseNotes,
  onRemoveBookmark,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newType, setNewType] = useState<'username' | 'domain' | 'email'>('username');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');

  const activeCase = cases.find((c) => c.id === activeCaseId);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newTarget.trim()) return;
    onCreateCase(newTitle.trim(), newTarget.trim(), newType);
    setShowCreateModal(false);
    setNewTitle('');
    setNewTarget('');
  };

  const startEditNotes = () => {
    setNotesDraft(activeCase?.notes || '');
    setEditingNotes(true);
  };

  const saveNotes = () => {
    if (activeCase) {
      onUpdateCaseNotes(activeCase.id, notesDraft);
    }
    setEditingNotes(false);
  };

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
            <FolderLock className="w-4 h-4 text-cyan-400" />
            Investigation Dossier & Evidence Locker
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage local cases, analyst log notes, tagged findings, and verified artifacts.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Investigation Case</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases List Column */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono font-bold uppercase text-slate-400">
            Saved Cases ({cases.length})
          </h4>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {cases.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 bg-slate-950 rounded-lg border border-slate-800">
                No active cases saved. Create a new case or run an inquiry to initialize one automatically.
              </p>
            ) : (
              cases.map((c) => {
                const isActive = c.id === activeCaseId;
                return (
                  <div
                    key={c.id}
                    onClick={() => onSelectCase(c)}
                    className={`p-3.5 rounded-xl border font-mono text-xs cursor-pointer transition flex flex-col justify-between ${
                      isActive
                        ? 'bg-slate-900 border-cyan-500 shadow-md shadow-cyan-950/20'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="font-bold text-white truncate">{c.title}</h5>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteCase(c.id);
                          }}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded"
                          title="Delete case"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-cyan-400 mt-1 font-semibold truncate">{c.target}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                      <span className="uppercase">{c.targetType}</span>
                      <span>{c.bookmarkedFindings.length} Bookmarks</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Active Case Details & Evidence Locker Column */}
        <div className="lg:col-span-2 space-y-4">
          {activeCase ? (
            <>
              {/* Case Overview Card */}
              <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                      ACTIVE INVESTIGATION #{activeCase.id.slice(0, 8)}
                    </span>
                    <h3 className="text-lg font-bold text-white font-mono mt-1">
                      {activeCase.title}
                    </h3>
                  </div>
                  <div className="text-right text-[11px] font-mono text-slate-400">
                    <p>Created: {new Date(activeCase.createdAt).toLocaleDateString()}</p>
                    <p>Analyst: {activeCase.analyst || 'Local Investigator'}</p>
                  </div>
                </div>

                {/* Analyst Notes Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400 font-bold uppercase flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      Analyst Notes & Methodology Log
                    </span>
                    {!editingNotes ? (
                      <button
                        onClick={startEditNotes}
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit Notes
                      </button>
                    ) : (
                      <button
                        onClick={saveNotes}
                        className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono"
                      >
                        <Check className="w-3.5 h-3.5" /> Save
                      </button>
                    )}
                  </div>

                  {editingNotes ? (
                    <textarea
                      value={notesDraft}
                      onChange={(e) => setNotesDraft(e.target.value)}
                      rows={4}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                      placeholder="Add investigation objectives, hypothesis, or interview notes..."
                    />
                  ) : (
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 min-h-[60px] whitespace-pre-wrap">
                      {activeCase.notes || 'No notes entered yet. Click "Edit Notes" to add analyst observations.'}
                    </div>
                  )}
                </div>
              </div>

              {/* Bookmarked Findings Locker */}
              <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-cyan-400" />
                    Bookmarked Evidence Locker ({activeCase.bookmarkedFindings.length})
                  </h4>
                </div>

                {activeCase.bookmarkedFindings.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-6 text-center">
                    No artifacts bookmarked yet. When browsing usernames, DNS records, or contacts, click the bookmark icon to lock findings here.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {activeCase.bookmarkedFindings.map((finding) => (
                      <div
                        key={finding.id}
                        className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start justify-between gap-3 text-xs font-mono"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                              {finding.category}
                            </span>
                            <span className="font-semibold text-white">{finding.summary}</span>
                          </div>
                          <p className="text-cyan-300 break-all">{finding.value}</p>
                          {finding.notes && (
                            <p className="text-slate-400 text-[11px] italic">{finding.notes}</p>
                          )}
                        </div>

                        <button
                          onClick={() => onRemoveBookmark(activeCase.id, finding.id)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                          title="Remove bookmark"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-xs font-mono text-slate-500 border border-slate-800 rounded-xl bg-slate-950">
              Select or create a case from the left list.
            </div>
          )}
        </div>
      </div>

      {/* Create Case Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2 mb-4">
              <FolderLock className="w-4 h-4 text-cyan-400" /> New Investigation Case
            </h3>
            <form onSubmit={handleCreate} className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-slate-400 uppercase text-[10px] block mb-1">
                  Case Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp Infrastructure & Brand Audit"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 uppercase text-[10px] block mb-1">
                  Primary Target Value
                </label>
                <input
                  type="text"
                  placeholder="e.g. acme.com or johndoe"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 uppercase text-[10px] block mb-1">
                  Target Category
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                >
                  <option value="username">Username / Social Handle</option>
                  <option value="domain">Domain / Hostname</option>
                  <option value="email">Email Address</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                >
                  Create Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
