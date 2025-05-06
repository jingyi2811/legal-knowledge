import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  constructor() {}

  @Get()
  getHome(): string {
    return 'Welcome to Legal Chat Backend 👋';
  }
}
