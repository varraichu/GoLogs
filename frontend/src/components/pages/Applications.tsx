// File: src/pages/Applications.tsx
import { h } from 'preact';
import { useEffect, useRef, useState, useMemo } from "preact/hooks";
import 'ojs/ojdialog';
import 'ojs/ojswitch';
import "oj-c/button";
import "oj-c/input-text";
import "oj-c/form-layout";
import 'oj-c/select-multiple';
import 'oj-c/card-view';
// import { CCardViewElement } from "oj-c/card-view";


import 'ojs/ojselector';
import 'ojs/ojlistitemlayout';
import 'ojs/ojavatar';
import 'ojs/ojlistview';
import 'ojs/ojbutton';
import 'ojs/ojtoolbar';


import LengthValidator = require('ojs/ojvalidator-length');
import MutableArrayDataProvider = require('ojs/ojmutablearraydataprovider');

import ArrayDataProvider = require('ojs/ojarraydataprovider');

interface Application {
    _id: string;
    name: string;
    description: string;
    created_at: string;
    is_active: boolean;
    groupCount: number;
    groupNames: string[];
    logCount: number;
}

interface UserGroup {
    _id: string
    name: string
    description: string
    created_at: string
    is_deleted: boolean

}


const Applications = (props: { path?: string }) => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [showDialog, setShowDialog] = useState(false);
    const [editingApplication, setEditingApplication] = useState<Application | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [errors, setErrors] = useState<{ name?: string; description?: string }>({});
    const nameRef = useRef<any>(null);
    const descRef = useRef<any>(null);
    const [userGroups, setUserGroups] = useState<UserGroup[]>([])
    const [appUserGroups, setAppUserGroups] = useState<string[]>([]);
    const [assignedGroupIds, setAssignedGroupIds] = useState<any>(new Set([]))
    const [initialAssignedGroupIds, setInitialAssignedGroupIds] = useState<any>(new Set([]))

    const [dataProvider, setDataProvider] = useState<any>(null);


    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {

            const token = localStorage.getItem('jwt');

            const res = await fetch("http://localhost:3001/api/applications/", {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });
            const data = await res.json();
            setApplications(data.applications || []);
            setDataProvider(new ArrayDataProvider(data.applications || [], { keyAttributes: '_id' }));
            console.log("Fetched: ", dataProvider);
        } catch (error) {
            console.error("Failed to fetch applications", error);
        }
    };


    const openDialog = async (application?: Application) => {
        if (application) {
            setEditingApplication(application);
            setName(application.name || "");
            setDescription(application.description || "");

        } else {
            setEditingApplication(null);
            setName("");
            setDescription("");
        }
        await fetchAllUserGroups();
        await fetchAppUserGroups(application?._id || "");
        setShowDialog(true);
    };

    const saveApplication = async () => {
        console.log("Saving application:", name, description);
        const nameResult = await nameRef.current.validate();
        const descResult = await descRef.current.validate();

        if (nameResult !== 'valid' || descResult !== 'valid') {
            // Optionally force message visibility
            nameRef.current.showMessages?.();
            descRef.current.showMessages?.();
            return;
        }
        const token = localStorage.getItem('jwt');
        const body = JSON.stringify({ name, description });

        try {
            if (editingApplication) {
                console.log("Editing application:", editingApplication._id);
                await fetch(`http://localhost:3001/api/applications/${editingApplication._id}`, {
                    method: "PATCH",
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body,
                });
            } else {
                await fetch("http://localhost:3001/api/applications/", {
                    method: "POST",
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body,
                });
            }

            try {
                await assignGroups(editingApplication?._id || "");

            } catch (error) {
                console.error("Failed to assign groups:", error);
            }

            setShowDialog(false);
            setErrors({});
            fetchApplications();
        } catch (error) {
            console.error("Failed to save application", error);
        }
    };


    const deleteGroup = async (applicationId: string) => {
        try {

            const token = localStorage.getItem('jwt');
            if (confirm("Are you sure you want to delete this applications?")) {
                await fetch(`http://localhost:3001/api/applications/${applicationId}`, {
                    method: "DELETE",
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                fetchApplications();
            }
        } catch (error) {
            console.error("Failed to delete application", error);
        }
    };

    const handleToggleApplicationStatus = async (appId: string, isActive: boolean) => {
        const token = localStorage.getItem('jwt');

        try {
            const res = await fetch(`http://localhost:3001/api/applications/status/${appId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ is_active: isActive }),
            });

            if (res.ok) {
                fetchApplications(); // Refresh UI
            } else {
                console.error('Failed to toggle application status');
            }
        } catch (error) {
            console.error('Error toggling status:', error);
        }
    };

    const fetchAllUserGroups = async () => {
        const token = localStorage.getItem('jwt');
        try {
            fetch('http://localhost:3001/api/userGroup/', {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })
                .then((res) => res.json())
                .then((groups) => {
                    setUserGroups(groups)
                    console.log('Fetched user groups:', groups)
                })

        } catch (error) {
            console.error('Error fetching usergroups:', error);
        }
    }

    const fetchAppUserGroups = async (appId: string) => {
        const token = localStorage.getItem('jwt');
        try {
            fetch(`http://localhost:3001/api/assignGroup/${appId}/user-groups`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })
                .then((res) => res.json())
                .then((res) => {
                    const validIds = (res.groupIds || [])
                        .map(String)
                        .filter((id: string) => userGroups.some((g) => String(g._id) === id))
                    setAssignedGroupIds(new Set(validIds))
                    setInitialAssignedGroupIds(new Set(validIds))
                    // setUserGroups2 // Update parent component state if needed
                    if (setAppUserGroups) {
                        const assignedNames = userGroups
                            .filter((g) => validIds.includes(String(g._id)))
                            .map((g) => g.name)
                        setAppUserGroups(assignedNames)
                    }
                })

        } catch (error) {
            console.error('Error fetching App usergroups:', error);
        }
    }

    const optionsData = useMemo(() => {
        const groupOptions = userGroups
            .filter((g) => !g.is_deleted)
            .map((g) => ({
                value: String(g._id),
                text: g.name,
                description: g.description,
            }))
        return new MutableArrayDataProvider(groupOptions, {
            keyAttributes: 'value',
        })
    }, [userGroups]);

    const handleAssignedGroupsChange = (e: CustomEvent) => {
        setAssignedGroupIds(e.detail.value || [])
    }

    const assignGroups = async (appId: string) => {
        if (!appId) return
        const token = localStorage.getItem('jwt')
        // Convert Sets to arrays if needed
        const prevIds = Array.from(
            initialAssignedGroupIds instanceof Set
                ? initialAssignedGroupIds
                : new Set(initialAssignedGroupIds)
        )
        const newIds = Array.from(
            assignedGroupIds instanceof Set ? assignedGroupIds : new Set(assignedGroupIds)
        )
        try {
            await Promise.all(
                prevIds.map((groupId: string) =>
                    fetch(`http://localhost:3001/api/assignGroup/${appId}/user-groups/${groupId}`, {
                        method: 'DELETE',
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    })
                )
            )
            console.log(newIds, 'newIds')
            // Assign new groups (if any)
            if (newIds.length > 0) {
                await fetch(`http://localhost:3001/api/assignGroup/${appId}/user-groups`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ groupIds: newIds }),
                })
            }
        }
        catch (error) {
            console.error("Failed to assign groups", error);
        }
    };

    return (
        <div class="oj-flex oj-sm-padding-4x">
            <div class="oj-flex oj-sm-12 oj-sm-margin-4x oj-sm-justify-content-space-between oj-sm-align-items-center">
                <div class="" >
                    <h1 class="oj-typography-heading-lg">Applications</h1>
                    <p class="oj-typography-body-md">Manage your applications</p>
                </div>
                <div>
                    <oj-button onojAction={() => openDialog()} chroming="callToAction">+ Create Application</oj-button>
                </div>
            </div>


            <div class="oj-flex oj-flex-wrap oj-flex-space-" style={"gap: 24px"}>
                {(applications || []).map((app) => (
                    <div
                        key={app._id}
                        class="oj-panel oj-panel-shadow-md"
                        style="
        border: 1px solid #e5e7eb; 
        border-radius: 12px; 
        padding: 20px 20px 16px 20px; 
        max-width: 400px; 
        min-width: 400px; 
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    "
                    >
                        {/* Header: Name + Toggle */}
                        <div
                            class="oj-flex"
                            style="
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
            width: 100%;
        "
                        >
                            <div style="flex: 1; display: flex; align-items: center;">
                                <h3 class="oj-typography-heading-sm" style="margin: 0; flex: 1; word-break: break-word;">
                                    {app.name}
                                </h3>
                                <span
                                    class="oj-typography-body-xs"
                                    style={`
                margin-left: 12px;
                padding: 2px 10px;
                font-weight: 500;
                color: ${app.is_active ? '#065f46' : '#991b1b'};
                font-size: 0.85em;
            `}
                                >
                                    {app.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div style="flex: 0;">
                                <oj-switch
                                    value={app.is_active}
                                    onvalueChanged={(e) =>
                                        handleToggleApplicationStatus(app._id, e.detail.value as boolean)}
                                />
                            </div>
                        </div>

                        <p
                            class="oj-typography-body-sm oj-text-color-secondary oj-sm-margin-b-2x"
                            style="overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;"
                        >
                            {app.description}
                        </p>

                        <div
                            class="oj-flex"
                            style="justify-content: space-between; align-items: stretch; gap: 32px; margin-bottom: 24px;"
                        >
                            {/* Logs column */}
                            <div style="display: flex; flex-direction: column; align-items: flex-start;
                            background-color: rgba(243, 243, 243, 0.6); padding: 8px; border-radius: 8px; flex: 1;">
                                <div class="oj-typography-body-sm oj-text-color-secondary">Logs</div>
                                <div class="oj-typography-heading-md">{app.logCount.toLocaleString()}</div>
                            </div>
                            {/* Groups column */}
                            <div style="display: flex; flex-direction: column; align-items: flex-start;
                            background-color: rgba(243, 243, 243,0.6); padding: 8px; border-radius: 8px; flex: 1;">
                                <div class="oj-typography-body-sm oj-text-color-secondary">Groups</div>
                                <div class="oj-typography-heading-md">{app.groupCount.toLocaleString()}</div>
                            </div>
                        </div>


                        <div class="oj-sm-margin-b-4x" style="margin-bottom: 12px;">
                            <p class="oj-typography-body-sm oj-text-color-secondary" style="margin-bottom: 4px;">Assigned To</p>
                            <div class="oj-flex oj-sm-flex-wrap" style="margin-top: 0;">
                                {app.groupNames.slice(0, 2).map((group, index) => (
                                    <span
                                        key={index}
                                        class="oj-typography-body-xs"
                                        style="color:rgb(25, 85, 160); background-color:rgb(220, 235, 255); padding: 4px 8px; margin: 2px; border-radius: 20px;"
                                    >
                                        {group}
                                    </span>
                                ))}
                                {app.groupNames.length > 2 && (
                                    <span
                                        class="oj-typography-body-xs"
                                        style="color:rgb(0, 0, 0); background-color:rgb(243, 243, 243); padding: 4px 8px; margin: 2px; border-radius: 20px;"
                                    >
                                        +{app.groupNames.length - 2}
                                    </span>
                                )}
                            </div>
                        </div>



                        {/* Footer: Created At and Buttons */}
                        <div
                            class="oj-flex"
                            style="justify-content: space-between; align-items: center; gap: 12px; margin-top: auto;"
                        >
                            <div class="oj-typography-body-xs oj-text-color-secondary">
                                Created {new Date(app.created_at).toLocaleString()}
                            </div>
                            <div class="oj-flex" style="gap: 12px;">
                                <oj-button
                                    chroming="borderless"
                                    onojAction={() => openDialog(app)}
                                >
                                    Edit
                                </oj-button>
                                <oj-button
                                    chroming="danger"
                                    onojAction={() => deleteGroup(app._id)}
                                >
                                    Delete
                                </oj-button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>



            {showDialog && (
                <oj-dialog id="groupDialog" dialogTitle={editingApplication ? "Edit Group" : "Create Group"} initialVisibility="show">
                    <div class="oj-dialog-body">
                        <oj-c-form-layout>
                            <oj-c-input-text
                                id="name-input"
                                labelHint="Name"
                                value={name}
                                ref={nameRef}
                                onvalueChanged={(e) => setName(e.detail.value)}
                                validators={[new LengthValidator({ min: 5, max: 20 })]}
                            >
                            </oj-c-input-text>
                            <oj-c-input-text
                                labelHint="Description"
                                value={description}
                                ref={descRef}
                                onvalueChanged={(e) => setDescription(e.detail.value)}
                                validators={[new LengthValidator({ min: 5, max: 50 })]}
                            >

                            </oj-c-input-text>
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
                            ></oj-c-select-multiple>
                        </oj-c-form-layout>
                    </div>
                    <div class="oj-dialog-footer">
                        <oj-button onojAction={() => saveApplication()}>Save</oj-button>
                        <oj-button
                            onojAction={() => {
                                setShowDialog(false);
                                setErrors({});
                            }
                            }
                            chroming="borderless">Cancel</oj-button>
                    </div>
                </oj-dialog>
            )}


            {/* <CardView application={applications} /> */}


        </div>
    );
};
export default Applications;
