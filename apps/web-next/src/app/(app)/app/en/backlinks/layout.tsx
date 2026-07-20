'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Search,
  Users,
  Send,
  Inbox,
  Link as LinkIcon,
  Swords,
  BarChart2,
  Plug2,
} from 'lucide-react';
import { BacklinksAiAssistant } from '@/components/backlinks/backlinks-ai-assistant';

const navItems = [
  { name: 'Dashboard', href: '/app/en/backlinks', icon: LayoutDashboard },
  { name: 'Prospects', href: '/app/en/backlinks/prospects', icon: Search },
  { name: 'Contacts', href: '/app/en/backlinks/contacts', icon: Users },
  { name: 'Campaigns', href: '/app/en/backlinks/campaigns', icon: Send },
  { name: 'Inbox', href: '/app/en/backlinks/inbox', icon: Inbox },
  { name: 'Verification', href: '/app/en/backlinks/verification', icon: LinkIcon },
  { name: 'Competitors', href: '/app/en/backlinks/competitors', icon: Swords },
  { name: 'Reports', href: '/app/en/backlinks/reports', icon: BarChart2 },
];

export default function ResponaBacklinksLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans -m-6 p-6">
      {/* Respona-Style Top Navigation Header */}
      <header className="border border-slate-200 bg-white sticky top-0 z-40 backdrop-blur-md rounded-2xl mb-6 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-xl text-white shadow-sm">
                <LinkIcon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 leading-none">Respona Backlinks Platform</h1>
                <p className="text-xs text-slate-500 mt-0.5">AI Acquisition & Outreach • GSC Integrated</p>
              </div>
            </div>

            {/* Sub-navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <Link
              href="/app/en/settings/integrations"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-xl border border-slate-200 font-medium transition"
            >
              <Plug2 className="w-3.5 h-3.5 text-blue-600" />
              <span>GSC Settings</span>
            </Link>
          </div>
        </div>

        {/* Mobile Nav Scrollbar */}
        <div className="md:hidden flex overflow-x-auto border-t border-slate-100 px-4 py-2 gap-2 text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-600 bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto space-y-6">
        {children}
      </main>

      {/* Persistent AI Assistant Sidebar */}
      <BacklinksAiAssistant />
    </div>
  );
}
