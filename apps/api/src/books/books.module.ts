import { Module } from '@nestjs/common';
import { ImagesModule } from '../images/images.module';
import { BOOKS_REPOSITORY } from './books.repository';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { PrismaBooksRepository } from './prisma-books.repository';

@Module({
  imports: [ImagesModule],
  controllers: [BooksController],
  providers: [
    BooksService,
    { provide: BOOKS_REPOSITORY, useClass: PrismaBooksRepository },
  ],
  exports: [BooksService],
})
export class BooksModule {}
