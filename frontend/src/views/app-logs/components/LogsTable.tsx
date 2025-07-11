// File: src/pages/components/LogsTable.tsx
import { h } from 'preact'
import 'ojs/ojtable'
import 'oj-c/table'
import 'oj-c/progress-circle'
import ArrayDataProvider = require('ojs/ojarraydataprovider')

interface LogsTableProps {
    isLoading: boolean
    dataProvider: any
    sortCriteria: any[]
    getDir: (field: string) => string | undefined
    handleSort: (event: CustomEvent) => void
    selectedRows: any
    handleRowSelect: (event: CustomEvent) => void
}

const LogsTable = ({
    isLoading,
    dataProvider,
    sortCriteria,
    getDir,
    handleSort,
    selectedRows,
    handleRowSelect
}: LogsTableProps) => {
    return (
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
                <oj-c-progress-circle value={-1} size="md" />
            ) : (
                <oj-table
                    data={dataProvider}
                    onojSort={handleSort}
                    columns={[
                        {
                            id: 'rowNumber',
                            headerText: 'Row',
                            field: 'rowNumber',
                            resizable: 'enabled',
                            sortable: 'disabled',
                        },
                        {
                            id: 'app_name',
                            headerText: 'App Name',
                            field: 'app_name',
                            resizable: 'enabled',
                            sortable: 'enabled',
                        },
                        {
                            id: 'log_type',
                            headerText: 'Log Type',
                            field: 'log_type',
                            resizable: 'enabled',
                            sortable: 'enabled',
                        },
                        {
                            id: 'message',
                            headerText: 'Message',
                            field: 'message',
                            resizable: 'enabled',
                            sortable: 'enabled',
                        },
                        {
                            id: 'timestamp',
                            headerText: 'Timestamp',
                            field: 'timestamp',
                            resizable: 'enabled',
                            sortable: 'enabled',
                        },
                    ]}
                    display="grid"
                    class="oj-sm-12"
                    layout="fixed"
                    horizontal-grid-visible="enabled"
                    vertical-grid-visible="disabled"
                    selectionMode={{ row: 'single' }}
                    selected={selectedRows}
                    onselectedChanged={handleRowSelect}
                >
                    <template
                        slot="headerTemplate"
                        render={(col: any) => {
                            const dir = getDir(col.columnKey)
                            const icon =
                                dir === 'ascending'
                                    ? 'oj-ux-ico-caret-up'
                                    : dir === 'descending'
                                        ? 'oj-ux-ico-caret-down'
                                        : 'oj-ux-ico-sort'

                            return (
                                <div
                                    class="oj-table-header-cell-label oj-hover-cursor-pointer"
                                    onClick={() => {
                                        const nextDir = dir === 'ascending' ? 'descending' : 'ascending'
                                        handleSort({
                                            detail: { header: col.columnKey, direction: nextDir },
                                        } as CustomEvent)
                                    }}
                                >
                                    <span>{col.headerText}</span>
                                    {col.headerText !== 'Row' && icon && (
                                        <span class={`${icon} oj-sm-display-inline-block oj-sm-margin-start-2`} />
                                    )}
                                </div>
                            )
                        }}
                    />
                </oj-table>
            )}
        </div>
    )
}

export default LogsTable
