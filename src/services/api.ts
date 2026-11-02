import type {
  DomainResult,
  EmailResult,
  GraphEdge,
  GraphNode,
  InvestigationCase,
  PublicContact,
  UsernameResult,
} from '../types/osint';

export const API_BASE = '';

export async function checkUsernameApi(
  username: string,
  categoryFilter?: string
): Promise<{
  username: string;
  scannedCount: number;
  verifiedCount: number;
  results: UsernameResult[];
}> {
  const res = await fetch(`${API_BASE}/api/osint/username`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, categoryFilter }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Scan failed' }));
    throw new Error(err.error || 'Failed to scan username');
  }
  return res.json();
}

export async function checkDomainApi(domain: string): Promise<{
  domainResult: DomainResult;
  extractedContacts: PublicContact[];
}> {
  const res = await fetch(`${API_BASE}/api/osint/domain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Domain scan failed' }));
    throw new Error(err.error || 'Failed to scan domain');
  }
  return res.json();
}

export async function checkEmailApi(email: string): Promise<{
  emailResult: EmailResult;
}> {
  const res = await fetch(`${API_BASE}/api/osint/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Email scan failed' }));
    throw new Error(err.error || 'Failed to scan email');
  }
  return res.json();
}

export async function fetchSavedCases(): Promise<InvestigationCase[]> {
  try {
    const res = await fetch(`${API_BASE}/api/cases`);
    if (res.ok) {
      const data = await res.json();
      return data.cases || [];
    }
  } catch (err) {
    console.warn('Could not fetch saved cases from backend, checking localStorage:', err);
  }
  const local = localStorage.getItem('contacttrace_cases');
  return local ? JSON.parse(local) : [];
}

