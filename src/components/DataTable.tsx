import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Download, Filter, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface DataTableProps {
  data: any[];
  columns: any[];
}

export const DataTable: React.FC<DataTableProps> = ({ data, columns }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const rowsPerPage = 10;

  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    // Filter by search term
    if (searchTerm) {
      filtered = data.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Sort data
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        
        // Handle numbers
        if (!isNaN(Number(aVal)) && !isNaN(Number(bVal))) {
          return sortDirection === 'asc' 
            ? Number(aVal) - Number(bVal)
            : Number(bVal) - Number(aVal);
        }
        
        // Handle strings
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        
        if (sortDirection === 'asc') {
          return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
        } else {
          return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
        }
      });
    }

    return filtered;
  }, [data, searchTerm, sortColumn, sortDirection]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredAndSortedData.slice(start, start + rowsPerPage);
  }, [filteredAndSortedData, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedData.length / rowsPerPage);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const addToDashboard = () => {
    const savedWidgets = localStorage.getItem('snapgraph-dashboard-widgets');
    let widgets = [];
    
    try {
      widgets = savedWidgets ? JSON.parse(savedWidgets) : [];
    } catch (error) {
      console.error('Error loading dashboard widgets:', error);
    }

    const newWidget = {
      id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'chart',
      title: 'Data Table Chart',
      config: {
        chartType: 'bar',
        xAxis: columns.find(col => col.type !== 'number')?.key || columns[0]?.key,
        yAxis: columns.find(col => col.type === 'number')?.key || columns[1]?.key,
        showLegend: true,
        showGrid: true
      },
      size: 'medium'
    };

    const updatedWidgets = [...widgets, newWidget];
    localStorage.setItem('snapgraph-dashboard-widgets', JSON.stringify(updatedWidgets));
    
    // Save chart config separately
    localStorage.setItem(`chart-config-${newWidget.id}`, JSON.stringify(newWidget.config));
    
    toast.success('Chart added to dashboard successfully!');
    console.log('Added chart to dashboard:', newWidget);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'number': return 'bg-blue-100 text-blue-800';
      case 'date': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatValue = (value: any, type: string) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400 italic">—</span>;
    }
    
    if (type === 'number' && !isNaN(Number(value))) {
      return Number(value).toLocaleString();
    }
    
    if (type === 'date' && !isNaN(Date.parse(value))) {
      return new Date(value).toLocaleDateString();
    }
    
    return String(value);
  };

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center space-x-2">
            <span>Data Preview</span>
            <Badge variant="secondary">{filteredAndSortedData.length} rows</Badge>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search data..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline" size="sm" onClick={addToDashboard}>
              <Plus className="h-4 w-4 mr-2" />
              Add to Dashboard
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{column.label}</span>
                      <Badge className={`text-xs ${getTypeColor(column.type)}`}>
                        {column.type}
                      </Badge>
                      {sortColumn === column.key && (
                        <span className="text-blue-600">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 text-sm text-gray-900">
                      {formatValue(row[column.key], column.type)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-4 py-3 border-t bg-gray-50">
            <div className="text-sm text-gray-700">
              Showing {(currentPage - 1) * rowsPerPage + 1} to{' '}
              {Math.min(currentPage * rowsPerPage, filteredAndSortedData.length)} of{' '}
              {filteredAndSortedData.length} results
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
