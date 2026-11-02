export type VerificationStatus =
  | 'PUBLIC_VERIFIED'
  | 'OWNER_AUTHORIZED'
  | 'UNVERIFIED_MATCH'
  | 'RATE_LIMITED'
  | 'NOT_FOUND';

export type TargetType = 'auto' | 'username' | 'domain' | 'email';

export interface UsernameResult {
  platformId: string;
  platformName: string;
  category: 'developer' | 'social' | 'community' | 'media' | 'professional' | 'gaming' | 'other';
  profileUrl: string;
  exists: boolean;
  status: VerificationStatus;
  httpStatus?: number;
  latencyMs?: number;
  metadata?: {
    claimedName?: string;
    bio?: string;
    avatarUrl?: string;
    extra?: Record<string, string>;
  };
  evidenceSource: string;
  checkedAt: string;
}

export interface DnsRecord {
  type: 'A' | 'AAAA' | 'MX' | 'TXT' | 'NS' | 'SOA' | 'CAA';
  value: string;
  priority?: number;
  ttl?: number;
}

export interface RdapInfo {
  domain: string;
  registrar?: string;
  createdDate?: string;
  updatedDate?: string;
  expiresDate?: string;
  status?: string[];
  nameservers?: string[];
  abuseContact?: string;
  rdapSource?: string;
}

export interface SecurityTxtInfo {
  found: boolean;
  url?: string;
  contacts?: string[];
  encryption?: string[];
  acknowledgments?: string[];
  policy?: string;
  hiring?: string[];
  raw?: string;
}

export interface SubdomainResult {
  subdomain: string;
  source: 'cert_transparency' | 'dns_probe';
  ip?: string;
  status: 'active' | 'unresolved';
}

export interface DomainResult {
  domain: string;
  dnsRecords: DnsRecord[];
  rdap: RdapInfo;
  securityTxt: SecurityTxtInfo;
  subdomains: SubdomainResult[];
  ipAddresses: string[];
  mailServers: string[];
  nameServers: string[];
  spfRecord?: string;
  dmarcRecord?: string;
  checkedAt: string;
}

export interface EmailResult {
  email: string;
  syntaxValid: boolean;
  domain: string;
  isDisposable: boolean;
  isRoleBased: boolean;
  hasMxRecords: boolean;
  mxRecords: string[];
  gravatar: {
    exists: boolean;
    hash?: string;
    avatarUrl?: string;
    profileUrl?: string;
    displayName?: string;
  };
  potentialServiceExposure: {
    serviceName: string;
    category: string;
    indicator: 'publicly_listed' | 'gravatar_linked' | 'mx_provider' | 'not_indicated';
    confidence: number;
    details: string;
  }[];
  checkedAt: string;
}

export interface PublicContact {
  id: string;
  type: 'email' | 'phone' | 'social' | 'pgp' | 'physical';
  value: string;
  label: string;
  source: string;
  sourceUrl?: string;
  verificationStatus: VerificationStatus;
  authorizationType: 'OWNER_AUTHORIZED_SECURITY_TXT' | 'PUBLIC_WHOIS_ABUSE' | 'PUBLIC_WEBSITE_LISTING' | 'USER_SUBMITTED';
  discoveredAt: string;
  notes?: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'target' | 'username' | 'domain' | 'email' | 'ip' | 'nameserver' | 'contact' | 'platform';
  status?: VerificationStatus;
  details?: Record<string, any>;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  relationshipType: 'owns' | 'resolves_to' | 'registered_on' | 'mail_handled_by' | 'nameserver_for' | 'linked_to' | 'contact_for';
}

export interface InvestigationCase {
  id: string;
  title: string;
  target: string;
  targetType: TargetType;
  createdAt: string;
  updatedAt: string;
  analyst: string;
  notes: string;
  tags: string[];
  bookmarkedFindings: {
    id: string;
    category: 'username' | 'domain' | 'email' | 'contact' | 'dns';
    summary: string;
    value: string;
    status: VerificationStatus;
    notes?: string;
  }[];
  usernameResults?: UsernameResult[];
  domainResult?: DomainResult;
  emailResult?: EmailResult;
  publicContacts?: PublicContact[];
  terminalLogs?: string[];
}
