import { Injectable } from '@nestjs/common';
import { CreateM1Input } from './dto/create-m1.input';
import { UpdateM1Input } from './dto/update-m1.input';

@Injectable()
export class M1Service {
  create(createM1Input: CreateM1Input) {
    return 'This action adds a new m1';
  }

  findAll() {
    return `This action returns all m1`;
  }

  findOne(id: number) {
    return `This action returns a #${id} m1`;
  }

  update(id: number, updateM1Input: UpdateM1Input) {
    return `This action updates a #${id} m1`;
  }

  remove(id: number) {
    return `This action removes a #${id} m1`;
  }
}
