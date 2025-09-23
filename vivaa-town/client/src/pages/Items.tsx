import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCurrentClassroom } from '../state';

interface ItemFormData {
  name: string;
  description: string;
  price: number;
  stock: number;
  forSale: boolean;
  studentTradable: boolean;
}

function Items() {
  const [items, setItems] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const currentClass = useCurrentClassroom();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ItemFormData>();

  // Mock 아이템 데이터 (시연용)
  const mockItems = [
    {
      id: '1',
      name: '연필',
      description: '2B 연필, 학습용',
      price: 500,
      stock: 50,
      forSale: true,
      studentTradable: true,
      category: '학용품',
      icon: '✏️'
    },
    {
      id: '2',
      name: '지우개',
      description: '깨끗하게 지워지는 지우개',
      price: 300,
      stock: 30,
      forSale: true,
      studentTradable: true,
      category: '학용품',
      icon: '🗀'
    },
    {
      id: '3',
      name: '노트',
      description: 'A4 사이즈 노트',
      price: 1000,
      stock: 25,
      forSale: true,
      studentTradable: false,
      category: '학용품',
      icon: '📓'
    },
    {
      id: '4',
      name: '스티커',
      description: '귀여운 동물 스티커',
      price: 800,
      stock: 40,
      forSale: true,
      studentTradable: true,
      category: '장난감',
      icon: '🌟'
    },
    {
      id: '5',
      name: '간식 쿠폰',
      description: '매점에서 사용 가능한 간식 쿠폰',
      price: 1500,
      stock: 20,
      forSale: true,
      studentTradable: false,
      category: '쿠폰',
      icon: '🍪'
    },
  ];

  const onSubmit = (data: ItemFormData) => {
    if (editingItem) {
      // Update existing item
      const updatedItems = items.map(item =>
        item.id === editingItem.id ? { ...item, ...data } : item
      );
      setItems(updatedItems);
    } else {
      // Create new item
      const newItem = {
        id: Date.now().toString(),
        ...data,
        category: '기타',
        icon: '📦'
      };
      setItems([...items, newItem]);
    }

    setIsCreating(false);
    setEditingItem(null);
    reset();
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setIsCreating(true);
    reset({
      name: item.name,
      description: item.description,
      price: item.price,
      stock: item.stock,
      forSale: item.forSale,
      studentTradable: item.studentTradable,
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('정말 이 아이템을 삭제하시겠습니까?')) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const adjustStock = (id: string, amount: number) => {
    setItems(items.map(item =>
      item.id === id
        ? { ...item, stock: Math.max(0, item.stock + amount) }
        : item
    ));
  };

  const cancelForm = () => {
    setIsCreating(false);
    setEditingItem(null);
    reset();
  };

  const allItems = [...mockItems, ...items];

  if (!currentClass) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-sm font-medium text-gray-900">학급이 선택되지 않았습니다</h3>
        <p className="mt-1 text-sm text-gray-500">
          먼저 학급을 생성하거나 선택하세요.
        </p>
      </div>
    );
  }

  const totalValue = allItems.reduce((sum, item) => sum + (item.price * item.stock), 0);
  const availableItems = allItems.filter(item => item.forSale && item.stock > 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">아이템 상점</h1>
          <p className="mt-1 text-sm text-gray-500">
            {currentClass.name} - 총 {allItems.length}개 아이템
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700"
        >
          새 아이템 추가
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">💰</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">총 재고 가치</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {totalValue.toLocaleString()}{currentClass.currencyUnit}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">🛒</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">판매 가능</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {availableItems.length}개
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">📦</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">총 재고</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {allItems.reduce((sum, item) => sum + item.stock, 0)}개
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isCreating && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingItem ? '아이템 수정' : '새 아이템 추가'}
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    아이템 이름 *
                  </label>
                  <input
                    type="text"
                    {...register('name', { required: '아이템 이름을 입력하세요' })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    가격 *
                  </label>
                  <input
                    type="number"
                    {...register('price', { required: '가격을 입력하세요', valueAsNumber: true })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    설명
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    재고 수량
                  </label>
                  <input
                    type="number"
                    {...register('stock', { valueAsNumber: true })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    설정
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        id="forSale"
                        type="checkbox"
                        {...register('forSale')}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="forSale" className="ml-2 block text-sm text-gray-900">
                        판매 가능
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="studentTradable"
                        type="checkbox"
                        {...register('studentTradable')}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="studentTradable" className="ml-2 block text-sm text-gray-900">
                        학생 간 거래 가능
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={cancelForm}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  {editingItem ? '수정하기' : '추가하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 아이템 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allItems.map((item) => (
          <div key={item.id} className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{item.icon}</span>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.category}</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  {item.forSale && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      판매중
                    </span>
                  )}
                  {item.studentTradable && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      거래가능
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">{item.description}</p>

              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-2xl font-bold text-gray-900">
                    {item.price.toLocaleString()}{currentClass.currencyUnit}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  재고: <span className={`font-semibold ${item.stock === 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {item.stock}개
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => adjustStock(item.id, -1)}
                    className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                    disabled={item.stock === 0}
                  >
                    -1
                  </button>
                  <button
                    onClick={() => adjustStock(item.id, 1)}
                    className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
                  >
                    +1
                  </button>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                  >
                    수정
                  </button>
                  {!mockItems.includes(item) && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {allItems.length === 0 && (
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900">등록된 아이템이 없습니다</h3>
          <p className="mt-1 text-sm text-gray-500">
            새 아이템을 추가해보세요.
          </p>
        </div>
      )}
    </div>
  );
}

export default Items;