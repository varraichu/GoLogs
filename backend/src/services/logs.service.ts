// File: services/logs.service.ts
import UserGroupMembers from '../models/UserGroupMembers';
import Log from '../models/Logs';
import UserGroupApplications from '../models/UserGroupApplications';
import mongoose from 'mongoose';

interface SortCriteria {
  field: string;
  direction: 'asc' | 'desc';
}

interface PaginationOptions {
  page: number;
  limit: number;
  sortCriteria?: SortCriteria[];
  filters?: {
    log_type?: string | string[];
    app_name?: string | string[];
    startDate?: string;
    endDate?: string;
    search?: string;
  };
}

const buildSortObject = (sortCriteria: SortCriteria[]): Record<string, 1 | -1> => {
  const sortObj: Record<string, 1 | -1> = {};

  sortCriteria.forEach((criteria) => {
    let sortField = criteria.field;

    // Map frontend field names to database field names
    switch (criteria.field) {
      case 'app_name':
        sortField = 'application.name';
        break;
      case 'log_type':
        sortField = 'log_type';
        break;
      case 'message':
        sortField = 'message';
        break;
      case 'timestamp':
        sortField = 'timestamp';
        break;
      case 'ingested_at':
        sortField = 'ingested_at';
        break;
      default:
        sortField = criteria.field;
    }

    sortObj[sortField] = criteria.direction === 'asc' ? 1 : -1;
  });

  return sortObj;
};

export const fetchPaginatedLogsWithAppInfo = async ({
  page,
  limit,
  sortCriteria = [{ field: 'timestamp', direction: 'desc' }],
  filters = {},
}: PaginationOptions) => {
  const skip = (page - 1) * limit;
  const sortObj = buildSortObject(sortCriteria);

  const match: any = {};

  if (filters.log_type) {
    match.log_type = Array.isArray(filters.log_type) ? { $in: filters.log_type } : filters.log_type;
  }
  if (filters.startDate || filters.endDate) {
    match.timestamp = {};
    if (filters.startDate) match.timestamp.$gte = new Date(filters.startDate);
    if (filters.endDate) match.timestamp.$lte = new Date(filters.endDate);
  }

  if (filters.search) {
    const trimmedSearch = filters.search.trim();

    if (trimmedSearch) {
      const keywords = trimmedSearch.split(/\s+/).filter((k) => !!k);

      if (keywords.length === 1) {
        const escaped = trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = { $regex: escaped, $options: 'i' };

        match.$or = [{ message: regex }, { log_type: regex }];
      } else {
        // Multi-keyword AND across all fields
        const regexConditions = keywords.map((kw) => {
          const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = { $regex: escaped, $options: 'i' };

          return {
            $or: [{ message: regex }, { log_type: regex }],
          };
        });

        match.$and = regexConditions;
      }
    }
  }

  // if (filters.search) {
  //   // Trim trailing and leading spaces
  //   const trimmedSearch = filters.search.trim();

  //   // Only proceed if there's something to search after trimming
  //   if (trimmedSearch) {
  //     // Split by spaces and filter out empty strings
  //     const keywords = trimmedSearch.split(/\s+/).filter((keyword) => keyword.length > 0);

  //     if (keywords.length === 1) {
  //       // Single keyword - use simple regex
  //       const escapedSearch = keywords[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  //       match.message = { $regex: escapedSearch, $options: 'i' };
  //     } else if (keywords.length > 1) {
  //       // Multiple keywords - all must be present (AND logic)
  //       const regexConditions = keywords.map((keyword) => {
  //         const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  //         return { message: { $regex: escapedKeyword, $options: 'i' } };
  //       });

  //       match.$and = regexConditions;
  //     }
  //   }
  // }

  // const hasSpecialChars = /[^a-zA-Z0-9\s]/.test(filters.search ?? '');

  // if (filters.search) {
  //   if (hasSpecialChars) {
  //     match.message = { $regex: filters.search, $options: 'i' };
  //   } else {
  //     match.$text = { $search: filters.search };
  //   }
  // }

  const appMatch: any = { 'application.is_active': true };
  if (filters.app_name) {
    appMatch['application.name'] = Array.isArray(filters.app_name)
      ? { $in: filters.app_name }
      : filters.app_name;
  }

  const [logs, total] = await Promise.all([
    Log.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'applications',
          localField: 'app_id',
          foreignField: '_id',
          as: 'application',
        },
      },
      { $unwind: '$application' },
      { $match: appMatch },
      { $sort: sortObj },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          message: 1,
          timestamp: 1,
          log_type: 1,
          ingested_at: 1,
          app_id: 1,
          app_name: '$application.name',
        },
      },
    ]),
    Log.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'applications',
          localField: 'app_id',
          foreignField: '_id',
          as: 'application',
        },
      },
      { $unwind: '$application' },
      { $match: appMatch },
      { $count: 'total' },
    ]).then((result) => result[0]?.total || 0),
  ]);

  return {
    logs,
    total,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: skip + logs.length < total,
      hasPrevPage: page > 1,
    },
  };
};

