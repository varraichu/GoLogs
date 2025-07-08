import { h } from 'preact';
import "oj-c/dialog";
import "oj-c/button";

interface Log {
    _id: string;
    app_id: string;
    app_name: string;
    log_type: string;
    message: string;
    timestamp: string;
    ingested_at: string;
}

interface LogDialogProps {
    logRow: Log;
    onCancel: () => void;
    opened: boolean;
}

const LogDetailsModal = ({ logRow, onCancel, opened }: LogDialogProps) => {
    const getLogTypeColor = (logType: string) => {
        switch (logType?.toLowerCase()) {
            case 'error': return '#d32f2f';
            case 'warning': return '#f57c00';
            case 'info': return '#1976d2';
            case 'debug': return '#7b1fa2';
            default: return '#616161';
        }
    };

    const getLogTypeIcon = (logType: string) => {
        switch (logType?.toLowerCase()) {
            case 'error': return 'oj-ux-ico-error';
            case 'warning': return 'oj-ux-ico-warning';
            case 'info': return 'oj-ux-ico-info';
            case 'debug': return 'oj-ux-ico-bug';
            default: return 'oj-ux-ico-document';
        }
    };

    return (
        <div>
            <oj-c-dialog
                opened={opened}
                headerDecoration='off'
                cancelBehavior='icon'
                // onojCancel={onCancel}
                style="--oj-dialog-width: 600px; --oj-dialog-max-height: 80vh;"
            >
                <div slot="header">
                    <div class="oj-flex oj-sm-align-items-center" style="gap: 12px;">
                        <span 
                            class={`${getLogTypeIcon(logRow.log_type)} oj-sm-display-inline-block`}
                            style={`color: ${getLogTypeColor(logRow.log_type)}; font-size: 1.2em;`}
                        ></span>
                        <h2 id="dialogTitleId" class="oj-typography-heading-sm" style="margin: 0;">
                            {logRow.app_name}
                        </h2>
                        <span 
                            class="oj-badge oj-badge-subtle"
                            style={`background-color: ${getLogTypeColor(logRow.log_type)}15; color: ${getLogTypeColor(logRow.log_type)}; border: 1px solid ${getLogTypeColor(logRow.log_type)}30;`}
                        >
                            {logRow.log_type}
                        </span>
                    </div>
                </div>
                
                <div slot="body">
                    <div class="oj-flex oj-sm-flex-direction-column" style="gap: 20px;">
                        
                        {/* Log Message Section */}
                        <div class="oj-panel oj-panel-alt1" style="padding: 16px; border-radius: 8px;">
                            <h3 class="oj-typography-heading-xs" style="margin: 0 0 12px 0; color: #424242;">
                                <span class="oj-ux-ico-message oj-sm-margin-2x-end"></span>
                                Message
                            </h3>
                            <div 
                                class="oj-typography-body-md"
                                style="
                                    background-color: #fafafa; 
                                    padding: 12px; 
                                    border-radius: 6px; 
                                    border-left: 4px solid #e0e0e0;
                                    font-family: 'Courier New', monospace;
                                    white-space: pre-wrap;
                                    word-break: break-word;
                                    max-height: 200px;
                                    overflow-y: auto;
                                "
                            >
                                {logRow.message}
                            </div>
                        </div>

                        {/* <div class="oj-flex oj-sm-flex-wrap" style="gap: 16px;"> */}
                            
                            {/* Application ID */}
                            {/* <div class="oj-flex oj-sm-flex-direction-column oj-sm-flex-1" style="min-width: 200px;">
                                <label class="oj-typography-body-sm oj-text-color-secondary" style="margin-bottom: 4px;">
                                    <span class="oj-ux-ico-application oj-sm-margin-1x-end"></span>
                                    Application ID
                                </label>
                                <div class="oj-typography-body-md oj-text-color-primary" style="font-weight: 500;">
                                    {logRow.app_id}
                                </div>
                            </div> */}

                            {/* Log ID */}
                            {/* <div class="oj-flex oj-sm-flex-direction-column oj-sm-flex-1" style="min-width: 200px;">
                                <label class="oj-typography-body-sm oj-text-color-secondary" style="margin-bottom: 4px;">
                                    <span class="oj-ux-ico-key oj-sm-margin-1x-end"></span>
                                    Log ID
                                </label>
                                <div class="oj-typography-body-md oj-text-color-primary" style="font-weight: 500; font-family: 'Courier New', monospace;">
                                    {logRow._id}
                                </div>
                            </div> */}

                        {/* </div> */}

                        {/* Timestamp Information */}
                        <div class="oj-flex oj-sm-flex-wrap" style="gap: 16px;">
                            
                            {/* Timestamp */}
                            <div class="oj-flex oj-sm-flex-direction-column oj-sm-flex-1" style="min-width: 200px;">
                                <label class="oj-typography-body-sm oj-text-color-secondary" style="margin-bottom: 4px;">
                                    <span class="oj-ux-ico-clock oj-sm-margin-1x-end"></span>
                                    Timestamp
                                </label>
                                <div class="oj-typography-body-md oj-text-color-primary" style="font-weight: 500;">
                                    {logRow.timestamp}
                                </div>
                            </div>

                            {/* Ingested At */}
                            <div class="oj-flex oj-sm-flex-direction-column oj-sm-flex-1" style="min-width: 200px;">
                                <label class="oj-typography-body-sm oj-text-color-secondary" style="margin-bottom: 4px;">
                                    <span class="oj-ux-ico-import oj-sm-margin-1x-end"></span>
                                    Ingested At
                                </label>
                                <div class="oj-typography-body-md oj-text-color-primary" style="font-weight: 500;">
                                    {logRow.ingested_at}
                                </div>
                            </div>

                        </div>

                    </div>
                </div>
            </oj-c-dialog>
        </div>
    );
}

export default LogDetailsModal;