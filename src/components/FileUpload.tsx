import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Papa from 'papaparse';
import { toast } from 'sonner';

interface FileUploadProps {
  onDataUpload: (data: any[], columns: any[], fileName: string) => void;
  allowMultiple?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataUpload, allowMultiple = false }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const detectColumnTypes = (data: any[]) => {
    if (data.length === 0) return [];
    
    const sampleSize = Math.min(100, data.length);
    const sample = data.slice(0, sampleSize);
    
    return Object.keys(data[0]).map(key => {
      const values = sample.map(row => row[key]).filter(val => val !== null && val !== '' && val !== undefined);
      
      let type = 'text';
      if (values.length > 0) {
        const numericValues = values.filter(val => {
          const num = Number(val);
          return !isNaN(num) && isFinite(num);
        });
        const dateValues = values.filter(val => {
          const date = new Date(val);
          return !isNaN(date.getTime()) && val.toString().length > 4;
        });
        
        if (numericValues.length / values.length > 0.8) {
          type = 'number';
        } else if (dateValues.length / values.length > 0.8) {
          type = 'date';
        }
      }
      
      return {
        key,
        label: key.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        type,
        sample: values.slice(0, 3)
      };
    });
  };

  const processFile = useCallback((file: File) => {
    setUploading(true);
    setUploadProgress(0);
    
    console.log('Processing file:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    let processedRows = 0;
    let allData: any[] = [];
    
    Papa.parse<any>(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: '', // Auto-detect delimiter
      quoteChar: '"',
      escapeChar: '"',
      transformHeader: (header: string) => {
        return header.trim().replace(/^\uFEFF/, ''); // Remove BOM if present
      },
      transform: (value: string) => {
        return value.trim();
      },
      step: (results: Papa.ParseStepResult<any>) => {
        if (results.data && Object.keys(results.data).length > 0) {
          processedRows++;
          allData.push(results.data);
          // Update progress based on estimated file processing
          const estimatedProgress = Math.min((processedRows / 100) * 90, 90);
          setUploadProgress(estimatedProgress);
        }
        
        if (results.errors && results.errors.length > 0) {
          console.warn('Row parse errors:', results.errors);
        }
      },
      complete: (results: Papa.ParseResult<any>) => {
        console.log('Parse complete. Total rows found:', results.data.length);
        console.log('Data sample:', results.data.slice(0, 3));
        console.log('Meta info:', results.meta);
        
        if (results.errors && results.errors.length > 0) {
          console.warn('Parse errors:', results.errors);
          // Don't fail on minor errors, just warn
          if (results.errors.some(error => error.type === 'Delimiter')) {
            console.log('Delimiter detection may have failed, but continuing...');
          }
        }
        
        // Use step data if available, otherwise use complete data
        const finalData = allData.length > 0 ? allData : results.data;
        
        // Filter out empty rows
        const cleanData = finalData.filter(row => {
          if (!row || typeof row !== 'object') return false;
          const values = Object.values(row);
          return values.some(value => value !== null && value !== undefined && value !== '');
        });
        
        console.log('Clean data length:', cleanData.length);
        
        if (cleanData.length === 0) {
          toast.error('No valid data found in the file. Please check the file format.');
          setUploading(false);
          setUploadProgress(0);
          return;
        }
        
        const columns = detectColumnTypes(cleanData);
        console.log('Detected columns:', columns);
        
        setUploadProgress(100);
        
        setTimeout(() => {
          onDataUpload(cleanData, columns, file.name);
          setUploading(false);
          setUploadProgress(0);
          toast.success(`Successfully loaded ${cleanData.length} rows from ${file.name}`);
        }, 500);
      },
      error: (error: Error) => {
        console.error('Parse error:', error);
        toast.error(`Failed to parse the file: ${error.message}`);
        setUploading(false);
        setUploadProgress(0);
      }
    });
  }, [onDataUpload]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (allowMultiple) {
      acceptedFiles.forEach(file => {
        console.log('File dropped:', file.name, file.type, file.size);
        processFile(file);
      });
    } else {
      const file = acceptedFiles[0];
      if (file) {
        console.log('File dropped:', file.name, file.type, file.size);
        processFile(file);
      }
    }
  }, [processFile, allowMultiple]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt']
    },
    multiple: allowMultiple,
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  // Handle file rejections
  React.useEffect(() => {
    if (fileRejections.length > 0) {
      const rejection = fileRejections[0];
      if (rejection.errors.some(e => e.code === 'file-too-large')) {
        toast.error('File is too large. Maximum size is 50MB.');
      } else if (rejection.errors.some(e => e.code === 'file-invalid-type')) {
        toast.error('Invalid file type. Please upload a CSV, Excel, or text file.');
      } else {
        toast.error('File upload failed. Please try again.');
      }
    }
  }, [fileRejections]);

  if (uploading) {
    return (
      <Card className="max-w-2xl mx-auto bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-blue-600 animate-pulse" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Processing your data...</h3>
          <p className="text-gray-600 mb-4">Analyzing structure and detecting data types</p>
          <Progress value={uploadProgress} className="mb-2" />
          <p className="text-sm text-gray-500">{Math.round(uploadProgress)}% complete</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="p-8">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="h-8 w-8 text-white" />
          </div>
          
          <h3 className="text-xl font-semibold mb-2">
            {isDragActive ? 'Drop your file here' : 'Upload your data'}
          </h3>
          
          <p className="text-gray-600 mb-4">
            Drag & drop your CSV {allowMultiple ? 'files' : 'file'}, or click to browse
          </p>
          
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            Choose File
          </Button>
          
          <div className="mt-6 text-sm text-gray-500">
            <p>Supported formats: CSV, Excel (.xlsx, .xls), Text (.txt)</p>
            <p>Maximum file size: 50MB</p>
          </div>
        </div>
        
        {/* Sample Data Examples */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center">
            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
            Your data should include:
          </h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Headers in the first row</li>
            <li>• Consistent data types in each column</li>
            <li>• No merged cells or complex formatting</li>
            <li>• UTF-8 encoding (or common formats)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
