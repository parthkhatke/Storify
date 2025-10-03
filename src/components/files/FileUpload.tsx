import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, File, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  generateEncryptionKey, 
  generateIV, 
  encryptFile, 
  exportKey, 
  arrayBufferToBase64, 
  uint8ArrayToHex 
} from '@/lib/encryption';

interface UploadStatus {
  status: 'idle' | 'encrypting' | 'uploading' | 'success' | 'error';
  progress: number;
  message: string;
}

interface FileUploadProps {
  onUploadComplete?: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    status: 'idle',
    progress: 0,
    message: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Maximum file size is 50MB',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
      setUploadStatus({ status: 'idle', progress: 0, message: '' });
    }
  };

  const uploadFile = async () => {
    if (!selectedFile || !user) return;

    try {
      setUploadStatus({ status: 'encrypting', progress: 10, message: 'Generating encryption key...' });

      // Generate encryption key and IV
      const encryptionKey = await generateEncryptionKey();
      const iv = generateIV();
      
      setUploadStatus({ status: 'encrypting', progress: 30, message: 'Reading file...' });

      // Read file as ArrayBuffer
      const fileData = await selectedFile.arrayBuffer();
      
      setUploadStatus({ status: 'encrypting', progress: 50, message: 'Encrypting file...' });

      // Encrypt the file
      const encryptedData = await encryptFile(fileData, encryptionKey, iv);
      
      setUploadStatus({ status: 'encrypting', progress: 70, message: 'Preparing for upload...' });

      // Export the key for storage
      const exportedKey = await exportKey(encryptionKey);
      const keyBase64 = arrayBufferToBase64(exportedKey);
      const ivHex = uint8ArrayToHex(iv);

      setUploadStatus({ status: 'uploading', progress: 80, message: 'Uploading encrypted file...' });

      // Create file path with user ID
      const fileExtension = selectedFile.name.split('.').pop() || '';
      const filename = `${crypto.randomUUID()}.${fileExtension}`;
      const filePath = `${user.id}/${filename}`;

      // Upload encrypted file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('encrypted-files')
        .upload(filePath, new Blob([encryptedData]), {
          contentType: 'application/octet-stream',
          cacheControl: '3600',
        });

      if (uploadError) throw uploadError;

      setUploadStatus({ status: 'uploading', progress: 90, message: 'Saving file metadata...' });

      // Save file metadata to database
      const { error: dbError } = await supabase
        .from('files')
        .insert({
          user_id: user.id,
          filename: filename,
          original_filename: selectedFile.name,
          storage_path: filePath,
          file_size: selectedFile.size,
          mime_type: selectedFile.type,
          encrypted_key: keyBase64,
          iv: ivHex,
        });

      if (dbError) throw dbError;

      setUploadStatus({ status: 'success', progress: 100, message: 'File uploaded successfully!' });
      
      toast({
        title: 'Upload complete',
        description: `${selectedFile.name} has been encrypted and uploaded securely`,
      });

      onUploadComplete?.();
      // Reset after success
      setTimeout(() => {
        setSelectedFile(null);
        setUploadStatus({ status: 'idle', progress: 0, message: '' });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 2000);

    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadStatus({ status: 'error', progress: 0, message: error.message || 'Upload failed' });
      
      toast({
        title: 'Upload failed',
        description: error.message || 'An error occurred while uploading the file',
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus.status) {
      case 'encrypting':
      case 'uploading':
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-accent" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Upload className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Upload File
        </CardTitle>
        <CardDescription>
          Select a file to encrypt and upload securely. Files are encrypted client-side before upload.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploadStatus.status === 'encrypting' || uploadStatus.status === 'uploading'}
          />
          
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-24 border-dashed border-primary/30 hover:border-primary/50 hover:bg-primary/5"
            disabled={uploadStatus.status === 'encrypting' || uploadStatus.status === 'uploading'}
          >
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm">Click to select file</span>
              <span className="text-xs text-muted-foreground">Max 50MB</span>
            </div>
          </Button>

          {selectedFile && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <File className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              {uploadStatus.status === 'idle' && (
                <Button onClick={uploadFile} size="sm">
                  Upload
                </Button>
              )}
            </div>
          )}

          {uploadStatus.status !== 'idle' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className="text-sm font-medium">{uploadStatus.message}</span>
              </div>
              {uploadStatus.progress > 0 && (
                <Progress value={uploadStatus.progress} className="h-2" />
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};