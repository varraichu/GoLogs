// import mongoose from 'mongoose';
import Applications from '../models/Applications';
import UserGroupApplications from '../models/UserGroupApplications';
import UserGroupMembers from '../models/UserGroupMembers';
import UserGroups from '../models/UserGroups';
import Logs from '../models/Logs';
import { IUserGroupMember } from '../models/UserGroupMembers';


export const assignAppToGroups = async (appId: string, groupIds: string[]) => {
    // Validate: appId format
    const appExists = await Applications.exists({ _id: appId, is_deleted: false });
    if (!appExists) {
        throw { status: 404, message: `Application with ID ${appId} not found` };
    }

    const existingGroupCount = await UserGroups.countDocuments({ _id: { $in: groupIds }, is_deleted: false });
    if (existingGroupCount !== groupIds.length) {
        throw { status: 404, message: 'One or more user groups not found' };
    }

    // For each group, upsert the UserGroupApplications document
    const bulkOps = groupIds.map(groupId => ({
        updateOne: {
            filter: {
                app_id: appId,
                group_id: groupId,
            },
            update: {
                $set: { is_active: true },
                $setOnInsert: {
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
};



export const unassignAppFromGroup = async (appId: string, groupId: string) => {
    const appExists = await Applications.exists({ _id: appId, is_deleted: false });
    if (!appExists) {
        throw { status: 404, message: `Application with ID ${appId} not found` };
    }
    const groupExists = await UserGroups.exists({ _id: groupId, is_deleted: false });
    if (!groupExists) {
        throw { status: 404, message: `UserGroup with ID ${groupId} not found` };
    }


    const result = await UserGroupApplications.updateMany(
        { app_id: appId, group_id: groupId, is_active: true },
        { $set: { is_active: false } }
    );

    if (result.modifiedCount === 0) {
        throw { status: 404, message: 'No assignment found for given appId and groupId' };
    }
};

export const getAppAssignedGroups = async (appId: string) => {
    const appExists = await Applications.exists({ _id: appId, is_deleted: false });
    if (!appExists) {
        throw { status: 404, message: `Application with ID ${appId} not found` };
    }

    return await UserGroupApplications.find({ app_id: appId, is_active: true }).distinct('group_id');

};


export const getAllApps = async () => {
    let apps = await Applications.find({ is_deleted: false }).lean();

    const appsWithLogCount = await Promise.all(
        apps.map(async (app) => {
            const logCount = await Logs.countDocuments({ app_id: app._id });
            return { ...app, logCount };
        })
    );

    return appsWithLogCount;
    // (await apps).map
};