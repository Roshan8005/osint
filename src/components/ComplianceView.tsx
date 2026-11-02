import React from 'react';
import {
  Scale,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  XCircle,
  FileText,
  AlertTriangle,
  Lock,
  Server,
  BookOpen,
} from 'lucide-react';

export const ComplianceView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Hero Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-400">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-mono">
              ContactTrace Ethical Operating Standard & OSINT Manifesto
            </h2>
            <p className="text-xs text-slate-400">
              Responsible open-source intelligence guidelines, anti-broker policy, and source verification architecture.
            </p>
          </div>
        </div>
      </div>

      {/* 4-Tier Verification Matrix */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          The ContactTrace Four-Tier Verification Matrix
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          In order to prevent misinformation, false identity claims, and fraudulent associations, every single piece of data displayed in ContactTrace is strictly categorized into one of four verifiable classifications:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-950 border border-emerald-900/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> 1. PUBLIC_VERIFIED
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400">
                100% Confirmed
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Information published openly on the public web, verified via live HTTP 200 responses, standard DNS RFC records, or public RDAP authorities with no obfuscation.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-cyan-900/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> 2. OWNER_AUTHORIZED
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400">
                Owner Approved
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Direct points of contact explicitly designated by domain administrators via official standards like <span className="font-mono text-cyan-300">RFC 9116 security.txt</span> or voluntary disclosure declarations.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-amber-900/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> 3. UNVERIFIED_MATCH
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-400">
                Analyst Caution
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Heuristic or correlative indicators that share matching handles or naming conventions but lack cryptographic or direct authoritative linkage. Requires manual verification.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-slate-500" /> 4. UNAVAILABLE / NOT FOUND
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400">
                Excluded
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Items shielded by privacy protection, absent from public DNS, rate-limited, or confirmed non-existent. ContactTrace will never synthesize or speculate on missing records.
            </p>
          </div>
        </div>
      </div>

      {/* Distinction from paid data brokers */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          Distinction From Commercial Data Brokers
        </h3>
        <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
          <p>
            Commercial "people search" engines and paid OSINT aggregators frequently ingest illicit scraped records, breached marketing lists, or telecommunication reseller dumps to offer "masked phone unlocks" and private cell lookups behind steep subscription paywalls.
          </p>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>What ContactTrace Will NEVER Do:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px] pl-2">
              <li>Will never claim to "unlock" hidden personal cell numbers that are not openly published by their owner.</li>
              <li>Will never invent dummy phone numbers or fuzzy placeholder contacts.</li>
              <li>Will never engage in brute-force account enumeration or auth bypass.</li>
              <li>Will never require a paid credit card subscription for data that is public.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Integrated Open Source Technologies */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-cyan-400" />
          Integrated Open Source Modules & Standards
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <p className="font-bold text-white">Maigret & Sherlock</p>
            <p className="text-slate-400 text-[11px] mt-1">
              Multi-platform public profile detection via open endpoints and status analysis.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <p className="font-bold text-white">DNS-over-HTTPS (RFC 8484)</p>
            <p className="text-slate-400 text-[11px] mt-1">
              Cryptographically validated record queries (A, AAAA, MX, TXT, NS, SOA).
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <p className="font-bold text-white">RDAP Authority (RFC 7480)</p>
            <p className="text-slate-400 text-[11px] mt-1">
              Authoritative JSON-based successor to WHOIS for domain registration audit.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <p className="font-bold text-white">Holehe & RFC 5322</p>
            <p className="text-slate-400 text-[11px] mt-1">
              Email syntax verification, MX reachability, and public Gravatar hash checking.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <p className="font-bold text-white">security.txt (RFC 9116)</p>
            <p className="text-slate-400 text-[11px] mt-1">
              Standardized owner-published security disclosure contacts and PGP keys.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <p className="font-bold text-white">OWASP Amass / crt.sh</p>
            <p className="text-slate-400 text-[11px] mt-1">
              Infrastructure asset discovery and certificate transparency mapping.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
