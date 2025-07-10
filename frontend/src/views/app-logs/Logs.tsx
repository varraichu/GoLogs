// File: src/pages/Logs.tsx
import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import 'ojs/ojtable';
import 'ojs/ojbutton';
import ArrayDataProvider = require('ojs/ojarraydataprovider');
import { KeySetImpl } from 'ojs/ojkeyset';

import { useToast } from '../../context/ToastContext'
import Toast from '../../components/Toast';

import 'oj-c/table';
import 'oj-c/progress-circle';
import { logsService, LogEntry, Pagination, SortCriteria } from '../../services/logs.services';
import LogFilters from './components/LogFilters';
import SearchBar from '../../components/SearchBar';
import LogDetailsModal from './components/LogDetailsModal';



const Logs = (props: { path?: string }) => {
  const [adminLogs, setAdminLogs] = useState<LogEntry[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
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
    search: string;
  }>({
    apps: [],
    logTypes: [],
    fromDate: undefined,
    toDate: undefined,
    search: '',
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
  const [selectedRows, setSelectedRows] = useState<{ row: KeySetImpl<any> }>({
    row: new KeySetImpl<any>()
  });

  const [showLogDialog, setShowLogDialog] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);

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

      const formattedLogs = (data.logs || []).map((log: LogEntry, idx) => ({
        rowNumber: (pagination.page - 1) * pagination.limit + idx + 1,
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

  const handleFilterChange = (newFilters: Omit<typeof filters, 'search'>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getDir = (field: string) => {
    // console.log("field: ", field);
    return sortCriteria.find(c => c.attribute === field)?.direction;

  }

  const handleSearchChange = (value: string) => {
    // Update the filters state immediately for UI feedback
    setFilters(prev => ({ ...prev, search: value }));

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 300); // 300ms delay - adjust as needed
  };


  const handleRowSelect = (event: CustomEvent) => {
    const newSelection = event.detail.value;
    setSelectedRows(newSelection);

    const selectedKey = [...(newSelection.row?.values?.() || [])][0];
    const log = adminLogs.find((log) => log._id === selectedKey);

    if (log) {
      setSelectedLog(log);
      setShowLogDialog(true);
      console.log('Clicked row:', log);
    }
  };

  return (
    <div
      class="oj-flex oj-sm-justify-content-center oj-sm-flex-direction-column"
      style="height: 100%; min-height: 0; flex: 1 1 0;"
    >
      <div class="oj-flex oj-sm-12 oj-sm-padding-4x-start oj-sm-justify-content-space-between oj-sm-align-items-center">
        <h1 class="oj-typography-heading-md">Logs</h1>
      </div>
      {/* <div>
      </div> */}

      <div class="oj-flex oj-flex-1 oj-sm-align-items-center oj-sm-justify-content-start oj-sm-padding-3x-bottom" >
        {/* style={{backgroundColor: '#8ace00'}} */}


        <SearchBar value={filters.search} onChange={handleSearchChange} placeholder="Search Logs" />

      </div>


      <LogFilters onFilterChange={handleFilterChange} />


      <div
        class="oj-flex oj-sm-margin-4x oj-sm-justify-content-center oj-sm-align-items-center"
        style={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          borderRadius: '16px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {isLoading ? (
          <oj-c-progress-circle value={-1} size="lg" />
        ) : (
          <oj-table
            data={dataProvider}
            onojSort={handleSort}
            columns={[
              { id: 'rowNumber', headerText: 'Row', field: 'rowNumber', resizable: "enabled", sortable: 'disabled' },
              { id: 'app_name', headerText: 'App Name', field: 'app_name', resizable: "enabled", sortable: 'enabled' },
              { id: 'log_type', headerText: 'Log Type', field: 'log_type', resizable: "enabled", sortable: 'enabled' },
              { id: 'message', headerText: 'Message', field: 'message', resizable: "enabled", sortable: 'enabled' },
              { id: 'timestamp', headerText: 'Timestamp', field: 'timestamp', resizable: "enabled", sortable: 'enabled' }
            ]}
            display='grid'
            class="oj-sm-12"
            layout='fixed'
            horizontal-grid-visible="enabled"
            vertical-grid-visible="disabled"
            selectionMode={{ row: 'single' }}
            selected={selectedRows}
            onselectedChanged={handleRowSelect}
          >
            <template
              slot="headerTemplate"
              render={(col: any) => {
                const dir = getDir(col.columnKey);
                const icon = dir === 'ascending'
                  ? 'oj-ux-ico-caret-up'
                  : dir === 'descending'
                    ? 'oj-ux-ico-caret-down'
                    : 'oj-ux-ico-sort';

                return (
                  <div
                    class="oj-table-header-cell-label oj-hover-cursor-pointer"
                    onClick={() => {
                      const nextDir = dir === 'ascending' ? 'descending' : 'ascending';
                      handleSort({
                        detail: { header: col.columnKey, direction: nextDir }
                      } as CustomEvent);
                    }}
                  >
                    <span>{col.headerText}</span>
                    {col.headerText !== 'Row' && icon && (
                      <span class={`${icon} oj-sm-display-inline-block oj-sm-margin-start-2`} />
                    )}
                  </div>
                );
              }}
            />
          </oj-table>
        )}
      </div>


      {/* Pagination */}
      {pagination && (
        <div
          class="oj-flex oj-sm-align-items-center oj-sm-justify-content-flex-end oj-sm-margin-4x-end"
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

      {showLogDialog && selectedRows && (
        <LogDetailsModal
          key={selectedLog._id}
          logRow={selectedLog}
          opened={showLogDialog}
          onCancel={() => {
            setShowLogDialog(false);
            setSelectedLog(null);
          }}
        />
      )}

    </div>
  );
};

export default Logs;