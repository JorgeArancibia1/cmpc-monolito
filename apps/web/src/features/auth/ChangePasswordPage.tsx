import { passwordSchema } from '@cmpc/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiError } from '@/lib/api';
import { changePasswordRequest } from './api';
import { useAuth } from './AuthContext';

// La confirmación es solo del formulario; la política (≥10, mezcla) se reutiliza del contrato.
const formSchema = z
  .object({
    currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, 'Confirma tu nueva contraseña'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'La nueva contraseña debe ser distinta de la actual',
    path: ['newPassword'],
  });

type FormValues = z.infer<typeof formSchema>;

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  const onSubmit = async (values: FormValues) => {
    try {
      await changePasswordRequest({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      // El backend revoca todas las sesiones → cerramos la local y mandamos a iniciar sesión.
      toast.success('Contraseña actualizada. Inicia sesión nuevamente.');
      await logout();
      navigate('/login');
    } catch (error) {
      const apiError = getApiError(error);
      if (apiError.fields?.length) {
        apiError.fields.forEach((f) => setError(f.field as keyof FormValues, { message: f.message }));
      } else {
        toast.error(apiError.message);
      }
    }
  };

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Cambiar contraseña</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-slate-500">
          Cambiando la contraseña de <span className="font-medium text-slate-700">{user?.email}</span>.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1">
            <Label htmlFor="currentPassword">Contraseña actual</Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              {...register('currentPassword')}
            />
            {errors.currentPassword && (
              <p className="text-xs text-red-600">{errors.currentPassword.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="newPassword">Nueva contraseña</Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              {...register('newPassword')}
            />
            {errors.newPassword && <p className="text-xs text-red-600">{errors.newPassword.message}</p>}
            <p className="text-xs text-slate-400">
              Mínimo 10 caracteres, con mayúscula, minúscula y número.
            </p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="confirmNewPassword">Confirmar nueva contraseña</Label>
            <Input
              id="confirmNewPassword"
              type="password"
              autoComplete="new-password"
              {...register('confirmNewPassword')}
            />
            {errors.confirmNewPassword && (
              <p className="text-xs text-red-600">{errors.confirmNewPassword.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando…' : 'Cambiar contraseña'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
