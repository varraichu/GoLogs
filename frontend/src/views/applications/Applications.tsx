// File: src/views/applications/applications.tsx
import { h } from 'preact'
import { useEffect, useState, useMemo, useRef } from 'preact/hooks'
import 'ojs/ojdialog'
import 'ojs/ojswitch'
import 'oj-c/button'
import 'oj-c/input-text'
import 'oj-c/form-layout'
import 'oj-c/select-multiple'
import 'oj-c/card-view'
import 'ojs/ojinputsearch';
import { useToast } from '../../context/ToastContext'
import Toast from '../../components/Toast'
import SearchBar from '../../components/SearchBar';

import 'ojs/ojselector'
import 'ojs/ojlistitemlayout'
import 'ojs/ojavatar'
import 'ojs/ojlistview'
import 'ojs/ojbutton'
import 'ojs/ojtoolbar'

import 'oj-c/tab-bar';
import 'oj-c/progress-circle';

import MutableArrayDataProvider = require('ojs/ojmutablearraydataprovider')
import ArrayDataProvider = require('ojs/ojarraydataprovider')

import { ApplicationsList } from './components/ApplicationLists';
import { ApplicationDialog } from './components/ApplicationDialog';
import { ConfirmDialog } from '../../components/ConfirmDialog';

import { ApplicationFilters } from './components/ApplicationFilters';

import applicationsService, { Application, UserGroup } from '../../services/applications.services'
import '../../styles/applications-page.css';

