import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileSpreadsheet, ArrowRight, ArrowLeft, Check, AlertCircle, Plus, Loader2, Package, Building2, CalendarIcon } from 'lucide-react';
import { PricingSupplier, usePricingSuppliers, ColumnMapping } from '@/hooks/usePricingSuppliers';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

interface PricingUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ParsedData {
  headers: string[];
  rows: string[][];
  headerRowIndex: number;
}

interface MappedField {
  systemField: string;
  label: string;
  required: boolean;
  mappedColumn: string | null;
}

type UploadType = 'catalog' | 'supplier' | null;

/** Parse a date value flexibly: ISO, US format, or Excel serial number. Falls back to today. */
function parseFlexibleDate(value: any): string {
  const today = new Date().toISOString().split('T')[0];
  if (value === null || value === undefined || String(value).trim() === '') return today;

  const raw = String(value).trim();

  // Excel serial number (e.g. 45000)
  const num = Number(raw);
  if (!isNaN(num) && num > 30000 && num < 100000) {
    // Excel epoch: Jan 0, 1900 (with the Lotus 123 bug)
    const excelEpoch = new Date(1899, 11, 30);
    const d = new Date(excelEpoch.getTime() + num * 86400000);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  }

  // ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  }

  // US: MM/DD/YYYY or MM-DD-YYYY
  const usParts = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (usParts) {
    const d = new Date(parseInt(usParts[3]), parseInt(usParts[1]) - 1, parseInt(usParts[2]));
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  }

  // DD/MM/YYYY fallback (if month > 12 we know it's DD/MM)
  const euParts = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (euParts && parseInt(euParts[1]) > 12) {
    const d = new Date(parseInt(euParts[3]), parseInt(euParts[2]) - 1, parseInt(euParts[1]));
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  }

  return today;
}

/** Split an array into chunks of a given size */
function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

const CATALOG_FIELDS: MappedField[] = [
  { systemField: 'upc', label: 'UPC Code', required: true, mappedColumn: null },
  { systemField: 'brand', label: 'Brand', required: false, mappedColumn: null },
  { systemField: 'description', label: 'Description', required: false, mappedColumn: null },
  { systemField: 'base_cost', label: 'Your Price', required: false, mappedColumn: null },
  { systemField: 'cogs', label: 'COGS (Cost of Goods)', required: false, mappedColumn: null },
  { systemField: 'target_margin', label: 'Target Margin %', required: false, mappedColumn: null },
];

const SUPPLIER_FIELDS: MappedField[] = [
  { systemField: 'upc', label: 'UPC Code', required: true, mappedColumn: null },
  { systemField: 'brand', label: 'Brand', required: false, mappedColumn: null },
  { systemField: 'description', label: 'Description', required: true, mappedColumn: null },
  { systemField: 'price', label: 'Price', required: true, mappedColumn: null },
  { systemField: 'availability', label: 'Availability', required: false, mappedColumn: null },
  { systemField: 'minOrderQty', label: 'Min Order Qty', required: false, mappedColumn: null },
  { systemField: 'priceType', label: 'Price Type', required: false, mappedColumn: null },
];

const AUTO_MAPPINGS: Record<string, string[]> = {
  upc: ['upc', 'upc code', 'barcode', 'ean', 'sku', 'code', 'item code'],
  brand: ['brand', 'brand name', 'manufacturer', 'vendor'],
  description: ['description', 'desc', 'product', 'name', 'item', 'product name', 'item description'],
  price: ['price', 'unit price', 'amount', 'sell price', 'selling price'],
  base_cost: ['price', 'your price', 'sell price', 'selling price', 'unit price', 'amount'],
  cogs: ['cogs', 'cost', 'cost of goods', 'unit cost', 'your cost', 'purchase price', 'buy price'],
  target_margin: ['margin', 'target margin', 'margin %', 'profit margin'],
  availability: ['avail', 'availability', 'qty', 'stock', 'quantity', 'available'],
  minOrderQty: ['minimum', 'min qty', 'minimum box', 'moq', 'min order'],
  priceType: ['type', 'price type', 'category'],
};

