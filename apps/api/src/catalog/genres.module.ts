import { Body, Controller, Get, Injectable, Module, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { Roles } from '../common/decorators/roles.decorator';
import { PrismaService, notDeleted } from '../prisma/prisma.service';

const createGenreSchema = z.object({
  name: z.string().trim().min(2, 'El nombre del género es obligatorio'),
});
class CreateGenreDto extends createZodDto(createGenreSchema) {}

@Injectable()
export class GenresService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.genre.findMany({ where: notDeleted, orderBy: { name: 'asc' } });
  }

  create(dto: CreateGenreDto) {
    return this.prisma.genre.create({ data: dto });
  }
}

@ApiTags('genres')
@ApiBearerAuth()
@Controller('genres')
export class GenresController {
  constructor(private readonly genres: GenresService) {}

  @Get()
  @ApiOperation({ summary: 'Listar géneros' })
  findAll() {
    return this.genres.findAll();
  }

  @Roles(Role.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Crear un género' })
  create(@Body() dto: CreateGenreDto) {
    return this.genres.create(dto);
  }
}

@Module({
  controllers: [GenresController],
  providers: [GenresService],
})
export class GenresModule {}
