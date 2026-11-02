import React from 'react';
import {
  Mail,
  ShieldCheck,
  AlertTriangle,
  Server,
  User,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  XCircle,
  Hash,
} from 'lucide-react';
import type { EmailResult, VerificationStatus } from '../types/osint';

interface EmailScanViewProps {
  emailResult: EmailResult;
  onBookmarkFinding: (finding: {
    category: 'email';
    summary: string;
    value: string;
    status: VerificationStatus;
    notes?: string;
  }) => void;
  bookmarkedValues: Set<string>;
}

export const EmailScanView: React.FC<EmailScanViewProps> = ({
  emailResult,
  onBookmarkFinding,
  bookmarkedValues,
}) => {
  const isBookmarked = bookmarkedValues.has(emailResult.email);

  return (
    <div className="space-y-6">
      {/* Top metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
          <p className="text-xs font-mono text-slate-400 uppercase">Target Mailbox</p>
          <p className="text-base font-bold font-mono text-cyan-300 mt-1 truncate">
            {emailResult.email}
          </p>
          <span className="text-[10px] text-slate-500 font-mono">Domain: {emailResult.domain}</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
          <p className="text-xs font-mono text-slate-400 uppercase">Syntax Validity</p>
          <div className="flex items-center gap-2 mt-1">
            {emailResult.syntaxValid ? (
              <span className="text-emerald-400 font-bold font-mono flex items-center gap-1 text-sm">
                <CheckCircle2 className="w-4 h-4" /> RFC 5322 Compliant
              </span>
            ) : (
              <span className="text-rose-400 font-bold font-mono flex items-center gap-1 text-sm">
                <XCircle className="w-4 h-4" /> Invalid Format
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {emailResult.isRoleBased ? 'Role-based address (e.g. admin/contact)' : 'Personal / Named inbox'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
          <p className="text-xs font-mono text-slate-400 uppercase">Mail Exchanger (MX)</p>
          <div className="flex items-center gap-2 mt-1">
            {emailResult.hasMxRecords ? (
              <span className="text-blue-400 font-bold font-mono flex items-center gap-1 text-sm">
                <CheckCircle2 className="w-4 h-4" /> Active ({emailResult.mxRecords.length} MX)
              </span>
            ) : (
              <span className="text-amber-400 font-bold font-mono flex items-center gap-1 text-sm">
                <AlertTriangle className="w-4 h-4" /> No MX Records Found
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {emailResult.mxRecords[0] || 'Cannot receive mail'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
          <p className="text-xs font-mono text-slate-400 uppercase">Disposable / Burner</p>
          <div className="flex items-center gap-2 mt-1">
            {emailResult.isDisposable ? (
              <span className="text-rose-400 font-bold font-mono flex items-center gap-1 text-sm">
                <AlertTriangle className="w-4 h-4" /> Temporary / Burner
              </span>
            ) : (
              <span className="text-emerald-400 font-bold font-mono flex items-center gap-1 text-sm">
                <CheckCircle2 className="w-4 h-4" /> Permanent Domain
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Checked against 100+ burner registries</span>
        </div>
      </div>

      {/* Gravatar Public Identity Section */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-bold text-white">Public Gravatar Footprint</h4>
            <span className="text-xs font-mono text-slate-500">Automattic Global Identity Hash</span>
          </div>
          {emailResult.gravatar.exists ? (
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              AVATAR REGISTERED
            </span>
          ) : (
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              NO PUBLIC PROFILE
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {emailResult.gravatar.avatarUrl && (
            <img
              src={emailResult.gravatar.avatarUrl}
              alt="Avatar"
              className="w-16 h-16 rounded-xl border border-slate-700 bg-slate-950 object-cover"
            />
          )}
          <div className="space-y-1 font-mono text-xs flex-1">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">MD5 Hash:</span>
              <span className="text-slate-300 font-mono">{emailResult.gravatar.hash}</span>
            </div>
            {emailResult.gravatar.displayName && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Display Name:</span>
                <span className="text-white font-semibold">{emailResult.gravatar.displayName}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Profile URL:</span>
              <a
                href={emailResult.gravatar.profileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline inline-flex items-center gap-1"
              >
                <span>{emailResult.gravatar.profileUrl}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Service Exposure Matrix */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Public Service Exposure Heuristics (Holehe-style)
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Non-intrusive public infrastructure indicators without credential stuffing or authentication abuse.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {emailResult.potentialServiceExposure.map((svc, i) => (
            <div
              key={i}
              className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs font-mono flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white">{svc.serviceName}</span>
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {svc.category}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed mt-1">{svc.details}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                <span>Indicator: {svc.indicator}</span>
                <span className="text-emerald-400 font-semibold">
                  {(svc.confidence * 100).toFixed(0)}% confidence
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
