import { Users } from 'src/users/models/user';

declare global {
  namespace Express {
    interface Request {
      user?: Users;
    }
  }
}
