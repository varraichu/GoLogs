import { h } from 'preact';
import { useState } from 'preact/hooks';
import 'ojs/ojselectcombobox';
import 'ojs/ojdatetimepicker';
import 'ojs/ojbutton';

interface LogFiltersProps {
  appsOptions: string[];
  logTypeOptions: string[];
  onFilterChange: (filters: {
    apps: string[];
    logTypes: string[];
    fromDate: string | null;
    toDate: string | null;
  }) => void;
}

const LogFilters = ({ appsOptions, logTypeOptions, onFilterChange }: LogFiltersProps) => {
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [selectedLogTypes, setSelectedLogTypes] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);

  const handleApplyFilters = () => {
    onFilterChange({
      apps: selectedApps,
      logTypes: selectedLogTypes,
      fromDate,
      toDate
    });
  };

  return (
    <div class="oj-flex oj-sm-flex-wrap-nowrap oj-sm-align-items-end oj-sm-gap-4x oj-sm-margin-4x">
      {/* App Filter */}
      <div class="oj-flex-item">
        <label class="oj-label">Apps</label>
        <oj-select-many
          value={selectedApps}
          onvalueChanged={(e: CustomEvent) => setSelectedApps(e.detail.value)}
          options={appsOptions.map(app => ({ value: app, label: app }))}
          placeholder="Select apps"
          class="oj-form-control-width-md"
        ></oj-select-many>
      </div>

      {/* Log Type Filter */}
      <div class="oj-flex-item">
        <label class="oj-label">Log Types</label>
        <oj-select-many
          value={selectedLogTypes}
          onvalueChanged={(e: CustomEvent) => setSelectedLogTypes(e.detail.value)}
          options={logTypeOptions.map(type => ({ value: type, label: type }))}
          placeholder="Select log types"
          class="oj-form-control-width-md"
        ></oj-select-many>
      </div>

      {/* From Date */}
      <div class="oj-flex-item">
        <label class="oj-label">From</label>
        <oj-input-date
        //   value={fromDate}
          onvalueChanged={(e: CustomEvent) => setFromDate(e.detail.value)}
          class="oj-form-control-width-md"
        ></oj-input-date>
      </div>

      {/* To Date */}
      <div class="oj-flex-item">
        <label class="oj-label">To</label>
        <oj-input-date
        //   value={toDate}
          onvalueChanged={(e: CustomEvent) => setToDate(e.detail.value)}
          class="oj-form-control-width-md"
        ></oj-input-date>
      </div>

      {/* Filter Button */}
      <div class="oj-flex-item">
        <oj-button onojAction={handleApplyFilters} chroming="callToAction">
          Apply Filters
        </oj-button>
      </div>
    </div>
  );
};

export default LogFilters;
