import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { parseCSV, parseXLSX, downloadTemplate } from '@/lib/crm/csvParser';
import { validateContacts } from '@/lib/crm/contactValidator';
import { ParsedContact } from '@/lib/crm/types';
import { Upload, Download, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type ImportStep = 'upload' | 'preview' | 'importing' | 'complete';

export const BulkImportDialog = ({ open, onOpenChange, onSuccess }: BulkImportDialogProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [contacts, setContacts] = useState<ParsedContact[]>([]);
  const [duplicateHandling, setDuplicateHandling] = useState<'skip' | 'update' | 'create_new'>('skip');
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{
    successful: number;
    failed: number;
    errors: Array<{ row: number; message: string }>;
  } | null>(null);
  const [validationErrors, setValidationErrors] = useState<Array<{ row: number; field: string; message: string }>>([]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    
    try {
      let parseResult;
      if (selectedFile.name.endsWith('.csv')) {
        parseResult = await parseCSV(selectedFile);
      } else if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        parseResult = await parseXLSX(selectedFile);
      } else {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload a CSV or Excel file.',
          variant: 'destructive'
        });
        return;
      }

      if (parseResult.data.length === 0) {
        toast({
          title: 'No Data',
          description: 'The file contains no valid contact data.',
          variant: 'destructive'
        });
        return;
      }

      // Validate contacts
      const validation = validateContacts(parseResult.data);
      setValidationErrors(validation.errors);
      setContacts(parseResult.data);
      setStep('preview');

      if (!validation.isValid) {
        toast({
          title: 'Validation Errors',
          description: `Found ${validation.errors.length} validation errors. Please review before importing.`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      toast({
        title: 'Parse Error',
        description: 'Failed to parse the file. Please check the format.',
        variant: 'destructive'
      });
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setStep('importing');
    setProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('crm-bulk-import', {
        body: {
          contacts,
          fileName: file?.name || 'unknown.csv',
          duplicateHandling
        }
      });

      if (error) throw error;

      setResults(data);
      setStep('complete');
      
      toast({
        title: 'Import Complete',
        description: `Successfully imported ${data.successful} contacts. ${data.failed} failed.`,
      });

      if (data.successful > 0) {
        onSuccess?.();
      }
    } catch (error) {
      console.error('Error importing contacts:', error);
      toast({
        title: 'Import Failed',
        description: 'Failed to import contacts. Please try again.',
        variant: 'destructive'
      });
      setStep('preview');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setStep('upload');
    setFile(null);
    setContacts([]);
    setValidationErrors([]);
    setResults(null);
    setProgress(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Bulk Import Contacts</DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-12 w-12 mb-4 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">CSV or Excel file (XLSX, XLS)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                />
              </label>
            </div>

            <div className="flex items-center justify-center">
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>

            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Upload a CSV or Excel file with your contacts. Make sure to include at least: email or phone, and last name or company.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Found {validationErrors.length} validation error(s). Review and fix before importing.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Duplicate Handling</Label>
              <Select value={duplicateHandling} onValueChange={(value: any) => setDuplicateHandling(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="skip">Skip Duplicates</SelectItem>
                  <SelectItem value="update">Update Existing</SelectItem>
                  <SelectItem value="create_new">Create Anyway</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <h4 className="font-medium mb-2">Preview (first 10 contacts)</h4>
              <ScrollArea className="h-[300px] border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.slice(0, 10).map((contact, idx) => {
                      const displayName = contact.first_name || contact.last_name 
                        ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
                        : contact.company || 'Unnamed';
                      
                      return (
                        <TableRow key={idx}>
                          <TableCell>{displayName}</TableCell>
                          <TableCell>{contact.email}</TableCell>
                          <TableCell>{contact.phone}</TableCell>
                          <TableCell>{contact.company}</TableCell>
                          <TableCell>{contact.status}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
              <p className="text-sm text-muted-foreground mt-2">
                Total contacts to import: {contacts.length}
              </p>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="space-y-6 py-8">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium">Importing contacts...</p>
              <p className="text-sm text-muted-foreground">Please wait while we process your import</p>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {step === 'complete' && results && (
          <div className="space-y-6">
            <Alert className={results.failed === 0 ? 'border-green-500' : 'border-yellow-500'}>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Import complete! Successfully imported {results.successful} contacts.
                {results.failed > 0 && ` ${results.failed} contacts failed.`}
              </AlertDescription>
            </Alert>

            {results.errors.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Errors</h4>
                <ScrollArea className="h-[200px] border rounded-lg p-4">
                  {results.errors.map((error, idx) => (
                    <div key={idx} className="text-sm text-destructive mb-1">
                      Row {error.row}: {error.message}
                    </div>
                  ))}
                </ScrollArea>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={validationErrors.length > 0}>
                Import {contacts.length} Contacts
              </Button>
            </>
          )}
          {step === 'complete' && (
            <Button onClick={handleClose}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
