import { registerEnumType } from '@nestjs/graphql';

export enum Gender {
  MEN = 'pria',
  WOMEN = 'wanita',
}

export enum Role {
  ADMIN = 'admin',
  WORKER = 'worker',
  COMPANY_REPRESENTATIVE = 'company_representative',
  QUESTION_VALIDATOR = 'question_validator',
}

registerEnumType(Gender, {
  name: 'GenderEnum',
  description: 'The Gender of the user',
});

registerEnumType(Role, {
  name: 'RoleEnum',
  description: 'The Role of the user',
});
