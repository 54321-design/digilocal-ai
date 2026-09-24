import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, TextInput, Alert } from 'react-native';
import { BookOpen, ArrowUpRight, ArrowDownLeft, Plus } from 'lucide-react-native';
import { useCommerce } from '../context/CommerceContext';
import { Card, Button, Modal, Input, Badge } from '../components';

export const KhataScreen: React.FC = () => {
  const { khataEntries, customers, addKhataEntry } = useCommerce();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCustId, setSelectedCustId] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'give' | 'got'>('give');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveEntry = async () => {
    if (!selectedCustId || !amount || isNaN(Number(amount))) {
      Alert.alert('Invalid Entry', 'Please select a customer and enter a valid numeric amount.');
      return;
    }

    const customer = customers.find((c) => c.id === selectedCustId);
    if (!customer) return;

    setIsSubmitting(true);
    try {
      await addKhataEntry({
        customerId: customer.id,
        customerName: customer.name,
        type,
        amount: Number(amount),
        note: note.trim() || undefined,
      });
      setModalVisible(false);
      setAmount('');
      setNote('');
      Alert.alert('Entry Recorded', `Ledger updated for ${customer.name}`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not record khata entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalGiven = khataEntries
    .filter((e) => e.type === 'give')
    .reduce((acc, e) => acc + e.amount, 0);

  const totalReceived = khataEntries
    .filter((e) => e.type === 'got')
    .reduce((acc, e) => acc + e.amount, 0);

  return (
    <View className="flex-1 bg-slate-50">
      {/* Header Summary */}
      <View className="bg-white p-4 border-b border-slate-100">
        <View className="flex-row justify-between mb-3">
          <View className="p-3 bg-rose-50 rounded-2xl flex-1 mr-2 border border-rose-100">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
              You Gave (Udhaar)
            </Text>
            <Text className="text-lg font-extrabold text-rose-700">₹{totalGiven.toFixed(2)}</Text>
          </View>
          <View className="p-3 bg-emerald-50 rounded-2xl flex-1 border border-emerald-100">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
              You Got (Received)
            </Text>
            <Text className="text-lg font-extrabold text-emerald-700">
              ₹{totalReceived.toFixed(2)}
            </Text>
          </View>
        </View>

        <Button
          title="+ Add Khata Transaction"
          onPress={() => setModalVisible(true)}
          size="sm"
          variant="primary"
        />
      </View>

      {/* Ledger History List */}
      <FlatList
        data={khataEntries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <Card className="mb-2.5 p-3.5 bg-white border border-slate-200">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 mr-2">
                <View
                  className={`p-2 rounded-xl mr-2.5 ${
                    item.type === 'give' ? 'bg-rose-100' : 'bg-emerald-100'
                  }`}
                >
                  {item.type === 'give' ? (
                    <ArrowUpRight size={16} color="#dc2626" />
                  ) : (
                    <ArrowDownLeft size={16} color="#059669" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-slate-900">{item.customerName}</Text>
                  <Text className="text-[11px] text-slate-400">
                    {new Date(item.date).toLocaleDateString()}
                    {item.note ? ` • ${item.note}` : ''}
                  </Text>
                </View>
              </View>

              <Text
                className={`text-sm font-extrabold ${
                  item.type === 'give' ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {item.type === 'give' ? '-' : '+'}₹{item.amount.toFixed(2)}
              </Text>
            </View>
          </Card>
        )}
      />

      {/* Modal to Add Ledger Entry */}
      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="New Khata Entry"
      >
        <Text className="text-xs font-bold text-slate-700 mb-1">Select Customer</Text>
        <View className="border border-slate-200 rounded-xl bg-slate-50 p-2 mb-3">
          {customers.length === 0 ? (
            <Text className="text-xs text-slate-400">No customers. Add customers first.</Text>
          ) : (
            customers.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => setSelectedCustId(c.id)}
                className={`p-2 rounded-lg mb-1 ${
                  selectedCustId === c.id ? 'bg-blue-600' : 'bg-white'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    selectedCustId === c.id ? 'text-white' : 'text-slate-800'
                  }`}
                >
                  {c.name} ({c.phone})
                </Text>
              </Pressable>
            ))
          )}
        </View>

        <Text className="text-xs font-bold text-slate-700 mb-1">Transaction Type</Text>
        <View className="flex-row mb-3">
          <Pressable
            onPress={() => setType('give')}
            className={`flex-1 py-2 rounded-xl border items-center mr-1 ${
              type === 'give' ? 'bg-rose-600 border-rose-600' : 'bg-white border-slate-200'
            }`}
          >
            <Text className={`text-xs font-bold ${type === 'give' ? 'text-white' : 'text-slate-700'}`}>
              Gave (Udhaar)
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setType('got')}
            className={`flex-1 py-2 rounded-xl border items-center ml-1 ${
              type === 'got' ? 'bg-emerald-600 border-emerald-600' : 'bg-white border-slate-200'
            }`}
          >
            <Text className={`text-xs font-bold ${type === 'got' ? 'text-white' : 'text-slate-700'}`}>
              Got (Received)
            </Text>
          </Pressable>
        </View>

        <Input
          label="Amount (₹)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="e.g. 500"
        />

        <Input
          label="Note (Optional)"
          value={note}
          onChangeText={setNote}
          placeholder="e.g. Grocery items"
        />

        <Button
          title="Save Khata Entry"
          onPress={handleSaveEntry}
          loading={isSubmitting}
          variant="primary"
        />
      </Modal>
    </View>
  );
};
