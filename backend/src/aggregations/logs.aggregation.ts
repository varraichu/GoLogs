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

/**
 * Builds sort object for MongoDB from given sort criteria.
 */
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

/**
 * Constructs search conditions for admin-level log filtering.
 * @param search - Raw user input string to search logs.
 * @returns An array of `$match` compatible conditions for search keywords.
 */
const buildSearchConditions = (search: string): any[] => {
  const searchConditions: any[] = [];

  // 1. Trim leading/trailing whitespace, but preserve internal
  const trimmedSearch = search?.trim();

  if (!trimmedSearch) return searchConditions;

  // 2. Escape regex chars
  const escaped = trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // 3. Regex with internal spaces preserved
  const regex = { $regex: escaped, $options: 'i' };

  searchConditions.push({
    $or: [{ message: regex }, { log_type: regex }, { 'application.name': regex }],
  });

  return searchConditions;
};

/**
 * Constructs search conditions for user-specific log filtering.
 * @param search - Raw user input string to search logs.
 * @returns An array of `$match` compatible conditions based on keywords.
 */
const buildUserSearchConditions = (search: string): any[] => {
  const searchConditions: any[] = [];

  // 1. Trim leading/trailing whitespace, but preserve internal
  const trimmedSearch = search?.trim();

  if (!trimmedSearch) return searchConditions;

  // 2. Escape regex chars
  const escaped = trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // 3. Regex with internal spaces preserved
  const regex = { $regex: escaped, $options: 'i' };

  searchConditions.push({
    $or: [{ message: regex }, { log_type: regex }, { 'application.name': regex }],
  });

  return searchConditions;
};

/**
 * Builds a paginated logs aggregation pipeline for admin users.
 * @param options - Options including pagination, sort, filters.
 * @param options.skip - Number of documents to skip.
 * @param options.limit - Max number of documents to return.
 * @param options.sortCriteria - Sort fields and directions.
 * @param options.filters - Filters like log type, date range, app name, search.
 * @returns Object containing `pipeline` for data and `countPipeline` for total count.
 */
export const buildPaginatedLogsAggregation = ({
  skip,
  limit,
  sortCriteria,
  filters,
}: PaginatedLogsOptions) => {
  const sortObj = buildSortObject(sortCriteria);

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

  const postLookupMatch: any = {
    'application.is_active': true,
  };

  if (Array.isArray(filters.app_name) && filters.app_name.length > 0) {
    postLookupMatch['application.name'] = { $in: filters.app_name };
  } else if (typeof filters.app_name === 'string' && filters.app_name.trim() !== '') {
    postLookupMatch['application.name'] = filters.app_name;
  }

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

/**
 * Builds a paginated logs aggregation pipeline for non-admin users.
 * @param options - Options including accessible app IDs, pagination, sort, filters.
 * @param options.appIds - List of accessible application ObjectIds.
 * @param options.skip - Number of documents to skip.
 * @param options.limit - Max number of documents to return.
 * @param options.sortCriteria - Sort fields and directions.
 * @param options.filters - Filters like log type, date range, app name, search.
 * @returns Object containing `pipeline` for data and `countPipeline` for total count.
 */
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

  const searchConditions = buildUserSearchConditions(filters.search || '');
  if (searchConditions.length > 0) {
    if (searchConditions.length === 1) {
      match.$or = searchConditions[0].$or;
    } else {
      match.$and = searchConditions;
    }
  }

  const appMatch: any = { 'application.is_active': true };
  if (Array.isArray(filters.app_name) && filters.app_name.length > 0) {
    appMatch['application.name'] = { $in: filters.app_name };
  } else if (typeof filters.app_name === 'string' && filters.app_name.trim() !== '') {
    appMatch['application.name'] = filters.app_name;
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

/**
 * Builds pipeline to summarize logs by app and type for a date range.
 * @returns Aggregation pipeline that outputs log counts per log type per app.
 */
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
    {
      $group: {
        _id: {
          app_id: '$app_id',
          app_name: '$application.name',
          log_type: { $toLower: '$log_type' },
        },
        count: { $sum: 1 },
      },
    },
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
    {
      $addFields: {
        logTypes: { $arrayToObject: '$logTypePairs' },
      },
    },
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
