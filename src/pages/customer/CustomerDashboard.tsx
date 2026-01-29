import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { mockProducts } from '@/data/mockData';
import { Product, OrderItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LogOut, Search, Package, Send, CheckCircle, AlertCircle, ShoppingCart, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

interface ProductSelection {
  productId: string;
  productName: string;
  styleNumber: string;
  selectedColor: string;
  quantities: Record<string, number>;
}

export default function CustomerDashboard() {
  const { user, logout, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selections, setSelections] = useState<Record<string, ProductSelection>>({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [poNumber, setPoNumber] = useState('');
  const [poError, setPoError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastOrderId, setLastOrderId] = useState('');
  const [lastPoNumber, setLastPoNumber] = useState('');

  if (!isAuthenticated || user?.role !== 'customer') {
    return <Navigate to="/login/customer" replace />;
  }

  const filteredProducts = mockProducts.filter(product =>
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

  const handleStyleChange = (product: Product, value: string) => {
    setSelections(prev => ({
      ...prev,
      [product.id]: {
        productId: product.id,
        productName: product.name,
        styleNumber: value,
        selectedColor: prev[product.id]?.selectedColor || product.colors[0],
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
        quantities: {
          ...currentSelection.quantities,
          [size]: qty
        }
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
        quantities: {
          ...currentSelection.quantities,
          [size]: qty
        }
      }
    }));
  };

  const getOrderItems = (): OrderItem[] => {
    const items: OrderItem[] = [];
    Object.values(selections).forEach(selection => {
      const product = mockProducts.find(p => p.id === selection.productId);
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
    await new Promise(resolve => setTimeout(resolve, 1500));

    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    setLastOrderId(orderId);
    setLastPoNumber(poNumber);

    // Reset
    setSelections({});
    setPoNumber('');
    setPoError('');
    setShowConfirmation(true);
    setIsSubmitting(false);

    toast.success('Order placed successfully!');
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
              {totalItems > 0 && (
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
        </div>
      </header>

      {/* Main Content */}
      <main className="content-container">
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

        <div className="space-y-6">
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
                                {/* <p className="text-sm text-muted-foreground">{product.styleNumber}</p> */}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              placeholder=''
                              value={selection?.styleNumber || ''}
                              onChange={(e) => handleStyleChange(product, e.target.value)}
                              className="input-field text-sm"
                            />
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
                        const product = mockProducts.find(p => p.id === selection.productId);
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
            <Button onClick={() => setShowConfirmation(false)} className="w-full btn-primary">
              Continue Shopping
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
