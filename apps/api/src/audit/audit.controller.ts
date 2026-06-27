import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationDto } from '../common/pagination';
import { AuditService } from './audit.service';

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Roles(Role.ADMIN)
  @Get()
  @ApiOperation({ summary: 'Listar la bitácora de auditoría (solo administradores)' })
  findAll(@Query() query: PaginationDto) {
    return this.audit.findAll(query.page, query.pageSize);
  }
}
