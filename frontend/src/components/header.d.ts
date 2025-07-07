import { h } from "preact";
import "ojs/ojtoolbar";
import "ojs/ojmenu";
import "ojs/ojbutton";
type Props = {
    appName: string;
    userLogin: string;
    setIsAuthenticated?: (value: boolean) => void;
    setStartOpen: () => void;
};
export declare function Header({ appName, userLogin, setIsAuthenticated, setStartOpen }: Props): h.JSX.Element;
export {};
