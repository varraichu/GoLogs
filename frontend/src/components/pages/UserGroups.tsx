// import { h } from "preact";
// import { useEffect, useState } from "preact/hooks";
// import 'ojs/ojbutton';
// import 'ojs/ojdialog';
// import 'oj-c/form-layout';
// import 'oj-c/input-text';
// import 'ojs/ojlabel';
// import 'ojs/ojpopup';
// import { userGroupFormSchema } from "../../validation/usergroups.validator";
// import 'ojs/ojswitch';

// import LengthValidator = require('ojs/ojvalidator-length');
// import RegExpValidator = require("ojs/ojvalidator-regexp");

// const MAX_VISIBLE_APPS = 5;

// interface User {
//   _id: string;
//   username: string;
//   is_active: boolean;
// }

// interface Application {
//   _id: string;
//   name: string;
//   is_active: boolean;
// }

// interface UserGroup {
//   _id: string;
//   name: string;
//   description: string;
//   created_at: string;
//   is_active: boolean;
//   userCount: number;
//   applicationCount: number;
//   applicationNames: string[];
//   users: User[];
// }

// const UserGroups = (props: { path?: string }) => {
//   const [groups, setGroups] = useState<UserGroup[]>([]);
//   const [showDialog, setShowDialog] = useState(false);
//   const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
//   const [showErrorDialog, setShowErrorDialog] = useState(false);
//   const [errorMessage, setErrorMessage] = useState("");
//   const [confirmDeleteDialogId, setConfirmDeleteDialogId] = useState<string | null>(null);

//   const [name, setName] = useState("");
//   const [description, setDescription] = useState("");

//   const [addEmailInput, setAddEmailInput] = useState("");
//   const [addMemberEmailsList, setAddMemberEmailsList] = useState<string[]>([]);
//   const [removeEmailInput, setRemoveEmailInput] = useState("");
//   const [removeMemberEmailsList, setRemoveMemberEmailsList] = useState<string[]>([]);
//   const [directoryResults, setDirectoryResults] = useState<string[]>([]);
//   const [activeInput, setActiveInput] = useState<'add' | 'remove' | null>(null);

//   const [errors, setErrors] = useState<{ name?: string; description?: string; memberEmails?: string }>({});
//   const nameRegex = /^[a-zA-Z0-9 ]+$/;

//   const [showAppAccessDialog, setShowAppAccessDialog] = useState(false);
//   const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
//   const [availableApps, setAvailableApps] = useState<Application[]>([]);
//   const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
//   const [showUnassignConfirmDialog, setShowUnassignConfirmDialog] = useState(false);
//   const [pendingAppSave, setPendingAppSave] = useState(false);
//   const [removedAppIds, setRemovedAppIds] = useState<string[]>([]);
//   const [stagedAppIds, setStagedAppIds] = useState<string[]>([]);

//   const [showUsersDialog, setShowUsersDialog] = useState(false);

//   useEffect(() => {
//     fetchGroups();
//   }, []);

//   useEffect(() => {
//     const query = activeInput === 'add' ? addEmailInput : removeEmailInput;
//     if (query.trim().length > 2) {
//       searchDirectory(query);
//     } else {
//       setDirectoryResults([]);
//     }
//   }, [addEmailInput, removeEmailInput]);

//   const fetchGroups = async () => {
//     try {

//       const token = localStorage.getItem('jwt');

//       const res = await fetch("http://localhost:3001/api/userGroup/", {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         }
//       });
//       const data = await res.json();
//       setGroups(data);
//     }
//     catch (error) {
//       console.error("Failed to fetch user groups", error);
//     }
//   };

//   const openDialog = (group?: UserGroup) => {
//     setErrors({});
//     if (group) {
//       setEditingGroup(group);
//       setName(group.name || "");
//       setDescription(group.description || "");
//     } else {
//       setEditingGroup(null);
//       setName("");
//       setDescription("");
//     }
//     setAddEmailInput("");
//     setAddMemberEmailsList([]);
//     setRemoveEmailInput("");
//     setRemoveMemberEmailsList([]);
//     setDirectoryResults([]);
//     setShowDialog(true);
//   };

