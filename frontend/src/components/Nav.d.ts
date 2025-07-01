import { h } from "preact";
import "ojs/ojtoolbar";
import "ojs/ojbutton";
type NavProps = {
    isAdmin: boolean;
    setIsAuthenticated: (value: boolean) => void;
};
declare const Nav: ({ isAdmin, setIsAuthenticated }: NavProps) => h.JSX.Element;
export default Nav;
