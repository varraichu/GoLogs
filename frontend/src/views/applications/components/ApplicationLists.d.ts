import { h } from 'preact';
import { Application } from '../../../services/applications.services';
interface ApplicationsListProps {
    applications: Application[];
    selectedItem: string;
    onToggleStatus: (appId: string, isActive: boolean) => void;
    onEdit: (app: Application) => void;
    onDelete: (appId: string) => void;
}
export declare const ApplicationsList: ({ applications, selectedItem, onToggleStatus, onEdit, onDelete, }: ApplicationsListProps) => h.JSX.Element;
export {};
