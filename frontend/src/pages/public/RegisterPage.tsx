import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegister } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Mínimo 2 caracteres').max(50, 'Máximo 50 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Mínimo 6 caracteres').max(50, 'Máximo 50 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterForm) => {
    registerMutation.mutate({
      name: data.name,
      email: data.email,
      password: data.password,
    });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden">
      <div className="absolute -inset-4 bg-cover bg-center blur scale-110" style={{ backgroundImage: "url('/images/Home/pexels-joshuaworoniecki-11899978.jpg')" }} />
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">L</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Crear cuenta</h1>
          <p className="text-gray-400 mt-2">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-accent font-medium hover:text-accent/80">
              Iniciar sesión
            </Link>
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 space-y-4"
        >
          <Input
            label="Nombre completo"
            type="text"
            placeholder="Tu nombre"
            error={errors.name?.message}
            labelClassName="text-white/80"
            {...register('name')}
          />
          <Input
            label="Email"
            type="email"
            placeholder="tu@email.com"
            error={errors.email?.message}
            labelClassName="text-white/80"
            {...register('email')}
          />
          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            labelClassName="text-white/80"
            {...register('password')}
          />
          <Input
            label="Confirmar contraseña"
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            labelClassName="text-white/80"
            {...register('confirmPassword')}
          />
          <Button
            type="submit"
            size="lg"
            className="w-full !bg-accent text-white hover:!bg-accent/90 border-0"
            loading={registerMutation.isPending}
          >
            Crear cuenta
          </Button>
        </form>
      </div>
    </div>
  );
}
