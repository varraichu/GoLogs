import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import 'ojs/ojbutton';
import 'ojs/ojdialog';
import 'ojs/ojformlayout';
import 'ojs/ojinputtext';
import 'ojs/ojlabel';
import 'ojs/ojpopup';
import { userGroupFormSchema } from "../../validation/usergroups.validator";

interface Application {
  _id: string;
  name: string;
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

  const openDialog = (group?: UserGroup) => {
    setErrors({});
    if (group) {
      setEditingGroup(group);
      setName(group.name || "");
      setDescription(group.description || "");
    } else {
      setEditingGroup(null);
      setName("");
      setDescription("");
    }
    setAddEmailInput("");
    setAddMemberEmailsList([]);
    setRemoveEmailInput("");
    setRemoveMemberEmailsList([]);
    setDirectoryResults([]);
    setShowDialog(true);
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

    if (name.trim().length < 5 || name.trim().length > 20) {
      newErrors.name = "Name must be between 5 and 20 characters long.";
    } else if (!nameRegex.test(name.trim())) {
      newErrors.name = "Name can only contain letters, numbers and spaces.";
    } else if (!editingGroup && groups.some(g => g.name.toLowerCase() === name.trim().toLowerCase())) {
      newErrors.name = "A group with this name already exists.";
    }

    if (description.trim().length < 10 || description.trim().length > 100) {
      newErrors.description = "Description must be between 10 and 100 characters.";
    }

    if (!editingGroup && addMemberEmailsList.length === 0) {
      newErrors.memberEmails = "At least one member email must be added.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveGroup = async () => {
    if (!validateForm()) return;

    const token = localStorage.getItem('jwt');

    let body: string;
    let url: string;
    let method: 'POST' | 'PATCH';

    if (editingGroup) {
      method = "PATCH";
      url = `http://localhost:3001/api/userGroup/${editingGroup._id}`;
      body = JSON.stringify({
        name,
        description,
        addMemberEmails: addMemberEmailsList,
        removeMemberEmails: removeMemberEmailsList
      });
    } else {
      method = "POST";
      url = "http://localhost:3001/api/userGroup/";
      body = JSON.stringify({
        name,
        description,
        memberEmails: addMemberEmailsList
      });
    }

    const res = await fetch(url, {
      method,
      headers: { 'Authorization': `Bearer ${token}`, "Content-Type": "application/json" },
      body,
    });

    if (res.ok) {
      setShowDialog(false);
      fetchGroups();
    } else {
      const data = await res.json();
      setErrorMessage(data.message || "Failed to save user group.");
      setShowErrorDialog(true);
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

    const apps: Application[] = await res.json();
    setAvailableApps(apps);

    // console.log("Group Names:", group.applicationNames);
    // console.log("App Names:", apps.map(app => app.name));

    const matchedIds = apps
      .filter(app =>
        group.applicationNames.some(
          name => name.trim().toLowerCase() === app.name.trim().toLowerCase()
        )
      )
      .map(app => app._id);

    setSelectedAppIds(matchedIds);
    setStagedAppIds(matchedIds);
    // console.log("Matched app IDs:", matchedIds);
    setShowAppAccessDialog(true);
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

    // Proceed if nothing is being unassigned
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
        fetchGroups(); // Refresh UI
      } else {
        console.error('Failed to toggle group status');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };


  return (
    <div class="oj-flex oj-sm-padding-4x">
      <div class="oj-flex oj-sm-12 oj-sm-margin-4x oj-sm-justify-content-space-between oj-sm-align-items-center">
        <div class="" >
          <h1 class="oj-typography-heading-lg">User Groups</h1>
          <p class="oj-typography-body-md">Manage user groups and their application access</p>
        </div>
        <div>
          <oj-button onojAction={() => openDialog()} chroming="callToAction">+ Create Group</oj-button>
        </div>
      </div>

      <div class="oj-flex oj-sm-flex-wrap oj-sm-justify-content-center oj-sm-padding-4x ">
        {groups.map((group) => (
          <div class="oj-sm-12 oj-md-4 oj-flex-item oj-panel oj-panel-shadow-md oj-sm-margin-4x" style="border: 1px solid #ccc; border-radius: 12px; padding: 24px; min-width: 280px; max-width: 360px; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div class="oj-typography-heading-sm oj-sm-margin-bottom-2x">{group.name}</div>
              <div class="oj-typography-body-sm oj-sm-margin-bottom-2x">{group.description}</div>
              <div class="oj-typography-body-xs oj-sm-margin-bottom">👤 Users: {group.userCount}</div>
              <div class="oj-typography-body-xs oj-sm-margin-bottom">📦 Apps: {group.applicationCount}</div>
            </div>
            <div class="oj-sm-margin-4x">
              {group.applicationNames.map((app) => (
                <span class="oj-badge oj-badge-subtle oj-sm-margin-2x">{app}</span>
              ))}
            </div>
            <div>
              <oj-switch
                value={group.is_active}
                onvalueChanged={(e) =>
                  handleToggleGroupStatus(group._id, e.detail.value as boolean)
                }
                class="oj-sm-margin-end"
              />
            </div>
            <div class="oj-flex oj-sm-justify-content-space-between oj-sm-margin-top-2x">
              <oj-button display="icons" onojAction={() => openDialog(group)} class="oj-sm-margin-end">
                Edit
              </oj-button>
              <oj-button display="icons" chroming="danger" onojAction={() => confirmDeleteGroup(group._id)}>
                Delete
              </oj-button>
            </div>
          </div>
        ))}
      </div>

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

      {showDialog && (
        <oj-dialog id="groupDialog" dialogTitle={editingGroup ? "Edit Group" : "Create Group"} initialVisibility="show">
          <div class="oj-dialog-body">
            <oj-form-layout>
              <oj-input-text id="name-input" labelHint="Name" value={name} onvalueChanged={(e) => setName(e.detail.value)}></oj-input-text>
              {errors.name && <div class="oj-text-color-danger oj-sm-margin-bottom">{errors.name}</div>}
              <oj-input-text labelHint="Description" value={description} onvalueChanged={(e) => setDescription(e.detail.value)}></oj-input-text>
              {errors.description && <div class="oj-text-color-danger oj-sm-margin-bottom">{errors.description}</div>}

              <oj-input-text labelHint="Add Member Email" value={addEmailInput} onFocus={() => setActiveInput('add')} onvalueChanged={(e) => setAddEmailInput(e.detail.value)}></oj-input-text>
              {errors.memberEmails && <div class="oj-text-color-danger oj-sm-margin-bottom">{errors.memberEmails}</div>}

              <div class="oj-sm-margin-top">
                {addMemberEmailsList.map(email => (
                  <div class="oj-flex oj-sm-align-items-center oj-sm-margin-bottom">
                    <span class="oj-typography-body-sm oj-sm-margin-end">{email}</span>
                    <oj-button display="icons" chroming="borderless" onojAction={() => removeEmail(email, 'add')}>
                      <span class="oj-ux-email-expenses-ico-cancel-s-20-danger">X</span>
                    </oj-button>
                  </div>
                ))}
              </div>

              {editingGroup && (
                <>
                  <oj-input-text labelHint="Remove Member Email" value={removeEmailInput} onFocus={() => setActiveInput('remove')} onvalueChanged={(e) => setRemoveEmailInput(e.detail.value)}></oj-input-text>

                  <div class="oj-sm-margin-top">
                    {removeMemberEmailsList.map(email => (
                      <div class="oj-flex oj-sm-align-items-center oj-sm-margin-bottom">
                        <span class="oj-typography-body-sm oj-sm-margin-end">{email}</span>
                        <oj-button display="icons" chroming="borderless" onojAction={() => removeEmail(email, 'remove')}>
                          <span class="oj-ux-ico-close oj-sm-icon"></span>
                        </oj-button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {directoryResults.length > 0 && (
                <div class="oj-popup">
                  {directoryResults.map(email => (
                    <div class="oj-flex oj-sm-align-items-center oj-sm-padding-2x oj-sm-hoverable oj-clickable" onClick={() => selectDirectoryResult(email)}>
                      {email}
                    </div>
                  ))}
                </div>
              )}
            </oj-form-layout>
          </div>
          <div class="oj-dialog-footer">
            <oj-button onojAction={() => saveGroup()}>Save</oj-button>
            <oj-button onojAction={() => setShowDialog(false)} chroming="borderless">Cancel</oj-button>
          </div>
        </oj-dialog>
      )}

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
      {showAppAccessDialog && selectedGroup && (
        <oj-dialog id="appAccessDialog" dialogTitle={`App Access: ${selectedGroup.name}`} initialVisibility="show">
          <div class="oj-dialog-body oj-sm-padding-4x">
            <oj-form-layout>
              {availableApps.map((app) => (
                <div key={app._id}>
                  <label class="oj-label">
                    <input
                      type="checkbox"
                      checked={stagedAppIds.includes(app._id)}
                      onChange={(e) => {
                        const checked = e.currentTarget.checked;
                        setStagedAppIds((prev) =>
                          checked ? [...prev, app._id] : prev.filter((id) => id !== app._id)
                        );
                      }}
                    />

                    &nbsp;{app.name}
                  </label>
                </div>
              ))}
            </oj-form-layout>
          </div>
          <div class="oj-dialog-footer">
            <oj-button onojAction={saveAppAccess}>Save</oj-button>
            <oj-button onojAction={() => setShowAppAccessDialog(false)} chroming="borderless">Cancel</oj-button>
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
                setStagedAppIds(selectedAppIds); // ← REVERT UI state
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
