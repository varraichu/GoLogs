import { h } from 'preact';
import { Application } from '../../../services/dashboard.services';

const getHealthStatusColor = (status: string) => {
    switch (status) {
        case 'critical':
            return { background: '#fde8e8', text: '#991b1b', border: '#fecaca' };
        case 'warning':
            return { background: '#fffbeb', text: '#b45309', border: '#fde68a' };
        case 'healthy':
        default:
            return { background: '#eafaf1', text: '#065f46', border: '#a7f3d0' };
    }
};

interface PinnedAppCardProps {
  app: Application;
}

export const PinnedAppCard = ({ app }: PinnedAppCardProps) => {
    const healthColor = getHealthStatusColor(app.health_status);

    return (
        <div
            key={app._id}
            class="oj-panel oj-panel-shadow-md"
            style={{
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "16px 20px",
            flex: "1 1 100%",
            minWidth: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            fontSize: "0.95rem",
            boxSizing: "border-box",
            }}
        >
            {/* Header: Name + Status */}
            <div class="oj-flex" style={{ alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <div class="oj-flex oj-sm-align-items-center" style="gap: 0.5rem;">
                    <h3 style={{ margin: "0", wordBreak: "break-word", fontSize: "0.95rem", fontWeight: "600", lineHeight: "1.2", color: "#111827" }}>
                        {app.name.replace(/\./g, ' ')}
                    </h3>
                    <span class="oj-typography-body-xs" style={{ padding: '2px 8px', borderRadius: '12px', fontWeight: 500, backgroundColor: healthColor.background, color: healthColor.text, border: `1px solid ${healthColor.border}`, textTransform: 'capitalize' }}>
                        {app.health_status}
                    </span>
                </div>
                <span class="oj-typography-body-xs" style={{ padding: "2px 8px", fontWeight: "500", color: app.is_active ? "#065f46" : "#991b1b", fontSize: "0.75rem", backgroundColor: app.is_active ? "#e6ffed" : "#ffebeb", borderRadius: "4px", lineHeight: "1.2" }}>
                    {app.is_active ? "Active" : "Inactive"}
                </span>
            </div>

            {/* App Description */}
            <p style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "12px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: "2", WebkitBoxOrient: "vertical" }}>
                {app.description || "No description available"}
            </p>

            {/* Log metrics */}
            <div style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                        <span style={{ color: "black", marginRight: "4px" }}>●</span> Total Logs
                    </span>
                    <span style={{ fontSize: "1rem", fontWeight: "600" }}>
                        {app.criticalLogs?.totalLogs?.toLocaleString() || 0}
                    </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                        <span style={{ color: "red", marginRight: "4px" }}>●</span> Errors
                    </span>
                    <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "red" }}>
                        {app.criticalLogs?.errorLogs?.toLocaleString() || 0}
                    </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                        <span style={{ color: "orange", marginRight: "4px" }}>●</span> Warnings
                    </span>
                    <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "orange" }}>
                        {app.criticalLogs?.warningLogs?.toLocaleString() || 0}
                    </span>
                </div>
            </div>
        </div>
    );
};