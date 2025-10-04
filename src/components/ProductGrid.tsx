import { ShoppingCart } from 'lucide-react';
import { Product, getPublicUrl } from '../lib/supabase';

interface ProductGridProps {
  products: Product[];
  onProductClick: (product: Product) => void;
}

export default function ProductGrid({ products, onProductClick }: ProductGridProps) {
  return (
    <div className="mt-8">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">Semua Produk</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.slice(0, 6).map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer"
            onClick={() => onProductClick(product)}
          >
            <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
              <img
                src={getPublicUrl('products', product.image_url)}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              {product.is_best_seller && (
                <div className="absolute top-3 right-3 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                  Best Seller
                </div>
              )}
            </div>

            <div className="p-5">
              <h4 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                {product.name}
              </h4>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {product.description}
              </p>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Harga</p>
                  <p className="text-xl font-bold text-blue-600">
                    Rp {product.price.toLocaleString('id-ID')}
                  </p>
                </div>
                <button
                  className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200 hover:scale-110 shadow-md"
                  onClick={(e) => {
                    e.stopPropagation();
                    onProductClick(product);
                  }}
                >
                  <ShoppingCart className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Stok: <span className="font-semibold text-gray-700">{product.stock}</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
