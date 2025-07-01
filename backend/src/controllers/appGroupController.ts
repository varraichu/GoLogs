import { assignAppToGroups, unassignAppFromGroup, getAppAssignedGroups,getAllApps } from "../services/appGroupService"
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';



export const assignToGroups = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { appId } = req.params;
    const { groupIds } = req.body;
    try {
        if (!mongoose.Types.ObjectId.isValid(appId)) {
            throw { status: 400, message: 'Invalid appId format' };
        }
        if (!Array.isArray(groupIds) || groupIds.length === 0 || groupIds.some(id => !mongoose.Types.ObjectId.isValid(id))) {
            throw { status: 400, message: 'Invalid groupIds format or values' };
        }

        await assignAppToGroups(appId, groupIds);
        res.status(200).json({ message: 'Application assigned to groups successfully!' });
    } catch (error) {
        const err = error as Error;
        res.status((err as any).status || 500).json({ error: 'Assignment failed', details: err.message || "Server Error" });
    }
};

export const unassignFromGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { appId, groupId } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(appId) || !mongoose.Types.ObjectId.isValid(groupId)) {
            throw { status: 400, message: 'Invalid appId or groupId format' };
        }
        await unassignAppFromGroup(appId, groupId);
        res.status(200).json({ message: 'Unassigned successfully' });
    } catch (error) {
        const err = error as Error
        res.status((err as any).status || 500).json({ error: 'Unassignment failed', details: err.message || "Server Error" });
    }
};

export const getAssignedGroups = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { appId } = req.params;
    try {
        if (!mongoose.Types.ObjectId.isValid(appId)) {
            throw { status: 400, message: 'Invalid appId format' };
        }
        const groups = await getAppAssignedGroups(appId);
        res.status(200).json({ groupIds: groups });
    } catch (error) {
        const err = error as Error
        res.status((err as any).status || 500).json({ error: 'Could not fetch group assignments', details: err.message || "Server Error" });
    }
};

export const getApps = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const apps = await getAllApps();
        res.status(200).json(apps);
    } catch (error) {
        res.status(500).json({ error: 'Could not fetch applications' });
    }
};