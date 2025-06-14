
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Settings, Download, Layout, BarChart3, PieChart, TrendingUp, Hash } from 'lucide-react';
import { ChartBuilder } from '@/components/ChartBuilder';
import { Badge } from '@/components/ui/badge';

interface DashboardProps {
  data: any[];
  columns: any[];
}

interface Widget {
  id: string;
  type: 'chart' | 'kpi' | 'table';
  title: string;
  config: any;
  size: 'small' | 'medium' | 'large';
}

export const Dashboard: React.FC<DashboardProps> = ({ data, columns }) => {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [editMode, setEditMode] = useState(false);

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

  const addWidget = (type: Widget['type']) => {
    const newWidget: Widget = {
      id: Date.now().toString(),
      type,
      title: `New ${type}`,
      config: {},
      size: 'medium'
    };
    setWidgets([...widgets, newWidget]);
  };

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600">
            Interactive data visualization and insights
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={editMode ? "default" : "outline"}
            size="sm"
            onClick={() => setEditMode(!editMode)}
          >
            <Layout className="h-4 w-4 mr-2" />
            {editMode ? 'Done' : 'Edit'}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {kpis.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, index) => (
            <Card key={index} className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{kpi.label}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {kpi.value.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      Avg: {kpi.avg.toFixed(1)} • Max: {kpi.max.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Hash className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Quick Chart</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartBuilder data={data} columns={columns} />
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Data Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{totalRows}</div>
                <div className="text-sm text-gray-600">Total Records</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{columns.length}</div>
                <div className="text-sm text-gray-600">Columns</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Column Types</h4>
              <div className="flex flex-wrap gap-2">
                {['number', 'text', 'date'].map(type => {
                  const count = columns.filter(col => col.type === type).length;
                  return count > 0 ? (
                    <Badge key={type} variant="outline" className="text-xs">
                      {count} {type}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>

            {numericColumns.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Numeric Columns</h4>
                <div className="space-y-1">
                  {numericColumns.slice(0, 3).map(col => (
                    <div key={col.key} className="flex justify-between items-center text-sm">
                      <span>{col.label}</span>
                      <span className="text-gray-500">
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
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg border-dashed border-blue-300">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-4">Add New Widget</h3>
              <div className="flex justify-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => addWidget('chart')}
                  className="flex items-center space-x-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Chart</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => addWidget('kpi')}
                  className="flex items-center space-x-2"
                >
                  <Hash className="h-4 w-4" />
                  <span>KPI</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => addWidget('table')}
                  className="flex items-center space-x-2"
                >
                  <Layout className="h-4 w-4" />
                  <span>Table</span>
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
            <Card key={widget.id} className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{widget.title}</CardTitle>
                  {editMode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeWidget(widget.id)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {widget.type === 'chart' && (
                  <ChartBuilder data={data} columns={columns} />
                )}
                {widget.type === 'kpi' && (
                  <div className="text-center p-8">
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {totalRows.toLocaleString()}
                    </div>
                    <div className="text-gray-600">Custom KPI</div>
                  </div>
                )}
                {widget.type === 'table' && (
                  <div className="text-center p-8 text-gray-500">
                    Custom table widget (coming soon)
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {widgets.length === 0 && !editMode && (
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Your Dashboard is Ready
            </h3>
            <p className="text-gray-600 mb-6">
              Use the charts above to explore your data, or enter edit mode to add custom widgets.
            </p>
            <Button onClick={() => setEditMode(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Widgets
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
