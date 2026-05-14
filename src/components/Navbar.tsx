"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, List, PlusCircle, Wallet } from "lucide-react";
import clsx from "clsx";

const navLinks = [
  { href: "/", label: "Dashboard", icon: BarChart3 },
  { href: "/expenses", label: "Expenses", icon: List },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg">SpendWise</span>
          </div>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === href
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </nav>

          {/* Add expense CTA */}
          <Link
            href="/expenses?add=true"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Add Expense</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
