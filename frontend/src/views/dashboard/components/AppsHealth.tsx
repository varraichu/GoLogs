import { h } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { fetchAppsHealth, AppsHealthResponse } from '../../../services/appsHealth.service'
import { AppsHealthCard } from './AppsHealthCard'
import { SilentAppsCard } from './SilentAppsCard'
import 'ojs/ojprogress-circle'


export default function AppsHealth({ userId, setActiveItem }: { userId: string, setActiveItem: (str: string) => void }) {
    const [data, setData] = useState<AppsHealthResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false);

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
            <div class=" oj-flex-item oj-flex oj-sm-flex-items-1 oj-sm-justify-content-space-between ">
                <AppsHealthCard
                    title="Errors"
                    description="Apps exceeding the error log threshold"
                    total={data!.critical_summary.total_errors}
                    apps={data!.critical_summary.appsExceedingErrorThreshold}
                    color="error"
                    setActiveItem={setActiveItem}
                />
                <AppsHealthCard
                    title="Warnings"
                    description="Apps exceeding the warning log threshold"
                    total={data!.critical_summary.total_warnings}
                    apps={data!.critical_summary.appsExceedingWarningThreshold}
                    color="warning"
                    setActiveItem={setActiveItem}
                />
                <SilentAppsCard apps={data!.silent_summary.silent_apps} setIsDialogOpen={setIsDialogOpen} />
            </div>

            {isDialogOpen && (
                <oj-dialog dialogTitle="Silent Apps" initialVisibility="show" onojClose={() => setIsDialogOpen(false)}>
                    <div class="oj-dialog-body">
                        {/* This maps over the FULL apps array */}
                        {data!.silent_summary.silent_apps.map(app => (
                            <div
                                class="oj-flex oj-sm-justify-content-between oj-sm-align-items-center oj-typography-body-md oj-sm-padding-1x-vertical"
                                key={app.app_id}
                                style="width: 100%;"
                            >
                                <div class="oj-flex-item">
                                    <span class="oj-text-color-primary">{app.app_name.replace(/\./g, ' ')}</span>
                                </div>
                                <div class="oj-text-color-secondary oj-typography-body-sm" style="text-align: right;">
                                    {app.minutes_ago === 'Never' ? 'Never' : app.minutes_ago < 60 ? `${app.minutes_ago} min ago` : app.minutes_ago < 1440 ? `${Math.floor(app.minutes_ago / 60)} hours ago` : `${Math.floor(app.minutes_ago / 1440)} days ago`}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div class="oj-dialog-footer">
                        <oj-button onojAction={() => setIsDialogOpen(false)}>Close</oj-button>
                    </div>
                </oj-dialog>
            )}
        </>
    )
}