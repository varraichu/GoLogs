import { h } from 'preact';
import { UserGroup } from '../../../services/usergroups.services';
import '../../../styles/usergroup-cards.css';

interface UserGroupCardProps {
  group: UserGroup;
  onEdit: (group: UserGroup) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
  onViewUsers: (group: UserGroup) => void;
}

export const UserGroupCard = ({ group, onEdit, onDelete, onToggleStatus, onViewUsers }: UserGroupCardProps) => {
  const isAdminGroup = group.name === 'Admin Group';

  return (
    <div class="oj-panel user-group-card"
      style={{ maxWidth: "100%" }}>
      <div>
        <div class="user-group-header">
          <div class="user-group-title-container">
            <h3 class="oj-typography-heading-sm user-group-title">{group.name}</h3>
            <span class={`oj-typography-body-xs status-badge ${group.is_active ? 'status-active' : 'status-inactive'}`}>
              {group.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <oj-switch
            value={group.is_active}
            onvalueChanged={(e) => onToggleStatus(group._id, e.detail.value as boolean)}
            disabled={isAdminGroup}
          />
        </div>

        <p class="oj-typography-body-sm oj-text-color-secondary oj-sm-margin-b-2x user-group-description">
          {group.description}
        </p>

        <div class="stats-container">
          <div class="stat-box">
            <div class="oj-typography-body-sm oj-text-color-secondary">Users</div>
            <div class="oj-typography-heading-md">
              <span class="oj-link stat-link" onClick={() => onViewUsers(group)}>
                {group.userCount.toLocaleString()}
              </span>
            </div>
          </div>
          <div class="stat-box">
            <div class="oj-typography-body-sm oj-text-color-secondary">Applications</div>
            <div class="oj-typography-heading-md">{group.applicationCount.toLocaleString()}</div>
          </div>
        </div>

        <div class="oj-sm-margin-b-4x" style={{ marginBottom: '12px' }}>
          <p class="oj-typography-body-sm oj-text-color-secondary" style={{ marginBottom: '4px' }}>Assigned Apps</p>
          <div class="group-chips">
            {group.applicationNames.slice(0, 2).map((appName, index) => (
              <span key={index} class="group-chip">{appName.replace(/\./g, ' ')}</span>
            ))}
            {group.applicationNames.length > 2 && (
              <span class="more-chip">+{group.applicationNames.length - 2}</span>
            )}
          </div>
        </div>
      </div>

      <div class="user-group-footer">
        <div class="oj-typography-body-xs oj-text-color-secondary">
          Created {new Date(group.created_at).toLocaleString()}
        </div>
        <div class="footer-buttons">
          <oj-button chroming="borderless" onojAction={() => onEdit(group)}>Edit</oj-button>
          <oj-button
            chroming="danger"
            onojAction={() => onDelete(group._id)}
            disabled={isAdminGroup}
          >
            Delete
          </oj-button>
        </div>
      </div>
    </div>
  );
};