import { h } from 'preact';
import "oj-c/action-card";
import { route } from 'preact-router'

// --- Data Interfaces ---
export interface CriticalAppSummary {
    app_id: string;
    app_name: string;
    errors: number;
    warnings: number;
    exceedsError: boolean;
    exceedsWarning: boolean;
}

export interface SilentAppSummary {
    app_id: string;
    app_name: string;
    last_seen: string;
    minutes_ago: number | 'Never';
}


// --- Props Interface for the Health Card ---
interface CardProps {
    title: string;
    total: number;
    description: string;
    apps: CriticalAppSummary[];
    color: 'error' | 'warning';
    setActiveItem: (str: string) => void;
}

/**
 * A refactored and restyled component for displaying application health status (Errors & Warnings).
 * This component uses Oracle JET's flexbox utilities for a clean, modern layout.
 * It now highlights apps that exceed their defined error or warning thresholds.
 * @param {CardProps} props - The properties for the component.
 */
export function AppsHealthCard({ title, description, total, apps, color, setActiveItem }: CardProps) {
    // --- Determine dynamic classes based on the 'color' prop ---
    const iconClass = color === 'error' ? 'oj-ux-ico-error' : 'oj-ux-ico-warning';
    const textClass = color === 'error' ? 'oj-text-color-danger' : 'oj-text-color-warning';
    const badgeColorClass = color === 'error' ? 'oj-badge-danger' : 'oj-badge-warning';

    return (
        <oj-c-action-card
            class={`oj-sm-margin-2x-bottom oj-flex-item ${color === 'error' ? 'oj-bg-danger-20' : 'oj-bg-warning-20'} oj-panel-shadow-sm`}
            style={{ height: '260px', minWidth: '320px', maxWidth: '470px' }}
            onojAction={() => {
                route(`/logs?log-type=${title === 'Errors' ? 'error' : 'warn'}`)
                setActiveItem("logs")
            }}
        >
            <div class="oj-sm-padding-3x oj-flex oj-sm-flex-direction-column oj-flex-item oj-flex-grow-1">
                {/* Header Section */}
                <div class="oj-sm-margin-4x-bottom oj-flex oj-sm-justify-content-space-between oj-sm-align-items-center oj-flex-grow-1"
                    style={{ width: '100%' }}>
                    {/* Title and Description */}
                    <div class="oj-flex-item">
                        <h3 class={`${textClass} oj-typography-heading-sm oj-sm-margin-0`}>{title}</h3>
                        <div class={`oj-typography-body-xs ${textClass}`}>{description}</div>
                    </div>
                    <span class={`${iconClass} ${textClass} oj-sm-margin-2x-end`} style={{ fontSize: '24px' }} role="img" aria-label={title}></span>
                </div>
                <div class={`${textClass} oj-typography-heading-lg`}>{total}</div>
                <div class={`${textClass} oj-typography-body-xs`}>in the last hour</div>
                {/* Details Section: List of applications - this section will grow to fill space */}
                <div class="oj-sm-margin-4x-top oj-flex-grow-1">
                    {apps.length > 0 ? (
                        <div>
                            {apps.slice(0, 2).map(app => (
                                <div class="oj-flex oj-sm-justify-content-between oj-sm-align-items-center oj-typography-body-sm oj-sm-padding-1x-vertical" key={app.app_id}>
                                    <div class="oj-flex-item oj-flex oj-sm-align-items-center">
                                        <span class={`${textClass}`}>{app.app_name.replace(/\./g, ' ')}</span>
                                    </div>
                                    <span class={`oj-badge ${badgeColorClass}`}>
                                        {color === 'error' ? app.errors : app.warnings}
                                    </span>
                                </div>
                            ))}
                            {apps.length > 2 && (
                                <div class={`oj-typography-body-xs ${textClass} oj-sm-padding-2x-vertical`}>
                                    +{apps.length - 2} more apps
                                </div>
                            )}
                        </div>
                    ) : (
                        <div class={`oj-flex oj-sm-align-items-center oj-sm-justify-content-center oj-flex-grow-1 ${textClass} oj-typography-body-sm`} style={{ height: '100%' }}>No critical apps.</div>
                    )}
                </div>
            </div>
        </oj-c-action-card>
    );
}