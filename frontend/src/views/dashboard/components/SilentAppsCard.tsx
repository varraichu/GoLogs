import { h } from 'preact'
import { useState } from 'preact/hooks';
import "oj-c/action-card";
import "oj-c/dialog";
import "oj-c/button";
import { SilentAppSummary } from '../../../services/appsHealth.service'


export function SilentAppsCard({ apps, setIsDialogOpen }: { apps: SilentAppSummary[], setIsDialogOpen: (val: boolean) => void }) {
    const total = apps.length;



    return (
        <>
            <oj-c-action-card
                class="oj-sm-margin-2x-bottom oj-flex-item oj-bg-brand-10 oj-panel-shadow-sm"
                style={{ height: '260px', minWidth: '320px', maxWidth: '470px' }}
                onojAction={() => setIsDialogOpen(true)}
            >
                <div class="oj-sm-padding-3x oj-flex oj-sm-flex-direction-column oj-flex-item oj-flex-grow-1">
                    {/* Header Section */}
                    <div class="oj-sm-margin-4x-bottom oj-flex oj-sm-justify-content-between oj-sm-align-items-center"
                        style={{ width: '100%' }}
                    >
                        {/* Title and Description */}
                        <div class="oj-flex-item ">
                            <h3 class="oj-text-color-secondary oj-typography-heading-sm oj-sm-margin-0">
                                Silent Apps
                            </h3>
                            <div class="oj-typography-body-xs oj-text-color-secondary">Apps that have stopped producing logs</div>

                        </div>
                        {/* Icon and Total Count */}
                        <span class="oj-ux-ico-notification-off oj-text-color-secondary oj-sm-margin-2x-end" style={{ fontSize: '24px' }} role="img" aria-label="Silent Apps"></span>
                    </div>

                    <div class="oj-text-color-secondary oj-typography-heading-lg ">{total}</div>
                    <div class="oj-text-color-secondary oj-typography-body-xs">apps not sending logs</div>

                    {/* Details Section: List of applications - this section will grow to fill space */}
                    <div class="oj-sm-margin-4x-top oj-flex-grow-1">
                        {apps.length > 0 ? (
                            <div>
                                {apps.slice(0, 2).map(app => (
                                    <div
                                        class="oj-flex oj-sm-justify-content-between oj-sm-align-items-center oj-typography-body-sm oj-sm-padding-1x-vertical"
                                        key={app.app_id}
                                        style="width: 100%;"
                                    >
                                        <div class="oj-flex-item">
                                            <span class="oj-text-color-primary">{app.app_name.replace(/\./g, ' ')}</span>
                                        </div>
                                        <div class="oj-text-color-secondary oj-typography-body-xs" style="text-align: right;">
                                            {app.minutes_ago === 'Never' ? 'Never' : app.minutes_ago < 60 ? `${app.minutes_ago} min ago` : app.minutes_ago < 1440 ? `${Math.floor(app.minutes_ago / 60)} hours ago` : `${Math.floor(app.minutes_ago / 1440)} days ago`}
                                        </div>
                                    </div>

                                ))}
                                {apps.length > 2 && (
                                    <div class="oj-typography-body-xs oj-text-color-secondary oj-sm-padding-2x-vertical">
                                        +{apps.length - 2} more apps
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-center oj-flex-grow-1 oj-text-color-secondary oj-typography-body-sm" style={{ height: '100%' }}>No silent apps.</div>
                        )}
                    </div>
                </div>
            </oj-c-action-card>

        </>
    );
}
