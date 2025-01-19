import { Users } from 'src/users/models/user'; // Replace with the actual type of the user object

declare global {
  namespace Express {
    interface Request {
      user?: Users; // Add the user property
    }
  }
}
