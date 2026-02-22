import React, { useState, useEffect } from 'react';
import { fetchCustomers, createCustomer, updateCustomer, fetchProducts, fetchCustomerProductIds, setCustomerProducts } from '@/services/api';
import { User, Product } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Search, Edit, Users, Building2, Share2, Copy, Check, Loader2, Package, LayoutGrid } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AdminCustomers() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [shareCredentialsUser, setShareCredentialsUser] = useState<(User & { password?: string }) | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Product access state
  const [productAccessUser, setProductAccessUser] = useState<User | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [productAccessLoading, setProductAccessLoading] = useState(false);
  const [productAccessSaving, setProductAccessSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    password: ''
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      const data = await fetchCustomers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAddDialog = () => {
    setEditingUser(null);
    const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-2).toUpperCase();
    setFormData({ name: '', email: '', company: '', password: generatedPassword });
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      company: user.company || '',
      password: ''
    });
    setIsDialogOpen(true);
  };

  const openProductAccessDialog = async (user: User) => {
    setProductAccessUser(user);
    setProductAccessLoading(true);
    try {
      const [products, assignedIds] = await Promise.all([
        fetchProducts(),
        fetchCustomerProductIds(user.id),
      ]);
      setAllProducts(products);
      setSelectedProductIds(new Set(assignedIds));
    } catch (err) {
      toast.error('Failed to load product access data');
    } finally {
      setProductAccessLoading(false);
    }
  };

  const toggleProduct = (productId: string) => {
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedProductIds.size === allProducts.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(allProducts.map(p => p.id)));
    }
  };

  const handleSaveProductAccess = async () => {
    if (!productAccessUser) return;
    setProductAccessSaving(true);
    try {
      await setCustomerProducts(productAccessUser.id, Array.from(selectedProductIds));
      toast.success(`Product access updated for ${productAccessUser.name}`);
      setProductAccessUser(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update product access');
    } finally {
      setProductAccessSaving(false);
    }
  };

  const generatePassword = () => {
    const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-2).toUpperCase();
    setFormData(prev => ({ ...prev, password: newPassword }));
    toast.success('New password generated');
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success(`${field} copied to clipboard`);
  };

  const handleOpenShareCredentials = (user: User) => {
    setShareCredentialsUser({ ...user, password: formData.password || 'customer123' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingUser) {
        const updated = await updateCustomer(editingUser.id, {
          name: formData.name,
          email: formData.email,
          company: formData.company || undefined,
        });
        setUsers(prev => prev.map(u => u.id === editingUser.id ? updated : u));
        toast.success('Customer updated successfully');
      } else {
        const created = await createCustomer({
          name: formData.name,
          email: formData.email,
          company: formData.company || undefined,
          password: formData.password,
        });
        setUsers(prev => [...prev, created]);
        setShareCredentialsUser({ ...created, password: formData.password });
        toast.success('Customer account created successfully');
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save customer');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage customer accounts</p>
        </div>
        <Button onClick={openAddDialog} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Customers ({filteredUsers.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 input-field"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="table-header">
                <TableHead>Customer</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-28"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(user => (
                <TableRow key={user.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.company ? (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        {user.company}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge className="badge-success">Active</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(user.createdAt, 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Manage Product Access"
                        onClick={() => openProductAccessDialog(user)}
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Share Credentials"
                        onClick={() => handleOpenShareCredentials(user)}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(user)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No customers found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Product Access Dialog ── */}
      <Dialog open={!!productAccessUser} onOpenChange={(open) => { if (!open) setProductAccessUser(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Product Access — {productAccessUser?.name}
            </DialogTitle>
          </DialogHeader>

          {productAccessLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {selectedProductIds.size} of {allProducts.length} products selected
                  </p>
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    {selectedProductIds.size === allProducts.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>

                <div className="border rounded-lg divide-y max-h-80 overflow-y-auto">
                  {allProducts.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No products available</p>
                    </div>
                  ) : (
                    allProducts.map(product => {
                      const checked = selectedProductIds.has(product.id);
                      return (
                        <label
                          key={product.id}
                          className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/40 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleProduct(product.id)}
                            className="w-4 h-4 accent-primary"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{product.styleNumber}</p>
                          </div>
                          {checked && (
                            <span className="text-xs text-primary font-medium">Visible</span>
                          )}
                        </label>
                      );
                    })
                  )}
                </div>

                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-xs text-amber-800">
                    Only checked products will appear in this customer's catalog. If no products are selected, the customer will see an empty catalog.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setProductAccessUser(null)}>
                  Cancel
                </Button>
                <Button className="btn-primary" onClick={handleSaveProductAccess} disabled={productAccessSaving}>
                  {productAccessSaving ? 'Saving...' : 'Save Access'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Customer Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Edit Customer' : 'Create Customer Account'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., John Smith"
                className="input-field"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="e.g., john@company.com"
                className="input-field"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company Name (optional)</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                placeholder="e.g., ABC Distributors"
                className="input-field"
              />
            </div>

            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="password">Login Password</Label>
                <div className="flex gap-2">
                  <Input
                    id="password"
                    type="text"
                    value={formData.password}
                    readOnly
                    className="input-field font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generatePassword}
                    className="flex-shrink-0"
                  >
                    Regenerate
                  </Button>
                </div>
              </div>
            )}

            {!editingUser && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">
                  Customer account created. Share credentials using the Share button in the customer list.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : editingUser ? 'Save Changes' : 'Create Account'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Share Credentials Dialog */}
      <Dialog open={!!shareCredentialsUser} onOpenChange={() => setShareCredentialsUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Credentials</DialogTitle>
          </DialogHeader>
          {shareCredentialsUser && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Customer Name</Label>
                  <p className="font-medium">{shareCredentialsUser.name}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Email Address</Label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareCredentialsUser.email}
                      readOnly
                      className="flex-1 px-3 py-2 border border-border rounded-md font-mono text-sm bg-muted"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(shareCredentialsUser.email, 'Email')}
                    >
                      {copiedField === 'Email' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Password</Label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareCredentialsUser.password || 'customer123'}
                      readOnly
                      className="flex-1 px-3 py-2 border border-border rounded-md font-mono text-sm bg-muted"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(shareCredentialsUser.password || 'customer123', 'Password')}
                    >
                      {copiedField === 'Password' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-900">
                  Share these credentials securely with the customer. They can login at the customer portal.
                </p>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    const credentialText = `Email: ${shareCredentialsUser.email}\nPassword: ${shareCredentialsUser.password || 'customer123'}`;
                    copyToClipboard(credentialText, 'Credentials');
                  }}
                >
                  Copy All Credentials
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
