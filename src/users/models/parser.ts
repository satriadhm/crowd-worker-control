import { UserView } from '../dto/views/user.view';

export const parseToView = (input: any): UserView => {
  return {
    firstName: input.firstName,
    lastName: input.lastName,
    userName: input.userName,
    email: input.email,
    age: input.age,
    role: input.role,
    phoneNumber: input.phoneNumber,
    gender: input.gender,
    address1: input.address1,
    address2: input.address2,
  };
};
