import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Response } from 'express';
import { RawResponse } from '../common/decorators/raw-response.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { isSupportedImage } from '../images/image-type';
import { ImagesService } from '../images/images.service';
import { BooksService } from './books.service';
import { CreateBookDto, QueryBooksDto, UpdateBookDto } from './dto/book.dto';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

@ApiTags('books')
@ApiBearerAuth()
@Controller('books')
export class BooksController {
  constructor(
    private readonly books: BooksService,
    private readonly images: ImagesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar libros con filtros, orden, búsqueda y paginación' })
  findAll(@Query() query: QueryBooksDto) {
    return this.books.findAll(query);
  }

  @RawResponse()
  @Get('export')
  @ApiOperation({ summary: 'Exportar el listado filtrado a CSV' })
  async export(@Query() query: QueryBooksDto, @Res({ passthrough: true }) res: Response) {
    const csv = await this.books.exportCsv(query);
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="libros.csv"',
    });
    return csv;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver el detalle de un libro' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.books.findOne(id);
  }

  @Roles(Role.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Crear un libro' })
  create(@Body() dto: CreateBookDto) {
    return this.books.create(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Editar un libro' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBookDto) {
    return this.books.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un libro' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.books.remove(id);
  }

  @Roles(Role.ADMIN)
  @Post(':id/image')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir o actualizar la imagen de un libro' })
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: MAX_IMAGE_BYTES } }))
  async uploadImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Adjunta una imagen para subir.');
    }
    if (!file.mimetype.startsWith('image/') || !isSupportedImage(file.buffer)) {
      throw new BadRequestException('El archivo debe ser una imagen válida (PNG, JPG, WEBP o GIF).');
    }
    const url = await this.images.uploadBuffer(file.buffer);
    return this.books.setImageUrl(id, url);
  }
}
