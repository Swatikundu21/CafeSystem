import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  Coffee,
  AlertTriangle,
  Info,
  ShieldCheck,
  PackageOpen,
} from 'lucide-react';
import { ALLOWED_CATEGORIES, MenuCategory, MenuItem, MenuItemFormData } from './types.ts';
import { MenuService } from './menuService.ts';
import { MenuItemFormModal } from './MenuItemFormModal.tsx';

interface MenuManagementViewProps {
  menuItems: MenuItem[];
  onRefresh: () => void;
  onNavigateToPOS: () => void;
}

export const MenuManagementView: React.FC<MenuManagementViewProps> = ({
  menuItems,
  onRefresh,
  onNavigateToPOS,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK'>('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchesStock =
        stockFilter === 'ALL' ||
        (stockFilter === 'IN_STOCK' && item.availability) ||
        (stockFilter === 'OUT_OF_STOCK' && !item.availability);

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [menuItems, searchQuery, selectedCategory, stockFilter]);

  // Statistics
  const totalCount = menuItems.length;
  const inStockCount = menuItems.filter((i) => i.availability).length;
  const outOfStockCount = totalCount - inStockCount;
  const avgPrice = totalCount > 0 ? menuItems.reduce((acc, i) => acc + i.price, 0) / totalCount : 0;

  // Handlers
  const handleAddNew = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleToggleStock = (item: MenuItem) => {
    const res = MenuService.toggleAvailability(item.id);
    if (res.success) {
      showToast(`"${item.name}" is now ${res.newStatus ? 'IN STOCK' : 'OUT OF STOCK'}`);
      onRefresh();
    }
  };

  const handleDeleteConfirm = () => {
    if (!deletingItem) return;
    const deleted = MenuService.delete(deletingItem.id);
    if (deleted) {
      showToast(`Deleted "${deletingItem.name}" from menu.`);
      onRefresh();
    }
    setDeletingItem(null);
  };

  const handleFormSubmit = (formData: MenuItemFormData, itemId?: string) => {
    if (itemId) {
      const res = MenuService.update(itemId, formData);
      if (res.success) {
        showToast(`Updated "${formData.name}" successfully.`);
        onRefresh();
        return { success: true };
      }
      return { success: false, errors: res.validation.errors };
    } else {
      const res = MenuService.create(formData);
      if (res.success) {
        showToast(`Created new item "${formData.name}".`);
        onRefresh();
        return { success: true };
      }
      return { success: false, errors: res.validation.errors };
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1e140f] text-white px-4 py-3 rounded-xl shadow-2xl border border-[#d97706]/40 flex items-center space-x-2 text-xs font-semibold animate-in slide-in-from-bottom duration-200">
          <CheckCircle className="w-4 h-4 text-[#10b981]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Module 1 Header Banner */}
      <div className="bg-gradient-to-r from-[#2c1d14] via-[#3a261a] to-[#2c1d14] text-white rounded-2xl p-6 shadow-md border border-[#4a3424]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#d97706] text-white">
                Module 1
              </span>
              <span className="text-xs text-[#d6c7b9]">Menu Catalog & Validation Engine</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight font-['Plus_Jakarta_Sans']">
              Menu Management
            </h1>
            <p className="text-xs text-[#a89282] max-w-2xl mt-1">
              Add, update, view, and delete cafe items. Strictly validated: Name is unique (case-insensitive),
              Price &gt; 0 and &le; 10,000, Category selected from fixed standard categories.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onNavigateToPOS}
              className="px-4 py-2.5 rounded-xl bg-[#3d2a1d] hover:bg-[#523927] text-[#fbbf24] text-xs font-bold border border-[#5a3f2b] transition-colors flex items-center space-x-1.5"
            >
              <span>Go to Module 2 POS</span>
              <span>&rarr;</span>
            </button>
            <button
              onClick={handleAddNew}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d97706] to-[#b45309] text-white text-xs font-bold hover:shadow-lg hover:brightness-105 transition-all shadow-sm flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Menu Item</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#4a3424]/70">
          <div className="bg-[#1e140f]/60 rounded-xl p-3 border border-[#4a3424]">
            <span className="text-[10px] text-[#a89282] uppercase font-bold tracking-wider block">
              Total Menu Items
            </span>
            <span className="text-xl font-black text-white font-['Plus_Jakarta_Sans']">
              {totalCount}
            </span>
          </div>

          <div className="bg-[#1e140f]/60 rounded-xl p-3 border border-[#4a3424]">
            <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider block">
              Available In Stock
            </span>
            <span className="text-xl font-black text-emerald-300 font-['Plus_Jakarta_Sans']">
              {inStockCount}
            </span>
          </div>

          <div className="bg-[#1e140f]/60 rounded-xl p-3 border border-[#4a3424]">
            <span className="text-[10px] text-rose-400 uppercase font-bold tracking-wider block">
              Out of Stock
            </span>
            <span className="text-xl font-black text-rose-300 font-['Plus_Jakarta_Sans']">
              {outOfStockCount}
            </span>
          </div>

          <div className="bg-[#1e140f]/60 rounded-xl p-3 border border-[#4a3424]">
            <span className="text-[10px] text-[#fbbf24] uppercase font-bold tracking-wider block">
              Average Price
            </span>
            <span className="text-xl font-black text-[#fbbf24] font-['Plus_Jakarta_Sans']">
              ₹{avgPrice.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-[#e8dfd5] space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search menu items by name..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#e0d6cb] text-xs focus:outline-none focus:border-[#d97706] focus:ring-2 focus:ring-[#d97706]/20 bg-[#faf7f2]/50 text-[#2c1d14]"
            />
          </div>

          {/* Availability Filter Tabs */}
          <div className="flex items-center space-x-1 bg-[#f5f0e8] p-1 rounded-xl self-start md:self-auto border border-[#e0d6cb]">
            <button
              onClick={() => setStockFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                stockFilter === 'ALL'
                  ? 'bg-white text-[#2c1d14] shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setStockFilter('IN_STOCK')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                stockFilter === 'IN_STOCK'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-emerald-700'
              }`}
            >
              In Stock ({inStockCount})
            </button>
            <button
              onClick={() => setStockFilter('OUT_OF_STOCK')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                stockFilter === 'OUT_OF_STOCK'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-rose-700'
              }`}
            >
              Out of Stock ({outOfStockCount})
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 pt-1 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-[#2c1d14] text-white'
                : 'bg-[#faf7f2] text-[#523927] hover:bg-[#eae2d7] border border-[#e8dfd5]'
            }`}
          >
            All Categories
          </button>
          {ALLOWED_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                selectedCategory === cat
                  ? 'bg-[#d97706] text-white'
                  : 'bg-[#faf7f2] text-[#523927] hover:bg-[#eae2d7] border border-[#e8dfd5]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items Table / Cards */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#e8dfd5] shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#faf7f2] text-[#d97706] flex items-center justify-center mx-auto">
            <PackageOpen className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-[#2c1d14]">No Menu Items Found</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            No items matched your search query or category filters. You can clear filters or add a new menu item.
          </p>
          <button
            onClick={handleAddNew}
            className="px-4 py-2 rounded-xl bg-[#d97706] text-white text-xs font-bold hover:bg-[#b45309]"
          >
            Add New Item
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xs border border-[#e8dfd5] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#faf7f2] border-b border-[#e8dfd5] text-[#78350f] uppercase font-bold tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Item Details</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Price (₹)</th>
                  <th className="py-3.5 px-4 text-center">Availability (Live)</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0e8de]">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-[#faf7f2]/60 transition-colors ${
                      !item.availability ? 'bg-neutral-50/50 opacity-80' : ''
                    }`}
                  >
                    {/* Item Details */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-[#f5f0e8] text-[#b45309] flex items-center justify-center shrink-0">
                          <Coffee className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-[#2c1d14] text-sm">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-neutral-400 font-mono">
                            ID: {item.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-md bg-[#faf7f2] border border-[#e8dfd5] text-[#78350f] font-semibold text-[11px]">
                        {item.category}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4 text-right font-bold text-[#2c1d14] text-sm font-['Plus_Jakarta_Sans']">
                      ₹{item.price.toFixed(2)}
                    </td>

                    {/* Availability Quick Toggle */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleStock(item)}
                        title={`Click to switch to ${item.availability ? 'Out of Stock' : 'In Stock'}`}
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all border ${
                          item.availability
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {item.availability ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>In Stock</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Out of Stock</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center space-x-1.5">
                        <button
                          onClick={() => handleEdit(item)}
                          title="Edit Menu Item"
                          className="p-1.5 rounded-lg text-neutral-600 hover:text-[#d97706] hover:bg-[#faf7f2] border border-neutral-200 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingItem(item)}
                          title="Delete Menu Item"
                          className="p-1.5 rounded-lg text-neutral-600 hover:text-red-600 hover:bg-red-50 border border-neutral-200 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Educational Architecture Callout for Student Demo */}
      <div className="bg-[#faf7f2] border border-[#e8dfd5] rounded-xl p-4 text-xs text-[#523927] space-y-2">
        <div className="flex items-center space-x-2 font-bold text-[#78350f]">
          <Info className="w-4 h-4 text-[#d97706]" />
          <span>Student Software Engineering Architecture Note (Module 1):</span>
        </div>
        <p className="text-neutral-600 leading-relaxed">
          <strong>Clean Layer Separation:</strong> Presentation Layer (<code>MenuManagementView.tsx</code>, <code>MenuItemFormModal.tsx</code>) 
          delegates validation strictly to the pure domain logic in <code>src/module1_menu/validation.ts</code>. 
          Database transactions are isolated via <code>menuService.ts</code> which updates <code>menu_items</code> table in <code>database/schema.sql</code>.
          Any availability change here directly reflects in Module 2 Order &amp; Billing.
        </p>
      </div>

      {/* Add / Edit Form Modal */}
      <MenuItemFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialItem={editingItem}
        existingItems={menuItems}
      />

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-[#e8dfd5] w-full max-w-md p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-base text-[#2c1d14]">Delete Menu Item?</h3>
              <p className="text-xs text-neutral-500 mt-1">
                Are you sure you want to delete <strong>"{deletingItem.name}"</strong>? This will remove it from the menu catalog.
              </p>
            </div>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700"
              >
                Yes, Delete Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
