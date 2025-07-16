// File: src/pages/Logs.tsx
import { h } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import 'ojs/ojtable'
import 'ojs/ojbutton'
import ArrayDataProvider = require('ojs/ojarraydataprovider')
import { KeySetImpl } from 'ojs/ojkeyset'

import { useToast } from '../../context/ToastContext'
import Toast from '../../components/Toast'

import 'oj-c/table'
import { logsService, LogEntry, Pagination, SortCriteria } from '../../services/logs.services'
import LogFilters from './components/LogFilters'
import SearchBar from '../../components/SearchBar'
import LogDetailsModal from './components/LogDetailsModal'
import LogExports from './components/LogExports'
import LogExportsDialog from './components/LogExportsDialog'
import LogsTable from './components/LogsTable'
import 'oj-c/progress-circle'
import 'oj-c/dialog'
import { downloadCSV } from '../../services/downloadCSV'
import { log } from 'console'
import "ojs/ojdrawerlayout";

const Logs = (props: { path?: string }) => {
  const params = new URLSearchParams(window.location.search);
  const log_type: string | null = params.get('log-type');

  const [adminLogs, setAdminLogs] = useState<LogEntry[]>([])
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [dataProvider, setDataProvider] = useState<any>(null)
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [exportDialog, setExportDialog] = useState(false)
  const [logs, setLogs] = useState<any[]>([])
  const [exportFormat, setExportFormat] = useState<'csv' | 'txt'>('csv')
  const [isExporting, setIsExporting] = useState(false)
  const [opened, setOpened] = useState<boolean>(false);

  const toggleDrawer = () => {
    setOpened(!opened);
  };

  // Set default sort criteria for backend
  const [sortCriteria, setSortCriteria] = useState<SortCriteria[]>([
    { attribute: 'timestamp', direction: 'descending' },
  ])

  // const [frontendSortCriteria, setFrontendSortCriteria] = useState<{ key: string, direction: 'ascending' | 'descending' } | null>(null);
  const [filters, setFilters] = useState<{
    apps: string[]
    logTypes: string[]
    fromDate: string | undefined
    toDate: string | undefined
    search: string
  }>({
    apps: [],
    logTypes: log_type ? [log_type] : [],
    fromDate: undefined,
    toDate: undefined,
    search: '',
  })

  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  })

  const { addNewToast } = useToast()
  const [selectedRows, setSelectedRows] = useState<{ row: KeySetImpl<any> }>({
    row: new KeySetImpl<any>(),
  })

  const [showLogDialog, setShowLogDialog] = useState(false)
  const [selectedLog, setSelectedLog] = useState<any>(null)


  // Fetch logs when page or sort criteria changes
  useEffect(() => {
    fetchLogs(pagination.page)
  }, [pagination.page, sortCriteria, filters])

  const exportFunc = async () => {
    try {
      setIsExporting(true)
      setExportDialog(false) // close the dialog first (or keep if async behavior preferred)

      const url = await logsService.getExportUrl(pagination.total, filters, sortCriteria)

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()

      // Trigger file download
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `Logs.${exportFormat || 'csv'}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Optional: show success toast
      console.log('Download triggered successfully.')
      addNewToast("confirmation", "Exported Successfully", "Logs Exported Successfully as " + `Logs.${exportFormat || 'csv'}`)
    } catch (err) {
      console.error('Export failed:', err)
      // useToast("error",)
      addNewToast("error", "Failed to Export Logs", err as string || "Internal Server error")
      // Optional: show error toast or dialog
    } finally {
      setIsExporting(false) // Hide progress bar
    }
  }

  const fetchLogs = async (page: number) => {
    setIsLoading(true)
    try {
      // Pass sort criteria to backend
      console.log('sort criteria: ', sortCriteria)
      console.log('filtera: ', filters)
      const data = await logsService.fetchLogs(page, pagination.limit, sortCriteria, filters)

      const formattedLogs = (data.logs || []).map((log: LogEntry, idx) => ({
        rowNumber: (pagination.page - 1) * pagination.limit + idx + 1,
        ...log,
        app_name: log.app_name.replace(/\./g, ' '),
        timestamp: new Date(log.timestamp).toLocaleString(),
        ingested_at: new Date(log.ingested_at).toLocaleString(),
      }))

      setAdminLogs(formattedLogs || [])
      setPagination(
        data.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        }
      )

      // Create a simple data provider without frontend sorting
      // since sorting is handled by the backend
      const baseProvider = new ArrayDataProvider(formattedLogs || [], { keyAttributes: '_id' })
      setDataProvider(baseProvider)
    } catch (error: any) {
      addNewToast('error', 'Error', error.message || 'Failed to fetch logs.')
      console.error('Failed to fetch logs', error)
    } finally {
      setIsLoading(false)
    }
  }

  const goToNextPage = () => {
    if (pagination.hasNextPage && !isLoading) {
      setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
    }
  }

  const goToPrevPage = () => {
    if (pagination.hasPrevPage && !isLoading) {
      setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
    }
  }

  const handleSort = (event: CustomEvent) => {
    const { header, direction } = event.detail

    if (!header || !direction) return

    // Update frontend indicator
    // setFrontendSortCriteria({ key: header, direction });

    // Backend sort
    const newSort = { attribute: header, direction }
    setSortCriteria((prev) => {
      const others = prev.filter((c) => c.attribute !== header)
      return [newSort, ...others]
    })

    // Reset page with debounce
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    debounceTimeout.current = setTimeout(() => {
      setPagination((prev) => ({ ...prev, page: 1 }))
    }, 150)
  }

  const handleFilterChange = (newFilters: Omit<typeof filters, 'search'>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }))
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const getDir = (field: string) => {
    // console.log("field: ", field);
    return sortCriteria.find((c) => c.attribute === field)?.direction
  }

  const handleSearchChange = (value: string) => {
    // Update the filters state immediately for UI feedback
    setFilters((prev) => ({ ...prev, search: value }))

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    debounceTimeout.current = setTimeout(() => {
      setPagination((prev) => ({ ...prev, page: 1 }))

    }, 300) // 300ms delay - adjust as needed
  }


  const handleRowSelect = (event: CustomEvent) => {
    const newSelection = event.detail.value
    setSelectedRows(newSelection)

    const selectedKey = [...(newSelection.row?.values?.() || [])][0]
    const log = adminLogs.find((log) => log._id === selectedKey)

    if (log) {
      setSelectedLog(log)
      setShowLogDialog(true)
      console.log('Clicked row:', log)
    }
  }

  return (

    <div
      class="oj-flex oj-sm-justify-content-center oj-sm-flex-direction-column oj-sm-padding-6x"
      style="height: 100%; min-height: 0; flex: 1 1 0;"
    >

      <div class="oj-flex oj-sm-12 oj-sm-justify-content-space-between oj-sm-align-items-center">
        <h1 class="oj-typography-heading-md">Logs</h1>
      </div>
      <div class="oj-flex oj-sm-margin-4x-bottom oj-sm-align-items-center" style="width: 100%; gap: 12px;">
        <SearchBar value={filters.search} onChange={handleSearchChange} placeholder="Search logs" />
        <LogExports
          setExportDialog={() => {
            setExportDialog(!exportDialog)
          }}
          isLoading={isExporting}
        />
        <oj-button
          onojAction={toggleDrawer}
          label={opened ? "Close Filters" : "Apply Filters"}
          chroming={opened ? "outlined" : "callToAction"}
        >
          {
            opened ? (<span slot="startIcon" class="oj-ux-ico-filter-alt-off"></span>) : (<span slot="startIcon" class="oj-ux-ico-filter-alt"></span>)

          }
        </oj-button>
      </div>

      <oj-drawer-layout endOpened={opened} class="oj-sm-flex-1" style="width: 100%; overflow-x: hidden;">
        <div class="oj-flex oj-sm-flex-1 oj-sm-overflow-hidden" style="min-width: 0;">
          <div class="oj-flex-item oj-panel oj-panel-shadow-xs oj-sm-padding-4x" style="width: 100%;">

            <LogsTable
              isLoading={isLoading}
              dataProvider={dataProvider}
              sortCriteria={sortCriteria}
              getDir={getDir}
              handleSort={handleSort}
              selectedRows={selectedRows}
              handleRowSelect={handleRowSelect}
            />



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
          </div>
        </div>

        <div slot="end" class="" style="width: 280px; max-width: 100%; box-sizing: border-box;">
          <div class="oj-flex oj-flex-direction-col oj-sm-align-items-center oj-sm-padding-4x-start">
            <h6>Filter Logs</h6>
          </div>

          <div class="oj-flex">
            <LogFilters filters={filters} onFilterChange={handleFilterChange} />

          </div>
        </div>
      </oj-drawer-layout>

      <LogExportsDialog
        opened={exportDialog}
        close={() => {
          setExportDialog(!exportDialog)
        }}
        export={exportFunc}
        exportFormat={exportFormat}
        setExportFormat={setExportFormat}
      ></LogExportsDialog>


      {showLogDialog && selectedRows && (
        <LogDetailsModal
          key={selectedLog._id}
          logRow={selectedLog}
          opened={showLogDialog}
          onCancel={() => {
            setShowLogDialog(false)
            setSelectedLog(null)
          }}
        />
      )}
      <Toast />
    </div>
  )
}

export default Logs
