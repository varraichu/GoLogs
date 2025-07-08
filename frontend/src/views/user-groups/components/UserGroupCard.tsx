import { UserGroup } from '../../../services/usergroups.services';

interface UserGroupCardProps {
    group: UserGroup;
    onEdit: (group: UserGroup) => void;
    onDelete: (id: string) => void;
    onToggleStatus: (id: string, isActive: boolean) => void;
    onViewUsers: (group: UserGroup) => void;
}

export const UserGroupCard = ({ group, onEdit, onDelete, onToggleStatus, onViewUsers }: UserGroupCardProps) => (
    <div
        key={group._id}
        class="oj-panel oj-panel-shadow-md"
        style={{
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px 20px 16px 20px',
            maxWidth: '420px',
            minWidth: '420px',
            flex: '1 1 400px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
        }}
    >
        <div>
            <div class="oj-flex" style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', width: '100%' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                    <h3 class="oj-typography-heading-sm" style={{ margin: 0, flex: 1, wordBreak: 'break-word' }}>
                        {group.name}
                    </h3>
                    <span
                        class="oj-typography-body-xs"
                        style={{
                            marginLeft: '12px',
                            padding: '2px 10px',
                            fontWeight: '500',
                            color: group.is_active ? '#065f46' : '#991b1b',
                            fontSize: '0.85em',
                        }}
                    >
                        {group.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>
                <div style={{ flex: 0 }}>
                    <oj-switch value={group.is_active} onvalueChanged={(e) => onToggleStatus(group._id, e.detail.value as boolean)} />
                </div>
            </div>
            <p class="oj-typography-body-sm oj-text-color-secondary oj-sm-margin-b-2x" style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {group.description}
            </p>
            <div class="oj-flex" style={{ justifyContent: 'space-between', alignItems: 'stretch', gap: '32px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', backgroundColor: 'rgba(243, 243, 243, 0.6)', padding: '8px', borderRadius: '8px', flex: 1 }}>
                    <div class="oj-typography-body-sm oj-text-color-secondary">Users</div>
                    <div class="oj-typography-heading-md">
                        <span class="oj-link" style={{ cursor: 'pointer' }} onClick={() => onViewUsers(group)}>
                            {group.userCount.toLocaleString()}
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', backgroundColor: 'rgba(243, 243, 243, 0.6)', padding: '8px', borderRadius: '8px', flex: 1 }}>
                    <div class="oj-typography-body-sm oj-text-color-secondary">Applications</div>
                    <div class="oj-typography-heading-md">{group.applicationCount.toLocaleString()}</div>
                </div>
            </div>
            <div class="oj-sm-margin-b-4x" style={{ marginBottom: '12px' }}>
                <p class="oj-typography-body-sm oj-text-color-secondary" style={{ marginBottom: '4px' }}>Assigned Apps</p>
                <div class="oj-flex oj-sm-flex-wrap" style={{ marginTop: 0 }}>
                    {group.applicationNames.slice(0, 2).map((appName, index) => (
                        <span key={index} class="oj-typography-body-xs" style={{ color: 'rgb(25, 85, 160)', backgroundColor: 'rgb(220, 235, 255)', padding: '4px 8px', margin: '2px', borderRadius: '20px' }}>
                            {appName}
                        </span>
                    ))}
                    {group.applicationNames.length > 2 && (
                        <span class="oj-typography-body-xs" style={{ color: 'rgb(0, 0, 0)', backgroundColor: 'rgb(243, 243, 243)', padding: '4px 8px', margin: '2px', borderRadius: '20px' }}>
                            +{group.applicationNames.length - 2}
                        </span>
                    )}
                </div>
            </div>
        </div>
        <div class="oj-flex" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: 'auto' }}>
            <div class="oj-typography-body-xs oj-text-color-secondary">Created {new Date(group.created_at).toLocaleString()}</div>
            <div class="oj-flex" style={{ gap: '12px', marginLeft: 'auto' }}>
                <oj-button chroming="borderless" onojAction={() => onEdit(group)}>Edit</oj-button>
                <oj-button chroming="danger" onojAction={() => onDelete(group._id)}>Delete</oj-button>
            </div>
        </div>
    </div>
);