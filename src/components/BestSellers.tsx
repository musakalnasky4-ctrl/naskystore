import { Star } from 'lucide-react';
import { Product, getPublicUrl } from '../lib/supabase';

interface BestSellersProps {
  products: Product[];
  onProductClick: (product: Product) => void;
}

export default function BestSellers({ products, onProductClick }: BestSellersProps) {
  const bestSellers = products.filter(p => p.is_best_seller).slice(0, 4);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-lg">
      <div className="flex items-center justify-center mb-6">
        <Star className="w-6 h-6 text-yellow-500 fill-yellow-500 mr-2" />
        <h3 className="text-xl font-bold text-gray-800">Best Seller</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {bestSellers.map((product) => (
          <button
            key={product.id}
            onClick={() => onProductClick(product)}
            className="flex flex-col items-center group"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-md">
              <img
                src={getPublicUrl('products', product.image_url)}
                alt={product.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            </div>
            <p className="text-sm font-semibold text-gray-800 text-center group-hover:text-blue-600 transition-colors">
              {product.name}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Rp {product.price.toLocaleString('id-ID')}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