const Applications = (props: { path?: string }) => {
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const { addNewToast } = useToast();
  const [showDialog, setShowDialog] = useState(false)
  const [editingApplication, setEditingApplication] = useState<Application | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [userGroups, setUserGroups] = useState<UserGroup[]>([])
  const [appUserGroups, setAppUserGroups] = useState<string[]>([])
  const [assignedGroupIds, setAssignedGroupIds] = useState<any>(new Set([]))
  const [initialAssignedGroupIds, setInitialAssignedGroupIds] = useState<any>(new Set([]))
  const [confirmDeleteDialogId, setConfirmDeleteDialogId] = useState<string | null>(null)

  const [showDiscardDialog, setShowDiscardDialog] = useState(false)
  const [editingState, setEditingState] = useState<boolean>(false)
  const [selectedItem, setSelectedItem] = useState('active')

  const [errors, setErrors] = useState<{ name?: string; description?: string }>({})
  const [dataProvider, setDataProvider] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [allUserGroups, setAllUserGroups] = useState<UserGroup[]>([]);
  const [filters, setFilters] = useState<{ search: string; groupIds: string[]; status: string }>({
    search: '',
    groupIds: [],
    status: 'all',
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 6,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const [initialEditValues, setInitialEditValues] = useState<{
    name: string;
    description: string;
    assignedGroupIds: Set<string>
  }>({
    name: '',
    description: '',
    assignedGroupIds: new Set(),
  })

  const confirmDeleteGroup = (groupId: string) => {
    setConfirmDeleteDialogId(groupId)
  }

  const handleSelectionChange = (event: CustomEvent) => {
    const newSelection = event.detail.value
    setSelectedItem(newSelection)
  }


  useEffect(() => {
    fetchAllUserGroupsForFilter();
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [filters, pagination.page]);

  const fetchAllUserGroupsForFilter = async () => {
    setIsLoadingPage(true);
    try {
      const groups = await applicationsService.fetchAllUserGroups();
      setAllUserGroups(groups.filter(g => !g.is_deleted));
    } catch (error) {
      console.error('Error fetching usergroups for filter:', error);
      addNewToast('error', 'Failed to fetch user groups', String(error));
    } finally {
      setIsLoadingPage(false);
    }
  };

  const fetchApplications = async () => {
    setIsLoadingPage(true);
    try {
      const data = await applicationsService.fetchApplications(filters, { page: pagination.page, limit: pagination.limit });
      setApplications(data.applications || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch applications', error);
      addNewToast('error', 'Failed to fetch applications', String(error));
    } finally {
      setIsLoadingPage(false);
    }
  };


  const handleFilterChange = (newFilters: { groupIds: string[]; status: string; }) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearchChange = (newSearchTerm: string) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    const trimmedSearchTerm = newSearchTerm.trim();

    debounceTimeout.current = setTimeout(() => {

      if (trimmedSearchTerm !== filters.search) {
        setFilters(prev => ({ ...prev, search: trimmedSearchTerm }));
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 300);
  };

  const openDialog = async (application?: Application) => {
    if (application) {
      setEditingState(true)
      setEditingApplication(application)
      setName(application.name || '')
      setDescription(application.description || '')
      await fetchAllUserGroups()
      await fetchAppUserGroups(application._id || '')
      setInitialEditValues({
        name: application.name || '',
        description: application.description || '',
        assignedGroupIds: new Set(appUserGroups.map((g) => String(g))),
      })
    } else {
      setEditingApplication(null)
      setName('')
      setDescription('')
      await fetchAllUserGroups()
      setInitialEditValues({
        name: '',
        description: '',
        assignedGroupIds: new Set(),
      })
      setEditingState(false)
    }
    setShowDialog(true)
  }

  const hasUnsavedChanges = () => {
    if (!showDialog) return false
    if (name !== initialEditValues.name) return true
    if (description !== initialEditValues.description) return true

    const current = new Set(Array.from(assignedGroupIds))
    const initial = new Set(Array.from(initialAssignedGroupIds))
    console.log("here", name, description, current, initial, initialEditValues, showDialog)
    if (current.size !== initial.size) return true
    for (let id of current) {
      if (!initial.has(id as string)) return true
    }
    return false
  }

  const saveApplication = async () => {
    const transformedName = name.replace(/ /g, '.');
    console.log('Saving application:', transformedName, description)

    const applicationData = { name: transformedName, description }

    try {
      let result
      if (editingApplication) {
        result = await applicationsService.updateApplication(editingApplication._id, applicationData)
      } else {
        result = await applicationsService.createApplication(applicationData)
      }

      const data = await result.json().catch(() => ({}))
      if (!result.ok) {
        addNewToast(
          'error',
          'Failed to save application',
          data.message || 'An error occurred while saving the application.'
        )
        return
      } else {
        addNewToast(
          'confirmation',
          editingApplication ? 'Application updated' : 'Application created',
          data.message || 'Operation successful.'
        )
      }

      try {
        await assignGroups(editingApplication?._id || '')
      } catch (error) {
        addNewToast('error', 'Failed to assign groups', String(error))
        console.error('Failed to assign groups:', error)
      }

      setShowDialog(false)
      setErrors({})
      fetchApplications()
    } catch (error) {
      addNewToast('error', 'Failed to save application', String(error))
      console.error('Failed to save application', error)
    }
  }

  const deleteGroup = async () => {
    try {
      if (!confirmDeleteDialogId) return;

      const result = await applicationsService.deleteApplication(confirmDeleteDialogId);
      const data = await result.json().catch(() => ({}));
      
      if (!result.ok) {
        addNewToast(
          'error',
          'Failed to delete application',
          data.message || 'An error occurred while deleting the application.'
        );
      } else {
        addNewToast(
          'confirmation',
          'Application deleted',
          data.message || 'Application deleted successfully.'
        );
      }
      
      fetchApplications();
      setConfirmDeleteDialogId(null);
    } catch (error) {
      addNewToast('error', 'Failed to delete application', String(error));
      console.error('Failed to delete application', error);
    }
  };


  const handleToggleApplicationStatus = async (appId: string, isActive: boolean) => {
    try {
      const result = await applicationsService.toggleApplicationStatus(appId, isActive)
      if (result.ok) {
        fetchApplications() 
      } else {
        addNewToast(
          'error',
          'Could not toggle',
          'Application status could not be updated.'
        )
      }
    } catch (error) {
      console.error('Error toggling status:', error)
      addNewToast('error', 'Failed to toggle status', String(error))
    }
  }


  const fetchAllUserGroups = async () => {
    // setIsLoadingPage(true);
    try {
      const groups = await applicationsService.fetchAllUserGroups();
      setUserGroups(groups);
      console.log('Fetched user groups:', groups);
    } catch (error) {
      console.error('Error fetching usergroups:', error);
      addNewToast('error', 'Failed to fetch user groups', String(error));
    } finally {
      setIsLoadingPage(false);
    }
  };

  const fetchAppUserGroups = async (appId: string) => {
    // setIsLoadingPage(true);
    try {
      const result = await applicationsService.fetchAppUserGroups(appId);
      const validIds = (result.groupIds || [])
        .map(String)
        .filter((id: string) => userGroups.some((g) => String(g._id) === id));

      setAssignedGroupIds(new Set(validIds));
      setInitialAssignedGroupIds(new Set(validIds));

      if (setAppUserGroups) {
        const assignedNames = userGroups
          .filter((g) => validIds.includes(String(g._id)))
          .map((g) => g.name);
        setAppUserGroups(assignedNames);
      }
    } catch (error) {
      console.error('Error fetching App usergroups:', error);
      addNewToast('error', 'Failed to fetch app user groups', String(error));
    } finally {
      setIsLoadingPage(false);
    }
  };


  const optionsData = useMemo(() => {
    const groupOptions = userGroups
      .filter((g) => !g.is_deleted)
      .map((g) => ({
        value: String(g._id),
        text: g.name,
        description: g.description,
      }))
    return new MutableArrayDataProvider(groupOptions, {
      keyAttributes: 'value',
    })
  }, [userGroups])

  const handleAssignedGroupsChange = (e: CustomEvent) => {
    setAssignedGroupIds(e.detail.value || [])
  }

  const assignGroups = async (appId: string) => {
    if (!appId) return;

    const prevIds = Array.from(
      initialAssignedGroupIds instanceof Set
        ? initialAssignedGroupIds
        : new Set(initialAssignedGroupIds)
    );
    const newIds = Array.from(
      assignedGroupIds instanceof Set ? assignedGroupIds : new Set(assignedGroupIds)
    );

    try {
      await applicationsService.updateUserGroupAssignments(appId, prevIds, newIds);
      console.log('Groups assigned successfully');
    } catch (error) {
      console.error('Failed to assign groups', error);
      throw error;
    } finally {
      setIsLoadingPage(false);
    }
  };



  return (
    // 1. MAIN CONTAINER
    <div class="oj-flex oj-sm-flex-direction-column applications-page">
      {/* 2. PAGE TITLE */}
      <div class="oj-flex oj-sm-12 oj-sm-padding-5x-start oj-sm-justify-content-space-between oj-sm-align-items-center oj-sm-padding-5x-end">
        <h1 class="oj-typography-heading-md">Applications</h1>
        <oj-button
          class="oj-sm-margin-6x-top"
          onojAction={() => openDialog()}
          chroming="callToAction"
        >
          + Create Application
        </oj-button>
      </div>

      {/* 3. SEARCH BAR */}
      <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-start oj-sm-padding-1x-bottom ">
        <SearchBar value={filters.search} onChange={handleSearchChange} placeholder="Search Applications" />
      </div>

      {/* 4. FILTERS */}
      <ApplicationFilters onFilterChange={handleFilterChange} />

      {/* 5. CONTENT (APP CARDS) */}
      <div
        id="applicationsListContainer"
        class="oj-flex-item oj-flex oj-sm-flex-wrap oj-sm-margin-1x-top oj-sm-justify-content-center"
        style="flex: 1; min-height: 0; gap: 16px; position: relative;"
      >
        {isLoadingPage ? (
          <oj-c-progress-circle value={-1} size="lg" style="margin-top: 40px;" />
        ) : (
          <ApplicationsList
            applications={applications}
            onToggleStatus={handleToggleApplicationStatus}
            onEdit={openDialog}
            onDelete={confirmDeleteGroup}
          />
        )}
      </div>

      {/* --- PAGINATION --- */}
      {pagination && pagination.total > 0 && (
        <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-flex-end oj-sm-margin-4x-end" style="gap: 16px; margin-top: 24px;">
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

      {/* --- DIALOGS AND TOAST --- */}
      {confirmDeleteDialogId && (
        <ConfirmDialog
          title="Confirm Deletion"
          message="Are you sure you want to delete this application?"
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={deleteGroup}
          onCancel={() => setConfirmDeleteDialogId(null)}
        />
      )}
      {showDialog && (
        <ApplicationDialog
          editingApplication={editingApplication}
          name={name}
          description={description}
          userGroups={userGroups}
          assignedGroupIds={assignedGroupIds}
          editingState={editingState}
          onNameChange={setName}
          onDescriptionChange={setDescription}
          onAssignedGroupsChange={handleAssignedGroupsChange}
          onSave={saveApplication}
          onCancel={() => {
            if (hasUnsavedChanges()) {
              setShowDiscardDialog(true)
            } else {
              setShowDialog(false)
              setErrors({})
            }
          }}
          hasUnsavedChanges={hasUnsavedChanges()}
          onDiscardChanges={() => {
            setShowDialog(false)
            setShowDiscardDialog(false)
            setErrors({})
          }}
        />
      )}
      {showDiscardDialog && (
        <ConfirmDialog
          title="Discard Changes?"
          message="You have unsaved changes. Are you sure you want to discard them?"
          confirmText="Discard"
          cancelText="Cancel"
          onConfirm={() => {
            setShowDialog(false)
            setShowDiscardDialog(false)
            setErrors({})
          }}
          onCancel={() => setShowDiscardDialog(false)}
        />
      )}
      <Toast />
    </div>
  );
};
export default Applications