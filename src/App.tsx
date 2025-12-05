import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LayoutDashboard, ShoppingCart, Package, Users, Plus, Minus, Trash2, Search, Menu, X, ChevronRight, Truck, History, Receipt, UserPlus, Calendar, Tag, Check, MessageCircle, AlertTriangle, BookOpen, Globe, Repeat, ArrowRight, ArrowLeft, CalendarDays, PackageCheck, ScrollText, DollarSign, Image as ImageIcon, Loader2,  CheckCircle2, Clock, AlertCircle, ShoppingBag, Palette, Globe2, ListChecks, CreditCard, TrendingUp, Wallet, PieChart, BarChart3, ArrowUpRight, ArrowDownRight, Filter, TrendingDown, ClipboardList } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, limit, increment, writeBatch, getDocs, where, getDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// --- CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyDwPmUUYFYuoIZFKlY7T6ZHbBB65GeyJzo",
  authDomain: "natura-a5c0e.firebaseapp.com",
  projectId: "natura-a5c0e",
  storageBucket: "natura-a5c0e.firebasestorage.app",
  messagingSenderId: "273052718882",
  appId: "1:273052718882:web:e1b95d14fb26982be0377b",
  measurementId: "G-S04ET4J8Q6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app); 
const APP_ID = "natura-produccion-main";

const BRANDS = ['Natura', 'Avon', 'Cyzone', 'Esika', "L'Bel"];
const SUPPLY_PROVIDERS = ['Natura', 'Belcorp']; // Agrupación para compras
const COURIERS = ['Yo (Directo)', 'Mamá (Puesto Feria)', 'Tía Luisa']; 

// --- THEME CONSTANTS ---
// Primary Color: Teal/Mint (#0d9488 - tailwind teal-600)
// Secondary: Emerald/Cyan
// Background: Slate-50

const generateShortId = () => {
  const number = Math.floor(100 + Math.random() * 900);
  const letters = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + String.fromCharCode(65 + Math.floor(Math.random() * 26)) + String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `${number}-${letters}`;
};

const MoneyInput = ({ value, onChange, placeholder, className, autoFocus, disabled }) => {
    const isValid = value !== '' && value !== null && value !== undefined;
    const displayValue = isValid ? parseInt(value).toLocaleString('es-CL') : '';
    const handleChange = (e) => {
        const rawValue = e.target.value.replace(/\D/g, '');
        const numberValue = rawValue === '' ? '' : parseInt(rawValue, 10);
        onChange(numberValue);
    };
    return <input type="text" inputMode="numeric" className={className} placeholder={placeholder} value={displayValue} onChange={handleChange} autoFocus={autoFocus} disabled={disabled} />;
};

