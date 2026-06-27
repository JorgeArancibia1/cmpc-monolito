import type { CategoryCount } from '@cmpc/contracts';
import { BookCheck, BookX, Boxes, Layers, Library, PiggyBank, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { getApiError } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useAnalytics } from './hooks';

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-100 text-brand-700">
          {icon}
        </span>
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-xl font-semibold text-slate-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function BarList({ title, items }: { title: string; items: CategoryCount[] }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-slate-400">Sin datos</p>
        ) : (
          items.map((item) => (
            <div key={item.name} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-slate-700">{item.name}</span>
                <span className="text-slate-500">{item.count}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-brand-500"
                  style={{ width: `${(item.count / max) * 100}%` }}
                  role="progressbar"
                  aria-valuenow={item.count}
                  aria-label={item.name}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { data, isLoading, isError, error } = useAnalytics();

  if (isLoading) return <div className="flex justify-center p-10"><Spinner className="h-8 w-8" /></div>;
  if (isError || !data) return <p className="p-6 text-center text-red-600">{getApiError(error).message}</p>;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Panel de analítica</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard icon={<Library className="h-5 w-5" />} label="Libros" value={data.totalBooks} />
        <StatCard icon={<BookCheck className="h-5 w-5" />} label="Disponibles" value={data.availableBooks} />
        <StatCard icon={<BookX className="h-5 w-5" />} label="Agotados" value={data.outOfStockBooks} />
        <StatCard icon={<PiggyBank className="h-5 w-5" />} label="Valor inventario" value={formatPrice(data.inventoryValue)} />
        <StatCard icon={<Boxes className="h-5 w-5" />} label="Stock total" value={data.totalStock} />
        <StatCard icon={<Users className="h-5 w-5" />} label="Autores" value={data.totalAuthors} />
        <StatCard icon={<Library className="h-5 w-5" />} label="Editoriales" value={data.totalPublishers} />
        <StatCard icon={<Layers className="h-5 w-5" />} label="Géneros" value={data.totalGenres} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <BarList title="Libros por género" items={data.booksByGenre} />
        <BarList title="Libros por editorial" items={data.booksByPublisher} />
        <BarList title="Top autores" items={data.topAuthors} />
      </div>
    </div>
  );
}