export async function saveCaseApi(investigationCase: InvestigationCase): Promise<void> {
  // Sync to local storage immediately
  try {
    const local = localStorage.getItem('contacttrace_cases');
    const cases: InvestigationCase[] = local ? JSON.parse(local) : [];
    const idx = cases.findIndex((c) => c.id === investigationCase.id);
    if (idx >= 0) cases[idx] = investigationCase;
    else cases.unshift(investigationCase);
    localStorage.setItem('contacttrace_cases', JSON.stringify(cases));
  } catch {}

  // Save to backend
  try {
    await fetch(`${API_BASE}/api/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(investigationCase),
    });
  } catch (err) {
    console.warn('Backend case save failed:', err);
  }
}

export async function deleteCaseApi(caseId: string): Promise<void> {
  try {
    const local = localStorage.getItem('contacttrace_cases');
    if (local) {
      const cases: InvestigationCase[] = JSON.parse(local);
      localStorage.setItem('contacttrace_cases', JSON.stringify(cases.filter((c) => c.id !== caseId)));
    }
  } catch {}

  try {
    await fetch(`${API_BASE}/api/cases/${caseId}`, { method: 'DELETE' });
  } catch {}
}

// OSINT Relationship Graph Generator
export function generateGraphData(
  target: string,
  usernames?: UsernameResult[],
  domain?: DomainResult,
  email?: EmailResult,
  contacts?: PublicContact[]
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeMap = new Set<string>();

  function addNode(node: GraphNode) {
    if (!nodeMap.has(node.id)) {
      nodeMap.add(node.id);
      nodes.push(node);
    }
  }

  // Target root node
  const targetId = `target-${target}`;
  addNode({
    id: targetId,
    label: target,
    type: 'target',
    status: 'OWNER_AUTHORIZED',
  });

  // Usernames
  if (usernames) {
    usernames
      .filter((u) => u.status === 'PUBLIC_VERIFIED')
      .forEach((u) => {
        const uId = `plat-${u.platformId}`;
        addNode({
          id: uId,
          label: `${u.platformName} (@${u.metadata?.claimedName || target})`,
          type: 'username',
          status: u.status,
          details: { ...u.metadata, url: u.profileUrl },
        });
        edges.push({
          id: `edge-${targetId}-${uId}`,
          source: targetId,
          target: uId,
          label: 'claimed_account',
          relationshipType: 'registered_on',
        });
      });
  }

  // Domain & DNS
  if (domain) {
    const domId = `dom-${domain.domain}`;
    addNode({
      id: domId,
      label: domain.domain,
      type: 'domain',
      status: 'PUBLIC_VERIFIED',
      details: { registrar: domain.rdap.registrar },
    });
    edges.push({
      id: `edge-${targetId}-${domId}`,
      source: targetId,
      target: domId,
      label: 'associated_domain',
      relationshipType: 'owns',
    });

    // IP addresses
    domain.ipAddresses.slice(0, 3).forEach((ip, idx) => {
      const ipId = `ip-${ip}`;
      addNode({
        id: ipId,
        label: ip,
        type: 'ip',
        status: 'PUBLIC_VERIFIED',
      });
      edges.push({
        id: `edge-${domId}-${ipId}`,
        source: domId,
        target: ipId,
        label: 'A/AAAA record',
        relationshipType: 'resolves_to',
      });
    });

    // Name servers
    domain.nameServers.slice(0, 2).forEach((ns) => {
      const nsId = `ns-${ns}`;
      addNode({
        id: nsId,
        label: ns,
        type: 'nameserver',
        status: 'PUBLIC_VERIFIED',
      });
      edges.push({
        id: `edge-${domId}-${nsId}`,
        source: domId,
        target: nsId,
        label: 'authoritative_ns',
        relationshipType: 'nameserver_for',
      });
    });

    // Mail servers
    domain.mailServers.slice(0, 2).forEach((mx) => {
      const mxId = `mx-${mx}`;
      addNode({
        id: mxId,
        label: mx,
        type: 'nameserver',
        status: 'PUBLIC_VERIFIED',
      });
      edges.push({
        id: `edge-${domId}-${mxId}`,
        source: domId,
        target: mxId,
        label: 'mail_exchanger',
        relationshipType: 'mail_handled_by',
      });
    });
  }

  // Email
  if (email) {
    const emailId = `em-${email.email}`;
    addNode({
      id: emailId,
      label: email.email,
      type: 'email',
      status: email.hasMxRecords ? 'PUBLIC_VERIFIED' : 'UNVERIFIED_MATCH',
      details: { disposable: email.isDisposable, role: email.isRoleBased },
    });
    edges.push({
      id: `edge-${targetId}-${emailId}`,
      source: targetId,
      target: emailId,
      label: 'email_footprint',
      relationshipType: 'linked_to',
    });

    if (email.gravatar.exists) {
      const gravId = `grav-${email.gravatar.hash}`;
      addNode({
        id: gravId,
        label: `Gravatar (${email.gravatar.displayName || 'Profile'})`,
        type: 'platform',
        status: 'PUBLIC_VERIFIED',
      });
      edges.push({
        id: `edge-${emailId}-${gravId}`,
        source: emailId,
        target: gravId,
        label: 'gravatar_avatar',
        relationshipType: 'registered_on',
      });
    }
  }

  // Public contacts
  if (contacts) {
    contacts.forEach((contact) => {
      const cId = `cont-${contact.id}`;
      addNode({
        id: cId,
        label: `${contact.label}: ${contact.value}`,
        type: 'contact',
        status: contact.verificationStatus,
        details: { source: contact.source, url: contact.sourceUrl },
      });
      edges.push({
        id: `edge-${targetId}-${cId}`,
        source: targetId,
        target: cId,
        label: contact.authorizationType,
        relationshipType: 'contact_for',
      });
    });
  }

  return { nodes, edges };
}

// Preset Targets for instant testing
export const PRESET_TARGETS = [
  {
    name: 'Linus Torvalds',
    target: 'torvalds',
    type: 'username' as const,
    description: 'Linux kernel architect (Public GitHub, social handles, public key footprint)',
  },
  {
    name: 'Electronic Frontier Foundation',
    target: 'eff.org',
    type: 'domain' as const,
    description: 'Exemplary public DNS, SPF/DMARC records, RFC 9116 security.txt, and RDAP registration',
  },
  {
    name: 'Security Point of Contact',
    target: 'security@cloudflare.com',
    type: 'email' as const,
    description: 'Corporate security disclosure mailbox, MX validation, and enterprise DNS mapping',
  },
  {
    name: 'Troy Hunt (HIBP)',
    target: 'troyhunt',
    type: 'username' as const,
    description: 'Cybersecurity author with rich public accounts across Dev.to, GitHub, Twitter, etc.',
  },
];
