import type { Catalog } from '@cmpc/contracts';
import { Plus, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AuthorMultiSelectProps {
  options: Catalog[];
  value: string[];
  onChange: (ids: string[]) => void;
  /** Crea un autor nuevo en el backend y devuelve su registro. */
  onCreate: (name: string) => Promise<Catalog>;
  id?: string;
}

/**
 * Selector de autores con búsqueda, chips removibles y creación al vuelo.
 * Permite elegir varios del catálogo y, si no existe, crear uno nuevo sin salir del formulario.
 */
export function AuthorMultiSelect({ options, value, onChange, onCreate, id }: AuthorMultiSelectProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<Catalog[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Catálogo combinado: opciones del servidor + autores recién creados (hasta que refresque la query).
  const all = useMemo(() => {
    const map = new Map<string, Catalog>();
    [...options, ...created].forEach((a) => map.set(a.id, a));
    return [...map.values()];
  }, [options, created]);

  const selected = value
    .map((vid) => all.find((a) => a.id === vid))
    .filter((a): a is Catalog => Boolean(a));

  const q = query.trim().toLowerCase();
  const matches = all.filter((a) => !value.includes(a.id) && a.name.toLowerCase().includes(q));
  const exists = all.some((a) => a.name.toLowerCase() === q);
  const canCreate = q.length >= 2 && !exists;
  const total = matches.length + (canCreate ? 1 : 0);

  // Cierra el menú al hacer clic fuera del componente.
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const addAuthor = (a: Catalog) => {
    onChange([...value, a.id]);
    setQuery('');
    setActiveIndex(0);
    inputRef.current?.focus();
  };

  const removeAuthor = (vid: string) => onChange(value.filter((x) => x !== vid));

  const createAuthor = async () => {
    const name = query.trim();
    if (name.length < 2 || creating) return;
    setCreating(true);
    try {
      const author = await onCreate(name);
      setCreated((c) => [...c, author]);
      onChange([...value, author.id]);
      setQuery('');
      setActiveIndex(0);
    } finally {
      setCreating(false);
      inputRef.current?.focus();
    }
  };

  const commit = (index: number) => {
    if (canCreate && index === matches.length) void createAuthor();
    else if (matches[index]) addAuthor(matches[index]);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, Math.max(total - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && total > 0) commit(activeIndex);
    } else if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'Backspace' && query === '' && selected.length > 0) {
      removeAuthor(selected[selected.length - 1].id);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <div
        className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2 py-1.5 transition-shadow focus-within:ring-2 focus-within:ring-brand-500"
        onClick={() => {
          inputRef.current?.focus();
          setOpen(true);
        }}
      >
        {selected.map((a) => (
          <span
            key={a.id}
            className="inline-flex items-center gap-1 rounded-full bg-brand-50 py-0.5 pl-2.5 pr-1 text-sm font-medium text-brand-700"
          >
            {a.name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeAuthor(a.id);
              }}
              className="rounded-full p-0.5 text-brand-600 transition-colors hover:bg-brand-100 hover:text-brand-800"
              aria-label={`Quitar ${a.name}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={id}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={selected.length ? 'Agregar otro…' : 'Buscar o agregar un autor…'}
          className="min-w-[8rem] flex-1 border-0 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-slate-400"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
        />
      </div>

      {open && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg"
        >
          {matches.map((a, idx) => (
            <li key={a.id}>
              <button
                type="button"
                role="option"
                aria-selected={activeIndex === idx}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => addAuthor(a)}
                className={cn(
                  'flex w-full items-center px-3 py-1.5 text-left text-sm transition-colors',
                  activeIndex === idx ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50',
                )}
              >
                {a.name}
              </button>
            </li>
          ))}

          {canCreate && (
            <li>
              <button
                type="button"
                onMouseEnter={() => setActiveIndex(matches.length)}
                onClick={() => void createAuthor()}
                disabled={creating}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm font-medium text-brand-700 transition-colors disabled:opacity-60',
                  activeIndex === matches.length ? 'bg-brand-50' : 'hover:bg-slate-50',
                )}
              >
                <Plus className="h-4 w-4 shrink-0" />
                {creating ? 'Creando…' : <>Crear «{query.trim()}»</>}
              </button>
            </li>
          )}

          {matches.length === 0 && !canCreate && (
            <li className="px-3 py-2 text-sm text-slate-400">
              {q ? 'Escribe al menos 2 letras para crear un autor' : 'Escribe para buscar o agregar'}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
