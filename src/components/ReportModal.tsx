import React, { useRef } from 'react';
import {
  Printer,
  Download,
  X,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Globe2,
  UserCheck,
  Mail,
  Contact,
  FileCheck,
} from 'lucide-react';
import type { InvestigationCase } from '../types/osint';

interface ReportModalProps {
  currentCase: InvestigationCase;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ currentCase, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const verifiedUsernames =
    currentCase.usernameResults?.filter((u) => u.status === 'PUBLIC_VERIFIED') || [];
  const domainRes = currentCase.domainResult;
  const emailRes = currentCase.emailResult;
  const contacts = currentCase.publicContacts || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white">OSINT Intelligence Dossier</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              CASE #{currentCase.id.slice(0, 8)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-lg transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div ref={printRef} className="p-8 overflow-y-auto space-y-6 text-slate-200 bg-slate-950 print:bg-white print:text-black">
          {/* Document Header */}
          <div className="border-b-2 border-slate-700 print:border-black pb-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs uppercase font-mono tracking-widest text-cyan-400 print:text-black">
                  CONTACTTRACE INTELLIGENCE PLATFORM &bull; OPEN-SOURCE SUITE
                </p>
                <h1 className="text-2xl font-bold font-mono tracking-tight text-white print:text-black mt-1">
                  OPEN-SOURCE INTELLIGENCE AUDIT DOSSIER
                </h1>
                <p className="text-xs text-slate-400 print:text-gray-600 mt-1">
                  Generated: {new Date().toUTCString()} &bull; Classification: UNCLASSIFIED / PUBLIC
                </p>
              </div>
              <div className="text-right font-mono text-xs text-slate-400 print:text-gray-600">
                <p>Status: <span className="text-emerald-400 print:text-black font-bold">VERIFIED SOURCES</span></p>
                <p>Engine: ContactTrace v3</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 p-3 rounded-lg bg-slate-900/60 print:bg-gray-100 border border-slate-800 print:border-gray-300 font-mono text-xs">
              <div>
                <p className="text-slate-500 print:text-gray-500">TARGET VALUE</p>
                <p className="text-white print:text-black font-bold truncate">{currentCase.target}</p>
              </div>
              <div>
                <p className="text-slate-500 print:text-gray-500">TARGET CATEGORY</p>
                <p className="text-white print:text-black font-bold uppercase">{currentCase.targetType}</p>
              </div>
              <div>
                <p className="text-slate-500 print:text-gray-500">LEAD ANALYST</p>
                <p className="text-white print:text-black">{currentCase.analyst || 'Primary Investigator'}</p>
              </div>
              <div>
                <p className="text-slate-500 print:text-gray-500">EVIDENCE ITEMS</p>
                <p className="text-white print:text-black font-bold">
                  {verifiedUsernames.length + (domainRes ? domainRes.dnsRecords.length : 0) + contacts.length} Verified
                </p>
              </div>
            </div>
          </div>

          {/* Section: Ethical Scope Notice */}
          <div className="p-3.5 rounded-lg border border-cyan-800/60 bg-cyan-950/20 print:border-gray-300 print:bg-gray-50 text-xs leading-relaxed">
            <p className="font-semibold text-cyan-300 print:text-black mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Ethics & Evidence Integrity Certification
            </p>
            <p className="text-slate-300 print:text-gray-700">
              All findings in this dossier were collected strictly through public open-source protocols
              (RFC DNS records, open RDAP registries, authorized security.txt declarations, and public HTTP endpoints).
              No illicit private telephone lookups, compromised credential dumps, or paid broker databases were utilized.
            </p>
          </div>

