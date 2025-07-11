// import mongoose from 'mongoose';
// import Applications from '../models/Applications';
// import UserGroupMembers from '../models/UserGroupMembers';
// import UserGroupApplications from '../models/UserGroupApplications';
// import Settings from '../models/Settings';

// interface FilterOptions {
//   page: number;
//   limit: number;
//   search?: string;
//   status?: 'active' | 'inactive';
//   groupIds?: string[];
//   userId?: string;
// }

// export interface Application {
//   _id: string;
//   name: string;
//   description: string;
//   created_at: string;
//   is_active: boolean;
//   groupCount: number;
//   groupNames: string[];
//   logCount: number;
//   health_status: 'healthy' | 'warning' | 'critical'; // Add this new property
// }

// const escapeRegex = (text: string) => {
//   return text.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&');
// };

// export const getPaginatedFilteredApplications = async (options: FilterOptions) => {
//   const { page, limit, search, status, groupIds, userId } = options;

//   let settings = await Settings.findOne({ user_id: userId });
//     if (!settings) {
//         settings = {
//             warning_rate_threshold: 10, // Default warning threshold
//             error_rate_threshold: 50,   // Default error threshold
//         } as any;
//     }
//     const { warning_rate_threshold, error_rate_threshold } = settings;
//     const oneMinuteAgo = new Date(Date.now() - 60000);

//   let accessibleAppIds: mongoose.Types.ObjectId[] | null = null;

//   if (userId) {
//     const userGroups = await UserGroupMembers.find({
//       user_id: userId,
//       is_active: true,
//     }).select('group_id');

//     if (userGroups.length > 0) {
//       const userGroupIds = userGroups.map((g) => g.group_id as mongoose.Types.ObjectId);
//       const userGroupApps = await UserGroupApplications.find({
//         group_id: { $in: userGroupIds },
//         is_active: true,
//       }).select('app_id');
//       accessibleAppIds = userGroupApps.map((a) => a.app_id as mongoose.Types.ObjectId);
//     } else {
//       accessibleAppIds = [];
//     }
//   }

//   const pipeline: any[] = [];
//   const matchStage: any = { is_deleted: false };

//   if (accessibleAppIds) {
//     if (accessibleAppIds.length === 0) {
//       return {
//         applications: [],
//         pagination: {
//           total: 0,
//           page,
//           limit,
//           totalPages: 0,
//           hasNextPage: false,
//           hasPrevPage: false,
//         },
//       };
//     }
//     matchStage._id = { $in: accessibleAppIds };
//   }

//   if (status) {
//     matchStage.is_active = status === 'active';
//   }

//   if (search) {
//     const searchParts = search.split(' ').map((part) => escapeRegex(part));
//     const flexibleSearchRegex = searchParts.join('.*');

//     matchStage.$or = [
//       { name: { $regex: flexibleSearchRegex, $options: 'i' } },
//       { description: { $regex: flexibleSearchRegex, $options: 'i' } },
//     ];
//   }

//   pipeline.push({ $match: matchStage });

//   if (groupIds && groupIds.length > 0) {
//     pipeline.push(
//       {
//         $lookup: {
//           from: 'usergroupapplications',
//           localField: '_id',
//           foreignField: 'app_id',
//           as: 'groupAssignments',
//         },
//       },
//       {
//         $match: {
//           'groupAssignments.group_id': {
//             $in: groupIds.map((id) => new mongoose.Types.ObjectId(id)),
//           },
//         },
//       }
//     );
//   }

