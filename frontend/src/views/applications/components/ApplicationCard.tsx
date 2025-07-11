// File: src/components/ApplicationCard.tsx
import { h } from 'preact'
import { Application } from '../../../services/applications.services';

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

interface ApplicationCardProps {
  app: Application;
  onToggleStatus: (appId: string, isActive: boolean) => void;
  onEdit: (app: Application) => void;
  onDelete: (appId: string) => void;
}

export const ApplicationCard = ({ app, onToggleStatus, onEdit, onDelete }: ApplicationCardProps) => {
  const healthColor = getHealthStatusColor(app.health_status);
  return (
    <div
      key={app._id}
      class="oj-panel oj-panel-shadow-md"
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px 20px 16px 20px',
        maxWidth: '400px',
        minWidth: '400px',
        flex: '1 1 400px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div class="oj-flex" style={{ alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                {/* Left side with title and new health status */}
                <div class="oj-flex oj-sm-flex-direction-column">
                    <h3 class="oj-typography-heading-sm" style={{ margin: 0, wordBreak: 'break-word' }}>
                        {app.name}
                    </h3>
                    <span
                        class="oj-typography-body-xs"
                        style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontWeight: 500,
                            marginTop: '4px',
                            backgroundColor: healthColor.background,
                            color: healthColor.text,
                            border: `1px solid ${healthColor.border}`,
                            textTransform: 'capitalize',
                            alignSelf: 'flex-start'
                        }}
                    >
                        {app.health_status}
                    </span>
                </div>
                {/* Right side with Active toggle */}
                <div style={{ flexShrink: 0 }}>
                    <span
                        class="oj-typography-body-xs"
                        style={{ color: app.is_active ? '#065f46' : '#991b1b', fontSize: '0.85em', marginRight: '8px' }}
                    >
                        {app.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <oj-switch
                        value={app.is_active}
                        onvalueChanged={(e) => onToggleStatus(app._id, e.detail.value as boolean)}
                    />
                </div>
            </div>

      <p
        class="oj-typography-body-sm oj-text-color-secondary oj-sm-margin-b-2x"
        style={{
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {app.description}
      </p>

      <div
        class="oj-flex"
        style={{
          justifyContent: 'space-between',
          alignItems: 'stretch',
          gap: '32px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            backgroundColor: 'rgba(243, 243, 243, 0.6)',
            padding: '8px',
            borderRadius: '8px',
            flex: 1,
          }}
        >
          <div class="oj-typography-body-sm oj-text-color-secondary">Logs</div>
          <div class="oj-typography-heading-md">{app.logCount.toLocaleString()}</div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            backgroundColor: 'rgba(243, 243, 243, 0.6)',
            padding: '8px',
            borderRadius: '8px',
            flex: 1,
          }}
        >
          <div class="oj-typography-body-sm oj-text-color-secondary">Groups</div>
          <div class="oj-typography-heading-md">{app.groupCount.toLocaleString()}</div>
        </div>
      </div>

      <div class="oj-sm-margin-b-4x" style={{ marginBottom: '12px' }}>
        <p
          class="oj-typography-body-sm oj-text-color-secondary"
          style={{ marginBottom: '4px' }}
        >
          Assigned To
        </p>
        <div class="oj-flex oj-sm-flex-wrap" style={{ marginTop: 0 }}>
          {app.groupNames.slice(0, 2).map((group, index) => (
            <span
              key={index}
              class="oj-typography-body-xs"
              style={{
                color: 'rgb(25, 85, 160)',
                backgroundColor: 'rgb(220, 235, 255)',
                padding: '4px 8px',
                margin: '2px',
                borderRadius: '20px',
              }}
            >
              {group}
            </span>
          ))}
          {app.groupNames.length > 2 && (
            <span
              class="oj-typography-body-xs"
              style={{
                color: 'rgb(0, 0, 0)',
                backgroundColor: 'rgb(243, 243, 243)',
                padding: '4px 8px',
                margin: '2px',
                borderRadius: '20px',
              }}
            >
              +{app.groupNames.length - 2}
            </span>
          )}
        </div>
      </div>

      <div
        class="oj-flex"
        style={{
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          marginTop: 'auto',
        }}
      >
        <div class="oj-typography-body-xs oj-text-color-secondary">
          Created {new Date(app.created_at).toLocaleString()}
        </div>
        <div class="oj-flex" style={{ gap: '12px' }}>
          <oj-button chroming="borderless" onojAction={() => onEdit(app)}>
            Edit
          </oj-button>
          <oj-button chroming="danger" onojAction={() => onDelete(app._id)}>
            Delete
          </oj-button>
        </div>
      </div>
    </div>
  )
}