//   const searchDirectory = async (query: string) => {
//     const token = localStorage.getItem('jwt');
//     const res = await fetch(`http://localhost:3001/api/directory/search?q=${encodeURIComponent(query)}`, {
//       headers: { 'Authorization': `Bearer ${token}` }
//     });
//     const data = await res.json();
//     setDirectoryResults(data.emails || []);
//   };

//   const selectDirectoryResult = (email: string) => {
//     if (activeInput === 'add') {
//       if (!addMemberEmailsList.includes(email)) {
//         setAddMemberEmailsList([...addMemberEmailsList, email]);
//       }
//       setAddEmailInput("");
//     } else if (activeInput === 'remove') {
//       if (!removeMemberEmailsList.includes(email)) {
//         setRemoveMemberEmailsList([...removeMemberEmailsList, email]);
//       }
//       setRemoveEmailInput("");
//     }
//     setDirectoryResults([]);
//   };

//   const removeEmail = (email: string, type: 'add' | 'remove') => {
//     if (type === 'add') {
//       setAddMemberEmailsList(addMemberEmailsList.filter(e => e !== email));
//     } else {
//       setRemoveMemberEmailsList(removeMemberEmailsList.filter(e => e !== email));
//     }
//   };

//   const validateForm = (): boolean => {
//     const newErrors: typeof errors = {};

//     if (!editingGroup && groups.some(g => g.name.toLowerCase() === name.trim().toLowerCase())) {
//       newErrors.name = "A group with this name already exists.";
//     }

