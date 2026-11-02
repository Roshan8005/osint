import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import fs from 'fs/promises';
import { PLATFORMS_DATABASE, DISPOSABLE_EMAIL_DOMAINS, ROLE_BASED_PREFIXES } from './src/data/platforms.ts';
import type {
  DnsRecord,
  DomainResult,
  EmailResult,
  PublicContact,
  RdapInfo,
  SecurityTxtInfo,
  SubdomainResult,
  UsernameResult,
  InvestigationCase,
} from './src/types/osint.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CASES_FILE = path.resolve(__dirname, '.cases_storage.json');

// In-memory fallback if file system write fails
let inMemoryCases: InvestigationCase[] = [];

async function loadCases(): Promise<InvestigationCase[]> {
  try {
    const data = await fs.readFile(CASES_FILE, 'utf-8');
    inMemoryCases = JSON.parse(data);
    return inMemoryCases;
  } catch {
    return inMemoryCases;
  }
}

async function saveCases(cases: InvestigationCase[]) {
  inMemoryCases = cases;
  try {
    await fs.writeFile(CASES_FILE, JSON.stringify(cases, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not persist cases to file, keeping in-memory:', err);
  }
}

// User-Agent for ethical OSINT research
const OSINT_USER_AGENT = 'ContactTrace-OSINT-Suite/3.0 (+https://github.com/contacttrace/contacttrace; ethical-research-probe)';

// DNS over HTTPS resolver helper (Cloudflare + Google fallback)
async function resolveDoh(domain: string, type: string): Promise<any[]> {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/dns-json' },
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) {
      const data = await res.json();
      return data.Answer || [];
    }
  } catch {
    // Try Google DoH fallback
    try {
      const gUrl = `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`;
      const gRes = await fetch(gUrl, { signal: AbortSignal.timeout(3500) });
      if (gRes.ok) {
        const gData = await gRes.json();
        return gData.Answer || [];
      }
    } catch {
      // silent fallback
    }
  }
  return [];
}

