
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Download, RefreshCw, BarChart3 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

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
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Pivot Table Builder</span>
          <div className="flex items-center space-x-2">
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
            <h3 className="font-medium mb-2">Rows</h3>
            <div className="space-y-2 mb-3">
              {config.rows.map((field, index) => (
                <div key={index} className="flex items-center justify-between bg-blue-50 p-2 rounded">
                  <span className="text-sm">{columns.find(c => c.key === field)?.label}</span>
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
            <h3 className="font-medium mb-2">Columns</h3>
            <div className="space-y-2 mb-3">
              {config.columns.map((field, index) => (
                <div key={index} className="flex items-center justify-between bg-green-50 p-2 rounded">
                  <span className="text-sm">{columns.find(c => c.key === field)?.label}</span>
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
            <h3 className="font-medium mb-2">Values</h3>
            <div className="space-y-2 mb-3">
              {config.values.map((value, index) => (
                <div key={index} className="bg-purple-50 p-2 rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{columns.find(c => c.key === value.field)?.label}</span>
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
          <div className="border rounded-lg overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {pivotData.headers.map((header, index) => (
                      <th
                        key={index}
                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pivotData.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50">
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className={`px-4 py-2 text-sm border-r ${
                            cellIndex === 0 ? 'font-medium bg-gray-50' : 'text-gray-900'
                          }`}
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
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Build Your Pivot Table</h3>
            <p className="text-gray-600 mb-4">
              Drag fields into Rows, Columns, and Values to create your pivot table analysis.
            </p>
            <Badge variant="outline" className="mb-2">
              Add at least one value field to get started
            </Badge>
          </div>
        )}

        {/* Summary */}
        {config.values.length > 0 && (
          <div className="flex justify-between items-center text-sm text-gray-600">
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
