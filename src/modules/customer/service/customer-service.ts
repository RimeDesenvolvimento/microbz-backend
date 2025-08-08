import { Customer } from '@prisma/client';
import { CustomerRepository } from '../repository/customer-repository';

export class CustomerService {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async getAll(): Promise<Customer[]> {
    return await this.customerRepository.getAll();
  }
}
