'use client';

import React, { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, Linkedin, Twitter, ExternalLink, RefreshCw } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  role: string;
  email: string | null;
  domain: string;
  linkedin: string | null;
  twitter: string | null;
  is_verified: boolean;
}

const mockContacts: Contact[] = [
  {
    id: 'c1',
    name: 'Sarah Jenkins',
    role: 'Senior Editor',
    email: 'sarah@aisoftwareinsider.com',
    domain: 'aisoftwareinsider.com',
    linkedin: 'https://linkedin.com/in/sarah-jenkins-seo',
    twitter: '@sarahj_seo',
    is_verified: true,
  },
  {
    id: 'c2',
    name: 'Alex Rivera',
    role: 'Founder & Managing Editor',
    email: 'alex@searchenginetactics.io',
    domain: 'searchenginetactics.io',
    linkedin: 'https://linkedin.com/in/alexriveraseo',
    twitter: '@arivera_mktg',
    is_verified: true,
  },
  {
    id: 'c3',
    name: 'Editorial Team',
    role: 'Content Team',
    email: null,
    domain: 'growthstacktools.net',
    linkedin: null,
    twitter: null,
    is_verified: false,
  },
];

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-white">Discovered Contacts & Verification</h1>
          <p className="text-xs text-slate-400">
            Contacts extracted from prospect websites with email verification status.
          </p>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-3">Name & Role</th>
              <th className="p-3">Domain</th>
              <th className="p-3">Email Address</th>
              <th className="p-3">Verification</th>
              <th className="p-3">Social Profiles</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {contacts.map((c) => (
              <tr key={c.id} className="hover:bg-slate-800/40 transition">
                <td className="p-3 font-semibold text-white">
                  <div>{c.name}</div>
                  <span className="text-[10px] text-slate-400 font-normal">{c.role}</span>
                </td>
                <td className="p-3 font-medium text-slate-300">{c.domain}</td>
                <td className="p-3 font-mono">
                  {c.email ? (
                    <span className="text-blue-400">{c.email}</span>
                  ) : (
                    <span className="text-slate-500 text-[10px]">No verified contact found</span>
                  )}
                </td>
                <td className="p-3">
                  {c.is_verified ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[10px] border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full text-[10px] border border-amber-500/20">
                      <AlertCircle className="w-3 h-3" /> Unverified
                    </span>
                  )}
                </td>
                <td className="p-3 flex gap-2">
                  {c.linkedin && (
                    <a href={c.linkedin} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-400">
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  {c.twitter && (
                    <a href={`https://twitter.com/${c.twitter}`} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-400">
                      <Twitter className="w-4 h-4" />
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
