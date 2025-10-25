import React from 'react';
import { Database, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dataset } from '@/types/dataset';

interface DatasetSelectorProps {
  datasets: Dataset[];
  selectedDatasetId: string | null;
  onSelectDataset: (id: string) => void;
  onDeleteDataset: (id: string) => void;
  onAddNew: () => void;
  isDarkMode: boolean;
}

export const DatasetSelector: React.FC<DatasetSelectorProps> = ({
  datasets,
  selectedDatasetId,
  onSelectDataset,
  onDeleteDataset,
  onAddNew,
  isDarkMode
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Your Datasets ({datasets.length})
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onAddNew}
          className={isDarkMode ? 'border-gray-600 hover:bg-gray-800' : ''}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Dataset
        </Button>
      </div>
      
      <div className="grid gap-2">
        {datasets.map((dataset) => {
          const isSelected = dataset.id === selectedDatasetId;
          return (
            <Card
              key={dataset.id}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? isDarkMode
                    ? 'bg-blue-900/30 border-blue-500'
                    : 'bg-blue-50 border-blue-500'
                  : isDarkMode
                  ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
                  : 'bg-white/70 border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => onSelectDataset(dataset.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Database className={`h-4 w-4 flex-shrink-0 ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      }`} />
                      <h4 className={`text-sm font-semibold truncate ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {dataset.name}
                      </h4>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        {dataset.data.length} rows
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {dataset.columns.length} cols
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDataset(dataset.id);
                    }}
                    className={`flex-shrink-0 ${
                      isDarkMode
                        ? 'text-red-400 hover:text-red-300 hover:bg-red-900/30'
                        : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                    }`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
