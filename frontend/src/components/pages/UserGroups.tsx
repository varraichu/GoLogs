import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import 'ojs/ojbutton';
import 'ojs/ojdialog';
import 'ojs/ojformlayout';
import 'ojs/ojinputtext';


interface UserGroup {
  _id: string;
  name: string;
  description: string;
  created_at: string;
  userCount: number;
  applicationCount: number;
  applicationNames: string[];
}

const UserGroups = (props: { path?: string }) => {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    const token = localStorage.getItem('jwt'); 

    const res = await fetch("http://localhost:3001/api/userGroup/", {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        }
    });
    const data = await res.json();
    setGroups(data);
  };

  const openDialog = (group?: UserGroup) => {
    if (group) {
      setEditingGroup(group);
      setName(group.name || "");
      setDescription(group.description || "");
    
    } else {
      setEditingGroup(null);
      setName("");
      setDescription("");
    }
    setShowDialog(true);
  };

  const saveGroup = async () => {
    const token = localStorage.getItem('jwt'); 
    const body = JSON.stringify({ name, description });
    if (editingGroup) {
        
      await fetch(`http://localhost:3001/api/userGroup/${editingGroup._id}`, {
        method: "PATCH",
        headers: { 
            'Authorization': `Bearer ${token}`,
            "Content-Type": "application/json" 
        },
        body,
      });
    } else {
      await fetch("http://localhost:3001/api/userGroup/", {
        method: "POST",
        headers: { 
            'Authorization': `Bearer ${token}`,
            "Content-Type": "application/json" 
        },
        body,
      });
    }
    setShowDialog(false);
    fetchGroups();
  };

  const deleteGroup = async (groupId: string) => {
    const token = localStorage.getItem('jwt'); 
    if (confirm("Are you sure you want to delete this group?")) {
      await fetch(`http://localhost:3001/api/userGroup/${groupId}`, { 
        method: "DELETE",
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        });
        fetchGroups();
    }
  };

  return (
    <div class="oj-flex oj-sm-padding-4x">
      <div class="oj-flex oj-sm-12 oj-sm-margin-4x oj-sm-justify-content-space-between">
        <div class="oj-panel" >
            <h1 class="oj-typography-heading-lg">User Groups</h1>
            <p class="oj-typography-body-md">Manage user groups and their application access</p>
        </div>
        <div>
            <oj-button onojAction={() => openDialog()} chroming="callToAction">+ Create Group</oj-button>
        </div>
      </div>

        <div class="oj-flex oj-sm-flex-wrap oj-sm-justify-content-center oj-sm-padding-4x">
            {groups.map((group) => (
                <div
                class="oj-sm-12 oj-md-4 oj-flex-item oj-panel oj-panel-shadow-md oj-sm-margin-4x"
                style="border: 1px solid #ccc; border-radius: 12px; padding: 24px; min-width: 280px; max-width: 360px; display: flex; flex-direction: column; justify-content: space-between;"
                >
                <div>
                    <div class="oj-typography-heading-sm oj-sm-margin-bottom-2x">{group.name}</div>
                    <div class="oj-typography-body-sm oj-sm-margin-bottom-2x">{group.description}</div>
                    <div class="oj-typography-body-xs oj-sm-margin-bottom">👤 Users: {group.userCount}</div>
                    <div class="oj-typography-body-xs oj-sm-margin-bottom">📦 Apps: {group.applicationCount}</div>
                </div>

                <div class="oj-flex oj-sm-justify-content-space-between oj-sm-margin-top-2x">
                    <oj-button display="icons" onojAction={() => openDialog(group)} class="oj-sm-margin-end">
                    Edit
                    </oj-button>
                    <oj-button display="icons" chroming="danger" onojAction={() => deleteGroup(group._id)}>
                    Delete
                    </oj-button>
                </div>
                </div>
            ))}
        </div>

      {showDialog && (
        <oj-dialog id="groupDialog" dialogTitle={editingGroup ? "Edit Group" : "Create Group"} initialVisibility="show">
          <div class="oj-dialog-body">
            <oj-form-layout>
              <oj-input-text id="name-input" labelHint="Name" value={name} onvalueChanged={(e) => setName(e.detail.value)}></oj-input-text>
              <oj-input-text labelHint="Description" value={description} onvalueChanged={(e) => setDescription(e.detail.value)}></oj-input-text>
            </oj-form-layout>
          </div>
          <div class="oj-dialog-footer">
            <oj-button onojAction={() => saveGroup()}>Save</oj-button>
            <oj-button onojAction={() => setShowDialog(false)} chroming="borderless">Cancel</oj-button>
          </div>
        </oj-dialog>
      )}
    </div>
  );
};

export default UserGroups;
