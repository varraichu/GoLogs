import { h } from 'preact';
import { useEffect, useState, useRef } from 'preact/hooks';
import 'ojs/ojbutton';
import 'ojs/ojdialog';
import 'oj-c/form-layout';
import 'oj-c/input-text';
import 'ojs/ojlabel';
import 'ojs/ojpopup';
import 'ojs/ojswitch';
import 'oj-c/select-multiple';
import 'oj-c/message-toast';
import 'oj-c/progress-circle';
import { useToast } from '../../context/ToastContext';

import { UserGroup, Application, fetchUserGroups, fetchDirectoryUsers, fetchApplications, fetchGroupUsers, saveUserGroup, updateGroupAppAccess, deleteUserGroup, toggleGroupStatus } from '../../services/usergroups.services';
import { UserGroupCard } from './components/UserGroupCard';
import { GroupEditorDialog } from './components/GroupEditorDialog';
import { UserGroupFilters } from './components/UserGroupFilters';
import SearchBar from '../../components/SearchBar';

type UserOption = { value: string; text: string; };

const UserGroups = (props: { path?: string }) => {
  // --- State Management ---
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const { addNewToast, messageDataProvider, removeToast } = useToast();
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Updated filters state to include appIds
  const [filters, setFilters] = useState({ search: '', status: 'all', appIds: [] as string[] });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 6,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Dialogs State
  const [showDialog, setShowDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [confirmDeleteDialogId, setConfirmDeleteDialogId] = useState<string | null>(null);
  const [showUsersDialog, setShowUsersDialog] = useState(false);
  const [selectedGroupForUsers, setSelectedGroupForUsers] = useState<UserGroup | null>(null);
  const [confirmCancelDialog, setConfirmCancelDialog] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ name?: string; description?: string; memberEmails?: string }>({});
  const nameInputRef = useRef<any>(null);
  const descriptionInputRef = useRef<any>(null);

  // Data for Dialogs
  const [allDirectoryUsers, setAllDirectoryUsers] = useState<UserOption[]>([]);
  const [availableApps, setAvailableApps] = useState<Application[]>([]);
  const [selectedUserEmails, setSelectedUserEmails] = useState<Set<string>>(new Set());
  const [originalUserEmails, setOriginalUserEmails] = useState<Set<string>>(new Set());
  const [stagedAppIds, setStagedAppIds] = useState<Set<string>>(new Set());
  const [selectedAppIds, setSelectedAppIds] = useState<Set<string>>(new Set());
  const [isLoadingDialogData, setIsLoadingDialogData] = useState(false);

  const [opened, setOpened] = useState(false);

  // --- Data Loading ---
  const loadGroups = async () => {
    setIsLoadingPage(true);
    try {
      const data = await fetchUserGroups(filters, { page: pagination.page, limit: pagination.limit });
      setGroups(data.groups || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error: any) {
      addNewToast('error', 'Error', 'Failed to fetch user groups');
    } finally {
      setIsLoadingPage(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [filters, pagination.page]);

  // --- Handlers ---
  const handleFilterChange = (newFilters: { status: string; appIds: string[] }) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearchChange = (newSearchTerm: string) => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    const trimmedSearchTerm = newSearchTerm.trim();
    debounceTimeout.current = setTimeout(() => {
      if (trimmedSearchTerm !== filters.search) {
        setFilters(prev => ({ ...prev, search: trimmedSearchTerm }));
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 300);
  };

  const handleOpenEditor = async (group?: UserGroup) => {
    setErrors({});
    setName(group?.name || '');
    setDescription(group?.description || '');
    setEditingGroup(group || null);
    setShowDialog(true);
    setIsLoadingDialogData(true);

    try {
      let directoryData = allDirectoryUsers;
      if (directoryData.length === 0) {
        directoryData = await fetchDirectoryUsers();
        setAllDirectoryUsers(directoryData);
      }
      const appData = await fetchApplications();
      setAvailableApps(appData);
      if (group) {
        const usersInGroup = await fetchGroupUsers(group._id);
        const emailMap = new Map(directoryData.map(u => [u.value.toLowerCase(), u.value]));
        const groupEmails = new Set(usersInGroup.map(u => emailMap.get(u.email.toLowerCase())).filter(Boolean) as string[]);
        setOriginalUserEmails(groupEmails);
        setSelectedUserEmails(groupEmails);
        const matchedAppIds = new Set(appData.filter(app => group.applicationNames.includes(app.name)).map(app => app._id));
        setSelectedAppIds(matchedAppIds);
        setStagedAppIds(matchedAppIds);
      } else {
        setOriginalUserEmails(new Set());
        setSelectedUserEmails(new Set());
        setSelectedAppIds(new Set());
        setStagedAppIds(new Set());
      }
    } catch (error: any) {
      addNewToast('error', 'Error', error.message || 'Failed to load data for editor.');
      setShowDialog(false);
    } finally {
      setIsLoadingDialogData(false);
    }
  };

  const handleCloseEditor = () => {
    setShowDialog(false);
    setEditingGroup(null);
  };

  const validateForm = async (): Promise<boolean> => {
    setErrors({});
    const nameValid = await nameInputRef.current?.validate();
    const descriptionValid = await descriptionInputRef.current?.validate();
    let isFormValid = nameValid === 'valid' && descriptionValid === 'valid';
    if (!editingGroup && selectedUserEmails.size === 0) {
      setErrors(prev => ({ ...prev, memberEmails: 'A new group must have at least one member.' }));
      isFormValid = false;
    }
    return isFormValid;
  };

  const handleSave = async () => {
    if (!(await validateForm())) return;
    const groupData = {
      name,
      description,
      addMemberEmails: [...selectedUserEmails].filter(email => !originalUserEmails.has(email)),
      removeMemberEmails: [...originalUserEmails].filter(email => !selectedUserEmails.has(email)),
    };
    if (!editingGroup) {
      // @ts-ignore
      groupData.memberEmails = [...selectedUserEmails];
      // @ts-ignore
      delete groupData.addMemberEmails;
      // @ts-ignore
      delete groupData.removeMemberEmails;
    }
    try {
      const savedGroup = await saveUserGroup(groupData, editingGroup);
      const appsChanged = JSON.stringify([...stagedAppIds].sort()) !== JSON.stringify([...selectedAppIds].sort());
      if (appsChanged) {
        await updateGroupAppAccess(savedGroup._id, [...stagedAppIds]);
      }
      addNewToast('confirmation', 'Success', `User group ${editingGroup ? 'updated' : 'created'} successfully.`);
      handleCloseEditor();
      loadGroups();
    } catch (error: any) {
      addNewToast('error', 'Error', error.message || 'Failed to save user group.');
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteDialogId) return;
    try {
      await deleteUserGroup(confirmDeleteDialogId);
      addNewToast('confirmation', 'Success', 'Group deleted successfully.');
      setConfirmDeleteDialogId(null);
      loadGroups();
    } catch (error: any) {
      addNewToast('error', 'Error', error.message || 'Failed to delete group.');
    }
  };

  const handleToggleStatus = async (groupId: string, isActive: boolean) => {
    try {
      await toggleGroupStatus(groupId, isActive);
      addNewToast('confirmation', 'Success', 'Group status updated.');
      loadGroups();
    } catch (error: any) {
      addNewToast('error', 'Error', error.message || 'Failed to update status.');
    }
  };

  const handleViewUsers = async (group: UserGroup) => {
    try {
      const users = await fetchGroupUsers(group._id);
      setSelectedGroupForUsers({ ...group, users });
      setShowUsersDialog(true);
    } catch (error: any) {
      addNewToast('error', 'Error', error.message || 'Could not fetch users.');
    }
  };

  const toggleDrawer = () => setOpened(!opened)

  return (
    <div class="oj-flex oj-sm-flex-direction-column oj-sm-padding-6x "
      style={{ overflow: "hidden" }}>

      <div class="oj-flex oj-sm-12 oj-sm-justify-content-space-between oj-sm-align-items-center">
        <h1 class="oj-typography-heading-md">User groups</h1>
      </div>

      <div class="oj-flex oj-sm-margin-4x-bottom  oj-sm-align-items-center" style="width: 100%; gap: 12px;">
        <SearchBar value={filters.search} onChange={handleSearchChange} placeholder="Search by name or description" />

        <oj-button onojAction={() => handleOpenEditor()} chroming="callToAction">+ Create Group</oj-button>

        <oj-button
          onojAction={toggleDrawer}
          label={opened ? "Close Filters" : "Apply Filters"}
          chroming={opened ? "outlined" : "callToAction"}
        >
          {opened ? (<span slot="startIcon" class="oj-ux-ico-filter-alt-off"></span>) : (<span slot="startIcon" class="oj-ux-ico-filter-alt"></span>)}
        </oj-button>
      </div>


      <oj-drawer-layout endOpened={opened} class="oj-sm-flex-1" style="width: 100%; overflow-x: hidden;">
        <div class="oj-flex oj-sm-flex-1 oj-sm-overflow-hidden" style="min-width: 0;">
          <div class="oj-flex-item" style="width: 100%;">
            {isLoadingPage ? (
              <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-center" style="height: 400px; width: 100%;">
                <oj-c-progress-circle value={-1} size="md"></oj-c-progress-circle>
              </div>
            ) : (
              <div
                class="oj-flex oj-flex-wrap oj-sm-padding-4x-bottom oj-sm-align-items-stretch oj-sm-justify-content-flex-start"
                style={{
                  gap: '24px',
                }}
              >
                {/* <div class="oj-flex oj-flex-wrap" style={{ gap: '24px' }}> */}
                {groups.length > 0 ? (
                  groups.map((group) => (
                    <UserGroupCard
                      key={group._id}
                      group={group}
                      onEdit={handleOpenEditor}
                      onDelete={setConfirmDeleteDialogId}
                      onToggleStatus={handleToggleStatus}
                      onViewUsers={handleViewUsers}
                    />
                  ))
                ) : (
                  <div class="oj-flex oj-sm-justify-content-center oj-sm-align-items-center" style="width: 100%; height: 200px;">
                    <p class="oj-typography-body-lg">No user groups found.</p>
                  </div>
                )}
              </div>
            )}
            {pagination && (
              <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-flex-end" style="gap: 16px;">
                <oj-button
                  chroming="callToAction"
                  onojAction={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={!pagination.hasPrevPage}
                >
                  <span slot="startIcon" class="oj-ux-ico-arrow-left"></span>
                  Previous
                </oj-button>
                <span class="oj-typography-body-md oj-text-color-primary">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <oj-button
                  chroming="callToAction"
                  onojAction={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={!pagination.hasNextPage}
                >
                  Next
                  <span slot="endIcon" class="oj-ux-ico-arrow-right"></span>
                </oj-button>
              </div>
            )}
          </div>
        </div>

        <div slot="end" style="width: 280px; max-width: 100%; box-sizing: border-box;">
          <div class="oj-flex oj-flex-direction-col oj-sm-align-items-center oj-sm-padding-4x-start">
            <h6>Filter groups</h6>
          </div>
          <div class="oj-flex">
            <UserGroupFilters onFilterChange={handleFilterChange} />
          </div>
        </div>
      </oj-drawer-layout>




      {/* --- DIALOGS --- */}
      {showDialog && (
        <GroupEditorDialog
          isOpen={showDialog}
          isLoading={isLoadingDialogData}
          errors={errors}
          onClose={handleCloseEditor}
          onSave={handleSave}
          onCancel={() => setConfirmCancelDialog(true)}
          editingGroup={editingGroup}
          name={name}
          setName={setName}
          description={description}
          setDescription={setDescription}
          nameInputRef={nameInputRef}
          descriptionInputRef={descriptionInputRef}
          allUsers={allDirectoryUsers}
          selectedUserEmails={selectedUserEmails}
          setSelectedUserEmails={setSelectedUserEmails}
          availableApps={availableApps}
          stagedAppIds={stagedAppIds}
          setStagedAppIds={setStagedAppIds}
        />
      )}
      {confirmDeleteDialogId && (
        <oj-dialog id="confirmDeleteDialog" dialogTitle="Confirm Deletion" initialVisibility="show">
          <div class="oj-dialog-body">Are you sure you want to delete this group?</div>
          <div class="oj-dialog-footer">
            <oj-button onojAction={handleDelete} chroming="danger">Delete</oj-button>
            <oj-button onojAction={() => setConfirmDeleteDialogId(null)} chroming="borderless">Cancel</oj-button>
          </div>
        </oj-dialog>
      )}
      {confirmCancelDialog && (
        <oj-dialog id="confirmCancelDialog" dialogTitle="Cancel Changes" initialVisibility="show" headerDecoration='off'>
          <div class="oj-dialog-body">Are you sure you want to cancel your changes?</div>
          <div class="oj-dialog-footer">
            <oj-button onojAction={() => { setConfirmCancelDialog(false); handleCloseEditor(); }} chroming="danger">Confirm</oj-button>
            <oj-button onojAction={() => setConfirmCancelDialog(false)} chroming="borderless">Cancel</oj-button>
          </div>
        </oj-dialog>
      )}
      {showUsersDialog && selectedGroupForUsers && (
        <oj-dialog dialogTitle={`Users in ${selectedGroupForUsers.name}`} initialVisibility="show" onojClose={() => setShowUsersDialog(false)}>
          <div class="oj-dialog-body">
            {selectedGroupForUsers.users?.length > 0 ? (
              <ul>{selectedGroupForUsers.users.map(user => <li key={user._id}>{user.username}</li>)}</ul>
            ) : <p>No users in this group.</p>}
          </div>
          <div class="oj-dialog-footer">
            <oj-button onojAction={() => setShowUsersDialog(false)}>Close</oj-button>
          </div>
        </oj-dialog>
      )}
      <oj-c-message-toast
        data={messageDataProvider}
        onojClose={(e: CustomEvent) => removeToast(e.detail.key)}
        position="top-right"
      />
    </div>
  );
};

export default UserGroups;