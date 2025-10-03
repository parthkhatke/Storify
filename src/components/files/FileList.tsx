import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  File,
  Loader2,
  Trash2,
  Calendar,
  HardDrive,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  importKey,
  decryptFile,
  base64ToArrayBuffer,
  hexToUint8Array,
} from "@/lib/encryption";

interface FileRecord {
  id: string;
  filename: string;
  original_filename: string;
  storage_path: string;
  file_size: number;
  mime_type: string | null;
  encrypted_key: string;
  iv: string;
  uploaded_at: string;
}

interface DownloadStatus {
  fileId: string;
  status: "downloading" | "decrypting" | "complete";
  progress: number;
}

export const FileList: React.FC = () => {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus | null>(
    null
  );
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchFiles();
  }, [user]);

  const fetchFiles = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("files")
        .select("*")
        .eq("user_id", user.id)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error: any) {
      console.error("Error fetching files:", error);
      toast({
        title: "Error",
        description: "Failed to load files",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (file: FileRecord) => {
    try {
      setDownloadStatus({
        fileId: file.id,
        status: "downloading",
        progress: 30,
      });

      // Download encrypted file from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("encrypted-files")
        .download(file.storage_path);

      if (downloadError) throw downloadError;

      setDownloadStatus({
        fileId: file.id,
        status: "decrypting",
        progress: 60,
      });

      // Convert file to ArrayBuffer
      const encryptedArrayBuffer = await fileData.arrayBuffer();

      // Import the decryption key
      const keyArrayBuffer = base64ToArrayBuffer(file.encrypted_key);
      const decryptionKey = await importKey(keyArrayBuffer);

      // Convert IV from hex
      const iv = hexToUint8Array(file.iv);

      setDownloadStatus({
        fileId: file.id,
        status: "decrypting",
        progress: 80,
      });

      // Decrypt the file
      const decryptedData = await decryptFile(
        encryptedArrayBuffer,
        decryptionKey,
        iv
      );

      setDownloadStatus({ fileId: file.id, status: "complete", progress: 100 });

      // Create blob and download
      const blob = new Blob([decryptedData], {
        type: file.mime_type || "application/octet-stream",
      });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = file.original_filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download complete",
        description: `${file.original_filename} has been decrypted and downloaded`,
      });
    } catch (error: any) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description: error.message || "Failed to download and decrypt file",
        variant: "destructive",
      });
    } finally {
      setDownloadStatus(null);
    }
  };

  const deleteFile = async (file: FileRecord) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("encrypted-files")
        .remove([file.storage_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("files")
        .delete()
        .eq("id", file.id);

      if (dbError) throw dbError;

      // Update local state
      setFiles(files.filter((f) => f.id !== file.id));

      toast({
        title: "File deleted",
        description: `${file.original_filename} has been permanently deleted`,
      });
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2">Loading files...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <File className="h-5 w-5 text-primary" />
          My Files
        </CardTitle>
        <CardDescription>
          Your encrypted files. Click download to decrypt and save to your
          device.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {files.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <File className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No files uploaded yet</p>
            <p className="text-sm">Upload your first file to get started</p>
          </div>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className="p-2 bg-primary/10 rounded-lg">
                <File className="h-4 w-4 text-primary" />
              </div>

              <div className="flex-1 min-w-0 space-y-1 w-full">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">
                    {file.original_filename}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    Encrypted
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <HardDrive className="h-3 w-3" />
                    {formatFileSize(file.file_size)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(file.uploaded_at)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
                {downloadStatus?.fileId === file.id ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-muted-foreground">
                      {downloadStatus.status === "downloading"
                        ? "Downloading..."
                        : "Decrypting..."}
                    </span>
                  </div>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadFile(file)}
                      className="h-8"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteFile(file)}
                      className="h-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
