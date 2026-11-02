import React, { useState } from 'react';
import {
  Contact,
  ShieldCheck,
  KeyRound,
  Mail,
  Phone,
  Globe2,
  Copy,
  Check,
  Plus,
  ExternalLink,
  Lock,
  FileCheck,
} from 'lucide-react';
import type { PublicContact, VerificationStatus } from '../types/osint';

interface ContactsViewProps {
  contacts: PublicContact[];
  onAddContact: (contact: PublicContact) => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({ contacts, onAddContact }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Contact Form State
  const [newType, setNewType] = useState<PublicContact['type']>('email');
  const [newValue, setNewValue] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newSource, setNewSource] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newAuthType, setNewAuthType] = useState<PublicContact['authorizationType']>('PUBLIC_WEBSITE_LISTING');
  const [newNotes, setNewNotes] = useState('');

  const copyContact = (val: string, id: string) => {
    navigator.clipboard.writeText(val);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim() || !newLabel.trim()) return;

    const contact: PublicContact = {
      id: `manual-${Date.now()}`,
      type: newType,
      value: newValue.trim(),
      label: newLabel.trim(),
      source: newSource.trim() || 'Analyst Submitted / Public Record',
      sourceUrl: newSourceUrl.trim() || undefined,
      verificationStatus: 'OWNER_AUTHORIZED',
      authorizationType: newAuthType,
      discoveredAt: new Date().toISOString(),
      notes: newNotes.trim() || undefined,
    };

    onAddContact(contact);
    setShowAddModal(false);
    setNewValue('');
    setNewLabel('');
    setNewSource('');
    setNewSourceUrl('');
    setNewNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header and Compliance banner */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white font-mono">
              Unmasked Verified Contacts & Authorized Directory
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            All contacts below are verified through open standards (RFC 9116 security.txt, public ICANN RDAP/NOC abuse channels,
            or verified public organizational listings). Unconfirmed guesses and private data broker payloads are strictly excluded.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition self-start md:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Add Verified Point of Contact</span>
        </button>
      </div>

      {/* Contacts List */}
      {contacts.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-800 rounded-xl bg-slate-950/40 space-y-3">
          <Contact className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-mono text-slate-400">
            No authorized contacts detected yet for active target.
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Scan a domain with a published <span className="text-cyan-400 font-mono">security.txt</span> or active RDAP record,
            or submit verified public organization contacts above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between hover:border-cyan-500/40 transition shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400">
                      {contact.type === 'email' ? (
                        <Mail className="w-4 h-4" />
                      ) : contact.type === 'phone' ? (
                        <Phone className="w-4 h-4" />
                      ) : contact.type === 'pgp' ? (
                        <KeyRound className="w-4 h-4" />
                      ) : (
                        <Globe2 className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-300 font-mono">{contact.label}</h4>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {contact.type}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                      contact.authorizationType === 'OWNER_AUTHORIZED_SECURITY_TXT'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : contact.authorizationType === 'PUBLIC_WHOIS_ABUSE'
                        ? 'bg-blue-950 text-blue-300 border-blue-800'
                        : 'bg-cyan-950 text-cyan-300 border-cyan-800'
                    }`}
                  >
                    {contact.authorizationType}
                  </span>
                </div>

                {/* Contact Value Display (Unmasked) */}
                <div className="mt-3 p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-bold text-white select-all break-all">
                    {contact.value}
                  </span>
                  <button
                    onClick={() => copyContact(contact.value, contact.id)}
                    className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 shrink-0 transition"
                    title="Copy to clipboard"
                  >
                    {copiedId === contact.id ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {contact.notes && (
                  <p className="mt-2 text-[11px] text-slate-400 font-mono italic">
                    Note: {contact.notes}
                  </p>
                )}
              </div>

              {/* Provenance footer */}
              <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span className="truncate max-w-[200px]">Source: {contact.source}</span>
                {contact.sourceUrl && (
                  <a
                    href={contact.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 shrink-0"
                  >
                    <span>Inspect</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2 mb-4">
              <FileCheck className="w-4 h-4 text-cyan-400" /> Add Verified Public Contact
            </h3>
            <form onSubmit={handleCreateContact} className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-slate-400 uppercase text-[10px] block mb-1">
                  Contact Type
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                >
                  <option value="email">Email Address</option>
                  <option value="phone">Public Business Phone (Authorized only)</option>
                  <option value="social">Social Profile / Direct Handle</option>
                  <option value="pgp">PGP Key ID / Link</option>
                  <option value="physical">Public Corporate Address</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 uppercase text-[10px] block mb-1">
                  Contact Value / Data
                </label>
                <input
                  type="text"
                  placeholder="e.g. security-team@example.org or +1-800-555-0199"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 uppercase text-[10px] block mb-1">
                  Contact Label / Role
                </label>
                <input
                  type="text"
                  placeholder="e.g. Incident Response Officer or Public Support Line"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 uppercase text-[10px] block mb-1">
                  Authorization Category
                </label>
                <select
                  value={newAuthType}
                  onChange={(e) => setNewAuthType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                >
                  <option value="PUBLIC_WEBSITE_LISTING">Public Website Corporate Directory</option>
                  <option value="OWNER_AUTHORIZED_SECURITY_TXT">Owner Authorized RFC security.txt</option>
                  <option value="PUBLIC_WHOIS_ABUSE">Public RDAP / WHOIS Abuse Authority</option>
                  <option value="USER_SUBMITTED">Subject / Owner Voluntarily Submitted</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 uppercase text-[10px] block mb-1">
                  Source Provenance (Citation URL or Document)
                </label>
                <input
                  type="text"
                  placeholder="e.g. https://company.com/about/contact or Official SEC 10-K filing"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 uppercase text-[10px] block mb-1">
                  Analyst Verification Notes
                </label>
                <textarea
                  placeholder="Describe confirmation steps taken..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                >
                  Save to Verified Directory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
