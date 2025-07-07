// File: src/pages/components/LogFilters.tsx
import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import 'ojs/ojselectcombobox';
import 'ojs/ojdatetimepicker';
import 'ojs/ojbutton';

import { useToast } from '../../../context/ToastContext'
import Toast from '../../../components/Toast';

import applicationsService, { Application, UserGroup } from '../../../services/applications.services';
import ArrayDataProvider = require('ojs/ojarraydataprovider');

interface LogFiltersProps {
  onFilterChange: (filters: {
    apps: string[];
    logTypes: string[];
    fromDate: string | undefined;
    toDate: string | undefined;
  }) => void;
}

const LogFilters = ({ onFilterChange }: LogFiltersProps) => {
  const [applications, setApplications] = useState<Application[]>([]);

  const [appOptions, setAppOptions] = useState<{ value: string, label: string }[]>([]);
  const [logTypeOptions] = useState([
    { value: 'info', label: 'info' },
    { value: 'debug', label: 'debug' },
    { value: 'error', label: 'error' },
    { value: 'warn', label: 'warn' },
  ]);


  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [selectedLogTypes, setSelectedLogTypes] = useState<string[]>([]);

  const [fromDate, setFromDate] = useState<string | undefined>(undefined);
  const [toDate, setToDate] = useState<string | undefined>(undefined);


  const { addNewToast } = useToast()

  // const logTypes = ["info", "debug", "error", "warn"]

  useEffect(() => {
    fetchApplications()

    // Create log types data provider
    // const logTypeOptions = logTypes.map(type => ({ value: type, label: type }));
    // setLogTypeDataProvider(new ArrayDataProvider(logTypeOptions, { keyAttributes: 'value' }));
  }, [])

  const fetchApplications = async () => {
    try {
      const data = await applicationsService.fetchUserApplications();
      const apps = data.applications || [];
      setApplications(apps);

      // Create app data provider - use app name instead of ID for the value
      const options = apps.map(app => ({
        value: app.name,
        label: app.name,
      }));
      setAppOptions(options);;
    } catch (error) {
      console.error('Failed to fetch applications', error);
      addNewToast('error', 'Failed to fetch applications', String(error));
    }
  };

  const toBackendDateFormat = (value?: string) =>
    value ? new Date(value).toISOString() : undefined;

  const handleApplyFilters = () => {
    console.log('Applying filters:', {
      apps: selectedApps,
      logTypes: selectedLogTypes,
      fromDate,
      toDate
    });

    onFilterChange({
      apps: selectedApps,
      logTypes: selectedLogTypes,
      fromDate: toBackendDateFormat(fromDate),
      toDate: toBackendDateFormat(toDate),
    });
  };

  const handleClearFilters = () => {
    setSelectedApps([]);
    setSelectedLogTypes([]);
    setFromDate(undefined);
    setToDate(undefined);

    onFilterChange({
      apps: [],
      logTypes: [],
      fromDate: undefined,
      toDate: undefined
    });
  };


  return (
    <div class="oj-flex oj-sm-flex-wrap-nowrap oj-sm-align-items-end oj-sm-gap-4x oj-sm-margin-4x">
      {/* App Filter */}
      <div class="oj-flex-item">
        <label class="oj-label">Apps</label>
        <oj-select-many
          options={appOptions} // ✅ CORRECT WAY
          value={selectedApps}
          onvalueChanged={(e: CustomEvent) => {
            setSelectedApps(e.detail.value || []);
          }}
          placeholder="Select apps"
          class="oj-form-control-width-md"
        />
      </div>

      <div class="oj-flex-item">
        <label class="oj-label">Apps</label>
        {/* Log Type Filter */}
        <oj-select-many
          options={logTypeOptions} // ✅ CORRECT WAY
          value={selectedLogTypes}
          onvalueChanged={(e: CustomEvent) => {
            setSelectedLogTypes(e.detail.value || []);
          }}
          placeholder="Select log types"
          class="oj-form-control-width-md"
        />
      </div>

      {/* From DateTime */}
      <div class="oj-flex-item">
        <label class="oj-label">From</label>
        <oj-input-date-time
          value={fromDate}
          onvalueChanged={(e: CustomEvent) => {
            console.log('From date changed:', e.detail.value);
            setFromDate(e.detail.value);
          }}
          class="oj-form-control-width-md"
        />
      </div>

      {/* To DateTime */}
      <div class="oj-flex-item">
        <label class="oj-label">To</label>
        <oj-input-date-time
          value={toDate}
          onvalueChanged={(e: CustomEvent) => {
            console.log('To date changed:', e.detail.value);
            setToDate(e.detail.value);
          }}
          class="oj-form-control-width-md"
        />
      </div>

      {/* Filter Buttons */}
      <div class="oj-flex-item oj-flex oj-sm-gap-2x">
        <oj-button onojAction={handleApplyFilters} chroming="callToAction">
          Apply Filters
        </oj-button>
        <oj-button onojAction={handleClearFilters} chroming="outlined">
          Clear
        </oj-button>
      </div>
      <Toast />
    </div>
  );
};

export default LogFilters;