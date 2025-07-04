import { h } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import 'ojs/ojbutton'
import 'ojs/ojdialog'
import 'oj-c/form-layout'
import 'oj-c/input-text'
import 'ojs/ojlabel'
import 'ojs/ojpopup'
import { userGroupFormSchema } from '../../validation/usergroups.validator'
import 'ojs/ojswitch'
import { useToast } from '../../context/ToastContext'
import 'oj-c/message-toast'
import LengthValidator = require('ojs/ojvalidator-length')
import RegExpValidator = require('ojs/ojvalidator-regexp')
import "ojs/ojselectcombobox";
import ArrayDataProvider = require('ojs/ojarraydataprovider');

interface User {
  _id: string
  username: string
  is_active: boolean
}

interface Application {
  _id: string
  name: string
  is_active: boolean
}

interface UserGroup {
  _id: string
  name: string
  description: string
  created_at: string
  is_active: boolean
  userCount: number
  applicationCount: number
  applicationNames: string[]
  users: User[]
}

// Type for the combobox data items
type Email = {
  value: string;
  label: string;
};

const UserGroups = (props: { path?: string }) => {
  const [groups, setGroups] = useState<UserGroup[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [confirmDeleteDialogId, setConfirmDeleteDialogId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [confirmCancelDialog, setConfirmCancelDialog] = useState(false);

  const [addMemberEmails, setAddMemberEmails] = useState<string[]>([]);
  const [removeMemberEmails, setRemoveMemberEmails] = useState<string[]>([]);
  const [addEmailDataProvider, setAddEmailDataProvider] = useState<ArrayDataProvider<Email['value'], Email>>(
    new ArrayDataProvider<Email['value'], Email>([], { keyAttributes: 'value' })
  );
  const [removeEmailDataProvider, setRemoveEmailDataProvider] = useState<ArrayDataProvider<Email['value'], Email>>(
    new ArrayDataProvider<Email['value'], Email>([], { keyAttributes: 'value' })
  );

  const [errors, setErrors] = useState<{
    name?: string
    description?: string
    memberEmails?: string
  }>({})
  const nameRegex = /^[a-zA-Z0-9 ]+$/
  const [showAppAccessDialog, setShowAppAccessDialog] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null)
  const [availableApps, setAvailableApps] = useState<Application[]>([])
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([])
  const [showUnassignConfirmDialog, setShowUnassignConfirmDialog] = useState(false)
  const [pendingAppSave, setPendingAppSave] = useState(false)
  const [removedAppIds, setRemovedAppIds] = useState<string[]>([])
  const [stagedAppIds, setStagedAppIds] = useState<string[]>([])
  const [showUsersDialog, setShowUsersDialog] = useState(false)
  const { addNewToast, messageDataProvider, removeToast } = useToast()

  const closeMessage = (event: CustomEvent<{ key: string }>) => {
    removeToast(event.detail.key)
  }

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem('jwt')
      const res = await fetch('http://localhost:3001/api/userGroup/', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      const data = await res.json()
      setGroups(data)
    } catch (error) {
      addNewToast(
        'error',
        'Error',
        'Failed to fetch user groups',
      )
      console.error('Failed to fetch user groups', error)
    }
  }

  const openDialog = async (group?: UserGroup) => {
    setErrors({})
    if (group) {
      setEditingGroup(group)
      setName(group.name || '')
      setDescription(group.description || '')
      
      const token = localStorage.getItem('jwt')
      const appsRes = await fetch('http://localhost:3001/api/applications', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (appsRes.ok) {
        const appsData = await appsRes.json()
        if (Array.isArray(appsData.applications)) {
          const apps = appsData.applications
          setAvailableApps(apps)
          
          const matchedIds = apps
            .filter((app: Application) =>
              group.applicationNames.some(
                name => name.trim().toLowerCase() === app.name.trim().toLowerCase()
              )
            )
            .map((app: Application) => app._id)
          
          setSelectedAppIds(matchedIds)
          setStagedAppIds(matchedIds)
        }
      }
    } else {
      setEditingGroup(null)
      setName('')
      setDescription('')
      setSelectedAppIds([])
      setStagedAppIds([])
    }

    if (!group) {
    const token = localStorage.getItem('jwt');
    const appsRes = await fetch('http://localhost:3001/api/applications', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (appsRes.ok) {
      const appsData = await appsRes.json();
      if (Array.isArray(appsData.applications)) {
        setAvailableApps(appsData.applications);
      }
    }
  }
  
    setAddMemberEmails([])
    setRemoveMemberEmails([])
    setAddEmailDataProvider(new ArrayDataProvider([], { keyAttributes: 'value' }))
    setRemoveEmailDataProvider(new ArrayDataProvider([], { keyAttributes: 'value' }))
    
    setShowDialog(true)
  }

  const fetchAndMapEmails = async (query: string): Promise<Email[]> => {
    const token = localStorage.getItem('jwt');
    const res = await fetch(
      `http://localhost:3001/api/directory/search?q=${encodeURIComponent(query)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const emails: string[] = data.emails || [];
    return emails.map(email => ({ label: email, value: email }));
  };

  const handleAddRawValueChange = async (event: any) => {
    const raw = event.detail.value;
    const currentInput = raw?.[raw.length - 1];
    if (typeof currentInput === 'string' && currentInput.length >= 3) {
      const results = await fetchAndMapEmails(currentInput);
      const dp = new ArrayDataProvider<Email['value'], Email>(results, { keyAttributes: 'value' });
      setAddEmailDataProvider(dp);
    }
  };
  const handleAddValueChange = (event: any) => {
    setAddMemberEmails(event.detail.value as string[]);
  };

  const handleRemoveRawValueChange = async (event: any) => {
    const raw = event.detail.value;
    const currentInput = raw?.[raw.length - 1];
    if (typeof currentInput === 'string' && currentInput.length >= 3) {
      const results = await fetchAndMapEmails(currentInput);
      const dp = new ArrayDataProvider<Email['value'], Email>(results, { keyAttributes: 'value' });
      setRemoveEmailDataProvider(dp);
    }
  };
  const handleRemoveValueChange = (event: any) => {
    setRemoveMemberEmails(event.detail.value as string[]);
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {}
    if (!editingGroup && addMemberEmails.length === 0) {
      newErrors.memberEmails = 'At least one member email must be added.'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const saveGroup = async () => {
  if (!validateForm()) return;
  
  try {
    const token = localStorage.getItem('jwt');
    let response;

    if (editingGroup) {
      const updateRes = await fetch(`http://localhost:3001/api/userGroup/${editingGroup._id}`, {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          name,
          description,
          addMemberEmails,
          removeMemberEmails,
        }),
      });
      
      if (!updateRes.ok) {
        const errorData = await updateRes.json();
        throw new Error(errorData.message || 'Failed to update user group');
      }

      response = await updateRes.json();

      const appsChanged = JSON.stringify(stagedAppIds.sort()) !== JSON.stringify(selectedAppIds.sort());
      
      if (appsChanged && stagedAppIds.length >= 0) {
        await updateGroupAppAccess(editingGroup._id, stagedAppIds);
      }
    } else {
      const createRes = await fetch('http://localhost:3001/api/userGroup/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          memberEmails: addMemberEmails,
        }),
      });
      
      if (!createRes.ok) {
        const errorData = await createRes.json();
        throw new Error(errorData.message || 'Failed to create user group');
      }

      response = await createRes.json();
      if (stagedAppIds.length > 0) {
        await updateGroupAppAccess(response._id, stagedAppIds);
      }
    }

    setShowDialog(false);
    fetchGroups();
    addNewToast(
      'confirmation',
      'Success',
      editingGroup ? 'User group updated successfully.' : 'User group created successfully.',
    );
  } catch (error: any) {
    setErrorMessage(error.message || 'Failed to save user group.');
    setShowErrorDialog(true);
    addNewToast(
      'error',
      'Error',
      error.message || 'Failed to save user group.',
    );
  }
};

   const handleAppSelectionChange = (appId: string, checked: boolean) => {
    setStagedAppIds(prev => 
      checked ? [...prev, appId] : prev.filter(id => id !== appId)
    )
  }

  const confirmDeleteGroup = (groupId: string) => {
    setConfirmDeleteDialogId(groupId)
  }

  const handleDeleteGroup = async () => {
    try {
      if (!confirmDeleteDialogId) return
      console.log('Deleting');
      const token = localStorage.getItem('jwt')
      const res = await fetch(`http://localhost:3001/api/userGroup/${confirmDeleteDialogId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        fetchGroups()
        addNewToast(
          'confirmation',
          'Success',
          'Group deleted successfully.',
        )
      } else {
        setErrorMessage('Failed to delete user group.')
        setShowErrorDialog(true)
        addNewToast(
          'error',
          'Error',
          'Failed to delete user group.',
        )
      }
      setConfirmDeleteDialogId(null)
    } catch (error) {
      addNewToast(
        'error',
        'Error',
        'Failed to delete group',
      )
      console.error('Failed to delete group', error)
    }
  }

const updateGroupAppAccess = async (groupId: string, appIds: string[]) => {
  const token = localStorage.getItem('jwt');
  try {
    const res = await fetch(`http://localhost:3001/api/userGroup/${groupId}/app-access`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ appIds }),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to update app access');
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error updating app access:', error);
    throw error;
  }
};
  const handleToggleGroupStatus = async (groupId: string, isActive: boolean) => {
    const token = localStorage.getItem('jwt')
    try {
      const res = await fetch(`http://localhost:3001/api/userGroup/status/${groupId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: isActive }),
      })
      const data = await res.json()
      if (res.ok) {
        fetchGroups()
        addNewToast(
          'confirmation',
          'Success',
          data.message || 'Group status updated.',
        )
      } else {
        addNewToast(
          'error',
          'Error',
          data.message || 'Failed to toggle group status.',
        )
      }
    } catch (error) {
      addNewToast(
        'error',
        'Error',
        'Error toggling status.',
      )
      console.error('Error toggling status:', error)
    }
  }

  const handleUsersClick = async (group: UserGroup) => {
    setSelectedGroup(group)
    const token = localStorage.getItem('jwt')
    if (!token) {
      setErrorMessage('Authentication token is missing.')
      setShowErrorDialog(true)
      addNewToast(
        'error',
        'Error',
        'Authentication token is missing.',
      )
      return
    }
    try {
      const res = await fetch(`http://localhost:3001/api/userGroup/${group._id}/users`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      const data = await res.json()
      if (res.ok) {
        setSelectedGroup((prevGroup) => ({
          ...prevGroup!,
          users: data.users,
        }))
        setShowUsersDialog(true)
        addNewToast(
          'confirmation',
          'Success',
          data.message || 'Fetched users successfully.',
        )
      } else {
        setErrorMessage(data.message || 'Failed to fetch users.')
        setShowErrorDialog(true)
        addNewToast(
          'error',
          'Error',
          data.message || 'Failed to fetch users.',
        )
      }
    } catch (error) {
      addNewToast(
        'error',
        'Error',
        'An error occurred while fetching users.',
      )
      console.error('Error fetching users:', error)
      setErrorMessage('An error occurred while fetching users.')
      setShowErrorDialog(true)
    }
  }

  const closeUsersDialog = () => {
    setShowUsersDialog(false)
  }

  return (
    <div class="oj-flex oj-sm-padding-4x">
      <div class="oj-flex oj-sm-12 oj-sm-margin-4x oj-sm-justify-content-space-between oj-sm-align-items-center">
        <div>
          <h1 class="oj-typography-heading-lg">User Groups</h1>
          <p class="oj-typography-body-md">Manage your user groups and their applications</p>
        </div>
        <div>
          <oj-button onojAction={() => openDialog()} chroming="callToAction">+ Create Group</oj-button>
        </div>
      </div>
      <div class="oj-flex oj-flex-wrap" style={{ gap: '24px', justifyContent: 'flex-start', alignItems: 'stretch' }}>
        {groups.map((group) => (
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
            {/* Header: Name + Toggle */}
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
                <oj-switch value={group.is_active} onvalueChanged={(e) => handleToggleGroupStatus(group._id, e.detail.value as boolean)} />
              </div>
            </div>
            {/* Description */}
            <p class="oj-typography-body-sm oj-text-color-secondary oj-sm-margin-b-2x" style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {group.description}
            </p>
            {/* Users and Applications */}
            <div class="oj-flex" style={{ justifyContent: 'space-between', alignItems: 'stretch', gap: '32px', marginBottom: '24px' }}>
             
              {/* Users */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', backgroundColor: 'rgba(243, 243, 243, 0.6)', padding: '8px', borderRadius: '8px', flex: 1 }}>
                <div class="oj-typography-body-sm oj-text-color-secondary">Users</div>
                <div class="oj-typography-heading-md">
                  <span class="oj-link" style={{ cursor: 'pointer' }} onClick={() => handleUsersClick(group)}>
                    {group.userCount.toLocaleString()}
                  </span>
                </div>
              </div>
            
              {/* Applications */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', backgroundColor: 'rgba(243, 243, 243, 0.6)', padding: '8px', borderRadius: '8px', flex: 1 }}>
                <div class="oj-typography-body-sm oj-text-color-secondary">Applications</div>
                <div class="oj-typography-heading-md">{group.applicationCount.toLocaleString()}</div>
              </div>
            </div>
            <div class="oj-sm-margin-b-4x" style={{ marginBottom: '12px' }}>
              <p class="oj-typography-body-sm oj-text-color-secondary" style={{ marginBottom: '4px' }}>Assigned Apps</p>
              <div class="oj-flex oj-sm-flex-wrap" style={{ marginTop: 0 }}>
                {group.applicationNames.slice(0, 2).map((group, index) => (
                  <span
                    key={index}
                    class="oj-typography-body-xs"
                    style={{
                      color: 'rgb(25, 85, 160)',
                      backgroundColor: 'rgb(220, 235, 255)',
                      padding: '4px 8px',
                      margin: '2px',
                      borderRadius: '20px'
                    }}
                  >
                    {group}
                  </span>
                ))}
                {group.applicationNames.length > 2 && (
                  <span
                    class="oj-typography-body-xs"
                    style={{
                      color: 'rgb(0, 0, 0)',
                      backgroundColor: 'rgb(243, 243, 243)',
                      padding: '4px 8px',
                      margin: '2px',
                      borderRadius: '20px'
                    }}
                  >
                    +{group.applicationNames.length - 2}
                  </span>
                )}
              </div>
            </div>
           
            {/* Footer: Buttons */}
            <div class="oj-flex" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: 'auto' }}>
              <div class="oj-typography-body-xs oj-text-color-secondary">
                Created {new Date(group.created_at).toLocaleString()}
              </div>
              <div class="oj-flex" style={{ gap: '12px', marginLeft: 'auto' }}>
                <oj-button chroming="borderless" onojAction={() => openDialog(group)}>
                  Edit
                </oj-button>
                <oj-button chroming="danger" onojAction={() => confirmDeleteGroup(group._id)}>
                  Delete
                </oj-button>
              </div>
              
            </div>
          </div>
        ))}
      </div>
      {confirmDeleteDialogId && (
        <oj-dialog id="confirmDeleteDialog" dialogTitle="Confirm Deletion" initialVisibility="show">
          <div class="oj-dialog-body">Are you sure you want to delete this group?</div>
          <div class="oj-dialog-footer">
            <oj-button onojAction={handleDeleteGroup} chroming="danger">
              Delete
            </oj-button>
            <oj-button onojAction={() => setConfirmDeleteDialogId(null)} chroming="borderless">
              Cancel
            </oj-button>
          </div>
        </oj-dialog>
      )}
      {showDialog && (
        <oj-dialog
          id="groupDialog"
          dialogTitle={editingGroup ? 'Edit Group' : 'Create Group'}
          initialVisibility="show"
          style={{ maxWidth: '800px', width: '100%' }}
        >
          <div class="oj-dialog-body">
            <oj-c-form-layout>
              <oj-c-input-text
                id="name-input"
                labelHint="Name"
                value={name}
                onvalueChanged={(e) => setName(e.detail.value)}
                required
                validators={[
                  new LengthValidator({ min: 5, max: 20 }),
                  new RegExpValidator({
                    pattern: '^[a-zA-Z0-9 _-]+$',
                    hint: 'Only letters, numbers, spaces, hyphens (-), and underscores (_) are allowed.',
                    messageSummary: 'Invalid name format.',
                    messageDetail:
                      'Use only letters, numbers, spaces, hyphens (-), and underscores (_).',
                  }),
                ]}
              ></oj-c-input-text>
              <oj-c-input-text
                labelHint="Description"
                value={description}
                onvalueChanged={(e) => setDescription(e.detail.value)}
                required
                validators={[
                  new LengthValidator({ min: 10, max: 100 }),
                  new RegExpValidator({
                    pattern: '^[a-zA-Z0-9 _.,:;()\\\[\\\]\'"-]+$',
                    hint: 'Only letters, numbers, spaces, hyphens (-), and underscores (_) are allowed.',
                    messageSummary: 'Invalid name format.',
                    messageDetail:
                      'Use only letters, numbers, spaces, hyphens (-), and underscores (_).',
                  }),
                ]}
              ></oj-c-input-text>

              <oj-label for="add-members-combobox">Add Member Emails</oj-label>
              <oj-combobox-many
                id="add-members-combobox"
                options={addEmailDataProvider}
                value={addMemberEmails}
                onvalueChanged={handleAddValueChange}
                onrawValueChanged={handleAddRawValueChange}
                placeholder="Search and select emails to add"
                class="oj-form-control-full-width"
                help={{
                  instruction: "Type at least 3 characters to search for users to add."
                }}
              ></oj-combobox-many>
              {errors.memberEmails && (
                <div class="oj-text-color-danger oj-sm-margin-bottom">{errors.memberEmails}</div>
              )}

              {editingGroup && (
                <>
                  <oj-label for="remove-members-combobox">Remove Member Emails</oj-label>
                  <oj-combobox-many
                    id="remove-members-combobox"
                    options={removeEmailDataProvider}
                    value={removeMemberEmails}
                    onvalueChanged={handleRemoveValueChange}
                    onrawValueChanged={handleRemoveRawValueChange}
                    placeholder="Search and select emails to remove"
                    class="oj-form-control-full-width"
                    help={{
                      instruction: "Type at least 3 characters to search for users to remove."
                    }}
                  ></oj-combobox-many>
                </>
              )}

              {/* App Access Section */}
              <oj-label>Application Access</oj-label>
              <div style={{ 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px', 
                padding: '16px',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {availableApps.length > 0 ? (
                  availableApps.map((app) => (
                    <div key={app._id} style={{ 
                      marginBottom: '8px',
                      opacity: app.is_active ? 1 : 0.6,
                      padding: '8px',
                      backgroundColor: stagedAppIds.includes(app._id) ? '#f0f7ff' : 'transparent',
                      borderRadius: '4px'
                    }}>
                      <label style={{ display: 'flex', alignItems: 'center' }}>
                        <input
                          type="checkbox"
                          checked={stagedAppIds.includes(app._id)}
                          disabled={!app.is_active}
                          onChange={(e) => handleAppSelectionChange(app._id, e.currentTarget.checked)}
                          style={{ marginRight: '8px' }}
                        />
                        <span style={{ flex: 1 }}>
                          {app.name}
                          {!app.is_active && (
                            <span style={{ 
                              marginLeft: '8px', 
                              color: '#dc2626',
                              fontSize: '0.85em'
                            }}>
                              (Inactive)
                            </span>
                          )}
                        </span>
                      </label>
                    </div>
                  ))
                ) : (
                  <div class="oj-text-color-secondary" style={{ textAlign: 'center' }}>
                    Loading applications...
                  </div>
                )}
              </div>
            </oj-c-form-layout>
          </div>
          <div class="oj-dialog-footer">
            <oj-button onojAction={() => saveGroup()}>Save</oj-button>
            <oj-button onojAction={() => setConfirmCancelDialog(true)} chroming="borderless">
              Cancel
            </oj-button>
          </div>
        </oj-dialog>
      )}
      {showErrorDialog && (
        <oj-dialog id="errorDialog" dialogTitle="Error" initialVisibility="show">
          <div class="oj-dialog-body">{errorMessage}</div>
          <div class="oj-dialog-footer">
            <oj-button onojAction={() => setShowErrorDialog(false)}>OK</oj-button>
          </div>
        </oj-dialog>
      )}
      {confirmCancelDialog && (
        <oj-dialog id="confirmDeleteDialog" dialogTitle="Cancel changes" initialVisibility="show">
          <div class="oj-dialog-body">Are you sure you want to cancel changes?</div>
          <div class="oj-dialog-footer">
            <oj-button onojAction={() => {
              setConfirmCancelDialog(false);
              setShowDialog(false);
            }} chroming="danger">
              Confirm
            </oj-button>
            <oj-button onojAction={() => setConfirmCancelDialog(false)} chroming="borderless">
              Cancel
            </oj-button>
          </div>
        </oj-dialog>
      )}
      {showUnassignConfirmDialog && (
        <oj-dialog
          id="confirmUnassignDialog"
          dialogTitle="Confirm Unassignment"
          initialVisibility="show"
        >
          <div class="oj-dialog-body">
            <p>Are you sure you want to unassign the following app(s):</p>
            <ul class="oj-list">
              {removedAppIds.map((appName) => (
                <li key={appName}>{appName}</li>
              ))}
            </ul>
          </div>
          <div class="oj-dialog-footer">
            <oj-button
              onojAction={() => {
                saveGroup()
                setShowUnassignConfirmDialog(false)
              }}
              chroming="danger"
            >
              Yes, Unassign
            </oj-button>
            <oj-button
              onojAction={() => {
                setShowUnassignConfirmDialog(false)
                setPendingAppSave(false)
                setStagedAppIds(selectedAppIds)
              }}
              chroming="borderless"
            >
              Cancel
            </oj-button>
          </div>
        </oj-dialog>
      )}
      {showUsersDialog && selectedGroup && (
        <oj-dialog
          id="usersDialog"
          dialogTitle={`Users in ${selectedGroup.name}`}
          initialVisibility="show"
        >
          <div class="oj-dialog-body">
            <ul>
              {selectedGroup.users?.map((user, idx) => (
                <li key={idx}>{user.username}</li>
              ))}
            </ul>
          </div>
          <div class="oj-dialog-footer">
            <oj-button onojAction={closeUsersDialog}>Close</oj-button>
          </div>
        </oj-dialog>
      )}
      <oj-c-message-toast
        data={messageDataProvider}
        onojClose={closeMessage}
        position="top-right"
        offset={{ horizontal: 10, vertical: 50 }}
      />
    </div>
  )
}

export default UserGroups