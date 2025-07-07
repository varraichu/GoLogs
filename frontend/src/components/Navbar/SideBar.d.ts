import 'ojs/ojnavigationlist';
import 'ojs/ojavatar';
import 'ojs/ojlistitemlayout';
import { h } from 'preact';
import { Slot } from 'ojs/ojvcomponent';
import './SideBar.css';
type Props = {
    slot?: Slot;
    setIsAuthenticated?: (value: boolean) => void;
    isAdmin?: boolean;
    username?: string;
    pictureUrl?: string;
};
export declare function SideBar({ setIsAuthenticated, isAdmin, pictureUrl, username, }: Props): h.JSX.Element;
export {};
