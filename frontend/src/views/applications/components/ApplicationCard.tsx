// File: src/components/ApplicationCard.tsx
import { h } from 'preact';
import { Application } from '../../../services/applications.services';
import '../../../styles/application-cards.css';
import config from '../../../config/config';

interface ApplicationCardProps {
  app: Application;
  onToggleStatus: (appId: string, isActive: boolean) => void;
  onEdit: (app: Application) => void;
  onDelete: (appId: string) => void;
}

const getHealthStatusStyle = (status: string) => {
  switch (status) {
    case 'critical':
      return { background: '#fde8e8', color: '#991b1b', border: '1px solid #fecaca' };
    case 'warning':
      return { background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' };
    case 'healthy':
    default:
      return { background: '#eafaf1', color: '#065f46', border: '1px solid #a7f3d0' };
  }
};

export const ApplicationCard = ({ app, onToggleStatus, onEdit, onDelete }: ApplicationCardProps) => {
  return (
    <div class="oj-panel application-card">
      <div class="application-header">
        <div class="application-title-container">
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
            <h3 class="oj-typography-heading-sm application-title" style={{ margin: 0 }}>
              {app.name.replace(/\./g, ' ')}
            </h3>
            <span
              class="oj-typography-body-xs"
              style={{
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: 500,
                marginTop: '6px',
                textTransform: 'capitalize',
                display: 'inline-block',
                fontSize: '0.75rem',
                ...getHealthStatusStyle(app.health_status),
              }}
            >
              {app.health_status}
            </span>
          </div>
        </div>
        <oj-switch
          value={app.is_active}
          onvalueChanged={(e) => onToggleStatus(app._id, e.detail.value as boolean)}
        />
      </div>

      <p class="oj-typography-body-sm oj-text-color-secondary oj-sm-margin-b-2x application-description">
        {app.description}
      </p>

      <div class="stats-container">
        <div class="stat-box">
          <div class="oj-typography-body-sm oj-text-color-secondary">Logs</div>
          <div class="oj-typography-heading-md">
            {app.is_active ? app.logCount.toLocaleString() : '0'}
          </div>
        </div>
        <div class="stat-box">
          <div class="oj-typography-body-sm oj-text-color-secondary">Groups</div>
          <div class="oj-typography-heading-md">{app.groupCount.toLocaleString()}</div>
        </div>
      </div>

      <div class="oj-sm-margin-b-4x" style={{ marginBottom: '12px' }}>
        <p class="oj-typography-body-sm oj-text-color-secondary" style={{ marginBottom: '4px' }}>
          Assigned To
        </p>
        <div class="group-chips">
          <span class="admin-chip" >
            {config.ADMIN_USER_GROUP}
          </span>
          {app.groupNames
            .slice(0, 2)
            .map((group, index) => (
              <span key={index} class="group-chip">
                {group}
              </span>
            ))}
          {app.groupNames.length > 2 && (
            <span class="more-chip">+{app.groupNames.length - 2}</span>
          )}
        </div>
      </div>

      <div class="application-footer">
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
  );
};