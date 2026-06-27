import { bookFormSchema, type BookFormInput } from '@cmpc/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import type { z } from 'zod';

// Valores crudos del formulario (entrada); la validación los transforma a BookFormInput.
type FormValues = z.input<typeof bookFormSchema>;
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { getApiError } from '@/lib/api';
import { AuthorMultiSelect } from './AuthorMultiSelect';
import { ImageDropzone } from './ImageDropzone';
import { uploadBookImage } from './api';
import { useBook, useCatalogs, useCreateAuthor, useCreateBook, useUpdateBook } from './hooks';

export function BookFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { authors, publishers, genres } = useCatalogs();
  const bookQuery = useBook(id);
  const createMut = useCreateBook();
  const updateMut = useUpdateBook(id ?? '');
  const createAuthorMut = useCreateAuthor();
  const [file, setFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues, unknown, BookFormInput>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: { authorIds: [], price: 0, stock: 0 },
  });

  useEffect(() => {
    if (isEdit && bookQuery.data) {
      const b = bookQuery.data;
      reset({
        title: b.title,
        isbn: b.isbn ?? undefined,
        description: b.description ?? undefined,
        price: b.price,
        stock: b.stock,
        publishedYear: b.publishedYear ?? undefined,
        publisherId: b.publisher.id,
        genreId: b.genre.id,
        authorIds: b.authors.map((a) => a.id),
      });
    }
  }, [isEdit, bookQuery.data, reset]);

  const onSubmit = async (values: BookFormInput) => {
    let saved;
    try {
      saved = isEdit ? await updateMut.mutateAsync(values) : await createMut.mutateAsync(values);
    } catch (error) {
      const apiError = getApiError(error);
      // Muestra los mensajes del backend en el campo correspondiente.
      if (apiError.fields?.length) {
        apiError.fields.forEach((f) => setError(f.field as keyof FormValues, { message: f.message }));
      } else {
        toast.error(apiError.message);
      }
      return;
    }

    // El libro ya se guardó: si la imagen falla, no se debe perder ese resultado.
    if (file) {
      try {
        await uploadBookImage(saved.id, file);
      } catch {
        toast.warning('El libro se guardó, pero no se pudo subir la imagen. Inténtalo de nuevo al editarlo.');
        navigate(`/books/${saved.id}`);
        return;
      }
    }

    toast.success(isEdit ? 'Libro actualizado' : 'Libro creado');
    navigate(`/books/${saved.id}`);
  };

  if (isEdit && bookQuery.isLoading) {
    return <div className="flex justify-center p-10"><Spinner className="h-8 w-8" /></div>;
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>{isEdit ? 'Editar libro' : 'Nuevo libro'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1">
            <Label htmlFor="title">Título</Label>
            <Input id="title" {...register('title')} />
            {errors.title && <p className="text-xs text-red-600">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="isbn">ISBN</Label>
              <Input id="isbn" {...register('isbn')} />
              {errors.isbn && <p className="text-xs text-red-600">{errors.isbn.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="publishedYear">Año de publicación</Label>
              <Input id="publishedYear" type="number" {...register('publishedYear')} />
              {errors.publishedYear && <p className="text-xs text-red-600">{errors.publishedYear.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="price">Precio</Label>
              <Input id="price" type="number" step="0.01" {...register('price')} />
              {errors.price && <p className="text-xs text-red-600">{errors.price.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="stock">Stock</Label>
              <Input id="stock" type="number" {...register('stock')} />
              {errors.stock && <p className="text-xs text-red-600">{errors.stock.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="publisherId">Editorial</Label>
              <Select id="publisherId" {...register('publisherId')}>
                <option value="">Selecciona…</option>
                {publishers.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
              {errors.publisherId && <p className="text-xs text-red-600">{errors.publisherId.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="genreId">Género</Label>
              <Select id="genreId" {...register('genreId')}>
                <option value="">Selecciona…</option>
                {genres.data?.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </Select>
              {errors.genreId && <p className="text-xs text-red-600">{errors.genreId.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="authors">Autores</Label>
            <Controller
              control={control}
              name="authorIds"
              render={({ field }) => (
                <AuthorMultiSelect
                  id="authors"
                  options={authors.data ?? []}
                  value={field.value ?? []}
                  onChange={field.onChange}
                  onCreate={(name) => createAuthorMut.mutateAsync(name)}
                />
              )}
            />
            {errors.authorIds && <p className="text-xs text-red-600">{errors.authorIds.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Descripción</Label>
            <textarea
              id="description"
              rows={3}
              className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              {...register('description')}
            />
            {errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="image">Imagen (opcional)</Label>
            <ImageDropzone id="image" value={file} onChange={setFile} existingUrl={bookQuery.data?.imageUrl} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando…' : 'Guardar'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
