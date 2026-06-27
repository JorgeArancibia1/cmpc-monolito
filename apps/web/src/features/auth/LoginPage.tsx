import { loginSchema, type LoginInput } from '@cmpc/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { BookOpen } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiError } from '@/lib/api';
import { useAuth } from './AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'admin@cmpc.cl', password: 'Admin123!' },
  });

  const onSubmit = async (values: LoginInput) => {
    try {
      await login(values);
      toast.success('Sesión iniciada');
      navigate('/books');
    } catch (error) {
      toast.error(getApiError(error).message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-bold text-brand-700">
            <BookOpen className="h-5 w-5" /> CMPC Libros
          </CardTitle>
          <p className="mt-1 text-sm text-slate-500">Inicia sesión para gestionar el catálogo</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" type="email" autoComplete="username" {...register('email')} />
              {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
              {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
