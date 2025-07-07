import { h } from 'preact';
import 'oj-c/tab-bar';
interface TabBarProps {
    selectedItem: string;
    onSelectionChange: (event: CustomEvent) => void;
}
export declare const TabBar: ({ selectedItem, onSelectionChange }: TabBarProps) => h.JSX.Element;
export {};
