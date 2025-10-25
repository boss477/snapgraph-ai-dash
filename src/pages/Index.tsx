
import React, { useState, useRef } from 'react';
import { Upload, BarChart3, MessageSquare, Download, Plus, Settings, Brain, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { FileUpload } from '@/components/FileUpload';
import { DataTable } from '@/components/DataTable';
import { ChartBuilder } from '@/components/ChartBuilder';
import { Dashboard } from '@/components/Dashboard';
import { AIChat } from '@/components/AIChat';
import { DatasetSelector } from '@/components/DatasetSelector';
import { Dataset } from '@/types/dataset';

const Index = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('upload');
  const { isDarkMode } = useTheme();

  const handleDataUpload = (parsedData: any[], detectedColumns: any[], name: string) => {
    console.log('Data uploaded:', parsedData.length, 'rows');
    
    const newDataset: Dataset = {
      id: Date.now().toString(),
      name,
      data: parsedData,
      columns: detectedColumns,
      uploadedAt: new Date()
    };
    
    setDatasets(prev => [...prev, newDataset]);
    setSelectedDatasetId(newDataset.id);
    setActiveTab('explore');
    toast.success(`Successfully loaded ${parsedData.length} rows from ${name}`);
  };

  const handleDeleteDataset = (id: string) => {
    setDatasets(prev => prev.filter(d => d.id !== id));
    if (selectedDatasetId === id) {
      setSelectedDatasetId(datasets.length > 1 ? datasets[0].id : null);
    }
    toast.success('Dataset removed');
  };

  const selectedDataset = datasets.find(d => d.id === selectedDatasetId);
  const hasData = datasets.length > 0;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-black' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      {/* Header */}
      <header className={`backdrop-blur-sm border-b sticky top-0 z-50 transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-900/80 border-gray-700' 
          : 'bg-white/80 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  SnapGraph
                </h1>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  AI-First Business Intelligence
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full grid-cols-4 backdrop-blur-sm transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800/70' : 'bg-white/70'
          }`}>
            <TabsTrigger value="upload" className="flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Upload</span>
            </TabsTrigger>
            <TabsTrigger value="explore" disabled={!hasData} className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Explore</span>
            </TabsTrigger>
            <TabsTrigger value="dashboard" disabled={!hasData} className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="ai-chat" disabled={!hasData} className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span>AI Chat</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <div className="text-center py-8">
              <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Transform Your Data Into Insights
              </h2>
              <p className={`text-lg mb-8 max-w-2xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Upload your CSV files and let SnapGraph's AI help you discover patterns, 
                create interactive dashboards, and generate business insights in minutes.
              </p>
            </div>
            
            {hasData && (
              <DatasetSelector
                datasets={datasets}
                selectedDatasetId={selectedDatasetId}
                onSelectDataset={setSelectedDatasetId}
                onDeleteDataset={handleDeleteDataset}
                onAddNew={() => {}}
                isDarkMode={isDarkMode}
              />
            )}
            
            <FileUpload onDataUpload={handleDataUpload} allowMultiple={true} />
            
            {/* Feature Highlights */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <Card className={`backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
                isDarkMode ? 'bg-gray-800/70' : 'bg-white/70'
              }`}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="h-5 w-5 text-blue-600" />
                    <span>AI-Powered Insights</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    Ask questions in natural language and get instant answers from your data.
                  </p>
                </CardContent>
              </Card>
              
              <Card className={`backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
                isDarkMode ? 'bg-gray-800/70' : 'bg-white/70'
              }`}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    <span>Dynamic Visualizations</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    Create interactive charts with simple drag & drop.
                  </p>
                </CardContent>
              </Card>
              
              <Card className={`backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
                isDarkMode ? 'bg-gray-800/70' : 'bg-white/70'
              }`}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-indigo-600" />
                    <span>Real-time Dashboards</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    Build beautiful dashboards that update automatically as your data changes.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="explore">
            <div className="space-y-6">
              {selectedDataset && (
                <>
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Data Explorer
                      </h2>
                      <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                        {selectedDataset.name} • {selectedDataset.data.length} rows • {selectedDataset.columns.length} columns
                      </p>
                    </div>
                  </div>
                  
                  <DatasetSelector
                    datasets={datasets}
                    selectedDatasetId={selectedDatasetId}
                    onSelectDataset={setSelectedDatasetId}
                    onDeleteDataset={handleDeleteDataset}
                    onAddNew={() => setActiveTab('upload')}
                    isDarkMode={isDarkMode}
                  />
                  
                  <div className="grid lg:grid-cols-2 gap-6">
                    <DataTable data={selectedDataset.data} columns={selectedDataset.columns} />
                    <ChartBuilder data={selectedDataset.data} columns={selectedDataset.columns} />
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="dashboard">
            {selectedDataset && (
              <>
                <DatasetSelector
                  datasets={datasets}
                  selectedDatasetId={selectedDatasetId}
                  onSelectDataset={setSelectedDatasetId}
                  onDeleteDataset={handleDeleteDataset}
                  onAddNew={() => setActiveTab('upload')}
                  isDarkMode={isDarkMode}
                />
                <div className="mt-6">
                  <Dashboard data={selectedDataset.data} columns={selectedDataset.columns} />
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="ai-chat">
            <div className="space-y-6">
              <div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  AI Data Assistant
                </h2>
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Ask questions about your data in natural language and get instant insights.
                </p>
              </div>
              
              {selectedDataset && (
                <>
                  <DatasetSelector
                    datasets={datasets}
                    selectedDatasetId={selectedDatasetId}
                    onSelectDataset={setSelectedDatasetId}
                    onDeleteDataset={handleDeleteDataset}
                    onAddNew={() => setActiveTab('upload')}
                    isDarkMode={isDarkMode}
                  />
                  <AIChat data={selectedDataset.data} columns={selectedDataset.columns} />
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
