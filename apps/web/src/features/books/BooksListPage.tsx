import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, Download, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/table';
import { useDebounce } from '@/hooks/useDebounce';
import { getApiError } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useAuth } from '@/features/auth/AuthContext';
import { exportBooksCsv, type BookListParams } from './api';
import { useBooks, useCatalogs, useDeleteBook } from './hooks';

const PAGE_SIZE = 8;

export function BooksListPage() {
  const { isAdmin } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);
  const [page, setPage] = useState(1);
  const [genreId, setGenreId] = useState('');
  const [publisherId, setPublisherId] = useState('');
  const [authorId, setAuthorId] = useState('');
  const [available, setAvailable] = useState('');
  const [sort, setSort] = useState('-createdAt');

  const params: BookListParams = {
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    genreId: genreId || undefined,
    publisherId: publisherId || undefined,
    authorId: authorId || undefined,
    available: available === '' ? undefined : available === 'true',
    sort,
  };

  const { data, isLoading, isError, error, isFetching } = useBooks(params);
  const { authors, publishers, genres } = useCatalogs();
  const del = useDeleteBook();

  const resetPage = () => setPage(1);
  const toggleSort = (field: string) => {
    setSort((current) => (current === field ? `-${field}` : current === `-${field}` ? field : field));
    resetPage();
  };
  const sortIcon = (field: string) => {
    if (sort === field) return <ArrowUp className="inline h-3 w-3" />;
    if (sort === `-${field}`) return <ArrowDown className="inline h-3 w-3" />;
    return null;
  };

  const handleExport = async () => {
    try {
      const blob = await exportBooksCsv(params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'libros.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Archivo CSV generado');
    } catch (e) {
      toast.error(getApiError(e).message);
    }
  };

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`¿Eliminar "${title}"?`)) return;
    del.mutate(id, {
      onSuccess: () => toast.success('Libro eliminado'),
      onError: (e) => toast.error(getApiError(e).message),
    });
  };

  const meta = data?.meta;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Catálogo de libros</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
          {isAdmin && (
            <Link to="/books/new" className={buttonVariants()}>
              <Plus className="h-4 w-4" /> Nuevo libro
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            aria-label="Buscar por título"
            placeholder="Buscar título…"
            className="pl-8"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              resetPage();
            }}
          />
        </div>
        <Select aria-label="Filtrar por género" value={genreId} onChange={(e) => { setGenreId(e.target.value); resetPage(); }}>
          <option value="">Todos los géneros</option>
          {genres.data?.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </Select>
        <Select aria-label="Filtrar por editorial" value={publisherId} onChange={(e) => { setPublisherId(e.target.value); resetPage(); }}>
          <option value="">Todas las editoriales</option>
          {publishers.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
        <Select aria-label="Filtrar por autor" value={authorId} onChange={(e) => { setAuthorId(e.target.value); resetPage(); }}>
          <option value="">Todos los autores</option>
          {authors.data?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </Select>
        <Select aria-label="Filtrar por disponibilidad" value={available} onChange={(e) => { setAvailable(e.target.value); resetPage(); }}>
          <option value="">Disponibilidad: todas</option>
          <option value="true">Disponibles</option>
          <option value="false">No disponibles</option>
        </Select>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        {isLoading ? (
          <div className="flex justify-center p-10"><Spinner className="h-8 w-8" /></div>
        ) : isError ? (
          <p className="p-6 text-center text-red-600">{getApiError(error).message}</p>
        ) : data && data.items.length === 0 ? (
          <p className="p-10 text-center text-slate-500">No se encontraron libros con esos filtros.</p>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH className="cursor-pointer select-none" onClick={() => toggleSort('title')}>Título {sortIcon('title')}</TH>
                <TH>Autores</TH>
                <TH>Género</TH>
                <TH className="cursor-pointer select-none" onClick={() => toggleSort('price')}>Precio {sortIcon('price')}</TH>
                <TH className="cursor-pointer select-none" onClick={() => toggleSort('stock')}>Stock {sortIcon('stock')}</TH>
                <TH>Estado</TH>
                <TH className="text-right">Acciones</TH>
              </TR>
            </THead>
            <TBody>
              {data?.items.map((book) => (
                <TR key={book.id}>
                  <TD className="font-medium">
                    <Link to={`/books/${book.id}`} className="text-brand-700 hover:underline">{book.title}</Link>
                  </TD>
                  <TD className="text-slate-600">{book.authors.map((a) => a.name).join(', ')}</TD>
                  <TD className="text-slate-600">{book.genre.name}</TD>
                  <TD>{formatPrice(book.price, book.currency)}</TD>
                  <TD>{book.stock}</TD>
                  <TD>{book.available ? <Badge variant="success">Disponible</Badge> : <Badge variant="muted">Agotado</Badge>}</TD>
                  <TD className="text-right">
                    {isAdmin && (
                      <div className="inline-flex gap-1">
                        <Link to={`/books/${book.id}/edit`} className={buttonVariants({ variant: 'ghost', size: 'icon' })} aria-label={`Editar ${book.title}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <Button variant="ghost" size="icon" aria-label={`Eliminar ${book.title}`} onClick={() => handleDelete(book.id, book.title)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </div>

      {meta && meta.total > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            {meta.total} libro{meta.total !== 1 ? 's' : ''} · página {meta.page} de {meta.totalPages}
            {isFetching && <span className="ml-2 text-slate-400">actualizando…</span>}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
            <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
          </div>
        </div>
      )}
    </div>
  );
}