//   pipeline.push({
//     $facet: {
//       metadata: [{ $count: 'total' }],
//       data: [
//         {
//           $lookup: {
//             from: 'usergroupapplications',
//             localField: '_id',
//             foreignField: 'app_id',
//             as: 'groups',
//             pipeline: [{ $match: { is_active: true } }],
//           },
//         },
//         {
//           $lookup: {
//             from: 'usergroups',
//             localField: 'groups.group_id',
//             foreignField: '_id',
//             as: 'groupDetails',
//             pipeline: [{ $match: { is_deleted: false, is_active: true } }],
//           },
//         },
//         {
//           $lookup: {
//             from: 'logs',
//             let: { appId: '$_id' },
//             pipeline: [{ $match: { $expr: { $eq: ['$app_id', '$$appId'] } } }, { $count: 'total' }],
//             as: 'logStats',
//           },
//         },
//         {
//           $project: {
//             _id: 1,
//             name: 1,
//             description: 1,
//             created_at: 1,
//             is_active: 1,
//             groupCount: { $size: '$groupDetails' },
//             groupNames: '$groupDetails.name',
//             logCount: { $ifNull: [{ $arrayElemAt: ['$logStats.total', 0] }, 0] },
//           },
//         },
//         { $sort: { created_at: -1 } },
//         { $skip: (page - 1) * limit },
//         { $limit: limit },
//       ],
//     },
//   });

//    pipeline.push({ $match: matchStage });

//    pipeline.push({
//         $facet: {
//             metadata: [{ $count: 'total' }],
//             data: [
//                 // ... (Existing lookups for groups and total logs)

//                 // 2. Add a new lookup to count logs in the last minute
//                 {
//                     $lookup: {
//                         from: 'logs',
//                         let: { appId: '$_id' },
//                         pipeline: [
//                             {
//                                 $match: {
//                                     $expr: {
//                                         $and: [
//                                             { $eq: ['$app_id', '$$appId'] },
//                                             { $gte: ['$timestamp', oneMinuteAgo] }
//                                         ]
//                                     }
//                                 }
//                             },
//                             { $count: 'recentLogs' }
//                         ],
//                         as: 'recentLogStats'
//                     }
//                 },
                
//                 // 3. Add the new 'health_status' field using the thresholds
//                 {
//                     $project: {
//                         _id: 1,
//                         name: 1,
//                         description: 1,
//                         created_at: 1,
//                         is_active: 1,
//                         groupCount: { $size: '$groupDetails' },
//                         groupNames: '$groupDetails.name',
//                         logCount: { $ifNull: [{ $arrayElemAt: ['$logStats.total', 0] }, 0] },
//                         health_status: {
//                             $let: {
//                                 vars: {
//                                     recent_logs: { $ifNull: [{ $arrayElemAt: ['$recentLogStats.recentLogs', 0] }, 0] }
//                                 },
//                                 in: {
//                                     $switch: {
//                                         branches: [
//                                             { 
//                                                 case: { $gte: ['$$recent_logs', error_rate_threshold] }, 
//                                                 then: 'critical' 
//                                             },
//                                             { 
//                                                 case: { $gte: ['$$recent_logs', warning_rate_threshold] }, 
//                                                 then: 'warning' 
//                                             }
//                                         ],
//                                         default: 'healthy'
//                                     }
//                                 }
//                             }
//                         }
//                     }
//                 },
//                 { $sort: { created_at: -1 } },
//                 { $skip: (page - 1) * limit },
//                 { $limit: limit },
//             ],
//         },});

//   const result = await Applications.aggregate(pipeline);
//   const data = result[0];
//   const applications = data.data;
//   const totalDocs = data.metadata[0]?.total || 0;

//   return {
//     applications,
//     pagination: {
//       total: totalDocs,
//       page,
//       limit,
//       totalPages: Math.ceil(totalDocs / limit),
//       hasNextPage: page * limit < totalDocs,
//       hasPrevPage: page > 1,
//     },
//   };
// };

import mongoose from 'mongoose';
import Applications from '../models/Applications';
import UserGroupMembers from '../models/UserGroupMembers';
import UserGroupApplications from '../models/UserGroupApplications';
import Settings from '../models/Settings';

export interface Application {
  _id: string;
  name: string;
  description: string;
  created_at: string;
  is_active: boolean;
  groupCount: number;
  groupNames: string[];
  logCount: number;
  health_status: 'healthy' | 'warning' | 'critical'; // Add this line
}

