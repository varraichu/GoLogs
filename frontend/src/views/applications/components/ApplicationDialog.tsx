// File: src/components/ApplicationDialog.tsx
import { h } from 'preact'
import { useRef, useMemo } from 'preact/hooks'
import { Application, UserGroup } from '../../../services/applications.services'
import config from '../../../config/config';

import 'oj-c/input-text'
import 'oj-c/form-layout'
import 'oj-c/select-multiple'
import 'ojs/ojbutton'
import 'ojs/ojdialog'

import LengthValidator = require('ojs/ojvalidator-length')
import RegExpValidator = require('ojs/ojvalidator-regexp')
import MutableArrayDataProvider = require('ojs/ojmutablearraydataprovider')

interface ApplicationDialogProps {
  editingApplication: Application | null;
  name: string;
  description: string;
  userGroups: UserGroup[];
  assignedGroupIds: any;
  editingState: boolean;
  isLoading: boolean; // <-- Add this
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onAssignedGroupsChange: (e: CustomEvent) => void;
  onSave: () => void;
  onCancel: () => void;
  hasUnsavedChanges: boolean;
  onDiscardChanges: () => void;
}


export const ApplicationDialog = ({
  editingApplication,
  isLoading,
  name,
  description,
  userGroups,
  assignedGroupIds,
  editingState,
  onNameChange,
  onDescriptionChange,
  onAssignedGroupsChange,
  onSave,
  onCancel,
  hasUnsavedChanges,
  onDiscardChanges,
}: ApplicationDialogProps) => {
  const nameRef = useRef<any>(null)
  const descRef = useRef<any>(null)

  const optionsData = useMemo(() => {
    const groupOptions = userGroups
      .filter((g) => !g.is_deleted && g.is_active && g.name !== config.ADMIN_USER_GROUP)
      .map((g) => ({
        value: String(g._id),
        text: g.name,
        description: g.description,
      }))
    return new MutableArrayDataProvider(groupOptions, {
      keyAttributes: 'value',
    })
  }, [userGroups])

  const handleSave = async () => {
    const nameResult = await nameRef.current.validate()
    const descResult = await descRef.current.validate()

    if (nameResult !== 'valid' || descResult !== 'valid') {
      nameRef.current.showMessages?.()
      descRef.current.showMessages?.()
      return
    }


    onSave()
  }

  const handleCancel = () => {
    // if (hasUnsavedChanges) {
    //   onDiscardChanges()
    // } else {
    // }
    onCancel()
  }

  return (
    <oj-dialog
      id="applicationDialog"
      dialogTitle={editingApplication ? 'Edit Application' : 'Create Application'}
      initialVisibility="show"
      headerDecoration='off'
    >
      <div class="oj-dialog-body">
        <oj-c-form-layout>
          <oj-c-input-text
            id="name-input"
            labelHint="Name"
            value={name}
            ref={nameRef}
            onvalueChanged={(e) => onNameChange(e.detail.value)}
            required
            validators={[
              new LengthValidator({ min: 5, max: 20 }),
              new RegExpValidator({
                pattern: '^[a-zA-Z0-9 _-]+$',
                hint: 'Only letters, numbers, spaces, underscores (_), and hyphens (-) are allowed.',
                messageSummary: 'Invalid name format.',
                messageDetail: 'Use only letters, numbers, spaces, underscores (_), and hyphens (-).',
              })
            ]}
          ></oj-c-input-text>
          <oj-c-input-text
            labelHint="Description"
            value={description}
            ref={descRef}
            onvalueChanged={(e) => onDescriptionChange(e.detail.value)}
            required
            validators={[
              new LengthValidator({ min: 10, max: 100 }),
              new RegExpValidator({
                pattern: "^[a-zA-Z0-9 _.,:;()\\[\\]\"'-]+$",
                hint: 'Allowed characters: letters, numbers, spaces, hyphens (-), underscores (_), periods (.), commas (,), colons (:), semicolons (;), parentheses (), brackets [], apostrophes (\'), and quotation marks (").',
                messageSummary: 'Invalid description format.',
                messageDetail: 'Only use letters, numbers, spaces, and these special characters: - _ . , : ; ( ) [ ] \' "',
              }),
            ]}
          ></oj-c-input-text>

          {
            editingState && (
              <div>
                <h4 class="oj-typography-heading-sm">Assigned To</h4>
                <div style="min-height: 38px;">
                  {isLoading ? (
                    <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-center" style="height: 38px;">
                      <oj-c-progress-circle value={-1} size="sm"></oj-c-progress-circle>
                    </div>
                  ) : (
                    <oj-c-select-multiple
                      label-hint="Assign to user groups"
                      value={assignedGroupIds}
                      onvalueChanged={onAssignedGroupsChange}
                      data={optionsData}
                      item-text="text"
                      class="oj-sm-margin-2x-vertical"
                    ></oj-c-select-multiple>
                  )}
                </div>

              </div>
            )
          }
        </oj-c-form-layout>
      </div>
      {
        editingState ? (
          <div class="oj-dialog-footer">
            <oj-button onojAction={handleSave}>Save</oj-button>
            <oj-button onojAction={handleCancel} chroming="borderless">
              Cancel
            </oj-button>
          </div>
        ) : (
          <div class="oj-dialog-footer">
            <oj-button onojAction={handleSave}>Create</oj-button>
            <oj-button onojAction={handleCancel} chroming="borderless">
              Cancel
            </oj-button>
          </div>
        )
      }
    </oj-dialog>
  )
}