interface UserLogsPaginationOptions {
  userId: string;
  page: number;
  limit: number;
  sortCriteria?: SortCriteria[];
  filters?: {
    log_type?: string | string[];
    app_name?: string | string[];
    startDate?: string;
    endDate?: string;
    search?: string;
  };
}

export const fetchUserLogsWithAppInfo = async ({
  userId,
  page,
  limit,
  sortCriteria = [{ field: 'timestamp', direction: 'desc' }],
  filters = {},
}: UserLogsPaginationOptions) => {
  const skip = (page - 1) * limit;
  const sortObj = buildSortObject(sortCriteria);

  const userGroups = await UserGroupMembers.find({
    user_id: userId,
    is_active: true,
  }).select('group_id');

  const groupIds = userGroups.map((g) => g.group_id as mongoose.Types.ObjectId);

  if (groupIds.length === 0) {
    return {
      logs: [],
      total: 0,
      pagination: {
        page,
        limit,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }

  const userGroupApps = await UserGroupApplications.find({
    group_id: { $in: groupIds },
    is_active: true,
  }).select('app_id');

  const appIds = userGroupApps.map((g) => g.app_id as mongoose.Types.ObjectId);

  if (appIds.length === 0) {
    return {
      logs: [],
      total: 0,
      pagination: {
        page,
        limit,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }

  const match: any = {
    app_id: { $in: appIds },
  };

  if (filters.log_type) {
    match.log_type = Array.isArray(filters.log_type) ? { $in: filters.log_type } : filters.log_type;
  }
  if (filters.startDate || filters.endDate) {
    match.timestamp = {};
    if (filters.startDate) match.timestamp.$gte = new Date(filters.startDate);
    if (filters.endDate) match.timestamp.$lte = new Date(filters.endDate);
  }

  if (filters.search) {
    const trimmedSearch = filters.search.trim();

    if (trimmedSearch) {
      const keywords = trimmedSearch.split(/\s+/).filter((k) => !!k);

      if (keywords.length === 1) {
        const escaped = trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = { $regex: escaped, $options: 'i' };

        match.$or = [{ message: regex }, { log_type: regex }];
      } else {
        const regexConditions = keywords.map((kw) => {
          const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = { $regex: escaped, $options: 'i' };

          return {
            $or: [{ message: regex }, { log_type: regex }],
          };
        });

        match.$and = regexConditions;
      }
    }
  }

  // if (filters.search) {
  //   // Trim trailing and leading spaces
  //   const trimmedSearch = filters.search.trim();

  //   // Only proceed if there's something to search after trimming
  //   if (trimmedSearch) {
  //     // Split by spaces and filter out empty strings
  //     const keywords = trimmedSearch.split(/\s+/).filter((keyword) => keyword.length > 0);

  //     if (keywords.length === 1) {
  //       // Single keyword - use simple regex
  //       const escapedSearch = keywords[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  //       match.message = { $regex: escapedSearch, $options: 'i' };
  //     } else if (keywords.length > 1) {
  //       // Multiple keywords - all must be present (AND logic)
  //       const regexConditions = keywords.map((keyword) => {
  //         const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  //         return { message: { $regex: escapedKeyword, $options: 'i' } };
  //       });

  //       match.$and = regexConditions;
  //     }
  //   }
  // }

  // if (filters.search) {
  //   // Trim trailing and leading spaces
  //   const trimmedSearch = filters.search.trim();

  //   // Only proceed if there's something to search after trimming
  //   if (trimmedSearch) {
  //     // Escape special regex characters to prevent regex injection
  //     const escapedSearch = trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  //     match.message = { $regex: escapedSearch, $options: 'i' };
  //   }
  // }

  // if (filters.search) {
  //   // Escape special regex characters to prevent regex injection
  //   const escapedSearch = filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  //   match.message = { $regex: escapedSearch, $options: 'i' };
  // }
  // const hasSpecialChars = /[^a-zA-Z0-9\s]/.test(filters.search ?? '');

  // if (filters.search) {
  //   if (hasSpecialChars) {
  //     match.message = { $regex: filters.search, $options: 'i' };
  //   } else {
  //     match.$text = { $search: filters.search };
  //   }
  // }

  const appMatch: any = { 'application.is_active': true };
  if (filters.app_name) {
    appMatch['application.name'] = Array.isArray(filters.app_name)
      ? { $in: filters.app_name }
      : filters.app_name;
  }

  const [logs, total] = await Promise.all([
    Log.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'applications',
          localField: 'app_id',
          foreignField: '_id',
          as: 'application',
        },
      },
      { $unwind: '$application' },
      { $match: appMatch },
      { $sort: sortObj },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          message: 1,
          timestamp: 1,
          log_type: 1,
          ingested_at: 1,
          app_id: 1,
          app_name: '$application.name',
        },
      },
    ]),
    Log.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'applications',
          localField: 'app_id',
          foreignField: '_id',
          as: 'application',
        },
      },
      { $unwind: '$application' },
      { $match: appMatch },
      { $count: 'total' },
    ]).then((result) => result[0]?.total || 0),
  ]);

  return {
    logs,
    total,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: skip + logs.length < total,
      hasPrevPage: page > 1,
    },
  };
};

