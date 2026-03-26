import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, FileText, Image as ImageIcon, Type, FileUp, ChevronUp, ChevronDown, Clipboard, Code } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import RichTextEditor from './RichTextEditor';

export type ContentBlock = {
  id: string;
  type: 'title' | 'text' | 'image' | 'document' | 'embed';
  content: string;
  metadata?: {
    fileName?: string;
    fileSize?: number;
    alt?: string;
  };
};

export type TrainingSection = {
  id: string;
  title: string;
  blocks: ContentBlock[];
};

export type TrainingContent = {
  sections: TrainingSection[];
};

interface ContentBlockEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  sections?: TrainingSection[];
  onSectionsChange?: (sections: TrainingSection[]) => void;
}

export default function ContentBlockEditor({ blocks, onChange, sections: initialSections, onSectionsChange }: ContentBlockEditorProps) {
  const [sections, setSections] = useState<TrainingSection[]>(
    initialSections || [{ id: crypto.randomUUID(), title: 'Section 1', blocks: blocks }]
  );
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [uploading, setUploading] = useState<string | null>(null);
  const pasteAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (onSectionsChange) {
      onSectionsChange(sections);
    } else {
      // Legacy mode: flatten all blocks from all sections
      const allBlocks = sections.flatMap(s => s.blocks);
      onChange(allBlocks);
    }
  }, [sections]);

  const currentSection = sections[currentSectionIndex];

  const addSection = () => {
    const newSection: TrainingSection = {
      id: crypto.randomUUID(),
      title: `Section ${sections.length + 1}`,
      blocks: [],
    };
    setSections([...sections, newSection]);
    setCurrentSectionIndex(sections.length);
  };

  const updateSectionTitle = (index: number, title: string) => {
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], title };
    setSections(newSections);
  };

  const deleteSection = (index: number) => {
    if (sections.length === 1) {
      toast.error('Cannot delete the last section');
      return;
    }
    const newSections = sections.filter((_, i) => i !== index);
    setSections(newSections);
    if (currentSectionIndex >= newSections.length) {
      setCurrentSectionIndex(newSections.length - 1);
    }
  };

  const addBlock = (type: ContentBlock['type']) => {
    const newBlock: ContentBlock = {
      id: crypto.randomUUID(),
      type,
      content: '',
    };
    const newSections = [...sections];
    newSections[currentSectionIndex] = {
      ...currentSection,
      blocks: [...currentSection.blocks, newBlock],
    };
    setSections(newSections);
  };

  const updateBlock = (id: string, content: string, metadata?: ContentBlock['metadata']) => {
    const newSections = [...sections];
    newSections[currentSectionIndex] = {
      ...currentSection,
      blocks: currentSection.blocks.map((block) =>
        block.id === id ? { ...block, content, metadata } : block
      ),
    };
    setSections(newSections);
  };

  const deleteBlock = (id: string) => {
    const newSections = [...sections];
    newSections[currentSectionIndex] = {
      ...currentSection,
      blocks: currentSection.blocks.filter((block) => block.id !== id),
    };
    setSections(newSections);
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...currentSection.blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    const newSections = [...sections];
    newSections[currentSectionIndex] = { ...currentSection, blocks: newBlocks };
    setSections(newSections);
  };

  const handleFileUpload = async (blockId: string, file: File, type: 'image' | 'document') => {
    try {
      setUploading(blockId);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${type}s/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('training-materials')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('training-materials')
        .getPublicUrl(filePath);

      updateBlock(blockId, data.publicUrl, {
        fileName: file.name,
        fileSize: file.size,
      });
      toast.success(`${type === 'image' ? 'Image' : 'Document'} uploaded successfully`);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(`Failed to upload ${type}`);
    } finally {
      setUploading(null);
    }
  };

  const handlePaste = async (blockId: string, e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await handleFileUpload(blockId, file, 'image');
          toast.success('Image pasted from clipboard');
        }
      }
    }
  };

  const getBlockIcon = (type: ContentBlock['type']) => {
    switch (type) {
      case 'title':
        return <Type className="h-4 w-4" />;
      case 'text':
        return <FileText className="h-4 w-4" />;
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'document':
        return <FileUp className="h-4 w-4" />;
      case 'embed':
        return <Code className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="flex items-center gap-2 pb-4 border-b">
        <div className="flex gap-1 flex-wrap flex-1">
          {sections.map((section, index) => (
            <Button
              key={section.id}
              type="button"
              variant={index === currentSectionIndex ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentSectionIndex(index)}
              className="h-8 text-xs"
            >
              {section.title}
            </Button>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSection}
          className="h-8 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Section
        </Button>
      </div>

      {/* Section Title Editor */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Section Title</Label>
        <div className="flex gap-2">
          <Input
            value={currentSection.title}
            onChange={(e) => updateSectionTitle(currentSectionIndex, e.target.value)}
            placeholder="Enter section title..."
            className="text-sm h-9"
          />
          {sections.length > 1 && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => deleteSection(currentSectionIndex)}
              className="h-9"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content Blocks */}
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addBlock('title')}
            className="h-8 text-xs"
          >
            <Type className="h-3 w-3 mr-1" />
            Add Title
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addBlock('text')}
            className="h-8 text-xs"
          >
            <FileText className="h-3 w-3 mr-1" />
            Add Text
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addBlock('image')}
            className="h-8 text-xs"
          >
            <ImageIcon className="h-3 w-3 mr-1" />
            Add Image
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addBlock('document')}
            className="h-8 text-xs"
          >
            <FileUp className="h-3 w-3 mr-1" />
            Add Document
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addBlock('embed')}
            className="h-8 text-xs"
          >
            <Code className="h-3 w-3 mr-1" />
            Add Embed
          </Button>
        </div>

        {currentSection.blocks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No content blocks in this section. Click the buttons above to add content.
          </div>
        ) : (
          <div className="space-y-3">
            {currentSection.blocks.map((block, index) => (
              <Card key={block.id} className="p-3">
                <div className="flex items-start gap-2">
                  <div className="flex flex-col gap-1 mt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => moveBlock(index, 'up')}
                      disabled={index === 0}
                      className="h-6 w-6 p-0"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => moveBlock(index, 'down')}
                      disabled={index === currentSection.blocks.length - 1}
                      className="h-6 w-6 p-0"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      {getBlockIcon(block.type)}
                      <span className="text-sm font-medium capitalize">{block.type}</span>
                    </div>

                    {block.type === 'title' && (
                      <Input
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, e.target.value)}
                        placeholder="Enter title..."
                        className="h-9 text-sm font-semibold"
                      />
                    )}

                    {block.type === 'text' && (
                      <RichTextEditor
                        value={block.content}
                        onChange={(value) => updateBlock(block.id, value)}
                        placeholder="Enter body text... Use the toolbar to format text."
                      />
                    )}

                    {block.type === 'image' && (
                      <div className="space-y-2">
                        {block.content ? (
                          <div className="relative aspect-video w-full max-w-md rounded-lg overflow-hidden bg-muted">
                            <img src={block.content} alt={block.metadata?.alt || 'Training image'} className="w-full h-full object-cover" />
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              className="absolute top-2 right-2 h-6 w-6 p-0"
                              onClick={() => updateBlock(block.id, '', {})}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                id={`image-${block.id}`}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileUpload(block.id, file, 'image');
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById(`image-${block.id}`)?.click()}
                                disabled={uploading === block.id}
                                className="h-8 text-xs"
                              >
                                <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
                                {uploading === block.id ? 'Uploading...' : 'Upload Image'}
                              </Button>
                            </div>
                            <div
                              ref={pasteAreaRef}
                              onPaste={(e) => handlePaste(block.id, e)}
                              className="border-2 border-dashed rounded-lg p-4 text-center text-xs text-muted-foreground cursor-pointer hover:border-primary/50 transition-colors"
                              tabIndex={0}
                            >
                              <Clipboard className="h-4 w-4 mx-auto mb-1" />
                              <p>Or paste image from clipboard (Ctrl+V)</p>
                            </div>
                          </div>
                        )}
                        {block.content && (
                          <Input
                            value={block.metadata?.alt || ''}
                            onChange={(e) => updateBlock(block.id, block.content, { ...block.metadata, alt: e.target.value })}
                            placeholder="Image description (alt text)"
                            className="h-8 text-xs"
                          />
                        )}
                      </div>
                    )}

                    {block.type === 'document' && (
                      <div className="space-y-2">
                        {block.content ? (
                          <div className="flex items-center gap-2 p-2 border rounded">
                            <FileUp className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate">{block.metadata?.fileName || 'Document'}</p>
                              {block.metadata?.fileSize && (
                                <p className="text-xs text-muted-foreground">
                                  {(block.metadata.fileSize / 1024).toFixed(1)} KB
                                </p>
                              )}
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => updateBlock(block.id, '', {})}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.txt"
                              className="hidden"
                              id={`document-${block.id}`}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(block.id, file, 'document');
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => document.getElementById(`document-${block.id}`)?.click()}
                              disabled={uploading === block.id}
                              className="h-8 text-xs"
                            >
                              <FileUp className="h-3.5 w-3.5 mr-1.5" />
                              {uploading === block.id ? 'Uploading...' : 'Upload Document'}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {block.type === 'embed' && (
                      <div className="space-y-2">
                        <textarea
                          value={block.content}
                          onChange={(e) => updateBlock(block.id, e.target.value)}
                          placeholder="Paste embed code here (e.g., YouTube iframe, Vimeo embed, etc.)"
                          className="w-full h-24 px-3 py-2 text-sm border rounded-md resize-none font-mono"
                        />
                        {block.content && (
                          <div className="border rounded-lg p-4 bg-muted/30">
                            <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                            <div className="relative w-full aspect-video max-w-2xl mx-auto bg-background rounded overflow-hidden [&_iframe]:absolute [&_iframe]:top-0 [&_iframe]:left-0 [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-0">
                              <div dangerouslySetInnerHTML={{ __html: block.content }} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive"
                    onClick={() => deleteBlock(block.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
