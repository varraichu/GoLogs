import { h } from 'preact'
import { useEffect, useMemo, useState } from 'preact/hooks'
import 'ojs/ojbutton'
import 'ojs/ojdialog'
import 'oj-c/form-layout'
import 'oj-c/input-text'
import 'ojs/ojlabel'
import 'ojs/ojpopup'
import 'ojs/ojswitch'
import { useToast } from '../../context/ToastContext'
import 'oj-c/message-toast'
import LengthValidator = require('ojs/ojvalidator-length')
import RegExpValidator = require('ojs/ojvalidator-regexp')
import "ojs/ojselectcombobox";
import ArrayDataProvider = require('ojs/ojarraydataprovider');

import { TabBar } from '../../components/TabBar';
import { ConfirmDialog } from '../../components/ConfirmDialog'

const MAX_VISIBLE_APPS = 5

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

  // New state for comboboxes
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
  
  const [selectedItem, setSelectedItem] = useState('active');
  const handleSelectionChange = (event: CustomEvent) => {
    const newSelection = event.detail.value;
    setSelectedItem(newSelection);
  };

  useEffect(() => {
    fetchGroups()
  }, [])

  // Fetch groups
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

  const openDialog = (group?: UserGroup) => {
    setErrors({})
    if (group) {
      setEditingGroup(group)
      setName(group.name || '')
      setDescription(group.description || '')
    } else {
      setEditingGroup(null)
      setName('')
      setDescription('')
    }
    // Reset combobox states
    setAddMemberEmails([]);
    setRemoveMemberEmails([]);
    setAddEmailDataProvider(new ArrayDataProvider([], { keyAttributes: 'value' }));
    setRemoveEmailDataProvider(new ArrayDataProvider([], { keyAttributes: 'value' }));
    setShowDialog(true)
  }

  // Fetches emails from the directory and maps them to the {value, label} format
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

  // Handlers for the "Add Members" combobox
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

  // Handlers for the "Remove Members" combobox
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

  // Save group
  const saveGroup = async () => {
    if (!validateForm()) return
    const token = localStorage.getItem('jwt')
    let body: string
    let url: string
    let method: 'POST' | 'PATCH'

    if (editingGroup) {
      method = 'PATCH'
      url = `http://localhost:3001/api/userGroup/${editingGroup._id}`
      body = JSON.stringify({
        name,
        description,
        addMemberEmails: addMemberEmails,
        removeMemberEmails: removeMemberEmails,
      })
    } else {
      method = 'POST'
      url = 'http://localhost:3001/api/userGroup/'
      body = JSON.stringify({
        name,
        description,
        memberEmails: addMemberEmails,
      })
    }
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body,
    })
    const data = await res.json()
    if (res.ok) {
      setShowDialog(false)
      fetchGroups()
      addNewToast(
        'confirmation',
        'Success',
        data.message || 'User group saved successfully.',
      )
    } else {
      setErrorMessage(data.message || 'Failed to save user group.')
      setShowErrorDialog(true)
      addNewToast(
        'error',
        'Error',
        data.message || 'Failed to save user group.',
      )
    }
  }

  const confirmDeleteGroup = (groupId: string) => {
    setConfirmDeleteDialogId(groupId)
  }

  // Delete group
  const handleDeleteGroup = async () => {
    try {
      if (!confirmDeleteDialogId) return
      console.log('Deleting');
      const token = localStorage.getItem('jwt')
      const res = await fetch(`http://localhost:3001/api/userGroup/${confirmDeleteDialogId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        fetchGroups()
        addNewToast(
          'confirmation',
          'Success',
          data.message || 'Group deleted successfully.',
        )
      } else {
        setErrorMessage('Failed to delete user group.')
        setShowErrorDialog(true)
        addNewToast(
          'error',
          'Error',
          data.message || 'Failed to delete user group.',
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

  const handleAppAccess = async (group: UserGroup) => {
    setSelectedGroup(group)
    const token = localStorage.getItem('jwt')
    const res = await fetch('http://localhost:3001/api/applications', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (!res.ok) {
      console.error('Failed to fetch apps:', res.statusText)
      setErrorMessage('Failed to load applications. Please try again later.')
      setShowErrorDialog(true)
      return
    }
    try {
      const data = await res.json()
      console.log('Response Data:', data)
      if (Array.isArray(data.applications)) {
        const apps = data.applications
        setAvailableApps(apps)
        const matchedIds = apps
          .filter((app: Application) =>
            group.applicationNames.some(
              (name) => name.trim().toLowerCase() === app.name.trim().toLowerCase()
            )
          )
          .map((app: Application) => app._id)
        console.log('Matched App IDs:', matchedIds)
        setSelectedAppIds(matchedIds)
        setStagedAppIds(matchedIds)
        setShowAppAccessDialog(true)
      } else {
        throw new Error('Applications field is not an array')
      }
    } catch (error) {
      console.error('Error parsing apps response:', error)
      setErrorMessage('Failed to load applications.')
      setShowErrorDialog(true)
    }
  }

  const saveAppAccess = async () => {
    if (!selectedGroup) return
    const previouslyAssignedAppIds = selectedAppIds
    const removed = previouslyAssignedAppIds.filter((id) => !stagedAppIds.includes(id))
    if (removed.length > 0) {
      setRemovedAppIds(
        availableApps.filter((app) => removed.includes(app._id)).map((app) => app.name)
      )
      setPendingAppSave(true)
      setShowUnassignConfirmDialog(true)
      return
    }
    setSelectedAppIds(stagedAppIds)
    await performAppAccessSave()
  }

  // App access save
  const performAppAccessSave = async () => {
    if (!selectedGroup) return
    const token = localStorage.getItem('jwt')
    const res = await fetch(`http://localhost:3001/api/user-groups/${selectedGroup._id}/app-access`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ appIds: stagedAppIds }),
    })
    const data = await res.json()
    if (res.ok) {
      setSelectedAppIds(stagedAppIds)
      setShowAppAccessDialog(false)
      setShowUnassignConfirmDialog(false)
      setPendingAppSave(false)
      fetchGroups()
      addNewToast(
        'confirmation',
        'Success',
        data.message || 'App access updated successfully.',
      )
    } else {
      addNewToast(
        'error',
        'Error',
        data.message || 'Failed to update app access.',
      )
    }
  }

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

  // Fetch users in group
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

  const showMoreApps = () => {
    setShowAppAccessDialog(true)
  }

  const filteredGroups = useMemo(() => {
    return (groups || []).filter(group =>
      selectedItem === 'active' ? group.is_active : !group.is_active
    );
  }, [groups, selectedItem]);

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

      <div id="tabbarcontainer" style={{ paddingBottom: '8px' }}>
        <TabBar
          selectedItem={selectedItem}
          onSelectionChange={handleSelectionChange}
        />
        <div class="oj-flex oj-flex-wrap" style={{ gap: '24px', justifyContent: 'flex-start', alignItems: 'stretch', marginTop: '24px', }}>
          {filteredGroups.length === 0 ? (
            <div class="oj-typography-body-sm oj-text-color-secondary" style={{ padding: '12px' }}>
              No {selectedItem === 'active' ? 'active' : 'inactive'} groups found.
            </div>
          ) :
            filteredGroups.map((group) => (
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
                    {group.name === "Admin Group" ? (
                      <div>

                      </div>
                    ) : (
                      <div>
                        <oj-switch value={group.is_active} onvalueChanged={(e) => handleToggleGroupStatus(group._id, e.detail.value as boolean)} />

                      </div>
                    )}
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
                  <div class="oj-flex" style={{ gap: '12px', marginLeft: 'auto' }}>
                    <oj-button chroming="borderless" onojAction={() => openDialog(group)}>
                      Edit
                    </oj-button>
                    {group.name === "Admin Group" ? (
                      <div>
                        <oj-button chroming="borderless" disabled={true} onojAction={() => handleAppAccess(group)}>
                          App Access
                        </oj-button>

                      </div>
                    ) : (
                      <div>
                        <oj-button chroming="borderless" onojAction={() => handleAppAccess(group)}>
                          App Access
                        </oj-button>

                      </div>
                    )}
                    {group.name === "Admin Group" ? (
                      <div>
                        <oj-button chroming="danger" disabled={true} onojAction={() => confirmDeleteGroup(group._id)}>
                          Delete
                        </oj-button>
                      </div>
                    ) : (
                      <div>
                        <oj-button chroming="danger" onojAction={() => confirmDeleteGroup(group._id)}>
                          Delete
                        </oj-button>

                      </div>
                    )}
                  </div>
                  <div class="oj-typography-body-xs oj-text-color-secondary">
                    Created {new Date(group.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {confirmDeleteDialogId && (
        <ConfirmDialog
          title="Confirm Deletion"
          message="Are you sure you want to delete this group?"
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDeleteGroup}
          onCancel={() => setConfirmDeleteDialogId(null)}
        />
      )}

      {showDialog && (
        <oj-dialog
          id="groupDialog"
          dialogTitle={editingGroup ? 'Edit Group' : 'Create Group'}
          initialVisibility="show"
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
              {/* --- REPLACEMENT END --- */}

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
        <ConfirmDialog
          title="Cancel Changes"
          message="Are you sure you want to cancel changes?"
          confirmText="Confirm"
          cancelText="Cancel"
          onConfirm={() => {
            setConfirmCancelDialog(false);
            setShowDialog(false);
          }}
          onCancel={() => setConfirmCancelDialog(false)}
        />
      )}
      {showAppAccessDialog && selectedGroup && (
        <oj-dialog
          id="appAccessDialog"
          dialogTitle={`App Access: ${selectedGroup.name}`}
          initialVisibility="show"
        >
          <div class="oj-dialog-body oj-sm-padding-4x">
            <oj-c-form-layout>
              {availableApps.map((app) => (
                <div key={app._id} style={{ opacity: app.is_active ? 1 : 0.5 }}>
                  <label class="oj-label">
                    <input
                      type="checkbox"
                      checked={stagedAppIds.includes(app._id)}
                      disabled={!app.is_active}
                      onChange={(e) => {
                        const checked = e.currentTarget.checked
                        setStagedAppIds((prev) =>
                          checked ? [...prev, app._id] : prev.filter((id) => id !== app._id)
                        )
                      }}
                    />
                    &nbsp;{app.name}
                  </label>
                  {!app.is_active && (
                    <div class="oj-text-color-danger">
                      This app is inactive and cannot be selected.
                    </div>
                  )}
                </div>
              ))}
            </oj-c-form-layout>
          </div>
          <div class="oj-dialog-footer">
            <oj-button onojAction={saveAppAccess}>Save</oj-button>
            <oj-button onojAction={() => setShowAppAccessDialog(false)} chroming="borderless">
              Cancel
            </oj-button>
          </div>
        </oj-dialog>
      )}

      {showUnassignConfirmDialog && (
        <ConfirmDialog
          title="Confirm Unassignment"
          confirmText="Yes, Unassign"
          cancelText="Cancel"
          confirmType="danger"
          onConfirm={() => performAppAccessSave()}
          onCancel={() => {
            setShowUnassignConfirmDialog(false)
            setPendingAppSave(false)
            setStagedAppIds(selectedAppIds)
          }}
        >
          <p>Are you sure you want to unassign the following app(s):</p>
          <ul class="oj-list">
            {removedAppIds.map((appName) => (
              <li key={appName}>{appName}</li>
            ))}
          </ul>
        </ConfirmDialog>
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

export default UserGroups;