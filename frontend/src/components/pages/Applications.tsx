// File: src/pages/Applications.tsx
import { h } from 'preact';
import { useEffect, useState } from "preact/hooks";
import 'ojs/ojbutton';
import 'ojs/ojdialog';
import 'ojs/ojformlayout';
import 'ojs/ojinputtext';
import 'ojs/ojswitch';
import { applicationFormSchema } from '../../validation/application';

interface Application {
    _id: string;
    name: string;
    description: string;
    created_at: string;
    is_active: boolean;
    groupCount: number;
    groupNames: string[];
}

const Applications = (props: { path?: string }) => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [showDialog, setShowDialog] = useState(false);
    const [editingApplication, setEditingApplication] = useState<Application | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [errors, setErrors] = useState<{ name?: string; description?: string }>({});


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
            setApplications(data.applications);
            console.log("Fetched: ", applications);
        } catch (error) {
            console.error("Failed to fetch applications", error);
        }
    };

    const openDialog = (application?: Application) => {
        if (application) {
            setEditingApplication(application);
            setName(application.name || "");
            setDescription(application.description || "");

        } else {
            setEditingApplication(null);
            setName("");
            setDescription("");
        }
        setShowDialog(true);
    };

    const saveApplication = async () => {
        if (!validateForm()) return;

        const token = localStorage.getItem('jwt');
        const body = JSON.stringify({ name, description });

        try {
            if (editingApplication) {
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

    const validateForm = () => {
        const result = applicationFormSchema.safeParse({ name, description });

        if (!result.success) {
            const fieldErrors: { name?: string; description?: string } = {};
            const formatted = result.error.format();

            if (formatted.name?._errors?.length) {
                fieldErrors.name = formatted.name._errors[0];
            }
            if (formatted.description?._errors?.length) {
                fieldErrors.description = formatted.description._errors[0];
            }

            setErrors(fieldErrors);
            return false;
        }

        setErrors({});
        return true;
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

            <div class="oj-flex oj-sm-flex-wrap oj-sm-justify-content-center oj-sm-padding-4x ">
                {applications.map((application) => (
                    <div
                        class="oj-sm-12 oj-md-4 oj-flex-item oj-panel oj-panel-shadow-md oj-sm-margin-4x"
                        style="border: 1px solid #ccc; border-radius: 12px; padding: 24px; min-width: 280px; max-width: 360px; display: flex; flex-direction: column; justify-content: space-between;"
                    >
                        <div>
                            <div class="oj-typography-heading-sm oj-sm-margin-bottom-2x">{application.name}</div>
                            <div class="oj-typography-body-sm oj-sm-margin-bottom-2x">{application.description}</div>
                            <div class="oj-typography-body-xs oj-sm-margin-bottom">👤 Users: {application.groupCount}</div>
                        </div>
                        <div class="oj-sm-margin-4x">
                            {application.groupNames.map((group) => (
                                <span class="oj-badge oj-badge-subtle oj-sm-margin-2x">{group}</span>
                            ))}
                        </div>

                        <div>
                            <oj-switch
                                value={application.is_active}
                                onvalueChanged={(e) =>
                                    handleToggleApplicationStatus(application._id, e.detail.value as boolean)
                                }
                                class="oj-sm-margin-end"
                            />
                        </div>
                        <div class="oj-flex oj-sm-justify-content-space-between oj-sm-margin-top-2x">
                            <oj-button display="icons" onojAction={() => openDialog(application)} class="oj-sm-margin-end">
                                Edit
                            </oj-button>
                            <oj-button display="icons" chroming="danger" onojAction={() => deleteGroup(application._id)}>
                                Delete
                            </oj-button>
                        </div>
                    </div>
                ))}
            </div>

            {showDialog && (
                <oj-dialog id="groupDialog" dialogTitle={editingApplication ? "Edit Group" : "Create Group"} initialVisibility="show">
                    <div class="oj-dialog-body">
                        <oj-form-layout>
                            <oj-input-text
                                id="name-input"
                                labelHint="Name"
                                value={name}
                                onvalueChanged={(e) => setName(e.detail.value)}
                                messagesCustom={
                                    errors.name
                                        ? [{ severity: 'error', summary: errors.name, detail: errors.name }]
                                        : []
                                }
                            >
                            </oj-input-text>
                            <oj-input-text
                                labelHint="Description"
                                value={description}
                                onvalueChanged={(e) => setDescription(e.detail.value)}
                                messagesCustom={
                                    errors.description
                                        ? [{ severity: 'error', summary: errors.description, detail: errors.description }]
                                        : []
                                }
                            >

                            </oj-input-text>
                        </oj-form-layout>
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
        </div>
    );
};
export default Applications;
