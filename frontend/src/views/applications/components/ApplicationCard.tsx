// File: src/components/ApplicationCard.tsx
import { h } from 'preact';
import { Application } from '../../../services/applications.services';
import '../../../styles/application-cards.css';

interface ApplicationCardProps {
  app: Application;
  onToggleStatus: (appId: string, isActive: boolean) => void;
  onEdit: (app: Application) => void;
  onDelete: (appId: string) => void;
}

export const ApplicationCard = ({ app, onToggleStatus, onEdit, onDelete }: ApplicationCardProps) => {
  return (
    <div class="oj-panel oj-panel-shadow-md application-card">
      <div class="application-header">
        <div class="application-title-container">
          <h3 class="oj-typography-heading-sm application-title">
            {app.name.replace(/\./g, ' ')}
          </h3>
          <span
            class={`oj-typography-body-xs status-badge ${app.is_active ? 'status-active' : 'status-inactive'}`}
          >
            {app.is_active ? 'Active' : 'Inactive'}
          </span>
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
          <div class="oj-typography-heading-md">{app.logCount.toLocaleString()}</div>
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
          {app.groupNames.slice(0, 2).map((group, index) => (
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
