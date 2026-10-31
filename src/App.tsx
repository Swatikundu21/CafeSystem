/**
 * CafeMaster - Cafe Management System
 * 
 * Complete implementation of:
 * - Module 1: Menu Management (CRUD, validations: unique name, price > 0 & <= 10000, fixed categories, live availability)
 * - Module 2: Order & Billing (reads live Module 1 menu, quantity limits 1–20, subtotal, 10% discount > 500, 5% GST, printable receipt, atomic relational persistence)
 * - Relational Database layer (database/schema.sql, orders + order_items with foreign keys)
 * - Unit Test Suite Runner (White-box & Black-box Boundary Value Analysis)
 * - JIRA QA Center (User stories, Acceptance criteria, Test Cases Matrix with CSV export, Bug Reports)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, ActiveTab } from './components/Navbar.tsx';
import { MenuManagementView } from './module1_menu/MenuManagementView.tsx';
import { OrderBillingView } from './module2_billing/OrderBillingView.tsx';
import { OrderHistoryView } from './module2_billing/OrderHistoryView.tsx';
import { TestRunnerView } from './tests/TestRunnerView.tsx';
import { DocsModalOrTab } from './docs/DocsModalOrTab.tsx';
import { MenuItem } from './module1_menu/types.ts';
import { Order } from './module2_billing/types.ts';
import { db } from './database/db.ts';
import { MenuService } from './module1_menu/menuService.ts';
import { OrderService } from './module2_billing/orderService.ts';
import { jiraSyncService } from './services/jiraSyncService.ts';
import { AlertCircle, CheckCircle, Database, Download, RotateCcw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('menu');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSqlExportModal, setShowSqlExportModal] = useState(false);
  const [sqlDumpContent, setSqlDumpContent] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state with database
  const refreshData = useCallback(() => {
    setMenuItems(MenuService.getAll());
    setOrders(OrderService.getAllOrders());
  }, []);

  useEffect(() => {
    refreshData();
    // Subscribe to DB changes
    const unsubscribe = db.subscribe(() => {
      refreshData();
    });
    return () => unsubscribe();
  }, [refreshData]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleResetConfirm = () => {
    db.resetToFactorySeeds();
    refreshData();
    setShowResetModal(false);
    showToast('Database reset to authentic baseline seeds!');

    jiraSyncService.logEvent({
      type: 'system_reset',
      summary: '[System Event] Relational Database Reset to Factory Seeds',
      details: 'Manager reset the catalog and transaction ledger back to baseline seeds.',
      issueType: 'Task',
    }).catch(() => {});
  };

  const handleOpenExportSQL = () => {
    const dump = db.generateSQLDump();
    setSqlDumpContent(dump);
    setShowSqlExportModal(true);
  };

  const handleDownloadSQLFile = () => {
    const blob = new Blob([sqlDumpContent], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cafemaster_db_dump_${new Date().toISOString().slice(0, 10)}.sql`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded SQL data dump file');
  };

  return (
    <div className="min-h-screen bg-[#faf7f2] text-[#2c1d14] flex flex-col font-['Plus_Jakarta_Sans']">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1e140f] text-white px-4 py-3 rounded-xl shadow-2xl border border-[#d97706]/40 flex items-center space-x-2 text-xs font-semibold animate-in slide-in-from-bottom duration-200">
          <CheckCircle className="w-4 h-4 text-[#10b981]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={0}
        menuItemCount={menuItems.length}
        orderCount={orders.length}
        onResetDatabase={() => setShowResetModal(true)}
        onExportSQL={handleOpenExportSQL}
      />

      {/* Main Workspace Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'menu' && (
          <MenuManagementView
            menuItems={menuItems}
            onRefresh={refreshData}
            onNavigateToPOS={() => setActiveTab('billing')}
          />
        )}

        {activeTab === 'billing' && (
          <OrderBillingView
            menuItems={menuItems}
            onOrderSaved={() => {
              refreshData();
              showToast('Order saved to relational database!');
            }}
            onNavigateToMenu={() => setActiveTab('menu')}
          />
        )}

        {activeTab === 'history' && (
          <OrderHistoryView
            orders={orders}
            onRefresh={refreshData}
            onNavigateToPOS={() => setActiveTab('billing')}
          />
        )}

        {activeTab === 'tests' && <TestRunnerView />}

        {activeTab === 'jira' && <DocsModalOrTab initialSubTab="cases" />}

        {activeTab === 'schema' && <DocsModalOrTab initialSubTab="schema" />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#e8dfd5] py-4 text-xs text-neutral-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-[#523927]">CafeMaster System</span>
            <span>&bull;</span>
            <span>Module 1: Menu Management</span>
            <span>&bull;</span>
            <span>Module 2: Order &amp; Billing</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px]">
            <button
              onClick={() => setActiveTab('tests')}
              className="text-emerald-700 hover:underline font-semibold"
            >
              Run Unit Tests
            </button>
            <span>&bull;</span>
            <button
              onClick={() => setActiveTab('jira')}
              className="text-blue-700 hover:underline font-semibold"
            >
              JIRA Test Cases Matrix
            </button>
            <span>&bull;</span>
            <button
              onClick={() => setActiveTab('schema')}
              className="text-purple-700 hover:underline font-semibold"
            >
              database/schema.sql
            </button>
          </div>
        </div>
      </footer>

      {/* Reset Database Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-[#e8dfd5] w-full max-w-md p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-base text-[#2c1d14]">Reset Database to Seeds?</h3>
              <p className="text-xs text-neutral-500 mt-1">
                This will reset the <code>menu_items</code>, <code>orders</code>, and <code>order_items</code> tables back to default sample records.
              </p>
            </div>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResetConfirm}
                className="px-4 py-2 rounded-xl bg-[#d97706] text-white text-xs font-bold hover:bg-[#b45309]"
              >
                Yes, Reset Database
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SQL Export Modal */}
      {showSqlExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#e8dfd5] w-full max-w-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e8dfd5]">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-[#d97706]" />
                <h3 className="font-bold text-base text-[#2c1d14]">
                  Export Relational Database (SQL Dump)
                </h3>
              </div>
              <button
                onClick={() => setShowSqlExportModal(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-600">
              Live SQL DML statements corresponding to current database state in memory and storage:
            </p>

            <div className="bg-[#1e1e1e] text-neutral-200 p-3 rounded-xl font-mono text-xs max-h-72 overflow-y-auto">
              <pre>{sqlDumpContent}</pre>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-neutral-400">
                Compatible with PostgreSQL, MySQL, and SQLite.
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(sqlDumpContent);
                    showToast('SQL copied to clipboard!');
                  }}
                  className="px-3.5 py-2 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  Copy SQL
                </button>
                <button
                  onClick={handleDownloadSQLFile}
                  className="px-4 py-2 rounded-xl bg-[#d97706] hover:bg-[#b45309] text-white text-xs font-bold flex items-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .sql</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
