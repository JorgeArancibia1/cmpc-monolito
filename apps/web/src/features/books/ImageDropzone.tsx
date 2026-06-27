import { UploadCloud, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const ACCEPT_ATTR = ACCEPTED.join(',');

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface ImageDropzoneProps {
  value: File | null;
  onChange: (file: File | null) => void;
  /** id del input para asociarlo a su <Label htmlFor>. */
  id?: string;
  /** URL de la imagen ya guardada (modo edición), para mostrarla como vista previa inicial. */
  existingUrl?: string | null;
}

/** Carga de imagen con arrastrar y soltar, vista previa y validación de formato/tamaño. */
export function ImageDropzone({ value, onChange, id, existingUrl }: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  // Genera la vista previa del archivo elegido y libera el object URL al cambiar/desmontar.
  useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const accept = (file: File | undefined | null) => {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      toast.error('Formato no válido. Usa una imagen PNG, JPG, WEBP o GIF.');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('La imagen es muy pesada. El máximo permitido es 5 MB.');
      return;
    }
    onChange(file);
  };

  const hiddenInput = (
    <input
      ref={inputRef}
      id={id}
      type="file"
      accept={ACCEPT_ATTR}
      className="sr-only"
      onChange={(e) => accept(e.target.files?.[0])}
    />
  );

  const shownImage = preview ?? existingUrl ?? null;

  // Estado con imagen: vista previa + acciones (cambiar / quitar).
  if (shownImage) {
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200">
        <img src={shownImage} alt="Vista previa de la portada" className="h-44 w-full bg-slate-50 object-contain" />
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-700">
              {value ? value.name : 'Imagen actual'}
            </p>
            <p className="text-xs text-slate-400">{value ? formatSize(value.size) : 'Guardada en el libro'}</p>
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-md px-2.5 py-1 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-50"
            >
              Cambiar
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <X className="h-3.5 w-3.5" />
              Quitar
            </button>
          </div>
        </div>
        {hiddenInput}
      </div>
    );
  }

  // Estado vacío: zona para arrastrar o hacer clic.
  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        accept(e.dataTransfer.files?.[0]);
      }}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors',
        dragOver
          ? 'border-brand-500 bg-brand-50'
          : 'border-slate-300 bg-slate-50 hover:border-brand-400 hover:bg-slate-100',
      )}
    >
      <span
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-full transition-colors',
          dragOver ? 'bg-brand-100 text-brand-600' : 'bg-white text-slate-400 shadow-sm',
        )}
      >
        <UploadCloud className="h-5 w-5" />
      </span>
      <span className="text-sm font-medium text-slate-700">
        Arrastra una imagen o <span className="text-brand-600">haz clic para subir</span>
      </span>
      <span className="text-xs text-slate-400">PNG, JPG, WEBP o GIF · máx. 5 MB</span>
      {hiddenInput}
    </label>
  );
}
