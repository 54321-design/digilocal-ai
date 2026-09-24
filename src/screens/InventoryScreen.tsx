import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, Alert } from 'react-native';
import { Package, Plus, Tag } from 'lucide-react-native';
import { useCommerce } from '../context/CommerceContext';
import { Card, Button, Input, Modal, Badge } from '../components';

export const InventoryScreen: React.FC = () => {
  const { products, addProduct } = useCommerce();

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [sku, setSku] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!name.trim() || !price || isNaN(Number(price))) {
      Alert.alert('Required Fields', 'Please enter a valid product name and price.');
      return;
    }
    setIsSubmitting(true);
    try {
      await addProduct(
        name.trim(),
        Number(price),
        isNaN(Number(stock)) ? 0 : Number(stock),
        sku.trim() || undefined
      );
      setModalVisible(false);
      setName('');
      setPrice('');
      setStock('');
      setSku('');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to add product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <View className="bg-white p-4 border-b border-slate-100 flex-row items-center justify-between">
        <View>
          <Text className="text-base font-bold text-slate-900">Products & Inventory</Text>
          <Text className="text-xs text-slate-500">{products.length} catalog items</Text>
        </View>
        <Button
          title="+ Add Product"
          onPress={() => setModalVisible(true)}
          size="sm"
          variant="primary"
        />
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <Card className="mb-2.5 p-3.5 bg-white border border-slate-200">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-2">
                <Text className="text-xs font-bold text-slate-900">{item.name}</Text>
                {item.sku ? (
                  <Text className="text-[10px] text-slate-400 mt-0.5">SKU: {item.sku}</Text>
                ) : null}
              </View>

              <View className="items-end">
                <Text className="text-xs font-extrabold text-blue-600">₹{item.price.toFixed(2)}</Text>
                <Badge
                  label={`Stock: ${item.stock}`}
                  variant={item.stock > 10 ? 'success' : item.stock > 0 ? 'warning' : 'danger'}
                  size="sm"
                  className="mt-1"
                />
              </View>
            </View>
          </Card>
        )}
      />

      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Add New Product"
      >
        <Input label="Product Name" value={name} onChangeText={setName} placeholder="e.g. Masala Chai 250g" />
        <Input
          label="Price (₹)"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          placeholder="e.g. 180"
        />
        <Input
          label="Initial Stock Quantity"
          value={stock}
          onChangeText={setStock}
          keyboardType="numeric"
          placeholder="e.g. 50"
        />
        <Input
          label="SKU / Barcode (Optional)"
          value={sku}
          onChangeText={setSku}
          placeholder="e.g. TEA-250-01"
        />
        <Button
          title="Save Product"
          onPress={handleAdd}
          loading={isSubmitting}
          variant="primary"
        />
      </Modal>
    </View>
  );
};
