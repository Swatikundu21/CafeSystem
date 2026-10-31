import React from 'react';
import {
  Coffee,
  Receipt,
  History,
  TestTube2,
  FileSpreadsheet,
  Database,
  RotateCcw,
  Download,
  ShoppingBag,
} from 'lucide-react';

export type ActiveTab = 'menu' | 'billing' | 'history' | 'tests' | 'jira' | 'schema';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  cartCount: number;
  menuItemCount: number;
  orderCount: number;
  onResetDatabase: () => void;
  onExportSQL: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  cartCount,
  menuItemCount,
  orderCount,
  onResetDatabase,
  onExportSQL,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#1e140f] text-[#fdfcf9] border-b border-[#3d2a1d] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('menu')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d97706] to-[#b45309] flex items-center justify-center text-white shadow-inner">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white font-['Plus_Jakarta_Sans']">
                  CafeMaster
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-[#3d2a1d] text-[#fbbf24] border border-[#523927]">
                  v1.0 SE
                </span>
              </div>
              <p className="text-xs text-[#a89282] hidden sm:block">
                Cafe Management & Billing POS Engine
              </p>
            </div>
          </div>

          {/* Module Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto py-1">
            <button
              onClick={() => setActiveTab('menu')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'menu'
                  ? 'bg-[#d97706] text-white shadow-sm'
                  : 'text-[#d6c7b9] hover:bg-[#2c1d14] hover:text-white'
              }`}
            >
              <Coffee className="w-4 h-4" />
              <span>Module 1: Menu</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === 'menu' ? 'bg-[#92400e] text-white' : 'bg-[#3d2a1d] text-[#d6c7b9]'
              }`}>
                {menuItemCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('billing')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all relative ${
                activeTab === 'billing'
                  ? 'bg-[#d97706] text-white shadow-sm'
                  : 'text-[#d6c7b9] hover:bg-[#2c1d14] hover:text-white'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Module 2: Order & POS</span>
              {cartCount > 0 && (
                <span className="bg-[#ef4444] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-[#d97706] text-white shadow-sm'
                  : 'text-[#d6c7b9] hover:bg-[#2c1d14] hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span className="hidden md:inline">Orders</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === 'history' ? 'bg-[#92400e] text-white' : 'bg-[#3d2a1d] text-[#d6c7b9]'
              }`}>
                {orderCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('tests')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'tests'
                  ? 'bg-[#10b981] text-white shadow-sm'
                  : 'text-[#a7f3d0] hover:bg-[#132c21] hover:text-white'
              }`}
            >
              <TestTube2 className="w-4 h-4" />
              <span>Unit Tests</span>
            </button>

            <button
              onClick={() => setActiveTab('jira')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'jira'
                  ? 'bg-[#3b82f6] text-white shadow-sm'
                  : 'text-[#bfdbfe] hover:bg-[#1a2c42] hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">JIRA QA</span>
              <span className="sm:hidden">QA</span>
            </button>

            <button
              onClick={() => setActiveTab('schema')}
              className={`flex items-center space-x-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'schema'
                  ? 'bg-[#8b5cf6] text-white shadow-sm'
                  : 'text-[#ddd6fe] hover:bg-[#251e3e] hover:text-white'
              }`}
            >
              <Database className="w-4 h-4" />
              <span className="hidden lg:inline">SQL Schema</span>
            </button>
          </nav>

          {/* Quick Utility Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onExportSQL}
              title="Export Current Relational Database as SQL Dump"
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-[#2c1d14] hover:bg-[#3d2a1d] text-[#d6c7b9] hover:text-white text-xs border border-[#4a3424] transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Export SQL</span>
            </button>
            <button
              onClick={onResetDatabase}
              title="Reset Database to Seed State"
              className="p-1.5 rounded-md bg-[#2c1d14] hover:bg-[#3d2a1d] text-[#a89282] hover:text-[#fbbf24] border border-[#4a3424] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