async function checkSinglePlatform(username: string, platform: typeof PLATFORMS_DATABASE[0]): Promise<UsernameResult> {
  const profileUrl = platform.profileUrlTemplate.replace(/\{username\}/g, encodeURIComponent(username));
  const checkUrl = platform.checkUrlTemplate.replace(/\{username\}/g, encodeURIComponent(username));
  const start = Date.now();

  try {
    const headers: Record<string, string> = {
      'User-Agent': OSINT_USER_AGENT,
      'Accept': 'application/json, text/html, */*',
    };

    const res = await fetch(checkUrl, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(4000),
    });

    const latencyMs = Date.now() - start;
    const httpStatus = res.status;

    if (httpStatus === 429) {
      return {
        platformId: platform.id,
        platformName: platform.name,
        category: platform.category,
        profileUrl,
        exists: false,
        status: 'RATE_LIMITED',
        httpStatus,
        latencyMs,
        evidenceSource: `HTTP status 429 rate limit returned from ${platform.name}`,
        checkedAt: new Date().toISOString(),
      };
    }

    if (platform.errorType === 'status_code') {
      if (httpStatus === 200) {
        let metadata: Record<string, any> = {};

        // Special metadata extractors for rich platforms
        if (platform.id === 'github') {
          try {
            const data = await res.json();
            metadata = {
              claimedName: data.name || data.login,
              bio: data.bio || '',
              avatarUrl: data.avatar_url,
              extra: {
                company: data.company || '',
                location: data.location || '',
                publicRepos: String(data.public_repos || 0),
                blog: data.blog || '',
              },
            };
          } catch {}
        } else if (platform.id === 'devto') {
          try {
            const data = await res.json();
            metadata = {
              claimedName: data.name || data.username,
              bio: data.summary || '',
              avatarUrl: data.profile_image,
            };
          } catch {}
        } else if (platform.id === 'huggingface') {
          try {
            const data = await res.json();
            metadata = {
              claimedName: data.fullname || username,
              bio: data.orgs?.length ? `Organizations: ${data.orgs.map((o: any) => o.name).join(', ')}` : '',
              avatarUrl: data.avatarUrl,
            };
          } catch {}
        }

        return {
          platformId: platform.id,
          platformName: platform.name,
          category: platform.category,
          profileUrl,
          exists: true,
          status: 'PUBLIC_VERIFIED',
          httpStatus,
          latencyMs,
          metadata,
          evidenceSource: `Verified public profile on ${platform.name} via HTTP 200`,
          checkedAt: new Date().toISOString(),
        };
      }

      return {
        platformId: platform.id,
        platformName: platform.name,
        category: platform.category,
        profileUrl,
        exists: false,
        status: 'NOT_FOUND',
        httpStatus,
        latencyMs,
        evidenceSource: `HTTP ${httpStatus} returned by ${platform.name}`,
        checkedAt: new Date().toISOString(),
      };
    }

    if (platform.errorType === 'body_content') {
      const text = await res.text();
      const hasError = platform.errorMsg ? text.includes(platform.errorMsg) : false;

      if (httpStatus === 200 && !hasError) {
        return {
          platformId: platform.id,
          platformName: platform.name,
          category: platform.category,
          profileUrl,
          exists: true,
          status: 'PUBLIC_VERIFIED',
          httpStatus,
          latencyMs,
          evidenceSource: `Verified public profile presence string on ${platform.name}`,
          checkedAt: new Date().toISOString(),
        };
      }

      return {
        platformId: platform.id,
        platformName: platform.name,
        category: platform.category,
        profileUrl,
        exists: false,
        status: 'NOT_FOUND',
        httpStatus,
        latencyMs,
        evidenceSource: `Negative match signature found on ${platform.name}`,
        checkedAt: new Date().toISOString(),
      };
    }

    return {
      platformId: platform.id,
      platformName: platform.name,
      category: platform.category,
      profileUrl,
      exists: false,
      status: 'NOT_FOUND',
      httpStatus,
      latencyMs,
      evidenceSource: `Target not located on ${platform.name}`,
      checkedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      platformId: platform.id,
      platformName: platform.name,
      category: platform.category,
      profileUrl,
      exists: false,
      status: 'RATE_LIMITED',
      latencyMs: Date.now() - start,
      evidenceSource: `Connection timeout or network policy restriction (${err?.name || 'Error'})`,
      checkedAt: new Date().toISOString(),
    };
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initialize cases storage
  await loadCases();

  // API Health
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'online',
      version: '3.0.0',
      service: 'ContactTrace OSINT Suite',
      platformCount: PLATFORMS_DATABASE.length,
      mode: 'self-hosted-open-source',
    });
  });

  // POST /api/osint/username: Sherlock & Maigret style parallel engine
  app.post('/api/osint/username', async (req, res) => {
    try {
      const { username, categoryFilter } = req.body;
      if (!username || typeof username !== 'string') {
        res.status(400).json({ error: 'Username is required' });
        return;
      }

      const cleanUsername = username.trim().replace(/^@/, '');
      if (cleanUsername.length < 2) {
        res.status(400).json({ error: 'Username too short' });
        return;
      }

      let targets = PLATFORMS_DATABASE;
      if (categoryFilter && categoryFilter !== 'all') {
        targets = targets.filter((p) => p.category === categoryFilter);
      }

      // Concurrency chunking
      const CHUNK_SIZE = 6;
      const results: UsernameResult[] = [];

      for (let i = 0; i < targets.length; i += CHUNK_SIZE) {
        const chunk = targets.slice(i, i + CHUNK_SIZE);
        const chunkResults = await Promise.all(
          chunk.map((platform) => checkSinglePlatform(cleanUsername, platform))
        );
        results.push(...chunkResults);
      }

      res.json({
        username: cleanUsername,
        scannedCount: results.length,
        verifiedCount: results.filter((r) => r.status === 'PUBLIC_VERIFIED').length,
        results,
        executedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Username scan error:', err);
      res.status(500).json({ error: err.message || 'Username scan failed' });
    }
  });

  // POST /api/osint/domain: DNS DoH, RDAP, security.txt, subdomains
  app.post('/api/osint/domain', async (req, res) => {
    try {
      let { domain } = req.body;
      if (!domain || typeof domain !== 'string') {
        res.status(400).json({ error: 'Domain is required' });
        return;
      }

      // Clean domain
      domain = domain
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/\/.*$/, '')
        .replace(/:\d+$/, '');

      if (!domain.includes('.')) {
        res.status(400).json({ error: 'Invalid domain format' });
        return;
      }

      // Parallel DoH lookups
      const [aRecords, aaaaRecords, mxRecords, txtRecords, nsRecords, soaRecords, dmarcRecords] =
        await Promise.all([
          resolveDoh(domain, 'A'),
          resolveDoh(domain, 'AAAA'),
          resolveDoh(domain, 'MX'),
          resolveDoh(domain, 'TXT'),
          resolveDoh(domain, 'NS'),
          resolveDoh(domain, 'SOA'),
          resolveDoh(`_dmarc.${domain}`, 'TXT'),
        ]);

      const dnsRecords: DnsRecord[] = [];
      const ipAddresses: string[] = [];
      const mailServers: string[] = [];
      const nameServers: string[] = [];
      let spfRecord: string | undefined;
      let dmarcRecord: string | undefined;

      aRecords.forEach((r: any) => {
        if (r.data) {
          dnsRecords.push({ type: 'A', value: r.data, ttl: r.TTL });
          ipAddresses.push(r.data);
        }
      });

      aaaaRecords.forEach((r: any) => {
        if (r.data) {
          dnsRecords.push({ type: 'AAAA', value: r.data, ttl: r.TTL });
          ipAddresses.push(r.data);
        }
      });

      mxRecords.forEach((r: any) => {
        if (r.data) {
          const parts = r.data.split(' ');
          const priority = parts.length > 1 ? parseInt(parts[0], 10) : 10;
          const host = parts.length > 1 ? parts[1].replace(/\.$/, '') : parts[0].replace(/\.$/, '');
          dnsRecords.push({ type: 'MX', value: host, priority, ttl: r.TTL });
          mailServers.push(host);
        }
      });

      txtRecords.forEach((r: any) => {
        if (r.data) {
          const val = r.data.replace(/^"|"$/g, '');
          dnsRecords.push({ type: 'TXT', value: val, ttl: r.TTL });
          if (val.startsWith('v=spf1')) {
            spfRecord = val;
          }
        }
      });

      nsRecords.forEach((r: any) => {
        if (r.data) {
          const nsHost = r.data.replace(/\.$/, '');
          dnsRecords.push({ type: 'NS', value: nsHost, ttl: r.TTL });
          nameServers.push(nsHost);
        }
      });

      soaRecords.forEach((r: any) => {
        if (r.data) {
          dnsRecords.push({ type: 'SOA', value: r.data, ttl: r.TTL });
        }
      });

      dmarcRecords.forEach((r: any) => {
        if (r.data && r.data.includes('v=DMARC1')) {
          dmarcRecord = r.data.replace(/^"|"$/g, '');
        }
      });

      // Security.txt check
      let securityTxt: SecurityTxtInfo = { found: false };
      try {
        const secUrls = [
          `https://${domain}/.well-known/security.txt`,
          `https://${domain}/security.txt`,
        ];
        for (const sUrl of secUrls) {
          try {
            const secRes = await fetch(sUrl, {
              headers: { 'User-Agent': OSINT_USER_AGENT },
              signal: AbortSignal.timeout(3000),
            });
            if (secRes.ok) {
              const text = await secRes.text();
              if (text.includes('Contact:')) {
                const contacts: string[] = [];
                const encryption: string[] = [];
                const hiring: string[] = [];
                const lines = text.split('\n');
                for (const line of lines) {
                  const trimmed = line.trim();
                  if (trimmed.startsWith('Contact:')) {
                    contacts.push(trimmed.replace(/^Contact:\s*/i, ''));
                  } else if (trimmed.startsWith('Encryption:')) {
                    encryption.push(trimmed.replace(/^Encryption:\s*/i, ''));
                  } else if (trimmed.startsWith('Hiring:')) {
                    hiring.push(trimmed.replace(/^Hiring:\s*/i, ''));
                  }
                }
                securityTxt = {
                  found: true,
                  url: sUrl,
                  contacts,
                  encryption,
                  hiring,
                  raw: text.slice(0, 2000),
                };
                break;
              }
            }
          } catch {}
        }
      } catch {}

      // RDAP query via rdap.org
      let rdap: RdapInfo = { domain };
      try {
        const rdapRes = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
          headers: { Accept: 'application/rdap+json, application/json' },
          signal: AbortSignal.timeout(4000),
        });
        if (rdapRes.ok) {
          const rdapData = await rdapRes.json();
          let registrarName = '';
          let abuseContact = '';

          if (rdapData.entities) {
            for (const entity of rdapData.entities) {
              if (entity.roles && entity.roles.includes('registrar')) {
                registrarName = entity.vcardArray?.[1]?.find((f: any) => f[0] === 'fn')?.[3] || entity.handle || '';
              }
              if (entity.roles && entity.roles.includes('abuse')) {
                const emailField = entity.vcardArray?.[1]?.find((f: any) => f[0] === 'email');
                if (emailField) {
                  abuseContact = emailField[3];
                }
              }
            }
          }

          let createdDate = '';
          let updatedDate = '';
          let expiresDate = '';

          if (rdapData.events) {
            for (const ev of rdapData.events) {
              if (ev.eventAction === 'registration') createdDate = ev.eventDate;
              if (ev.eventAction === 'last changed') updatedDate = ev.eventDate;
              if (ev.eventAction === 'expiration') expiresDate = ev.eventDate;
            }
          }

          const rdapNs = rdapData.nameservers?.map((ns: any) => ns.ldhName || ns.handle) || [];

          rdap = {
            domain,
            registrar: registrarName || rdapData.port43 || 'Public Domain Registry',
            createdDate,
            updatedDate,
            expiresDate,
            status: rdapData.status || [],
            nameservers: rdapNs.length ? rdapNs : nameServers,
            abuseContact: abuseContact || undefined,
            rdapSource: 'Open RDAP Authority (rdap.org)',
          };
        }
      } catch {
        // Fallback default info from DNS
        rdap = {
          domain,
          registrar: 'DNS Resolution Confirmed',
          nameservers: nameServers,
          rdapSource: 'Live DNS Nameservers',
        };
      }

      // Curated active subdomain probes
      const commonSubs = ['www', 'mail', 'api', 'dev', 'app', 'vpn', 'portal', 'auth', 'admin', 'docs', 'staging', 'status'];
      const subdomains: SubdomainResult[] = [];

      await Promise.all(
        commonSubs.map(async (sub) => {
          const fqdn = `${sub}.${domain}`;
          try {
            const subAnswers = await resolveDoh(fqdn, 'A');
            if (subAnswers && subAnswers.length > 0) {
              subdomains.push({
                subdomain: fqdn,
                source: 'dns_probe',
                ip: subAnswers[0].data,
                status: 'active',
              });
            }
          } catch {}
        })
      );

      // Public contacts extraction (Abuse contact from RDAP + Security.txt)
      const extractedContacts: PublicContact[] = [];

      if (securityTxt.found && securityTxt.contacts) {
        securityTxt.contacts.forEach((contact, idx) => {
          const clean = contact.replace(/^mailto:/i, '');
          extractedContacts.push({
            id: `sec-${idx}-${Date.now()}`,
            type: clean.includes('@') ? 'email' : 'social',
            value: clean,
            label: 'Vulnerability Disclosure Point of Contact',
            source: 'Published security.txt RFC 9116',
            sourceUrl: securityTxt.url,
            verificationStatus: 'OWNER_AUTHORIZED',
            authorizationType: 'OWNER_AUTHORIZED_SECURITY_TXT',
            discoveredAt: new Date().toISOString(),
            notes: 'Authorized by site owner via security.txt specification',
          });
        });
      }

      if (rdap.abuseContact) {
        extractedContacts.push({
          id: `rdap-abuse-${Date.now()}`,
          type: 'email',
          value: rdap.abuseContact,
          label: 'Registrar Abuse / NOC Contact',
          source: 'Public RDAP Authority',
          verificationStatus: 'PUBLIC_VERIFIED',
          authorizationType: 'PUBLIC_WHOIS_ABUSE',
          discoveredAt: new Date().toISOString(),
          notes: 'Publicly registered point of contact for domain abuse and infrastructure',
        });
      }

      const domainResult: DomainResult = {
        domain,
        dnsRecords,
        rdap,
        securityTxt,
        subdomains,
        ipAddresses,
        mailServers,
        nameServers,
        spfRecord,
        dmarcRecord,
        checkedAt: new Date().toISOString(),
      };

      res.json({
        domainResult,
        extractedContacts,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Domain scan error:', err);
      res.status(500).json({ error: err.message || 'Domain scan failed' });
    }
  });

  // POST /api/osint/email: Holehe-style validation, MX, Gravatar, disposable check
  app.post('/api/osint/email', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== 'string') {
        res.status(400).json({ error: 'Email address is required' });
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const syntaxValid = emailRegex.test(cleanEmail);

      const parts = cleanEmail.split('@');
      const mailbox = parts[0] || '';
      const domain = parts[1] || '';

      const isDisposable = DISPOSABLE_EMAIL_DOMAINS.has(domain);
      const isRoleBased = ROLE_BASED_PREFIXES.has(mailbox);

      // Check MX records via DoH
      let hasMxRecords = false;
      const mxRecordsList: string[] = [];

      if (domain) {
        try {
          const answers = await resolveDoh(domain, 'MX');
          if (answers && answers.length > 0) {
            hasMxRecords = true;
            answers.forEach((ans: any) => {
              if (ans.data) {
                const parts = ans.data.split(' ');
                mxRecordsList.push(parts.length > 1 ? parts[1].replace(/\.$/, '') : parts[0].replace(/\.$/, ''));
              }
            });
          }
        } catch {}
      }

      // Gravatar check (MD5 of trimmed, lowercased email)
      const hash = crypto.createHash('md5').update(cleanEmail).digest('hex');
      let gravatar = {
        exists: false,
        hash,
        avatarUrl: `https://www.gravatar.com/avatar/${hash}?d=identicon`,
        profileUrl: `https://en.gravatar.com/${hash}`,
        displayName: '',
      };

      try {
        const gravRes = await fetch(`https://en.gravatar.com/${hash}.json`, {
          headers: { 'User-Agent': OSINT_USER_AGENT },
          signal: AbortSignal.timeout(3000),
        });
        if (gravRes.ok) {
          const gravData = await gravRes.json();
          const entry = gravData.entry?.[0];
          if (entry) {
            gravatar = {
              exists: true,
              hash,
              avatarUrl: entry.thumbnailUrl || gravatar.avatarUrl,
              profileUrl: entry.profileUrl || gravatar.profileUrl,
              displayName: entry.displayName || entry.name?.formatted || '',
            };
          }
        }
      } catch {}

      // Service Footprint Matrix
      const serviceFootprints: EmailResult['potentialServiceExposure'] = [];

      // Mail infrastructure identification
      const mxLower = mxRecordsList.join(' ').toLowerCase();
      if (mxLower.includes('google') || mxLower.includes('aspmx') || mxLower.includes('gmail')) {
        serviceFootprints.push({
          serviceName: 'Google Workspace / Gmail',
          category: 'Email Provider',
          indicator: 'mx_provider',
          confidence: 0.99,
          details: 'Domain routes mail through Google infrastructure (SPF/MX match)',
        });
      } else if (mxLower.includes('outlook') || mxLower.includes('microsoft')) {
        serviceFootprints.push({
          serviceName: 'Microsoft 365 / Exchange',
          category: 'Email Provider',
          indicator: 'mx_provider',
          confidence: 0.99,
          details: 'Domain routes mail through Microsoft 365 Exchange Online',
        });
      } else if (mxLower.includes('proton')) {
        serviceFootprints.push({
          serviceName: 'Proton Mail',
          category: 'Encrypted Mail',
          indicator: 'mx_provider',
          confidence: 0.99,
          details: 'Domain routes mail through Proton AG encrypted MX relays',
        });
      } else if (mxLower.includes('fastmail')) {
        serviceFootprints.push({
          serviceName: 'Fastmail',
          category: 'Email Provider',
          indicator: 'mx_provider',
          confidence: 0.99,
          details: 'Domain routes mail through Fastmail servers',
        });
      }

      if (gravatar.exists) {
        serviceFootprints.push({
          serviceName: 'Gravatar / Automattic',
          category: 'Public Identity',
          indicator: 'gravatar_linked',
          confidence: 0.95,
          details: `Public avatar and profile profile published: ${gravatar.displayName || 'Profile found'}`,
        });
        serviceFootprints.push({
          serviceName: 'WordPress.com Network',
          category: 'CMS & Blogs',
          indicator: 'gravatar_linked',
          confidence: 0.85,
          details: 'Automattic unified Gravatar account indicates WordPress ecosystem interaction',
        });
      }

      // Check GitHub public commit email footprint heuristic
      if (mailbox.length > 2) {
        serviceFootprints.push({
          serviceName: 'GitHub Public Commits',
          category: 'Developer',
          indicator: 'publicly_listed',
          confidence: 0.7,
          details: `Searchable in public commit histories for author '${mailbox}'`,
        });
      }

      const emailResult: EmailResult = {
        email: cleanEmail,
        syntaxValid,
        domain,
        isDisposable,
        isRoleBased,
        hasMxRecords,
        mxRecords: mxRecordsList,
        gravatar,
        potentialServiceExposure: serviceFootprints,
        checkedAt: new Date().toISOString(),
      };

      res.json({
        emailResult,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Email scan error:', err);
      res.status(500).json({ error: err.message || 'Email scan failed' });
    }
  });

  // Cases management API
  app.get('/api/cases', (req, res) => {
    res.json({ cases: inMemoryCases });
  });

  app.post('/api/cases', async (req, res) => {
    try {
      const newCase: InvestigationCase = req.body;
      if (!newCase.id || !newCase.title || !newCase.target) {
        res.status(400).json({ error: 'Invalid case payload: id, title, and target required' });
        return;
      }

      const existingIndex = inMemoryCases.findIndex((c) => c.id === newCase.id);
      if (existingIndex >= 0) {
        inMemoryCases[existingIndex] = { ...newCase, updatedAt: new Date().toISOString() };
      } else {
        inMemoryCases.unshift({
          ...newCase,
          createdAt: newCase.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      await saveCases(inMemoryCases);
      res.json({ success: true, case: newCase });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/cases/:id', async (req, res) => {
    try {
      const { id } = req.params;
      inMemoryCases = inMemoryCases.filter((c) => c.id !== id);
      await saveCases(inMemoryCases);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[ContactTrace OSINT Suite] Server active on port ${PORT}`);
  });
}

startServer();
