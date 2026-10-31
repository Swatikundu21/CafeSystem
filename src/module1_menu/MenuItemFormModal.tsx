import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle2, ShieldCheck, Sparkles, Tag, DollarSign, Layers } from 'lucide-react';
import { ALLOWED_CATEGORIES, MenuCategory, MenuItem, MenuItemFormData, MenuItemValidationErrors } from './types.ts';
import { validateMenuItemForm } from './validation.ts';

interface MenuItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: MenuItemFormData, itemId?: string) => { success: boolean; errors?: MenuItemValidationErrors };
  initialItem?: MenuItem | null;
  existingItems: MenuItem[];
}

export const MenuItemFormModal: React.FC<MenuItemFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialItem,
  existingItems,
}) => {
  const [formData, setFormData] = useState<MenuItemFormData>({
    name: '',
    category: 'Hot Coffee',
    price: '',
    availability: true,
  });

  const [errors, setErrors] = useState<MenuItemValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialItem) {
      setFormData({
        name: initialItem.name,
        category: initialItem.category,
        price: initialItem.price.toString(),
        availability: initialItem.availability,
      });
    } else {
      setFormData({
        name: '',
        category: 'Hot Coffee',
        price: '',
        availability: true,
      });
    }
    setErrors({});
    setTouched({});
  }, [initialItem, isOpen]);

  if (!isOpen) return null;

  const isEditing = Boolean(initialItem);

  const handleFieldChange = (field: keyof MenuItemFormData, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);

    // Live validation if field was touched
    if (touched[field]) {
      const validation = validateMenuItemForm(updated, existingItems, initialItem?.id);
      setErrors((prev) => ({
        ...prev,
        [field]: validation.errors[field],
      }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const validation = validateMenuItemForm(formData, existingItems, initialItem?.id);
    setErrors(validation.errors);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, category: true, price: true });

    const validation = validateMenuItemForm(formData, existingItems, initialItem?.id);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    const result = onSubmit(formData, initialItem?.id);
    if (!result.success && result.errors) {
      setErrors(result.errors);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#e8dfd5] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#1e140f] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#d97706] flex items-center justify-center text-white font-bold text-sm">
              {isEditing ? '✎' : '+'}
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight font-['Plus_Jakarta_Sans']">
                {isEditing ? 'Update Menu Item' : 'Add New Menu Item'}
              </h3>
              <p className="text-xs text-[#a89282]">
                Module 1: Menu Management & Validation Rules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#d6c7b9] hover:bg-[#3d2a1d] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Policy Notice */}
        <div className="bg-[#faf7f2] border-b border-[#e8dfd5] px-6 py-2.5 flex items-center space-x-2 text-xs text-[#78350f]">
          <ShieldCheck className="w-4 h-4 text-[#d97706] shrink-0" />
          <span>
            <strong>Validation Rules:</strong> Unique Name, Price &gt; 0 and &le; 10,000, Category from fixed list.
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* General Error Alert */}
          {errors.general && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Name Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#523927] mb-1.5 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Tag className="w-3.5 h-3.5 text-[#b45309]" />
                <span>Item Name <span className="text-red-500">*</span></span>
              </span>
              <span className="text-[10px] text-neutral-400 font-normal">Must be unique (case-insensitive)</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              placeholder="e.g. Vanilla Bean Flat White"
              maxLength={150}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all outline-none ${
                errors.name
                  ? 'border-red-500 bg-red-50/30 text-red-900 focus:ring-2 focus:ring-red-400'
                  : 'border-[#d6c7b9] bg-white text-[#2c1d14] focus:border-[#d97706] focus:ring-2 focus:ring-[#d97706]/20'
              }`}
            />
            {errors.name ? (
              <p className="mt-1 text-xs text-red-600 flex items-center space-x-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.name}</span>
              </p>
            ) : touched.name && formData.name.trim() ? (
              <p className="mt-1 text-xs text-emerald-600 flex items-center space-x-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Name is valid and unique</span>
              </p>
            ) : null}
          </div>

          {/* Category Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#523927] mb-1.5 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-[#b45309]" />
                <span>Category <span className="text-red-500">*</span></span>
              </span>
              <span className="text-[10px] text-neutral-400 font-normal">Fixed 6 categories</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleFieldChange('category', e.target.value as MenuCategory)}
              onBlur={() => handleBlur('category')}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all outline-none bg-white ${
                errors.category
                  ? 'border-red-500 bg-red-50/30 text-red-900 focus:ring-2 focus:ring-red-400'
                  : 'border-[#d6c7b9] text-[#2c1d14] focus:border-[#d97706] focus:ring-2 focus:ring-[#d97706]/20'
              }`}
            >
              {ALLOWED_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-xs text-red-600 flex items-center space-x-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.category}</span>
              </p>
            )}
          </div>

          {/* Price Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#523927] mb-1.5 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <DollarSign className="w-3.5 h-3.5 text-[#b45309]" />
                <span>Price (₹ INR) <span className="text-red-500">*</span></span>
              </span>
              <span className="text-[10px] text-neutral-400 font-normal">Rule: &gt; 0 and &le; ₹10,000</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#78350f] font-bold text-sm">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="10000"
                value={formData.price}
                onChange={(e) => handleFieldChange('price', e.target.value)}
                onBlur={() => handleBlur('price')}
                placeholder="185.00"
                className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl border text-sm transition-all outline-none ${
                  errors.price
                    ? 'border-red-500 bg-red-50/30 text-red-900 focus:ring-2 focus:ring-red-400'
                    : 'border-[#d6c7b9] bg-white text-[#2c1d14] focus:border-[#d97706] focus:ring-2 focus:ring-[#d97706]/20'
                }`}
              />
            </div>
            {errors.price ? (
              <p className="mt-1 text-xs text-red-600 flex items-center space-x-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.price}</span>
              </p>
            ) : touched.price && Number(formData.price) > 0 && Number(formData.price) <= 10000 ? (
              <p className="mt-1 text-xs text-emerald-600 flex items-center space-x-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Price is within required boundary limits</span>
              </p>
            ) : null}
          </div>

          {/* Availability Toggle */}
          <div className="pt-2 border-t border-[#e8dfd5] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#523927] block">
                Item Availability
              </span>
              <span className="text-xs text-neutral-500">
                Determines if Module 2 (POS) can select this item
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.availability}
                onChange={(e) => handleFieldChange('availability', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              <span className="ml-2.5 text-xs font-semibold text-[#2c1d14]">
                {formData.availability ? 'In Stock' : 'Out of Stock'}
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#d6c7b9] text-xs font-semibold text-[#523927] hover:bg-[#faf7f2] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d97706] to-[#b45309] text-white text-xs font-bold hover:shadow-lg hover:brightness-105 transition-all shadow-sm flex items-center space-x-1.5"
            >
              <span>{isEditing ? 'Save Changes' : 'Add to Menu'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
