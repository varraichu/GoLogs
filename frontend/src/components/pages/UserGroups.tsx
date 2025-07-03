import { h } from "preact";
import { useEffect, useState, useMemo, useRef} from "preact/hooks";
import 'ojs/ojbutton';
import 'ojs/ojdialog';
import 'oj-c/form-layout';
import 'oj-c/input-text';
import 'ojs/ojlabel';
import 'ojs/ojpopup';
import { userGroupFormSchema } from "../../validation/usergroups.validator";
import 'ojs/ojswitch';

import LengthValidator = require('ojs/ojvalidator-length');
import RegExpValidator = require("ojs/ojvalidator-regexp");
import ArrayDataProvider = require('ojs/ojarraydataprovider');
import MutableArrayDataProvider = require('ojs/ojmutablearraydataprovider');

const MAX_VISIBLE_APPS = 5;

interface User {
  _id: string;
  username: string;
  is_active: boolean;
}

interface Application {
  _id: string;
  name: string;
  is_active: boolean;
}

interface UserGroup {
  _id: string;
  name: string;
  description: string;
  created_at: string;
  is_active: boolean;
  userCount: number;
  applicationCount: number;
  applicationNames: string[];
  users: User[];
}

const UserGroups = (props: { path?: string }) => {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmDeleteDialogId, setConfirmDeleteDialogId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [addEmailInput, setAddEmailInput] = useState("");
  const [addMemberEmailsList, setAddMemberEmailsList] = useState<string[]>([]);
  const [removeEmailInput, setRemoveEmailInput] = useState("");
  const [removeMemberEmailsList, setRemoveMemberEmailsList] = useState<string[]>([]);
  const [directoryResults, setDirectoryResults] = useState<string[]>([]);
  const [activeInput, setActiveInput] = useState<'add' | 'remove' | null>(null);

  const [errors, setErrors] = useState<{ name?: string; description?: string; memberEmails?: string }>({});
  const nameRegex = /^[a-zA-Z0-9 ]+$/;

  const [showAppAccessDialog, setShowAppAccessDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [availableApps, setAvailableApps] = useState<Application[]>([]);
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  const [showUnassignConfirmDialog, setShowUnassignConfirmDialog] = useState(false);
  const [pendingAppSave, setPendingAppSave] = useState(false);
  const [removedAppIds, setRemovedAppIds] = useState<string[]>([]);
  const [stagedAppIds, setStagedAppIds] = useState<string[]>([]);

  const [showUsersDialog, setShowUsersDialog] = useState(false);

  const nameRef = useRef<any>(null);
  const descRef = useRef<any>(null);
  const [assignedAppIds, setAssignedAppIds] = useState<Set<string>>(new Set());
  const [initialAssignedAppIds, setInitialAssignedAppIds] = useState<Set<string>>(new Set());
  const [dataProvider, setDataProvider] = useState<any>(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    const query = activeInput === 'add' ? addEmailInput : removeEmailInput;
    if (query.trim().length > 2) {
      searchDirectory(query);
    } else {
      setDirectoryResults([]);
    }
  }, [addEmailInput, removeEmailInput]);

  const fetchGroups = async () => {
    try {

      const token = localStorage.getItem('jwt');

      const res = await fetch("http://localhost:3001/api/userGroup/", {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      const data = await res.json();
      setGroups(data);
    }
    catch (error) {
      console.error("Failed to fetch user groups", error);
    }
  };

const openDialog = async (group?: UserGroup) => {
  try {
    setErrors({});
    
    // Fetch available apps
    const token = localStorage.getItem('jwt');
    const appsResponse = await fetch("http://localhost:3001/api/applications", {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!appsResponse.ok) throw new Error("Failed to fetch applications");
    const { applications } = await appsResponse.json();
    setAvailableApps(applications);

    if (group) {
      setEditingGroup(group);
      setName(group.name || "");
      setDescription(group.description || "");
      
      // Map application names to IDs
      const matchedIds = applications
        .filter((app: Application) => group.applicationNames?.some(name => 
          name.trim().toLowerCase() === app.name.trim().toLowerCase()
        ))
        .map((app: Application) => app._id);
      
      setAssignedAppIds(new Set(matchedIds));
    } else {
      setEditingGroup(null);
      setName("");
      setDescription("");
      setAssignedAppIds(new Set());
    }
    
    setShowDialog(true);
  } catch (error) {
    console.error('Error opening dialog:', error);
    setErrorMessage(typeof error === "object" && error !== null && "message" in error ? String((error as { message?: string }).message) : "An error occurred");
    setShowErrorDialog(true);
  }
};

const fetchAvailableApps = async () => {
  const token = localStorage.getItem('jwt');
  const res = await fetch("http://localhost:3001/api/applications", {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  setAvailableApps(data.applications || []);
  return data; // Return the data so callers can access .applications
};

const fetchAssignedApps = async (groupId: string) => {
  const token = localStorage.getItem('jwt');
  
  try {
    // 1. First fetch ALL applications
    const appsResponse = await fetch("http://localhost:3001/api/applications", {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!appsResponse.ok) throw new Error("Failed to fetch applications");
    const { applications: allApps = [] } = await appsResponse.json();

    // 2. Fetch the specific group to get its applicationNames
    const groupResponse = await fetch(`http://localhost:3001/api/userGroup/${groupId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!groupResponse.ok) throw new Error("Failed to fetch group details");
    const group = await groupResponse.json();

    // 3. Match applications by name (client-side filtering)
    const assignedIds = allApps
      .filter((app: Application) => 
        group.applicationNames?.some(
          (name: string) => name.trim().toLowerCase() === app.name.trim().toLowerCase()
        )
      )
      .map((app: Application) => app._id);

    setAssignedAppIds(new Set(assignedIds));
    setInitialAssignedAppIds(new Set(assignedIds));
    
  } catch (error) {
    console.error("Error fetching assigned apps:", error);
    // Fallback to empty set
    setAssignedAppIds(new Set());
    setInitialAssignedAppIds(new Set());
  }
};

  const searchDirectory = async (query: string) => {
    const token = localStorage.getItem('jwt');
    const res = await fetch(`http://localhost:3001/api/directory/search?q=${encodeURIComponent(query)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setDirectoryResults(data.emails || []);
  };

  const selectDirectoryResult = (email: string) => {
    if (activeInput === 'add') {
      if (!addMemberEmailsList.includes(email)) {
        setAddMemberEmailsList([...addMemberEmailsList, email]);
      }
      setAddEmailInput("");
    } else if (activeInput === 'remove') {
      if (!removeMemberEmailsList.includes(email)) {
        setRemoveMemberEmailsList([...removeMemberEmailsList, email]);
      }
      setRemoveEmailInput("");
    }
    setDirectoryResults([]);
  };

  const removeEmail = (email: string, type: 'add' | 'remove') => {
    if (type === 'add') {
      setAddMemberEmailsList(addMemberEmailsList.filter(e => e !== email));
    } else {
      setRemoveMemberEmailsList(removeMemberEmailsList.filter(e => e !== email));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!editingGroup && groups.some(g => g.name.toLowerCase() === name.trim().toLowerCase())) {
      newErrors.name = "A group with this name already exists.";
    }

    // if (!editingGroup && addMemberEmailsList.length === 0) {
    //   newErrors.memberEmails = "At least one member email must be added.";
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const saveGroup = async () => {
  if (!validateForm()) return;

  // Check for removed apps if editing
  if (editingGroup) {
    const removed = Array.from(initialAssignedAppIds).filter(
      id => !assignedAppIds.has(id)
    );

    if (removed.length > 0) {
      setRemovedAppIds(
        availableApps.filter(app => removed.includes(app._id)).map(app => app.name)
      );
      setPendingAppSave(true);
      setShowUnassignConfirmDialog(true);
      return;
    }
  }

  // Proceed with save if no apps were removed or not editing
  await performGroupSave();
};

const performGroupSave = async () => {
  const token = localStorage.getItem('jwt');
  const url = editingGroup 
    ? `http://localhost:3001/api/userGroup/${editingGroup._id}`
    : "http://localhost:3001/api/userGroup/";
  const method = editingGroup ? "PATCH" : "POST";

  try {
    // Save group info
    const res = await fetch(url, {
      method,
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, description })
    });

    const data = await res.json();
    const groupId = editingGroup ? editingGroup._id : data._id;
    
    // Assign apps
    if (groupId) {
      await assignApps(groupId);
    }

    setShowDialog(false);
    fetchGroups();
  } catch (error) {
    console.error("Failed to save group", error);
    setErrorMessage("Failed to save group. Please try again.");
    setShowErrorDialog(true);
  }
};

const assignApps = async (groupId: string) => {
  const token = localStorage.getItem('jwt');
  const prevIds = Array.from(initialAssignedAppIds);
  const newIds = Array.from(assignedAppIds);
  

  try {
    // Remove apps that were unassigned
    await Promise.all(
      prevIds
        .filter(id => !newIds.includes(id))
        .map(appId => 
          fetch(`http://localhost:3001/api/userGroup/${groupId}/applications/${appId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          })
        )
    );

    // Add newly assigned apps
    if (newIds.length > 0) {
      await fetch(`http://localhost:3001/api/userGroup/${groupId}/applications`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ appIds: newIds.filter(id => !prevIds.includes(id)) })
      });
    }
  } catch (error) {
    console.error("Failed to assign apps", error);
  }
};

  const confirmDeleteGroup = (groupId: string) => {
    setConfirmDeleteDialogId(groupId);
  };

  const handleDeleteGroup = async () => {
    try {
      if (!confirmDeleteDialogId) return;

      const token = localStorage.getItem('jwt');
      const res = await fetch(`http://localhost:3001/api/userGroup/${confirmDeleteDialogId}`, {
        method: "DELETE",
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        fetchGroups();
      } else {
        const data = await res.json();
        setErrorMessage(data.message || "Failed to delete user group.");
        setShowErrorDialog(true);
      }

      setConfirmDeleteDialogId(null);
    } catch (error) {
      console.error("Failed to delete group", error);
    }
  };

  const handleAppAccess = async (group: UserGroup) => {
    setSelectedGroup(group);

    const token = localStorage.getItem('jwt');
    const res = await fetch("http://localhost:3001/api/applications", {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      console.error("Failed to fetch apps:", res.statusText);
      setErrorMessage("Failed to load applications. Please try again later.");
      setShowErrorDialog(true);
      return;
    }

    try {
      const data = await res.json();
      console.log("Response Data:", data);

      if (Array.isArray(data.applications)) {
        const apps = data.applications;

        setAvailableApps(apps);

        const matchedIds = apps
          .filter((app: Application) =>
            group.applicationNames.some(
              (name: string) => name.trim().toLowerCase() === app.name.trim().toLowerCase()
            )
          )
          .map((app: Application) => app._id);

        console.log("Matched App IDs:", matchedIds);

        setSelectedAppIds(matchedIds);
        setStagedAppIds(matchedIds);
        setShowAppAccessDialog(true);
      } else {
        throw new Error("Applications field is not an array");
      }
    } catch (error) {
      console.error("Error parsing apps response:", error);
      setErrorMessage("Failed to load applications.");
      setShowErrorDialog(true);
    }
  };

  const saveAppAccess = async () => {
    if (!selectedGroup) return;

    const previouslyAssignedAppIds = selectedAppIds;

    const removed = previouslyAssignedAppIds.filter(
      id => !stagedAppIds.includes(id)
    );

    if (removed.length > 0) {
      setRemovedAppIds(
        availableApps.filter(app => removed.includes(app._id)).map(app => app.name)
      );
      setPendingAppSave(true);
      setShowUnassignConfirmDialog(true);
      return;
    }

    setSelectedAppIds(stagedAppIds);
    await performAppAccessSave();
  };


  const performAppAccessSave = async () => {
    if (!selectedGroup) return;

    const token = localStorage.getItem('jwt');
    await fetch(`http://localhost:3001/api/user-groups/${selectedGroup._id}/app-access`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ appIds: stagedAppIds })
    });

    setSelectedAppIds(stagedAppIds);
    setShowAppAccessDialog(false);
    setShowUnassignConfirmDialog(false);
    setPendingAppSave(false);
    fetchGroups();
  };


  const handleToggleGroupStatus = async (groupId: string, isActive: boolean) => {
    const token = localStorage.getItem('jwt');

    try {
      const res = await fetch(`http://localhost:3001/api/userGroup/status/${groupId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: isActive }),
      });

      if (res.ok) {
        fetchGroups();
      } else {
        console.error('Failed to toggle group status');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleUsersClick = async (group: UserGroup) => {
    setSelectedGroup(group);

    const token = localStorage.getItem('jwt');
    if (!token) {
      setErrorMessage("Authentication token is missing.");
      setShowErrorDialog(true);
      return;
    }

    try {
      const res = await fetch(`http://localhost:3001/api/userGroup/${group._id}/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();

        setSelectedGroup((prevGroup) => ({
          ...prevGroup!,
          users: data.users,
        }));
        setShowUsersDialog(true);
      } else {
        const errorData = await res.json();
        setErrorMessage(errorData.message || "Failed to fetch users.");
        setShowErrorDialog(true);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setErrorMessage("An error occurred while fetching users.");
      setShowErrorDialog(true);
    }
  };


  const closeUsersDialog = () => {
    setShowUsersDialog(false);
  };

  const showMoreApps = () => {
    setShowAppAccessDialog(true);
  };

  const handleAssignedAppsChange = (e: CustomEvent) => {
    setStagedAppIds(e.detail.value || []);
  };

  const appsDataProvider = useMemo(() => {
    const appOptions = availableApps.map(app => ({
      value: app._id,
      text: app.name,
      disabled: !app.is_active
    }));
    return new MutableArrayDataProvider(appOptions, { keyAttributes: 'value' });
  }, [availableApps]);

  return (
    <div class="oj-flex oj-sm-padding-4x">
      <div class="oj-flex oj-sm-12 oj-sm-margin-4x oj-sm-justify-content-space-between oj-sm-align-items-center">
        <div>
          <h1 class="oj-typography-heading-lg">User Groups</h1>
          <p class="oj-typography-body-md">Manage your user groups</p>
        </div>
        <div>
          <oj-button onojAction={() => openDialog()} chroming="callToAction">+ Create Group</oj-button>

        </div>
      </div>

      <div class="oj-flex oj-flex-wrap oj-flex-space-" style={"gap: 24px"}>
        {(groups || []).map((group) => (
          <div
            key={group._id}
            class="oj-panel oj-panel-shadow-md"
            style="
              border: 1px solid #e5e7eb; 
              border-radius: 12px; 
              padding: 20px 20px 16px 20px; 
              max-width: 400px; 
              min-width: 400px; 
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            "
          >
            {/* Header: Name + Toggle */}
            <div
              class="oj-flex"
              style="
                align-items: center;
                justify-content: space-between;
                margin-bottom: 8px;
                width: 100%;
              "
            >
              <div style="flex: 1; display: flex; align-items: center;">
                <h3 class="oj-typography-heading-sm" style="margin: 0; flex: 1; word-break: break-word;">
                  {group.name}
                </h3>
                <span
                  class="oj-typography-body-xs"
                  style={`
                    margin-left: 12px;
                    padding: 2px 10px;
                    font-weight: 500;
                    color: ${group.is_active ? '#065f46' : '#991b1b'};
                    font-size: 0.85em;
                  `}
                >
                  {group.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div style="flex: 0;">
                <oj-switch
                  value={group.is_active}
                  onvalueChanged={(e) =>
                    handleToggleGroupStatus(group._id, e.detail.value as boolean)
                  }
                />
              </div>
            </div>

            <p
              class="oj-typography-body-sm oj-text-color-secondary oj-sm-margin-b-2x"
              style="overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;"
            >
              {group.description}
            </p>

            <div
              class="oj-flex"
              style="justify-content: space-between; align-items: stretch; gap: 32px; margin-bottom: 24px;"
            >
              {/* Users column - clickable */}
              <div 
                style="display: flex; flex-direction: column; align-items: flex-start;
                background-color: rgba(243, 243, 243, 0.6); padding: 8px; border-radius: 8px; flex: 1;"
                onClick={() => handleUsersClick(group)}
                class="oj-clickable"
              >
                <div class="oj-typography-body-sm oj-text-color-secondary">Users</div>
                <div class="oj-typography-heading-md">{group.userCount.toLocaleString()}</div>
              </div>
              {/* Apps column */}
              <div style="display: flex; flex-direction: column; align-items: flex-start;
                background-color: rgba(243, 243, 243, 0.6); padding: 8px; border-radius: 8px; flex: 1;">
                <div class="oj-typography-body-sm oj-text-color-secondary">Applications</div>
                <div class="oj-typography-heading-md">{group.applicationCount.toLocaleString()}</div>
              </div>
            </div>

            <div class="oj-sm-margin-b-4x" style="margin-bottom: 12px;">
              <p class="oj-typography-body-sm oj-text-color-secondary" style="margin-bottom: 4px;">Assigned Apps</p>
              <div class="oj-flex oj-sm-flex-wrap" style="margin-top: 0;">
                {group.applicationNames.slice(0, 2).map((app, index) => (
                  <span
                    key={index}
                    class="oj-typography-body-xs"
                    style="color:rgb(25, 85, 160); background-color:rgb(220, 235, 255); padding: 4px 8px; margin: 2px; border-radius: 20px;"
                  >
                    {app}
                  </span>
                ))}
                {group.applicationNames.length > 2 && (
                  <span
                    class="oj-typography-body-xs"
                    style="color:rgb(0, 0, 0); background-color:rgb(243, 243, 243); padding: 4px 8px; margin: 2px; border-radius: 20px;"
                  >
                    +{group.applicationNames.length - 2}
                  </span>
                )}
              </div>
            </div>

              <div class="oj-flex" style="justify-content: flex-end; gap: 12px;">
                <oj-button chroming="borderless" onojAction={() => openDialog(group)}>
                  Edit
                </oj-button>
                <oj-button chroming="borderless" onojAction={() => handleAppAccess(group)}>
                  App Access
                </oj-button>
                <oj-button chroming="danger" onojAction={() => confirmDeleteGroup(group._id)}>
                  Delete
                </oj-button>
              </div>

              {/* Bottom row: left-aligned created at */}
              <div class="oj-typography-body-xs oj-text-color-secondary">
                Created {new Date(group.created_at).toLocaleString()}
              </div>
            </div>

        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      {confirmDeleteDialogId && (
        <oj-dialog id="confirmDeleteDialog" dialogTitle="Confirm Deletion" initialVisibility="show">
          <div class="oj-dialog-body">
            Are you sure you want to delete this group?
          </div>
          <div class="oj-dialog-footer">
            <oj-button onojAction={handleDeleteGroup} chroming="danger">Delete</oj-button>
            <oj-button onojAction={() => setConfirmDeleteDialogId(null)} chroming="borderless">Cancel</oj-button>
          </div>
        </oj-dialog>
      )}

      {/* Users Dialog */}
      {showUsersDialog && selectedGroup && (
        <oj-dialog 
          id="usersDialog" 
          dialogTitle={`Users in ${selectedGroup.name}`} 
          initialVisibility="show"
          onojClose={() => setShowUsersDialog(false)}
        >
          <div class="oj-dialog-body">
            {selectedGroup.users && selectedGroup.users.length > 0 ? (
              <ul>
                {selectedGroup.users.map((user, index) => (
                  <li key={index} class="oj-sm-margin-2x">
                    <span class="oj-typography-body-md">{user.username}</span>
                    <span 
                      class="oj-typography-body-xs"
                      style={`
                        margin-left: 12px;
                        padding: 2px 10px;
                        font-weight: 500;
                      `}
                    >
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p class="oj-typography-body-md">No users found in this group</p>
            )}
          </div>
          <div class="oj-dialog-footer">
            <oj-button onojAction={() => setShowUsersDialog(false)}>Close</oj-button>
          </div>
        </oj-dialog>
      )}

      {/* App Access Dialog */}
      {showAppAccessDialog && selectedGroup && (
        <oj-dialog id="appAccessDialog" dialogTitle={`App Access: ${selectedGroup.name}`} initialVisibility="show">
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
                        const checked = e.currentTarget.checked;
                        setStagedAppIds(prev =>
                          checked ? [...prev, app._id] : prev.filter(id => id !== app._id)
                        );
                      }}
                    />
                    &nbsp;{app.name}
                  </label>
                  {!app.is_active && (
                    <div class="oj-text-color-danger">This app is inactive and cannot be selected.</div>
                  )}
                </div>
              ))}
            </oj-c-form-layout>
          </div>
          <div class="oj-dialog-footer">
            <oj-button onojAction={saveAppAccess}>Save</oj-button>
            <oj-button onojAction={() => setShowAppAccessDialog(false)} chroming="borderless">Cancel</oj-button>
          </div>
        </oj-dialog>
      )}

{showDialog && (
  <oj-dialog
    id="groupDialog"
    dialogTitle={editingGroup ? "Edit Group" : "Create Group"}
    initialVisibility="show"
    onojClose={() => setShowDialog(false)}
  >
    <div class="oj-dialog-body oj-sm-padding-4x">
      <oj-c-form-layout>
        <oj-c-input-text
          label-hint="Name"
          value={name}
          onvalueChanged={(e: CustomEvent) => setName(e.detail.value)}
          placeholder="Enter group name"
          required
          help-hint="Enter 5 to 20 characters. Only letters, numbers, and spaces are allowed."
        ></oj-c-input-text>
        <oj-c-input-text
          label-hint="Description"
          value={description}
          onvalueChanged={(e: CustomEvent) => setDescription(e.detail.value)}
          placeholder="Enter group description"
          help-hint="Administrative users with full access"
        ></oj-c-input-text>
        <div style="margin-top: 16px;">
          <div class="oj-typography-subheading-sm" style="margin-bottom: 8px;">
            Assigned Applications
          </div>
          <div>
            {availableApps.map((app) => (
              <label key={app._id} style={{ display: "block", opacity: app.is_active ? 1 : 0.5 }}>
                <input
                  type="checkbox"
                  checked={assignedAppIds.has(app._id)}
                  disabled={!app.is_active}
                  onChange={(e: Event) => {
                    const checked = (e.target as HTMLInputElement).checked;
                    setAssignedAppIds(prev =>
                      checked
                        ? new Set([...Array.from(prev), app._id])
                        : new Set(Array.from(prev).filter(id => id !== app._id))
                    );
                  }}
                />
                &nbsp;{app.name}
                {!app.is_active && (
                  <span class="oj-text-color-danger" style="margin-left: 8px;">(Inactive)</span>
                )}
              </label>
            ))}
          </div>
        </div>
      </oj-c-form-layout>
    </div>
    <div class="oj-dialog-footer">
      <oj-button onojAction={() => setShowDialog(false)} chroming="borderless">Cancel</oj-button>
      <oj-button onojAction={() => saveGroup()}>Save</oj-button>
    </div>
  </oj-dialog>
)}


      {/* Error Dialog */}
      {showErrorDialog && (
        <oj-dialog id="errorDialog" dialogTitle="Error" initialVisibility="show">
          <div class="oj-dialog-body">
            {errorMessage}
          </div>
          <div class="oj-dialog-footer">
            <oj-button onojAction={() => setShowErrorDialog(false)}>OK</oj-button>
          </div>
        </oj-dialog>
      )}

      {showUnassignConfirmDialog && (
        <oj-dialog id="confirmUnassignDialog" dialogTitle="Confirm Unassignment" initialVisibility="show">
          <div class="oj-dialog-body">
            <p>Are you sure you want to unassign the following app(s):</p>
            <ul class="oj-list">
              {removedAppIds.map(appName => (
                <li key={appName}>{appName}</li>
              ))}
            </ul>
          </div>
          <div class="oj-dialog-footer">
            <oj-button
              onojAction={() => {
                performAppAccessSave();
              }}
              chroming="danger"
            >
              Yes, Unassign
            </oj-button>
            <oj-button
              onojAction={() => {
                setShowUnassignConfirmDialog(false);
                setPendingAppSave(false);
                setStagedAppIds(selectedAppIds);
              }}
              chroming="borderless"
            >
              Cancel
            </oj-button>

          </div>
        </oj-dialog>
      )}
    </div>
  );
};

export default UserGroups;


