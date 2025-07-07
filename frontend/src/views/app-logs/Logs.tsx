// File: src/pages/Logs.tsx
import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import 'ojs/ojtable';
import 'ojs/ojbutton';
import ArrayDataProvider = require('ojs/ojarraydataprovider');

import { useToast } from '../../context/ToastContext'
import Toast from '../../components/Toast';

import 'oj-c/table';
import { logsService, LogEntry, Pagination, SortCriteria } from '../../services/logs.services';
import LogFilters from './components/LogFilters';



const Logs = (props: { path?: string }) => {
  const [adminLogs, setAdminLogs] = useState<LogEntry[]>([]);
  const [dataProvider, setDataProvider] = useState<any>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Set default sort criteria for backend
  const [sortCriteria, setSortCriteria] = useState<SortCriteria[]>([
    { attribute: 'timestamp', direction: 'descending' }
  ]);

  // const [frontendSortCriteria, setFrontendSortCriteria] = useState<{ key: string, direction: 'ascending' | 'descending' } | null>(null);
  const [filters, setFilters] = useState<{
    apps: string[];
    logTypes: string[];
    fromDate: string | undefined;
    toDate: string | undefined;
  }>({
    apps: [],
    logTypes: [],
    fromDate: undefined,
    toDate: undefined,
  });

  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const { addNewToast } = useToast()

  // Fetch logs when page or sort criteria changes
  useEffect(() => {
    fetchLogs(pagination.page);
  }, [pagination.page, sortCriteria, filters]);

  const fetchLogs = async (page: number) => {
    setIsLoading(true);
    try {
      // Pass sort criteria to backend
      console.log("sort criteria: ", sortCriteria);
      console.log("filtera: ", filters);
      const data = await logsService.fetchLogs(page, pagination.limit, sortCriteria, filters);

      const formattedLogs = (data.logs || []).map((log: LogEntry) => ({
        ...log,
        timestamp: new Date(log.timestamp).toLocaleString(),
        ingested_at: new Date(log.ingested_at).toLocaleString(),
      }));

      setAdminLogs(formattedLogs || []);
      setPagination(data.pagination || {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      });

      // Create a simple data provider without frontend sorting
      // since sorting is handled by the backend
      const baseProvider = new ArrayDataProvider(formattedLogs || [], { keyAttributes: '_id' });
      setDataProvider(baseProvider);

    } catch (error: any) {
      addNewToast('error', 'Error', error.message || 'Failed to fetch logs.');
      console.error("Failed to fetch logs", error);
    }
    finally {
      setIsLoading(false);
    }
  };

  const goToNextPage = () => {
    if (pagination.hasNextPage && !isLoading) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
    }
  };

  const goToPrevPage = () => {
    if (pagination.hasPrevPage && !isLoading) {
      setPagination(prev => ({ ...prev, page: prev.page - 1 }));
    }
  };

  const handleSort = (event: CustomEvent) => {
    const { header, direction } = event.detail;

    if (!header || !direction) return;

    // Update frontend indicator
    // setFrontendSortCriteria({ key: header, direction });

    // Backend sort
    const newSort = { attribute: header, direction };
    setSortCriteria((prev) => {
      const others = prev.filter(c => c.attribute !== header);
      return [newSort, ...others];
    });

    // Reset page with debounce
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 150);
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 })); // reset to first page
  };

  return (
    <div
      class="oj-flex oj-sm-justify-content-center oj-sm-flex-direction-column"
      style="height: 100%; min-height: 0; flex: 1 1 0;"
    >
      <div class="oj-flex oj-sm-12 oj-sm-padding-2x oj-sm-justify-content-space-between oj-sm-align-items-center">
        <h1 class="oj-typography-heading-md">Logs</h1>
      </div>
      <div>

        <LogFilters onFilterChange={handleFilterChange} />
        
      </div>

      <div
        class="oj-flex oj-sm-margin-4x"
        style={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        <oj-table
          data={dataProvider}
          onojSort={handleSort}
          columns={[
            { headerText: 'App Name', field: 'app_name', resizable: "enabled", sortable: 'enabled', },
            { headerText: 'Log Type', field: 'log_type', resizable: "enabled", sortable: 'enabled', },
            { headerText: 'Message', field: 'message', resizable: "enabled", sortable: 'enabled', },
            { headerText: 'Timestamp', field: 'timestamp', resizable: "enabled", sortable: 'enabled', }
          ]}
          display='grid'
          class=" oj-sm-12"
          layout='fixed'
          horizontal-grid-visible="enabled"
          vertical-grid-visible="enabled"
        >
        </oj-table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div
          class="oj-flex oj-sm-flex-direction-row oj-sm-align-items-center oj-sm-justify-content-center oj-sm-margin-y-4x"
          style="gap: 16px;"
        >
          <oj-button
            chroming="callToAction"
            onojAction={goToPrevPage}
            disabled={!pagination.hasPrevPage || isLoading}
          >
            <span slot="startIcon" class="oj-ux-ico-arrow-left"></span>
            Previous
          </oj-button>

          <span class="oj-typography-body-md oj-text-color-primary">
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <oj-button
            chroming="callToAction"
            onojAction={goToNextPage}
            disabled={!pagination.hasNextPage || isLoading}
          >
            Next
            <span slot="endIcon" class="oj-ux-ico-arrow-right"></span>
          </oj-button>
        </div>
      )}

      <Toast />

    </div>
  );
};

export default Logs;