// The interface should include the optional userId
interface FilterOptions {
  page: number;
  limit: number;
  search?: string;
  status?: 'active' | 'inactive';
  groupIds?: string[];
  userId?: string; 
}

// Helper function to escape special regex characters
const escapeRegex = (text: string) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&');
};

export const getPaginatedFilteredApplications = async (options: FilterOptions) => {
  const { page, limit, search, status, groupIds, userId } = options;

  // 1. GET USER SETTINGS (OR DEFAULTS) FOR THRESHOLDS
  // let settings = userId ? await Settings.findOne({ user_id: userId }) : null;
  // if (!settings) {
  //   settings = {
  //     warning_rate_threshold: 10, // Default warning threshold
  //     error_rate_threshold: 50,   // Default error threshold
  //   } as any;
  // }

  const userSettings = userId ? await Settings.findOne({ user_id: userId }) : null;

  // Use optional chaining (?.) and the nullish coalescing operator (??) to safely get values or use defaults
  const warning_rate_threshold = userSettings?.warning_rate_threshold ?? 10; // Default: 10
  const error_rate_threshold = userSettings?.error_rate_threshold ?? 20; 
  const oneMinuteAgo = new Date(Date.now() - 60000);

  // 2. DETERMINE WHICH APPS THE USER CAN ACCESS (IF APPLICABLE)
  let accessibleAppIds: mongoose.Types.ObjectId[] | null = null;
  if (userId) { // This logic runs if it's a user request, not an admin one
    const userGroups = await UserGroupMembers.find({ user_id: userId, is_active: true }).select('group_id');
    const userGroupIds = userGroups.map((g) => g.group_id as mongoose.Types.ObjectId);
    
    if (userGroupIds.length > 0) {
      const userGroupApps = await UserGroupApplications.find({ group_id: { $in: userGroupIds }, is_active: true }).select('app_id');
      accessibleAppIds = userGroupApps.map((a) => a.app_id as mongoose.Types.ObjectId);
    } else {
      // If user is in no groups, they can see no apps
      accessibleAppIds = [];
    }
  }

  // If a user is requesting but has access to zero apps, return empty immediately.
  if (accessibleAppIds && accessibleAppIds.length === 0) {
    return {
      applications: [],
      pagination: { total: 0, page, limit, totalPages: 0, hasNextPage: false, hasPrevPage: false },
    };
  }
  
  // 3. BUILD THE AGGREGATION PIPELINE
  const pipeline: any[] = [];
  const matchStage: any = { is_deleted: false };

  // Add user access filter to the main query
  if (accessibleAppIds) {
    matchStage._id = { $in: accessibleAppIds };
  }

  // Add status filter
  if (status) {
    matchStage.is_active = status === 'active';
  }

  // Add search filter
  if (search) {
    const searchParts = search.split(' ').map((part) => escapeRegex(part));
    const flexibleSearchRegex = searchParts.join('.*');
    matchStage.$or = [
      { name: { $regex: flexibleSearchRegex, $options: 'i' } },
      { description: { $regex: flexibleSearchRegex, $options: 'i' } },
    ];
  }

  // The first stage is always to match the core documents
  pipeline.push({ $match: matchStage });

  // Add filtering by specific group IDs if provided
  if (groupIds && groupIds.length > 0) {
    pipeline.push(
      { $lookup: { from: 'usergroupapplications', localField: '_id', foreignField: 'app_id', as: 'groupAssignments' }},
      { $match: { 'groupAssignments.group_id': { $in: groupIds.map((id) => new mongoose.Types.ObjectId(id)) } } }
    );
  }

  // 4. USE A SINGLE $facet STAGE FOR METADATA AND DATA PROCESSING
  pipeline.push({
    $facet: {
      metadata: [{ $count: 'total' }],
      data: [
        { $sort: { created_at: -1 } }, // Sort early if possible
        // --- All lookups for data enrichment go here ---
        { $lookup: { from: 'usergroupapplications', localField: '_id', foreignField: 'app_id', as: 'groups', pipeline: [{ $match: { is_active: true } }] }},
        { $lookup: { from: 'usergroups', localField: 'groups.group_id', foreignField: '_id', as: 'groupDetails', pipeline: [{ $match: { is_deleted: false, is_active: true } }] }},
        { $lookup: { from: 'logs', let: { appId: '$_id' }, pipeline: [{ $match: { $expr: { $eq: ['$app_id', '$$appId'] } } }, { $count: 'total' }], as: 'logStats' }},
        { $lookup: { from: 'logs', let: { appId: '$_id' }, pipeline: [
            { $match: { $expr: { $and: [ { $eq: ['$app_id', '$$appId'] }, { $gte: ['$timestamp', oneMinuteAgo] }]}}},
            { $count: 'recentLogs' }
        ], as: 'recentLogStats'}},
        
        // --- Final projection to shape the output document ---
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            created_at: 1,
            is_active: 1,
            groupCount: { $size: '$groupDetails' },
            groupNames: '$groupDetails.name',
            logCount: { $ifNull: [{ $arrayElemAt: ['$logStats.total', 0] }, 0] },
            health_status: {
              $let: {
                vars: { recent_logs: { $ifNull: [{ $arrayElemAt: ['$recentLogStats.recentLogs', 0] }, 0] } },
                in: {
                  $switch: {
                    branches: [
                      { case: { $gte: ['$$recent_logs', error_rate_threshold] }, then: 'critical' },
                      { case: { $gte: ['$$recent_logs', warning_rate_threshold] }, then: 'warning' }
                    ],
                    default: 'healthy'
                  }
                }
              }
            }
          }
        },
        // --- Pagination at the very end ---
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ],
    },
  });

  // 5. EXECUTE THE PIPELINE AND RETURN RESULTS
  const result = await Applications.aggregate(pipeline);
  const data = result[0];
  const applications = data.data;
  const totalDocs = data.metadata[0]?.total || 0;

  return {
    applications,
    pagination: {
      total: totalDocs,
      page,
      limit,
      totalPages: Math.ceil(totalDocs / limit),
      hasNextPage: page * limit < totalDocs,
      hasPrevPage: page > 1,
    },
  };
};

