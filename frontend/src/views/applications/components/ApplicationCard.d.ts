import { h } from 'preact';
import { Application } from '../../../services/applications.services';
interface ApplicationCardProps {
    app: Application;
    onToggleStatus: (appId: string, isActive: boolean) => void;
    onEdit: (app: Application) => void;
    onDelete: (appId: string) => void;
}
export declare const ApplicationCard: ({ app, onToggleStatus, onEdit, onDelete }: ApplicationCardProps) => h.JSX.Element;
export {};
