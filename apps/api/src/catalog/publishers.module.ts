import { Body, Controller, Get, Injectable, Module, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { Roles } from '../common/decorators/roles.decorator';
import { PrismaService, notDeleted } from '../prisma/prisma.service';

const createPublisherSchema = z.object({
  name: z.string().trim().min(2, 'El nombre de la editorial es obligatorio'),
});
class CreatePublisherDto extends createZodDto(createPublisherSchema) {}

@Injectable()
export class PublishersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.publisher.findMany({ where: notDeleted, orderBy: { name: 'asc' } });
  }

  create(dto: CreatePublisherDto) {
    return this.prisma.publisher.create({ data: dto });
  }
}

@ApiTags('publishers')
@ApiBearerAuth()
@Controller('publishers')
export class PublishersController {
  constructor(private readonly publishers: PublishersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar editoriales' })
  findAll() {
    return this.publishers.findAll();
  }

  @Roles(Role.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Crear una editorial' })
  create(@Body() dto: CreatePublisherDto) {
    return this.publishers.create(dto);
  }
}

@Module({
  controllers: [PublishersController],
  providers: [PublishersService],
})
export class PublishersModule {}