export const getDetailedApplications = async (appIds: mongoose.Types.ObjectId[]) => {
  const detailedApplications = await Applications.aggregate([
    // 1. Filter for the requested, non-deleted applications
    {
      $match: {
        _id: { $in: appIds },
        is_deleted: false,
      },
    },
    // 2. Lookup active groups from the UserGroupApplications collection
    {
      $lookup: {
        from: 'usergroupapplications', // The actual collection name in MongoDB (usually plural and lowercase)
        localField: '_id',
        foreignField: 'app_id',
        as: 'groups',
        pipeline: [
          { $match: { is_active: true } }, // Only count active groups
        ],
      },
    },

    {
      $lookup: {
        from: 'usergroups', // The collection where group names are stored
        localField: 'groups.group_id', // The field from the previous stage
        foreignField: '_id', // The field to match in the 'usergroups' collection
        as: 'groupDetails', // Store the full group documents here
        pipeline: [
          { $match: { is_deleted: false, is_active: true } }, // Only count active groups
        ],
      },
    },

    {
      $lookup: {
        from: 'logs',
        let: { appId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$app_id', '$$appId'] },
              // Add additional filters here if needed:
              // , created_at: { $gte: new Date('2024-01-01') }
            },
          },
          { $count: 'total' },
        ],
        as: 'logStats',
      },
    },

    // 4. Project the final shape of the output
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        created_at: 1,
        is_active: 1,
        groupCount: { $size: '$groupDetails' }, // Count the number of groups
        groupNames: '$groupDetails.name', // Create an array of just the group names
        logCount: {
          $ifNull: [{ $arrayElemAt: ['$logStats.total', 0] }, 0],
        },
      },
    },
  ]);

  return detailedApplications;
};
