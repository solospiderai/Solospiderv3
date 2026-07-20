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
  Sparkles,
} from 'lucide-react';
import { BacklinksAiAssistant } from '@/components/backlinks/backlinks-ai-assistant';

const navItems = [
  { name: 'Dashboard', href: '/backlinks', icon: LayoutDashboard },
  { name: 'Prospects', href: '/backlinks/prospects', icon: Search },
  { name: 'Contacts', href: '/backlinks/contacts', icon: Users },
  { name: 'Campaigns', href: '/backlinks/campaigns', icon: Send },
  { name: 'Inbox', href: '/backlinks/inbox', icon: Inbox },
  { name: 'Verification', href: '/backlinks/verification', icon: LinkIcon },
  { name: 'Competitors', href: '/backlinks/competitors', icon: Swords },
  { name: 'Reports', href: '/backlinks/reports', icon: BarChart2 },
];

export default function BacklinksLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header / Subnav */}
      <header className="border-b border-slate-800 bg-slate-900/60 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-sm text-white">
                <LinkIcon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white leading-none">Backlink Engine</h1>
                <p className="text-xs text-slate-400 mt-0.5">Respona-Style AI Acquisition Platform</p>
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
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Mobile Nav Scrollbar */}
        <div className="md:hidden flex overflow-x-auto border-t border-slate-800/80 px-4 py-2 gap-2 text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-400 bg-slate-900'
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Persistent AI Assistant Sidebar */}
      <BacklinksAiAssistant />
    </div>
  );
}
