import type { CreateBookInput } from '@cmpc/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookListParams,
  createAuthor,
  createBook,
  deleteBook,
  getBook,
  listAuthors,
  listBooks,
  listGenres,
  listPublishers,
  updateBook,
} from './api';

export function useBooks(params: BookListParams) {
  return useQuery({
    queryKey: ['books', params],
    queryFn: () => listBooks(params),
    placeholderData: (prev) => prev,
  });
}

export function useBook(id: string | undefined) {
  return useQuery({ queryKey: ['book', id], queryFn: () => getBook(id as string), enabled: Boolean(id) });
}

export function useCatalogs() {
  return {
    authors: useQuery({ queryKey: ['authors'], queryFn: listAuthors }),
    publishers: useQuery({ queryKey: ['publishers'], queryFn: listPublishers }),
    genres: useQuery({ queryKey: ['genres'], queryFn: listGenres }),
  };
}

export function useCreateAuthor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createAuthor(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['authors'] }),
  });
}

export function useCreateBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBookInput) => createBook(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['books'] }),
  });
}

export function useUpdateBook(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<CreateBookInput>) => updateBook(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['books'] });
      qc.invalidateQueries({ queryKey: ['book', id] });
    },
  });
}

export function useDeleteBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBook(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['books'] }),
  });
}
