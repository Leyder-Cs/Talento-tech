import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-7xl font-bold text-gray-700 mb-4">404</p>
        <h1 className="text-2xl font-bold text-gray-100 mb-2">Página no encontrada</h1>
        <p className="text-gray-400 mb-8">
          La página que buscás no existe o fue movida. Revisá el enlace o volvé al inicio.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/">
            <Button>Volver al inicio</Button>
          </Link>
          <Link to="/catalog">
            <Button variant="secondary">Ver catálogo</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
