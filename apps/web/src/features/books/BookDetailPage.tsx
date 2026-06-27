import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { getApiError } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useAuth } from '@/features/auth/AuthContext';
import { useBook } from './hooks';

export function BookDetailPage() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const { data: book, isLoading, isError, error } = useBook(id);

  if (isLoading) return <div className="flex justify-center p-10"><Spinner className="h-8 w-8" /></div>;
  if (isError || !book) return <p className="p-6 text-center text-red-600">{getApiError(error).message}</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link to="/books" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Volver al catálogo
      </Link>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>{book.title}</CardTitle>
            <p className="mt-1 text-sm text-slate-500">{book.authors.map((a) => a.name).join(', ')}</p>
          </div>
          {book.available ? <Badge variant="success">Disponible</Badge> : <Badge variant="muted">Agotado</Badge>}
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="sm:col-span-1">
            {book.imageUrl ? (
              <img src={book.imageUrl} alt={book.title} className="w-full rounded-md object-cover" />
            ) : (
              <div className="flex h-48 items-center justify-center rounded-md bg-slate-100 text-sm text-slate-400">
                Sin imagen
              </div>
            )}
          </div>
          <dl className="sm:col-span-2 grid grid-cols-2 gap-y-3 text-sm">
            <dt className="text-slate-500">Editorial</dt>
            <dd>{book.publisher.name}</dd>
            <dt className="text-slate-500">Género</dt>
            <dd>{book.genre.name}</dd>
            <dt className="text-slate-500">Precio</dt>
            <dd>{formatPrice(book.price)}</dd>
            <dt className="text-slate-500">Stock</dt>
            <dd>{book.stock}</dd>
            <dt className="text-slate-500">ISBN</dt>
            <dd>{book.isbn ?? '—'}</dd>
            <dt className="text-slate-500">Año</dt>
            <dd>{book.publishedYear ?? '—'}</dd>
            <dt className="text-slate-500">Descripción</dt>
            <dd className="col-span-2 text-slate-700">{book.description ?? 'Sin descripción'}</dd>
          </dl>
        </CardContent>
      </Card>
      {isAdmin && (
        <div className="text-right">
          <Link to={`/books/${book.id}/edit`} className={buttonVariants()}>Editar libro</Link>
        </div>
      )}
    </div>
  );
}
