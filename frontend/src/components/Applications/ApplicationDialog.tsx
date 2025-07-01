import "oj-c/dialog";
import "oj-c/input-text";
import "oj-c/text-area";
import "oj-c/button";
import "oj-c/select-multiple";
import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import { Application } from "./CardItem";
import MutableArrayDataProvider = require("ojs/ojmutablearraydataprovider");

type UserGroup = {
  _id: string;
  name: string;
  description: string;
  created_at: string;
  is_deleted: boolean;
};

type Props = {
  data: Application;
  isCLicked: boolean;
  closePopup: () => void;
};

export function ApplicationDialog({ data, isCLicked, closePopup }: Props) {
  const [appName, setAppName] = useState(data.name || "");
  const [description, setDescription] = useState(data.description || "");
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [assignedGroupIds, setAssignedGroupIds] = useState<any>(new Set([]));
  const [initialAssignedGroupIds, setInitialAssignedGroupIds] = useState<any>(new Set([]));

  useEffect(() => {
    if (!isCLicked) return;
    const token = localStorage.getItem('jwt'); 
    fetch("http://localhost:3001/api/userGroup/", {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        }
    })
      .then((res) => res.json())
      .then((groups) => {
        setUserGroups(groups)
        console.log("Fetched user groups:", groups);});
  }, [isCLicked]);

  useEffect(() => {
    if (!isCLicked || !data._id) return;
    fetch(`http://localhost:3001/api/apps/${data._id}/user-groups`)
      .then((res) => res.json())
      .then((res) => res.groupIds)
      .then((ids: string[]) => {
        setAssignedGroupIds(new Set(ids.map(String)));
        setInitialAssignedGroupIds(new Set(ids.map(String)));
      });
  }, [isCLicked, data._id, userGroups]);

  const groupOptions = userGroups
    .filter((g) => !g.is_deleted)
    .map((g) => ({
      value: String(g._id),
      text: g.name,
      description: g.description,
    }));

  const optionsData = new MutableArrayDataProvider(groupOptions, {
    keyAttributes: "value",
  });

  // Handle group assignment changes
  const handleAssignedGroupsChange = (e: CustomEvent) => {
    setAssignedGroupIds(e.detail.value || []);
  };

  const handleSave = async () => {
    if (!data._id) return;
    const appId = data._id;
    const token = localStorage.getItem('jwt');
    // Convert Sets to arrays if needed
    const prevIds = Array.from(initialAssignedGroupIds instanceof Set ? initialAssignedGroupIds : new Set(initialAssignedGroupIds));
    const newIds = Array.from(assignedGroupIds instanceof Set ? assignedGroupIds : new Set(assignedGroupIds));

    // Remove all previous assignments
    await Promise.all(
      prevIds.map((groupId: string) =>
        fetch(`http://localhost:3001/api/apps/${appId}/user-groups/${groupId}`, {
          method: "DELETE",
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        })
      )
    );

    // Assign new groups (if any)
    if (newIds.length > 0) {
      await fetch(`http://localhost:3001/api/apps/${appId}/user-groups`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ groupIds: newIds }),
      });
    }

    closePopup();
  }


  return (
    <oj-c-dialog id="dialog" dialog-title="Edit Application" opened={isCLicked}>
      <div slot="body" class="oj-sm-padding-4x">
        <h4 class="oj-typography-heading-sm">Application Details</h4>
        <oj-c-input-text
          label-hint="Application Name"
          value={appName}
          onvalueChanged={(e: any) => setAppName(e.detail.value)}
          class="oj-sm-margin-2x-vertical"
        ></oj-c-input-text>
        <oj-c-text-area
          label-hint="Description"
          value={description}
          onvalueChanged={(e: any) => setDescription(e.detail.value)}
          class="oj-sm-margin-2x-vertical"
        ></oj-c-text-area>
        <h4 class="oj-typography-heading-sm">Assigned To</h4>
  
        {/* Multi-select for assigning groups */}
        <oj-c-select-multiple
          label-hint="Assign to user groups"
          // value={ value} // Example default values
          value={assignedGroupIds}
          onvalueChanged={handleAssignedGroupsChange}
          data={optionsData}
          item-text="text"
          class="oj-sm-margin-2x-vertical"
        />
      </div>
      <div
        slot="footer"
        class="oj-flex oj-sm-justify-content-flex-end oj-sm-gap-2x"
      >
        <div>
        <oj-c-button onojAction={closePopup} label="Cancel"></oj-c-button>
        </div>
        <oj-c-button
          chroming="callToAction"
          onojAction={handleSave}
          label="Save"
        ></oj-c-button>
      </div>
    </oj-c-dialog>
  );
}
