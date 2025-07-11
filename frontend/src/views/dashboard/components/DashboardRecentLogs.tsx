// Example: DashboardRecentLogs.tsx

import { h } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import ArrayDataProvider = require('ojs/ojarraydataprovider')
import { logsService, LogEntry } from "../../../services/logs.services"
import { route } from 'preact-router'

const DashboardRecentLogs = (props:{setActiveItem:(str:string)=>void}) => {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [dataProvider, setDataProvider] = useState<any>(null)

  useEffect(() => {
    // Fetch only 5 most recent logs
    logsService.fetchLogs(1, 5, [{ attribute: 'timestamp', direction: 'descending' }])
      .then((data) => {
        const formatted = (data.logs || []).map((log: LogEntry, idx: number) => ({
          rowNumber: idx + 1,
          ...log,
          timestamp: new Date(log.timestamp).toLocaleString(),
        }))
        setLogs(formatted)
        setDataProvider(new ArrayDataProvider(formatted, { keyAttributes: '_id' }))
      })
  }, [])

  return (
    <div class="oj-panel oj-sm-12 oj-panel-padding oj-sm-padding-4x oj-flex-item">
      <div class="oj-flex oj-panel-border-0 oj-sm-padding-4x oj-sm-12 oj-sm-justify-content-space-between oj-sm-align-items-center ">
          <div class="oj-flex-item ">
              <h5 class="">Recent Logs</h5>
              <span class="">Latest 5 logs across all applications</span>
          </div>
          
          <oj-button class="oj-flex-item oj-sm-flex-initial" label="View All Logs" onojAction={() => { 
            route(`/logs`)
            props.setActiveItem("logs")
             }}><span slot="startIcon" class="oj-ux-ico-external-link"></span></oj-button>
      </div>
      <oj-table
        data={dataProvider}
        columns={[
          { id: 'rowNumber', headerText: '#', field: 'rowNumber', resizable: 'enabled', sortable: 'disabled' },
          { id: 'app_name', headerText: 'App', field: 'app_name', resizable: 'enabled', sortable: 'disabled' },
          { id: 'log_type', headerText: 'Type', field: 'log_type', resizable: 'enabled', sortable: 'disabled' },
          { id: 'message', headerText: 'Message', field: 'message', resizable: 'enabled', sortable: 'disabled' },
          { id: 'timestamp', headerText: 'Time', field: 'timestamp', resizable: 'enabled', sortable: 'disabled' },
        ]}
        display="grid"
        layout="fixed"
        horizontal-grid-visible="enabled"
        vertical-grid-visible="disabled"
        selectionMode={{ row: 'none' }}
        class="oj-sm-12 oj-panel"
      />
    </div>
  )
}

export default DashboardRecentLogs