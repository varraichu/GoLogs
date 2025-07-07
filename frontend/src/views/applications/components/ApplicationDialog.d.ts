import { h } from 'preact';
import { Application, UserGroup } from '../../../services/applications.services';
import 'oj-c/input-text';
import 'oj-c/form-layout';
import 'oj-c/select-multiple';
import 'ojs/ojbutton';
import 'ojs/ojdialog';
interface ApplicationDialogProps {
    editingApplication: Application | null;
    name: string;
    description: string;
    userGroups: UserGroup[];
    assignedGroupIds: any;
    editingState: boolean;
    onNameChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    onAssignedGroupsChange: (e: CustomEvent) => void;
    onSave: () => void;
    onCancel: () => void;
    hasUnsavedChanges: boolean;
    onDiscardChanges: () => void;
}
export declare const ApplicationDialog: ({ editingApplication, name, description, userGroups, assignedGroupIds, editingState, onNameChange, onDescriptionChange, onAssignedGroupsChange, onSave, onCancel, hasUnsavedChanges, onDiscardChanges, }: ApplicationDialogProps) => h.JSX.Element;
export {};
