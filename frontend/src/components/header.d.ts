import { h } from 'preact';
import 'ojs/ojtoolbar';
import 'ojs/ojmenu';
import 'ojs/ojbutton';
type Props = Readonly<{
    appName: string;
    userLogin: string;
}>;
export declare function Header({ appName, userLogin }: Props): h.JSX.Element;
export {};
