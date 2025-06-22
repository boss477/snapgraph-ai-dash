import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Download, RefreshCw, BarChart3 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'sonner';

interface PivotTableProps {
  data: any[];
  columns: any[];
}

interface PivotConfig {
  rows: string[];
  columns: string[];
  values: { field: string; aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max' }[];
}

export const PivotTable: React.FC<PivotTableProps> = ({ data, columns }) => {
  const [config, setConfig] = useState<PivotConfig>({
    rows: [],
    columns: [],
    values: []
  });
  const { isDarkMode } = useTheme();

  const availableFields = columns.map(col => ({
    id: col.key,
    label: col.label,
    type: col.type
  }));

  const numericFields = columns.filter(col => col.type === 'number');

  const pivotData = useMemo(() => {
    if (config.values.length === 0) return { headers: [], rows: [] };

    // Create a nested structure for pivot data
    const result: Record<string, any> = {};
    
    // Process each row in the original data
    data.forEach(row => {
      // Build row key from row fields
      const rowKey = config.rows.length > 0 
        ? config.rows.map(field => String(row[field] || '')).join(' | ')
        : 'Total';
      
      // Build column key from column fields
      const colKey = config.columns.length > 0
        ? config.columns.map(field => String(row[field] || '')).join(' | ')
        : 'Total';

      // Initialize nested structure
      if (!result[rowKey]) {
        result[rowKey] = {};
      }
      if (!result[rowKey][colKey]) {
        result[rowKey][colKey] = {
          count: 0,
          values: config.values.reduce((acc, val) => ({ ...acc, [val.field]: [] }), {})
        };
      }

      // Add values
      result[rowKey][colKey].count++;
      config.values.forEach(({ field }) => {
        const value = row[field];
        if (value !== null && value !== undefined && value !== '') {
          result[rowKey][colKey].values[field].push(Number(value) || 0);
        }
      });
    });

    // Calculate aggregations and build table structure
    const allColKeys = new Set<string>();
    Object.values(result).forEach(rowData => {
      Object.keys(rowData).forEach(colKey => allColKeys.add(colKey));
    });

    const headers = [''].concat(Array.from(allColKeys));
    const rows = Object.entries(result).map(([rowKey, rowData]) => {
      const row = [rowKey];
      Array.from(allColKeys).forEach(colKey => {
        if (rowData[colKey]) {
          const cellData = rowData[colKey];
          const cellValues: string[] = [];
          
          config.values.forEach(({ field, aggregation }) => {
            const values = cellData.values[field] || [];
            let result: number;
            
            switch (aggregation) {
              case 'sum':
                result = values.reduce((a, b) => a + b, 0);
                break;
              case 'avg':
                result = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
                break;
              case 'count':
                result = cellData.count;
                break;
              case 'min':
                result = values.length > 0 ? Math.min(...values) : 0;
                break;
              case 'max':
                result = values.length > 0 ? Math.max(...values) : 0;
                break;
              default:
                result = 0;
            }
            
            cellValues.push(result.toLocaleString());
          });
          
          row.push(cellValues.join(' | '));
        } else {
          row.push('—');
        }
      });
      return row;
    });

    return { headers, rows };
  }, [data, config]);

  const addToDashboard = () => {
    if (config.values.length === 0) {
      toast.error('Please add at least one value field to create a pivot table widget');
      return;
    }

    const savedWidgets = localStorage.getItem('snapgraph-dashboard-widgets');
    let widgets = [];
    
    try {
      widgets = savedWidgets ? JSON.parse(savedWidgets) : [];
    } catch (error) {
      console.error('Error loading dashboard widgets:', error);
    }

    const newWidget = {
      id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'pivot',
      title: `Pivot Table - ${config.values.map(v => v.field).join(', ')}`,
      config: {
        rows: config.rows,
        columns: config.columns,
        values: config.values
      },
      size: 'large'
    };

    const updatedWidgets = [...widgets, newWidget];
    localStorage.setItem('snapgraph-dashboard-widgets', JSON.stringify(updatedWidgets));
    
    toast.success('Pivot table added to dashboard successfully!');
    console.log('Added pivot table to dashboard:', newWidget);
  };

  const addField = (area: keyof PivotConfig, field: string) => {
    if (area === 'values') {
      const numericField = numericFields.find(f => f.key === field);
      if (numericField) {
        setConfig(prev => ({
          ...prev,
          values: [...prev.values, { field, aggregation: 'sum' }]
        }));
      }
    } else {
      setConfig(prev => ({
        ...prev,
        [area]: [...prev[area], field]
      }));
    }
  };

  const removeField = (area: keyof PivotConfig, index: number) => {
    setConfig(prev => ({
      ...prev,
      [area]: prev[area].filter((_, i) => i !== index)
    }));
  };

  const updateAggregation = (index: number, aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max') => {
    setConfig(prev => ({
      ...prev,
      values: prev.values.map((val, i) => i === index ? { ...val, aggregation } : val)
    }));
  };

  const resetPivot = () => {
    setConfig({ rows: [], columns: [], values: [] });
  };

  return (
    <Card className={`backdrop-blur-sm border-0 shadow-lg transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-800/70 border-gray-700' : 'bg-white/70 border-gray-200'
    }`}>
      <CardHeader>
        <CardTitle className={`flex items-center justify-between ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <span>Pivot Table Builder</span>
          <div className="flex items-center space-x-2">
            {config.values.length > 0 && (
              <Button variant="outline" size="sm" onClick={addToDashboard}>
                <Plus className="h-4 w-4 mr-2" />
                Add to Dashboard
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={resetPivot}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Field Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Rows */}
          <div>
            <h3 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Rows</h3>
            <div className="space-y-2 mb-3">
              {config.rows.map((field, index) => (
                <div key={index} className={`flex items-center justify-between p-2 rounded ${
                  isDarkMode ? 'bg-blue-900/50' : 'bg-blue-50'
                }`}>
                  <span className={`text-sm ${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                    {columns.find(c => c.key === field)?.label}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeField('rows', index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <Select onValueChange={(value) => addField('rows', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Add row field" />
              </SelectTrigger>
              <SelectContent>
                {availableFields.filter(f => !config.rows.includes(f.id)).map((field) => (
                  <SelectItem key={field.id} value={field.id}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Columns */}
          <div>
            <h3 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Columns</h3>
            <div className="space-y-2 mb-3">
              {config.columns.map((field, index) => (
                <div key={index} className={`flex items-center justify-between p-2 rounded ${
                  isDarkMode ? 'bg-green-900/50' : 'bg-green-50'
                }`}>
                  <span className={`text-sm ${isDarkMode ? 'text-green-200' : 'text-green-800'}`}>
                    {columns.find(c => c.key === field)?.label}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeField('columns', index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <Select onValueChange={(value) => addField('columns', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Add column field" />
              </SelectTrigger>
              <SelectContent>
                {availableFields.filter(f => !config.columns.includes(f.id)).map((field) => (
                  <SelectItem key={field.id} value={field.id}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Values */}
          <div>
            <h3 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Values</h3>
            <div className="space-y-2 mb-3">
              {config.values.map((value, index) => (
                <div key={index} className={`p-2 rounded space-y-2 ${
                  isDarkMode ? 'bg-purple-900/50' : 'bg-purple-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${isDarkMode ? 'text-purple-200' : 'text-purple-800'}`}>
                      {columns.find(c => c.key === value.field)?.label}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeField('values', index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <Select
                    value={value.aggregation}
                    onValueChange={(agg) => updateAggregation(index, agg as any)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sum">Sum</SelectItem>
                      <SelectItem value="avg">Average</SelectItem>
                      <SelectItem value="count">Count</SelectItem>
                      <SelectItem value="min">Minimum</SelectItem>
                      <SelectItem value="max">Maximum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <Select onValueChange={(value) => addField('values', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Add value field" />
              </SelectTrigger>
              <SelectContent>
                {numericFields.filter(f => !config.values.some(v => v.field === f.key)).map((field) => (
                  <SelectItem key={field.key} value={field.key}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Pivot Table Display */}
        {config.values.length > 0 ? (
          <div className={`border rounded-lg overflow-hidden transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-900 border-gray-600' : 'bg-white border-gray-200'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                  <tr>
                    {pivotData.headers.map((header, index) => (
                      <th
                        key={index}
                        className={`px-4 py-2 text-left text-xs font-medium uppercase tracking-wider border-r ${
                          isDarkMode 
                            ? 'text-gray-300 border-gray-600' 
                            : 'text-gray-500 border-gray-200'
                        }`}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-gray-600' : 'divide-gray-200'}`}>
                  {pivotData.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className={`hover:${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className={`px-4 py-2 text-sm border-r ${
                            cellIndex === 0 
                              ? `font-medium ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-50 text-gray-700'}`
                              : isDarkMode ? 'text-gray-300' : 'text-gray-900'
                          } ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-300 ${
            isDarkMode ? 'border-gray-600' : 'border-gray-300'
          }`}>
            <BarChart3 className={`h-12 w-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Build Your Pivot Table
            </h3>
            <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Drag fields into Rows, Columns, and Values to create your pivot table analysis.
            </p>
            <Badge variant="outline" className="mb-2">
              Add at least one value field to get started
            </Badge>
          </div>
        )}

        {/* Summary */}
        {config.values.length > 0 && (
          <div className={`flex justify-between items-center text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <div className="flex items-center space-x-4">
              <span>{pivotData.rows.length} rows</span>
              <span>{pivotData.headers.length - 1} columns</span>
            </div>
            <div className="flex items-center space-x-2">
              {config.rows.length > 0 && (
                <Badge variant="outline">
                  Rows: {config.rows.length}
                </Badge>
              )}
              {config.columns.length > 0 && (
                <Badge variant="outline">
                  Cols: {config.columns.length}
                </Badge>
              )}
              <Badge variant="outline">
                Values: {config.values.length}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
