import React, { useState } from 'react';
import {
  Globe2,
  Server,
  ShieldCheck,
  FileCode,
  Network,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Copy,
  Check,
} from 'lucide-react';
import type { DomainResult, VerificationStatus } from '../types/osint';

interface DomainScanViewProps {
  domainResult: DomainResult;
  onBookmarkFinding: (finding: {
    category: 'domain' | 'dns';
    summary: string;
    value: string;
    status: VerificationStatus;
    notes?: string;
  }) => void;
  bookmarkedValues: Set<string>;
}

export const DomainScanView: React.FC<DomainScanViewProps> = ({
  domainResult,
  onBookmarkFinding,
  bookmarkedValues,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'dns' | 'rdap' | 'security' | 'subdomains'>('dns');
  const [dnsFilter, setDnsFilter] = useState<string>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const filteredDns = domainResult.dnsRecords.filter(
    (r) => dnsFilter === 'all' || r.type === dnsFilter
  );

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
          <p className="text-xs font-mono text-slate-400 uppercase">Domain Target</p>
          <p className="text-lg font-bold font-mono text-cyan-300 mt-1 truncate">
            {domainResult.domain}
          </p>
          <span className="text-[10px] text-slate-500 font-mono">
            Registrar: {domainResult.rdap.registrar || 'Active DNS'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
          <p className="text-xs font-mono text-slate-400 uppercase">Resolved IPs (A/AAAA)</p>
          <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {domainResult.ipAddresses.length} Addresses
          </p>
          <span className="text-[10px] text-slate-500 font-mono">
            {domainResult.ipAddresses[0] || 'Unresolved'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
          <p className="text-xs font-mono text-slate-400 uppercase">Mail Exchangers (MX)</p>
          <p className="text-xl font-bold font-mono text-blue-400 mt-1">
            {domainResult.mailServers.length} Servers
          </p>
          <span className="text-[10px] text-slate-500 font-mono">
            {domainResult.mailServers[0] || 'No MX routes'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
          <p className="text-xs font-mono text-slate-400 uppercase">Security Disclosure</p>
          <div className="flex items-center gap-2 mt-1">
            {domainResult.securityTxt.found ? (
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                RFC 9116 ACTIVE
              </span>
            ) : (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                Not Published
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {domainResult.securityTxt.contacts?.length
              ? `${domainResult.securityTxt.contacts.length} security contacts`
              : 'No contact listed'}
          </span>
        </div>
      </div>

      {/* Domain Sub-Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('dns')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition ${
            activeSubTab === 'dns'
              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>DNS Records ({domainResult.dnsRecords.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('rdap')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition ${
            activeSubTab === 'rdap'
              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Globe2 className="w-3.5 h-3.5" />
          <span>RDAP & WHOIS Registration</span>
        </button>
        <button
          onClick={() => setActiveSubTab('security')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition ${
            activeSubTab === 'security'
              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>security.txt & Policy</span>
        </button>
        <button
          onClick={() => setActiveSubTab('subdomains')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition ${
            activeSubTab === 'subdomains'
              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>Discovered Subdomains ({domainResult.subdomains.length})</span>
        </button>
      </div>

      {/* Subtab 1: DNS Records */}
      {activeSubTab === 'dns' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400">Filter Record Type:</span>
              {['all', 'A', 'AAAA', 'MX', 'TXT', 'NS', 'SOA'].map((t) => (
                <button
                  key={t}
                  onClick={() => setDnsFilter(t)}
                  className={`px-2.5 py-0.5 rounded font-mono text-[11px] transition ${
                    dnsFilter === t
                      ? 'bg-cyan-600 text-white font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>

            <span className="text-xs font-mono text-slate-500">
              Queried via Cloudflare & Google DNS-over-HTTPS
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/70">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3">Data / Target</th>
                  <th className="p-3">Priority / TTL</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredDns.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-500 italic">
                      No DNS records matching filter.
                    </td>
                  </tr>
                ) : (
                  filteredDns.map((rec, idx) => {
                    const isBookmarked = bookmarkedValues.has(rec.value);
                    return (
                      <tr key={idx} className="hover:bg-slate-800/30 transition">
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              rec.type === 'A'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : rec.type === 'MX'
                                ? 'bg-blue-950 text-blue-400 border border-blue-800'
                                : rec.type === 'TXT'
                                ? 'bg-purple-950 text-purple-400 border border-purple-800'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {rec.type}
                          </span>
                        </td>
                        <td className="p-3 text-slate-200 font-mono break-all max-w-xl">
                          {rec.value}
                        </td>
                        <td className="p-3 text-slate-400">
                          {rec.priority ? `Pri: ${rec.priority}` : rec.ttl ? `TTL: ${rec.ttl}s` : '-'}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => copyToClipboard(rec.value, `dns-${idx}`)}
                              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                              title="Copy record"
                            >
                              {copiedKey === `dns-${idx}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() =>
                                onBookmarkFinding({
                                  category: 'dns',
                                  summary: `${rec.type} Record for ${domainResult.domain}`,
                                  value: rec.value,
                                  status: 'PUBLIC_VERIFIED',
                                  notes: `TTL: ${rec.ttl || 'N/A'}`,
                                })
                              }
                              className={`p-1 rounded transition ${
                                isBookmarked
                                  ? 'text-cyan-400'
                                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
                              }`}
                              title="Bookmark finding"
                            >
                              {isBookmarked ? (
                                <BookmarkCheck className="w-3.5 h-3.5 text-cyan-400" />
                              ) : (
                                <Bookmark className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Email Security Breakdown (SPF / DMARC) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-slate-300">SPF Security Record</span>
                {domainResult.spfRecord ? (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                    DETECTED
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 font-mono">
                    NO SPF POLICY
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-slate-400 break-all bg-slate-950 p-2.5 rounded border border-slate-800">
                {domainResult.spfRecord || 'No v=spf1 TXT policy discovered for domain.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-slate-300">DMARC Policy (_dmarc)</span>
                {domainResult.dmarcRecord ? (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                    ACTIVE
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 font-mono">
                    UNENFORCED
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-slate-400 break-all bg-slate-950 p-2.5 rounded border border-slate-800">
                {domainResult.dmarcRecord || 'No v=DMARC1 record found at _dmarc host.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: RDAP / WHOIS */}
      {activeSubTab === 'rdap' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 font-mono text-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white">RDAP Registry Intelligence</h4>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Source: {domainResult.rdap.rdapSource || 'Open RDAP Authority'}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 text-[11px]">
                RFC 7480/7484 Verified
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div>
                  <p className="text-slate-500 uppercase text-[10px]">Registrar Entity</p>
                  <p className="text-slate-200 font-semibold">{domainResult.rdap.registrar || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-500 uppercase text-[10px]">Created / Registered</p>
                  <p className="text-slate-200">{domainResult.rdap.createdDate || 'Unavailable via RDAP'}</p>
                </div>
                <div>
                  <p className="text-slate-500 uppercase text-[10px]">Expiration Date</p>
                  <p className="text-slate-200">{domainResult.rdap.expiresDate || 'Unavailable via RDAP'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-slate-500 uppercase text-[10px]">Abuse / Escalation Contact</p>
                  <p className="text-emerald-400 font-semibold">{domainResult.rdap.abuseContact || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-slate-500 uppercase text-[10px]">Authoritative Name Servers</p>
                  <div className="space-y-1 mt-1">
                    {domainResult.nameServers.map((ns, i) => (
                      <p key={i} className="text-slate-300">{ns}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {domainResult.rdap.status && domainResult.rdap.status.length > 0 && (
              <div className="pt-3 border-t border-slate-800">
                <p className="text-slate-500 uppercase text-[10px] mb-1.5">ICANN Domain Status Codes</p>
                <div className="flex flex-wrap gap-1.5">
                  {domainResult.rdap.status.map((st, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 text-[10px]">
                      {st}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subtab 3: security.txt */}
      {activeSubTab === 'security' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  RFC 9116 Vulnerability Disclosure Policy
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Official public owner-authorized security point of contact specification.
                </p>
              </div>
              {domainResult.securityTxt.found ? (
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                  CONFIRMED ACTIVE
                </span>
              ) : (
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-400">
                  FILE NOT LOCATED
                </span>
              )}
            </div>

            {domainResult.securityTxt.found ? (
              <div className="space-y-4 text-xs font-mono">
                {domainResult.securityTxt.contacts && (
                  <div>
                    <p className="text-slate-400 uppercase text-[10px] mb-1">Owner-Authorized Contacts</p>
                    <div className="space-y-1.5">
                      {domainResult.securityTxt.contacts.map((c, i) => (
                        <div key={i} className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between items-center">
                          <span className="text-emerald-400 font-semibold">{c}</span>
                          <span className="text-[10px] text-slate-500">Authorized by Owner</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {domainResult.securityTxt.encryption && (
                  <div>
                    <p className="text-slate-400 uppercase text-[10px] mb-1">PGP / Encryption Key Links</p>
                    <div className="space-y-1">
                      {domainResult.securityTxt.encryption.map((enc, i) => (
                        <p key={i} className="text-cyan-400 truncate">{enc}</p>
                      ))}
                    </div>
                  </div>
                )}

                {domainResult.securityTxt.raw && (
                  <div>
                    <p className="text-slate-400 uppercase text-[10px] mb-1">Raw security.txt Content</p>
                    <pre className="p-3 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap">
                      {domainResult.securityTxt.raw}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-xs font-mono text-slate-500 space-y-1">
                <p>Checked /.well-known/security.txt and /security.txt.</p>
                <p>The domain host has not published an RFC 9116 security declaration.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subtab 4: Subdomains */}
      {activeSubTab === 'subdomains' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Discovered Asset Subdomains ({domainResult.subdomains.length})</span>
            <span>Passive DNS resolution probe</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {domainResult.subdomains.map((sub, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 font-mono text-xs flex flex-col justify-between"
              >
                <div>
                  <p className="text-white font-semibold truncate">{sub.subdomain}</p>
                  <p className="text-emerald-400 text-[11px] mt-1">{sub.ip || 'Resolved'}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="uppercase">{sub.source}</span>
                  <a
                    href={`https://${sub.subdomain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <span>Visit</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
