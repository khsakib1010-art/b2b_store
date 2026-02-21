import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { fetchProducts, createOrder, fetchOrders } from '@/services/api';
import { Product, OrderItem, Order } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LogOut, Search, Package, Send, CheckCircle, AlertCircle, ShoppingCart, Trash2, X, Loader2, ClipboardList, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface ProductSelection {
  productId: string;
  productName: string;
  styleNumber: string;
  selectedColor: string;
  quantities: Record<string, number>;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending:    { label: 'Pending',    className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  confirmed:  { label: 'Confirmed',  className: 'bg-blue-100 text-blue-800 border-blue-200' },
  processing: { label: 'Processing', className: 'bg-purple-100 text-purple-800 border-purple-200' },
  shipped:    { label: 'Shipped',    className: 'bg-orange-100 text-orange-800 border-orange-200' },
  delivered:  { label: 'Delivered',  className: 'bg-green-100 text-green-800 border-green-200' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: 'bg-gray-100 text-gray-700 border-gray-200' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

export default function CustomerDashboard() {
  const { user, logout, isAuthenticated } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState<'catalog' | 'orders'>('catalog');

  // Catalog state
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selections, setSelections] = useState<Record<string, ProductSelection>>({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [poNumber, setPoNumber] = useState('');
  const [poError, setPoError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastOrderId, setLastOrderId] = useState('');
  const [lastPoNumber, setLastPoNumber] = useState('');

  // Order history state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchProducts();
        setProducts(data);
      } catch (err) {
        console.error('Failed to load products:', err);
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    }
    if (isAuthenticated && user?.role === 'customer') {
      load();
    }
  }, [isAuthenticated, user]);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const data = await fetchOrders();
      // Sort newest first
      setOrders(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      console.error('Failed to load orders:', err);
      toast.error('Failed to load order history');
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const handleTabChange = (tab: 'catalog' | 'orders') => {
    setActiveTab(tab);
    if (tab === 'orders') loadOrders();
  };

  if (!isAuthenticated || user?.role !== 'customer') {
    return <Navigate to="/" replace />;
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.styleNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleColorChange = (product: Product, color: string) => {
    setSelections(prev => ({
      ...prev,
      [product.id]: {
        productId: product.id,
        productName: product.name,
        styleNumber: product.styleNumber,
        selectedColor: color,
        quantities: prev[product.id]?.quantities || {}
      }
    }));
  };

  const handleQuantityChange = (product: Product, size: string, value: string) => {
    const qty = parseInt(value) || 0;
    const currentSelection = selections[product.id] || {
      productId: product.id,
      productName: product.name,
      styleNumber: product.styleNumber,
      selectedColor: product.colors[0],
      quantities: {}
    };
    setSelections(prev => ({
      ...prev,
      [product.id]: {
        ...currentSelection,
        quantities: { ...currentSelection.quantities, [size]: qty }
      }
    }));
  };

  const handleQuantityChangeForSizeInNumber = (product: Product, size: number, value: string) => {
    const qty = parseInt(value) || 0;
    const currentSelection = selections[product.id] || {
      productId: product.id,
      productName: product.name,
      styleNumber: product.styleNumber,
      selectedColor: product.colors[0],
      quantities: {}
    };
    setSelections(prev => ({
      ...prev,
      [product.id]: {
        ...currentSelection,
        quantities: { ...currentSelection.quantities, [size]: qty }
      }
    }));
  };

  const getOrderItems = (): OrderItem[] => {
    const items: OrderItem[] = [];
    Object.values(selections).forEach(selection => {
      const product = products.find(p => p.id === selection.productId);
      const styleNumber = selection.styleNumber || product?.styleNumber || '';
      Object.entries(selection.quantities).forEach(([size, qty]) => {
        if (qty > 0) {
          items.push({
            productId: selection.productId,
            productName: selection.productName,
            styleNumber,
            color: selection.selectedColor,
            size,
            quantity: qty
          });
        }
      });
    });
    return items;
  };

  const totalItems = getOrderItems().reduce((sum, item) => sum + item.quantity, 0);

  const handleRemoveProduct = (productId: string) => {
    setSelections(prev => {
      const updated = { ...prev };
      delete updated[productId];
      return updated;
    });
  };

  const handleSubmitOrder = async () => {
    if (totalItems === 0) {
      toast.error('Please add quantities to at least one product');
      return;
    }
    if (!poNumber.trim()) {
      setPoError('PO Number is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await createOrder({
        poNumber: poNumber.trim(),
        items: getOrderItems(),
      });
      setLastOrderId(order.id);
      setLastPoNumber(poNumber);
      setSelections({});
      setPoNumber('');
      setPoError('');
      setShowConfirmation(true);
      toast.success('Order placed successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getColorStyle = (color: string) => {
    const colorMap: Record<string, string> = {
      'white': '#ffffff',
      'black': '#1a1a1a',
      'navy': '#1e3a5f',
      'gray': '#6b7280',
      'charcoal': '#374151',
      'red': '#dc2626',
      'royal blue': '#2563eb',
      'burgundy': '#7f1d1d',
      'forest green': '#166534',
      'khaki': '#a3916e',
      'olive': '#556b2f'
    };
    return colorMap[color.toLowerCase()] || '#94a3b8';
  };

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  };

  if (loading) {
    return (
      <div className="page-container">
        <header className="bg-card border-b sticky top-0 z-50">
          <div className="content-container py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h1 className="font-semibold text-lg">B2B Store</h1>
                <p className="text-xs text-muted-foreground">{user?.company || user?.name}</p>
              </div>
            </div>
          </div>
        </header>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="content-container py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h1 className="font-semibold text-lg">B2B Store</h1>
                <p className="text-xs text-muted-foreground">{user?.company || user?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {totalItems > 0 && activeTab === 'catalog' && (
                <Badge variant="secondary" className="text-sm py-1 px-3">
                  <ShoppingCart className="w-4 h-4 mr-1.5" />
                  {totalItems} items
                </Badge>
              )}
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3 border-b -mb-4 pb-0">
            <button
              onClick={() => handleTabChange('catalog')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'catalog'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              Place Order
            </button>
            <button
              onClick={() => handleTabChange('orders')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'orders'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              Order History
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="content-container">

        {/* ── ORDER HISTORY TAB ── */}
        {activeTab === 'orders' && (
          <div className="py-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Your Orders</h2>
              <Button variant="outline" size="sm" onClick={loadOrders} disabled={ordersLoading}>
                {ordersLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
              </Button>
            </div>

            {ordersLoading ? (
              <div className="flex items-center justify-center min-h-[300px]">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16">
                <ClipboardList className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No orders yet</p>
                <p className="text-sm text-muted-foreground mt-1">Your placed orders will appear here.</p>
                <Button variant="outline" className="mt-4" onClick={() => setActiveTab('catalog')}>
                  Place Your First Order
                </Button>
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="table-header">
                        <TableHead>PO Number</TableHead>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map(order => (
                        <React.Fragment key={order.id}>
                          <TableRow
                            className="hover:bg-muted/30 cursor-pointer"
                            onClick={() => toggleOrderExpand(order.id)}
                          >
                            <TableCell className="font-mono font-medium">{order.poNumber}</TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">{order.id}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric', month: 'short', day: 'numeric'
                              })}
                            </TableCell>
                            <TableCell className="text-sm">{order.totalItems} pcs</TableCell>
                            <TableCell>
                              <StatusBadge status={order.status} />
                            </TableCell>
                            <TableCell>
                              {expandedOrderId === order.id
                                ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              }
                            </TableCell>
                          </TableRow>

                          {/* Expanded line items */}
                          {expandedOrderId === order.id && (
                            <TableRow>
                              <TableCell colSpan={6} className="p-0 bg-muted/20">
                                <div className="p-4">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                                    Line Items
                                  </p>
                                  <div className="rounded-md border bg-card overflow-hidden">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="border-b bg-muted/50">
                                          <th className="text-left p-3 font-medium text-muted-foreground">Product</th>
                                          <th className="text-left p-3 font-medium text-muted-foreground">Style</th>
                                          <th className="text-left p-3 font-medium text-muted-foreground">Color</th>
                                          <th className="text-left p-3 font-medium text-muted-foreground">Size</th>
                                          <th className="text-right p-3 font-medium text-muted-foreground">Qty</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {order.items.map((item, idx) => (
                                          <tr key={idx} className="border-b last:border-b-0 hover:bg-muted/30">
                                            <td className="p-3 font-medium">{item.productName}</td>
                                            <td className="p-3 text-muted-foreground font-mono text-xs">{item.styleNumber}</td>
                                            <td className="p-3">
                                              <div className="flex items-center gap-2">
                                                <div
                                                  className="w-3 h-3 rounded-full border border-border flex-shrink-0"
                                                  style={{ backgroundColor: getColorStyle(item.color) }}
                                                />
                                                <span className="text-muted-foreground">{item.color}</span>
                                              </div>
                                            </td>
                                            <td className="p-3 text-muted-foreground">{item.size}</td>
                                            <td className="p-3 text-right font-semibold">{item.quantity}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── CATALOG / PLACE ORDER TAB ── */}
        {activeTab === 'catalog' && (
          <div className="space-y-6 py-6">
            {/* Search */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search products by name or style number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 input-field"
                />
              </div>
            </div>

            {/* Products List */}
            <div className="w-full">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="table-header">
                        <TableHead className="w-[250px]">Product</TableHead>
                        <TableHead className="w-[150px]">Style</TableHead>
                        <TableHead className="w-[180px]">Color</TableHead>
                        <TableHead>Sizes & Quantities</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map(product => {
                        const selection = selections[product.id];
                        const selectedColor = selection?.selectedColor || product.colors[0];

                        return (
                          <TableRow key={product.id} className="hover:bg-muted/30">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Package className="w-6 h-6 text-muted-foreground/50" />
                                </div>
                                <div>
                                  <p className="font-medium">{product.name}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm font-medium">{product.styleNumber}</p>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={selectedColor}
                                onValueChange={(value) => handleColorChange(product, value)}
                              >
                                <SelectTrigger className="input-field">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {product.colors.map(color => (
                                    <SelectItem key={color} value={color}>
                                      <div className="flex items-center gap-2">
                                        <div
                                          className="w-3 h-3 rounded-full border border-border"
                                          style={{ backgroundColor: getColorStyle(color) }}
                                        />
                                        {color}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-nowrap gap-3 overflow-x-auto">
                                {product.sizes.map(size => (
                                  <div key={size} className="flex items-center gap-1.5 flex-shrink-0">
                                    <Label className="text-xs text-muted-foreground w-8">{size}</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      placeholder="0"
                                      value={selection?.quantities[size] || ''}
                                      onChange={(e) => handleQuantityChange(product, size, e.target.value)}
                                      className="w-16 h-8 text-center input-field text-sm"
                                    />
                                  </div>
                                ))}
                              </div>

                              {product.sizesInNumber && product.sizesInNumber.length > 0 && (
                                <div className="flex flex-nowrap gap-3 overflow-x-auto mt-2">
                                  {product.sizesInNumber.map(size => (
                                    <div key={size} className="flex items-center gap-1.5 flex-shrink-0">
                                      <Label className="text-xs text-muted-foreground w-8">{size}</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={selection?.quantities[size] || ''}
                                        onChange={(e) => handleQuantityChangeForSizeInNumber(product, size, e.target.value)}
                                        className="w-16 h-8 text-center input-field text-sm"
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {filteredProducts.length === 0 && (
                    <div className="text-center py-12">
                      <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground">No products found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary Panel */}
            {totalItems > 0 && (
              <div className="w-full">
                <Card>
                  <CardContent className="p-0">
                    {/* Summary Header */}
                    <div className="flex items-center justify-between p-4 border-b">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-accent" />
                        <h3 className="font-semibold text-base">Order Summary</h3>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {totalItems} items
                      </Badge>
                    </div>

                    {/* Summary Items */}
                    <div className="max-h-[400px] overflow-y-auto">
                      {Object.values(selections)
                        .filter(sel => Object.values(sel.quantities).some(q => q > 0))
                        .map((selection) => {
                          const productQty = Object.values(selection.quantities).reduce((s, q) => s + q, 0);
                          const product = products.find(p => p.id === selection.productId);
                          const displayStyle = selection.styleNumber || product?.styleNumber || '';
                          return (
                            <div key={selection.productId} className="p-4 border-b last:border-b-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="min-w-0">
                                  <p className="font-medium text-sm truncate">{selection.productName}</p>
                                  <p className="text-xs text-muted-foreground">{displayStyle}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleRemoveProduct(selection.productId)}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <div
                                  className="w-3 h-3 rounded-full border border-border flex-shrink-0"
                                  style={{ backgroundColor: getColorStyle(selection.selectedColor) }}
                                />
                                <span className="text-xs text-muted-foreground">{selection.selectedColor}</span>
                                <span className="text-xs text-muted-foreground ml-auto">{productQty} pcs</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {Object.entries(selection.quantities)
                                  .filter(([, qty]) => qty > 0)
                                  .map(([size, qty]) => (
                                    <Badge key={size} variant="outline" className="text-xs font-normal py-0.5">
                                      {size}: {qty}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    <Separator />

                    {/* Totals */}
                    <div className="p-4 space-y-2 bg-muted/30">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Line Items</span>
                        <span className="font-medium">{getOrderItems().length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Quantity</span>
                        <span className="font-semibold">{totalItems}</span>
                      </div>
                    </div>

                    <Separator />

                    {/* PO Number & Submit */}
                    <div className="p-4 space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="poNumberSummary" className="text-sm">PO Number <span className="text-destructive">*</span></Label>
                        <Input
                          id="poNumberSummary"
                          placeholder="e.g., PO-2024-001"
                          value={poNumber}
                          onChange={(e) => {
                            setPoNumber(e.target.value);
                            setPoError('');
                          }}
                          className="input-field"
                        />
                        {poError && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {poError}
                          </p>
                        )}
                      </div>

                      <Button
                        onClick={handleSubmitOrder}
                        disabled={isSubmitting}
                        className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                      >
                        {isSubmitting ? (
                          'Processing...'
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Submit
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full text-destructive hover:text-destructive"
                        onClick={() => setSelections({})}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear All
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Order Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md text-center">
          <div className="py-6 space-y-4">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Order Placed Successfully!</h2>
              <p className="text-muted-foreground mt-1">
                Your order has been received and is being processed.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Order ID</span>
                <span className="font-mono font-medium">{lastOrderId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">PO Number</span>
                <span className="font-mono font-medium">{lastPoNumber}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              A confirmation email has been sent to your registered email address.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => setShowConfirmation(false)} className="w-full btn-primary">
                Continue Shopping
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => { setShowConfirmation(false); handleTabChange('orders'); }}
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                View Order History
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
