import { Body, Controller, Get, Injectable, Module, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { Roles } from '../common/decorators/roles.decorator';
import { PrismaService, notDeleted } from '../prisma/prisma.service';

const createAuthorSchema = z.object({
  name: z.string().trim().min(2, 'El nombre del autor es obligatorio'),
  bio: z.string().trim().max(2000, 'La biografía es demasiado larga').optional(),
});
class CreateAuthorDto extends createZodDto(createAuthorSchema) {}

@Injectable()
export class AuthorsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.author.findMany({ where: notDeleted, orderBy: { name: 'asc' } });
  }

  create(dto: CreateAuthorDto) {
    return this.prisma.author.create({ data: dto });
  }
}

@ApiTags('authors')
@ApiBearerAuth()
@Controller('authors')
export class AuthorsController {
  constructor(private readonly authors: AuthorsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar autores' })
  findAll() {
    return this.authors.findAll();
  }

  @Roles(Role.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Crear un autor' })
  create(@Body() dto: CreateAuthorDto) {
    return this.authors.create(dto);
  }
}

@Module({
  controllers: [AuthorsController],
  providers: [AuthorsService],
})
export class AuthorsModule {}
