import { createBookSchema, queryBooksSchema, updateBookSchema } from '@cmpc/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateBookDto extends createZodDto(createBookSchema) {}
export class UpdateBookDto extends createZodDto(updateBookSchema) {}
export class QueryBooksDto extends createZodDto(queryBooksSchema) {}
