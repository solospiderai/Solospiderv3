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
    <div className="space-y-6 text-slate-900">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Discovered Contacts & Verification</h1>
          <p className="text-xs text-slate-500">
            Contacts extracted from prospect websites with email verification status.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
            <tr>
              <th className="p-3.5">Name & Role</th>
              <th className="p-3.5">Domain</th>
              <th className="p-3.5">Email Address</th>
              <th className="p-3.5">Verification</th>
              <th className="p-3.5">Social Profiles</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contacts.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/80 transition">
                <td className="p-3.5 font-bold text-slate-900">
                  <div>{c.name}</div>
                  <span className="text-[10px] text-slate-500 font-normal">{c.role}</span>
                </td>
                <td className="p-3.5 font-medium text-slate-700">{c.domain}</td>
                <td className="p-3.5 font-mono">
                  {c.email ? (
                    <span className="text-blue-600 font-semibold">{c.email}</span>
                  ) : (
                    <span className="text-slate-400 text-[10px]">No verified contact found</span>
                  )}
                </td>
                <td className="p-3.5">
                  {c.is_verified ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-medium border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full text-[10px] font-medium border border-amber-200">
                      <AlertCircle className="w-3 h-3 text-amber-600" /> Unverified
                    </span>
                  )}
                </td>
                <td className="p-3.5 flex gap-2">
                  {c.linkedin && (
                    <a href={c.linkedin} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600">
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  {c.twitter && (
                    <a href={`https://twitter.com/${c.twitter}`} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600">
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
