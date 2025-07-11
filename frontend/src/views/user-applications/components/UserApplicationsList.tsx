import { h } from 'preact';
import { UserApplicationCard } from './UserApplicationCard';
import { Application } from '../../../services/applications.services';

interface ApplicationsListProps {
  applications: Application[];
}

export const UserApplicationsList = ({ applications }: ApplicationsListProps) => {
  return (
    <div
      class="oj-flex oj-flex-wrap oj-sm-padding-4x oj-sm-align-items-stretch oj-sm-justify-content-flex-start"
      style={{ gap: '24px' }}
    >
      {applications.length === 0 ? (
        <div class="oj-typography-body-sm oj-text-color-secondary" style={{ padding: '12px' }}>
          No applications found with the current filters.
        </div>
      ) : (
        applications.map((app) => <UserApplicationCard key={app._id} app={app} />)
      )}
    </div>
  );
};