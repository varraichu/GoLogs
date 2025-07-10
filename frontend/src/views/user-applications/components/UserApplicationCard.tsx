// File: src/components/UserApplicationCard.tsx
import { h } from 'preact';
import '../../../styles/userapplication-card.css';

interface UserApplicationCardProps {
  app: Application;
}
interface Application {
  _id: string;
  name: string;
  description: string;
  created_at: string;
  is_active: boolean;
  groupCount: number;
  groupNames: string[];
  logCount: number;
  isPinned: boolean;
}

export const UserApplicationCard = ({ app }: UserApplicationCardProps) => {
  return (
    <div key={app._id} class="oj-panel oj-panel-shadow-md application-card">
      <div class="application-header">
        <div class="application-title-container">
          <h3 class="oj-typography-heading-sm application-title">
            {app.name}
            {app.isPinned && (
              <span
                class="oj-ux-ico-pin-filled"
                style={{ color: '#4CAF50', marginLeft: '8px' }}
                title="Pinned application"
              />
            )}
          </h3>
          <span
            class={`oj-typography-body-xs status-badge ${
              app.is_active ? 'status-active' : 'status-inactive'
            }`}
          >
            {app.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <p class="oj-typography-body-sm oj-text-color-secondary oj-sm-margin-b-2x application-description">
        {app.description}
      </p>

      <div class="stats-container">
        <div class="stat-box">
          <div class="oj-typography-body-sm oj-text-color-secondary">Logs</div>
          <div class="oj-typography-heading-md">{app.logCount.toLocaleString()}</div>
        </div>
      </div>

      <div class="application-footer">
        <div class="oj-typography-body-xs oj-text-color-secondary">
          Created {new Date(app.created_at).toLocaleString()}
        </div>
      </div>
    </div>
  );
};
