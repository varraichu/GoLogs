// import mongoose from 'mongoose';
import Applications from '../models/Applications';
import UserGroupApplications from '../models/UserGroupApplications';
import UserGroupMembers from '../models/UserGroupMembers';
import UserGroups from '../models/UserGroups';
import { IUserGroupMember } from '../models/UserGroupMembers';


export const assignAppToGroups = async (appId: string, groupIds: string[]) => {
    // Validate: appId format
    const appExists = await Applications.exists({ _id: appId });
    if (!appExists) {
        throw { status: 404, message: `Application with ID ${appId} not found` };
    }

    const existingGroupCount = await UserGroups.countDocuments({ _id: { $in: groupIds } });
    if (existingGroupCount !== groupIds.length) {
        throw { status: 404, message: 'One or more user groups not found' };
    }

    for (const groupId of groupIds) {
        // Get all active users in this group
        const members: IUserGroupMember[] = await UserGroupMembers.find({ group_id: groupId, is_active: true });

        const bulkOps = members.map(member => ({
            updateOne: {
                filter: {
                    user_id: member.user_id,
                    app_id: appId,
                    group_id: groupId,
                },
                update: {
                    $setOnInsert: {
                        user_id: member.user_id,
                        app_id: appId,
                        group_id: groupId,
                    },
                },
                upsert: true,
            },
        }));

        if (bulkOps.length > 0) {
            await UserGroupApplications.bulkWrite(bulkOps);
        }
    }
};



export const unassignAppFromGroup = async (appId: string, groupId: string) => {
    const appExists = await Applications.exists({ _id: appId });
    if (!appExists) {
        throw { status: 404, message: `Application with ID ${appId} not found` };
    }
    const groupExists = await UserGroups.exists({ _id: groupId });
    if (!groupExists) {
        throw { status: 404, message: `UserGroup with ID ${groupId} not found` };
    }


    const deleted = await UserGroupApplications.deleteMany({ app_id: appId, group_id: groupId });

    if (deleted.deletedCount === 0) {
        throw { status: 404, message: 'No assignment found for given appId and groupId' };
    }
};

export const getAppAssignedGroups = async (appId: string) => {
    const appExists = await Applications.exists({ _id: appId });
    if (!appExists) {
        throw { status: 404, message: `Application with ID ${appId} not found` };
    }

    return await UserGroupApplications.find({ app_id: appId }).distinct('group_id');

};


export const getAllApps = async () => {
    return Applications.find();
};