import { useState } from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
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

  // Mock 아이템 데이터 (교실 권리형 상품)
  const mockItems = [
    {
      id: '1',
      name: '숙제 면제권',
      description: '하루 동안 숙제를 하지 않아도 되는 특별 권리',
      price: 2000,
      stock: 10,
      forSale: true,
      studentTradable: false,
      category: '학습 권리',
      icon: '📝'
    },
    {
      id: '2',
      name: '발표 순서 변경권',
      description: '발표 순서를 원하는 순서로 바꿀 수 있는 권리',
      price: 1500,
      stock: 15,
      forSale: true,
      studentTradable: true,
      category: '수업 권리',
      icon: '🎤'
    },
    {
      id: '3',
      name: '수업 시간 과제 연장권',
      description: '수업 중 과제 시간을 10분 더 연장할 수 있는 권리',
      price: 1800,
      stock: 8,
      forSale: true,
      studentTradable: false,
      category: '학습 권리',
      icon: '⏰'
    },
    {
      id: '4',
      name: '자리 바꾸기권',
      description: '원하는 친구와 자리를 바꿀 수 있는 권리 (하루)',
      price: 1200,
      stock: 20,
      forSale: true,
      studentTradable: true,
      category: '교실 권리',
      icon: '🪑'
    },
    {
      id: '5',
      name: '쉬는 시간 칠판 낙서권',
      description: '쉬는 시간에 칠판에 그림이나 글을 쓸 수 있는 권리',
      price: 800,
      stock: 25,
      forSale: true,
      studentTradable: true,
      category: '재미 권리',
      icon: '🎨'
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">총 재고 가치</span>
            <span className="text-2xl">💰</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            <CountUp end={totalValue} duration={2} separator="," />
            <span className="text-lg font-normal text-gray-600 ml-1">{currentClass.currencyUnit}</span>
          </div>
          <div className="text-xs text-green-600 mt-2">▲ 8.5% 이번 주</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">판매 가능</span>
            <span className="text-2xl">🛒</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            <CountUp end={availableItems.length} duration={2} />
            <span className="text-lg font-normal text-gray-600 ml-1">개</span>
          </div>
          <div className="text-xs text-blue-600 mt-2">{allItems.length}개 중 판매중</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">총 재고</span>
            <span className="text-2xl">📦</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            <CountUp end={allItems.reduce((sum, item) => sum + item.stock, 0)} duration={2} />
            <span className="text-lg font-normal text-gray-600 ml-1">개</span>
          </div>
          <div className="text-xs text-gray-500 mt-2">{allItems.length}종 아이템</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">인기 카테고리</span>
            <span className="text-2xl">🏆</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            학습 권리
          </div>
          <div className="text-xs text-purple-600 mt-2">▲ 32% 판매량</div>
        </motion.div>
      </div>

      {isCreating && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white shadow-lg rounded-2xl border border-gray-100">
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
        </motion.div>
      )}

      {/* 아이템 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -4 }}
            className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{item.icon}</span>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                  </div>
                </div>
                <div className="flex space-x-1">
                  {item.forSale && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      판매중
                    </span>
                  )}
                  {item.studentTradable && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800">
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
                    className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                    disabled={item.stock === 0}
                  >
                    -1
                  </button>
                  <button
                    onClick={() => adjustStock(item.id, 1)}
                    className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    +1
                  </button>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-sky-600 hover:text-sky-700 text-sm font-medium transition-colors"
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
          </motion.div>
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