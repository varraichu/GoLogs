import { h } from 'preact';
import { ComponentChildren } from 'preact';
import 'ojs/ojbutton';
import 'ojs/ojdialog';
interface ConfirmDialogProps {
    title: string;
    message?: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmType?: 'danger' | 'callToAction' | 'borderless';
    cancelType?: 'danger' | 'callToAction' | 'borderless';
    children?: ComponentChildren;
}
export declare const ConfirmDialog: ({ title, message, confirmText, cancelText, onConfirm, onCancel, confirmType, cancelType, children, }: ConfirmDialogProps) => h.JSX.Element;
export {};
