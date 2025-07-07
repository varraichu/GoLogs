type Message = {
    id: string;
    severity: string;
    summary: string;
    detail: string;
    autoTimeout: string | number;
    sound: string;
};
type ToastContextType = {
    messages: Message[];
    addNewToast: (severity: string, summary: string, detail: string) => void;
    removeToast: (id: string) => void;
    messageDataProvider: any;
};
import { ComponentChildren } from 'preact';
export declare const ToastProvider: ({ children }: {
    children: ComponentChildren;
}) => import("preact").JSX.Element;
export declare const useToast: () => ToastContextType;
export {};
