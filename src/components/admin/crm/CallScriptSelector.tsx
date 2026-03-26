import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { CallScript } from '@/types/crm';
import { FileText, Eye } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CallScriptSelectorProps {
  onSelectScript: (script: CallScript | null) => void;
  selectedScript: CallScript | null;
}

export const CallScriptSelector = ({ onSelectScript, selectedScript }: CallScriptSelectorProps) => {
  const [scripts, setScripts] = useState<CallScript[]>([]);
  const [previewScript, setPreviewScript] = useState<CallScript | null>(null);

  useEffect(() => {
    loadScripts();
  }, []);

  const loadScripts = async () => {
    try {
      const { data, error } = await supabase
        .from('crm_call_scripts')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setScripts(data || []);
    } catch (error) {
      console.error('Error loading scripts:', error);
    }
  };

  return (
    <div className="flex gap-2">
      <Select
        value={selectedScript?.id || 'none'}
        onValueChange={(value) => {
          if (value === 'none') {
            onSelectScript(null);
          } else {
            const script = scripts.find(s => s.id === value);
            onSelectScript(script || null);
          }
        }}
      >
        <SelectTrigger className="flex-1">
          <FileText className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Select a call script" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No Script</SelectItem>
          {scripts.map((script) => (
            <SelectItem key={script.id} value={script.id}>
              {script.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedScript && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon">
              <Eye className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[500px]">
            <div className="space-y-2">
              <h4 className="font-semibold">{selectedScript.name}</h4>
              {selectedScript.description && (
                <p className="text-sm text-muted-foreground">{selectedScript.description}</p>
              )}
              <ScrollArea className="h-[300px] w-full rounded border p-4">
                <p className="text-sm whitespace-pre-wrap">{selectedScript.script_content}</p>
              </ScrollArea>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};
