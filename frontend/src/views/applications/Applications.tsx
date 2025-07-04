// File: src/views/applications/applications.tsx
import { h } from 'preact'
import { useEffect, useState, useMemo } from 'preact/hooks'
import 'ojs/ojdialog'
import 'ojs/ojswitch'
import 'oj-c/button'
import 'oj-c/input-text'
import 'oj-c/form-layout'
import 'oj-c/select-multiple'
import 'oj-c/card-view'
import { useToast } from '../../context/ToastContext'

import 'ojs/ojselector'
import 'ojs/ojlistitemlayout'
import 'ojs/ojavatar'
import 'ojs/ojlistview'
import 'ojs/ojbutton'
import 'ojs/ojtoolbar'
import "oj-c/message-toast"

import 'oj-c/tab-bar';

import MutableArrayDataProvider = require('ojs/ojmutablearraydataprovider')
import ArrayDataProvider = require('ojs/ojarraydataprovider')

import { TabBar } from '../../components/TabBar'
import { ApplicationsList } from './components/ApplicationLists';
import { ApplicationDialog } from './components/ApplicationDialog';
import { ConfirmDialog } from '../../components/ConfirmDialog';


// Import service and types
import applicationsService, { Application, UserGroup } from '../../services/applications.services'

const Applications = (props: { path?: string }) => {
  const [applications, setApplications] = useState<Application[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [editingApplication, setEditingApplication] = useState<Application | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [userGroups, setUserGroups] = useState<UserGroup[]>([])
  const [appUserGroups, setAppUserGroups] = useState<string[]>([])
  const [assignedGroupIds, setAssignedGroupIds] = useState<any>(new Set([]))
  const [initialAssignedGroupIds, setInitialAssignedGroupIds] = useState<any>(new Set([]))
  const [confirmDeleteDialogId, setConfirmDeleteDialogId] = useState<string | null>(null)
  const { addNewToast, messageDataProvider, removeToast } = useToast()
  const [showDiscardDialog, setShowDiscardDialog] = useState(false)
  const [editingState, setEditingState] = useState<boolean>(false)
  const [selectedItem, setSelectedItem] = useState('active')


  const [errors, setErrors] = useState<{ name?: string; description?: string }>({})
  const [dataProvider, setDataProvider] = useState<any>(null)

  const [initialEditValues, setInitialEditValues] = useState<{
    name: string;
    description: string;
    assignedGroupIds: Set<string>
  }>({
    name: '',
    description: '',
    assignedGroupIds: new Set(),
  })

  const closeMessage = (event: CustomEvent<{ key: string }>) => {
    removeToast(event.detail.key)
  }

  const confirmDeleteGroup = (groupId: string) => {
    setConfirmDeleteDialogId(groupId)
  }

  const handleSelectionChange = (event: CustomEvent) => {
    const newSelection = event.detail.value
    setSelectedItem(newSelection)
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const data = await applicationsService.fetchApplications()
      setApplications(data.applications || [])
      setDataProvider(new ArrayDataProvider(data.applications || [], { keyAttributes: '_id' }))
    } catch (error) {
      console.error('Failed to fetch applications', error)
      addNewToast('error', 'Failed to fetch applications', String(error))
    }
  }

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
    const initial = new Set(Array.from(initialEditValues.assignedGroupIds))
    if (current.size !== initial.size) return true
    for (let id of current) {
      if (!initial.has(id as string)) return true
    }
    return false
  }

  const saveApplication = async () => {
    console.log('Saving application:', name, description)

    const applicationData = { name, description }

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
      if (!confirmDeleteDialogId) return

      const result = await applicationsService.deleteApplication(confirmDeleteDialogId)

      const data = await result.json().catch(() => ({}))

      if (!result.ok) {
        addNewToast(
          'error',
          'Failed to delete application',
          data.message || 'An error occurred while deleting the application.'
        )
      } else {
        addNewToast(
          'confirmation',
          'Application deleted',
          data.message || 'Application deleted successfully.'
        )
      }
      fetchApplications()
      setConfirmDeleteDialogId(null)
    } catch (error) {
      addNewToast('error', 'Failed to delete application', String(error))
      console.error('Failed to delete application', error)
    }
  }

  const handleToggleApplicationStatus = async (appId: string, isActive: boolean) => {
    try {
      const result = await applicationsService.toggleApplicationStatus(appId, isActive)
      if (result.ok) {
        fetchApplications() // Refresh UI
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
    try {
      const groups = await applicationsService.fetchAllUserGroups()
      setUserGroups(groups)
      console.log('Fetched user groups:', groups)
    } catch (error) {
      console.error('Error fetching usergroups:', error)
      addNewToast('error', 'Failed to fetch user groups', String(error))
    }
  }

  const fetchAppUserGroups = async (appId: string) => {
    try {
      const result = await applicationsService.fetchAppUserGroups(appId)
      const validIds = (result.groupIds || [])
        .map(String)
        .filter((id: string) => userGroups.some((g) => String(g._id) === id))

      setAssignedGroupIds(new Set(validIds))
      setInitialAssignedGroupIds(new Set(validIds))

      if (setAppUserGroups) {
        const assignedNames = userGroups
          .filter((g) => validIds.includes(String(g._id)))
          .map((g) => g.name)
        setAppUserGroups(assignedNames)
      }
    } catch (error) {
      console.error('Error fetching App usergroups:', error)
      addNewToast('error', 'Failed to fetch app user groups', String(error))
    }
  }

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
    if (!appId) return

    const prevIds = Array.from(
      initialAssignedGroupIds instanceof Set
        ? initialAssignedGroupIds
        : new Set(initialAssignedGroupIds)
    )
    const newIds = Array.from(
      assignedGroupIds instanceof Set ? assignedGroupIds : new Set(assignedGroupIds)
    )

    try {
      await applicationsService.updateUserGroupAssignments(appId, prevIds, newIds)
      console.log('Groups assigned successfully')
    } catch (error) {
      console.error('Failed to assign groups', error)
      throw error
    }
  }

  const filteredApps = useMemo(() => {
    return (applications || []).filter(app =>
      selectedItem === 'active' ? app.is_active : !app.is_active
    )
  }, [applications, selectedItem])

  return (
    <div class="oj-flex oj-sm-padding-4x">
      <div class="oj-flex oj-sm-12 oj-sm-margin-4x oj-sm-justify-content-space-between oj-sm-align-items-center">
        <div class="">
          <h1 class="oj-typography-heading-lg">Applications</h1>
          <p class="oj-typography-body-md">Manage your applications</p>
        </div>
        <div>
          <oj-button onojAction={() => openDialog()} chroming="callToAction">
            + Create Application
          </oj-button>
        </div>
      </div>

      <div id="tabbarcontainer" style={{ paddingBottom: '8px' }}>
        <TabBar
          selectedItem={selectedItem}
          onSelectionChange={handleSelectionChange}
        />

        <ApplicationsList
          applications={applications}
          selectedItem={selectedItem}
          onToggleStatus={handleToggleApplicationStatus}
          onEdit={openDialog}
          onDelete={confirmDeleteGroup}
        />
      </div>

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


      <oj-c-message-toast
        data={messageDataProvider}
        onojClose={closeMessage}
        position="top-right"
        offset={{ horizontal: 10, vertical: 50 }}
      />
    </div>
  )
}

export default Applications