// File: aggregations/logs.aggregation.ts
import mongoose from 'mongoose';

interface SortCriteria {
  field: string;
  direction: 'asc' | 'desc';
}

interface PaginatedLogsOptions {
  skip: number;
  limit: number;
  sortCriteria: SortCriteria[];
  filters: {
    log_type?: string | string[];
    app_name?: string | string[];
    startDate?: string;
    endDate?: string;
    search?: string;
  };
}

interface UserLogsOptions {
  appIds: mongoose.Types.ObjectId[];
  skip: number;
  limit: number;
  sortCriteria: SortCriteria[];
  filters: {
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

const buildSearchConditions = (search: string): any[] => {
  const searchConditions: any[] = [];

  if (!search?.trim()) {
    return searchConditions;
  }

  const keywords = search.trim().split(/\s+/).filter(Boolean);

  if (keywords.length === 1) {
    const escaped = keywords[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = { $regex: escaped, $options: 'i' };

    searchConditions.push({
      $or: [{ message: regex }, { log_type: regex }, { 'application.name': regex }],
    });
  } else {
    const keywordRegexConditions = keywords.map((kw) => {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = { $regex: escaped, $options: 'i' };

      return {
        $or: [{ message: regex }, { log_type: regex }, { 'application.name': regex }],
      };
    });

    searchConditions.push(...keywordRegexConditions);
  }

  return searchConditions;
};

const buildUserSearchConditions = (search: string): any[] => {
  const searchConditions: any[] = [];

  if (!search?.trim()) {
    return searchConditions;
  }

  const keywords = search.trim().split(/\s+/).filter(Boolean);

  if (keywords.length === 1) {
    const escaped = keywords[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = { $regex: escaped, $options: 'i' };

    searchConditions.push({
      $or: [{ message: regex }, { log_type: regex }],
    });
  } else {
    const keywordRegexConditions = keywords.map((kw) => {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = { $regex: escaped, $options: 'i' };

      return {
        $or: [{ message: regex }, { log_type: regex }],
      };
    });

    searchConditions.push(...keywordRegexConditions);
  }

  return searchConditions;
};

export const buildPaginatedLogsAggregation = ({
  skip,
  limit,
  sortCriteria,
  filters,
}: PaginatedLogsOptions) => {
  const sortObj = buildSortObject(sortCriteria);

  // Base filters before join
  const preLookupMatch: any = {};

  if (filters.log_type) {
    preLookupMatch.log_type = Array.isArray(filters.log_type)
      ? { $in: filters.log_type }
      : filters.log_type;
  }

  if (filters.startDate || filters.endDate) {
    preLookupMatch.timestamp = {};
    if (filters.startDate) preLookupMatch.timestamp.$gte = new Date(filters.startDate);
    if (filters.endDate) preLookupMatch.timestamp.$lte = new Date(filters.endDate);
  }

  // Post-lookup match: after application is joined
  const postLookupMatch: any = {
    'application.is_active': true,
  };

  if (filters.app_name) {
    postLookupMatch['application.name'] = Array.isArray(filters.app_name)
      ? { $in: filters.app_name }
      : filters.app_name;
  }

  // Search conditions
  const searchConditions = buildSearchConditions(filters.search || '');

  const basePipeline = [
    { $match: preLookupMatch },
    {
      $lookup: {
        from: 'applications',
        localField: 'app_id',
        foreignField: '_id',
        as: 'application',
      },
    },
    { $unwind: '$application' },
    { $match: postLookupMatch },
    ...(searchConditions.length > 0 ? [{ $match: { $and: searchConditions } }] : []),
  ];

  const pipeline = [
    ...basePipeline,
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
  ];

  const countPipeline = [...basePipeline, { $count: 'total' }];

  return { pipeline, countPipeline };
};

export const buildUserLogsAggregation = ({
  appIds,
  skip,
  limit,
  sortCriteria,
  filters,
}: UserLogsOptions) => {
  const sortObj = buildSortObject(sortCriteria);

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

  // Add search conditions to match
  const searchConditions = buildUserSearchConditions(filters.search || '');
  if (searchConditions.length > 0) {
    if (searchConditions.length === 1) {
      match.$or = searchConditions[0].$or;
    } else {
      match.$and = searchConditions;
    }
  }

  const appMatch: any = { 'application.is_active': true };
  if (filters.app_name) {
    appMatch['application.name'] = Array.isArray(filters.app_name)
      ? { $in: filters.app_name }
      : filters.app_name;
  }

  const basePipeline = [
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
  ];

  const pipeline = [
    ...basePipeline,
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
  ];

  const countPipeline = [...basePipeline, { $count: 'total' }];

  return { pipeline, countPipeline };
};

export const buildLogSummaryAggregation = (startDate: Date, endDate: Date) => {
  const match = {
    timestamp: { $gte: startDate, $lte: endDate },
  };

  return [
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
  ];
};