//     if (!editingGroup && addMemberEmailsList.length === 0) {
//       newErrors.memberEmails = "At least one member email must be added.";
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const saveGroup = async () => {
//     if (!validateForm()) return;

//     const token = localStorage.getItem('jwt');

//     let body: string;
//     let url: string;
//     let method: 'POST' | 'PATCH';

//     if (editingGroup) {
//       method = "PATCH";
//       url = `http://localhost:3001/api/userGroup/${editingGroup._id}`;
//       body = JSON.stringify({
//         name,
//         description,
//         addMemberEmails: addMemberEmailsList,
//         removeMemberEmails: removeMemberEmailsList
//       });
//     } else {
//       method = "POST";
//       url = "http://localhost:3001/api/userGroup/";
//       body = JSON.stringify({
//         name,
//         description,
//         memberEmails: addMemberEmailsList
//       });
//     }

//     const res = await fetch(url, {
//       method,
//       headers: { 'Authorization': `Bearer ${token}`, "Content-Type": "application/json" },
//       body,
//     });

//     if (res.ok) {
//       setShowDialog(false);
//       fetchGroups();
//     } else {
//       const data = await res.json();
//       setErrorMessage(data.message || "Failed to save user group.");
//       setShowErrorDialog(true);
//     }
//   };

//   const confirmDeleteGroup = (groupId: string) => {
//     setConfirmDeleteDialogId(groupId);
//   };

//   const handleDeleteGroup = async () => {
//     try {
//       if (!confirmDeleteDialogId) return;

//       const token = localStorage.getItem('jwt');
//       const res = await fetch(`http://localhost:3001/api/userGroup/${confirmDeleteDialogId}`, {
//         method: "DELETE",
//         headers: { 'Authorization': `Bearer ${token}` },
//       });

//       if (res.ok) {
//         fetchGroups();
//       } else {
//         const data = await res.json();
//         setErrorMessage(data.message || "Failed to delete user group.");
//         setShowErrorDialog(true);
//       }

//       setConfirmDeleteDialogId(null);
//     } catch (error) {
//       console.error("Failed to delete group", error);
//     }
//   };

//   const handleAppAccess = async (group: UserGroup) => {
//     setSelectedGroup(group);

//     const token = localStorage.getItem('jwt');
//     const res = await fetch("http://localhost:3001/api/applications", {
//       method: 'GET',
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     if (!res.ok) {
//       console.error("Failed to fetch apps:", res.statusText);
//       setErrorMessage("Failed to load applications. Please try again later.");
//       setShowErrorDialog(true);
//       return;
//     }

//     try {
//       const data = await res.json();
//       console.log("Response Data:", data);

//       if (Array.isArray(data.applications)) {
//         const apps = data.applications;

//         setAvailableApps(apps);

//         const matchedIds = apps
//           .filter((app: Application) =>
//             group.applicationNames.some(
//               name => name.trim().toLowerCase() === app.name.trim().toLowerCase()
//             )
//           )
//           .map((app: Application) => app._id);

//         console.log("Matched App IDs:", matchedIds);

//         setSelectedAppIds(matchedIds);
//         setStagedAppIds(matchedIds);
//         setShowAppAccessDialog(true);
//       } else {
//         throw new Error("Applications field is not an array");
//       }
//     } catch (error) {
//       console.error("Error parsing apps response:", error);
//       setErrorMessage("Failed to load applications.");
//       setShowErrorDialog(true);
//     }
//   };

//   const saveAppAccess = async () => {
//     if (!selectedGroup) return;

//     const previouslyAssignedAppIds = selectedAppIds;

//     const removed = previouslyAssignedAppIds.filter(
//       id => !stagedAppIds.includes(id)
//     );

//     if (removed.length > 0) {
//       setRemovedAppIds(
//         availableApps.filter(app => removed.includes(app._id)).map(app => app.name)
//       );
//       setPendingAppSave(true);
//       setShowUnassignConfirmDialog(true);
//       return;
//     }

//     setSelectedAppIds(stagedAppIds);
//     await performAppAccessSave();
//   };


//   const performAppAccessSave = async () => {
//     if (!selectedGroup) return;

//     const token = localStorage.getItem('jwt');
//     await fetch(`http://localhost:3001/api/user-groups/${selectedGroup._id}/app-access`, {
//       method: 'PATCH',
//       headers: {
//         'Authorization': `Bearer ${token}`,
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({ appIds: stagedAppIds })
//     });

//     setSelectedAppIds(stagedAppIds);
//     setShowAppAccessDialog(false);
//     setShowUnassignConfirmDialog(false);
//     setPendingAppSave(false);
//     fetchGroups();
//   };


//   const handleToggleGroupStatus = async (groupId: string, isActive: boolean) => {
//     const token = localStorage.getItem('jwt');

//     try {
//       const res = await fetch(`http://localhost:3001/api/userGroup/status/${groupId}`, {
//         method: 'PATCH',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ is_active: isActive }),
//       });

//       if (res.ok) {
//         fetchGroups();
//       } else {
//         console.error('Failed to toggle group status');
//       }
//     } catch (error) {
//       console.error('Error toggling status:', error);
//     }
//   };

//   const handleUsersClick = async (group: UserGroup) => {
//     setSelectedGroup(group);

//     const token = localStorage.getItem('jwt');
//     if (!token) {
//       setErrorMessage("Authentication token is missing.");
//       setShowErrorDialog(true);
//       return;
//     }

//     try {
//       const res = await fetch(`http://localhost:3001/api/userGroup/${group._id}/users`, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });

//       if (res.ok) {
//         const data = await res.json();

//         setSelectedGroup((prevGroup) => ({
//           ...prevGroup!,
//           users: data.users,
//         }));
//         setShowUsersDialog(true);
//       } else {
//         const errorData = await res.json();
//         setErrorMessage(errorData.message || "Failed to fetch users.");
//         setShowErrorDialog(true);
//       }
//     } catch (error) {
//       console.error("Error fetching users:", error);
//       setErrorMessage("An error occurred while fetching users.");
//       setShowErrorDialog(true);
//     }
//   };


//   const closeUsersDialog = () => {
//     setShowUsersDialog(false);
//   };

//   const showMoreApps = () => {
//     setShowAppAccessDialog(true);
//   };

//   return (
//     <div class="oj-flex oj-sm-padding-4x">
//       <div class="oj-flex oj-sm-12 oj-sm-margin-4x oj-sm-justify-content-space-between oj-sm-align-items-center">
//         <div class="" >
//           <h1 class="oj-typography-heading-lg">User Groups</h1>
//           <p class="oj-typography-body-md">Manage user groups and their application access</p>
//         </div>
//         <div>
//           <oj-button onojAction={() => openDialog()} chroming="callToAction">+ Create Group</oj-button>
//         </div>
//       </div>

//       <div class="oj-flex oj-sm-flex-wrap oj-sm-justify-content-center oj-sm-padding-4x ">
//         {groups.map((group) => (
//           <div class="oj-sm-12 oj-md-4 oj-flex-item oj-panel oj-panel-shadow-md oj-sm-margin-4x"
//             style="border: 1px solid #ccc; border-radius: 12px; padding: 24px; min-width: 280px; max-width: 360px; display: flex; flex-direction: column; justify-content: space-between;">


//             <div class="oj-flex oj-sm-justify-content-space-between oj-sm-align-items-start oj-sm-margin-bottom-4x">
//               <div>
//                 <div class="oj-typography-heading-sm oj-sm-margin-bottom-2x">{group.name}</div>
//                 <div class="oj-typography-body-sm oj-sm-margin-bottom">{group.description}</div>
//               </div>
//               <oj-switch
//                 value={group.is_active}
//                 onvalueChanged={(e) =>
//                   handleToggleGroupStatus(group._id, e.detail.value as boolean)
//                 }
//               />
//             </div>

//             <div style="margin-top: 16px;">

//               <div class="oj-typography-body-sm oj-sm-margin-bottom">
//                 <span class="oj-link" style={{ cursor: "pointer" }} onClick={() => handleUsersClick(group)}>
//                   👤 Users: {group.userCount}
//                 </span>
//               </div>

//               <div style="margin-top: 8px;">
//                 <div class="oj-typography-body-sm oj-sm-margin-bottom-2x">
//                   📦 Apps: {group.applicationCount > MAX_VISIBLE_APPS ? `${MAX_VISIBLE_APPS}+` : group.applicationCount}
//                   {group.applicationCount > MAX_VISIBLE_APPS && (
//                     <oj-button onojAction={showMoreApps} chroming="borderless">Show all apps</oj-button>
//                   )}
//                 </div>
//               </div>

//               <div style="margin-top: 16px;">
//                 <div class="oj-typography-body-sm oj-sm-margin-bottom-2x" style="font-weight: 100;">
//                   APPLICATIONS
//                 </div>

//                 {group.applicationNames.length === 0 ? (
//                   <div class="oj-typography-body-sm oj-text-color-secondary">None</div>
//                 ) : (
//                   <div style="margin-bottom: 16px;">
//                     {group.applicationNames.slice(0, MAX_VISIBLE_APPS).map((app, idx) => (
//                       <div key={idx} class="oj-badge oj-badge-subtle oj-sm-margin-2x">
//                         {app}
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>

//             </div>
//             <div style="margin-top: 16px;" class="oj-flex oj-sm-justify-content-space-between">
//               <oj-button display="icons" onojAction={() => openDialog(group)} class="oj-sm-margin-end">Edit</oj-button>
//               <oj-button display="icons" class="oj-sm-margin-end" onojAction={() => handleAppAccess(group)}>App Access</oj-button>
//               <oj-button display="icons" chroming="danger" onojAction={() => confirmDeleteGroup(group._id)}>Delete</oj-button>
//             </div>
//           </div>
//         ))}
//       </div>

//       {confirmDeleteDialogId && (
//         <oj-dialog id="confirmDeleteDialog" dialogTitle="Confirm Deletion" initialVisibility="show">
//           <div class="oj-dialog-body">
//             Are you sure you want to delete this group?
//           </div>
//           <div class="oj-dialog-footer">
//             <oj-button onojAction={handleDeleteGroup} chroming="danger">Delete</oj-button>
//             <oj-button onojAction={() => setConfirmDeleteDialogId(null)} chroming="borderless">Cancel</oj-button>
//           </div>
//         </oj-dialog>
//       )}

//       {showDialog && (
//         <oj-dialog id="groupDialog" dialogTitle={editingGroup ? "Edit Group" : "Create Group"} initialVisibility="show">
//           <div class="oj-dialog-body">
//             <oj-c-form-layout>
//               <oj-c-input-text
//                 id="name-input"
//                 labelHint="Name"
//                 value={name}
//                 onvalueChanged={(e) => setName(e.detail.value)}
//                 required
//                 validators={[
//                   new LengthValidator({ min: 5, max: 20 }),
//                   new RegExpValidator({
//                     pattern: '^[a-zA-Z0-9 _-]+$',
//                     hint: 'Only letters, numbers, spaces, hyphens (-), and underscores (_) are allowed.',
//                     messageSummary: 'Invalid name format.',
//                     messageDetail: 'Use only letters, numbers, spaces, hyphens (-), and underscores (_).'
//                   })
//                 ]}
//               ></oj-c-input-text>
//               <oj-c-input-text
//                 labelHint="Description"
//                 value={description}
//                 onvalueChanged={(e) => setDescription(e.detail.value)}
//                 required
//                 validators={[
//                   new LengthValidator({ min: 10, max: 100 }),
//                   new RegExpValidator({
//                     pattern: '^[a-zA-Z0-9 _-]+$',
//                     hint: 'Only letters, numbers, spaces, hyphens (-), and underscores (_) are allowed.',
//                     messageSummary: 'Invalid name format.',
//                     messageDetail: 'Use only letters, numbers, spaces, hyphens (-), and underscores (_).'
//                   })
//                 ]}
//               ></oj-c-input-text>

//               <oj-c-input-text labelHint="Add Member Email" value={addEmailInput} onFocus={() => setActiveInput('add')} onvalueChanged={(e) => setAddEmailInput(e.detail.value)}></oj-c-input-text>
//               {errors.memberEmails && <div class="oj-text-color-danger oj-sm-margin-bottom">{errors.memberEmails}</div>}

//               <div class="oj-sm-margin-top">
//                 {addMemberEmailsList.map(email => (
//                   <div class="oj-flex oj-sm-align-items-center oj-sm-margin-bottom">
//                     <span class="oj-typography-body-sm oj-sm-margin-end">{email}</span>
//                     <oj-button display="icons" chroming="borderless" onojAction={() => removeEmail(email, 'add')}>
//                       <span class="oj-ux-email-expenses-ico-cancel-s-20-danger">X</span>
//                     </oj-button>
//                   </div>
//                 ))}
//               </div>

//               {editingGroup && (
//                 <>
//                   <oj-c-input-text labelHint="Remove Member Email" value={removeEmailInput} onFocus={() => setActiveInput('remove')} onvalueChanged={(e) => setRemoveEmailInput(e.detail.value)}></oj-c-input-text>
//                   <div class="oj-sm-margin-top">
//                     {removeMemberEmailsList.map(email => (
//                       <div class="oj-flex oj-sm-align-items-center oj-sm-margin-bottom">
//                         <span class="oj-typography-body-sm oj-sm-margin-end">{email}</span>
//                         <oj-button display="icons" chroming="borderless" onojAction={() => removeEmail(email, 'remove')}>
//                           <span class="oj-ux-ico-close oj-sm-icon"></span>
//                         </oj-button>
//                       </div>
//                     ))}
//                   </div>
//                 </>
//               )}

//               {directoryResults.length > 0 && (
//                 <div class="oj-popup">
//                   {directoryResults.map(email => (
//                     <div class="oj-flex oj-sm-align-items-center oj-sm-padding-2x oj-sm-hoverable oj-clickable" onClick={() => selectDirectoryResult(email)}>
//                       {email}
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </oj-c-form-layout>
//           </div>
//           <div class="oj-dialog-footer">
//             <oj-button onojAction={() => saveGroup()}>Save</oj-button>
//             <oj-button onojAction={() => setShowDialog(false)} chroming="borderless">Cancel</oj-button>
//           </div>
//         </oj-dialog>
//       )}

//       {showErrorDialog && (
//         <oj-dialog id="errorDialog" dialogTitle="Error" initialVisibility="show">
//           <div class="oj-dialog-body">
//             {errorMessage}
//           </div>
//           <div class="oj-dialog-footer">
//             <oj-button onojAction={() => setShowErrorDialog(false)}>OK</oj-button>
//           </div>
//         </oj-dialog>
//       )}

//       {showAppAccessDialog && selectedGroup && (
//         <oj-dialog id="appAccessDialog" dialogTitle={`App Access: ${selectedGroup.name}`} initialVisibility="show">
//           <div class="oj-dialog-body oj-sm-padding-4x">
//             <oj-c-form-layout>
//               {availableApps.map((app) => (
//                 <div key={app._id} style={{ opacity: app.is_active ? 1 : 0.5 }}>
//                   <label class="oj-label">
//                     <input
//                       type="checkbox"
//                       checked={stagedAppIds.includes(app._id)}
//                       disabled={!app.is_active}
//                       onChange={(e) => {
//                         const checked = e.currentTarget.checked;
//                         setStagedAppIds((prev) =>
//                           checked ? [...prev, app._id] : prev.filter((id) => id !== app._id)
//                         );
//                       }}
//                     />

//                     &nbsp;{app.name}
//                   </label>
//                   {!app.is_active && (
//                     <div class="oj-text-color-danger">This app is inactive and cannot be selected.</div>
//                   )}
//                 </div>
//               ))}
//             </oj-c-form-layout>
//           </div>
//           <div class="oj-dialog-footer">
//             <oj-button onojAction={saveAppAccess}>Save</oj-button>
//             <oj-button onojAction={() => setShowAppAccessDialog(false)} chroming="borderless">Cancel</oj-button>
//           </div>
//         </oj-dialog>
//       )}

//       {showUnassignConfirmDialog && (
//         <oj-dialog id="confirmUnassignDialog" dialogTitle="Confirm Unassignment" initialVisibility="show">
//           <div class="oj-dialog-body">
//             <p>Are you sure you want to unassign the following app(s):</p>
//             <ul class="oj-list">
//               {removedAppIds.map(appName => (
//                 <li key={appName}>{appName}</li>
//               ))}
//             </ul>
//           </div>
//           <div class="oj-dialog-footer">
//             <oj-button
//               onojAction={() => {
//                 performAppAccessSave();
//               }}
//               chroming="danger"
//             >
//               Yes, Unassign
//             </oj-button>
//             <oj-button
//               onojAction={() => {
//                 setShowUnassignConfirmDialog(false);
//                 setPendingAppSave(false);
//                 setStagedAppIds(selectedAppIds);
//               }}
//               chroming="borderless"
//             >
//               Cancel
//             </oj-button>

//           </div>
//         </oj-dialog>
//       )}

//       {showUsersDialog && selectedGroup && (
//         <oj-dialog id="usersDialog" dialogTitle={`Users in ${selectedGroup.name}`} initialVisibility="show">
//           <div class="oj-dialog-body">
//             <ul>
//               {selectedGroup.users?.map((user, idx) => (
//                 <li key={idx}>
//                   {user.username}
//                 </li>
//               ))}
//             </ul>
//           </div>
//           <div class="oj-dialog-footer">
//             <oj-button onojAction={closeUsersDialog}>Close</oj-button>
//           </div>
//         </oj-dialog>
//       )}
//     </div>
//   );
// };

// export default UserGroups;


import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
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

    if (!editingGroup && groups.some(g => g.name.toLowerCase() === name.trim().toLowerCase())) {
      newErrors.name = "A group with this name already exists.";
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
              name => name.trim().toLowerCase() === app.name.trim().toLowerCase()
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

  // return (
  //   <div class="oj-flex oj-sm-padding-4x">
  //     <div class="oj-flex oj-sm-12 oj-sm-margin-4x oj-sm-justify-content-space-between oj-sm-align-items-center">
  //       <div>
  //         <h1 class="oj-typography-heading-lg">User Groups</h1>
  //         <p class="oj-typography-body-md">Manage user groups and their application access</p>
  //       </div>
  //       <div>
  //         <oj-button onojAction={() => openDialog()} chroming="callToAction">+ Create Group</oj-button>
  //       </div>
  //     </div>

  //     <div class="oj-flex oj-sm-flex-wrap oj-sm-justify-content-center oj-sm-padding-4x">
  //       {groups.map((group) => (
  //         <div key={group._id} class="oj-panel oj-panel-shadow-md" style={{
  //           border: '1px solid #e5e7eb',
  //           borderRadius: '12px',
  //           padding: '20px 20px 16px 20px',
  //           maxWidth: '420px',
  //           minWidth: '420px',
  //           flex: '1 1 400px',
  //           display: 'flex',
  //           flexDirection: 'column',
  //           justifyContent: 'space-between'
  //         }}>
  //           {/* Header: Name + Toggle */}
  //           <div class="oj-flex" style={{
  //             alignItems: 'center',
  //             justifyContent: 'space-between',
  //             marginBottom: '8px',
  //             width: '100%'
  //           }}>
  //             <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
  //               <h3 class="oj-typography-heading-sm" style={{
  //                 margin: 0,
  //                 flex: 1,
  //                 wordBreak: 'break-word'
  //               }}>
  //                 {group.name}
  //               </h3>
  //               <span class="oj-typography-body-xs" style={{
  //                 marginLeft: '12px',
  //                 padding: '2px 10px',
  //                 fontWeight: '500',
  //                 color: group.is_active ? '#065f46' : '#991b1b',
  //                 fontSize: '0.85em'
  //               }}>
  //                 {group.is_active ? 'Active' : 'Inactive'}
  //               </span>
  //             </div>
  //             <div style={{ flex: 0 }}>
  //               <oj-switch
  //                 value={group.is_active}
  //                 onvalueChanged={(e) =>
  //                   handleToggleGroupStatus(group._id, e.detail.value as boolean)}
  //               />
  //             </div>
  //           </div>

  //           {/* Description */}
  //           <p class="oj-typography-body-sm oj-text-color-secondary oj-sm-margin-b-2x" style={{
  //             overflow: 'hidden',
  //             display: '-webkit-box',
  //             WebkitLineClamp: 2,
  //             WebkitBoxOrient: 'vertical'
  //           }}>
  //             {group.description}
  //           </p>

  //           {/* Users and Apps */}
  //           <div class="oj-flex" style={{
  //             justifyContent: 'space-between',
  //             alignItems: 'stretch',
  //             gap: '32px',
  //             marginBottom: '24px'
  //           }}>
  //             {/* Users */}
  //             <div style={{
  //               display: 'flex',
  //               flexDirection: 'column',
  //               alignItems: 'flex-start',
  //               backgroundColor: 'rgba(243, 243, 243, 0.6)',
  //               padding: '8px',
  //               borderRadius: '8px',
  //               flex: 1
  //             }}>
  //               <div class="oj-typography-body-sm oj-text-color-secondary">Users</div>
  //               <div class="oj-typography-heading-md">
  //               <span
  //                 class="oj-link"
  //                 style={{ cursor: 'pointer' }}
  //                 onClick={() => handleUsersClick(group)}
  //               >
  //                 {group.userCount.toLocaleString()}
  //               </span>
  //             </div>
  //             </div>
  //             {/* Applications */}
  //             <div style={{
  //               display: 'flex',
  //               flexDirection: 'column',
  //               alignItems: 'flex-start',
  //               backgroundColor: 'rgba(243, 243, 243, 0.6)',
  //               padding: '8px',
  //               borderRadius: '8px',
  //               flex: 1
  //             }}>
  //               <div class="oj-typography-body-sm oj-text-color-secondary">Applicationss</div>
  //               <div class="oj-typography-heading-md">{group.applicationCount.toLocaleString()}</div>
  //             </div>
              
  //           </div>

  //             {/* Assigned Applications */}
  //         <div style={{ marginTop: '16px' }}>
  //           <div class="oj-typography-subheading-sm" style={{ marginBottom: '8px' }}>
  //             Assigned Applications
  //           </div>
  //           <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
  //             {group.applicationNames.length === 0 ? (
  //               <div class="oj-typography-body-sm oj-text-color-secondary">None</div>
  //             ) : (
  //               group.applicationNames.slice(0, 3).map((app, idx) => (
  //                 <div
  //                   key={idx}
  //                   class="oj-badge oj-badge-subtle oj-sm-margin-2x"
  //                   style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '16px', backgroundColor: 'rgb(220, 235, 255)' }}
  //                 >
  //                   {app}
  //                 </div>
  //               ))
  //             )}
  //           </div>
  //         </div>

  //           {/* Footer: Buttons */}
  //           <div class="oj-flex" style={{
  //             justifyContent: 'space-between',
  //             alignItems: 'center',
  //             gap: '12px',
  //             marginTop: 'auto'
  //           }}>
              
  //             <div class="oj-flex" style={{ gap: '12px' }}>
  //               <oj-button chroming="borderless" onojAction={() => openDialog(group)}>
  //                 Edit
  //               </oj-button>
  //               <oj-button chroming="borderless" onojAction={() => handleAppAccess(group)}>
  //                 App Access
  //               </oj-button>
  //               <oj-button chroming="danger" onojAction={() => confirmDeleteGroup(group._id)}>
  //                 Delete
  //               </oj-button>
  //             </div>
  //             <div class="oj-typography-body-xs oj-text-color-secondary">
  //               Created {new Date(group.created_at).toLocaleString()}
  //             </div>
              

  //           </div>
  //         </div>
  //       ))}
  //     </div>
    
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

          {/* Assigned Applications */}
          {/* <div style={{ marginTop: '16px' }}>
            <div class="oj-typography-subheading-sm" style={{ marginBottom: '8px' }}>
              Assigned Applications
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {group.applicationNames.length === 0 ? (
                <div class="oj-typography-body-sm oj-text-color-secondary">None</div>
              ) : (
                group.applicationNames.slice(0, 3).map((app, idx) => (
                  <div
                    key={idx}
                    class="oj-badge oj-badge-subtle oj-sm-margin-2x"
                    style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '16px', backgroundColor: 'rgb(220, 235, 255)' }}
                  >
                    {app}
                  </div>
                ))
              )}
            </div>
          </div> */}
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
  {/* Move the buttons container to the right side of the card */}
  <div class="oj-flex" style={{ gap: '12px', marginLeft: 'auto' }}>
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
  
  {/* Display the "Created At" text */}
  <div class="oj-typography-body-xs oj-text-color-secondary">
    Created {new Date(group.created_at).toLocaleString()}
  </div>
</div>

        </div>
      ))}
    </div> 

      {/* Dialogs (Create/Update/Delete) */}
      {showDialog && (
        <oj-dialog id="groupDialog" dialogTitle={editingGroup ? "Edit Group" : "Create Group"} initialVisibility="show">
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
                    hint: 'Only letters, numbers, spaces, hyphens(-), and underscores (_) are allowed.',
                    messageSummary: 'Invalid name format.',
                    messageDetail: 'Use only letters, numbers, spaces, hyphens(-), and underscores (_).'
                  })
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
                    pattern: '^[a-zA-Z0-9 _-]+$',
                    hint: 'Only letters, numbers, spaces, hyphens(-), and underscores (_) are allowed.',
                    messageSummary: 'Invalid name format.',
                    messageDetail: 'Use only letters, numbers, spaces, hyphens(-), and underscores (_).'
                  })
                ]}
              ></oj-c-input-text>
              <oj-c-input-text labelHint="Add Member Email" value={addEmailInput} onFocus={() => setActiveInput('add')} onvalueChanged={(e) => setAddEmailInput(e.detail.value)}></oj-c-input-text>
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
            </oj-c-form-layout>
            
          </div>
          <div class="oj-dialog-footer">
            <oj-button onojAction={() => saveGroup()}>Save</oj-button>
            <oj-button onojAction={() => setShowDialog(false)} chroming="borderless">Cancel</oj-button>
          </div>
        </oj-dialog>
      )}

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
                    messageDetail: 'Use only letters, numbers, spaces, hyphens (-), and underscores (_).'
                  })
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
                    pattern: '^[a-zA-Z0-9 _-]+$',
                    hint: 'Only letters, numbers, spaces, hyphens (-), and underscores (_) are allowed.',
                    messageSummary: 'Invalid name format.',
                    messageDetail: 'Use only letters, numbers, spaces, hyphens (-), and underscores (_).'
                  })
                ]}
              ></oj-c-input-text>

              <oj-c-input-text labelHint="Add Member Email" value={addEmailInput} onFocus={() => setActiveInput('add')} onvalueChanged={(e) => setAddEmailInput(e.detail.value)}></oj-c-input-text>
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
                  <oj-c-input-text labelHint="Remove Member Email" value={removeEmailInput} onFocus={() => setActiveInput('remove')} onvalueChanged={(e) => setRemoveEmailInput(e.detail.value)}></oj-c-input-text>
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
            </oj-c-form-layout>
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
                        setStagedAppIds((prev) =>
                          checked ? [...prev, app._id] : prev.filter((id) => id !== app._id)
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

      {showUsersDialog && selectedGroup && (
        <oj-dialog id="usersDialog" dialogTitle={`Users in ${selectedGroup.name}`} initialVisibility="show">
          <div class="oj-dialog-body">
            <ul>
              {selectedGroup.users?.map((user, idx) => (
                <li key={idx}>
                  {user.username}
                </li>
              ))}
            </ul>
          </div>
          <div class="oj-dialog-footer">
            <oj-button onojAction={closeUsersDialog}>Close</oj-button>
          </div>
        </oj-dialog>
      )}
    </div>
  );
};

export default UserGroups;