export function PricingUploadDialog({ open, onOpenChange, onSuccess }: PricingUploadDialogProps) {
  const { toast } = useToast();
  const { suppliers, createSupplier, saveColumnMapping } = usePricingSuppliers();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [uploadType, setUploadType] = useState<UploadType>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [fieldMappings, setFieldMappings] = useState<MappedField[]>(SUPPLIER_FIELDS);
  const [saveMapping, setSaveMapping] = useState(true);
  const [effectiveDate, setEffectiveDate] = useState<Date>(new Date());
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStats, setImportStats] = useState<{ new: number; updated: number; errors: number } | null>(null);

  const resetDialog = () => {
    setStep(0);
    setUploadType(null);
    setFile(null);
    setParsedData(null);
    setSelectedSupplier('');
    setNewSupplierName('');
    setShowNewSupplier(false);
    setFieldMappings(SUPPLIER_FIELDS);
    setEffectiveDate(new Date());
    setSaveMapping(true);
    setImporting(false);
    setImportProgress(0);
    setImportStats(null);
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  const handleSelectUploadType = (type: UploadType) => {
    setUploadType(type);
    setFieldMappings(type === 'catalog' ? CATALOG_FIELDS : SUPPLIER_FIELDS);
    setStep(1);
  };

  const parseFile = useCallback(async (uploadedFile: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

        // Find header row (look for common keywords in first 10 rows)
        let headerRowIndex = 0;
        const headerKeywords = ['upc', 'price', 'brand', 'description', 'sku', 'code'];
        
        for (let i = 0; i < Math.min(10, jsonData.length); i++) {
          const row = jsonData[i]?.map(cell => String(cell || '').toLowerCase()) || [];
          const matchCount = row.filter(cell => 
            headerKeywords.some(keyword => cell.includes(keyword))
          ).length;
          
          if (matchCount >= 2) {
            headerRowIndex = i;
            break;
          }
        }

        const headers = (jsonData[headerRowIndex] || []).map(h => String(h || ''));
        const rows = jsonData.slice(headerRowIndex + 1).filter(row => 
          row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
        );

        setParsedData({ headers, rows, headerRowIndex });
        
        // Auto-map columns based on upload type
        const fieldsToMap = uploadType === 'catalog' ? CATALOG_FIELDS : SUPPLIER_FIELDS;
        const autoMapped = fieldsToMap.map(field => {
          const matchPatterns = AUTO_MAPPINGS[field.systemField] || [];
          const matchedIndex = headers.findIndex(header => {
            if (!header || typeof header !== 'string') return false;
            return matchPatterns.some(pattern => 
              header.toLowerCase().includes(pattern.toLowerCase())
            );
          });
          
          return {
            ...field,
            mappedColumn: matchedIndex >= 0 ? String(matchedIndex) : null,
          };
        });

        setFieldMappings(autoMapped);
      } catch (error) {
        console.error('Error parsing file:', error);
        toast({
          title: 'Failed to parse file',
          description: 'Please ensure the file is a valid Excel or CSV file.',
          variant: 'destructive',
        });
      }
    };

    reader.readAsArrayBuffer(uploadedFile);
  }, [toast, uploadType]);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      parseFile(droppedFile);
    }
  }, [parseFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  }, [parseFile]);

  const handleCreateSupplier = async () => {
    if (!newSupplierName.trim()) return;
    
    try {
      const result = await createSupplier.mutateAsync({ name: newSupplierName.trim() });
      setSelectedSupplier(result.id);
      setShowNewSupplier(false);
      setNewSupplierName('');
    } catch (error: any) {
      toast({
        title: 'Failed to create supplier',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleMappingChange = (systemField: string, columnIndex: string | null) => {
    setFieldMappings(prev => 
      prev.map(f => 
        f.systemField === systemField 
          ? { ...f, mappedColumn: columnIndex }
          : f
      )
    );
  };

  const canProceedToStep2 = uploadType === 'catalog' 
    ? (file && parsedData)
    : (file && parsedData && (selectedSupplier || newSupplierName.trim()));
  
  const canProceedToStep3 = fieldMappings
    .filter(f => f.required)
    .every(f => f.mappedColumn !== null);

  const getPreviewValue = (columnIndex: string | null, rowIndex = 0): string => {
    if (columnIndex === null || !parsedData) return '-';
    const value = parsedData.rows[rowIndex]?.[parseInt(columnIndex)];
    return value !== undefined && value !== null ? String(value) : '-';
  };

  const handleImport = async () => {
    if (!parsedData) return;

    setImporting(true);
    setImportProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Build mapping object
      const mapping: Record<string, string> = {};
      fieldMappings.forEach(field => {
        if (field.mappedColumn !== null) {
          mapping[field.systemField] = field.mappedColumn;
        }
      });

      // Save column mapping if requested (only for supplier imports)
      if (saveMapping && uploadType === 'supplier' && selectedSupplier) {
        await saveColumnMapping.mutateAsync({ supplierId: selectedSupplier, mapping: mapping as ColumnMapping });
      }

      let newCount = 0;
      let updateCount = 0;
      let errorCount = 0;

      const fallbackDate = effectiveDate.toISOString().split('T')[0];

      // Pre-fetch alias map for supplier imports
      let aliasMap: Map<string, string> | null = null;
      if (uploadType === 'supplier') {
        const { data: aliases } = await supabase
          .from('pricing_product_aliases')
          .select('alias_upc, product_id');
        aliasMap = new Map((aliases || []).map(a => [a.alias_upc.toLowerCase(), a.product_id]));
      }

      if (uploadType === 'catalog') {
        // --- CATALOG: batch upsert products ---
        const BATCH_SIZE = 100;
        const allRows = parsedData.rows;

        for (let batchStart = 0; batchStart < allRows.length; batchStart += BATCH_SIZE) {
          const batchRows = allRows.slice(batchStart, batchStart + BATCH_SIZE);
          setImportProgress(Math.round((batchStart / allRows.length) * 100));

          const productBatch: any[] = [];
          for (const row of batchRows) {
            const upcIndex = mapping.upc ? parseInt(mapping.upc) : -1;
            const upc = upcIndex >= 0 ? String(row[upcIndex] || '').trim() : '';
            if (!upc) { errorCount++; continue; }

            const productData: any = {
              user_id: user.id,
              upc,
              updated_at: new Date().toISOString(),
            };

            if (mapping.brand) productData.brand = String(row[parseInt(mapping.brand)] || '').trim() || null;
            if (mapping.description) productData.description = String(row[parseInt(mapping.description)] || '').trim() || null;
            if (mapping.base_cost) {
              const costStr = String(row[parseInt(mapping.base_cost)] || '').replace(/[^0-9.]/g, '');
              productData.base_cost = parseFloat(costStr) || null;
            }
            if (mapping.cogs) {
              const cogsStr = String(row[parseInt(mapping.cogs)] || '').replace(/[^0-9.]/g, '');
              productData.cogs = parseFloat(cogsStr) || null;
            }
            if (mapping.target_margin) {
              const marginStr = String(row[parseInt(mapping.target_margin)] || '').replace(/[^0-9.]/g, '');
              productData.target_margin = parseFloat(marginStr) || null;
            }

            productBatch.push(productData);
          }

          if (productBatch.length > 0) {
            const { error } = await supabase
              .from('pricing_products')
              .upsert(productBatch, { onConflict: 'user_id,upc' });
            if (error) {
              errorCount += productBatch.length;
            } else {
              newCount += productBatch.length;
            }
          }
        }
      } else {
        // --- SUPPLIER: batch with alias resolution ---
        if (!selectedSupplier) throw new Error('No supplier selected');

        const BATCH_SIZE = 100;
        const allRows = parsedData.rows;

        // Step 1: Collect all UPCs and resolve products (batch lookup)
        const upcList: string[] = [];
        const rowDataList: { upc: string; row: string[]; effectiveDate: string }[] = [];

        for (const row of allRows) {
          const upcIndex = mapping.upc ? parseInt(mapping.upc) : -1;
          const upc = upcIndex >= 0 ? String(row[upcIndex] || '').trim() : '';
          if (!upc) { errorCount++; continue; }

          const rowEffectiveDate = fallbackDate;

          upcList.push(upc);
          rowDataList.push({ upc, row, effectiveDate: rowEffectiveDate });
        }

        // Step 2: Batch-fetch existing products for all UPCs
        const existingProductMap = new Map<string, string>(); // upc -> product_id
        const upcChunks = chunk(upcList, 200);
        for (const upcChunk of upcChunks) {
          const { data: products } = await supabase
            .from('pricing_products')
            .select('id, upc')
            .eq('user_id', user.id)
            .in('upc', upcChunk);
          (products || []).forEach(p => existingProductMap.set(p.upc, p.id));
        }

        // Step 3: Figure out which UPCs need product creation (not found by canonical or alias)
        const toCreate: { upc: string; brand: string | null; description: string | null }[] = [];
        const resolvedProductIds = new Map<string, string>(); // rowUpc -> product_id

        for (const { upc, row } of rowDataList) {
          let productId = existingProductMap.get(upc);
          // Check alias map
          if (!productId && aliasMap) {
            productId = aliasMap.get(upc.toLowerCase());
          }
          if (productId) {
            resolvedProductIds.set(upc, productId);
          } else {
            // Need to create - collect data
            const brand = mapping.brand ? String(row[parseInt(mapping.brand)] || '').trim() || null : null;
            const description = mapping.description ? String(row[parseInt(mapping.description)] || '').trim() || null : null;
            toCreate.push({ upc, brand, description });
          }
        }

        // Step 4: Batch-create missing products
        const createChunks = chunk(toCreate, BATCH_SIZE);
        for (const createBatch of createChunks) {
          const payload = createBatch.map(p => ({
            user_id: user.id,
            upc: p.upc,
            brand: p.brand,
            description: p.description,
            updated_at: new Date().toISOString(),
          }));

          const { data: created, error } = await supabase
            .from('pricing_products')
            .upsert(payload, { onConflict: 'user_id,upc' })
            .select('id, upc');

          if (!error && created) {
            created.forEach(p => resolvedProductIds.set(p.upc, p.id));
          } else if (error) {
            errorCount += createBatch.length;
          }
        }

        // Step 5: Batch-upsert supplier prices
        const priceBatch: any[] = [];
        for (const { upc, row, effectiveDate } of rowDataList) {
          const productId = resolvedProductIds.get(upc);
          if (!productId) { errorCount++; continue; }

          const priceData: any = {
            product_id: productId,
            supplier_id: selectedSupplier,
            effective_date: effectiveDate,
          };

          if (mapping.price) {
            const priceStr = String(row[parseInt(mapping.price)] || '').replace(/[^0-9.]/g, '');
            priceData.price = parseFloat(priceStr) || 0;
          } else {
            priceData.price = 0;
          }

          if (mapping.availability) {
            priceData.availability = parseInt(String(row[parseInt(mapping.availability)] || '0').replace(/[^0-9]/g, '')) || null;
          }
          if (mapping.minOrderQty) {
            priceData.min_order_qty = parseInt(String(row[parseInt(mapping.minOrderQty)] || '0').replace(/[^0-9]/g, '')) || null;
          }
          if (mapping.priceType) {
            priceData.price_type = String(row[parseInt(mapping.priceType)] || '').trim() || null;
          }

          // Extract country from description if present
          const desc = mapping.description ? String(row[parseInt(mapping.description)] || '') : '';
          const countryMatch = desc.match(/\(([A-Za-z]+)\)\s*$/);
          if (countryMatch) {
            priceData.country = countryMatch[1];
          }

          priceBatch.push(priceData);
        }

        // Upsert prices in chunks
        const priceChunks = chunk(priceBatch, BATCH_SIZE);
        let processedPrices = 0;
        for (const priceChunk of priceChunks) {
          const { error: priceError } = await supabase
            .from('pricing_supplier_prices')
            .upsert(priceChunk, {
              onConflict: 'product_id,supplier_id,country,effective_date',
              ignoreDuplicates: false,
            });

          if (priceError) {
            errorCount += priceChunk.length;
          } else {
            newCount += priceChunk.length;
          }
          processedPrices += priceChunk.length;
          setImportProgress(Math.round((processedPrices / priceBatch.length) * 100));
        }
      }

      // Update supplier last_updated (for supplier imports)
      if (uploadType === 'supplier' && selectedSupplier) {
        await supabase
          .from('pricing_suppliers')
          .update({ last_updated: new Date().toISOString() })
          .eq('id', selectedSupplier);
      }

      setImportProgress(100);
      setImportStats({ new: newCount, updated: updateCount, errors: errorCount });

      toast({
        title: 'Import complete!',
        description: `${newCount} new, ${updateCount} updated, ${errorCount} errors`,
      });

      // Move to step 3 to show results
      setStep(3);
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: 'Import failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-vesta-navy/10 text-vesta-navy [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-vesta-mist/40 [&::-webkit-scrollbar-thumb]:bg-vesta-navy/25 [&::-webkit-scrollbar-thumb]:rounded-full">
        <DialogHeader>
          <DialogTitle className="text-vesta-navy font-[Georgia] text-xl">
            {step === 0 ? 'Import Data' : uploadType === 'catalog' ? 'Import Catalog' : 'Import Supplier Prices'}
            {step > 0 && <Badge variant="outline" className="ml-2 border-vesta-navy/10 text-vesta-navy/65">Step {step}/3</Badge>}
          </DialogTitle>
          <DialogDescription className="text-vesta-navy-muted">
            {step === 0 && 'Choose what type of data you want to import'}
            {step === 1 && (uploadType === 'catalog' ? 'Upload your product catalog with your prices and COGS' : 'Upload supplier pricing and select the supplier')}
            {step === 2 && 'Map your spreadsheet columns to the system fields'}
            {step === 3 && 'Review your import results'}
          </DialogDescription>
        </DialogHeader>

        {/* Step 0: Upload Type Selection */}
        {step === 0 && (
          <div className="py-6">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleSelectUploadType('catalog')}
                className="relative p-6 rounded-xl border-2 border-vesta-navy/10 hover:border-blue-500/50 transition-all text-left group overflow-hidden"
              >
                {/* Layered background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-blue-800/20 to-transparent" />
                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
                <div className="absolute top-2 right-2 w-16 h-16 bg-blue-400/5 rounded-lg rotate-12 group-hover:rotate-6 transition-all" />
                <div className="absolute bottom-2 right-8 w-12 h-12 bg-vesta-mist/40 rounded-lg -rotate-6 group-hover:rotate-0 transition-all" />
                
                <div className="relative">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mb-4 group-hover:bg-blue-500/30 transition-all">
                    <div className="w-5 h-5 rounded bg-blue-400/60" />
                  </div>
                  <h3 className="font-semibold text-vesta-navy mb-1 text-lg">My Catalog</h3>
                  <p className="text-sm text-vesta-navy-muted">
                    Your products with prices, COGS, and target margins
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleSelectUploadType('supplier')}
                className="relative p-6 rounded-xl border-2 border-vesta-navy/10 hover:border-purple-500/50 transition-all text-left group overflow-hidden"
              >
                {/* Layered background */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-purple-800/20 to-transparent" />
                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all" />
                <div className="absolute top-2 right-2 w-16 h-16 bg-purple-400/5 rounded-lg rotate-12 group-hover:rotate-6 transition-all" />
                <div className="absolute bottom-2 right-8 w-12 h-12 bg-vesta-gold/10 rounded-lg -rotate-6 group-hover:rotate-0 transition-all" />
                
                <div className="relative">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mb-4 group-hover:bg-purple-500/30 transition-all">
                    <div className="w-3 h-5 rounded-sm bg-purple-400/60 mr-1" />
                    <div className="w-3 h-5 rounded-sm bg-purple-400/40" />
                  </div>
                  <h3 className="font-semibold text-vesta-navy mb-1 text-lg">Supplier Price List</h3>
                  <p className="text-sm text-vesta-navy-muted">
                    Competitor or supplier pricing for comparison
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="space-y-6 py-4">
            {/* File Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
                ${file ? 'border-primary/50 bg-primary/10' : 'border-vesta-navy/10 hover:border-white/20 bg-white/5'}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {file ? (
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6 text-primary" />
                  </div>
                  <p className="font-medium text-vesta-navy">{file.name}</p>
                  <p className="text-sm text-vesta-navy-muted">
                    {parsedData ? `${parsedData.rows.length} rows detected` : 'Parsing...'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6 text-vesta-navy-muted" />
                  </div>
                  <p className="font-medium text-vesta-navy">Drop your Excel or CSV file here</p>
                  <p className="text-sm text-vesta-navy-muted">or click to browse</p>
                </div>
              )}
            </div>

            {/* Supplier Selection (only for supplier uploads) */}
            {uploadType === 'supplier' && (
              <div className="space-y-3">
                <Label className="text-vesta-navy/60">Supplier</Label>
                
                {showNewSupplier ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter supplier name"
                      value={newSupplierName}
                      onChange={(e) => setNewSupplierName(e.target.value)}
                      autoFocus
                      className="bg-white/5 border-vesta-navy/10 text-vesta-navy placeholder:text-vesta-navy/65"
                    />
                    <Button 
                      onClick={handleCreateSupplier}
                      disabled={!newSupplierName.trim() || createSupplier.isPending}
                      className="bg-white text-black hover:bg-vesta-mist/50"
                    >
                      {createSupplier.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                    </Button>
                    <Button variant="ghost" onClick={() => setShowNewSupplier(false)} className="text-vesta-navy-muted hover:text-vesta-navy hover:bg-white/10">
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                      <SelectTrigger className="flex-1 bg-white/5 border-vesta-navy/10 text-vesta-navy">
                        <SelectValue placeholder="Select a supplier" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-vesta-navy/10">
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id} className="text-vesta-navy/60 focus:bg-white/10 focus:text-vesta-navy">
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => setShowNewSupplier(true)} className="border-vesta-navy/10 text-vesta-navy/60 hover:bg-white/10 bg-transparent">
                      <Plus className="w-4 h-4 mr-1" />
                      New
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Effective Date */}
            <div className="space-y-3">
              <Label className="text-vesta-navy/60">Effective Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-white/5 border-vesta-navy/10 text-vesta-navy hover:bg-white/10 hover:text-vesta-navy",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-vesta-navy-muted" />
                    {format(effectiveDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white border-vesta-navy/10" align="start">
                  <Calendar
                    mode="single"
                    selected={effectiveDate}
                    onSelect={(date) => date && setEffectiveDate(date)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-vesta-navy/65">The date these prices are effective. Defaults to today.</p>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(0)} className="border-vesta-navy/10 text-vesta-navy/60 hover:bg-white/10 bg-transparent">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={() => setStep(2)} 
                disabled={!canProceedToStep2}
                className="bg-white text-black hover:bg-vesta-mist/50"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === 2 && parsedData && (
          <div className="space-y-6 py-4">
            <p className="text-sm text-vesta-navy-muted">
              Match each field to a column from your file:
            </p>

            <div className="space-y-3">
              {fieldMappings.map((field) => (
                <div 
                  key={field.systemField}
                  className="grid grid-cols-3 gap-4 items-center p-3 rounded-lg border border-vesta-navy/10 bg-white/5"
                >
                  <div>
                    <p className="font-medium text-sm text-vesta-navy">
                      {field.label}
                      {field.required && <span className="text-red-400 ml-1">*</span>}
                    </p>
                  </div>
                  
                  <Select 
                    value={field.mappedColumn || 'unmapped'}
                    onValueChange={(v) => handleMappingChange(field.systemField, v === 'unmapped' ? null : v)}
                  >
                    <SelectTrigger className="bg-white/5 border-vesta-navy/10 text-vesta-navy">
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-vesta-navy/10">
                      <SelectItem value="unmapped" className="text-vesta-navy-muted focus:bg-white/10 focus:text-vesta-navy">-- Not mapped --</SelectItem>
                      {parsedData.headers.map((header, index) => (
                        <SelectItem key={index} value={String(index)} className="text-vesta-navy/60 focus:bg-white/10 focus:text-vesta-navy">
                          {header || `Column ${index + 1}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="text-sm text-vesta-navy/65 truncate">
                    {getPreviewValue(field.mappedColumn)}
                  </div>
                </div>
              ))}
            </div>

            {uploadType === 'supplier' && (
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox 
                  checked={saveMapping} 
                  onCheckedChange={(checked) => setSaveMapping(checked === true)}
                  className="border-white/20"
                />
                <span className="text-sm text-vesta-navy-muted">
                  Save this mapping for future imports
                </span>
              </label>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)} className="border-vesta-navy/10 text-vesta-navy/60 hover:bg-white/10 bg-transparent">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handleImport}
                disabled={!canProceedToStep3 || importing}
                className="bg-white text-black hover:bg-vesta-mist/50"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    Import {parsedData.rows.length} {uploadType === 'catalog' ? 'Products' : 'Prices'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>

            {importing && (
              <div className="space-y-2">
                <Progress value={importProgress} className="bg-white/10" />
                <p className="text-xs text-center text-vesta-navy/65">
                  {importProgress}% complete
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && importStats && (
          <div className="space-y-6 py-4">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-vesta-navy">Import Complete!</h3>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-emerald-500/10 p-4 rounded-xl text-center border border-emerald-500/20">
                <p className="text-2xl font-bold text-emerald-400">{importStats.new}</p>
                <p className="text-sm text-emerald-300/70">New</p>
              </div>
              <div className="bg-blue-500/10 p-4 rounded-xl text-center border border-blue-500/20">
                <p className="text-2xl font-bold text-blue-400">{importStats.updated}</p>
                <p className="text-sm text-blue-300/70">Updated</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl text-center border border-vesta-navy/10">
                <p className="text-2xl font-bold text-vesta-navy-muted">{importStats.errors}</p>
                <p className="text-sm text-vesta-navy/65">Errors</p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={resetDialog} className="border-vesta-navy/10 text-vesta-navy/60 hover:bg-white/10 bg-transparent">
                Import Another
              </Button>
              <Button onClick={() => { handleClose(); onSuccess(); }} className="bg-white text-black hover:bg-vesta-mist/50">
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
