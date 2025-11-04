"use client";

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, File, X, FileText, FileImage, Presentation, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  selectedFiles: File[];
  maxFiles?: number;
  maxSizePerFile?: number;
  maxTotalSize?: number;
  userTier?: 'free' | 'basic' | 'pro';
}

const MAX_FILE_SIZE_FREE = 5 * 1024 * 1024; // 5MB
const MAX_FILE_SIZE_BASIC = 25 * 1024 * 1024; // 25MB
const MAX_FILE_SIZE_PRO = 100 * 1024 * 1024; // 100MB

const MAX_TOTAL_SIZE_FREE = 10 * 1024 * 1024; // 10MB
const MAX_TOTAL_SIZE_BASIC = 50 * 1024 * 1024; // 50MB
const MAX_TOTAL_SIZE_PRO = 200 * 1024 * 1024; // 200MB

const MAX_FILES_FREE = 3;
const MAX_FILES_BASIC = 10;
const MAX_FILES_PRO = 25;

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md']
};

export function FileUpload({ 
  onFileSelect, 
  selectedFiles, 
  userTier = 'free' 
}: FileUploadProps) {
  
  const getMaxFileSize = () => {
    switch (userTier) {
      case 'basic': return MAX_FILE_SIZE_BASIC;
      case 'pro': return MAX_FILE_SIZE_PRO;
      default: return MAX_FILE_SIZE_FREE;
    }
  };

  const getMaxTotalSize = () => {
    switch (userTier) {
      case 'basic': return MAX_TOTAL_SIZE_BASIC;
      case 'pro': return MAX_TOTAL_SIZE_PRO;
      default: return MAX_TOTAL_SIZE_FREE;
    }
  };

  const getMaxFiles = () => {
    switch (userTier) {
      case 'basic': return MAX_FILES_BASIC;
      case 'pro': return MAX_FILES_PRO;
      default: return MAX_FILES_FREE;
    }
  };

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      const error = rejectedFiles[0].errors[0];
      if (error.code === 'file-too-large') {
        toast.error(`File too large. Maximum size: ${formatFileSize(getMaxFileSize())}`);
      } else if (error.code === 'file-invalid-type') {
        toast.error('Invalid file type. Please select PDF, DOCX, PPTX, TXT, or MD files.');
      } else {
        toast.error('File upload failed. Please try again.');
      }
      return;
    }

    const newFiles = [...selectedFiles, ...acceptedFiles];
    
    // Check file count limit
    if (newFiles.length > getMaxFiles()) {
      toast.error(`Maximum ${getMaxFiles()} files allowed for ${userTier} plan.`);
      return;
    }

    // Check total size limit
    const totalSize = newFiles.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > getMaxTotalSize()) {
      toast.error(`Total file size exceeds ${formatFileSize(getMaxTotalSize())} limit for ${userTier} plan.`);
      return;
    }

    onFileSelect(newFiles);
    
    if (acceptedFiles.length === 1) {
      toast.success(`Successfully uploaded ${acceptedFiles[0].name}`);
    } else {
      toast.success(`Successfully uploaded ${acceptedFiles.length} files`);
    }
  }, [selectedFiles, onFileSelect, userTier]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: getMaxFileSize(),
    accept: ACCEPTED_TYPES,
    multiple: true
  });

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    onFileSelect(newFiles);
    toast.info('File removed');
  };

  const removeAllFiles = () => {
    onFileSelect([]);
    toast.info('All files removed');
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="h-6 w-6 text-red-500" />;
      case 'docx':
        return <FileImage className="h-6 w-6 text-blue-500" />;
      case 'pptx':
        return <Presentation className="h-6 w-6 text-orange-500" />;
      case 'txt':
      case 'md':
        return <File className="h-6 w-6 text-green-500" />;
      default:
        return <File className="h-6 w-6 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTotalSize = () => {
    return selectedFiles.reduce((sum, file) => sum + file.size, 0);
  };

  if (selectedFiles.length > 0) {
    return (
      <div className="space-y-4">
        <Card className="p-4 border-2 border-dashed border-green-200 bg-green-50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium text-green-800">
                {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} uploaded
              </h3>
              <p className="text-sm text-green-600">
                Total size: {formatFileSize(getTotalSize())} / {formatFileSize(getMaxTotalSize())}
              </p>
            </div>
            <Button
              onClick={removeAllFiles}
              variant="ghost"
              size="sm"
              className="text-green-600 hover:text-green-800 hover:bg-green-100"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove All
            </Button>
          </div>
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                <div className="flex items-center space-x-3">
                  {getFileIcon(file.name)}
                  <div>
                    <p className="font-medium text-sm text-green-800">{file.name}</p>
                    <p className="text-xs text-green-600">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  onClick={() => removeFile(index)}
                  variant="ghost"
                  size="sm"
                  className="text-green-600 hover:text-green-800 hover:bg-green-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Add more files option */}
        {selectedFiles.length < getMaxFiles() && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
              isDragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isDragActive ? 'Drop more files here' : 'Add more files'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {getMaxFiles() - selectedFiles.length} more files allowed
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
        isDragActive
          ? 'border-blue-400 bg-blue-50'
          : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
      }`}
    >
      <input {...getInputProps()} />
      
      <div className="space-y-4">
        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
          <Upload className="h-8 w-8 text-white" />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">
            {isDragActive ? 'Drop your files here' : 'Upload your study materials'}
          </h3>
          <p className="text-muted-foreground mb-4">
            Drag and drop multiple files or click to browse
          </p>
          
          <Button variant="outline" className="mb-4">
            <Upload className="h-4 w-4 mr-2" />
            Choose Files
          </Button>
          
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <Badge variant="secondary">PDF</Badge>
            <Badge variant="secondary">DOCX</Badge>
            <Badge variant="secondary">PPTX</Badge>
            <Badge variant="secondary">TXT</Badge>
            <Badge variant="secondary">MD</Badge>
          </div>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <strong>{userTier.charAt(0).toUpperCase() + userTier.slice(1)} Plan:</strong> 
              Up to {getMaxFiles()} files, {formatFileSize(getMaxFileSize())} per file
            </p>
            <p>Maximum total size: {formatFileSize(getMaxTotalSize())}</p>
          </div>
        </div>
      </div>
    </div>
  );
}