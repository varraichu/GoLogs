// src/components/Nav.tsx
import { h } from "preact";
import { route } from "preact-router";
import "ojs/ojtoolbar";
import "ojs/ojbutton";

type NavProps = {
  isAdmin: boolean;
  setIsAuthenticated: (value: boolean) => void;
};

const Nav = ({ isAdmin, setIsAuthenticated }: NavProps) => {
  const navItems = [
    { id: "dashboard", label: "Dashboard", path: "/dashboard" },
    { id: "settings", label: "Settings", path: "/settings" },
    { id: "applications", label: "Applications", path: "/applications" },
    { id: "logs", label: "Logs", path: "/logs" },
  ];

  if (isAdmin) {
    navItems.push({ id: "usergroups", label: "User Groups", path: "/usergroups" });
  }

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    setIsAuthenticated(false);
    const newUrl = window.location.origin + "/";
    window.history.replaceState({}, "", newUrl);
  };

  return (
    <header class="oj-flex oj-sm-align-items-center oj-sm-justify-content-space-between oj-sm-padding-2x oj-sm-border-bottom">
      <div class="oj-text-color-primary oj-typography-heading-sm">GoLogs</div>
      
      <oj-toolbar chroming="outlined" class="oj-flex oj-sm-justify-content-center">
        {navItems.map((item) => (
          <oj-button
            id={item.id}
            onojAction={() => route(item.path)}
            class="oj-sm-margin-end"
          >
            {item.label}
          </oj-button>
        ))}
      </oj-toolbar>

      <oj-button chroming="callToAction" onojAction={handleLogout}>
        Logout
      </oj-button>
    </header>
  );
};

export default Nav;
