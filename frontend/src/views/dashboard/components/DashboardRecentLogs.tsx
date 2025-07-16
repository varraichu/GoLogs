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
          app_name: log.app_name.replace(/\./g, ' '),
          timestamp: new Date(log.timestamp).toLocaleString(),
        }))
        setLogs(formatted)
        setDataProvider(new ArrayDataProvider(formatted, { keyAttributes: '_id' }))
      })
  }, [])

  return (

    <div style={{ width: '100%' }}>
      <div class="oj-flex oj-flex-direction-col oj-sm-align-items-center oj-sm-justify-content-space-between oj-sm-margin-1x-bottom">
        <div class="oj-flex oj-flex-direction-col oj-sm-align-items-center" style={{ gap: '0.5rem' }}>
          <span
            class="oj-ux-ico-recent"
            style={{
              color: "#000000",
              fontSize: "1.5rem",
              fontFamily: "ojuxIconFont !important"
            }}
          ></span>
          <h3 style={{ margin: 0, fontWeight: "bold", fontSize: "1.3rem" }}>
            Recent Logs
          </h3>
        </div>
        <oj-button class="oj-flex-item oj-sm-2" label="View All Logs" chroming='callToAction' onojAction={() => { 
          route(`/logs`)
          props.setActiveItem("logs")
           }}><span slot="startIcon" class="oj-ux-ico-external-link"></span></oj-button>
      </div>
      <div>
        <p class=" oj-text-color-secondary">Latest 5 logs across all applications</p>
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

  );
}

export default DashboardRecentLogs