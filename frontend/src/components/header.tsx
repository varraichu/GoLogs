/**
 * @license
 * Copyright (c) 2014, 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
import { h } from "preact";
import { useRef, useState, useEffect } from "preact/hooks";
import * as ResponsiveUtils from "ojs/ojresponsiveutils";
import "ojs/ojtoolbar";
import "ojs/ojmenu";
import "ojs/ojbutton";
import { useUser } from '../context/UserContext';
import { Chatbot } from './Chatbot';

type Props = {
  appName: string,
  userLogin: string,
  setIsAuthenticated?: (value: boolean) => void
  setStartOpen: () => void
  setActiveItem: (str: string) => void
};

export function Header({ appName, userLogin, setIsAuthenticated, setStartOpen, setActiveItem }: Props) {
  const mediaQueryRef = useRef<MediaQueryList>(window.matchMedia(ResponsiveUtils.getFrameworkQuery("sm-only")!));

  const [isSmallWidth, setIsSmallWidth] = useState(mediaQueryRef.current.matches);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const { logout } = useUser();

  useEffect(() => {
    mediaQueryRef.current.addEventListener("change", handleMediaQueryChange);
    return (() => mediaQueryRef.current.removeEventListener("change", handleMediaQueryChange));
  }, [mediaQueryRef]);

  function handleMediaQueryChange(e: MediaQueryListEvent) {
    setIsSmallWidth(e.matches);
  }

  function getDisplayType() {
    return (isSmallWidth ? "icons" : "all");
  };

  function getEndIconClass() {
    return (isSmallWidth ? "oj-icon demo-appheader-avatar" : "oj-component-icon oj-button-menu-dropdown-icon");
  }

  const handleSignOut = async (e: Event) => {
    e.preventDefault()
    await logout() // 👈 this clears user + updates state
    window.history.replaceState({}, '', window.location.origin + '/')
    // route('/')     // 👈 optional: redirect to root after logout
  }

  const toggleChatbot = () => {
    setIsChatbotOpen(!isChatbotOpen);
  }

  return (
    <>
      <header role="banner" class="oj-web-applayout-header" style="padding: 0; margin: 0;">
        <div class="oj-web-applayout-max-width oj-flex-bar oj-sm-align-items-center oj-lg-12" style="padding-left: 0; margin-left: 0;">
          <div class="oj-flex-bar-middle oj-sm-align-items-baseline oj-sm-justify-content-start" style="padding-left: 0; margin-left: 0;">
            <oj-c-button
              id="buttonOpener"
              display="icons"
              onojAction={setStartOpen}
              label="Start"
              chroming="borderless"
            >
              <span slot="startIcon" class="oj-ux-ico-menu "></span>
            </oj-c-button>

            <h1 class="oj-typography-heading-md oj-text-color-primary">
              <a href="/dashboard" style="color: inherit; text-decoration: none;" onClick={() => { setActiveItem("dashboard") }}>
                <span class="oj-text-color-danger">Go</span>Logs
              </a>
            </h1>
            {/* <span
              role="img"
              class="oj-icon demo-oracle-icon"
              title="Oracle Logo"
              alt="Oracle Logo"></span> */}
            {/*<h1
              class="oj-sm-only-hide oj-web-applayout-header-title"
              title="Application Name">
              {appName}
            </h1> */}
          </div>
          <div class="oj-flex-bar-end">
            <oj-toolbar>
              {/* Chatbot Button */}
              <oj-c-button
                id="chatbotButton"
                display="icons"
                onojAction={toggleChatbot}
                label="Chat Assistant"
                chroming="borderless"
                title="Open Chat Assistant"
              >
                <span slot="startIcon" class="oj-ux-ico-chat"></span>
              </oj-c-button>

              <oj-menu-button id="userMenu" display={getDisplayType()} chroming="borderless">
                <span>{userLogin}</span>
                <span slot="endIcon" class={getEndIconClass()}></span>
                <oj-menu id="menu1" slot="menu">
                  {/* <oj-option id="pref" value="pref">Preferences</oj-option>
                <oj-option id="help" value="help">Help</oj-option>
                <oj-option id="about" value="about">About</oj-option> */}
                  <oj-option id="out" value="out" onClick={handleSignOut}>Sign Out</oj-option>
                </oj-menu>
              </oj-menu-button>
            </oj-toolbar>
          </div>
        </div>
      </header>

      {/* Chatbot Component */}
      {isChatbotOpen && (
        <Chatbot
          isOpen={isChatbotOpen}
          onClose={() => setIsChatbotOpen(false)}
        />
      )}
    </>
  );
}