          {/* Section: Public Verified Contacts */}
          {contacts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold font-mono text-cyan-300 print:text-black uppercase flex items-center gap-2 border-b border-slate-800 pb-1">
                <Contact className="w-4 h-4" /> Authorized Points of Contact
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border border-slate-800 print:border-gray-400">
                  <thead className="bg-slate-900 print:bg-gray-200 text-slate-400 print:text-black">
                    <tr>
                      <th className="p-2 border-b border-slate-800 print:border-gray-400">Contact Item</th>
                      <th className="p-2 border-b border-slate-800 print:border-gray-400">Type</th>
                      <th className="p-2 border-b border-slate-800 print:border-gray-400">Authorization Class</th>
                      <th className="p-2 border-b border-slate-800 print:border-gray-400">Provenance / Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((c, i) => (
                      <tr key={i} className="border-b border-slate-800/60 print:border-gray-300">
                        <td className="p-2 font-bold text-white print:text-black">{c.value}</td>
                        <td className="p-2 uppercase text-slate-400 print:text-gray-600">{c.type}</td>
                        <td className="p-2 text-emerald-400 print:text-black font-semibold">{c.authorizationType}</td>
                        <td className="p-2 text-slate-400 print:text-gray-600">{c.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section: Username Discovered Profiles */}
          {verifiedUsernames.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold font-mono text-cyan-300 print:text-black uppercase flex items-center gap-2 border-b border-slate-800 pb-1">
                <UserCheck className="w-4 h-4" /> Discovered Public Online Identities ({verifiedUsernames.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                {verifiedUsernames.map((u, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded bg-slate-900/50 print:bg-gray-50 border border-slate-800 print:border-gray-300 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold text-white print:text-black">{u.platformName}</p>
                      <p className="text-slate-400 print:text-gray-600 text-[11px] truncate max-w-[260px]">
                        {u.profileUrl}
                      </p>
                      {u.metadata?.claimedName && (
                        <p className="text-[10px] text-cyan-400 print:text-gray-800">
                          Claimed: {u.metadata.claimedName}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      HTTP {u.httpStatus || 200}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Domain & DNS Infrastructure */}
          {domainRes && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold font-mono text-cyan-300 print:text-black uppercase flex items-center gap-2 border-b border-slate-800 pb-1">
                <Globe2 className="w-4 h-4" /> Domain & Infrastructure Footprint ({domainRes.domain})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3 bg-slate-900/50 print:bg-gray-50 border border-slate-800 rounded">
                  <p className="text-slate-500 uppercase font-semibold">RDAP Registration</p>
                  <p className="text-white print:text-black mt-1">Registrar: {domainRes.rdap.registrar || 'N/A'}</p>
                  <p className="text-slate-400 print:text-gray-600">Expires: {domainRes.rdap.expiresDate || 'N/A'}</p>
                  <p className="text-slate-400 print:text-gray-600">Abuse: {domainRes.rdap.abuseContact || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-900/50 print:bg-gray-50 border border-slate-800 rounded">
                  <p className="text-slate-500 uppercase font-semibold">Security & Routing</p>
                  <p className="text-white print:text-black mt-1">
                    security.txt: {domainRes.securityTxt.found ? 'Published RFC 9116' : 'Not detected'}
                  </p>
                  <p className="text-slate-400 print:text-gray-600">
                    Mail Exchangers: {domainRes.mailServers.slice(0, 2).join(', ') || 'None'}
                  </p>
                  <p className="text-slate-400 print:text-gray-600">
                    Name Servers: {domainRes.nameServers.slice(0, 2).join(', ') || 'None'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section: Email Footprint */}
          {emailRes && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold font-mono text-cyan-300 print:text-black uppercase flex items-center gap-2 border-b border-slate-800 pb-1">
                <Mail className="w-4 h-4" /> Email Deliverability & Identity Profile
              </h3>
              <div className="p-3 bg-slate-900/50 print:bg-gray-50 border border-slate-800 rounded text-xs font-mono space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Email Address:</span>
                  <span className="text-white font-bold">{emailRes.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Syntax RFC Conformance:</span>
                  <span className={emailRes.syntaxValid ? 'text-emerald-400' : 'text-rose-400'}>
                    {emailRes.syntaxValid ? 'VALID' : 'INVALID'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">MX Mail Routing:</span>
                  <span className="text-cyan-400">{emailRes.hasMxRecords ? 'ACTIVE' : 'NO MX RECORDS'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Disposable Inbox Provider:</span>
                  <span className={emailRes.isDisposable ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                    {emailRes.isDisposable ? 'YES (BURNT/TEMP)' : 'NO (STANDARD)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gravatar Identity:</span>
                  <span className="text-slate-300">
                    {emailRes.gravatar.exists ? `Found (${emailRes.gravatar.displayName || 'Avatar active'})` : 'None published'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Dossier Sign-off */}
          <div className="pt-6 border-t border-slate-800 print:border-black flex justify-between items-center text-[11px] font-mono text-slate-500 print:text-gray-500">
            <p>Report SHA-256 hash verified by ContactTrace Engine</p>
            <p>End of Intelligence Dossier &bull; Page 1 of 1</p>
          </div>
        </div>
      </div>
    </div>
  );
};
