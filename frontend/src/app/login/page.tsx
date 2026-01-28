'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { LOGIN } from '@/graphql/queries/auth';
import { useAuthStore } from '@/store/auth-store';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { UserRole } from '@/types';

const loginSchema = z.object({
  username: z.string().min(1, 'Usuario requerido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const [login, { loading }] = useMutation(LOGIN, {
    onCompleted: (data) => {
      const { authToken, user } = data.login;

      // Extract role from WordPress roles
      const wpRoles = user.role?.nodes?.map((r: { name: string }) => r.name) || [];
      let role: UserRole = 'agent';

      if (wpRoles.includes('administrator')) {
        role = 'admin';
      } else if (wpRoles.includes('editor') || wpRoles.includes('houzez_moderator')) {
        role = 'moderator';
      }

      setUser(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          role,
          avatar: user.avatar?.url,
        },
        authToken
      );

      router.push('/dashboard');
    },
    onError: (err) => {
      setError('Usuario o contraseña incorrectos');
      console.error('Login error:', err);
    },
  });

  const onSubmit = (data: LoginForm) => {
    setError(null);
    login({ variables: data });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/images/habita-logo.jpg"
            alt="HabitaCR"
            className="w-24 h-24 object-contain mx-auto mb-4 rounded-2xl shadow-lg"
          />
          <h1 className="text-3xl font-bold text-black">HabitaCR</h1>
          <p className="text-[#8B4513] mt-1 font-medium">CRM Inmobiliario</p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-2xl shadow-xl border border-[#e0ccb0] p-8">
          <h2 className="text-xl font-semibold text-center mb-6 text-black">
            Iniciar sesión
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Usuario de WordPress"
              type="text"
              placeholder="Ingrese su usuario"
              error={errors.username?.message}
              {...register('username')}
            />

            <div className="relative">
              <Input
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                placeholder="Ingrese su contraseña"
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                className="absolute right-3 top-[38px] text-[#8B4513] hover:text-[#5c2d0d]"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <div className="bg-[#f0e6d8] text-[#5c2d0d] text-sm p-3 rounded-lg border border-[#cca87a]">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-[#8B4513] hover:bg-[#6b350f] text-white"
              size="lg"
              isLoading={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-[#8B4513] mt-6">
          © {new Date().getFullYear()} HabitaCR. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
