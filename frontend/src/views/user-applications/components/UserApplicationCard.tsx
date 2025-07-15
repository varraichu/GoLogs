import { h } from 'preact';
import { Application } from '../../../services/applications.services';
import '../../../styles/application-cards.css';

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

interface UserApplicationCardProps {
  app: Application;
}

export const UserApplicationCard = ({ app }: UserApplicationCardProps) => {
  const healthColor = getHealthStatusColor(app.health_status);
  return (
    <div
      class="oj-panel"
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
      <div>
        <div class="oj-flex" style={{ alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <h3 class="oj-typography-heading-sm" style={{ margin: 0, wordBreak: 'break-word' }}>
              {app.name.replace(/\./g, ' ')}
              {app.isPinned && (
                <span
                  class="oj-ux-ico-pin-filled"
                  style="color: #4CAF50; margin-left: 8px;"
                  title="Pinned"
                ></span>
              )}
            </h3>
            <span
              class="oj-typography-body-xs"
              style={{
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: 500,
                marginTop: '5px',
                backgroundColor: healthColor.background,
                color: healthColor.text,
                border: `1px solid ${healthColor.border}`,
                textTransform: 'capitalize',
                display: 'inline-block',
                fontSize: '0.75rem',
              }}
            >
              {app.health_status}
            </span>
          </div>

          <div class="oj-typography-body-xs" style={{ color: app.is_active ? '#065f46' : '#991b1b', flexShrink: 0 }}>
            {app.is_active ? 'Active' : 'Inactive'}
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
      </div>

      <div class="application-footer">
        <div class="oj-typography-body-xs oj-text-color-secondary">
          Created {new Date(app.created_at).toLocaleString()}
        </div>
      </div>
    </div>
  );
};