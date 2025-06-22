
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter } from 'recharts';
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Activity, Download, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface ChartBuilderProps {
  data: any[];
  columns: any[];
  onConfigChange?: (config: any) => void;
}

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#EC4899', '#14B8A6'];

export const ChartBuilder: React.FC<ChartBuilderProps> = ({ data, columns, onConfigChange }) => {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'scatter'>('bar');
  const [xAxis, setXAxis] = useState<string>('');
  const [yAxis, setYAxis] = useState<string>('');
  const [groupBy, setGroupBy] = useState<string>('none');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const { isDarkMode } = useTheme();

  const numericColumns = columns.filter(col => col.type === 'number');
  const categoricalColumns = columns.filter(col => col.type === 'text' || col.type === 'date');
  const allColumns = columns;

  // Auto-save configuration when chart settings change
  React.useEffect(() => {
    if (onConfigChange) {
      onConfigChange({
        chartType,
        xAxis,
        yAxis,
        groupBy,
        zoomLevel
      });
    }
  }, [chartType, xAxis, yAxis, groupBy, zoomLevel, onConfigChange]);

  const chartData = useMemo(() => {
    if (!xAxis || (chartType !== 'pie' && !yAxis)) return [];

    let processedData = [...data];

    if (chartType === 'pie') {
      // For pie charts, group by xAxis and sum up occurrences or values
      const grouped = processedData.reduce((acc, row) => {
        const key = String(row[xAxis] || 'Unknown');
        if (!acc[key]) {
          acc[key] = { name: key, value: 0, count: 0 };
        }
        
        if (yAxis && !isNaN(Number(row[yAxis]))) {
          acc[key].value += Number(row[yAxis]);
        } else {
          acc[key].value += 1;
        }
        acc[key].count += 1;
        return acc;
      }, {} as Record<string, any>);

      return Object.values(grouped).slice(0, 10); // Limit to top 10 for readability
    }

    if (groupBy && groupBy !== 'none') {
      // Group data by the groupBy field
      const grouped = processedData.reduce((acc, row) => {
        const key = String(row[xAxis] || 'Unknown');
        const group = String(row[groupBy] || 'Other');
        
        if (!acc[key]) {
          acc[key] = { [xAxis]: key };
        }
        
        const value = yAxis && !isNaN(Number(row[yAxis])) ? Number(row[yAxis]) : 1;
        acc[key][group] = (acc[key][group] || 0) + value;
        
        return acc;
      }, {} as Record<string, any>);

      return Object.values(grouped);
    } else {
      // Simple aggregation
      const grouped = processedData.reduce((acc, row) => {
        const key = String(row[xAxis] || 'Unknown');
        if (!acc[key]) {
          acc[key] = { [xAxis]: key, [yAxis]: 0, count: 0 };
        }
        
        const value = yAxis && !isNaN(Number(row[yAxis])) ? Number(row[yAxis]) : 1;
        acc[key][yAxis] += value;
        acc[key].count += 1;
        
        return acc;
      }, {} as Record<string, any>);

      return Object.values(grouped);
    }
  }, [data, xAxis, yAxis, groupBy, chartType]);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  };

  const resetZoom = () => {
    setZoomLevel(1);
  };

  const exportChart = () => {
    const chartConfig = {
      type: chartType,
      xAxis,
      yAxis,
      groupBy,
      zoomLevel,
      data: chartData,
      timestamp: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(chartConfig, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chart-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log('Chart configuration exported');
  };

  const resetChart = () => {
    setChartType('bar');
    setXAxis('');
    setYAxis('');
    setGroupBy('none');
    setZoomLevel(1);
  };

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className={`h-12 w-12 mx-auto mb-3 opacity-50 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Select fields to generate chart
            </p>
          </div>
        </div>
      );
    }

    const chartTheme = {
      grid: { stroke: isDarkMode ? '#374151' : '#e5e7eb' },
      text: { fill: isDarkMode ? '#d1d5db' : '#374151' },
      axis: { stroke: isDarkMode ? '#6b7280' : '#9ca3af' }
    };

    const chartHeight = 300 * zoomLevel;
    const chartWidth = `${100 * zoomLevel}%`;

    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'bar':
        return (
          <div style={{ width: chartWidth, height: chartHeight, overflow: 'auto' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart {...commonProps}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid.stroke} />
                <XAxis 
                  dataKey={xAxis} 
                  tick={{ fill: chartTheme.text.fill, fontSize: 12 }}
                  axisLine={{ stroke: chartTheme.axis.stroke }}
                />
                <YAxis 
                  tick={{ fill: chartTheme.text.fill, fontSize: 12 }}
                  axisLine={{ stroke: chartTheme.axis.stroke }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                    border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    color: isDarkMode ? '#f3f4f6' : '#111827',
                    fontSize: '14px'
                  }}
                />
                <Legend />
                {groupBy && groupBy !== 'none' ? (
                  // Multiple bars for grouped data
                  [...new Set(data.map(d => String(d[groupBy] || 'Other')))].slice(0, 8).map((group, index) => (
                    <Bar key={group} dataKey={group} fill={COLORS[index % COLORS.length]} />
                  ))
                ) : (
                  <Bar dataKey={yAxis} fill={COLORS[0]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'line':
        return (
          <div style={{ width: chartWidth, height: chartHeight, overflow: 'auto' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart {...commonProps}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid.stroke} />
                <XAxis 
                  dataKey={xAxis}
                  tick={{ fill: chartTheme.text.fill, fontSize: 12 }}
                  axisLine={{ stroke: chartTheme.axis.stroke }}
                />
                <YAxis 
                  tick={{ fill: chartTheme.text.fill, fontSize: 12 }}
                  axisLine={{ stroke: chartTheme.axis.stroke }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                    border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    color: isDarkMode ? '#f3f4f6' : '#111827',
                    fontSize: '14px'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey={yAxis} stroke={COLORS[0]} strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case 'pie':
        return (
          <div style={{ width: chartWidth, height: chartHeight, overflow: 'auto' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80 * zoomLevel}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                    border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    color: isDarkMode ? '#f3f4f6' : '#111827',
                    fontSize: '14px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );

      case 'scatter':
        return (
          <div style={{ width: chartWidth, height: chartHeight, overflow: 'auto' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart {...commonProps}>
                <CartesianGrid stroke={chartTheme.grid.stroke} />
                <XAxis 
                  dataKey={xAxis}
                  tick={{ fill: chartTheme.text.fill, fontSize: 12 }}
                  axisLine={{ stroke: chartTheme.axis.stroke }}
                />
                <YAxis 
                  dataKey={yAxis}
                  tick={{ fill: chartTheme.text.fill, fontSize: 12 }}
                  axisLine={{ stroke: chartTheme.axis.stroke }}
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                    border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    color: isDarkMode ? '#f3f4f6' : '#111827',
                    fontSize: '14px'
                  }}
                />
                <Scatter fill={COLORS[0]} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        );

      default:
        return null;
    }
  };

  const chartTypeOptions = [
    { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
    { value: 'line', label: 'Line Chart', icon: TrendingUp },
    { value: 'pie', label: 'Pie Chart', icon: PieChartIcon },
    { value: 'scatter', label: 'Scatter Plot', icon: Activity }
  ];

  return (
    <div className="space-y-6">
      {/* Chart Controls */}
      <div className="flex justify-between items-center">
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Chart Builder
        </h3>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 border border-gray-300 rounded-lg p-1">
            <Button variant="ghost" size="sm" onClick={handleZoomOut} disabled={zoomLevel <= 0.5}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className={`px-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button variant="ghost" size="sm" onClick={handleZoomIn} disabled={zoomLevel >= 3}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={resetZoom}>
              Reset
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={resetChart}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button variant="outline" size="sm" onClick={exportChart}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Chart Type Selection */}
      <div>
        <label className={`text-sm font-medium mb-3 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Chart Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          {chartTypeOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Button
                key={option.value}
                variant={chartType === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setChartType(option.value as any)}
                className={`flex items-center space-x-2 h-12 ${
                  chartType !== option.value && isDarkMode 
                    ? 'border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700' 
                    : ''
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{option.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Field Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={`text-sm font-medium mb-2 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            X-Axis {chartType === 'pie' ? '(Categories)' : ''}
            <Badge variant="secondary" className="ml-2 text-xs">Required</Badge>
          </label>
          <Select value={xAxis} onValueChange={setXAxis}>
            <SelectTrigger className={isDarkMode ? 'border-gray-600 bg-gray-800 text-gray-200' : ''}>
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              {allColumns.map((column) => (
                <SelectItem key={column.key} value={column.key}>
                  <div className="flex items-center space-x-2">
                    <span>{column.label}</span>
                    <Badge className={`text-xs ${
                      column.type === 'number' ? 'bg-blue-100 text-blue-800' :
                      column.type === 'date' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {column.type}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {chartType !== 'pie' && (
          <div>
            <label className={`text-sm font-medium mb-2 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Y-Axis (Values)
              <Badge variant="secondary" className="ml-2 text-xs">Required</Badge>
            </label>
            <Select value={yAxis} onValueChange={setYAxis}>
              <SelectTrigger className={isDarkMode ? 'border-gray-600 bg-gray-800 text-gray-200' : ''}>
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {numericColumns.map((column) => (
                  <SelectItem key={column.key} value={column.key}>
                    <div className="flex items-center space-x-2">
                      <span>{column.label}</span>
                      <Badge className="text-xs bg-blue-100 text-blue-800">
                        {column.type}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <label className={`text-sm font-medium mb-2 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Group By
            <Badge variant="outline" className="ml-2 text-xs">Optional</Badge>
          </label>
          <Select value={groupBy} onValueChange={setGroupBy}>
            <SelectTrigger className={isDarkMode ? 'border-gray-600 bg-gray-800 text-gray-200' : ''}>
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {categoricalColumns.map((column) => (
                <SelectItem key={column.key} value={column.key}>
                  <div className="flex items-center space-x-2">
                    <span>{column.label}</span>
                    <Badge className={`text-xs ${
                      column.type === 'date' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {column.type}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chart Display */}
      <div className={`border-2 rounded-xl p-6 transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900/50 border-gray-600' : 'bg-white/50 border-gray-200'
      }`}>
        {renderChart()}
      </div>

      {/* Chart Info */}
      {chartData.length > 0 && (
        <div className={`flex justify-between items-center text-sm ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          <span className="font-medium">{chartData.length} data points • Zoom: {Math.round(zoomLevel * 100)}%</span>
          <div className="flex items-center space-x-3">
            {xAxis && <Badge variant="outline">X: {columns.find(c => c.key === xAxis)?.label}</Badge>}
            {yAxis && <Badge variant="outline">Y: {columns.find(c => c.key === yAxis)?.label}</Badge>}
            {groupBy && groupBy !== 'none' && <Badge variant="outline">Group: {columns.find(c => c.key === groupBy)?.label}</Badge>}
          </div>
        </div>
      )}
    </div>
  );
};
