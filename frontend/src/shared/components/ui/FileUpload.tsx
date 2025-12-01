import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image, FileText, Check, AlertCircle, Loader2 } from 'lucide-react';
import { uploadApi } from '@/shared/api/client';
import { cn } from '@/shared/utils/cn';

interface FileUploadProps {
  onUpload: (url: string, filename: string) => void;
  accept?: 'image' | 'document' | 'all';
  maxSize?: number; // in MB
  className?: string;
  previewUrl?: string;
  label?: string;
  hint?: string;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export function FileUpload({
  onUpload,
  accept = 'image',
  maxSize = 5,
  className,
  previewUrl,
  label = 'Upload file',
  hint,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(previewUrl || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = {
    image: 'image/jpeg,image/png,image/gif,image/webp',
    document: 'application/pdf',
    all: 'image/jpeg,image/png,image/gif,image/webp,application/pdf',
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const validateFile = (file: File): string | null => {
    // Check size
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }

    // Check type
    const validTypes = acceptedTypes[accept].split(',');
    if (!validTypes.includes(file.type)) {
      return `Invalid file type. Accepted: ${accept === 'image' ? 'JPEG, PNG, GIF, WebP' : accept === 'document' ? 'PDF' : 'Images & PDF'}`;
    }

    return null;
  };

  const handleFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setStatus('error');
      return;
    }

    setError(null);
    setStatus('uploading');
    setProgress(0);

    // Create local preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }

    try {
      // Simulate progress (since fetch doesn't support progress natively)
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const result = accept === 'document'
        ? await uploadApi.document(file)
        : await uploadApi.image(file);

      clearInterval(progressInterval);
      setProgress(100);
      setStatus('success');
      
      onUpload(result.url, result.filename);

      // Reset success state after a delay
      setTimeout(() => {
        setStatus('idle');
      }, 2000);
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Upload failed. Please try again.');
      setStatus('error');
      setPreview(null);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setStatus('idle');
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && <label className="block text-sm font-medium">{label}</label>}
      
      <div
        onClick={() => status !== 'uploading' && inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden',
          isDragOver && 'border-primary bg-primary/5',
          status === 'error' && 'border-red-500/50 bg-red-500/5',
          status === 'success' && 'border-green-500/50 bg-green-500/5',
          status === 'idle' && 'border-border hover:border-primary/50 hover:bg-secondary/30',
          status === 'uploading' && 'border-primary/50 bg-primary/5 cursor-wait'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes[accept]}
          onChange={handleInputChange}
          className="hidden"
          disabled={status === 'uploading'}
        />

        <AnimatePresence mode="wait">
          {preview && accept !== 'document' ? (
            // Image Preview
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative aspect-video"
            >
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              
              {/* Status overlay */}
              {status === 'uploading' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="text-center text-white">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    <p className="text-sm font-medium">{progress}%</p>
                  </div>
                </div>
              )}
              
              {status === 'success' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/40"
                >
                  <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-8 h-8 text-white" />
                  </div>
                </motion.div>
              )}

              {/* Clear button */}
              {status !== 'uploading' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          ) : (
            // Upload Zone
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 text-center"
            >
              <div className={cn(
                'w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center',
                status === 'error' ? 'bg-red-500/10' : 'bg-secondary'
              )}>
                {status === 'uploading' ? (
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                ) : status === 'error' ? (
                  <AlertCircle className="w-6 h-6 text-red-500" />
                ) : status === 'success' ? (
                  <Check className="w-6 h-6 text-green-500" />
                ) : accept === 'document' ? (
                  <FileText className="w-6 h-6 text-muted-foreground" />
                ) : (
                  <Image className="w-6 h-6 text-muted-foreground" />
                )}
              </div>

              {status === 'uploading' ? (
                <>
                  <p className="font-medium mb-1">Uploading...</p>
                  <div className="w-full max-w-xs mx-auto h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-primary"
                    />
                  </div>
                </>
              ) : status === 'error' ? (
                <>
                  <p className="font-medium text-red-500 mb-1">Upload Failed</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </>
              ) : status === 'success' ? (
                <>
                  <p className="font-medium text-green-500 mb-1">Uploaded Successfully!</p>
                  <p className="text-sm text-muted-foreground">Click to replace</p>
                </>
              ) : (
                <>
                  <p className="font-medium mb-1">
                    <span className="text-primary">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {accept === 'image' && 'PNG, JPG, GIF or WebP'}
                    {accept === 'document' && 'PDF files only'}
                    {accept === 'all' && 'PNG, JPG, GIF, WebP or PDF'}
                    {' '}(max {maxSize}MB)
                  </p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload progress bar at bottom */}
        {status === 'uploading' && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progress / 100 }}
            className="absolute bottom-0 left-0 right-0 h-1 bg-primary origin-left"
          />
        )}
      </div>

      {hint && status === 'idle' && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

// Avatar Upload (circular)
interface AvatarUploadProps {
  onUpload: (url: string) => void;
  currentUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AvatarUpload({
  onUpload,
  currentUrl,
  size = 'md',
  className,
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setIsUploading(true);
    try {
      const result = await uploadApi.image(file);
      onUpload(result.url);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
      setPreview(currentUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      onClick={() => !isUploading && inputRef.current?.click()}
      className={cn(
        'relative rounded-full cursor-pointer group overflow-hidden',
        sizeClasses[size],
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="hidden"
        disabled={isUploading}
      />

      {preview ? (
        <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-secondary flex items-center justify-center">
          <Upload className="w-1/3 h-1/3 text-muted-foreground" />
        </div>
      )}

      {/* Overlay */}
      <div className={cn(
        'absolute inset-0 flex items-center justify-center transition-opacity',
        isUploading ? 'bg-black/50 opacity-100' : 'bg-black/50 opacity-0 group-hover:opacity-100'
      )}>
        {isUploading ? (
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        ) : (
          <Upload className="w-6 h-6 text-white" />
        )}
      </div>
    </div>
  );
}

