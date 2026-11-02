import React, { useState, useEffect } from 'react';
import {
  Compass,
  Search,
  Activity,
  ArrowRight,
  ShieldCheck,
  Globe2,
  UserCheck,
  Mail,
  Contact,
  Sparkles,
  RefreshCw,
  Sliders,
  CheckCircle2,
  FileText,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Header } from './components/Header';
import { Navigation, TabKey } from './components/Navigation';
import { TerminalLog } from './components/TerminalLog';
import { GraphView } from './components/GraphView';
import { ReportModal } from './components/ReportModal';
import { UsernameScanView } from './components/UsernameScanView';
import { DomainScanView } from './components/DomainScanView';
import { EmailScanView } from './components/EmailScanView';
import { ContactsView } from './components/ContactsView';
import { CasesView } from './components/CasesView';
import { ComplianceView } from './components/ComplianceView';
import {
  checkUsernameApi,
  checkDomainApi,
  checkEmailApi,
  fetchSavedCases,
  saveCaseApi,
  deleteCaseApi,
  generateGraphData,
  PRESET_TARGETS,
} from './services/api';
import type {
  DomainResult,
  EmailResult,
  InvestigationCase,
  PublicContact,
  TargetType,
  UsernameResult,
  VerificationStatus,
} from './types/osint';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('search');
  const [searchTarget, setSearchTarget] = useState('eff.org');
  const [selectedTargetType, setSelectedTargetType] = useState<TargetType>('auto');
  const [isScanning, setIsScanning] = useState(false);
  const [activeScanType, setActiveScanType] = useState<string>('');
  const [scanProgress, setScanProgress] = useState<string>('');

  // Module check toggles
  const [enableUsernames, setEnableUsernames] = useState(true);
  const [enableDomain, setEnableDomain] = useState(true);
  const [enableEmail, setEnableEmail] = useState(true);
  const [enableContacts, setEnableContacts] = useState(true);

  // Investigation State
  const [cases, setCases] = useState<InvestigationCase[]>([]);
  const [activeCase, setActiveCase] = useState<InvestigationCase | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);

  // Load cases on mount
  useEffect(() => {
    async function init() {
      addLog('[*] Initializing ContactTrace OSINT Suite v3.0 (Self-Hosted Open-Source)...');
      addLog('[*] Loading local investigation cases & evidence locker...');
      try {
        const loadedCases = await fetchSavedCases();
        if (loadedCases.length > 0) {
          setCases(loadedCases);
          setActiveCase(loadedCases[0]);
          addLog(`[+] Loaded ${loadedCases.length} saved investigation cases.`);
        } else {
          // Initialize default welcome case
          const initialCase: InvestigationCase = {
            id: `case-${Date.now()}`,
            title: 'Initial Investigation: Electronic Frontier Foundation',
            target: 'eff.org',
            targetType: 'domain',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            analyst: 'Lead OSINT Investigator',
            notes: 'Default baseline audit of open DNS, RDAP, and RFC 9116 security.txt standards.',
            tags: ['baseline', 'domain', 'authorized-poc'],
            bookmarkedFindings: [],
          };
          setCases([initialCase]);
          setActiveCase(initialCase);
          await saveCaseApi(initialCase);
          addLog('[+] Initialized default investigation case.');
        }
      } catch (err) {
        addLog(`[!] Case loader warning: ${err}`);
      }
    }
    init();
  }, []);

  const addLog = (msg: string) => {
    const timestamp = new Date().toTimeString().split(' ')[0];
    setTerminalLogs((prev) => [...prev.slice(-150), `[${timestamp}] ${msg}`]);
  };

  // Target Auto-Detection Helper
  const detectType = (val: string): 'email' | 'domain' | 'username' => {
    const clean = val.trim();
    if (clean.includes('@')) return 'email';
    if (clean.includes('.') && !clean.includes(' ')) return 'domain';
    return 'username';
  };

  // Execute Search / Inquiry
  const handleExecuteScan = async (overrideTarget?: string, overrideType?: TargetType) => {
    const rawTarget = (overrideTarget || searchTarget).trim();
    if (!rawTarget) return;

    const detected = overrideType && overrideType !== 'auto' ? overrideType : detectType(rawTarget);
    setIsScanning(true);
    setActiveScanType(detected);
    setScanProgress(`Initiating inquiry on ${rawTarget}...`);

    addLog(`------------------------------------------------------------`);
    addLog(`[*] INQUIRY INITIATED: Target '${rawTarget}' (Class: ${detected.toUpperCase()})`);
    addLog(`[*] Enforcement: Free Open-Source Mode &bull; Non-invasive &bull; Public verification`);

    let updatedUsernames: UsernameResult[] | undefined = activeCase?.usernameResults;
    let updatedDomain: DomainResult | undefined = activeCase?.domainResult;
    let updatedEmail: EmailResult | undefined = activeCase?.emailResult;
    let updatedContacts: PublicContact[] = activeCase?.publicContacts ? [...activeCase.publicContacts] : [];

    try {
      // 1. If Domain
      if (detected === 'domain' || rawTarget.includes('.')) {
        if (enableDomain) {
          addLog(`[*] Querying DNS-over-HTTPS (A, AAAA, MX, TXT, NS, SOA, CAA) for '${rawTarget}'...`);
          setScanProgress('Resolving DNS records and RDAP registration...');
          try {
            const domainData = await checkDomainApi(rawTarget);
            updatedDomain = domainData.domainResult;
            addLog(`[+] DNS records resolved: ${domainData.domainResult.dnsRecords.length} records`);
            addLog(`[+] RDAP Authority: ${domainData.domainResult.rdap.registrar || 'Active DNS'}`);

            if (domainData.domainResult.securityTxt.found) {
              addLog(`[+] VERIFIED: RFC 9116 security.txt discovered at ${domainData.domainResult.securityTxt.url}`);
            }

            if (domainData.extractedContacts && domainData.extractedContacts.length > 0) {
              addLog(`[+] Extracted ${domainData.extractedContacts.length} owner-authorized contacts (security.txt/RDAP)`);
              domainData.extractedContacts.forEach((c) => {
                if (!updatedContacts.some((existing) => existing.value === c.value)) {
                  updatedContacts.push(c);
                }
              });
            }
          } catch (err: any) {
            addLog(`[!] Domain probe error: ${err.message}`);
          }
        }
      }

      // 2. If Username
      if (detected === 'username') {
        if (enableUsernames) {
          const cleanUser = rawTarget.replace(/^@/, '');
          addLog(`[*] Launching Maigret & Sherlock probe for username '@${cleanUser}' across 30+ platforms...`);
          setScanProgress('Probing public developer, social, and gaming platforms...');
          try {
            const userResults = await checkUsernameApi(cleanUser);
            updatedUsernames = userResults.results;
            addLog(`[+] Username scan completed: ${userResults.verifiedCount} verified public accounts located`);
          } catch (err: any) {
            addLog(`[!] Username probe error: ${err.message}`);
          }
        }
      }

      // 3. If Email or Auto
      if (detected === 'email') {
        if (enableEmail) {
          addLog(`[*] Launching Holehe & RFC deliverability audit for email '${rawTarget}'...`);
          setScanProgress('Validating MX routes and public Gravatar hash...');
          try {
            const emailData = await checkEmailApi(rawTarget);
            updatedEmail = emailData.emailResult;
            addLog(`[+] Email RFC Syntax: ${emailData.emailResult.syntaxValid ? 'VALID' : 'INVALID'}`);
            addLog(`[+] MX Mail Routing: ${emailData.emailResult.hasMxRecords ? 'CONFIRMED' : 'NO MX RECORD'}`);
            if (emailData.emailResult.gravatar.exists) {
              addLog(`[+] Public Gravatar profile located: ${emailData.emailResult.gravatar.profileUrl}`);
            }

            // Also check domain of the email if enabled
            if (enableDomain && emailData.emailResult.domain) {
              addLog(`[*] Auto-pivoting to domain audit for '${emailData.emailResult.domain}'...`);
              try {
                const domainData = await checkDomainApi(emailData.emailResult.domain);
                updatedDomain = domainData.domainResult;
                if (domainData.extractedContacts) {
                  domainData.extractedContacts.forEach((c) => {
                    if (!updatedContacts.some((existing) => existing.value === c.value)) {
                      updatedContacts.push(c);
                    }
                  });
                }
              } catch {}
            }
          } catch (err: any) {
            addLog(`[!] Email audit error: ${err.message}`);
          }
        }
      }

      // Sync into Active Case
      const caseId = activeCase ? activeCase.id : `case-${Date.now()}`;
      const caseTitle =
        activeCase && activeCase.target === rawTarget
          ? activeCase.title
          : `Inquiry: ${rawTarget.toUpperCase()}`;

      const savedCase: InvestigationCase = {
        id: caseId,
        title: caseTitle,
        target: rawTarget,
        targetType: detected,
        createdAt: activeCase ? activeCase.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        analyst: activeCase?.analyst || 'Lead OSINT Investigator',
        notes: activeCase?.notes || `Target ${rawTarget} queried on ${new Date().toLocaleString()}`,
        tags: activeCase?.tags || [detected, 'inquiry'],
        bookmarkedFindings: activeCase?.bookmarkedFindings || [],
        usernameResults: updatedUsernames,
        domainResult: updatedDomain,
        emailResult: updatedEmail,
        publicContacts: updatedContacts,
        terminalLogs: [...terminalLogs],
      };

      setActiveCase(savedCase);
      setCases((prev) => {
        const idx = prev.findIndex((c) => c.id === savedCase.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = savedCase;
          return next;
        }
        return [savedCase, ...prev];
      });

      await saveCaseApi(savedCase);
      addLog(`[+] Investigation case synced and evidence committed.`);
    } catch (err: any) {
      addLog(`[!] Fatal error during investigation: ${err.message}`);
    } finally {
      setIsScanning(false);
      setActiveScanType('');
      setScanProgress('');
    }
  };

  // Bookmark a finding
  const handleBookmarkFinding = async (finding: {
    category: 'username' | 'domain' | 'email' | 'contact' | 'dns';
    summary: string;
    value: string;
    status: VerificationStatus;
    notes?: string;
  }) => {
    if (!activeCase) return;

    const existingIdx = activeCase.bookmarkedFindings.findIndex((f) => f.value === finding.value);
    let updatedBookmarks = [...activeCase.bookmarkedFindings];

    if (existingIdx >= 0) {
      updatedBookmarks = updatedBookmarks.filter((f) => f.value !== finding.value);
      addLog(`[-] Removed bookmark for: ${finding.value}`);
    } else {
      updatedBookmarks.push({
        id: `bm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ...finding,
      });
      addLog(`[+] Bookmarked evidence item: ${finding.summary} (${finding.value})`);
    }

    const updatedCase = { ...activeCase, bookmarkedFindings: updatedBookmarks, updatedAt: new Date().toISOString() };
    setActiveCase(updatedCase);
    setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
    await saveCaseApi(updatedCase);
  };

  // Add Verified Contact
  const handleAddContact = async (contact: PublicContact) => {
    if (!activeCase) return;
    const updatedContacts = [...(activeCase.publicContacts || []), contact];
    const updatedCase = { ...activeCase, publicContacts: updatedContacts, updatedAt: new Date().toISOString() };
    setActiveCase(updatedCase);
    setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
    await saveCaseApi(updatedCase);
    addLog(`[+] New authorized contact committed: ${contact.label} (${contact.value})`);
  };

  // Export CSV
  const handleExportCsv = () => {
    if (!activeCase) return;
    const rows: string[][] = [
      ['Case ID', 'Target', 'Target Type', 'Category', 'Item / Platform', 'Value', 'Verification Status', 'Provenance Source'],
    ];

    // Usernames
    activeCase.usernameResults?.forEach((u) => {
      rows.push([
        activeCase.id,
        activeCase.target,
        activeCase.targetType,
        'Username',
        u.platformName,
        u.profileUrl,
        u.status,
        u.evidenceSource,
      ]);
    });

    // DNS Records
    activeCase.domainResult?.dnsRecords.forEach((d) => {
      rows.push([
        activeCase.id,
        activeCase.target,
        activeCase.targetType,
        'DNS Record',
        d.type,
        d.value,
        'PUBLIC_VERIFIED',
        'Cloudflare / Google DoH Query',
      ]);
    });

    // Contacts
    activeCase.publicContacts?.forEach((c) => {
      rows.push([
        activeCase.id,
        activeCase.target,
        activeCase.targetType,
        'Contact Point',
        c.label,
        c.value,
        c.verificationStatus,
        c.source,
      ]);
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `contacttrace_${activeCase.target}_findings.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addLog(`[+] Exported ${rows.length - 1} findings as CSV.`);
  };

  // Export JSON
  const handleExportJson = () => {
    if (!activeCase) return;
    const jsonStr = JSON.stringify(activeCase, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contacttrace_case_${activeCase.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
    addLog(`[+] Case #${activeCase.id.slice(0, 8)} exported to JSON.`);
  };

  // Counts for Navigation Badges
  const counts = {
    usernames: activeCase?.usernameResults?.filter((u) => u.status === 'PUBLIC_VERIFIED').length || 0,
    dnsRecords: activeCase?.domainResult?.dnsRecords.length || 0,
    contacts: activeCase?.publicContacts?.length || 0,
    cases: cases.length,
  };

  const bookmarkedSet = new Set(activeCase?.bookmarkedFindings.map((f) => f.value) || []);

  // Relationship Graph Data
  const graphData = generateGraphData(
    activeCase?.target || searchTarget,
    activeCase?.usernameResults,
    activeCase?.domainResult,
    activeCase?.emailResult,
    activeCase?.publicContacts
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Application Header */}
      <Header
        currentCase={activeCase}
        onOpenReport={() => setShowReportModal(true)}
        onExportCsv={handleExportCsv}
        onExportJson={handleExportJson}
        isScanning={isScanning}
        activeScanType={activeScanType}
      />

      {/* Primary Navigation Tabs */}
      <Navigation activeTab={activeTab} onSelectTab={setActiveTab} counts={counts} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        {/* TAB 1: INVESTIGATION CONSOLE */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            {/* Search Hero Box */}
            <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-5">
              <div>
                <span className="text-xs uppercase font-mono px-2.5 py-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  Open-Source Intelligence Intake
                </span>
                <h2 className="text-xl md:text-2xl font-bold font-mono tracking-tight text-white mt-2">
                  Unified Target Investigation Console
                </h2>
                <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Enter an open target to correlate public online presence across username registries,
                  DNS records, RFC 9116 security declarations, and verified organizational directory contacts.
                </p>
              </div>

              {/* Omni Search Input */}
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTarget}
                    onChange={(e) => setSearchTarget(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleExecuteScan()}
                    placeholder="Enter target (e.g. eff.org, torvalds, or security@cloudflare.com)..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedTargetType}
                    onChange={(e) => setSelectedTargetType(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="auto">Auto-Detect</option>
                    <option value="domain">Domain / Host</option>
                    <option value="username">Username Handle</option>
                    <option value="email">Email Address</option>
                  </select>

                  <button
                    onClick={() => handleExecuteScan()}
                    disabled={isScanning}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold text-xs transition cursor-pointer shadow-md shadow-cyan-950/40"
                  >
                    {isScanning ? (
                      <>
                        <Activity className="w-4 h-4 animate-spin text-cyan-200" />
                        <span>Auditing...</span>
                      </>
                    ) : (
                      <>
                        <span>Execute Inquiry</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Module Toggles */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs font-mono">
                <span className="text-slate-500 uppercase text-[10px]">Active Modules:</span>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={enableUsernames}
                    onChange={(e) => setEnableUsernames(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <span>Username Engine (Sherlock/Maigret)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={enableDomain}
                    onChange={(e) => setEnableDomain(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <span>DNS & RDAP (theHarvester/DoH)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={enableEmail}
                    onChange={(e) => setEnableEmail(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <span>Email & Gravatar (Holehe)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={enableContacts}
                    onChange={(e) => setEnableContacts(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <span>security.txt POC Discovery</span>
                </label>
              </div>

              {/* 1-Click Demo Presets */}
              <div className="pt-2">
                <p className="text-[10px] font-mono uppercase text-slate-500 mb-2">
                  Preset Targets (1-Click Verification Probes):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {PRESET_TARGETS.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSearchTarget(preset.target);
                        setSelectedTargetType(preset.type);
                        handleExecuteScan(preset.target, preset.type);
                      }}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 text-left transition flex flex-col justify-between group cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-white group-hover:text-cyan-300 font-mono">
                            {preset.name}
                          </span>
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400 uppercase">
                            {preset.type}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-cyan-400 mt-0.5 truncate">{preset.target}</p>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-1">{preset.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Summary of Active Target */}
            {activeCase && (
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400 font-bold font-mono">
                      {activeCase.target.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                        {activeCase.target}
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                          ANALYZED
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 font-mono">
                        Target Class: {activeCase.targetType.toUpperCase()} &bull; Last Audit: {new Date(activeCase.updatedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab('graph')}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition"
                    >
                      Inspect Relationship Graph
                    </button>
                    <button
                      onClick={() => setShowReportModal(true)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-semibold transition"
                    >
                      View Full Dossier
                    </button>
                  </div>
                </div>

                {/* Quick Metric Tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div
                    onClick={() => setActiveTab('usernames')}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition"
                  >
                    <p className="text-slate-500 text-[10px] uppercase">Verified Accounts</p>
                    <p className="text-xl font-bold text-emerald-400 mt-0.5">{counts.usernames}</p>
                    <span className="text-[10px] text-slate-400">View Maigret profiles &rarr;</span>
                  </div>

                  <div
                    onClick={() => setActiveTab('domains')}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition"
                  >
                    <p className="text-slate-500 text-[10px] uppercase">DNS Records</p>
                    <p className="text-xl font-bold text-blue-400 mt-0.5">{counts.dnsRecords}</p>
                    <span className="text-[10px] text-slate-400">A, MX, TXT, RDAP &rarr;</span>
                  </div>

                  <div
                    onClick={() => setActiveTab('contacts')}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition"
                  >
                    <p className="text-slate-500 text-[10px] uppercase">Authorized Contacts</p>
                    <p className="text-xl font-bold text-cyan-400 mt-0.5">{counts.contacts}</p>
                    <span className="text-[10px] text-slate-400">security.txt POCs &rarr;</span>
                  </div>

                  <div
                    onClick={() => setActiveTab('cases')}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition"
                  >
                    <p className="text-slate-500 text-[10px] uppercase">Bookmarked Findings</p>
                    <p className="text-xl font-bold text-amber-400 mt-0.5">
                      {activeCase.bookmarkedFindings.length}
                    </p>
                    <span className="text-[10px] text-slate-400">Evidence locker &rarr;</span>
                  </div>
                </div>
              </div>
            )}

            {/* Live Terminal Log Stream */}
            <TerminalLog logs={terminalLogs} onClear={() => setTerminalLogs([])} />
          </div>
        )}

        {/* TAB 2: USERNAME DISCOVERY */}
        {activeTab === 'usernames' && (
          <UsernameScanView
            results={activeCase?.usernameResults || []}
            target={activeCase?.target || searchTarget}
            onBookmarkFinding={handleBookmarkFinding}
            bookmarkedValues={bookmarkedSet}
          />
        )}

        {/* TAB 3: DOMAIN & INFRASTRUCTURE */}
        {activeTab === 'domains' && (
          activeCase?.domainResult ? (
            <DomainScanView
              domainResult={activeCase.domainResult}
              onBookmarkFinding={handleBookmarkFinding}
              bookmarkedValues={bookmarkedSet}
            />
          ) : (
            <div className="text-center py-16 border border-dashed border-slate-800 rounded-xl bg-slate-950/40 space-y-3 font-mono">
              <Globe2 className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400">No domain intelligence active for current target.</p>
              <button
                onClick={() => {
                  setSearchTarget('eff.org');
                  handleExecuteScan('eff.org', 'domain');
                }}
                className="text-xs text-cyan-400 hover:underline"
              >
                Scan sample domain (eff.org)
              </button>
            </div>
          )
        )}

        {/* TAB 4: EMAIL INTELLIGENCE */}
        {activeTab === 'emails' && (
          activeCase?.emailResult ? (
            <EmailScanView
              emailResult={activeCase.emailResult}
              onBookmarkFinding={handleBookmarkFinding}
              bookmarkedValues={bookmarkedSet}
            />
          ) : (
            <div className="text-center py-16 border border-dashed border-slate-800 rounded-xl bg-slate-950/40 space-y-3 font-mono">
              <Mail className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400">No email intelligence active for current target.</p>
              <button
                onClick={() => {
                  setSearchTarget('security@cloudflare.com');
                  handleExecuteScan('security@cloudflare.com', 'email');
                }}
                className="text-xs text-cyan-400 hover:underline"
              >
                Scan sample email (security@cloudflare.com)
              </button>
            </div>
          )
        )}

        {/* TAB 5: VERIFIED CONTACTS */}
        {activeTab === 'contacts' && (
          <ContactsView
            contacts={activeCase?.publicContacts || []}
            onAddContact={handleAddContact}
          />
        )}

        {/* TAB 6: ENTITY RELATIONSHIP GRAPH */}
        {activeTab === 'graph' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold font-mono text-white">
                  Entity Correlation & Link Analysis
                </h3>
                <p className="text-xs text-slate-400">
                  Interactive topological network connecting target identities, domains, mail exchangers, IP addresses, and authorized contacts.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                {graphData.nodes.length} Nodes &bull; {graphData.edges.length} Edges
              </span>
            </div>

            <GraphView
              nodes={graphData.nodes}
              edges={graphData.edges}
              targetName={activeCase?.target || searchTarget}
            />
          </div>
        )}

        {/* TAB 7: CASES & EVIDENCE LOCKER */}
        {activeTab === 'cases' && (
          <CasesView
            cases={cases}
            activeCaseId={activeCase?.id || ''}
            onSelectCase={(c) => {
              setActiveCase(c);
              addLog(`[*] Switched active case to: ${c.title}`);
            }}
            onCreateCase={async (title, target, targetType) => {
              const newCase: InvestigationCase = {
                id: `case-${Date.now()}`,
                title,
                target,
                targetType,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                analyst: 'Lead OSINT Investigator',
                notes: '',
                tags: [targetType],
                bookmarkedFindings: [],
              };
              setCases((prev) => [newCase, ...prev]);
              setActiveCase(newCase);
              await saveCaseApi(newCase);
              addLog(`[+] Created new investigation case: ${title}`);
            }}
            onDeleteCase={async (id) => {
              await deleteCaseApi(id);
              setCases((prev) => prev.filter((c) => c.id !== id));
              if (activeCase?.id === id) {
                setActiveCase(cases.find((c) => c.id !== id) || null);
              }
              addLog(`[-] Deleted case #${id.slice(0, 8)}`);
            }}
            onUpdateCaseNotes={async (id, notes) => {
              if (activeCase && activeCase.id === id) {
                const updated = { ...activeCase, notes, updatedAt: new Date().toISOString() };
                setActiveCase(updated);
                setCases((prev) => prev.map((c) => (c.id === id ? updated : c)));
                await saveCaseApi(updated);
                addLog(`[+] Analyst notes updated for case #${id.slice(0, 8)}`);
              }
            }}
            onRemoveBookmark={async (caseId, findingId) => {
              if (activeCase && activeCase.id === caseId) {
                const updatedBookmarks = activeCase.bookmarkedFindings.filter((f) => f.id !== findingId);
                const updated = { ...activeCase, bookmarkedFindings: updatedBookmarks, updatedAt: new Date().toISOString() };
                setActiveCase(updated);
                setCases((prev) => prev.map((c) => (c.id === caseId ? updated : c)));
                await saveCaseApi(updated);
                addLog(`[-] Removed bookmark item #${findingId.slice(0, 6)}`);
              }
            }}
          />
        )}

        {/* TAB 8: ETHICS & LEGAL COMPLIANCE */}
        {activeTab === 'compliance' && <ComplianceView />}
      </main>

      {/* Printable Report Modal */}
      {showReportModal && activeCase && (
        <ReportModal currentCase={activeCase} onClose={() => setShowReportModal(false)} />
      )}
    </div>
  );
}
