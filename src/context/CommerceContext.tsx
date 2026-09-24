import React, { createContext, useContext, useState, useEffect } from 'react';
import { Customer, Product, Sale, LedgerEntry } from '../types';
import { useBusiness } from './BusinessContext';
import { LocalCache } from '../offline/storage';

interface CommerceContextType {
  customers: Customer[];
  products: Product[];
  sales: Sale[];
  khataEntries: LedgerEntry[];
  addCustomer: (name: string, phone: string, email?: string) => Promise<Customer>;
  addProduct: (name: string, price: number, stock: number, sku?: string) => Promise<Product>;
  recordSale: (sale: Omit<Sale, 'id' | 'timestamp'>) => Promise<Sale>;
  addKhataEntry: (entry: Omit<LedgerEntry, 'id' | 'date'>) => Promise<LedgerEntry>;
  isLoading: boolean;
}

const CommerceContext = createContext<CommerceContextType | undefined>(undefined);

export const CommerceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeBusiness } = useBusiness();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [khataEntries, setKhataEntries] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (activeBusiness) {
      loadData(activeBusiness.id);
    }
  }, [activeBusiness?.id]);

  const loadData = async (bizId: string) => {
    setIsLoading(true);
    try {
      const [c, p, s, k] = await Promise.all([
        LocalCache.getCustomers(bizId),
        LocalCache.getProducts(bizId),
        LocalCache.getSales(bizId),
        LocalCache.getKhataEntries(bizId),
      ]);
      setCustomers(c);
      setProducts(p);
      setSales(s);
      setKhataEntries(k);
    } catch (e) {
      console.warn('Commerce loadData note:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const addCustomer = async (name: string, phone: string, email?: string): Promise<Customer> => {
    if (!activeBusiness) throw new Error('No active business');
    const newCust: Customer = {
      id: `cust_${Date.now()}`,
      name,
      phone,
      email,
      balance: 0,
      createdAt: Date.now(),
    };
    const updated = [newCust, ...customers];
    setCustomers(updated);
    await LocalCache.saveCustomers(activeBusiness.id, updated);
    return newCust;
  };

  const addProduct = async (
    name: string,
    price: number,
    stock: number,
    sku?: string
  ): Promise<Product> => {
    if (!activeBusiness) throw new Error('No active business');
    const newProd: Product = {
      id: `prod_${Date.now()}`,
      name,
      price,
      stock,
      sku,
    };
    const updated = [newProd, ...products];
    setProducts(updated);
    await LocalCache.saveProducts(activeBusiness.id, updated);
    return newProd;
  };

  const recordSale = async (saleData: Omit<Sale, 'id' | 'timestamp'>): Promise<Sale> => {
    if (!activeBusiness) throw new Error('No active business');
    const newSale: Sale = {
      ...saleData,
      id: `sale_${Date.now()}`,
      timestamp: Date.now(),
    };
    const updated = [newSale, ...sales];
    setSales(updated);
    await LocalCache.saveSales(activeBusiness.id, updated);

    // Adjust product stock
    const updatedProducts = products.map((prod) => {
      const soldItem = saleData.items.find((i) => i.productId === prod.id);
      if (soldItem) {
        return { ...prod, stock: Math.max(0, prod.stock - soldItem.quantity) };
      }
      return prod;
    });
    setProducts(updatedProducts);
    await LocalCache.saveProducts(activeBusiness.id, updatedProducts);

    return newSale;
  };

  const addKhataEntry = async (
    entryData: Omit<LedgerEntry, 'id' | 'date'>
  ): Promise<LedgerEntry> => {
    if (!activeBusiness) throw new Error('No active business');
    const newEntry: LedgerEntry = {
      ...entryData,
      id: `khata_${Date.now()}`,
      date: Date.now(),
    };
    const updatedEntries = [newEntry, ...khataEntries];
    setKhataEntries(updatedEntries);
    await LocalCache.saveKhataEntries(activeBusiness.id, updatedEntries);

    // Update customer balance: 'give' increases what customer owes (+), 'got' decreases (-)
    const delta = entryData.type === 'give' ? entryData.amount : -entryData.amount;
    const updatedCustomers = customers.map((c) =>
      c.id === entryData.customerId ? { ...c, balance: c.balance + delta } : c
    );
    setCustomers(updatedCustomers);
    await LocalCache.saveCustomers(activeBusiness.id, updatedCustomers);

    return newEntry;
  };

  return (
    <CommerceContext.Provider
      value={{
        customers,
        products,
        sales,
        khataEntries,
        addCustomer,
        addProduct,
        recordSale,
        addKhataEntry,
        isLoading,
      }}
    >
      {children}
    </CommerceContext.Provider>
  );
};

export const useCommerce = () => {
  const context = useContext(CommerceContext);
  if (!context) throw new Error('useCommerce must be used within CommerceProvider');
  return context;
};
