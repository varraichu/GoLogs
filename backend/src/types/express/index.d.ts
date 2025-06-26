// import { UserPayload } from './userPayload'; // path adjusted after moving

// declare global {
//   namespace Express {
//     interface Request {
//       user?: UserPayload;
//     }
//   }
// }

// export {};


// import { UserPayload } from '../../userPayload';

// declare global {
//   namespace Express {
//     interface Request {
//       user?: UserPayload;
//     }
//   }
// }

import { UserPayload } from '../userPayload';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
export {}; // 👈 this line is important
