import { Request, Response } from 'express'
import { MonitoringQuerySchema } from '../schemas/appsHealth.validator'
import { getAppsHealthData } from '../services/appsHealth.service'
import mongoose from 'mongoose'

export async function getAppsHealthHandler(req: Request, res: Response) {
    const parsed = MonitoringQuerySchema.safeParse(req.query)
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() })
        return;
    }

    try {
        const userId = new mongoose.Types.ObjectId(parsed.data.userId)
        const summary = await getAppsHealthData(userId)
        res.json(summary)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Internal Server Error' })
    }
}