import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  Eye,
  Trash2,
  Calendar,
  IndianRupee,
  ShoppingBag,
  Receipt,
  Download,
  CheckCircle,
  Tag,
} from 'lucide-react';
import { Order, PaymentMethod } from './types.ts';
import { OrderService } from './orderService.ts';
import { BillReceiptModal } from './BillReceiptModal.tsx';

interface OrderHistoryViewProps {
  orders: Order[];
  onRefresh: () => void;
  onNavigateToPOS: () => void;
}

export const OrderHistoryView: React.FC<OrderHistoryViewProps> = ({
  orders,
  onRefresh,
  onNavigateToPOS,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<string>('ALL');
  const [inspectingOrder, setInspectingOrder] = useState<Order | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchSearch =
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchPayment = selectedPayment === 'ALL' || order.paymentMethod === selectedPayment;
      return matchSearch && matchPayment;
    });
  }, [orders, searchQuery, selectedPayment]);

  // KPIs
  const stats = OrderService.getOrderStats();

  const handleViewReceipt = (order: Order) => {
    setInspectingOrder(order);
    setIsReceiptOpen(true);
  };

  const handleDelete = (orderId: string) => {
    if (window.confirm('Delete this order? Relational line items will also be removed.')) {
      OrderService.deleteOrder(orderId);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & KPIs */}
      <div className="bg-gradient-to-r from-[#1e140f] via-[#2c1d14] to-[#1e140f] text-white rounded-2xl p-6 shadow-md border border-[#3d2a1d]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#3b82f6] text-white">
                Auditing
              </span>
              <span className="text-xs text-[#d6c7b9]">Saved Orders &amp; Relational Lines</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight font-['Plus_Jakarta_Sans']">
              Order History &amp; Relational Records
            </h1>
            <p className="text-xs text-[#a89282] max-w-2xl mt-1">
              Every completed checkout persists 1 row to <code>orders</code> and N rows to <code>order_items</code> (Table foreign key).
            </p>
          </div>

          <button
            onClick={onNavigateToPOS}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#d97706] to-[#b45309] text-white text-xs font-bold hover:shadow-lg transition-all flex items-center space-x-1.5 self-start md:self-auto"
          >
            <span>Create New Order</span>
            <span>&rarr;</span>
          </button>
        </div>

        {/* Analytics KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#4a3424]/70">
          <div className="bg-[#1e140f]/60 rounded-xl p-3 border border-[#4a3424]">
            <span className="text-[10px] text-[#a89282] uppercase font-bold tracking-wider block">
              Total Revenue
            </span>
            <span className="text-xl font-black text-[#fbbf24] font-['Plus_Jakarta_Sans']">
              ₹{stats.totalRevenue.toFixed(2)}
            </span>
          </div>

          <div className="bg-[#1e140f]/60 rounded-xl p-3 border border-[#4a3424]">
            <span className="text-[10px] text-sky-400 uppercase font-bold tracking-wider block">
              Total Orders
            </span>
            <span className="text-xl font-black text-white font-['Plus_Jakarta_Sans']">
              {stats.orderCount}
            </span>
          </div>

          <div className="bg-[#1e140f]/60 rounded-xl p-3 border border-[#4a3424]">
            <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider block">
              5% GST Collected
            </span>
            <span className="text-xl font-black text-emerald-300 font-['Plus_Jakarta_Sans']">
              ₹{stats.totalGstCollected.toFixed(2)}
            </span>
          </div>

          <div className="bg-[#1e140f]/60 rounded-xl p-3 border border-[#4a3424]">
            <span className="text-[10px] text-rose-400 uppercase font-bold tracking-wider block">
              10% Discounts Given
            </span>
            <span className="text-xl font-black text-rose-300 font-['Plus_Jakarta_Sans']">
              ₹{stats.totalDiscountGiven.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-[#e8dfd5] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order number or customer name..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#e0d6cb] text-xs focus:outline-none focus:border-[#d97706] bg-[#faf7f2]/50 text-[#2c1d14]"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-neutral-500 font-semibold text-xs flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Payment:</span>
          </span>
          <select
            value={selectedPayment}
            onChange={(e) => setSelectedPayment(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#e0d6cb] bg-white text-xs text-[#2c1d14] outline-none focus:border-[#d97706]"
          >
            <option value="ALL">All Methods</option>
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="CREDIT_CARD">Credit Card</option>
            <option value="DEBIT_CARD">Debit Card</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#e8dfd5] shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#faf7f2] text-[#d97706] flex items-center justify-center mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-[#2c1d14]">No Orders Found</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            No orders match your filter criteria. Go to Module 2 to place an order and generate a bill!
          </p>
          <button
            onClick={onNavigateToPOS}
            className="px-4 py-2 rounded-xl bg-[#d97706] text-white text-xs font-bold hover:bg-[#b45309]"
          >
            Open POS Terminal
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const dateStr = new Date(order.createdAt).toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl p-5 border border-[#e8dfd5] shadow-xs space-y-4 hover:border-[#d97706]/40 transition-colors"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#f0e8de] gap-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-[#faf7f2] border border-[#e8dfd5] text-[#b45309] flex items-center justify-center">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-sm text-[#2c1d14]">
                          {order.orderNumber}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {order.paymentStatus}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#faf7f2] text-[#78350f] border border-[#e8dfd5]">
                          {order.paymentMethod}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5 flex items-center space-x-2">
                        <span>{dateStr}</span>
                        <span>&bull;</span>
                        <span>Customer: <strong>{order.customerName}</strong></span>
                        {order.tableNumber && (
                          <>
                            <span>&bull;</span>
                            <span>{order.tableNumber}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end sm:self-auto">
                    <div className="text-right">
                      <span className="text-[10px] text-neutral-400 uppercase font-bold block">
                        Grand Total
                      </span>
                      <span className="text-lg font-black text-[#b45309] font-['Plus_Jakarta_Sans']">
                        ₹{order.grandTotal.toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleViewReceipt(order)}
                      className="px-3 py-1.5 rounded-xl bg-[#faf7f2] hover:bg-[#f0e8de] text-[#523927] border border-[#e8dfd5] text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Receipt</span>
                    </button>

                    <button
                      onClick={() => handleDelete(order.id)}
                      className="p-1.5 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete order record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Relational Order Lines Table */}
                <div>
                  <div className="text-[11px] font-bold text-[#523927] uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Order Lines (Table: order_items - {order.items.length} items)</span>
                    <span className="text-[10px] text-neutral-400 font-normal">
                      Subtotal: ₹{order.subtotal.toFixed(2)} | Discount: -₹{order.discountAmount.toFixed(2)} | 5% GST: +₹{order.gstAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-[#faf7f2]/60 rounded-xl border border-[#e8dfd5] overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-[#f5efe6] text-[#78350f] text-[10px] uppercase font-bold border-b border-[#e8dfd5]">
                          <th className="py-2 px-3">Item Name</th>
                          <th className="py-2 px-3 text-right">Unit Price</th>
                          <th className="py-2 px-3 text-center">Qty (1-20)</th>
                          <th className="py-2 px-3 text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e8dfd5]">
                        {order.items.map((line) => (
                          <tr key={line.id} className="hover:bg-white/60">
                            <td className="py-2 px-3 font-semibold text-[#2c1d14]">
                              {line.itemName}
                              <span className="text-[10px] text-neutral-400 block font-mono">
                                FK menu_item_id: {line.menuItemId}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right text-neutral-600">
                              ₹{line.unitPrice.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-center font-bold">
                              x{line.quantity}
                            </td>
                            <td className="py-2 px-3 text-right font-black text-[#2c1d14]">
                              ₹{line.lineTotal.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bill Receipt Modal */}
      <BillReceiptModal
        order={inspectingOrder}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        onNewOrder={() => {
          setIsReceiptOpen(false);
          onNavigateToPOS();
        }}
      />
    </div>
  );
};
