import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { Plus, Trash2, ShoppingBag, CreditCard, Check } from 'lucide-react-native';
import { useCommerce } from '../context/CommerceContext';
import { Card, Button, Input, Modal, Badge } from '../components';
import { SaleItem } from '../types';

export const POSScreen: React.FC = () => {
  const { products, customers, recordSale } = useCommerce();

  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'credit'>('upi');
  const [isProcessing, setIsProcessing] = useState(false);

  const addItemToCart = (prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    setCart((prev) => {
      const existing = prev.find((i) => i.productId === prodId);
      if (existing) {
        return prev.map((i) =>
          i.productId === prodId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { productId: prod.id, name: prod.name, price: prod.price, quantity: 1 }];
    });
  };

  const removeItem = (prodId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== prodId));
  };

  const totalAmount = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add products before checking out.');
      return;
    }
    setIsProcessing(true);
    try {
      await recordSale({
        customerName: selectedCustomer || 'Walk-in Customer',
        items: cart,
        totalAmount,
        paymentMethod,
      });
      Alert.alert('Sale Completed', `Recorded sale of ₹${totalAmount.toFixed(2)} via ${paymentMethod.toUpperCase()}`);
      setCart([]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to complete sale');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {/* Products Catalog Grid */}
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
          Catalog Products (Tap to Add)
        </Text>
        {products.length === 0 ? (
          <Card className="p-4 bg-white border border-slate-200 mb-4">
            <Text className="text-xs text-slate-500">
              No products found. Add products in Products & Inventory first.
            </Text>
          </Card>
        ) : (
          <View className="flex-row flex-wrap -mx-1 mb-4">
            {products.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => addItemToCart(p.id)}
                className="w-1/2 p-1"
              >
                <Card className="p-3 bg-white border border-slate-200 active:bg-blue-50">
                  <Text className="text-xs font-bold text-slate-800" numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text className="text-xs font-semibold text-blue-600 mt-1">₹{p.price}</Text>
                  <Text className="text-[10px] text-slate-400 mt-0.5">Stock: {p.stock}</Text>
                </Card>
              </Pressable>
            ))}
          </View>
        )}

        {/* Current Order Summary */}
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
          Current Cart Items
        </Text>
        <Card className="p-4 bg-white border border-slate-200 mb-4">
          {cart.length === 0 ? (
            <Text className="text-xs text-slate-400 py-3 text-center">Cart is empty</Text>
          ) : (
            cart.map((item) => (
              <View
                key={item.productId}
                className="flex-row items-center justify-between py-2 border-b border-slate-100 last:border-0"
              >
                <View className="flex-1 mr-2">
                  <Text className="text-xs font-bold text-slate-800">{item.name}</Text>
                  <Text className="text-[11px] text-slate-500">
                    {item.quantity} × ₹{item.price}
                  </Text>
                </View>
                <Text className="text-xs font-bold text-slate-900 mr-3">
                  ₹{item.price * item.quantity}
                </Text>
                <Pressable onPress={() => removeItem(item.productId)} className="p-1">
                  <Trash2 size={15} color="#ef4444" />
                </Pressable>
              </View>
            ))
          )}

          <View className="flex-row justify-between pt-3 mt-2 border-t border-slate-200">
            <Text className="text-sm font-bold text-slate-800">Total Amount</Text>
            <Text className="text-base font-extrabold text-blue-600">₹{totalAmount.toFixed(2)}</Text>
          </View>
        </Card>

        {/* Payment Method Selector */}
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
          Payment Method
        </Text>
        <View className="flex-row mb-6">
          {(['upi', 'cash', 'card', 'credit'] as const).map((method) => (
            <Pressable
              key={method}
              onPress={() => setPaymentMethod(method)}
              className={`flex-1 mx-1 py-2.5 rounded-xl border items-center ${
                paymentMethod === method
                  ? 'bg-blue-600 border-blue-600'
                  : 'bg-white border-slate-200'
              }`}
            >
              <Text
                className={`text-xs font-bold uppercase ${
                  paymentMethod === method ? 'text-white' : 'text-slate-700'
                }`}
              >
                {method}
              </Text>
            </Pressable>
          ))}
        </View>

        <Button
          title={`Charge ₹${totalAmount.toFixed(2)}`}
          onPress={handleCheckout}
          loading={isProcessing}
          disabled={cart.length === 0}
          size="lg"
          variant="primary"
        />
      </ScrollView>
    </View>
  );
};
