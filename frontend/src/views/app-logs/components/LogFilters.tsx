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
  const [retention, setRetention] = useState<number>(0); // default

  const now = new Date();
  const localDateTime = now.getFullYear()
    + '-' + String(now.getMonth() + 1).padStart(2, '0')
    + '-' + String(now.getDate()).padStart(2, '0')
    + 'T' + String(now.getHours()).padStart(2, '0')
    + ':' + String(now.getMinutes()).padStart(2, '0');

  const thirtyDaysAgo = new Date(now.getTime() - retention * 24 * 60 * 60 * 1000);
  const minDateTime = thirtyDaysAgo.toISOString().slice(0, 16); // same format



  useEffect(() => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    try {
      async function fetchRetention() {
        try {
          const response = await fetch('http://localhost:3001/api/logs/get/ttl', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch retention. Status: ${response.status}`);
          }

          const data = await response.json();
          setRetention(data.ttlInDays || 30);
        } catch (error) {
          console.error('Error fetching retention:', error);
        }
      }

      fetchRetention();
    } catch (err) {
      console.error('Invalid JWT token:', err);
    }
  }, []);

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

    <div class="oj-flex oj-sm-align-items-flex-end oj-sm-justify-content-space-around oj-sm-padding-4x-start oj-sm-padding-4x-end"
      onKeyDown={(e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleApplyFilters();
        }
      }}
    >
      {/* <div class="oj-flex oj-sm-align-items-flex-end oj-sm-justify-content-space-around oj-sm-padding-4x" style={{ backgroundColor: '#8ace00'}}> */}
      {/* App Filter */}
      <div class="oj-flex-item oj-sm-flex-1" >
        {/* <label class="oj-label">Apps</label> */}
        <oj-select-many
          options={appOptions}
          value={selectedApps}
          onvalueChanged={(e: CustomEvent) => setSelectedApps(e.detail.value || [])}
          placeholder="Apps"
          class="oj-form-control-width-sm"
          label-hint="Apps"
          label-edge="inside"
        />
      </div>

      {/* Log Type Filter */}
      <div class="oj-flex-item oj-sm-flex-1">
        {/* <label class="oj-label">Log Type</label> */}
        <oj-select-many
          options={logTypeOptions}
          value={selectedLogTypes}
          onvalueChanged={(e: CustomEvent) => setSelectedLogTypes(e.detail.value || [])}
          placeholder="Type"
          class="oj-form-control-width-sm"
          label-hint="Log Type"
          label-edge="inside"
        />
      </div>

      {/* From DateTime */}
      <div class="oj-flex-item oj-sm-flex-1">
        {/* <label class="oj-label">From</label> */}
        <oj-input-date-time
          value={fromDate}
          onvalueChanged={(e: CustomEvent) => setFromDate(e.detail.value)}
          max={localDateTime}
          min={minDateTime}
          class="oj-form-control-width-sm"
          timePicker={{
            footerLayout: '',
            timeIncrement: '00:01:00:00'
          }}
          label-hint="From"
          label-edge="inside"
        />
      </div>

      {/* To DateTime */}
      <div class="oj-flex-item oj-sm-flex-1">
        <oj-input-date-time
          value={toDate}
          onvalueChanged={(e: CustomEvent) => setToDate(e.detail.value)}
          max={localDateTime}
          min={minDateTime}
          class="oj-form-control-width-sm"
          timePicker={{
            footerLayout: '',
            timeIncrement: '00:01:00:00'
          }}
          label-hint="To"
          label-edge="inside"
        />
      </div>

      <oj-button
        onojAction={handleApplyFilters}
        chroming="callToAction"
        class='oj-sm-margin-4x-end'
      >
        Apply
      </oj-button>
      <oj-button
        onojAction={handleClearFilters}
        chroming="outlined"
      >
        Clear
      </oj-button>
      {/* Filter Buttons */}
      {/* <div
        class="oj-flex-item oj-sm-flex oj-sm-justify-content-flex-start oj-sm-align-items-flex-start "
        style={{ backgroundColor: '#12ffed' }}
      >
          <oj-button
            onojAction={handleApplyFilters}
            chroming="callToAction"
          class='oj-sm-margin-4x-end'
          >
            Apply
          </oj-button>
        <oj-button
          onojAction={handleClearFilters}
          chroming="outlined"
        >
          Clear
        </oj-button>
      </div> */}


      <Toast />
    </div>
  );

};

export default LogFilters;