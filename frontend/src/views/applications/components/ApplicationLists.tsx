// File: src/components/ApplicationsList.tsx
import { h } from 'preact'
import { ApplicationCard } from './ApplicationCard'
import { Application } from '../../../services/applications.services'

interface ApplicationsListProps {
  applications: Application[];
  onToggleStatus: (appId: string, isActive: boolean) => void;
  onEdit: (app: Application) => void;
  onDelete: (appId: string) => void;
}

export const ApplicationsList = ({
  applications,
  onToggleStatus,
  onEdit,
  onDelete,
}: ApplicationsListProps) => {

  return (
    <div
      class="oj-flex oj-flex-wrap"
      style={{
        gap: '24px',
        justifyContent: 'flex-start',
        alignItems: 'stretch',
        marginTop: '24px',
      }}
    >
      {applications.length === 0 ? (
        <div class="oj-typography-body-sm oj-text-color-secondary" style={{ padding: '12px' }}>
          No applications found with the current filters.
        </div>
      ) : (
        applications.map((app) => (
          <ApplicationCard
            key={app._id}
            app={app}
            onToggleStatus={onToggleStatus}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
};