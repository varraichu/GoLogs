import { h } from 'preact';
import { useState, useMemo, useEffect } from 'preact/hooks';
import 'oj-c/select-single';
import 'ojs/ojselectcombobox';
import 'oj-c/button';
import ArrayDataProvider = require('ojs/ojarraydataprovider');
import { fetchApplications, Application } from '../../../services/usergroups.services';

type Props = {
    onFilterChange: (filters: { status: string; appIds: string[] }) => void;
};

export const UserGroupFilters = ({ onFilterChange }: Props) => {
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [selectedApps, setSelectedApps] = useState<string[]>([]);
    const [allApps, setAllApps] = useState<Application[]>([]);

    useEffect(() => {
        const loadApps = async () => {
            try {
                const apps = await fetchApplications();
                setAllApps(apps);
            } catch (error) {
                console.error("Failed to fetch applications for filter", error);
            }
        };
        loadApps();
    }, []);

    const statusOptions = useMemo(() => {
        return new ArrayDataProvider([
            { value: 'all', label: 'All Statuses' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
        ], { keyAttributes: 'value' });
    }, []);

    const appOptions = useMemo(() => {
        return new ArrayDataProvider(
            allApps.map(app => ({ value: app._id, label: app.name })),
            { keyAttributes: 'value' }
        );
    }, [allApps]);

    const handleStatusChange = (e: CustomEvent) => {
        const newStatus = e.detail.value || 'all';
        setSelectedStatus(newStatus);
        onFilterChange({ status: newStatus, appIds: selectedApps });
    };

    const handleAppChange = (e: CustomEvent) => {
        const newApps = e.detail.value || [];
        setSelectedApps(newApps);
        onFilterChange({ status: selectedStatus, appIds: newApps });
    };

    const handleClearFilters = () => {
        setSelectedStatus('all');
        setSelectedApps([]);
        onFilterChange({ status: 'all', appIds: [] });
    };

    return (


        <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-flex-start oj-sm-padding-4x-start oj-sm-padding-4x-end">

            <div class="oj-flex-item oj-sm-flex-1 oj-sm-padding-2x-bottom" >
                {/* User Group Filter */}

                <oj-select-many
                    class="oj-form-control-width-sm"
                    labelHint="Filter by Application"
                    options={appOptions}
                    onvalueChanged={handleAppChange}
                    value={selectedApps}
                    item-text="label"
                ></oj-select-many>
            </div>

            {/* Status Filter */}
            <div class="oj-flex-item oj-sm-flex-1 oj-sm-padding-2x-bottom" >
                <oj-c-select-single
                    class="oj-form-control-width-sm"
                    // class="oj-flex-item oj-sm-margin-4x-end oj-sm-margin-2x-top"
                    // style="width: 200px; height: 2.375rem; flex-grow: 0;"
                    labelHint="Status"
                    data={statusOptions}
                    onvalueChanged={handleStatusChange}
                    value={selectedStatus}
                    item-text="label"
                ></oj-c-select-single>
            </div>


            {/* Clear Button */}
            {/* <div class="oj-flex-item oj-sm-flex-1 oj-sm-padding-2x-bottom" > */}
            <oj-c-button
                class="oj-form-control-width-sm"
                onojAction={handleClearFilters}
                label="Clear Filters"
                chroming="outlined"
            // style="height: 2.375rem;"
            ></oj-c-button>

        </div>
    );


};