import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { registerCustomElement } from "ojs/ojvcomponent";
import { route, Router } from "preact-router";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Applications from "./pages/Applications";
import Logs from "./pages/Logs";
import UserGroups from "./pages/UserGroups";
import Nav from "./Nav";
import Context = require("ojs/ojcontext");
import UserApplications from "./pages/UserApplications";

type Props = {
  appName?: string;
  userLogin?: string;
};

export const App = registerCustomElement(
  "app-root",
  ({ appName = "GoLogs", userLogin = "john.hancock@oracle.com" }: Props) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true); 
    useEffect(() => {
      Context.getPageContext().getBusyContext().applicationBootstrapComplete();

      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");

      const processToken = (token: string) => {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          localStorage.setItem("jwt", token);
          setIsAuthenticated(true);
          setIsAdmin(payload.isAdmin);

          
        } catch (err) {
          console.error("Invalid JWT token", err);
        }
      };

      if (token) {
        processToken(token);
        // Remove token from URL
        const newUrl = window.location.origin + "/dashboard";
        window.history.replaceState({}, "", newUrl);
        setLoading(false);
      } else {
        const storedToken = localStorage.getItem("jwt");
        if (storedToken) {
          processToken(storedToken);
        }
        setLoading(false);
      }
    }, []);

    if (loading) {
      return <div>Loading...</div>; // Better than blank screen
    }

    if (!isAuthenticated) {
      return <Login />;
    }

    return (
      <div>
        <Nav isAdmin={isAdmin} setIsAuthenticated={setIsAuthenticated} />
        <Router>
          <Dashboard path="/dashboard" />
          <Settings path="/settings" />
          <UserApplications path="/user-applications" />
          <Logs path="/logs" />
          {isAdmin && <UserGroups path="/usergroups" />}
          {isAdmin && <Applications path="/applications" />}
        </Router>
      </div>
    );
  }
);
