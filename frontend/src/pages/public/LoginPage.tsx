import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLogin } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginForm) => {
    login.mutate(data);
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
          <h1 className="text-2xl font-bold text-white">Iniciar sesión</h1>
          <p className="text-gray-400 mt-2">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-accent font-medium hover:text-accent/80">
              Registrarse
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 space-y-4">
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
          <Button type="submit" size="lg" className="w-full !bg-accent text-white hover:!bg-accent/90 border-0" loading={login.isPending}>
            Iniciar sesión
          </Button>
        </form>
      </div>
    </div>
  );
}
