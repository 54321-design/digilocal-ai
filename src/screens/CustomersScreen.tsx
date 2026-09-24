import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, Alert } from 'react-native';
import { Users, Phone, Mail, Plus, UserPlus } from 'lucide-react-native';
import { useCommerce } from '../context/CommerceContext';
import { Card, Button, Input, Modal, Avatar } from '../components';

export const CustomersScreen: React.FC = () => {
  const { customers, addCustomer } = useCommerce();

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Required Fields', 'Please enter customer name and phone number.');
      return;
    }
    setIsSubmitting(true);
    try {
      await addCustomer(name.trim(), phone.trim(), email.trim() || undefined);
      setModalVisible(false);
      setName('');
      setPhone('');
      setEmail('');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to add customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <View className="bg-white p-4 border-b border-slate-100 flex-row items-center justify-between">
        <View>
          <Text className="text-base font-bold text-slate-900">Customer Directory</Text>
          <Text className="text-xs text-slate-500">{customers.length} contacts</Text>
        </View>
        <Button
          title="+ Add Customer"
          onPress={() => setModalVisible(true)}
          size="sm"
          variant="primary"
        />
      </View>

      <FlatList
        data={customers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <Card className="mb-2.5 p-3.5 bg-white border border-slate-200">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 mr-2">
                <Avatar name={item.name} size="sm" />
                <View className="ml-3 flex-1">
                  <Text className="text-xs font-bold text-slate-900">{item.name}</Text>
                  <View className="flex-row items-center mt-0.5">
                    <Phone size={11} color="#64748b" className="mr-1" />
                    <Text className="text-[11px] text-slate-500">{item.phone}</Text>
                  </View>
                </View>
              </View>

              <View className="items-end">
                <Text className="text-[10px] text-slate-400">Balance</Text>
                <Text
                  className={`text-xs font-bold ${
                    item.balance > 0
                      ? 'text-rose-600'
                      : item.balance < 0
                      ? 'text-emerald-600'
                      : 'text-slate-600'
                  }`}
                >
                  ₹{item.balance.toFixed(2)}
                </Text>
              </View>
            </View>
          </Card>
        )}
      />

      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="New Customer"
      >
        <Input label="Customer Name" value={name} onChangeText={setName} placeholder="e.g. Rahul Sharma" />
        <Input
          label="Phone Number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="e.g. +91 98765 43210"
        />
        <Input
          label="Email (Optional)"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholder="e.g. rahul@example.com"
        />
        <Button
          title="Save Customer"
          onPress={handleAdd}
          loading={isSubmitting}
          variant="primary"
        />
      </Modal>
    </View>
  );
};
