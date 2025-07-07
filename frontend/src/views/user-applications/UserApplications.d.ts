import { h } from 'preact';
import 'ojs/ojdialog';
import 'ojs/ojswitch';
import "oj-c/button";
import "oj-c/input-text";
import "oj-c/form-layout";
import 'oj-c/select-multiple';
declare const UserApplications: (props: {
    path?: string;
}) => h.JSX.Element;
export default UserApplications;
