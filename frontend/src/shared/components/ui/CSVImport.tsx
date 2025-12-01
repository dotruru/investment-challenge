import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Check, AlertCircle, X, Download, Table } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/shared/utils/cn';

interface CSVColumn {
  key: string;
  label: string;
  required?: boolean;
  type?: 'string' | 'number';
}

interface CSVImportProps<T> {
  columns: CSVColumn[];
  onImport: (data: T[]) => Promise<{ success: boolean; created?: number; skipped?: number; errors?: any[] }>;
  onClose: () => void;
  title?: string;
  templateFileName?: string;
}

export function CSVImport<T>({
  columns,
  onImport,
  onClose,
  title = 'Import CSV',
  templateFileName = 'template.csv',
}: CSVImportProps<T>) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<T[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; created?: number; skipped?: number; errors?: any[] } | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const inputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): T[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }

    // Parse header
    const header = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
    
    // Map header to column keys
    const columnMap: Record<number, string> = {};
    columns.forEach((col) => {
      const index = header.findIndex(
        (h) => h === col.key.toLowerCase() || h === col.label.toLowerCase()
      );
      if (index >= 0) {
        columnMap[index] = col.key;
      }
    });

    // Validate required columns
    const errors: string[] = [];
    columns.forEach((col) => {
      if (col.required && !Object.values(columnMap).includes(col.key)) {
        errors.push(`Missing required column: ${col.label}`);
      }
    });

    if (errors.length > 0) {
      throw new Error(errors.join('\n'));
    }

    // Parse data rows
    const data: T[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle quoted values with commas inside
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const row: Record<string, any> = {};
      Object.entries(columnMap).forEach(([indexStr, key]) => {
        const index = parseInt(indexStr);
        let value = values[index]?.replace(/^["']|["']$/g, '') || '';
        
        // Type conversion
        const col = columns.find((c) => c.key === key);
        if (col?.type === 'number' && value) {
          row[key] = parseInt(value, 10);
        } else if (key === 'memberNames' && value) {
          // Split member names by semicolon
          row[key] = value.split(';').map((n) => n.trim()).filter(Boolean);
        } else {
          row[key] = value;
        }
      });

      // Only add row if it has at least one value
      if (Object.values(row).some((v) => v !== '' && v !== undefined)) {
        data.push(row as T);
      }
    }

    return data;
  };

  const handleFile = (file: File) => {
    setFile(file);
    setParseErrors([]);
    setParsedData([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = parseCSV(text);
        setParsedData(data);
        setStep('preview');
      } catch (err) {
        setParseErrors([err instanceof Error ? err.message : 'Failed to parse CSV']);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      handleFile(file);
    } else {
      setParseErrors(['Please upload a CSV file']);
    }
  }, []);

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const result = await onImport(parsedData);
      setImportResult(result);
      setStep('result');
    } catch (err) {
      setImportResult({
        success: false,
        errors: [{ name: 'Import', error: err instanceof Error ? err.message : 'Unknown error' }],
      });
      setStep('result');
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const header = columns.map((c) => c.label).join(',');
    const sampleRow = columns.map((c) => {
      if (c.key === 'name') return 'Alpha Capital';
      if (c.key === 'university') return 'Oxford University';
      if (c.key === 'roundAssignment') return '1';
      if (c.key === 'strategyTagline') return 'Quantitative growth investing';
      if (c.key === 'memberNames') return 'John Smith;Jane Doe';
      return '';
    }).join(',');
    
    const csv = `${header}\n${sampleRow}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = templateFileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {step === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Template download */}
                <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Table className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">Download Template</p>
                      <p className="text-sm text-muted-foreground">Start with a pre-formatted CSV template</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={downloadTemplate}>
                    <Download className="w-4 h-4 mr-2" />
                    Template
                  </Button>
                </div>

                {/* Upload zone */}
                <div
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className={cn(
                    'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors',
                    'border-border hover:border-primary/50 hover:bg-secondary/30'
                  )}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".csv"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    className="hidden"
                  />
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="font-medium mb-1">
                    <span className="text-primary">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-sm text-muted-foreground">CSV files only</p>
                </div>

                {parseErrors.length > 0 && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-center gap-2 text-red-500 mb-2">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">Parse Error</span>
                    </div>
                    {parseErrors.map((err, i) => (
                      <p key={i} className="text-sm text-muted-foreground">{err}</p>
                    ))}
                  </div>
                )}

                {/* Required columns info */}
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Required columns:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {columns.filter((c) => c.required).map((c) => (
                      <li key={c.key}>{c.label}</li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

            {step === 'preview' && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="font-medium">{file?.name}</span>
                    <span className="text-sm text-muted-foreground">({parsedData.length} rows)</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setStep('upload')}>
                    Change file
                  </Button>
                </div>

                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-64">
                    <table className="w-full text-sm">
                      <thead className="bg-secondary sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">#</th>
                          {columns.map((col) => (
                            <th key={col.key} className="px-3 py-2 text-left font-medium">
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {parsedData.slice(0, 10).map((row, i) => (
                          <tr key={i} className="hover:bg-secondary/50">
                            <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                            {columns.map((col) => (
                              <td key={col.key} className="px-3 py-2 truncate max-w-[200px]">
                                {Array.isArray((row as any)[col.key])
                                  ? (row as any)[col.key].join(', ')
                                  : (row as any)[col.key] || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedData.length > 10 && (
                    <div className="px-3 py-2 bg-secondary text-sm text-muted-foreground text-center">
                      ...and {parsedData.length - 10} more rows
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 'result' && importResult && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                {importResult.success && importResult.created && importResult.created > 0 ? (
                  <>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Check className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Import Successful!</h3>
                    <p className="text-muted-foreground mb-4">
                      Created {importResult.created} teams
                      {importResult.skipped ? `, skipped ${importResult.skipped}` : ''}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Import Failed</h3>
                    {importResult.errors && importResult.errors.length > 0 && (
                      <div className="text-left max-h-40 overflow-y-auto bg-secondary/50 rounded-lg p-3 mt-4">
                        {importResult.errors.map((err, i) => (
                          <p key={i} className="text-sm text-muted-foreground">
                            <span className="font-medium">{err.name}:</span> {err.error}
                          </p>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-border">
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button variant="gold" onClick={handleImport} disabled={isImporting}>
                {isImporting ? 'Importing...' : `Import ${parsedData.length} Teams`}
              </Button>
            </>
          )}
          {step === 'result' && (
            <Button variant="gold" onClick={onClose}>
              Done
            </Button>
          )}
          {step === 'upload' && (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