export default function PosApp() {
  const formatMoney = (amount) => (amount || 0).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const formatDateSimple = (seconds) => { if (!seconds) return '-'; const d = new Date(seconds * 1000); return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit' }); };
  const getStockStatus = (stock) => {
      if (stock === 0) return { color: 'bg-rose-500 text-white', label: 'AGOTADO' };
      if (stock === 1) return { color: 'bg-rose-100 text-rose-700 border border-rose-200', label: 'CRÍTICO' };
      if (stock > 1 && stock < 4) return { color: 'bg-amber-100 text-amber-800 border border-amber-200', label: 'BAJO' };
      return { color: 'bg-emerald-100 text-emerald-700 border border-emerald-200', label: 'BIEN' };
  };
    
  const [user, setUser] = useState(null); 
  const [view, setView] = useState('dashboard'); 
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [cycles, setCycles] = useState([]); 
  const [batches, setBatches] = useState([]); 
  const [cart, setCart] = useState([]);
  const [selectedClient, setSelectedClient] = useState(''); 
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  
  // Payment Plans (Sales)
  const [paymentPlanType, setPaymentPlanType] = useState('full'); 
  const [checkoutData, setCheckoutData] = useState({ installmentsCount: 3, installmentDates: {}, });
  
  // Payment Plans (Purchases/Supply)
  const [supplyPaymentPlan, setSupplyPaymentPlan] = useState('full');
  const [supplyCheckoutData, setSupplyCheckoutData] = useState({ installmentsCount: 3, installmentDates: {} });

  const [paymentMethod, setPaymentMethod] = useState('Efectivo'); 
  const [loading, setLoading] = useState(true); 
  const [searchTerm, setSearchTerm] = useState('');
  const [processingMsg, setProcessingMsg] = useState(''); 
  const [alertState, setAlertState] = useState({ show: false, title: '', message: '', type: 'info' }); 
  const triggerAlert = (title, message, type = 'error') => { setAlertState({ show: true, title, message, type }); };
    
  const [confirmDeliveryModal, setConfirmDeliveryModal] = useState({ show: false, transaction: null });
  const [deliveryDateInput, setDeliveryDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [deliveryTransaction, setDeliveryTransaction] = useState(null);
  const [selectedCourier, setSelectedCourier] = useState('Yo (Directo)');
  const [editingProduct, setEditingProduct] = useState(null);
  const [productPriceInput, setProductPriceInput] = useState(''); 
  const [receiptDetails, setReceiptDetails] = useState(null);
  const [productHistory, setProductHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [checkInOrder, setCheckInOrder] = useState(null); 
  const [checkInItems, setCheckInItems] = useState([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('ALL'); 
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showClientOptions, setShowClientOptions] = useState(false);
  const clientInputRef = useRef(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPaymentTx, setSelectedPaymentTx] = useState(null);
  const [selectedPaymentIndex, setSelectedPaymentIndex] = useState(null); 
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [viewingHistoryProduct, setViewingHistoryProduct] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- NEW SUPPLY LOGIC STATES ---
  const [supplyMode, setSupplyMode] = useState(null); 
  const [supplyConfig, setSupplyConfig] = useState(null); 
  
  const [cycleNameModal, setCycleNameModal] = useState({ show: false, brand: '' });
  const [tempCycleName, setTempCycleName] = useState('');
  
  const [addToOrderModal, setAddToOrderModal] = useState({ show: false, product: null });
  const [addOrderCost, setAddOrderCost] = useState('');
  const [addOrderQty, setAddOrderQty] = useState(1);

  const [isCartDetailsOpen, setIsCartDetailsOpen] = useState(false);
  const [isSalesHistoryOpen, setIsSalesHistoryOpen] = useState(false);
  const [isPurchaseHistoryOpen, setIsPurchaseHistoryOpen] = useState(false);

  // --- DASHBOARD FILTER STATES ---
  const [dashboardDateFilter, setDashboardDateFilter] = useState('month'); // 'day', 'week', 'month', 'custom'
  const [dashboardCustomRange, setDashboardCustomRange] = useState({ start: '', end: '' });

  // --- ORDER VIEW FILTER STATE ---
  const [orderViewTab, setOrderViewTab] = useState('pending'); // 'pending', 'ready', 'transit'

  // --- UTILS DEFINED HERE TO AVOID HOISTING ISSUES ---
  const getClientName = (id) => { if (!id) return 'Consumidor Final'; const c = clients.find(c => c.id === id); return c ? c.name : 'Consumidor Final'; };
  
  const calculatePaymentSchedule = (total, planType, data) => {
      let schedule = [];
      if (planType === 'full') { schedule.push({ number: 1, date: null, amount: total, status: 'pending', type: 'total' }); } 
      else if (planType === 'installments') {
          const count = Number(data.installmentsCount);
          const amountPerQuota = Math.round(total / count);
          for (let i = 0; i < count; i++) {
              const manualDate = data.installmentDates[i];
              const dateSecs = manualDate ? new Date(manualDate + 'T12:00:00').getTime() / 1000 : null;
              schedule.push({ number: i + 1, date: dateSecs, amount: amountPerQuota, status: 'pending', type: 'cuota' });
          }
      }
      return schedule;
  };

  // --- DERIVED STATE ---
  const stockAnalysis = useMemo(() => {
    const available = [];
    const missing = [];
    let canDeliverAll = true;
    cart.forEach(item => {
        const prod = products.find(p => p.id === item.id);
        const currentStock = prod ? prod.stock : 0;
        if (currentStock >= item.qty) { available.push(item); } else {
            if (currentStock > 0) { available.push({ ...item, qty: currentStock }); missing.push({ ...item, qty: item.qty - currentStock, currentStock: 0 }); } 
            else { missing.push({ ...item, currentStock }); }
            canDeliverAll = false;
        }
    });
    return { available, missing, canDeliverAll };
  }, [cart, products]);

  const dashboardData = useMemo(() => {
      const now = new Date();
      let startDate = new Date();
      let endDate = new Date();

      if (dashboardDateFilter === 'day') {
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
      } else if (dashboardDateFilter === 'week') {
          const day = startDate.getDay();
          const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
          startDate.setDate(diff);
          startDate.setHours(0, 0, 0, 0);
      } else if (dashboardDateFilter === 'month') {
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
      } else if (dashboardDateFilter === 'custom' && dashboardCustomRange.start) {
          startDate = new Date(dashboardCustomRange.start);
          endDate = dashboardCustomRange.end ? new Date(dashboardCustomRange.end) : new Date();
          endDate.setHours(23, 59, 59, 999);
      }

      // Filter transactions
      const filteredSales = transactions.filter(t => 
          t.type === 'sale' && 
          t.date?.seconds && // Safety check
          t.date.seconds * 1000 >= startDate.getTime() && 
          t.date.seconds * 1000 <= endDate.getTime()
      );

      const totalSales = filteredSales.reduce((sum, t) => sum + t.total, 0);
      // Total Cost (FIFO)
      const totalCost = filteredSales.reduce((sum, t) => sum + (t.totalCost || 0), 0);
      // Real Margin
      const totalMargin = totalSales - totalCost;
      const marginPercent = totalSales > 0 ? (totalMargin / totalSales) * 100 : 0;

      // Order Stats (Logistics)
      const pendingStock = transactions.filter(t => t.type === 'sale' && t.saleStatus === 'pending_order').length;
      const readyToDeliver = transactions.filter(t => t.type === 'sale' && t.saleStatus === 'pending_delivery').length;
      const inTransit = transactions.filter(t => t.type === 'sale' && t.saleStatus === 'in_transit').length;
      const toArrive = transactions.filter(t => t.type === 'order' && t.saleStatus === 'pending_arrival').length;

      // Daily Trend
      const trendMap = {};
      filteredSales.forEach(t => {
          if(!t.date?.seconds) return;
          const dateKey = new Date(t.date.seconds * 1000).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' });
          trendMap[dateKey] = (trendMap[dateKey] || 0) + t.total;
      });
      const trendData = Object.entries(trendMap).map(([date, total]) => ({ date, total })).sort((a,b) => a.date.localeCompare(b.date)); 

      // Top Products
      const productMap = {};
      filteredSales.forEach(t => {
          (t.items || []).forEach(item => {
              if (!productMap[item.id]) productMap[item.id] = { name: item.name, qty: 0, total: 0 };
              productMap[item.id].qty += item.qty;
              productMap[item.id].total += (item.transactionPrice * item.qty);
          });
      });
      const topProducts = Object.values(productMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

      // Top Clients
      const clientMap = {};
      filteredSales.forEach(t => {
          const cName = getClientName(t.clientId);
          if (!clientMap[cName]) clientMap[cName] = { name: cName, total: 0, count: 0 };
          clientMap[cName].total += t.total;
          clientMap[cName].count += 1;
      });
      const topClients = Object.values(clientMap).sort((a, b) => b.total - a.total).slice(0, 5);

      return { totalSales, totalCost, totalMargin, marginPercent, pendingStock, readyToDeliver, inTransit, toArrive, trendData, topProducts, topClients };
  }, [transactions, batches, dashboardDateFilter, dashboardCustomRange, clients]); 

  const getOrderTag = (t) => {
      let isStock = false;
      let isReserved = false;
      let hasPending = false;
      (t.items || []).forEach(i => {
          if (i.status === 'delivered') isStock = true; 
          if (i.status === 'reserved') isReserved = true; 
          if (i.status === 'pending') hasPending = true;
      });
      if (hasPending) return { label: 'Por Encargar', color: 'bg-slate-100 text-slate-500', icon: BookOpen };
      if (isReserved) return { label: 'En Stock', color: 'bg-teal-100 text-teal-700', icon: CheckCircle2 };
      if (isStock) return { label: 'Entregado', color: 'bg-emerald-100 text-emerald-700', icon: PackageCheck };
      return { label: 'Entregado', color: 'bg-slate-100 text-slate-500', icon: Check };
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
        else await signInAnonymously(auth);
      } catch (error) { try { await signInAnonymously(auth); } catch (anonError) { console.error("Anon failed", anonError); } }
    };
    initAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => { if (currentUser) { setUser(currentUser); setLoading(false); setProcessingMsg(''); } else { setLoading(true); } });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const basePath = `artifacts/${APP_ID}/public/data`;
    const unsubProducts = onSnapshot(collection(db, basePath, 'products'), (s) => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubClients = onSnapshot(collection(db, basePath, 'clients'), (s) => { const data = s.docs.map(d => ({ id: d.id, ...d.data() })); data.sort((a, b) => a.name.localeCompare(b.name)); setClients(data); });
    const unsubCategories = onSnapshot(collection(db, basePath, 'categories'), (s) => setCategories(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubTrans = onSnapshot(query(collection(db, basePath, 'transactions'), orderBy('date', 'desc'), limit(300)), (s) => setTransactions(s.docs.map(d => ({ id: d.id, ...d.data() })))); 
    const unsubCycles = onSnapshot(collection(db, basePath, 'cycles'), (s) => setCycles(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubBatches = onSnapshot(collection(db, basePath, 'inventory_batches'), (s) => setBatches(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubProducts(); unsubClients(); unsubCategories(); unsubTrans(); unsubCycles(); unsubBatches(); };
  }, [user]);

  // --- ACTIONS ---

  const calculateFIFO = async (productId, qtyNeeded) => {
      const q = query(
          collection(db, `artifacts/${APP_ID}/public/data/inventory_batches`), 
          where('productId', '==', productId),
          where('remainingQty', '>', 0),
          orderBy('date', 'asc')
      );
      const snapshot = await getDocs(q);
      const batches = snapshot.docs.map(d => ({...d.data(), id: d.id}));
      
      let remaining = qtyNeeded;
      let totalCost = 0;
      const batchUpdates = []; 

      for (const batch of batches) {
          if (remaining <= 0) break;
          const take = Math.min(remaining, batch.remainingQty);
          totalCost += (take * batch.cost);
          remaining -= take;
          batchUpdates.push({ id: batch.id, newQty: batch.remainingQty - take });
      }
      return { totalCost, batchUpdates };
  };

  const initiateAddToCart = (product) => {
      setAddOrderCost(''); 
      setAddOrderQty(1);
      setAddToOrderModal({ show: true, product });
  };

  const confirmAddToCart = () => {
      const { product } = addToOrderModal;
      if (!product) return;
      const cost = addOrderCost === '' ? 0 : Number(addOrderCost);
      addToCart(product, supplyConfig.type, null, supplyConfig.cycleName, cost, addOrderQty);
      setAddToOrderModal({ show: false, product: null });
  };

  const addToCart = (product, type = 'pos_sale', cycleId = null, cycleName = null, costOverride = null, qty = 1) => {
    setCart(prev => { 
        const existingIndex = prev.findIndex(p => p.id === product.id && p.orderType === type);
        const priceToUse = costOverride !== null ? Number(costOverride) : product.price;
        if (existingIndex >= 0) {
            const newCart = [...prev]; 
            newCart[existingIndex].qty += qty; 
            newCart[existingIndex].transactionPrice = priceToUse;
            return newCart;
        } 
        return [...prev, { ...product, transactionPrice: priceToUse, qty: qty, orderType: type, assignedCycleName: cycleName }]; 
    });
  };

  const handleConfirmCheckout = async () => {
    if (!selectedClient) { triggerAlert("Falta Cliente", "Selecciona un cliente.", "error"); return; }
    setLoading(true); setProcessingMsg("Procesando Venta...");
    try {
        const batch = writeBatch(db);
        const newTransId = doc(collection(db, `artifacts/${APP_ID}/public/data/transactions`)).id;
        const now = new Date();
        let finalItems = [];
        let saleTotalCost = 0; 

        for (let item of stockAnalysis.available) {
             const { totalCost, batchUpdates } = await calculateFIFO(item.id, item.qty);
             saleTotalCost += totalCost;
             batchUpdates.forEach(u => {
                 batch.update(doc(db, `artifacts/${APP_ID}/public/data/inventory_batches`, u.id), { remainingQty: u.newQty });
             });
             batch.update(doc(db, `artifacts/${APP_ID}/public/data/products`, item.id), { stock: increment(-item.qty) });
             finalItems.push({ ...item, status: 'reserved', orderType: 'stock', unitCostFIFO: totalCost/item.qty });
        }

        for (let item of stockAnalysis.missing) {
             finalItems.push({ ...item, status: 'pending', orderType: 'pending_supply' }); 
        }

        const total = cart.reduce((acc, item) => acc + (item.transactionPrice * item.qty), 0);
        const margin = total - saleTotalCost;

        const transactionData = { 
            id: newTransId, displayId: generateShortId(), type: 'sale', items: finalItems, total, 
            clientId: selectedClient, date: { seconds: now.getTime() / 1000 }, 
            paymentPlanType, paymentSchedule: calculatePaymentSchedule(total, paymentPlanType, checkoutData), 
            balance: total, paymentStatus: 'pending', 
            saleStatus: stockAnalysis.missing.length === 0 ? 'pending_delivery' : 'pending_order', 
            origin: 'POS',
            totalCost: saleTotalCost, 
            margin: margin 
        };

        batch.set(doc(db, `artifacts/${APP_ID}/public/data/transactions`, newTransId), transactionData);
        await batch.commit();
        clearCart(); setIsCheckoutModalOpen(false); triggerAlert("Éxito", "Venta registrada.", "success");
    } catch (error) { console.error(error); triggerAlert("Error", "No se pudo guardar.", "error"); } finally { setLoading(false); setProcessingMsg(''); }
  };

  const handleNotifyClient = (transaction) => {
      const client = clients.find(c => c.id === transaction.clientId);
      if (!client || !client.phone) { triggerAlert("Sin teléfono", "El cliente no tiene número registrado.", "error"); return; }
      let message = `Hola *${client.name}*! 👋\n\nTe cuento que ya tengo listos tus productos:\n`;
      (transaction.items || []).forEach(i => { if (i.status === 'delivered' || i.status === 'reserved') message += `- ${i.name} x${i.qty}\n`; });
      message += `\nTotal: $${formatMoney(transaction.total)}\n\n¿Cuándo te acomoda que coordinemos la entrega?`;
      window.open(`https://wa.me/${client.phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleDeliverOrder = (transaction) => { setReceiptDetails(null); setDeliveryTransaction(transaction); setSelectedCourier('Yo (Directo)'); setIsDeliveryModalOpen(true); };

  const startDeliveryProcess = async () => {
      if (!deliveryTransaction) return;
      if (deliveryTransaction.paymentPlanType === 'full' && deliveryTransaction.balance > 0) {
          triggerAlert("Pago Pendiente", "Este pedido es al contado y aún tiene deuda. No se puede entregar.", "error");
          return;
      }

      setLoading(true); setProcessingMsg(selectedCourier === 'Yo (Directo)' ? "Cerrando Venta..." : "Enviando a Reparto...");
      try {
          const batch = writeBatch(db); 
          const updatedItems = (deliveryTransaction.items || []).map(i => i.status === 'reserved' ? {...i, status: 'delivered'} : i);
          const nextStatus = selectedCourier === 'Yo (Directo)' ? 'completed' : 'in_transit'; const now = new Date();
          batch.update(doc(db, `artifacts/${APP_ID}/public/data/transactions`, deliveryTransaction.id), { saleStatus: nextStatus, courier: selectedCourier, deliveredAt: { seconds: now.getTime() / 1000 }, items: updatedItems });
          await batch.commit(); setIsDeliveryModalOpen(false); setDeliveryTransaction(null); triggerAlert("Actualizado", "Estado actualizado.", "success");
      } catch (error) { console.error(error); triggerAlert("Error", "Fallo proceso.", "error"); } finally { setLoading(false); setProcessingMsg(''); }
  };

  const removeFromCart = (index) => setCart(prev => prev.filter((_, i) => i !== index));
  const updateQty = (index, d) => setCart(prev => prev.map((p, i) => { if (i === index) { const n = Math.max(1, p.qty + d); return { ...p, qty: n }; } return p; }));
  
  const clearCart = () => { setCart([]); setSelectedClient(''); setPaymentPlanType('full'); setCheckoutData({ installmentsCount: 3, installmentDates: {} }); setSupplyPaymentPlan('full'); setSupplyCheckoutData({ installmentsCount: 3, installmentDates: {} }); };
  const cartTotal = useMemo(() => cart.reduce((acc, item) => acc + (item.transactionPrice * item.qty), 0), [cart]);

  // --- SUPPLY LOGIC (PURCHASES) ---
  const handleCreateSupplyOrder = async () => {
      if (cart.length === 0) { triggerAlert("Vacío", "Agrega productos.", "info"); return; }
      setLoading(true); setProcessingMsg('Generando Pedido...');
      try {
          const batch = writeBatch(db);
          const newTransId = doc(collection(db, `artifacts/${APP_ID}/public/data/transactions`)).id;
          const total = cart.reduce((acc, i) => acc + (i.transactionPrice * i.qty), 0);
          const now = new Date();
          let clientName = "Stock Web";
          if (supplyConfig.type === 'cycle') {
              clientName = `Stock ${supplyConfig.brand} - ${supplyConfig.cycleName}`;
          } else {
              clientName = `Stock Web ${supplyConfig.brand}`;
          }

          const data = {
              id: newTransId, displayId: generateShortId(), type: 'order', items: cart, total, 
              clientId: clientName, date: { seconds: now.getTime() / 1000 }, 
              saleStatus: 'pending_arrival', 
              orderType: supplyConfig.type,
              paymentPlanType: supplyPaymentPlan,
              paymentSchedule: calculatePaymentSchedule(total, supplyPaymentPlan, supplyCheckoutData),
              balance: total,
              paymentStatus: 'pending'
          };
          batch.set(doc(db, `artifacts/${APP_ID}/public/data/transactions`, newTransId), data);
          await batch.commit();
          clearCart(); setSupplyMode(null); setSupplyConfig(null); setIsCartDetailsOpen(false);
          triggerAlert("Pedido Creado", "Quedó en 'Esperando Paquete'.", "success");
      } catch (error) { console.error(error); triggerAlert("Error", "Fallo al crear pedido.", "error"); } finally { setLoading(false); setProcessingMsg(''); }
  };

  const startCheckIn = (transaction) => {
      const explodedItems = [];
      (transaction.items || []).forEach((item) => { 
          for(let i=0; i < item.qty; i++) { 
              explodedItems.push({ _tempId: `${item.id}_${i}_${Date.now()}`, ...item, uniqueQty: 1, expirationDate: '', received: true }); 
          } 
      });
      setCheckInItems(explodedItems); setCheckInOrder(transaction);
  };
  
  const toggleItemReceived = (tempId) => {
      setCheckInItems(prev => prev.map(i => i._tempId === tempId ? { ...i, received: !i.received } : i));
  }

  const confirmCheckIn = async () => {
      const receivedItems = checkInItems.filter(i => i.received);
      if (receivedItems.some(i => !i.expirationDate)) { triggerAlert("Faltan Fechas", "Ingresa vencimiento de los productos recibidos.", "error"); return; }
      setLoading(true); setProcessingMsg('Ingresando Stock...');
      try {
          const batch = writeBatch(db); 
          const pendingOrdersSnapshot = await getDocs(query(collection(db, `artifacts/${APP_ID}/public/data/transactions`), where('saleStatus', '==', 'pending_order')));
          const pendingOrders = pendingOrdersSnapshot.docs.map(d => ({ ...d.data(), id: d.id }));
          const stockBuffer = {}; 

          receivedItems.forEach(item => {
              batch.set(doc(collection(db, `artifacts/${APP_ID}/public/data/inventory_batches`)), { 
                  productId: item.id, productName: item.name, date: { seconds: Date.now() / 1000 }, 
                  cost: Number(item.transactionPrice), initialQty: 1, remainingQty: 1, 
                  supplierId: checkInOrder.clientId, expirationDate: item.expirationDate, 
                  transactionId: checkInOrder.id, origin: supplyConfig?.type || 'unknown'
              });
              batch.update(doc(db, `artifacts/${APP_ID}/public/data/products`, item.id), { stock: increment(1) });
              stockBuffer[item.id] = (stockBuffer[item.id] || 0) + 1;
          });

          pendingOrders.forEach(order => {
              let orderModified = false;
              let allItemsReady = true;
              const updatedItems = (order.items || []).map(orderItem => {
                  if (orderItem.status === 'pending') {
                      if (stockBuffer[orderItem.id] > 0) {
                          stockBuffer[orderItem.id]--; 
                          batch.update(doc(db, `artifacts/${APP_ID}/public/data/products`, orderItem.id), { stock: increment(-1) }); 
                          orderModified = true;
                          return { ...orderItem, status: 'reserved' };
                      } else {
                          allItemsReady = false;
                          return orderItem;
                      }
                  } else if (orderItem.status !== 'reserved' && orderItem.status !== 'delivered') {
                      allItemsReady = false;
                  }
                  return orderItem;
              });

              if (orderModified) {
                  const updates = { items: updatedItems };
                  if (allItemsReady) updates.saleStatus = 'pending_delivery';
                  batch.update(doc(db, `artifacts/${APP_ID}/public/data/transactions`, order.id), updates);
              }
          });

          batch.update(doc(db, `artifacts/${APP_ID}/public/data/transactions`, checkInOrder.id), { 
              type: 'stock_entry', saleStatus: 'completed', checkInDate: { seconds: Date.now() / 1000 },
              note: checkInItems.some(i => !i.received) ? 'Algunos productos no llegaron.' : ''
          });
          
          await batch.commit(); 
          setCheckInOrder(null); setCheckInItems([]);
          triggerAlert("Stock Actualizado", `${receivedItems.length} productos ingresados y asignados.`, "success");
      } catch (error) { console.error(error); triggerAlert("Error", "Falló el ingreso.", "error"); } finally { setLoading(false); setProcessingMsg(''); }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault(); const fd = new FormData(e.currentTarget); const imageFile = fd.get('image'); const price = Number(productPriceInput) || 0;
    if (!editingProduct && (!imageFile || imageFile.size === 0)) { triggerAlert("Falta Imagen", "Es obligatorio subir una foto.", "error"); return; }
    setLoading(true); let imageUrl = editingProduct?.imageUrl || null;
    try {
        if (imageFile && imageFile.size > 0) { const snap = await uploadBytes(ref(storage, `natura/${Date.now()}_${imageFile.name}`), imageFile); imageUrl = await getDownloadURL(snap.ref); }
        const data = { name: fd.get('name'), brand: fd.get('brand'), price, category: fd.get('category'), stock: editingProduct ? editingProduct.stock : 0, imageUrl };
        if (editingProduct) await updateDoc(doc(db, `artifacts/${APP_ID}/public/data/products`, editingProduct.id), data); else await addDoc(collection(db, `artifacts/${APP_ID}/public/data/products`), data);
        setIsProductModalOpen(false); setEditingProduct(null); setProductPriceInput('');
    } catch (e) { console.error(e); triggerAlert("Error", "Error al guardar.", "error"); } finally { setLoading(false); }
  };

  const handleSaveClient = async (e) => {
    e.preventDefault(); const fd = new FormData(e.currentTarget); const clientData = { name: fd.get('name'), phone: fd.get('phone') || '' };
    try { const docRef = await addDoc(collection(db, `artifacts/${APP_ID}/public/data/clients`), clientData); 
    if (isCheckoutModalOpen) { setSelectedClient(docRef.id); setClientSearchTerm(clientData.name); } 
    setIsClientModalOpen(false); triggerAlert("Cliente Creado", "Registrado exitosamente.", "success"); } catch (e) { triggerAlert("Error", "Fallo al guardar.", "error"); }
  };

  const handleDeleteProduct = async (productId) => {
      if(window.confirm("¿Eliminar este producto?")) {
        try { await deleteDoc(doc(db, `artifacts/${APP_ID}/public/data/products`, productId)); triggerAlert("Eliminado", "Producto eliminado", "success"); } catch (e) { triggerAlert("Error", "Fallo al eliminar", "error"); }
      }
  }

  // --- FILTERS ---
  const filteredProducts = products.filter(p => {
    const matchesSearch = (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategoryFilter === 'ALL' || p.category === selectedCategoryFilter;
    const matchesBrand = selectedBrandFilter === 'ALL' || p.brand === selectedBrandFilter;
    let matchesSupply = true;
    if (supplyConfig) {
        if (supplyConfig.brand === 'Natura') {
            matchesSupply = ['Natura', 'Avon'].includes(p.brand);
        } else if (supplyConfig.brand === 'Belcorp') {
            matchesSupply = ['Cyzone', 'Esika', "L'Bel"].includes(p.brand);
        } else {
            matchesSupply = p.brand === supplyConfig.brand;
        }
    }
    return matchesSearch && matchesCategory && matchesBrand && matchesSupply;
  });

  const filteredClientsForSearch = clients.filter(c => c.name.toLowerCase().includes(clientSearchTerm.toLowerCase()));
  
  const pendingArrivals = useMemo(() => transactions.filter(t => t.type === 'order' && t.saleStatus === 'pending_arrival'), [transactions]);
  const salesHistory = useMemo(() => transactions.filter(t => t.type === 'sale' && (t.saleStatus === 'completed' || t.saleStatus === 'delivered')), [transactions]);
  const purchaseHistory = useMemo(() => transactions.filter(t => (t.type === 'order' || t.type === 'stock_entry')), [transactions]);

  const getBrandGradient = (brand) => {
      const b = brand.toLowerCase();
      if(b.includes('natura')) return 'from-orange-400 to-amber-500';
      if(b.includes('avon')) return 'from-pink-500 to-rose-600';
      return 'from-purple-500 to-indigo-600';
  }

  if (loading && !user) return <div className="flex h-screen items-center justify-center bg-slate-50 text-teal-900 font-serif font-bold text-xl"><Loader2 className="animate-spin mr-2"/> Cargando Sistema...</div>;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden relative">
      {/* ALERTS & MODALS LAYER */}
      {loading && processingMsg && <div className="fixed inset-0 bg-teal-900/80 z-[110] flex flex-col items-center justify-center text-white backdrop-blur-sm"><Loader2 className="w-12 h-12 animate-spin mb-4"/><span className="font-bold text-xl">{processingMsg}</span></div>}
      
      {alertState.show && (
        <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className={`bg-white rounded-3xl p-6 w-full max-w-xs text-center border-t-8 ${alertState.type === 'success' ? 'border-teal-500' : 'border-rose-500'}`}>
                <h3 className="text-xl font-bold mb-2 font-serif text-teal-900">{alertState.title}</h3>
                <p className="text-sm text-slate-500 mb-6">{alertState.message}</p>
                <button onClick={() => setAlertState({...alertState, show: false})} className="w-full py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700">Entendido</button>
            </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-teal-900 text-white h-full shadow-2xl shrink-0 z-20">
          <div className="p-6 border-b border-teal-800 flex items-center gap-3">
             <div className="p-2 bg-white/10 rounded-lg"><Palette className="w-6 h-6 text-teal-300" /></div>
             <div><h1 className="font-serif font-bold text-xl tracking-wide">Consultora</h1><p className="text-[10px] text-teal-300 uppercase tracking-widest">Panel de Control</p></div>
          </div>
          <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
              <SidebarItem icon={<LayoutDashboard />} label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
              <SidebarItem icon={<ShoppingCart />} label="Vender (POS)" active={view === 'pos'} onClick={() => setView('pos')} />
              <SidebarItem icon={<ShoppingBag />} label="Compras" active={view === 'purchases'} onClick={() => { setView('purchases'); setSupplyMode(null); }} />
              <SidebarItem icon={<Receipt />} label="Pedidos Clientes" active={view === 'receipts'} onClick={() => setView('receipts')} />
              <SidebarItem icon={<DollarSign />} label="Por Cobrar" active={view === 'finances'} onClick={() => setView('finances')} />
              <SidebarItem icon={<CreditCard />} label="Por Pagar" active={view === 'payables'} onClick={() => setView('payables')} />
          </nav>
      </aside>

      {/* MOBILE HEADER */}
      <div className="md:hidden fixed top-0 w-full bg-teal-900 text-white z-40 px-4 py-3 flex justify-between items-center shadow-md">
         <div className="flex items-center gap-3">
             <button onClick={() => setIsMobileMenuOpen(true)}><Menu className="w-6 h-6"/></button>
             <span className="font-serif font-bold text-lg">Consultora App</span>
         </div>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-teal-900 text-white flex flex-col">
            <div className="p-4 flex justify-between items-center border-b border-teal-800"><span className="font-serif font-bold text-xl">Menú</span><button onClick={() => setIsMobileMenuOpen(false)}><X className="w-6 h-6"/></button></div>
            <nav className="flex-1 p-4 space-y-4">
                 <button onClick={() => { setView('dashboard'); setIsMobileMenuOpen(false); }} className="flex gap-3 text-lg font-bold items-center"><LayoutDashboard/> Dashboard</button>
                 <button onClick={() => { setView('pos'); setIsMobileMenuOpen(false); }} className="flex gap-3 text-lg font-bold items-center"><ShoppingCart/> Vender</button>
                 <button onClick={() => { setView('purchases'); setSupplyMode(null); setIsMobileMenuOpen(false); }} className="flex gap-3 text-lg font-bold items-center"><ShoppingBag/> Compras</button>
                 <button onClick={() => { setView('receipts'); setIsMobileMenuOpen(false); }} className="flex gap-3 text-lg font-bold items-center"><Receipt/> Pedidos</button>
                 <button onClick={() => { setView('finances'); setIsMobileMenuOpen(false); }} className="flex gap-3 text-lg font-bold items-center"><DollarSign/> Por Cobrar</button>
                 <button onClick={() => { setView('payables'); setIsMobileMenuOpen(false); }} className="flex gap-3 text-lg font-bold items-center"><CreditCard/> Por Pagar</button>
            </nav>
        </div>
      )}

      <main className={`flex-1 overflow-hidden relative flex flex-col ${view !== 'pos' ? 'overflow-y-auto' : ''} md:pt-0 pt-14`}>
        
        {/* === VIEW: DASHBOARD (NEW UX) === */}
        {view === 'dashboard' && (
            <div className="p-6 h-full overflow-y-auto bg-slate-50">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <h2 className="font-serif font-bold text-3xl text-teal-900">Dashboard</h2>
                    <div className="flex bg-white rounded-2xl p-1 border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
                        {['day', 'week', 'month', 'custom'].map(t => (
                             <button key={t} onClick={() => setDashboardDateFilter(t)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${dashboardDateFilter === t ? 'bg-teal-100 text-teal-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{t === 'day' ? 'Hoy' : t === 'week' ? 'Semana' : t === 'month' ? 'Mes' : 'Personalizado'}</button>
                        ))}
                    </div>
                </div>

                {dashboardDateFilter === 'custom' && (
                    <div className="flex gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 animate-in slide-in-from-top-2">
                        <div className="flex-1"><label className="text-xs font-bold text-slate-400 uppercase">Desde</label><input type="date" className="w-full font-bold text-teal-900 outline-none" value={dashboardCustomRange.start} onChange={e => setDashboardCustomRange({...dashboardCustomRange, start: e.target.value})} /></div>
                        <div className="flex-1"><label className="text-xs font-bold text-slate-400 uppercase">Hasta</label><input type="date" className="w-full font-bold text-teal-900 outline-none" value={dashboardCustomRange.end} onChange={e => setDashboardCustomRange({...dashboardCustomRange, end: e.target.value})} /></div>
                    </div>
                )}

                {/* NEW METRICS CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Card 1: Ventas */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10">
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4"><TrendingUp className="w-6 h-6"/></div>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Ventas Totales</p>
                            <h3 className="text-3xl font-black text-slate-800 mt-1">${formatMoney(dashboardData.totalSales)}</h3>
                        </div>
                    </div>
                    {/* Card 2: Costos */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10">
                            <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-4"><TrendingDown className="w-6 h-6"/></div>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Costos Totales</p>
                            <h3 className="text-3xl font-black text-slate-800 mt-1">${formatMoney(dashboardData.totalCost)}</h3>
                        </div>
                    </div>
                    {/* Card 3: Margen */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10">
                            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4"><Wallet className="w-6 h-6"/></div>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Margen Real</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <h3 className="text-3xl font-black text-slate-800">${formatMoney(dashboardData.totalMargin)}</h3>
                                <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">{Math.round(dashboardData.marginPercent)}%</span>
                            </div>
                        </div>
                    </div>
                    {/* Card 4: Inventario */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-violet-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10">
                            <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center mb-4"><Package className="w-6 h-6"/></div>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Valor Inventario</p>
                            <h3 className="text-3xl font-black text-slate-800 mt-1">${formatMoney(dashboardData.inventoryValue)}</h3>
                        </div>
                    </div>
                </div>

                {/* NEW: LOGISTICS KPIs */}
                <h3 className="font-bold text-lg text-teal-900 mb-4 flex items-center gap-2">Estado de Pedidos</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                     <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                         <div className="text-2xl font-black text-slate-700">{dashboardData.pendingStock}</div>
                         <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Por Encargar</div>
                     </div>
                     <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                         <div className="text-2xl font-black text-amber-600">{dashboardData.toArrive}</div>
                         <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-1">Por Llegar</div>
                     </div>
                     <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                         <div className="text-2xl font-black text-emerald-600">{dashboardData.readyToDeliver}</div>
                         <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Por Entregar</div>
                     </div>
                     <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                         <div className="text-2xl font-black text-orange-600">{dashboardData.inTransit}</div>
                         <div className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mt-1">En Reparto</div>
                     </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Daily Trend Chart */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 lg:col-span-2">
                        <h3 className="font-bold text-lg text-teal-900 mb-6 flex items-center gap-2"><BarChart3 className="w-5 h-5"/> Tendencia de Ventas</h3>
                        <div className="h-48 flex items-end gap-2 overflow-x-auto pb-2 no-scrollbar px-2">
                             {dashboardData.trendData.map((item, idx) => {
                                 const maxVal = Math.max(...dashboardData.trendData.map(d => d.total), 1);
                                 const heightPercent = (item.total / maxVal) * 100;
                                 return (
                                     <div key={idx} className="h-full flex flex-col justify-end items-center gap-2 group min-w-[40px] flex-1 cursor-pointer">
                                         <div className="w-full bg-teal-500 rounded-t-lg opacity-80 group-hover:opacity-100 transition-all relative group-hover:bg-teal-600" style={{ height: `${Math.max(heightPercent, 5)}%` }}>
                                             <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg z-10">${formatMoney(item.total)}</div>
                                         </div>
                                         <div className="text-[10px] font-bold text-slate-400">{item.date.split('/')[0]}</div>
                                     </div>
                                 )
                             })}
                             {dashboardData.trendData.length === 0 && <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">Sin datos para el periodo.</div>}
                        </div>
                    </div>

                    {/* Top Products */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-lg text-teal-900 mb-4 flex items-center gap-2"><ArrowUpRight className="w-5 h-5 text-emerald-500"/> Top Productos</h3>
                        <div className="space-y-4">
                            {dashboardData.topProducts.map((p, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="font-black text-slate-300 w-4 text-center">{idx+1}</div>
                                        <div className="font-bold text-slate-700 line-clamp-1 max-w-[140px]">{p.name}</div>
                                    </div>
                                    <div className="font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-lg text-xs">{p.qty} un.</div>
                                </div>
                            ))}
                            {dashboardData.topProducts.length === 0 && <div className="text-slate-400 text-xs">Sin datos.</div>}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-lg text-teal-900 mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-blue-500"/> Top Clientes</h3>
                        <div className="space-y-4">
                            {dashboardData.topClients.map((c, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-3"><div className="font-black text-slate-300 w-4 text-center">{idx+1}</div><div className="font-bold text-slate-700">{c.name}</div></div>
                                    <div className="font-bold text-slate-900">${formatMoney(c.total)}</div>
                                </div>
                            ))}
                            {dashboardData.topClients.length === 0 && <div className="text-slate-400 text-xs">Sin datos.</div>}
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-teal-800 to-teal-900 p-8 rounded-3xl shadow-lg text-white relative overflow-hidden flex flex-col justify-center">
                        <div className="relative z-10"><h3 className="font-serif font-bold text-2xl mb-2">Acceso Rápido</h3><p className="opacity-80 mb-6">Gestiona tu negocio de forma eficiente.</p><div className="flex gap-3"><button onClick={() => setView('pos')} className="bg-white text-teal-900 px-6 py-3 rounded-xl font-bold hover:bg-slate-100 shadow-lg">Nueva Venta</button><button onClick={() => setView('purchases')} className="bg-teal-600 border border-teal-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-500 shadow-lg">Comprar Stock</button></div></div>
                        <Globe className="absolute -right-10 -bottom-10 w-64 h-64 text-white/5"/>
                    </div>
                </div>
            </div>
        )}

        {/* === VIEW: POS (SELL) === */}
        {view === 'pos' && (
             <div className="flex flex-col h-full relative">
                 <div className="bg-white border-b border-slate-100 shadow-sm z-10 p-4">
                     <div className="relative mb-3"><Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400"/><input className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-teal-500 font-bold text-slate-700" placeholder="Buscar producto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/></div>
                     <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                         <button onClick={() => setSelectedCategoryFilter('ALL')} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${selectedCategoryFilter === 'ALL' ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Todos</button>
                         {categories.map(c => <button key={c.id} onClick={() => setSelectedCategoryFilter(c.id)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${selectedCategoryFilter === c.id ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{c.name}</button>)}
                     </div>
                 </div>

                 <div className="flex-1 overflow-y-auto p-4 bg-slate-50 pb-48">
                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                         {filteredProducts.map(p => (
                             <div key={p.id} onClick={() => addToCart(p)} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col group hover:shadow-xl transition-all h-full text-left relative cursor-pointer hover:-translate-y-1">
                                 <div className="aspect-square w-full relative bg-slate-50">
                                     {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <Package className="w-full h-full p-8 text-slate-300" />}
                                     {p.stock <= 0 && <div className="absolute inset-0 bg-slate-900/60 z-10 flex items-center justify-center backdrop-blur-[2px]"><span className="text-white font-bold text-xs border border-white/30 bg-black/20 px-3 py-1 rounded-full uppercase tracking-widest">Agotado</span></div>}
                                 </div>
                                 <div className="p-4 flex flex-col flex-1 justify-between w-full">
                                     <span className="font-bold text-sm line-clamp-2 leading-snug text-slate-700 mb-2">{p.name}</span>
                                     <div className="flex justify-between items-end">
                                         <div className="text-teal-600 font-black text-lg">${formatMoney(p.price)}</div>
                                         <div className={`text-[10px] font-bold px-2 py-1 rounded-lg ${getStockStatus(p.stock).color}`}>{p.stock} un.</div>
                                     </div>
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>
                 
                 {cart.length > 0 && (
                    <div className="fixed bottom-[70px] md:bottom-0 md:left-64 right-0 z-30 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-10">
                        <div className="rounded-t-3xl border-t border-slate-200 p-5 bg-white/95 backdrop-blur-md">
                            <div className="max-h-48 overflow-y-auto mb-3 space-y-3 pr-2 custom-scrollbar">
                                {cart.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center border-b border-slate-100 pb-2 last:border-0">
                                            <div className="flex-1">
                                                <div className="text-sm font-bold text-slate-800 line-clamp-1">{item.name}</div>
                                                <div className="flex items-center gap-2 mt-1"><button onClick={() => updateQty(idx, -1)} className="bg-slate-100 p-1 rounded-lg hover:bg-slate-200"><Minus className="w-3 h-3 text-slate-600"/></button><span className="text-xs font-bold w-4 text-center">{item.qty}</span><button onClick={() => updateQty(idx, 1)} className="bg-slate-100 p-1 rounded-lg hover:bg-slate-200"><Plus className="w-3 h-3 text-slate-600"/></button></div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <button onClick={() => removeFromCart(idx)} className="text-slate-300 hover:text-rose-500 p-1"><X className="w-4 h-4"/></button>
                                                <div className="text-sm font-black text-teal-600">${formatMoney(item.transactionPrice * item.qty)}</div>
                                            </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => { setIsCheckoutModalOpen(true); }} className="w-full h-14 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold flex justify-between px-8 items-center shadow-lg hover:shadow-teal-500/30 transition-all">
                                <span className="flex items-center gap-2 text-lg">Ir a Pagar <ChevronRight className="w-5 h-5"/></span>
                                <span className="text-xl font-serif">${formatMoney(cartTotal)}</span>
                            </button>
                        </div>
                    </div>
                )}
             </div>
        )}

        {/* === VIEW: PURCHASES (STOCK & SUPPLY) === */}
        {view === 'purchases' && (
            <div className="flex flex-col h-full bg-slate-50">
                
                {/* 1. TOP SECTION: RECEPTION WIDGET (HIDDEN IN SHOPPING MODE) */}
                {!supplyMode && (
                    <div className="p-6 pb-0 animate-in slide-in-from-top duration-300">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-serif font-bold text-2xl text-teal-900">Compras</h2>
                            <div className="flex gap-2">
                                <button onClick={() => setIsPurchaseHistoryOpen(true)} className="flex items-center gap-1 bg-white border border-slate-200 text-slate-500 px-4 py-2 rounded-xl text-xs font-bold hover:text-teal-700 hover:border-teal-200 shadow-sm"><History className="w-4 h-4"/> Historial</button>
                                <button onClick={() => { setEditingProduct(null); setIsProductModalOpen(true); }} className="bg-teal-50 border border-teal-100 text-teal-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-teal-100 shadow-sm">+ Producto</button>
                            </div>
                        </div>

                        {/* RECEPTION WIDGET */}
                        <div className="bg-white rounded-3xl p-1 shadow-sm border border-slate-200 mb-6">
                            <div className="bg-slate-50 rounded-[20px] p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-xl ${pendingArrivals.length > 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-400'}`}>
                                        <Truck className="w-6 h-6"/>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">Recepción de Pedidos</h3>
                                        <p className="text-xs text-slate-500">
                                            {pendingArrivals.length > 0 
                                                ? `${pendingArrivals.length} paquetes esperando llegada.` 
                                                : "No hay pedidos pendientes."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {pendingArrivals.length > 0 && (
                                <div className="p-4 flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                                    {pendingArrivals.map(order => (
                                        <button key={order.id} onClick={() => startCheckIn(order)} className="flex-shrink-0 bg-white border border-slate-200 rounded-xl p-3 min-w-[200px] text-left hover:border-teal-400 hover:shadow-md transition-all group relative overflow-hidden">
                                            <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full bg-gradient-to-bl ${order.orderType === 'web' ? 'from-cyan-100 to-transparent' : 'from-rose-100 to-transparent'} opacity-50`}></div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{order.orderType === 'web' ? 'Web' : 'Ciclo'}</div>
                                            <div className="font-bold text-slate-800 text-sm truncate">{order.clientId}</div>
                                            <div className="text-lg font-black text-slate-800 mt-1">${formatMoney(order.total)}</div>
                                            <div className="mt-2 text-xs font-bold text-teal-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">Ingresar Stock <ChevronRight className="w-3 h-3"/></div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 2. MAIN CONTENT AREA */}
                <div className={`flex-1 overflow-y-auto ${!supplyMode ? 'px-6 pb-24' : 'px-0 pb-0'} transition-all`}>
                    
                    {!supplyMode ? (
                        // --- DASHBOARD: SELECT MODE ---
                        <div className="animate-in slide-in-from-bottom duration-500 px-6">
                            <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 tracking-wider">Nueva Compra</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* CARD 1: CYCLE */}
                                <button onClick={() => setSupplyMode('selection_cycle')} className="relative h-48 rounded-3xl overflow-hidden shadow-lg group text-left">
                                    <div className="absolute inset-0 bg-gradient-to-br from-rose-400 to-orange-400 opacity-90 transition-opacity group-hover:opacity-100"></div>
                                    <div className="absolute inset-0 p-6 flex flex-col justify-between text-white">
                                        <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                            <BookOpen className="w-6 h-6 text-white"/>
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-serif font-bold mb-1">Compra por Ciclo</h3>
                                            <p className="text-sm text-white/80 font-medium">Revista, Preventa y Ofertas</p>
                                        </div>
                                        <ChevronRight className="absolute bottom-6 right-6 w-8 h-8 opacity-50 group-hover:opacity-100 group-hover:translate-x-2 transition-all"/>
                                    </div>
                                </button>

                                {/* CARD 2: WEB */}
                                <button onClick={() => setSupplyMode('selection_web')} className="relative h-48 rounded-3xl overflow-hidden shadow-lg group text-left">
                                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 opacity-90 transition-opacity group-hover:opacity-100"></div>
                                    <div className="absolute inset-0 p-6 flex flex-col justify-between text-white">
                                        <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                            <Globe className="w-6 h-6 text-white"/>
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-serif font-bold mb-1">Compra Web</h3>
                                            <p className="text-sm text-white/80 font-medium">Online, Cyber y Liquidación</p>
                                        </div>
                                        <ChevronRight className="absolute bottom-6 right-6 w-8 h-8 opacity-50 group-hover:opacity-100 group-hover:translate-x-2 transition-all"/>
                                    </div>
                                </button>
                            </div>

                            <div className="mt-8">
                                <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 tracking-wider">Herramientas</h3>
                                <div className="flex gap-4">
                                     <button onClick={() => setIsCategoryModalOpen(true)} className="flex items-center gap-2 px-5 py-3 bg-white rounded-xl border border-slate-200 font-bold text-slate-600 hover:border-teal-500 hover:text-teal-700 shadow-sm"><Tag className="w-4 h-4"/> Categorías</button>
                                     <button onClick={() => {setViewingHistoryProduct(null); setIsHistoryModalOpen(true);}} className="flex items-center gap-2 px-5 py-3 bg-white rounded-xl border border-slate-200 font-bold text-slate-600 hover:border-teal-500 hover:text-teal-700 shadow-sm"><History className="w-4 h-4"/> Historial Global</button>
                                </div>
                            </div>
                        </div>
                    ) : supplyMode.startsWith('selection') ? (
                        // --- BRAND SELECTION ---
                        <div className="animate-in slide-in-from-right duration-300 px-6">
                             <button onClick={() => setSupplyMode(null)} className="flex items-center gap-2 text-slate-400 font-bold mb-6 hover:text-teal-700"><ArrowLeft className="w-4 h-4"/> Volver</button>
                             <h3 className="text-2xl font-serif font-bold text-teal-900 mb-2">Elige la Marca</h3>
                             <p className="text-slate-500 mb-6">¿De qué marca es el pedido que vas a ingresar?</p>
                             
                             <div className="grid grid-cols-2 gap-4">
                                 {SUPPLY_PROVIDERS.map(brand => (
                                     <button key={brand} 
                                        onClick={() => {
                                            if (supplyMode === 'selection_cycle') {
                                                setTempCycleName('');
                                                setCycleNameModal({ show: true, brand });
                                            } else {
                                                setSupplyConfig({ type: 'web', brand });
                                                setSupplyMode('shopping');
                                            }
                                        }}
                                        className={`p-6 rounded-2xl bg-gradient-to-br ${brand === 'Natura' ? 'from-orange-400 to-amber-500' : 'from-purple-500 to-indigo-600'} text-white font-bold text-xl shadow-lg hover:scale-[1.02] transition-transform text-left relative overflow-hidden`}
                                     >
                                         <span className="relative z-10">{brand}</span>
                                         <Palette className="absolute -bottom-4 -right-4 w-24 h-24 text-white/20 rotate-12"/>
                                     </button>
                                 ))}
                             </div>
                        </div>
                    ) : (
                        // --- SHOPPING MODE (CATALOG - FULL SCREEN) ---
                        <div className="animate-in slide-in-from-right duration-300 h-full flex flex-col bg-white">
                            {/* Header for Shopping */}
                            <div className="bg-white p-4 border-b border-stone-100 shadow-sm sticky top-0 z-20">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => { setSupplyMode(null); setSupplyConfig(null); clearCart(); }} className="p-2 hover:bg-stone-100 rounded-full"><ArrowLeft className="w-5 h-5 text-stone-500"/></button>
                                        <div>
                                            <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{supplyConfig.type === 'cycle' ? 'Pedido Ciclo' : 'Pedido Web'}</div>
                                            <div className="font-bold text-xl text-[#1e4620]">{supplyConfig.brand} {supplyConfig.cycleName ? `• ${supplyConfig.cycleName}` : ''}</div>
                                        </div>
                                    </div>
                                    {cart.length > 0 && <div className="font-black text-xl text-[#d97706]">${formatMoney(cartTotal)}</div>}
                                </div>
                                <input className="w-full bg-[#fdfbf7] border border-stone-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-[#d97706]" placeholder={`Buscar en ${supplyConfig.brand}...`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} autoFocus/>
                            </div>

                            {/* Catalog Grid - RESTORED TO SQUARES: Back to 2/3/4 cols but full screen */}
                            <div className="flex-1 overflow-y-auto p-6 pb-32">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {filteredProducts.map(p => (
                                        <button key={p.id} onClick={() => initiateAddToCart(p)} className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden flex flex-col group hover:shadow-lg transition-all text-left relative h-full">
                                            <div className="aspect-square w-full relative bg-[#fdfbf7]">
                                                {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <Package className="w-full h-full p-8 text-[#d4dcd6]" />}
                                                <div className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"><Plus className="w-4 h-4 text-[#1e4620]"/></div>
                                            </div>
                                            <div className="p-3 flex flex-col flex-1 justify-between">
                                                <span className="font-bold text-sm line-clamp-2 leading-snug text-[#1e4620] mb-2">{p.name}</span>
                                                <div className="text-[#d97706] font-bold text-lg">${formatMoney(p.price)}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sticky Cart Footer for Supply (CLICKABLE NOW) */}
                            {cart.length > 0 && (
                                <div className="fixed bottom-0 md:left-64 left-0 right-0 bg-white p-4 border-t border-[#e5e7eb] shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-30">
                                    <div className="max-w-4xl mx-auto flex gap-4 items-center">
                                         <button onClick={() => setIsCartDetailsOpen(true)} className="flex-1 text-left flex items-center justify-between bg-[#fdfbf7] p-3 rounded-xl border border-stone-200 hover:border-[#1e4620] transition-colors">
                                             <div>
                                                 <div className="text-xs text-stone-400 font-bold uppercase">{cart.length} productos</div>
                                                 <div className="text-lg font-black text-[#1e4620]">${formatMoney(cartTotal)}</div>
                                             </div>
                                             <ListChecks className="w-5 h-5 text-stone-400"/>
                                         </button>
                                         <button onClick={() => setIsCartDetailsOpen(true)} className="px-6 py-4 bg-[#1e4620] text-white rounded-xl font-bold shadow-lg hover:bg-[#153316]">Confirmar</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* === VIEW: RECEIPTS (LOGISTICS) === */}
        {view === 'receipts' && (
            <div className="flex flex-col h-full bg-slate-50">
                <div className="p-6 pb-2">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-serif font-bold text-3xl text-teal-900">Pedidos</h2>
                        <button onClick={() => setIsSalesHistoryOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-xs hover:text-teal-700 hover:border-teal-200 transition-colors shadow-sm">
                            <History className="w-4 h-4"/> Historial
                        </button>
                    </div>
                    {/* TABS */}
                    <div className="flex p-1 bg-white border border-slate-200 rounded-xl shadow-sm mb-4">
                        <button onClick={() => setOrderViewTab('pending')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${orderViewTab === 'pending' ? 'bg-amber-100 text-amber-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Por Encargar</button>
                        <button onClick={() => setOrderViewTab('ready')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${orderViewTab === 'ready' ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Por Entregar</button>
                        <button onClick={() => setOrderViewTab('transit')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${orderViewTab === 'transit' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>En Reparto</button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-24">
                    <div className="max-w-4xl mx-auto space-y-4">
                        {/* 1. PENDIENTES */}
                        {orderViewTab === 'pending' && (
                             <div className="animate-in slide-in-from-right">
                                 <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 pl-1">Falta Stock</div>
                                 <div className="space-y-3">
                                     {transactions.filter(t => t.saleStatus === 'pending_order').map(t => (
                                         <div key={t.id} onClick={() => setReceiptDetails(t)} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:border-amber-300 transition-all group">
                                             <div className="flex justify-between mb-2">
                                                 <span className="font-bold text-slate-800 text-lg">{getClientName(t.clientId)}</span>
                                                 <span className="font-black text-slate-600">${formatMoney(t.total)}</span>
                                             </div>
                                             <div className="flex justify-between items-center">
                                                  <div className="flex items-center gap-2 text-xs text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-lg"><Clock className="w-3 h-3"/> Esperando productos...</div>
                                                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500"/>
                                             </div>
                                         </div>
                                     ))}
                                     {transactions.filter(t => t.saleStatus === 'pending_order').length === 0 && <div className="text-center py-10 text-slate-400 italic">No hay pedidos pendientes de stock.</div>}
                                 </div>
                             </div>
                        )}

                        {/* 2. LISTOS */}
                        {orderViewTab === 'ready' && (
                             <div className="animate-in slide-in-from-right">
                                 <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 pl-1">Listos para Entregar</div>
                                 <div className="space-y-3">
                                     {transactions.filter(t => t.saleStatus === 'pending_delivery').map(t => (
                                         <div key={t.id} onClick={() => setReceiptDetails(t)} className="bg-white p-5 rounded-2xl border-l-4 border-emerald-500 shadow-sm cursor-pointer hover:bg-emerald-50/30 transition-all">
                                             <div className="flex justify-between mb-1">
                                                 <span className="font-bold text-slate-800 text-lg">{getClientName(t.clientId)}</span>
                                                 <span className="font-black text-slate-800">${formatMoney(t.total)}</span>
                                             </div>
                                             <div className="text-xs text-emerald-600 font-bold mb-4 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Todo en Stock</div>
                                             <div className="flex gap-2">
                                                 <button onClick={(e) => { e.stopPropagation(); handleNotifyClient(t); }} className="flex-1 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200">Avisar</button>
                                                 <button onClick={(e) => { e.stopPropagation(); handleDeliverOrder(t); }} className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-sm">Despachar</button>
                                             </div>
                                         </div>
                                     ))}
                                     {transactions.filter(t => t.saleStatus === 'pending_delivery').length === 0 && <div className="text-center py-10 text-slate-400 italic">No hay pedidos listos.</div>}
                                 </div>
                             </div>
                        )}

                        {/* 3. EN REPARTO */}
                        {orderViewTab === 'transit' && (
                             <div className="animate-in slide-in-from-right">
                                 <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 pl-1">En la calle</div>
                                 <div className="space-y-3">
                                     {transactions.filter(t => t.saleStatus === 'in_transit').map(t => (
                                         <div key={t.id} onClick={() => setReceiptDetails(t)} className="bg-white p-5 rounded-2xl border-l-4 border-orange-500 shadow-sm cursor-pointer hover:bg-orange-50/30 transition-all">
                                             <div className="flex justify-between mb-1">
                                                 <span className="font-bold text-slate-800 text-lg">{getClientName(t.clientId)}</span>
                                                 <span className="font-black text-slate-800">${formatMoney(t.total)}</span>
                                             </div>
                                             <div className="text-xs text-stone-500 flex items-center gap-1"><Truck className="w-3 h-3"/> Lleva: <span className="font-bold">{t.courier}</span></div>
                                         </div>
                                     ))}
                                     {transactions.filter(t => t.saleStatus === 'in_transit').length === 0 && <div className="text-center py-10 text-slate-400 italic">Nada en reparto.</div>}
                                 </div>
                             </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* === VIEW: FINANCES (RECEIVABLES) === */}
        {view === 'finances' && (
            <div className="p-6 h-full overflow-y-auto bg-slate-50">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-6 bg-gradient-to-r from-teal-800 to-teal-900 p-8 rounded-3xl text-white shadow-xl flex justify-between items-center relative overflow-hidden">
                        <div className="relative z-10"><h2 className="font-serif font-bold text-xl opacity-90">Por Cobrar</h2><p className="opacity-70 text-sm">Saldo total clientes</p></div>
                        <div className="text-4xl font-black relative z-10">${formatMoney(transactions.filter(t => t.type === 'sale' && t.paymentStatus !== 'paid').reduce((acc, t) => acc + t.balance, 0))}</div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                    </div>
                    <div className="space-y-3">
                        {transactions.filter(t => t.type === 'sale' && t.paymentStatus !== 'paid').map(tx => (
                            <div key={tx.id} onClick={() => { setSelectedPaymentTx(tx); setPaymentModalOpen(true); }} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:border-teal-500 transition-all hover:shadow-md group">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-teal-800">{getClientName(tx.clientId).charAt(0)}</div>
                                        <div><div className="font-bold text-slate-800">{getClientName(tx.clientId)}</div><div className="text-xs text-slate-400">{formatDateSimple(tx.date.seconds)}</div></div>
                                    </div>
                                    <div className="text-right"><div className="font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-lg">Debe: ${formatMoney(tx.balance)}</div><div className="text-[10px] text-slate-400 mt-1">Total: ${formatMoney(tx.total)}</div></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* === VIEW: PAYABLES (NEW) === */}
        {view === 'payables' && (
            <div className="p-6 h-full overflow-y-auto bg-slate-50">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-6 bg-gradient-to-r from-amber-500 to-orange-600 p-8 rounded-3xl text-white shadow-xl flex justify-between items-center relative overflow-hidden">
                        <div className="relative z-10"><h2 className="font-serif font-bold text-xl opacity-90">Por Pagar</h2><p className="opacity-70 text-sm">Deuda con Proveedores</p></div>
                        <div className="text-4xl font-black relative z-10">${formatMoney(transactions.filter(t => (t.type === 'order' || t.type === 'stock_entry') && t.paymentStatus !== 'paid').reduce((acc, t) => acc + t.balance, 0))}</div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                    </div>
                    <div className="space-y-3">
                        {transactions.filter(t => (t.type === 'order' || t.type === 'stock_entry') && t.paymentStatus !== 'paid').map(tx => (
                            <div key={tx.id} onClick={() => { setSelectedPaymentTx(tx); setPaymentModalOpen(true); }} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:border-amber-500 transition-all hover:shadow-md">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-700"><Truck className="w-5 h-5"/></div>
                                        <div><div className="font-bold text-slate-800">{tx.clientId}</div><div className="text-xs text-slate-400">{formatDateSimple(tx.date.seconds)} • {tx.paymentPlanType === 'installments' ? 'Cuotas' : 'Contado'}</div></div>
                                    </div>
                                    <div className="text-right"><div className="font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-lg">Debe: ${formatMoney(tx.balance)}</div><div className="text-[10px] text-slate-400 mt-1">Total: ${formatMoney(tx.total)}</div></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
      </main>

      {/* --- ADD TO ORDER MODAL --- */}
      {addToOrderModal.show && addToOrderModal.product && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl scale-100 animate-in zoom-in-95">
                  <div className="flex justify-between items-start mb-4">
                      <div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{addToOrderModal.product.brand}</span><h3 className="font-serif font-bold text-xl text-slate-800 leading-tight">{addToOrderModal.product.name}</h3></div>
                      <button onClick={() => setAddToOrderModal({ show: false, product: null })} className="p-1.5 bg-slate-100 rounded-full hover:bg-slate-200"><X className="w-4 h-4 text-slate-500"/></button>
                  </div>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Costo Unitario (Compra)</label>
                          <div className="relative"><span className="absolute left-3 top-3 text-teal-700 font-bold">$</span><MoneyInput className="w-full pl-6 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-lg text-slate-800 outline-none focus:border-teal-500" value={addOrderCost} onChange={setAddOrderCost} placeholder="0" autoFocus /></div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Cantidad</label>
                          <div className="flex items-center gap-3"><button onClick={() => setAddOrderQty(q => Math.max(1, q-1))} className="p-3 bg-slate-100 rounded-xl hover:bg-slate-200"><Minus className="w-4 h-4"/></button><div className="flex-1 text-center font-black text-xl text-slate-800">{addOrderQty}</div><button onClick={() => setAddOrderQty(q => q+1)} className="p-3 bg-slate-100 rounded-xl hover:bg-slate-200"><Plus className="w-4 h-4"/></button></div>
                      </div>
                      <button onClick={confirmAddToCart} disabled={addOrderCost === ''} className="w-full py-3 bg-teal-600 text-white rounded-xl font-bold shadow-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed">Agregar al Pedido</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- CART DETAILS MODAL (Updated with Supplier Payment Options) --- */}
      {isCartDetailsOpen && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-3xl w-full max-w-sm flex flex-col max-h-[90vh] shadow-2xl">
                  <div className="p-6 border-b border-[#e5e7eb] flex justify-between items-center bg-[#fdfbf7] rounded-t-3xl">
                      <h2 className="font-serif font-bold text-xl text-[#1e4620]">Resumen Pedido</h2>
                      <button onClick={() => setIsCartDetailsOpen(false)} className="p-2 bg-white border border-stone-200 rounded-full hover:bg-stone-100"><X className="w-5 h-5 text-stone-500"/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {/* Products List */}
                      <div className="space-y-3">
                          {cart.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center border-b border-stone-100 pb-3 last:border-0">
                                  <div className="flex-1">
                                      <div className="font-bold text-[#1e4620] text-sm line-clamp-1">{item.name}</div>
                                      <div className="text-xs text-stone-400 mt-1 flex items-center gap-1"><span className="bg-stone-100 px-2 py-0.5 rounded text-stone-600 font-bold">{item.qty} un.</span><span>x ${formatMoney(item.transactionPrice)}</span></div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                      <div className="font-bold text-[#1e4620]">${formatMoney(item.transactionPrice * item.qty)}</div>
                                      <button onClick={() => removeFromCart(idx)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><Trash2 className="w-4 h-4"/></button>
                                  </div>
                              </div>
                          ))}
                      </div>

                      {/* Payment Options for Supplier */}
                      <div className="pt-4 border-t-2 border-dashed border-stone-200">
                          <h3 className="font-bold text-stone-400 text-xs uppercase tracking-wider mb-3">Plan de Pago a Proveedor</h3>
                          <div className="flex p-1 bg-stone-100 rounded-xl mb-4">
                              <button onClick={() => setSupplyPaymentPlan('full')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${supplyPaymentPlan === 'full' ? 'bg-white shadow-sm text-[#1e4620]' : 'text-stone-500'}`}>Contado</button>
                              <button onClick={() => setSupplyPaymentPlan('installments')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${supplyPaymentPlan === 'installments' ? 'bg-white shadow-sm text-[#1e4620]' : 'text-stone-500'}`}>Cuotas</button>
                          </div>
                          {supplyPaymentPlan === 'installments' && (
                              <div className="space-y-3 animate-in fade-in">
                                  <select className="w-full p-3 bg-fdfbf7 border border-stone-200 rounded-xl font-bold text-[#1e4620] text-sm" value={supplyCheckoutData.installmentsCount} onChange={e => setSupplyCheckoutData({...supplyCheckoutData, installmentsCount: e.target.value, installmentDates: {}})}>
                                      {[2,3,4,5,6].map(n => <option key={n} value={n}>{n} Cuotas</option>)}
                                  </select>
                                  {Array.from({length: parseInt(supplyCheckoutData.installmentsCount)}).map((_, idx) => (
                                      <div key={idx} className="flex items-center gap-3 bg-stone-50 p-2 rounded-xl border border-stone-200">
                                          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center font-bold text-xs shadow-sm">{idx+1}</div>
                                          <div className="flex-1 text-xs font-bold text-stone-500">Vence:</div>
                                          <input type="date" className="bg-transparent rounded-lg p-1 text-xs font-bold text-[#1e4620] outline-none" value={supplyCheckoutData.installmentDates[idx] || ''} onChange={(e) => { const newDates = {...supplyCheckoutData.installmentDates, [idx]: e.target.value}; setSupplyCheckoutData({...supplyCheckoutData, installmentDates: newDates}); }}/>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                  </div>
                  <div className="p-6 bg-[#fdfbf7] rounded-b-3xl border-t border-[#e5e7eb]">
                      <div className="flex justify-between items-center mb-4"><span className="font-bold text-stone-500 uppercase text-xs">Total Compra</span><span className="font-black text-2xl text-[#1e4620]">${formatMoney(cartTotal)}</span></div>
                      <button onClick={handleCreateSupplyOrder} className="w-full py-3 bg-[#1e4620] text-white rounded-xl font-bold shadow-lg hover:bg-[#153316]">Confirmar Compra</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- SALES HISTORY MODAL --- */}
      {isSalesHistoryOpen && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-3xl w-full max-w-md flex flex-col max-h-[85vh] shadow-2xl">
                  <div className="p-6 border-b border-[#e5e7eb] flex justify-between items-center bg-[#fdfbf7] rounded-t-3xl">
                      <h2 className="font-serif font-bold text-xl text-[#1e4620]">Historial de Ventas</h2>
                      <button onClick={() => setIsSalesHistoryOpen(false)} className="p-2 bg-white border border-stone-200 rounded-full hover:bg-stone-100"><X className="w-5 h-5 text-stone-500"/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-3">
                      {salesHistory.length === 0 ? (
                          <div className="text-center py-10 text-stone-400">No hay ventas completadas aún.</div>
                      ) : (
                          salesHistory.map(t => (
                              <div key={t.id} onClick={() => setReceiptDetails(t)} className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm cursor-pointer hover:border-[#1e4620] transition-colors flex justify-between items-center">
                                  <div><div className="font-bold text-[#1e4620]">{getClientName(t.clientId)}</div><div className="text-xs text-stone-400">{formatDateSimple(t.date.seconds)} • #{t.displayId}</div></div>
                                  <div className="text-right"><div className="font-bold text-[#1e4620]">${formatMoney(t.total)}</div><div className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold uppercase inline-block">Entregado</div></div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* --- PURCHASE HISTORY MODAL (NEW) --- */}
      {isPurchaseHistoryOpen && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-3xl w-full max-w-md flex flex-col max-h-[85vh] shadow-2xl">
                  <div className="p-6 border-b border-[#e5e7eb] flex justify-between items-center bg-[#fdfbf7] rounded-t-3xl">
                      <h2 className="font-serif font-bold text-xl text-[#1e4620]">Historial de Compras</h2>
                      <button onClick={() => setIsPurchaseHistoryOpen(false)} className="p-2 bg-white border border-stone-200 rounded-full hover:bg-stone-100"><X className="w-5 h-5 text-stone-500"/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-3">
                      {purchaseHistory.length === 0 ? (
                          <div className="text-center py-10 text-stone-400">No hay compras registradas aún.</div>
                      ) : (
                          purchaseHistory.map(t => (
                              <div key={t.id} className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm flex justify-between items-center">
                                  <div>
                                      <div className="font-bold text-[#1e4620]">{t.clientId}</div>
                                      <div className="text-xs text-stone-400">{formatDateSimple(t.date.seconds)} • #{t.displayId}</div>
                                  </div>
                                  <div className="text-right">
                                      <div className="font-bold text-[#1e4620]">${formatMoney(t.total)}</div>
                                      <div className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase inline-block ${t.saleStatus === 'completed' || t.type === 'stock_entry' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                          {t.saleStatus === 'completed' || t.type === 'stock_entry' ? 'Ingresado' : 'Por Llegar'}
                                      </div>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* --- CYCLE NAME MODAL --- */}
      {cycleNameModal.show && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl">
                  <h3 className="font-serif font-bold text-xl text-[#1e4620] mb-2">Nombre del Ciclo</h3>
                  <p className="text-sm text-stone-500 mb-4">Ej: Ciclo 14B, Campaña Navidad, etc.</p>
                  <input className="w-full p-3 bg-[#fdfbf7] border border-stone-200 rounded-xl font-bold text-[#1e4620] outline-none focus:border-[#d97706] mb-4" placeholder="Ej: C-14" value={tempCycleName} onChange={e => setTempCycleName(e.target.value)} autoFocus />
                  <div className="flex gap-2">
                      <button onClick={() => setCycleNameModal({ show: false, brand: '' })} className="flex-1 py-3 bg-stone-100 text-stone-500 rounded-xl font-bold">Cancelar</button>
                      <button onClick={() => { if(!tempCycleName.trim()) return; setSupplyConfig({ type: 'cycle', brand: cycleNameModal.brand, cycleName: tempCycleName }); setCycleNameModal({ show: false, brand: '' }); setSupplyMode('shopping'); }} className="flex-1 py-3 bg-[#1e4620] text-white rounded-xl font-bold hover:bg-[#153316]">Continuar</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- CHECK-IN MODAL --- */}
      {checkInOrder && (
            <div className="fixed inset-0 z-[60] bg-[#fdfbf7] flex flex-col animate-in slide-in-from-bottom duration-300">
                <div className="px-6 py-5 bg-white border-b border-[#e5e7eb] flex justify-between items-center shadow-sm">
                    <div><h2 className="font-serif font-bold text-2xl text-[#1e4620]">Recepción</h2><p className="text-xs text-stone-500 font-medium">{checkInOrder.clientId}</p></div>
                    <button onClick={() => {setCheckInOrder(null); setCheckInItems([]);}} className="p-2 bg-stone-100 rounded-full"><X className="w-6 h-6"/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 bg-[#fdfbf7]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-24">
                        {checkInItems.map((item, idx) => (
                            <div key={item._tempId} className={`relative p-5 bg-white rounded-2xl shadow-sm border-2 transition-all ${!item.received ? 'opacity-50 border-stone-200 bg-stone-100' : !item.expirationDate ? 'border-amber-200' : 'border-emerald-200 ring-2 ring-emerald-50'}`}>
                                <div className="flex justify-between mb-2">
                                    <span className="bg-[#1e4620] text-white text-[10px] font-bold px-2 py-1 rounded">ITEM #{idx+1}</span>
                                    <button onClick={() => toggleItemReceived(item._tempId)} className={`text-xs font-bold px-2 py-1 rounded border ${item.received ? 'bg-white border-stone-200 text-stone-500' : 'bg-red-100 border-red-200 text-red-600'}`}>{item.received ? '¿No llegó?' : 'NO LLEGÓ'}</button>
                                </div>
                                <div className={`font-bold text-[#1e4620] mb-3 line-clamp-2 min-h-[3rem] ${!item.received && 'line-through text-stone-400'}`}>{item.name}</div>
                                {item.received && (
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-stone-400 mb-1 block">Vencimiento</label>
                                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${!item.expirationDate ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                                            <CalendarDays className={`w-5 h-5 ${!item.expirationDate ? 'text-amber-500' : 'text-emerald-500'}`}/>
                                            <input type="date" className="bg-transparent font-bold text-sm outline-none w-full text-stone-700" value={item.expirationDate} onChange={(e) => setCheckInItems(prev => prev.map(i => i._tempId === item._tempId ? { ...i, expirationDate: e.target.value } : i))}/>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-6 bg-white border-t border-[#e5e7eb] shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                    <button onClick={confirmCheckIn} className="w-full py-4 bg-[#1e4620] hover:bg-[#153316] text-white font-bold rounded-2xl shadow-xl transition-all flex justify-between px-8 text-lg"><span>Confirmar Ingreso Stock</span><PackageCheck className="w-6 h-6"/></button>
                </div>
            </div>
      )}

      {/* --- DELIVERY MODAL --- */}
      {isDeliveryModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
             <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl">
                 <h2 className="font-serif font-bold text-xl text-center mb-4 text-[#1e4620]">Despacho</h2>
                 <div className="space-y-2 mb-6">
                     {COURIERS.map(c => <button key={c} onClick={() => setSelectedCourier(c)} className={`w-full p-3 rounded-xl font-bold text-sm border-2 text-left ${selectedCourier === c ? 'border-[#1e4620] bg-[#1e4620] text-white' : 'border-stone-100 text-stone-500'}`}>{c}</button>)}
                 </div>
                 <button onClick={startDeliveryProcess} className="w-full py-3 bg-[#1e4620] text-white rounded-xl font-bold">Confirmar</button>
                 <button onClick={() => setIsDeliveryModalOpen(false)} className="w-full py-3 text-stone-400 font-bold mt-2">Cancelar</button>
             </div>
          </div>
      )}

      {/* --- PRODUCT MODAL --- */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <h2 className="text-2xl font-serif font-bold mb-6 text-[#1e4620]">{editingProduct ? 'Editar' : 'Nuevo Producto'}</h2>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="border-2 border-dashed border-[#1e4620]/30 rounded-2xl p-6 text-center relative hover:bg-[#fdfbf7] transition-colors group">
                  <input type="file" name="image" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required={!editingProduct?.imageUrl}/>
                  <div className="flex flex-col items-center gap-2 pointer-events-none"><ImageIcon className="w-10 h-10 text-[#d97706]"/><span className="text-sm font-bold text-[#1e4620]">{editingProduct?.imageUrl ? "Cambiar Imagen" : "Subir Imagen"}</span></div>
              </div>
              <input name="name" required placeholder="Nombre" defaultValue={editingProduct?.name} className="w-full p-4 bg-[#fdfbf7] border border-stone-200 rounded-xl font-bold text-[#1e4620] outline-none" />
              <div className="flex gap-3">
                  <select name="brand" required defaultValue={editingProduct?.brand} className="flex-1 p-4 bg-[#fdfbf7] border border-stone-200 rounded-xl font-bold text-[#1e4620] outline-none"><option value="">Marca</option>{BRANDS.map(b => <option key={b} value={b}>{b}</option>)}</select>
                  <select name="category" required defaultValue={editingProduct?.category} className="flex-1 p-4 bg-[#fdfbf7] border border-stone-200 rounded-xl font-bold text-[#1e4620] outline-none"><option value="">Categoría</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              </div>
              <div className="flex-1 relative"><span className="absolute left-4 top-4 text-[#1e4620] font-bold">$</span><MoneyInput className="w-full pl-8 p-4 bg-[#fdfbf7] border border-stone-200 rounded-xl font-bold text-[#1e4620] outline-none" value={productPriceInput} onChange={setProductPriceInput} placeholder="Precio"/></div>
              <div className="flex gap-3 mt-4"><button type="button" onClick={() => setIsProductModalOpen(false)} className="flex-1 py-4 bg-stone-100 text-stone-500 rounded-xl font-bold">Cancelar</button><button className="flex-1 py-4 bg-[#1e4620] text-white rounded-xl font-bold shadow-lg">Guardar</button></div>
              {editingProduct && <button type="button" onClick={() => {handleDeleteProduct(editingProduct.id); setIsProductModalOpen(false);}} className="w-full py-2 text-red-500 font-bold text-xs">Eliminar Producto</button>}
            </form>
          </div>
        </div>
      )}

      {/* --- CATEGORY MODAL --- */}
      {isCategoryModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-3xl w-full max-w-sm flex flex-col max-h-[80vh] shadow-2xl">
                  <h2 className="font-serif font-bold text-xl mb-4 text-[#1e4620]">Categorías</h2>
                  <form onSubmit={e => { e.preventDefault(); addDoc(collection(db, `artifacts/${APP_ID}/public/data/categories`), {name: new FormData(e.currentTarget).get('name')}); e.target.reset(); }} className="mb-4 flex gap-2"><input name="name" required className="flex-1 p-3 bg-[#fdfbf7] border border-stone-200 rounded-xl font-bold outline-none" placeholder="Nueva..."/><button className="p-3 bg-[#1e4620] text-white rounded-xl"><Plus/></button></form>
                  <div className="flex-1 overflow-y-auto space-y-2">{categories.map(cat => <div key={cat.id} className="flex justify-between items-center p-3 bg-[#fdfbf7] rounded-xl border border-stone-100"><span className="font-bold text-[#1e4620]">{cat.name}</span><button onClick={() => deleteDoc(doc(db, `artifacts/${APP_ID}/public/data/categories`, cat.id))} className="text-stone-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button></div>)}</div>
                  <button onClick={() => setIsCategoryModalOpen(false)} className="w-full mt-4 py-3 bg-stone-100 text-stone-500 rounded-xl font-bold">Cerrar</button>
              </div>
          </div>
      )}

      {/* --- PAYMENT MODAL (Generic) --- */}
      {paymentModalOpen && selectedPaymentTx && (
          <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
                  {/* Dynamic Header based on transaction type (Sale vs Purchase) */}
                  <div className={`p-6 text-white ${selectedPaymentTx.type === 'sale' ? 'bg-[#1e4620]' : 'bg-[#d97706]'}`}>
                      <h2 className="font-serif font-bold text-2xl">{selectedPaymentTx.type === 'sale' ? 'Cobrar' : 'Pagar'}</h2>
                      <p className="opacity-80 text-sm mt-1">{selectedPaymentTx.clientId}</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 bg-[#fdfbf7]">
                      <div className="space-y-3 mb-6">
                          {(selectedPaymentTx.paymentSchedule || []).map((item, idx) => {
                              const paidSoFar = item.paidAmount || 0; const isFullyPaid = paidSoFar >= item.amount;
                              return <div key={idx} onClick={() => { if (isFullyPaid) return; setSelectedPaymentIndex(idx); setPaymentAmountInput(item.amount - paidSoFar); }} className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isFullyPaid ? 'bg-emerald-50 border-emerald-100 opacity-60' : selectedPaymentIndex === idx ? 'bg-white border-[#1e4620]' : 'bg-white border-stone-200'}`}><div className="flex justify-between items-center"><span className="font-bold text-sm text-[#1e4620]">{item.type === 'cuota' ? `Cuota ${item.number}` : 'Saldo'}</span><span className="font-black text-[#1e4620]">${formatMoney(item.amount)}</span></div></div>
                          })}
                      </div>
                      {selectedPaymentIndex !== null && (
                          <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 animate-in slide-in-from-bottom-2">
                              <label className="block text-xs font-bold text-stone-400 uppercase mb-2">Monto</label>
                              <MoneyInput className="w-full text-center text-3xl font-black text-[#1e4620] border-b-2 border-stone-200 focus:border-[#d97706] outline-none pb-2 bg-transparent" value={paymentAmountInput} onChange={setPaymentAmountInput} placeholder="$0" autoFocus />
                          </div>
                      )}
                  </div>
                  <div className="p-6 bg-white border-t border-[#e5e7eb]">
                      {selectedPaymentIndex !== null ? <button onClick={async () => {
                          const amount = parseInt(paymentAmountInput) || 0; if(amount<=0) return;
                          let updatedSchedule = [...selectedPaymentTx.paymentSchedule]; let updatedBalance = selectedPaymentTx.balance;
                          const item = updatedSchedule[selectedPaymentIndex]; const newTotalPaid = (item.paidAmount || 0) + amount;
                          updatedSchedule[selectedPaymentIndex] = { ...item, paidAmount: newTotalPaid, status: newTotalPaid >= item.amount ? 'paid' : 'partial' }; updatedBalance -= amount;
                          await updateDoc(doc(db, `artifacts/${APP_ID}/public/data/transactions`, selectedPaymentTx.id), { paymentSchedule: updatedSchedule, balance: updatedBalance, paymentStatus: updatedBalance <= 0 ? 'paid' : 'partial' });
                          setPaymentModalOpen(false); triggerAlert("Éxito", "Transacción registrada.", "success");
                      }} className="w-full py-3 bg-[#1e4620] text-white rounded-xl font-bold shadow-lg">Confirmar</button> : <button onClick={() => setPaymentModalOpen(false)} className="w-full py-3 text-stone-400 font-bold">Cancelar</button>}
                  </div>
              </div>
          </div>
      )}

      {/* --- CHECKOUT MODAL (SALES) --- */}
      {isCheckoutModalOpen && (
          <div className="fixed inset-0 bg-[#1e4620]/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                  <div className="px-6 py-5 border-b border-[#e5e7eb] flex justify-between items-center bg-white z-10"><div><h2 className="font-serif font-bold text-2xl text-[#1e4620]">Finalizar</h2></div><button onClick={() => setIsCheckoutModalOpen(false)} className="p-2 bg-stone-100 hover:bg-stone-200 rounded-full"><X className="w-5 h-5 text-stone-500"/></button></div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#fdfbf7]">
                      <div>
                          <div className="flex items-center justify-between mb-3"><h3 className="font-bold text-stone-400 text-xs uppercase tracking-wider">Cliente</h3><button onClick={() => { setEditingClient(null); setIsClientModalOpen(true); }} className="text-xs bg-[#1e4620] text-white px-3 py-1 rounded-lg font-bold hover:bg-[#153316]">+ Nuevo</button></div>
                          <div className="relative" ref={clientInputRef}>
                              <div className="relative"><UserPlus className="absolute left-4 top-3.5 w-5 h-5 text-stone-400"/><input className="w-full pl-12 pr-4 py-4 bg-white border border-stone-200 rounded-2xl font-bold text-[#1e4620] focus:border-[#d97706] outline-none shadow-sm" placeholder="Buscar cliente..." value={clientSearchTerm} onChange={e => { setClientSearchTerm(e.target.value); setShowClientOptions(true); }} onFocus={() => setShowClientOptions(true)}/>{selectedClient && <div className="absolute right-3 top-3 bottom-3 flex items-center"><span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> OK</span></div>}</div>
                              {showClientOptions && (<div className="absolute top-full left-0 w-full bg-white border border-stone-100 rounded-2xl shadow-xl max-h-48 overflow-y-auto z-20 mt-2 p-2">{filteredClientsForSearch.map(c => (<div key={c.id} className="p-3 hover:bg-[#fdfbf7] cursor-pointer rounded-xl transition-colors flex justify-between items-center group" onClick={() => { setSelectedClient(c.id); setClientSearchTerm(c.name); setShowClientOptions(false); }}><div><div className="font-bold text-[#1e4620]">{c.name}</div><div className="text-xs text-stone-400">{c.phone}</div></div><ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-[#1e4620]"/></div>))}</div>)}
                          </div>
                      </div>
                      <div className={!selectedClient ? 'opacity-50 pointer-events-none grayscale' : ''}>
                          <h3 className="font-bold text-stone-400 text-xs uppercase tracking-wider mb-3">Disponibilidad</h3>
                          <div className={`p-5 rounded-2xl border transition-all ${stockAnalysis.canDeliverAll ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                              <div className="flex items-center gap-4"><div className={`p-3 rounded-xl ${stockAnalysis.canDeliverAll ? 'bg-white text-emerald-600' : 'bg-white text-amber-600'}`}>{stockAnalysis.canDeliverAll ? <PackageCheck className="w-6 h-6"/> : <Clock className="w-6 h-6"/>}</div><div><h4 className={`font-bold ${stockAnalysis.canDeliverAll ? 'text-emerald-800' : 'text-amber-800'}`}>{stockAnalysis.canDeliverAll ? 'Todo en Stock' : 'Faltan Productos'}</h4><p className="text-xs text-stone-500">{stockAnalysis.canDeliverAll ? 'Entrega inmediata.' : 'Se generará pedido pendiente.'}</p></div></div>
                          </div>
                      </div>
                      <div className={!selectedClient ? 'opacity-50 pointer-events-none grayscale' : ''}>
                          <h3 className="font-bold text-stone-400 text-xs uppercase tracking-wider mb-3">Pago</h3>
                          <div className="flex p-1 bg-stone-200 rounded-xl mb-4"><button onClick={() => setPaymentPlanType('full')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${paymentPlanType === 'full' ? 'bg-white shadow-sm text-[#1e4620]' : 'text-stone-500'}`}>Contado</button><button onClick={() => setPaymentPlanType('installments')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${paymentPlanType === 'installments' ? 'bg-white shadow-sm text-[#1e4620]' : 'text-stone-500'}`}>Cuotas</button></div>
                          {paymentPlanType === 'installments' && (
                              <div className="space-y-3">
                                  <select className="w-full p-3 bg-white border border-stone-200 rounded-xl font-bold text-[#1e4620]" value={checkoutData.installmentsCount} onChange={e => setCheckoutData({...checkoutData, installmentsCount: e.target.value, installmentDates: {}})}>{[2,3,4,5,6].map(n => <option key={n} value={n}>{n} Cuotas</option>)}</select>
                                  {Array.from({length: parseInt(checkoutData.installmentsCount)}).map((_, idx) => (
                                      <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-stone-200"><div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center font-bold text-xs">{idx+1}</div><div className="flex-1 text-sm font-bold text-[#1e4620]">${formatMoney(Math.round(cartTotal / parseInt(checkoutData.installmentsCount)))}</div><input type="date" className="bg-stone-50 rounded-lg p-2 text-xs font-bold" value={checkoutData.installmentDates[idx] || ''} onChange={(e) => { const newDates = {...checkoutData.installmentDates, [idx]: e.target.value}; setCheckoutData({...checkoutData, installmentDates: newDates}); }}/></div>
                                  ))}
                              </div>
                          )}
                      </div>
                  </div>
                  <div className="p-6 border-t border-[#e5e7eb] bg-white z-10"><button onClick={handleConfirmCheckout} className="w-full py-4 bg-[#1e4620] text-white rounded-2xl font-bold text-lg shadow-xl hover:bg-[#153316] transition-all flex justify-between px-8 items-center"><span>Confirmar</span><span>${formatMoney(cartTotal)}</span></button></div>
              </div>
          </div>
      )}

      {/* --- CLIENT MODAL --- */}
      {isClientModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <h2 className="text-2xl font-serif font-bold mb-6 text-[#1e4620]">{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
            <form onSubmit={handleSaveClient} className="space-y-4">
              <input name="name" required placeholder="Nombre Completo" defaultValue={editingClient?.name} className="w-full p-4 bg-[#fdfbf7] border border-stone-200 rounded-xl font-bold text-[#1e4620] outline-none focus:border-[#d97706]" />
              <input name="phone" placeholder="Teléfono" defaultValue={editingClient?.phone} className="w-full p-4 bg-[#fdfbf7] border border-stone-200 rounded-xl font-bold text-[#1e4620] outline-none focus:border-[#d97706]" />
              <div className="flex gap-3 mt-4"><button type="button" onClick={() => setIsClientModalOpen(false)} className="flex-1 py-4 bg-stone-100 text-stone-500 rounded-xl font-bold">Cancelar</button><button className="flex-1 py-4 bg-[#1e4620] text-white rounded-xl font-bold shadow-lg hover:bg-[#153316]">Guardar</button></div>
            </form>
          </div>
        </div>
      )}

      {/* --- HISTORY MODAL (GLOBAL STOCK) --- */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
                <div className="p-6 border-b border-[#e5e7eb] flex justify-between items-center"><div><h2 className="font-serif font-bold text-xl text-[#1e4620]">Historial</h2></div><button onClick={() => setIsHistoryModalOpen(false)} className="p-2 bg-stone-100 rounded-full"><X className="w-5 h-5 text-stone-500"/></button></div>
                <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-[#fdfbf7]">
                    <div className="text-stone-400 text-center py-4">Selecciona un producto en el inventario para ver su detalle específico.</div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }) {
    return <button onClick={onClick} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group ${active ? 'bg-[#fdfbf7] text-[#1e4620] shadow-lg font-bold translate-x-1' : 'text-[#aabfb0] hover:bg-[#2d6130] hover:text-white'}`}>{React.cloneElement(icon, { className: `w-5 h-5 transition-transform group-hover:scale-110 ${active ? 'stroke-[2.5px]' : ''}` })}<span className="text-sm tracking-wide">{label}</span></button>
}
