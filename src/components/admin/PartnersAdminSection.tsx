import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type PartnerRow = Database['public']['Tables']['partners']['Row'];
type ProductRow = Database['public']['Tables']['partner_products']['Row'];

const PARTNER_CATEGORIES = [
  'linen_laundry',
  'energy',
  'payroll',
  'pos',
  'revenue_management',
  'channel_manager',
  'pms',
  'insurance',
  'supplies',
  'marketing',
  'technology',
] as const;

const emptyPartner = {
  slug: '',
  name: '',
  category: 'supplies' as (typeof PARTNER_CATEGORIES)[number],
  tagline: '',
  description: '',
  website_url: '',
  sort_order: 0,
  is_featured: false,
  is_active: true,
};

export function PartnersAdminSection() {
  const { toast } = useToast();
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [partnerOpen, setPartnerOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [partnerForm, setPartnerForm] = useState(emptyPartner);
  const [productForm, setProductForm] = useState({
    partner_id: '',
    name: '',
    description: '',
    product_url: '',
    category: '',
    sort_order: 0,
    is_active: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: p, error: e1 }, { data: pr, error: e2 }] = await Promise.all([
        supabase.from('partners').select('*').order('sort_order').order('name'),
        supabase.from('partner_products').select('*').order('sort_order'),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      setPartners(p ?? []);
      setProducts(pr ?? []);
    } catch (e: unknown) {
      console.error(e);
      toast({
        title: 'Failed to load partners',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const savePartner = async () => {
    if (!partnerForm.slug.trim() || !partnerForm.name.trim()) {
      toast({ title: 'Slug and name are required', variant: 'destructive' });
      return;
    }
    try {
      const { error } = await supabase.from('partners').insert({
        slug: partnerForm.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, ''),
        name: partnerForm.name.trim(),
        category: partnerForm.category,
        tagline: partnerForm.tagline || null,
        description: partnerForm.description || null,
        website_url: partnerForm.website_url || null,
        sort_order: partnerForm.sort_order,
        is_featured: partnerForm.is_featured,
        is_active: partnerForm.is_active,
      });
      if (error) throw error;
      toast({ title: 'Partner created' });
      setPartnerOpen(false);
      setPartnerForm(emptyPartner);
      await load();
    } catch (e: unknown) {
      toast({
        title: 'Save failed',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const saveProduct = async () => {
    if (!productForm.partner_id || !productForm.name.trim()) {
      toast({ title: 'Partner and product name required', variant: 'destructive' });
      return;
    }
    try {
      const { error } = await supabase.from('partner_products').insert({
        partner_id: productForm.partner_id,
        name: productForm.name.trim(),
        description: productForm.description || null,
        product_url: productForm.product_url || null,
        category: productForm.category || null,
        sort_order: productForm.sort_order,
        is_active: productForm.is_active,
      });
      if (error) throw error;
      toast({ title: 'Product line added' });
      setProductOpen(false);
      setProductForm({
        partner_id: productForm.partner_id,
        name: '',
        description: '',
        product_url: '',
        category: '',
        sort_order: 0,
        is_active: true,
      });
      await load();
    } catch (e: unknown) {
      toast({
        title: 'Save failed',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Remove this product line?')) return;
    try {
      const { error } = await supabase.from('partner_products').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Product removed' });
      await load();
    } catch (e: unknown) {
      toast({
        title: 'Delete failed',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const togglePartnerActive = async (row: PartnerRow, next: boolean) => {
    try {
      const { error } = await supabase.from('partners').update({ is_active: next }).eq('id', row.id);
      if (error) throw error;
      await load();
    } catch (e: unknown) {
      toast({
        title: 'Update failed',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Partner marketplace</h2>
          <p className="text-sm text-slate-600">Manage featured vendors and product lines shown on /partners and in the hotel app.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => load()} disabled={loading}>
            <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          </Button>
          <Button type="button" size="sm" onClick={() => setPartnerOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add partner
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              setProductForm((f) => ({
                ...f,
                partner_id: partners[0]?.id ?? '',
              }));
              setProductOpen(true);
            }}
            disabled={!partners.length}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add product line
          </Button>
        </div>
      </div>

      {loading && !partners.length ? (
        <div className="flex justify-center py-12 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-slate-900">Partners</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 hover:bg-transparent">
                  <TableHead className="text-slate-600">Name</TableHead>
                  <TableHead className="text-slate-600">Slug</TableHead>
                  <TableHead className="text-slate-600">Category</TableHead>
                  <TableHead className="text-slate-600">Active</TableHead>
                  <TableHead className="text-right text-slate-600">Products</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.map((p) => (
                  <TableRow key={p.id} className="border-slate-200">
                    <TableCell className="font-medium text-slate-900">{p.name}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-600">{p.slug}</TableCell>
                    <TableCell className="text-slate-600">{p.category}</TableCell>
                    <TableCell>
                      <Switch
                        checked={p.is_active !== false}
                        onCheckedChange={(v) => togglePartnerActive(p, v)}
                      />
                    </TableCell>
                    <TableCell className="text-right text-slate-600">
                      {products.filter((x) => x.partner_id === p.id).length}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-slate-900">Product lines</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 hover:bg-transparent">
                <TableHead className="text-slate-600">Partner</TableHead>
                <TableHead className="text-slate-600">Name</TableHead>
                <TableHead className="text-slate-600">URL</TableHead>
                <TableHead className="w-24 text-slate-600" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((pr) => {
                const pn = partners.find((x) => x.id === pr.partner_id)?.name ?? pr.partner_id;
                return (
                  <TableRow key={pr.id} className="border-slate-200">
                    <TableCell className="text-sm text-slate-600">{pn}</TableCell>
                    <TableCell className="text-slate-900">{pr.name}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-slate-500">
                      {pr.product_url ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Button type="button" variant="ghost" size="icon" onClick={() => deleteProduct(pr.id)}>
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={partnerOpen} onOpenChange={setPartnerOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-slate-200 bg-white text-slate-900">
          <DialogHeader>
            <DialogTitle>Add partner</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>Slug</Label>
              <Input
                value={partnerForm.slug}
                onChange={(e) => setPartnerForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="acme-supplies"
                className="border-slate-200 bg-white"
              />
            </div>
            <div>
              <Label>Name</Label>
              <Input
                value={partnerForm.name}
                onChange={(e) => setPartnerForm((f) => ({ ...f, name: e.target.value }))}
                className="border-slate-200 bg-white"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={partnerForm.category}
                onValueChange={(v) =>
                  setPartnerForm((f) => ({ ...f, category: v as (typeof PARTNER_CATEGORIES)[number] }))
                }
              >
                <SelectTrigger className="border-slate-200 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PARTNER_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tagline</Label>
              <Input
                value={partnerForm.tagline}
                onChange={(e) => setPartnerForm((f) => ({ ...f, tagline: e.target.value }))}
                className="border-slate-200 bg-white"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={partnerForm.description}
                onChange={(e) => setPartnerForm((f) => ({ ...f, description: e.target.value }))}
                className="min-h-[80px] border-slate-200 bg-white"
              />
            </div>
            <div>
              <Label>Website URL</Label>
              <Input
                value={partnerForm.website_url}
                onChange={(e) => setPartnerForm((f) => ({ ...f, website_url: e.target.value }))}
                placeholder="https://"
                className="border-slate-200 bg-white"
              />
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <Label>Sort order</Label>
                <Input
                  type="number"
                  value={partnerForm.sort_order}
                  onChange={(e) => setPartnerForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))}
                  className="border-slate-200 bg-white"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={partnerForm.is_featured}
                  onCheckedChange={(v) => setPartnerForm((f) => ({ ...f, is_featured: v }))}
                />
                <Label>Featured</Label>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={partnerForm.is_active}
                  onCheckedChange={(v) => setPartnerForm((f) => ({ ...f, is_active: v }))}
                />
                <Label>Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPartnerOpen(false)}>
              Cancel
            </Button>
            <Button onClick={savePartner}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={productOpen} onOpenChange={setProductOpen}>
        <DialogContent className="border-slate-200 bg-white text-slate-900">
          <DialogHeader>
            <DialogTitle>Add product line</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>Partner</Label>
              <Select
                value={productForm.partner_id}
                onValueChange={(v) => setProductForm((f) => ({ ...f, partner_id: v }))}
              >
                <SelectTrigger className="border-slate-200 bg-white">
                  <SelectValue placeholder="Select partner" />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Name</Label>
              <Input
                value={productForm.name}
                onChange={(e) => setProductForm((f) => ({ ...f, name: e.target.value }))}
                className="border-slate-200 bg-white"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={productForm.description}
                onChange={(e) => setProductForm((f) => ({ ...f, description: e.target.value }))}
                className="min-h-[72px] border-slate-200 bg-white"
              />
            </div>
            <div>
              <Label>Product URL</Label>
              <Input
                value={productForm.product_url}
                onChange={(e) => setProductForm((f) => ({ ...f, product_url: e.target.value }))}
                className="border-slate-200 bg-white"
              />
            </div>
            <div>
              <Label>Category label (optional)</Label>
              <Input
                value={productForm.category}
                onChange={(e) => setProductForm((f) => ({ ...f, category: e.target.value }))}
                className="border-slate-200 bg-white"
              />
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <Label>Sort order</Label>
                <Input
                  type="number"
                  value={productForm.sort_order}
                  onChange={(e) => setProductForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))}
                  className="border-slate-200 bg-white"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={productForm.is_active}
                  onCheckedChange={(v) => setProductForm((f) => ({ ...f, is_active: v }))}
                />
                <Label>Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveProduct}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
