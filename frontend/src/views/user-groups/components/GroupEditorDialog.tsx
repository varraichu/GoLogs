import LengthValidator = require('ojs/ojvalidator-length');
import RegExpValidator = require('ojs/ojvalidator-regexp');
import ArrayDataProvider = require('ojs/ojarraydataprovider');

import { UserGroup, Application } from '../../../services/usergroups.services';
import { useMemo } from 'preact/hooks';

type UserOption = { value: string; text: string; };
type AppOption = { value: string; text: string; disabled: boolean; };

interface GroupEditorDialogProps {
    isOpen: boolean;
    isLoading: boolean;
    errors: { name?: string; description?: string; memberEmails?: string; };
    onClose: () => void;
    onSave: () => void;
    onCancel: () => void;
    editingGroup: UserGroup | null;
    name: string;
    setName: (name: string) => void;
    description: string;
    setDescription: (desc: string) => void;
    nameInputRef: any;
    descriptionInputRef: any;
    allUsers: UserOption[];
    selectedUserEmails: Set<string>;
    setSelectedUserEmails: (emails: Set<string>) => void;
    availableApps: Application[];
    stagedAppIds: Set<string>;
    setStagedAppIds: (ids: Set<string>) => void;
}

export const GroupEditorDialog = ({ isOpen, isLoading, errors, onClose, onSave, onCancel, editingGroup, name, setName, description, setDescription, nameInputRef, descriptionInputRef, allUsers, selectedUserEmails, setSelectedUserEmails, availableApps, stagedAppIds, setStagedAppIds }: GroupEditorDialogProps) => {
    if (!isOpen) return null;

    const allUsersDataProvider = new ArrayDataProvider(allUsers, { keyAttributes: 'value' });
    const appDataProvider = useMemo(() => {
        const appOptions: AppOption[] = availableApps.filter(app => app.is_active).map(app => ({
            value: app._id,
            text: app.name + (!app.is_active ? ' (Inactive)' : ''),
            disabled: !app.is_active
        }));
        return new ArrayDataProvider(appOptions, { keyAttributes: 'value' });
    }, [availableApps]);

    return (
        <oj-dialog id="groupDialog" dialogTitle={editingGroup ? 'Edit Group' : 'Create Group'} initialVisibility="show" onojClose={onClose}>
            <div class="oj-dialog-body">
                <oj-c-form-layout>
                    <oj-c-input-text
                        id="name-input"
                        ref={nameInputRef}
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
                                messageDetail: 'Use only letters, numbers, spaces, hyphens (-), and underscores (_).',
                            }),
                        ]}
                    />
                    <oj-c-input-text
                        id="description-input"
                        ref={descriptionInputRef}
                        labelHint="Description"
                        value={description}
                        onvalueChanged={(e) => setDescription(e.detail.value)}
                        required
                        validators={[
                            new LengthValidator({ min: 10, max: 100 }),
                            new RegExpValidator({
                                pattern: '^[a-zA-Z0-9 _.,:;()\\\[\\\]\'"-]+$',
                                hint: 'Allowed values (a-z A-Z 0-9 spaces _ , . : ; ( ) [ ] \' ")',
                                messageSummary: 'Invalid description format.',
                                messageDetail: 'Description has an invalid character(s).',
                            })
                        ]}
                    />
                    <div>
                        <oj-label for="user-select-multiple">Group Members</oj-label>
                        <div style="min-height: 38px;">
                            {isLoading ? (
                                <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-center" style="height: 38px;">
                                    <oj-c-progress-circle value={-1} size="sm"></oj-c-progress-circle>
                                </div>
                            ) : (
                                <oj-c-select-multiple
                                    id="user-select-multiple"
                                    data={allUsersDataProvider}
                                    label-hint="Group Members"
                                    item-text="text"
                                    value={selectedUserEmails}
                                    onvalueChanged={(e: CustomEvent) => setSelectedUserEmails(e.detail.value || new Set())}
                                    class="oj-form-control-full-width"
                                />
                            )}
                        </div>
                        {errors.memberEmails && <div class="oj-text-color-danger oj-sm-margin-bottom">{errors.memberEmails}</div>}
                    </div>
                    <oj-c-select-multiple
                        id="app-access-dropdown"
                        label-hint="Application Access"
                        data={appDataProvider}
                        item-text="text"
                        value={stagedAppIds}
                        onvalueChanged={(e: CustomEvent) => setStagedAppIds(e.detail.value || new Set())}
                        class="oj-form-control-full-width"
                    />
                </oj-c-form-layout>
            </div>
            <div class="oj-dialog-footer">
                <oj-button onojAction={onSave}>{editingGroup ? 'Update' : 'Create'}</oj-button>
                <oj-button onojAction={onCancel} chroming="borderless">Cancel</oj-button>
            </div>
        </oj-dialog>
    );
};