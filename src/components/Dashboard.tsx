import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Settings, Download, Layout, BarChart3, PieChart, TrendingUp, Hash, Save, Trash2 } from 'lucide-react';
import { ChartBuilder } from '@/components/ChartBuilder';
import { PivotTable } from '@/components/PivotTable';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';

interface DashboardProps {
  data: any[];
  columns: any[];
}

interface Widget {
  id: string;
  type: 'chart' | 'kpi' | 'pivot';
  title: string;
  config: any;
  size: 'small' | 'medium' | 'large';
}

export const Dashboard: React.FC<DashboardProps> = ({ data, columns }) => {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [editMode, setEditMode] = useState(false);
  const { isDarkMode } = useTheme();

  // Calculate some basic KPIs
  const numericColumns = columns.filter(col => col.type === 'number');
  const totalRows = data.length;
  
  const kpis = numericColumns.slice(0, 4).map(col => {
    const values = data.map(row => Number(row[col.key]) || 0).filter(val => !isNaN(val));
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = values.length > 0 ? sum / values.length : 0;
    const max = values.length > 0 ? Math.max(...values) : 0;
    const min = values.length > 0 ? Math.min(...values) : 0;
    
    return {
      label: col.label,
      value: sum,
      avg: avg,
      max: max,
      min: min,
      count: values.length
    };
  });

  // Load dashboard layout on mount
  useEffect(() => {
    const savedWidgets = localStorage.getItem('snapgraph-dashboard-widgets');
    if (savedWidgets) {
      try {
        const parsedWidgets = JSON.parse(savedWidgets);
        setWidgets(parsedWidgets);
        console.log('Loaded dashboard widgets:', parsedWidgets);
      } catch (error) {
        console.error('Error loading dashboard widgets:', error);
      }
    }
  }, []);

  // Save widgets to localStorage whenever widgets change
  const saveWidgets = (newWidgets: Widget[]) => {
    try {
      localStorage.setItem('snapgraph-dashboard-widgets', JSON.stringify(newWidgets));
      console.log('Saved dashboard widgets:', newWidgets);
    } catch (error) {
      console.error('Error saving dashboard widgets:', error);
    }
  };

  const addWidget = (type: Widget['type']) => {
    const newWidget: Widget = {
      id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Widget`,
      config: {},
      size: 'medium'
    };
    
    const updatedWidgets = [...widgets, newWidget];
    setWidgets(updatedWidgets);
    saveWidgets(updatedWidgets);
    console.log('Added new widget:', newWidget);
  };

  const removeWidget = (id: string) => {
    const updatedWidgets = widgets.filter(w => w.id !== id);
    setWidgets(updatedWidgets);
    saveWidgets(updatedWidgets);
    
    // Also remove the widget's chart configuration
    localStorage.removeItem(`chart-config-${id}`);
    console.log('Removed widget and its configuration:', id);
  };

  const updateWidgetConfig = (widgetId: string, config: any) => {
    const updatedWidgets = widgets.map(widget => 
      widget.id === widgetId ? { ...widget, config } : widget
    );
    setWidgets(updatedWidgets);
    saveWidgets(updatedWidgets);
    console.log('Updated widget config:', widgetId, config);
  };

  const updateWidgetTitle = (widgetId: string, title: string) => {
    const updatedWidgets = widgets.map(widget => 
      widget.id === widgetId ? { ...widget, title } : widget
    );
    setWidgets(updatedWidgets);
    saveWidgets(updatedWidgets);
  };

  const exportDashboard = () => {
    const dashboardData = {
      widgets,
      kpis,
      metadata: {
        totalRows,
        columnsCount: columns.length,
        exportDate: new Date().toISOString(),
        version: '1.0'
      }
    };
    
    try {
      const dataStr = JSON.stringify(dashboardData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `snapgraph-dashboard-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log('Dashboard exported successfully');
    } catch (error) {
      console.error('Error exporting dashboard:', error);
    }
  };

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all dashboard data? This action cannot be undone.')) {
      // Clear all widget configurations
      widgets.forEach(widget => {
        localStorage.removeItem(`chart-config-${widget.id}`);
      });
      
      // Clear dashboard widgets
      localStorage.removeItem('snapgraph-dashboard-widgets');
      setWidgets([]);
      console.log('Cleared all dashboard data');
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="space-y-6 p-6">
        {/* Dashboard Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Dashboard
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Interactive data visualization and insights
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllData}
              className={`flex items-center space-x-2 text-red-600 hover:text-red-700 ${
                isDarkMode 
                  ? 'border-red-600 bg-gray-800 hover:bg-red-900/20' 
                  : 'border-red-300 bg-white hover:bg-red-50'
              }`}
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear All</span>
            </Button>
            <Button
              variant={editMode ? "default" : "outline"}
              size="sm"
              onClick={() => setEditMode(!editMode)}
              className={editMode ? '' : isDarkMode 
                ? 'border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700' 
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }
            >
              <Layout className="h-4 w-4 mr-2" />
              {editMode ? 'Done' : 'Edit'}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={exportDashboard}
              className={isDarkMode 
                ? 'border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700' 
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        {kpis.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((kpi, index) => (
              <Card key={index} className={`transition-all duration-300 hover:shadow-xl ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-lg' 
                  : 'bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-md'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {kpi.label}
                      </p>
                      <p className={`text-3xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {kpi.value.toLocaleString()}
                      </p>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Avg: {kpi.avg.toFixed(1)} • Max: {kpi.max.toLocaleString()}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'
                    }`}>
                      <Hash className={`h-6 w-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className={`backdrop-blur-sm shadow-xl transition-all duration-300 hover:shadow-2xl ${
            isDarkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white/90 border-gray-200'
          }`}>
            <CardHeader className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <CardTitle className={`flex items-center space-x-2 text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <BarChart3 className="h-6 w-6" />
                <span>Quick Chart</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ChartBuilder 
                data={data} 
                columns={columns}
                chartId="quick-chart"
                onConfigChange={(config) => updateWidgetConfig('quick-chart', config)}
              />
            </CardContent>
          </Card>

          <Card className={`backdrop-blur-sm shadow-xl transition-all duration-300 hover:shadow-2xl ${
            isDarkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white/90 border-gray-200'
          }`}>
            <CardHeader className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <CardTitle className={`flex items-center space-x-2 text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <TrendingUp className="h-6 w-6" />
                <span>Data Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className={`text-center p-6 rounded-xl transition-colors ${
                  isDarkMode ? 'bg-blue-900/30 border border-blue-800/50' : 'bg-blue-50 border border-blue-200'
                }`}>
                  <div className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                    {totalRows}
                  </div>
                  <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Total Records
                  </div>
                </div>
                <div className={`text-center p-6 rounded-xl transition-colors ${
                  isDarkMode ? 'bg-green-900/30 border border-green-800/50' : 'bg-green-50 border border-green-200'
                }`}>
                  <div className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-green-300' : 'text-green-600'}`}>
                    {columns.length}
                  </div>
                  <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Columns
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Column Types
                </h4>
                <div className="flex flex-wrap gap-2">
                  {['number', 'text', 'date'].map(type => {
                    const count = columns.filter(col => col.type === type).length;
                    return count > 0 ? (
                      <Badge key={type} variant="outline" className={`text-sm px-3 py-1 ${
                        isDarkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'
                      }`}>
                        {count} {type}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>

              {numericColumns.length > 0 && (
                <div className="space-y-3">
                  <h4 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Numeric Columns
                  </h4>
                  <div className="space-y-2">
                    {numericColumns.slice(0, 3).map(col => (
                      <div key={col.key} className={`flex justify-between items-center p-3 rounded-lg ${
                        isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'
                      }`}>
                        <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                          {col.label}
                        </span>
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {data.filter(row => row[col.key] && !isNaN(Number(row[col.key]))).length} values
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add Widget Controls */}
        {editMode && (
          <Card className={`backdrop-blur-sm shadow-xl border-2 border-dashed transition-all duration-300 ${
            isDarkMode 
              ? 'bg-gray-800/90 border-gray-600' 
              : 'bg-white/90 border-blue-300'
          }`}>
            <CardContent className="p-8">
              <div className="text-center">
                <h3 className={`text-2xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Add New Widget
                </h3>
                <div className="flex justify-center space-x-6">
                  <Button
                    variant="outline"
                    onClick={() => addWidget('chart')}
                    className={`flex items-center space-x-3 px-6 py-3 text-lg ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700' 
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <BarChart3 className="h-5 w-5" />
                    <span>Chart</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => addWidget('kpi')}
                    className={`flex items-center space-x-3 px-6 py-3 text-lg ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700' 
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Hash className="h-5 w-5" />
                    <span>KPI</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => addWidget('pivot')}
                    className={`flex items-center space-x-3 px-6 py-3 text-lg ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700' 
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Layout className="h-5 w-5" />
                    <span>Pivot Table</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Custom Widgets */}
        {widgets.length > 0 && (
          <div className="grid lg:grid-cols-2 gap-6">
            {widgets.map((widget) => (
              <Card key={widget.id} className={`backdrop-blur-sm shadow-xl transition-all duration-300 hover:shadow-2xl ${
                isDarkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white/90 border-gray-200'
              }`}>
                <CardHeader className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-center">
                    <CardTitle className={`text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {editMode ? (
                        <input
                          type="text"
                          value={widget.title}
                          onChange={(e) => updateWidgetTitle(widget.id, e.target.value)}
                          className={`bg-transparent border-none outline-none focus:border-b-2 focus:border-blue-500 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}
                        />
                      ) : (
                        widget.title
                      )}
                    </CardTitle>
                    {editMode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeWidget(widget.id)}
                        className={`text-red-500 hover:text-red-700 hover:bg-red-50 ${
                          isDarkMode ? 'hover:bg-red-900/20' : 'hover:bg-red-50'
                        }`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {widget.type === 'chart' && (
                    <ChartBuilder 
                      data={data} 
                      columns={columns}
                      chartId={widget.id}
                      onConfigChange={(config) => updateWidgetConfig(widget.id, config)}
                    />
                  )}
                  {widget.type === 'pivot' && (
                    <PivotTable data={data} columns={columns} />
                  )}
                  {widget.type === 'kpi' && (
                    <div className="text-center p-8">
                      <div className={`text-4xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {totalRows.toLocaleString()}
                      </div>
                      <div className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Total Records
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {widgets.length === 0 && !editMode && (
          <Card className={`backdrop-blur-sm shadow-xl transition-all duration-300 ${
            isDarkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white/90 border-gray-200'
          }`}>
            <CardContent className="p-16 text-center">
              <BarChart3 className={`h-20 w-20 mx-auto mb-6 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <h3 className={`text-2xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Your Dashboard is Ready
              </h3>
              <p className={`text-lg mb-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Use the charts above to explore your data, or enter edit mode to add custom widgets.
              </p>
              <Button onClick={() => setEditMode(true)} size="lg" className="px-8 py-3 text-lg">
                <Plus className="h-5 w-5 mr-2" />
                Add Widgets
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
