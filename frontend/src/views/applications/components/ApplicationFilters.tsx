import { Fragment, h } from 'preact';
import { useEffect, useState, useMemo } from 'preact/hooks';
import 'oj-c/select-single';
import 'ojs/ojselectcombobox'; // Corrected import for oj-select-many
import 'oj-c/button';
import ArrayDataProvider = require('ojs/ojarraydataprovider');

import applicationsService, { UserGroup } from '../../../services/applications.services';

interface AppFilters {
  groupIds: string[];
  status: string;
}

interface ApplicationFiltersProps {
  onFilterChange: (filters: AppFilters) => void;
}

export const ApplicationFilters = ({ onFilterChange }: ApplicationFiltersProps) => {
  const [allUserGroups, setAllUserGroups] = useState<UserGroup[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const statusOptions = useMemo(() => {
    return new ArrayDataProvider([
      { value: 'all', label: 'All' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ], { keyAttributes: 'value' });
  }, []);

  const groupFilterOptions = useMemo(() => {
    return new ArrayDataProvider(
      allUserGroups.map(g => ({ value: g._id, label: g.name })),
      { keyAttributes: 'value' }
    );
  }, [allUserGroups]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const groups = await applicationsService.fetchAllUserGroups();
        setAllUserGroups(groups.filter(g => !g.is_deleted));
      } catch (error) {
        console.error('Error fetching usergroups for filter:', error);
      }
    };
    fetchGroups();
  }, []);

  const applyFilters = (groups: string[], status: string) => {
    onFilterChange({
      groupIds: groups,
      status: status,
    });
  };

  const handleGroupChange = (e: CustomEvent) => {
    const newGroups = e.detail.value || [];
    setSelectedGroups(newGroups);
    applyFilters(newGroups, selectedStatus);
  };

  const handleStatusChange = (e: CustomEvent) => {
    const newStatus = e.detail.value || 'all';
    setSelectedStatus(newStatus);
    applyFilters(selectedGroups, newStatus);
  };

  const handleClearFilters = () => {
    setSelectedGroups([]);
    setSelectedStatus('all');
    onFilterChange({
      groupIds: [],
      status: 'all',
    });
  };

  return (
    // <Fragment>
    <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-flex-start oj-sm-padding-4x-start oj-sm-padding-4x-end">

      <div class="oj-flex-item oj-sm-flex-1 oj-sm-padding-2x-bottom" >
        {/* User Group Filter */}
        <oj-select-many
          class="oj-form-control-width-sm"
          // style="width: 300px; flex-grow: 0; flex-wrap: wrap;"
          labelHint="Filter by User Group"
          options={groupFilterOptions}
          onvalueChanged={handleGroupChange}
          value={selectedGroups}
          item-text="label"
        ></oj-select-many>
      </div>

      {/* Status Filter */}
      <div class="oj-flex-item oj-sm-flex-1 oj-sm-padding-2x-bottom" >
        <oj-c-select-single
          class="oj-form-control-width-sm"
          // class="oj-flex-item oj-sm-margin-4x-end oj-sm-margin-2x-top"
          // style="width: 200px; height: 2.375rem; flex-grow: 0;"
          labelHint="Status"
          data={statusOptions}
          onvalueChanged={handleStatusChange}
          value={selectedStatus}
          item-text="label"
        ></oj-c-select-single>
      </div>


      {/* Clear Button */}
      {/* <div class="oj-flex-item oj-sm-flex-1 oj-sm-padding-2x-bottom" > */}
      <oj-c-button
        class="oj-form-control-width-sm"
        onojAction={handleClearFilters}
        label="Clear Filters"
        chroming="outlined"
        // style="height: 2.375rem;"
      ></oj-c-button>
        {/* </div> */}
      {/* </Fragment> */}
    </div>
  );
};