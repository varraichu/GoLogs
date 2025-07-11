import { h } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import 'oj-c/select-single';
import 'oj-c/button';
import ArrayDataProvider = require('ojs/ojarraydataprovider');

interface AppFilters {
  status: string;
}

interface ApplicationFiltersProps {
  onFilterChange: (filters: AppFilters) => void;
}

export const UserApplicationFilters = ({ onFilterChange }: ApplicationFiltersProps) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const statusOptions = useMemo(() => {
    return new ArrayDataProvider([
      { value: 'all', label: 'All' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ], { keyAttributes: 'value' });
  }, []);

  const handleStatusChange = (e: CustomEvent) => {
    const newStatus = e.detail.value || 'all';
    setSelectedStatus(newStatus);
    onFilterChange({ status: newStatus });
  };

  const handleClearFilters = () => {
    setSelectedStatus('all');
    onFilterChange({ status: 'all' });
  };

  return (
    <div class="oj-flex oj-sm-flex-direction-column oj-sm-padding-4x-start oj-sm-padding-4x-end">
      <div class="oj-flex-item oj-sm-flex-1 oj-sm-padding-2x-bottom">
        <oj-c-select-single
          class="oj-form-control-width-sm"
          labelHint="Status"
          data={statusOptions}
          onvalueChanged={handleStatusChange}
          value={selectedStatus}
          item-text="label"
        ></oj-c-select-single>
      </div>

      <oj-c-button
        class="oj-form-control-width-sm"
        onojAction={handleClearFilters}
        label="Clear Filters"
        chroming="outlined"
      ></oj-c-button>
    </div>
  );
};