import { h } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { fetchAppsHealth, AppsHealthResponse } from '../../../services/appsHealth.service'
import { AppsHealthCard } from './AppsHealthCard'
import { SilentAppsCard } from './SilentAppsCard'
import 'ojs/ojprogress-circle'


export default function AppsHealth({ userId }: { userId: string }) {
    const [data, setData] = useState<AppsHealthResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!userId || userId.trim() === '' || userId.length !== 24) return;

        async function loadData() {
            try {
                const response = await fetchAppsHealth(userId)
                setData(response)
            } catch (e) {
                setError((e as Error).message)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [userId])

    if (loading) {
        return (
            <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-center" style="height: 260px; width: 100%;">
                <oj-c-progress-circle value={-1} size="md"></oj-c-progress-circle>
            </div>
        );
    }

    if (error) {
        return <div class="oj-text-color-danger oj-typography-body-md">Error: {error}</div>
    }

    return (
        <>
            <div class="oj-sm-margin-4x oj-flex-item oj-flex oj-sm-flex-items-1 oj-sm-justify-content-space-around ">
                <AppsHealthCard
                    title="Errors"
                    description="Database Timeouts, Failed Payments"
                    total={data!.critical_summary.total_errors}
                    apps={data!.critical_summary.appsExceedingErrorThreshold}
                    color="error"
                />
                <AppsHealthCard
                    title="Warnings"
                    description="Rate Limits, High Memory usage"
                    total={data!.critical_summary.total_warnings}
                    apps={data!.critical_summary.appsExceedingWarningThreshold}
                    color="warning"
                />
                <SilentAppsCard apps={data!.silent_summary.silent_apps} />
            </div>
        </>
    )
}