interface LogSummaryOptions {
  userId: string;
  startDate: Date;
  endDate: Date;
}

interface AllAppsLogSummaryOptions {
  startDate: Date;
  endDate: Date;
}

export const fetchAllAppsLogSummary = async ({ startDate, endDate }: AllAppsLogSummaryOptions) => {
  const effectiveStartDate = startDate || new Date(Date.now() - 24 * 60 * 60 * 1000);
  const effectiveEndDate = endDate || new Date();

  const match = {
    timestamp: { $gte: effectiveStartDate, $lte: effectiveEndDate },
  };

  const summary = await Log.aggregate([
    { $match: match },
    {
      $lookup: {
        from: 'applications',
        localField: 'app_id',
        foreignField: '_id',
        as: 'application',
      },
    },
    { $unwind: '$application' },

    // Count per log_type per app
    {
      $group: {
        _id: {
          app_id: '$app_id',
          app_name: '$application.name',
          log_type: { $toLower: '$log_type' }, // normalize
        },
        count: { $sum: 1 },
      },
    },

    // Group all log_types under each app
    {
      $group: {
        _id: {
          app_id: '$_id.app_id',
          app_name: '$_id.app_name',
        },
        logTypePairs: {
          $push: {
            k: '$_id.log_type',
            v: '$count',
          },
        },
        total: { $sum: '$count' },
      },
    },

    // Flatten logTypePairs into fields
    {
      $addFields: {
        logTypes: { $arrayToObject: '$logTypePairs' },
      },
    },

    // Final projection with flattened fields
    {
      $project: {
        _id: 0,
        app_id: '$_id.app_id',
        app_name: '$_id.app_name',
        total: 1,
        debug: '$logTypes.debug',
        info: '$logTypes.info',
        warn: '$logTypes.warn',
        error: '$logTypes.error',
      },
    },
  ]);

  return summary;
};
