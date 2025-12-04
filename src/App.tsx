import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LayoutDashboard, ShoppingCart, Package, Users, TrendingUp, Plus, Minus, Trash2, Save, Search, Menu, X, ChevronRight, LogOut, Truck, History, Receipt, Eye, UserPlus, Calendar, Filter, Tag, Briefcase, ChevronLeft, BarChart3, Award, PieChart, Clock, AlertCircle, Check, FileText, Share2, MessageCircle, Smartphone, AlertTriangle, BookOpen, CreditCard, Banknote, Pencil, RefreshCw,  Upload, CheckCircle2, XCircle, Leaf, Globe, FileType, CalendarDays, PackageCheck, ScrollText, Wallet, TrendingDown, Info, CalendarX, ShoppingBag, Send, Bike, Undo2, Loader2, Box, DollarSign, Percent, ChevronDown, ExternalLink, QrCode, CreditCard as DebitCard, ToggleLeft, ToggleRight, ClipboardList, Repeat, Target, ArrowRight, StickyNote, Globe2, Lock, Zap, Layers, User, Image as ImageIcon, Timer, CalendarClock, Sparkles, Gem, Edit3 } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, setDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, limit, increment, writeBatch, getDocs, where, getDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// --- CONFIGURACIÓN FIREBASE ---
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
const WEB_SUPPLIERS = ['Natura Web', 'Esika Web', "L'Bel Web"];
const COURIERS = ['Yo (Directo)', 'Mamá (Puesto Feria)', 'Tía Luisa']; 

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
  const formatDateWithTime = (seconds) => { if (!seconds) return '-'; const d = new Date(seconds * 1000); return d.toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); };
  const formatDateSimple = (seconds) => { if (!seconds) return '-'; const d = new Date(seconds * 1000); return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit' }); };
  const getStockStatus = (stock) => {
      if (stock === 0) return { color: 'bg-red-600 text-white', label: 'AGOTADO' };
      if (stock === 1) return { color: 'bg-red-100 text-red-700 border border-red-200', label: 'CRÍTICO' };
      if (stock > 1 && stock < 4) return { color: 'bg-orange-100 text-orange-800 border border-orange-200', label: 'BAJO' };
      return { color: 'bg-emerald-100 text-emerald-700 border border-emerald-200', label: 'BIEN' };
  };
    
  // --- ESTADOS ---
  const [user, setUser] = useState(null); 
  const [view, setView] = useState('pos'); 
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [inventoryBatches, setInventoryBatches] = useState([]); 
  const [cart, setCart] = useState([]);
  const [selectedClient, setSelectedClient] = useState(''); 
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [paymentPlanType, setPaymentPlanType] = useState('full'); 
  const [checkoutData, setCheckoutData] = useState({ installmentsCount: 3, installmentDates: {}, });
  const [paymentMethod, setPaymentMethod] = useState('Efectivo'); 
  const [editingTransactionId, setEditingTransactionId] = useState(null); 
  const [loading, setLoading] = useState(true); 
  const [searchTerm, setSearchTerm] = useState('');
  const [processingMsg, setProcessingMsg] = useState(''); 
  const [itemActions, setItemActions] = useState({});
  const [alertState, setAlertState] = useState({ show: false, title: '', message: '', type: 'info' }); 
  const [confirmationState, setConfirmationState] = useState({ show: false, title: '', message: '', type: 'neutral', onConfirm: null });
  const triggerAlert = (title, message, type = 'error') => { setAlertState({ show: true, title, message, type }); };
  
  // Modales y UI
  const [confirmDeliveryModal, setConfirmDeliveryModal] = useState({ show: false, transaction: null });
  const [deliveryDateInput, setDeliveryDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [showCatalogModal, setShowCatalogModal] = useState(false); 
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [deliveryTransaction, setDeliveryTransaction] = useState(null);
  const [selectedCourier, setSelectedCourier] = useState('Yo (Directo)');
  const [editingProduct, setEditingProduct] = useState(null);
  const [productPriceInput, setProductPriceInput] = useState(''); 
  const [receiptDetails, setReceiptDetails] = useState(null);
  const [productHistory, setProductHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [orderSource, setOrderSource] = useState(null);
  const [catalogBrand, setCatalogBrand] = useState(''); 
  const [checkInOrder, setCheckInOrder] = useState(null); 
  const [checkInItems, setCheckInItems] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showClientOptions, setShowClientOptions] = useState(false);
  const clientInputRef = useRef(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPaymentTx, setSelectedPaymentTx] = useState(null);
  const [selectedPaymentIndex, setSelectedPaymentIndex] = useState(null); 
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [paymentReceiptFile, setPaymentReceiptFile] = useState(null); 
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [viewingHistoryProduct, setViewingHistoryProduct] = useState(null);
  const [purchasesSubView, setPurchasesSubView] = useState('orders');
  const [viewingCycle, setViewingCycle] = useState(null);

  const cycleMap = useMemo(() => cycles.reduce((acc, c) => ({ ...acc, [c.id]: c.name }), {}), [cycles]);

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

  const getOrderTag = (t) => {
      let isCycle = false;
      let isExpress = false;
      let isStock = false;
      let isReserved = false;

      (t.items || []).forEach(i => {
          if (i.orderType === 'cycle') isCycle = true;
          if (i.orderType === 'express') isExpress = true;
          if (i.status === 'delivered') isStock = true;
          if (i.status === 'reserved') isReserved = true;
      });

      if (isStock || isReserved) return { label: 'Entrega Inmediata', color: 'bg-emerald-100 text-emerald-700', icon: PackageCheck };
      if ((isCycle && isExpress) || ((isCycle || isExpress) && (isStock || isReserved))) {
          return { label: 'Mixto', color: 'bg-indigo-100 text-indigo-700', icon: Layers };
      }
      if (isExpress) return { label: 'Pedido Express', color: 'bg-amber-100 text-amber-700', icon: Zap };
      if (isCycle) return { label: 'Pedido Ciclo', color: 'bg-purple-100 text-purple-700', icon: Repeat };
      
      return { label: 'Por Encargar', color: 'bg-stone-100 text-stone-500', icon: ClipboardList };
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
    const unsubSuppliers = onSnapshot(collection(db, basePath, 'suppliers'), (s) => setSuppliers(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubTrans = onSnapshot(query(collection(db, basePath, 'transactions'), orderBy('date', 'desc'), limit(200)), (s) => setTransactions(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubCycles = onSnapshot(collection(db, basePath, 'cycles'), (s) => setCycles(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubBatches = onSnapshot(collection(db, basePath, 'inventory_batches'), (s) => setInventoryBatches(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubProducts(); unsubClients(); unsubCategories(); unsubSuppliers(); unsubTrans(); unsubCycles(); unsubBatches(); };
  }, [user]);

  useEffect(() => {
      const handleClickOutside = (event) => { if (clientInputRef.current && !clientInputRef.current.contains(event.target)) setShowClientOptions(false); };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // --- DYNAMIC CYCLE STATS CALCULATOR ---
  const calculateCycleStats = (cycleId) => {
      const cycle = cycles.find(c => c.id === cycleId);
      if (!cycle) return null;
      
      const ordersInCycle = transactions.filter(t => (t.type === 'order' || (t.type === 'sale' && t.cycleId === cycle.id)) && t.cycleId === cycle.id);
      
      let clientPoints = 0, stockPoints = 0;
      const productMap = {};

      ordersInCycle.forEach(o => {
          if (o.type === 'order' && o.clientId === 'Para Inversión') stockPoints += (o.totalPoints || 0); else clientPoints += (o.totalPoints || 0);
          
          (o.items || []).forEach(item => {
              if (!productMap[item.id]) {
                  productMap[item.id] = { id: item.id, name: item.name, totalQty: 0, requesters: [] };
              }
              productMap[item.id].totalQty += item.qty;
              const clientName = o.clientId === 'Para Inversión' ? 'Para Stock' : (clients.find(c => c.id === o.clientId)?.name || 'Cliente');
              const existingRequester = productMap[item.id].requesters.find(r => r.name === clientName);
              if (existingRequester) existingRequester.qty += item.qty;
              else productMap[item.id].requesters.push({ name: clientName, qty: item.qty });
          });
      });
      
      const aggregatedProducts = Object.values(productMap).sort((a,b) => a.name.localeCompare(b.name));
      const totalPoints = clientPoints + stockPoints; 
      const progress = cycle.goal > 0 ? (totalPoints / cycle.goal) * 100 : 0;
      const diffTime = new Date(cycle.closingDate) - new Date(); 
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return { ...cycle, totalPoints, clientPoints, stockPoints, progress, orders: ordersInCycle, remainingDays: diffDays, aggregatedProducts };
  };

  const activeCyclesList = useMemo(() => {
      return cycles.filter(c => c.status === 'open').map(c => calculateCycleStats(c.id));
  }, [cycles, transactions, clients]);

  const currentCycleStats = useMemo(() => {
      return viewingCycle ? calculateCycleStats(viewingCycle.id) : null;
  }, [viewingCycle, cycles, transactions, clients]);


  const handleConfirmCheckout = async () => {
    if (!selectedClient) { triggerAlert("Falta Cliente", "Selecciona un cliente.", "error"); return; }
    if (paymentPlanType === 'installments') {
        const count = Number(checkoutData.installmentsCount);
        for(let i=0; i<count; i++) if (!checkoutData.installmentDates[i]) { triggerAlert("Faltan Fechas", `Ingresa la fecha para la cuota ${i+1}.`, "error"); return; }
    }
    setLoading(true); setProcessingMsg("Procesando Venta...");
    try {
        const batch = writeBatch(db);
        const newTransId = doc(collection(db, `artifacts/${APP_ID}/public/data/transactions`)).id;
        const displayId = generateShortId();
        const now = new Date();
        let transactionFIFO = 0;
        let finalItems = [];
        const isCompleteReady = stockAnalysis.missing.length === 0;
        const mainStatus = isCompleteReady ? 'pending_delivery' : 'pending_order';

        // 1. ASSIGN STOCK (FIFO) -> Delivered/Reserved
        for (let item of stockAnalysis.available) {
             const { totalCost, batchUpdates, fifoDetails } = await calculateFIFOCost(item.id, item.qty);
             batchUpdates.forEach(u => batch.update(doc(db, `artifacts/${APP_ID}/public/data/inventory_batches`, u.id), { remainingQty: u.newRemainingQty }));
             batch.update(doc(db, `artifacts/${APP_ID}/public/data/products`, item.id), { stock: increment(-item.qty) });
             transactionFIFO += totalCost;
             // Stock found -> 'delivered' (Entrega Inmediata)
             finalItems.push({ ...item, fifoTotalCost: totalCost, fifoDetails: fifoDetails, status: 'delivered', orderType: 'stock' });
        }
        
        // 2. HANDLE MISSING (Backorder) -> Pending Order
        // By default, missing items are assigned to 'cycle' type for future ordering
        // The user removed the need to select origin here. It's decided later in Purchases module or default logic.
        for (let item of stockAnalysis.missing) {
             finalItems.push({ ...item, status: 'pending', orderType: 'cycle' }); 
        }

        const total = cart.reduce((acc, item) => acc + (item.transactionPrice * item.qty), 0);
        const totalPoints = cart.reduce((acc, item) => acc + ((item.points || 0) * item.qty), 0);
        const margin = total - transactionFIFO; 
        const paymentSchedule = calculatePaymentSchedule(total, paymentPlanType, checkoutData);
        
        const transactionData = { 
            id: newTransId, 
            displayId, 
            type: 'sale', 
            items: finalItems, 
            total, 
            totalPoints, 
            clientId: selectedClient, 
            date: { seconds: now.getTime() / 1000 }, 
            paymentPlanType, 
            paymentSchedule, 
            balance: total, 
            paymentStatus: 'pending', 
            paymentMethod: null, 
            totalCost: transactionFIFO, 
            margin, 
            marginPercent: (total > 0) ? (margin/total)*100 : 0, 
            saleStatus: mainStatus, 
            origin: 'POS', 
            cycleId: null, 
            courier: null, 
            deliveredAt: isCompleteReady ? { seconds: now.getTime() / 1000 } : null, 
            finalizedAt: null 
        };

        batch.set(doc(db, `artifacts/${APP_ID}/public/data/transactions`, newTransId), transactionData);
        await batch.commit();
        clearCart(); setIsCheckoutModalOpen(false); setCheckoutData({ installmentsCount: 3, installmentDates: {}, downPayment: '' }); setItemActions({}); triggerAlert("Éxito", "Venta registrada correctamente.", "success");
    } catch (error) { console.error(error); triggerAlert("Error", "No se pudo guardar.", "error"); } finally { setLoading(false); setProcessingMsg(''); }
  };

  const calculateFIFOCost = async (productId, qtyToSell) => {
    const q = query(collection(db, `artifacts/${APP_ID}/public/data/inventory_batches`), where('productId', '==', productId));
    const snapshot = await getDocs(q);
    let batches = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(b => b.remainingQty > 0).sort((a, b) => (a.date?.seconds || 0) - (b.date?.seconds || 0));
    let remainingToSell = qtyToSell, totalCost = 0, batchUpdates = [], fifoDetails = []; 
    for (const batch of batches) {
        if (remainingToSell <= 0) break;
        const takeFromBatch = Math.min(remainingToSell, batch.remainingQty);
        totalCost += (takeFromBatch * batch.cost);
        batchUpdates.push({ id: batch.id, newRemainingQty: batch.remainingQty - takeFromBatch });
        fifoDetails.push({ qty: takeFromBatch, cost: batch.cost, date: batch.date?.seconds || (Date.now() / 1000) });
        remainingToSell -= takeFromBatch;
    }
    if (remainingToSell > 0) {
        const fallbackCost = batches.length > 0 ? batches[batches.length - 1].cost : 0; 
        totalCost += (remainingToSell * fallbackCost);
        fifoDetails.push({ qty: remainingToSell, cost: fallbackCost, date: null, note: 'Sin Lote' });
    }
    return { totalCost, batchUpdates, fifoDetails };
  };

  const handleSendCatalog = (categoryId) => {
      let items = categoryId === 'ALL' ? products : products.filter(p => p.category === categoryId);
      items = items.filter(p => p.stock > 0).sort((a,b) => a.name.localeCompare(b.name));
      if (items.length === 0) { triggerAlert("Sin productos", "No hay stock para enviar.", "info"); return; }
      let message = `*🍃 CATÁLOGO NATURA 🍃*\n\n`;
      items.forEach(p => message += `* ${p.name} - $${formatMoney(p.price)}\n`);
      message += `\n_¿Te gustaría encargar alguno?_`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
      setShowCatalogModal(false);
  };

  const handleNotifyClient = (transaction) => {
      const client = clients.find(c => c.id === transaction.clientId);
      if (!client || !client.phone) { triggerAlert("Sin teléfono", "El cliente no tiene número registrado.", "error"); return; }
      let message = `Hola *${client.name}*! 👋\n\nTe cuento que ya tengo listos tus productos de Natura/Avon:\n`;
      (transaction.items || []).forEach(i => { if (i.status === 'delivered' || i.status === 'reserved') message += `- ${i.name} x${i.qty}\n`; });
      message += `\nTotal: $${formatMoney(transaction.total)}\n\n¿Cuándo te acomoda que coordinemos la entrega?`;
      window.open(`https://wa.me/${client.phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const loadProductHistory = async (prodId) => {
    setLoadingHistory(true); setProductHistory([]);
    try {
      const history = []; const basePath = `artifacts/${APP_ID}/public/data`;
      const batchesSnap = await getDocs(query(collection(db, basePath, 'inventory_batches'), where('productId', '==', prodId)));
      batchesSnap.forEach(doc => { const d = doc.data(); history.push({ id: doc.id, type: 'IN', date: d.date?.seconds * 1000 || Date.now(), qty: d.initialQty, price: d.cost, ref: 'Recepción' }); });
      transactions.forEach(t => { if (t.type === 'sale') { const item = (t.items || []).find(i => i.id === prodId); if (item) { history.push({ id: t.id, type: 'OUT', date: t.date?.seconds * 1000 || Date.now(), qty: item.qty, price: item.transactionPrice, margin: (item.transactionPrice * item.qty) - (item.fifoTotalCost || 0), ref: t.saleStatus === 'in_transit' ? 'En Reparto' : 'Venta', fifoDetails: item.fifoDetails || [] }); } } });
      history.sort((a, b) => b.date - a.date); setProductHistory(history);
    } catch (error) { console.error(error); } finally { setLoadingHistory(false); }
  };

  const handleDeleteProduct = async (productId) => {
      setConfirmationState({ show: true, title: "Eliminar Producto", message: "¿Estás seguro de que quieres eliminar este producto permanentemente?", type: "danger", onConfirm: async () => { setConfirmationState(prev => ({ ...prev, show: false })); setLoading(true); setProcessingMsg("Eliminando..."); try { await deleteDoc(doc(db, `artifacts/${APP_ID}/public/data/products`, productId)); triggerAlert("Eliminado", "Producto eliminado correctamente", "success"); } catch (error) { triggerAlert("Error", "No se pudo eliminar el producto.", "error"); } finally { setLoading(false); setProcessingMsg(""); } } });
  }

  const handleVoidTransaction = async (transaction) => {
      if (!transaction || !transaction.id) return;
      let confirmTitle = "Eliminar Registro"; let confirmMsg = `¿Eliminar registro de $${formatMoney(transaction.total)}?`; let type = "neutral";
      if (transaction.saleStatus === 'in_transit') { confirmTitle = "Devolución de Stock"; confirmMsg = "IMPORTANTE: ¿El cliente NO retiró el pedido?\n\nAl eliminar este envío, el stock volverá a tu inventario automáticamente."; type = "danger"; }
      setConfirmationState({ show: true, title: confirmTitle, message: confirmMsg, type: type, onConfirm: async () => { setConfirmationState(prev => ({ ...prev, show: false })); setLoading(true); setProcessingMsg('Procesando...'); try { const batch = writeBatch(db); batch.delete(doc(db, `artifacts/${APP_ID}/public/data/transactions`, transaction.id)); if (transaction.saleStatus !== 'pending_order' && transaction.saleStatus !== 'pending_cycle') { (transaction.items || []).forEach(item => { if (item.status === 'delivered' || item.status === 'reserved') { batch.update(doc(db, `artifacts/${APP_ID}/public/data/products`, item.id), { stock: increment(item.qty) }); } }); } await batch.commit(); setReceiptDetails(null); triggerAlert("Operación Exitosa", "Registro eliminado.", "success"); } catch (error) { console.error(error); triggerAlert("Error", "No se pudo anular.", "error"); } finally { setLoading(false); setProcessingMsg(''); } } });
  };

  const handleDeliverOrder = (transaction) => { setReceiptDetails(null); setDeliveryTransaction(transaction); setSelectedCourier('Yo (Directo)'); setIsDeliveryModalOpen(true); };

  const startDeliveryProcess = async () => {
      if (!deliveryTransaction) return;
      if (selectedCourier === 'Yo (Directo)' && deliveryTransaction.paymentPlanType === 'full' && deliveryTransaction.balance > 0) { triggerAlert("Pago Pendiente", "⛔ No puedes entregar este pedido porque tiene deuda pendiente.", "error"); return; }
      setLoading(true); setProcessingMsg(selectedCourier === 'Yo (Directo)' ? "Cerrando Venta..." : "Enviando a Reparto...");
      try {
          const batch = writeBatch(db); let finalTotalCost = deliveryTransaction.totalCost || 0; const updatedItems = [];
          for (const item of (deliveryTransaction.items || [])) {
               if (item.status === 'pending') {
                   const { totalCost, batchUpdates, fifoDetails } = await calculateFIFOCost(item.id, item.qty);
                   finalTotalCost += totalCost;
                   updatedItems.push({ ...item, status: 'delivered', fifoTotalCost: totalCost, fifoDetails: fifoDetails });
                   batchUpdates.forEach(u => batch.update(doc(db, `artifacts/${APP_ID}/public/data/inventory_batches`, u.id), { remainingQty: u.newRemainingQty }));
                   batch.update(doc(db, `artifacts/${APP_ID}/public/data/products`, item.id), { stock: increment(-item.qty) });
               } else { updatedItems.push(item.status === 'reserved' ? { ...item, status: 'delivered' } : item); }
          }
          const margin = deliveryTransaction.total - finalTotalCost; const nextStatus = selectedCourier === 'Yo (Directo)' ? 'completed' : 'in_transit'; const now = new Date();
          batch.update(doc(db, `artifacts/${APP_ID}/public/data/transactions`, deliveryTransaction.id), { saleStatus: nextStatus, courier: selectedCourier, deliveredAt: { seconds: now.getTime() / 1000 }, finalizedAt: selectedCourier === 'Yo (Directo)' ? { seconds: now.getTime() / 1000 } : null, items: updatedItems, totalCost: finalTotalCost, margin: margin, marginPercent: deliveryTransaction.total > 0 ? (margin / deliveryTransaction.total) * 100 : 0 });
          await batch.commit(); setIsDeliveryModalOpen(false); setDeliveryTransaction(null); triggerAlert(nextStatus === 'completed' ? "Venta Cerrada" : "En Reparto", nextStatus === 'completed' ? "Entregado." : `Entregado a ${selectedCourier}.`, "success");
      } catch (error) { console.error(error); triggerAlert("Error", "Fallo proceso.", "error"); } finally { setLoading(false); setProcessingMsg(''); }
  };

  const handleConfirmDeliveryClick = (transaction) => { setConfirmDeliveryModal({ show: true, transaction: transaction }); setDeliveryDateInput(new Date().toISOString().split('T')[0]); };
  const processDeliveryConfirmation = async () => {
      const transaction = confirmDeliveryModal.transaction;
      if (!transaction || !transaction.id) return;
      if (transaction.paymentPlanType === 'full' && transaction.balance > 0) { setConfirmDeliveryModal({ show: false, transaction: null }); triggerAlert("Pago Pendiente", "⛔ El pedido no está pagado.", "error"); return; }
      setConfirmDeliveryModal({ show: false, transaction: null }); setLoading(true); setProcessingMsg("Finalizando Venta...");
      try {
          const selectedDate = new Date(deliveryDateInput + 'T12:00:00'); 
          await updateDoc(doc(db, `artifacts/${APP_ID}/public/data/transactions`, transaction.id), { saleStatus: 'completed', finalizedAt: { seconds: selectedDate.getTime() / 1000 } });
          triggerAlert("¡Listo!", "Venta finalizada con fecha seleccionada.", "success"); setReceiptDetails(null);
      } catch (error) { console.error(error); triggerAlert("Error", "No se pudo finalizar.", "error"); } finally { setLoading(false); setProcessingMsg(''); }
  };

  const addToCart = (product) => {
    setCart(prev => { const existing = prev.find(p => p.id === product.id); if (existing) return prev.map(p => p.id === product.id ? { ...p, qty: p.qty + 1 } : p); return [...prev, { ...product, transactionPrice: view === 'purchases' ? 0 : product.price, qty: 1, expirationDate: '', points: product.points || 0, isMagazinePrice: false, originalPrice: product.price, isPriceEditable: false, orderType: 'cycle' }]; });
  };
  const removeFromCart = (id) => setCart(prev => prev.filter(p => p.id !== id));
  const updateQty = (id, d) => setCart(prev => prev.map(p => { if (p.id === id) { const n = Math.max(1, p.qty + d); return { ...p, qty: n }; } return p; }));
  const updateTransactionPrice = (id, p) => setCart(prev => prev.map(i => i.id === id ? { ...i, transactionPrice: p } : i));
  const togglePriceEdit = (id) => setCart(prev => prev.map(i => i.id === id ? { ...i, isPriceEditable: !i.isPriceEditable } : i));
  const updateCheckInDate = (tempId, date) => setCheckInItems(prev => prev.map(i => i._tempId === tempId ? { ...i, expirationDate: date } : i));

  // NEW: Set origin per item in Purchases cart
  const updateItemOrigin = (id, origin) => setCart(prev => prev.map(i => i.id === id ? { ...i, orderType: origin } : i));

  const clearCart = () => { setCart([]); setSelectedClient(''); setClientSearchTerm(''); setSelectedSupplier(''); setPaymentMethod(''); setEditingTransactionId(null); setOrderSource(null); setCatalogBrand(''); setSelectedCycle(''); setPaymentPlanType('full'); setCheckoutData({ installmentsCount: 3, installmentDates: {} }); setItemActions({}); };
  const cartTotal = useMemo(() => cart.reduce((acc, item) => acc + (item.transactionPrice * item.qty), 0), [cart]);
  const cartPoints = useMemo(() => cart.reduce((acc, item) => acc + ((item.points || 0) * item.qty), 0), [cart]);

  const handleCreateSupplyOrder = async () => {
      if (cart.length === 0) { triggerAlert("Vacío", "Agrega productos.", "info"); return; }
      setLoading(true); setProcessingMsg('Procesando Pedidos...');

      // Group items by origin and brand to create split transactions if needed
      const cycleGroups = {}; // Key: cycleId
      const webItems = [];
      
      cart.forEach(item => {
          if (item.orderType === 'cycle') {
              // Find open cycle for this brand
              const prod = products.find(p => p.id === item.id);
              const brand = prod?.brand || 'Natura';
              const activeCycle = cycles.find(c => c.status === 'open' && c.brand === brand);
              
              const cycleId = activeCycle ? activeCycle.id : 'NO_CYCLE';
              if (!cycleGroups[cycleId]) cycleGroups[cycleId] = [];
              cycleGroups[cycleId].push({ ...item, cycleId: activeCycle ? activeCycle.id : null });
          } else {
              webItems.push({ ...item, orderType: 'web' });
          }
      });

      try {
          const batch = writeBatch(db);
          const now = new Date();

          // 1. Create Web Order if any
          if (webItems.length > 0) {
              const newTransId = doc(collection(db, `artifacts/${APP_ID}/public/data/transactions`)).id;
              const total = webItems.reduce((acc, i) => acc + (i.transactionPrice * i.qty), 0);
              const data = {
                  id: newTransId, displayId: generateShortId(), type: 'order', items: webItems, total, totalPoints: 0,
                  clientId: 'Stock Personal (Web)', date: { seconds: now.getTime() / 1000 }, saleStatus: 'pending_arrival',
                  orderType: 'web', cycleId: null
              };
              batch.set(doc(db, `artifacts/${APP_ID}/public/data/transactions`, newTransId), data);
          }

          // 2. Create Cycle Orders
          for (const [cycleId, items] of Object.entries(cycleGroups)) {
              const newTransId = doc(collection(db, `artifacts/${APP_ID}/public/data/transactions`)).id;
              const total = items.reduce((acc, i) => acc + (i.transactionPrice * i.qty), 0);
              const realCycleId = cycleId === 'NO_CYCLE' ? null : cycleId;
              const data = {
                  id: newTransId, displayId: generateShortId(), type: 'order', items: items, total, totalPoints: 0,
                  clientId: 'Stock Personal (Ciclo)', date: { seconds: now.getTime() / 1000 }, saleStatus: 'pending_arrival',
                  orderType: 'cycle', cycleId: realCycleId
              };
              batch.set(doc(db, `artifacts/${APP_ID}/public/data/transactions`, newTransId), data);
          }

          await batch.commit();
          clearCart(); setOrderSource(null); triggerAlert("Pedidos Creados", "Se han generado las órdenes de abastecimiento.", "success");

      } catch (error) { console.error(error); triggerAlert("Error", "Fallo al crear pedidos.", "error"); } finally { setLoading(false); setProcessingMsg(''); }
  };

  const startCheckIn = (transaction) => {
      const explodedItems = [];
      (transaction.items || []).forEach((item) => { for(let i=0; i < item.qty; i++) { explodedItems.push({ _tempId: `${item.id}_${i}_${Date.now()}`, ...item, uniqueQty: 1, expirationDate: '' }); } });
      setCheckInItems(explodedItems); setCheckInOrder(transaction);
  };

  const processPendingAllocations = async (arrivedProductIds) => {
      try {
          const snapshot = await getDocs(query(collection(db, `artifacts/${APP_ID}/public/data/transactions`), where('type', '==', 'sale')));
          const pendingSales = snapshot.docs.map(d => ({...d.data(), id: d.id})).filter(t => ['pending_order', 'pending_cycle', 'pending_web', 'pending_arrival'].includes(t.saleStatus));
          if (pendingSales.length === 0) return;
          const batch = writeBatch(db); let updatesCount = 0;
          for (const sale of pendingSales) {
              let isSaleModified = false; let saleItems = [...sale.items]; let allItemsReserved = true;
              for (let i = 0; i < saleItems.length; i++) {
                  const item = saleItems[i];
                  if (item.status === 'pending' && arrivedProductIds.includes(item.id)) {
                      const { totalCost, batchUpdates, fifoDetails } = await calculateFIFOCost(item.id, item.qty);
                      const allocatedQty = fifoDetails.filter(d => d.note !== 'Sin Lote').reduce((a, b) => a + b.qty, 0);
                      if (allocatedQty >= item.qty) {
                          batchUpdates.forEach(u => batch.update(doc(db, `artifacts/${APP_ID}/public/data/inventory_batches`, u.id), { remainingQty: u.newRemainingQty }));
                          batch.update(doc(db, `artifacts/${APP_ID}/public/data/products`, item.id), { stock: increment(-item.qty) });
                          saleItems[i] = { ...item, status: 'reserved', fifoTotalCost: totalCost, fifoDetails: fifoDetails }; isSaleModified = true;
                      } else { allItemsReserved = false; }
                  } else if (item.status === 'pending') { allItemsReserved = false; }
              }
              if (isSaleModified) {
                  const updates = { items: saleItems }; const newTotalCost = saleItems.reduce((acc, it) => acc + (it.fifoTotalCost || 0), 0);
                  updates.totalCost = newTotalCost; updates.margin = sale.total - newTotalCost; updates.marginPercent = sale.total > 0 ? (updates.margin / sale.total) * 100 : 0;
                  if (allItemsReserved) { updates.saleStatus = 'pending_delivery'; updates.readyAt = { seconds: Date.now() / 1000 }; }
                  batch.update(doc(db, `artifacts/${APP_ID}/public/data/transactions`, sale.id), updates); updatesCount++;
              }
          }
          if (updatesCount > 0) { await batch.commit(); triggerAlert("Pedidos Actualizados", `${updatesCount} pedidos ahora tienen stock asignado.`, "success"); }
      } catch (e) { console.error("Error allocating stock:", e); }
  };

  const confirmCheckIn = async () => {
      if (checkInItems.some(i => !i.expirationDate)) { triggerAlert("Faltan Fechas", "Ingresa el vencimiento de CADA producto.", "error"); return; }
      setLoading(true); setProcessingMsg('Ingresando Stock...');
      try {
          const batch = writeBatch(db); const isInvestment = checkInOrder.clientId && checkInOrder.clientId.includes('Stock'); const arrivedProductIds = [];
          checkInItems.forEach(item => {
              batch.set(doc(collection(db, `artifacts/${APP_ID}/public/data/inventory_batches`)), { productId: item.id, productName: item.name, date: { seconds: Date.now() / 1000 }, cost: Number(item.transactionPrice), initialQty: 1, remainingQty: 1, supplierId: checkInOrder.clientId, expirationDate: item.expirationDate, transactionId: checkInOrder.id, origin: item.orderType });
              batch.update(doc(db, `artifacts/${APP_ID}/public/data/products`, item.id), { stock: increment(1) });
              if (!arrivedProductIds.includes(item.id)) arrivedProductIds.push(item.id);
          });
          batch.update(doc(db, `artifacts/${APP_ID}/public/data/transactions`, checkInOrder.id), { type: isInvestment ? 'stock_entry' : 'purchase', saleStatus: 'completed', checkInDate: { seconds: Date.now() / 1000 } });
          await batch.commit(); setCheckInOrder(null); setCheckInItems([]);
          if (arrivedProductIds.length > 0) { await processPendingAllocations(arrivedProductIds); } else { triggerAlert("Stock Actualizado", "Productos ingresados correctamente.", "success"); }
      } catch (error) { console.error(error); triggerAlert("Error", "Falló el ingreso.", "error"); } finally { setLoading(false); setProcessingMsg(''); }
  };

  const handleRegisterPayment = async () => {
      if(!selectedPaymentTx) return; const amount = parseInt(paymentAmountInput) || 0;
      if (amount <= 0) { triggerAlert("Monto Inválido", "Ingresa un monto mayor a 0", "error"); return; }
      setLoading(true); setProcessingMsg("Registrando Pago..."); let receiptUrl = null;
      try { if (paymentReceiptFile) { const snap = await uploadBytes(ref(storage, `receipts/${Date.now()}_${paymentReceiptFile.name}`), paymentReceiptFile); receiptUrl = await getDownloadURL(snap.ref); } } catch (e) { console.error("Error uploading receipt", e); }
      try {
          let updatedSchedule = [...selectedPaymentTx.paymentSchedule]; let updatedBalance = selectedPaymentTx.balance;
          const newPaymentRecord = { amount: amount, date: Date.now() / 1000, method: paymentMethod || 'Efectivo', receiptUrl: receiptUrl, id: Date.now().toString() };
          if (selectedPaymentIndex !== null) {
              const item = updatedSchedule[selectedPaymentIndex]; const previousPaid = item.paidAmount || 0; const newTotalPaid = previousPaid + amount;
              updatedSchedule[selectedPaymentIndex] = { ...item, paidAmount: newTotalPaid, paymentHistory: item.paymentHistory ? [...item.paymentHistory, newPaymentRecord] : [newPaymentRecord], status: newTotalPaid >= item.amount ? 'paid' : 'partial', paidAt: Date.now() / 1000, method: paymentMethod }; updatedBalance -= amount;
          } else { updatedBalance -= amount; }
          const newStatus = updatedBalance <= 0 ? 'paid' : 'partial'; const extraUpdates = {};
          if (updatedBalance <= 0 && (selectedPaymentTx.saleStatus === 'completed' || selectedPaymentTx.saleStatus === 'pending_delivery') && !selectedPaymentTx.finalizedAt) { extraUpdates.finalizedAt = { seconds: Date.now() / 1000 }; }
          await updateDoc(doc(db, `artifacts/${APP_ID}/public/data/transactions`, selectedPaymentTx.id), { paymentSchedule: updatedSchedule, balance: updatedBalance, paymentStatus: newStatus, ...extraUpdates });
          setPaymentModalOpen(false); setPaymentAmountInput(''); setSelectedPaymentTx(null); setPaymentReceiptFile(null); triggerAlert("Abono Registrado", `Se abonaron $${formatMoney(amount)}.`, "success");
      } catch(e) { console.error(e); triggerAlert("Error", "No se pudo registrar pago", "error"); } finally { setLoading(false); setProcessingMsg(""); }
  };

  const simpleSave = async (collectionName, data, isModalOpenSetter) => { try { await addDoc(collection(db, `artifacts/${APP_ID}/public/data/${collectionName}`), data); isModalOpenSetter(false); } catch (e) { console.error(e); triggerAlert("Error", "No se pudo guardar.", "error"); } };
  const handleDeleteCategory = async (catId) => { if(window.confirm("¿Seguro que quieres borrar esta categoría?")) try { await deleteDoc(doc(db, `artifacts/${APP_ID}/public/data/categories`, catId)); triggerAlert("Borrada", "Categoría eliminada", "success"); } catch (e) { triggerAlert("Error", "No se pudo borrar", "error"); } };

  const handleSaveProduct = async (e) => {
    e.preventDefault(); const fd = new FormData(e.currentTarget); const imageFile = fd.get('image'); const price = Number(productPriceInput) || 0;
    if (!editingProduct && (!imageFile || imageFile.size === 0)) { triggerAlert("Falta Imagen", "Es obligatorio subir una foto del producto.", "error"); return; }
    setLoading(true); let imageUrl = editingProduct?.imageUrl || null;
    try {
        if (imageFile && imageFile.size > 0) { const snap = await uploadBytes(ref(storage, `natura/${Date.now()}_${imageFile.name}`), imageFile); imageUrl = await getDownloadURL(snap.ref); }
        const data = { name: fd.get('name'), brand: fd.get('brand'), price, category: fd.get('category'), stock: editingProduct ? editingProduct.stock : 0, imageUrl, customId: fd.get('customId') || '', points: Number(fd.get('points')) || 0 };
        if (editingProduct) await updateDoc(doc(db, `artifacts/${APP_ID}/public/data/products`, editingProduct.id), data); else await addDoc(collection(db, `artifacts/${APP_ID}/public/data/products`), data);
        setIsProductModalOpen(false); setEditingProduct(null); setProductPriceInput('');
    } catch (e) { console.error(e); triggerAlert("Error", "Error al guardar.", "error"); } finally { setLoading(false); }
  };

  const handleSaveClient = async (e) => {
    e.preventDefault(); const fd = new FormData(e.currentTarget); const clientData = { name: fd.get('name'), department: fd.get('department') || '', phone: fd.get('phone') || '', email: fd.get('email') || '' };
    try { if (editingClient) { await updateDoc(doc(db, `artifacts/${APP_ID}/public/data/clients`, editingClient.id), clientData); triggerAlert("Actualizado", "Cliente editado correctamente.", "success"); } else { const docRef = await addDoc(collection(db, `artifacts/${APP_ID}/public/data/clients`), clientData); if (isCheckoutModalOpen) { setSelectedClient(docRef.id); setClientSearchTerm(clientData.name); } triggerAlert("Cliente Creado", "Registrado exitosamente.", "success"); } setIsClientModalOpen(false); setEditingClient(null); } catch (e) { console.error(e); triggerAlert("Error", "Fallo al guardar.", "error"); }
  };

  const handleDeleteClient = async (clientId) => { if (!window.confirm("¿Eliminar este cliente?")) return; try { await deleteDoc(doc(db, `artifacts/${APP_ID}/public/data/clients`, clientId)); triggerAlert("Eliminado", "Cliente borrado.", "success"); } catch(e) { triggerAlert("Error", "No se pudo eliminar", "error"); } };
  const handleSaveSupplier = async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); try { const docRef = await addDoc(collection(db, `artifacts/${APP_ID}/public/data/suppliers`), { name: fd.get('name'), contact: fd.get('contact')||'', phone: fd.get('phone')||'' }); setIsSupplierModalOpen(false); setSelectedSupplier(docRef.id); triggerAlert("Proveedor Guardado", "Listo.", "success"); } catch (e) { triggerAlert("Error", "Fallo al guardar.", "error"); } };

  const filteredProducts = products.filter(p => (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase())) && (selectedCategoryFilter === 'ALL' || p.category === selectedCategoryFilter));
  const filteredClientsForSearch = clients.filter(c => c.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) || (c.department && c.department.toLowerCase().includes(clientSearchTerm.toLowerCase())));
  const pendingPaymentTransactions = useMemo(() => transactions.filter(t => t.type === 'sale' && t.paymentStatus !== 'paid').sort((a,b) => b.date.seconds - a.date.seconds), [transactions]);
  
  const filteredSales = useMemo(() => {
      const all = transactions.filter(t => t.type === 'sale');
      const pending = all.filter(t => ['pending', 'pending_order', 'pending_cycle', 'pending_web'].includes(t.saleStatus));
      
      const toArrive = pending.filter(t => {
          if (t.orderType === 'web') return true; 
          if (t.cycleId) {
              const cycle = cycles.find(c => c.id === t.cycleId);
              return cycle && cycle.status === 'closed'; 
          }
          return false;
      });

      const toOrder = pending.filter(t => {
          if (t.orderType === 'web') return false; 
          if (t.cycleId) {
              const cycle = cycles.find(c => c.id === t.cycleId);
              return !cycle || cycle.status === 'open'; 
          }
          return true;
      });

      return {
          completed: all.filter(t => t.saleStatus === 'completed'),
          pending_delivery: all.filter(t => t.saleStatus === 'pending_delivery'),
          inTransit: all.filter(t => t.saleStatus === 'in_transit'),
          toArrive: toArrive,
          toOrder: toOrder
      };
  }, [transactions, cycles]);

  const filteredOrders = useMemo(() => transactions.filter(t => (t.type === 'order' && t.saleStatus === 'pending_arrival') || (t.type === 'purchase' || t.type === 'stock_entry')), [transactions]);
  const pendingArrivals = useMemo(() => filteredOrders.filter(t => t.saleStatus === 'pending_arrival').sort((a,b) => a.date.seconds - b.date.seconds), [filteredOrders]);
  const purchaseHistoryData = filteredOrders.filter(t => t.type === 'purchase' || t.type === 'stock_entry');
  const getClientName = (id) => { if (!id) return 'Consumidor Final'; const c = clients.find(c => c.id === id); return c ? c.name : 'Consumidor Final'; };
  
  const handleSaveCycle = async (e) => {
      e.preventDefault(); const fd = new FormData(e.currentTarget);
      const brand = fd.get('brand');
      try { 
          const activeCycle = cycles.find(c => c.status === 'open' && c.brand === brand); 
          if(activeCycle) { triggerAlert("Ciclo ya existe", `Ya hay un ciclo abierto para ${brand}.`, "error"); return; } 
          await addDoc(collection(db, `artifacts/${APP_ID}/public/data/cycles`), { name: fd.get('name'), goal: Number(fd.get('goal')), closingDate: fd.get('closingDate'), status: 'open', startDate: new Date().toISOString(), brand: brand }); 
          setIsCycleModalOpen(false); triggerAlert("Ciclo Iniciado", `Nuevo ciclo de ${brand}.`, "success"); 
      } catch(e) { console.error(e); triggerAlert("Error", "No se pudo crear el ciclo.", "error"); }
  };

  const handleCloseCycle = async (cycleId) => {
      const cycle = cycles.find(c => c.id === cycleId); if(!cycle) return;
      const stats = calculateCycleStats(cycleId);
      
      if(stats.totalPoints < cycle.goal) { triggerAlert("Meta No Alcanzada", "No puedes cerrar el pedido si no has llegado al límite de puntos.", "error"); return; }
      
      setConfirmationState({ show: true, title: "Cerrar Ciclo", message: `¿Estás seguro de cerrar el ciclo "${cycle.name}"?\n\nTodos los pedidos pendientes pasarán a estado "Por Recibir".`, type: "neutral", onConfirm: async () => { 
          setConfirmationState(prev => ({ ...prev, show: false })); setLoading(true); setProcessingMsg("Generando pedidos..."); 
          try { 
              const batch = writeBatch(db); const cycleOrders = stats.orders; 
              cycleOrders.forEach(order => { batch.update(doc(db, `artifacts/${APP_ID}/public/data/transactions`, order.id), { saleStatus: 'pending_order', orderedAt: new Date().toISOString() }); }); 
              batch.update(doc(db, `artifacts/${APP_ID}/public/data/cycles`, cycle.id), { status: 'closed', closedAt: new Date().toISOString() }); 
              await batch.commit(); 
              triggerAlert("Ciclo Cerrado", "Los pedidos ahora están en 'Por Recibir'.", "success"); 
              setViewingCycle(null);
          } catch(e) { console.error(e); triggerAlert("Error", "Falló al cerrar ciclo", "error"); } finally { setLoading(false); setProcessingMsg(""); } 
      }});
  };

  const getBrandStyle = (brand) => {
      const b = brand.toLowerCase();
      if(b.includes('natura')) return 'bg-orange-100 text-orange-800 border-orange-200';
      if(b.includes('avon')) return 'bg-pink-100 text-pink-800 border-pink-200';
      if(b.includes('l\'bel') || b.includes('esika') || b.includes('cyzone') || b.includes('belcorp')) return 'bg-purple-100 text-purple-800 border-purple-200';
      return 'bg-stone-100 text-stone-800 border-stone-200';
  };

  const getAlertConfig = (type) => { switch(type) { case 'success': return { border: 'border-green-500', icon: CheckCircle2, color: 'text-green-600' }; case 'error': return { border: 'border-red-500', icon: AlertCircle, color: 'text-red-600' }; default: return { border: 'border-orange-500', icon: Info, color: 'text-orange-500' }; } };
  const getHeaderTitle = () => { switch(view) { case 'pos': return 'Registra Venta'; case 'cycles': return 'Gestión Ciclos'; case 'purchases': return 'Compras / Stock'; case 'receipts': return 'Pedidos'; case 'finances': return 'Deudores'; default: return view; } };

  if (!user && loading) return <div className="flex h-screen items-center justify-center bg-[#fdfbf7] text-[#1e4620] font-serif font-bold text-xl"><Loader2 className="animate-spin mr-2"/> Cargando Natura POS...</div>;

  return (
    <div className="flex h-screen bg-[#fdfbf7] text-stone-800 font-sans overflow-hidden relative">
      {loading && processingMsg && (
          <div className="fixed inset-0 bg-[#1e4620]/80 z-[110] flex flex-col items-center justify-center backdrop-blur-sm text-white">
              <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-200">
                  <Loader2 className="w-12 h-12 text-[#d97706] animate-spin mb-4"/>
                  <span className="font-bold text-lg text-[#1e4620]">{processingMsg}</span>
              </div>
          </div>
      )}

      {alertState.show && (
        <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className={`bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl text-center border-t-8 ${getAlertConfig(alertState.type).border}`}>
                {React.createElement(getAlertConfig(alertState.type).icon, { className: `w-10 h-10 mx-auto mb-4 ${getAlertConfig(alertState.type).color}` })}
                <h3 className="text-xl font-bold mb-2 font-serif text-[#1e4620]">{alertState.title}</h3>
                <p className="text-sm text-stone-500 mb-6">{alertState.message}</p>
                <button onClick={() => setAlertState({...alertState, show: false})} className="w-full py-3 bg-[#1e4620] text-white rounded-xl font-bold hover:bg-[#153316] transition-colors">Entendido</button>
            </div>
        </div>
      )}

      {confirmationState.show && (
        <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl text-center border-t-8 border-[#d97706]">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-[#d97706]"/>
                <h3 className="text-xl font-bold mb-2 font-serif text-[#1e4620]">{confirmationState.title}</h3>
                <p className="text-sm text-stone-500 mb-6 whitespace-pre-line">{confirmationState.message}</p>
                <div className="flex gap-3">
                    <button onClick={() => setConfirmationState({...confirmationState, show: false})} className="flex-1 py-3 bg-stone-100 text-stone-600 rounded-xl font-bold hover:bg-stone-200">Cancelar</button>
                    <button onClick={confirmationState.onConfirm} className={`flex-1 py-3 text-white rounded-xl font-bold shadow-lg ${confirmationState.type === 'danger' ? 'bg-red-700 hover:bg-red-800' : 'bg-[#1e4620] hover:bg-[#153316]'}`}>Confirmar</button>
                </div>
            </div>
        </div>
      )}

      {/* --- SIDEBAR (Desktop/Tablet) --- */}
      <aside className="hidden md:flex flex-col w-64 bg-[#1e4620] text-white h-full shadow-2xl shrink-0 z-20">
          <div className="p-6 border-b border-[#2d6130] flex items-center gap-3">
             <Leaf className="w-8 h-8 text-[#d97706]" />
             <div>
                <h1 className="font-serif font-bold text-xl tracking-wide">Consultora</h1>
                <p className="text-[10px] text-[#aabfb0] uppercase tracking-widest">Panel de Control</p>
             </div>
          </div>
          
          <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
              <SidebarItem icon={<ShoppingCart />} label="Vender" active={view === 'pos'} onClick={() => setView('pos')} />
              <SidebarItem icon={<ShoppingBag />} label="Compras / Stock" active={view === 'purchases'} onClick={() => setView('purchases')} />
              <SidebarItem icon={<Receipt />} label="Pedidos" active={view === 'receipts'} onClick={() => setView('receipts')} />
              <SidebarItem icon={<Repeat />} label="Ciclos" active={view === 'cycles'} onClick={() => setView('cycles')} />
              <SidebarItem icon={<DollarSign />} label="Deudores" active={view === 'finances'} onClick={() => setView('finances')} />
          </nav>

          <div className="p-4 border-t border-[#2d6130] bg-[#153316]">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#d97706] flex items-center justify-center font-bold text-white shadow-md">
                      {user?.isAnonymous ? 'A' : (user?.displayName?.[0] || 'C')}
                  </div>
                  <div className="overflow-hidden">
                      <p className="font-bold text-sm truncate text-[#fdfbf7]">{user?.isAnonymous ? 'Modo Invitado' : (user?.displayName || 'Consultora')}</p>
                      <p className="text-xs text-[#8da892] truncate">Natura & Avon</p>
                  </div>
              </div>
          </div>
      </aside>

      {/* --- MOBILE HEADER --- */}
      <div className="md:hidden fixed top-0 w-full bg-[#1e4620] text-white z-40 px-4 py-3 flex justify-between items-center shadow-md">
         <div className="flex items-center gap-2">
             <Leaf className="w-6 h-6 text-[#d97706]" />
             <span className="font-serif font-bold text-lg">{getHeaderTitle()}</span>
         </div>
      </div>

      <main className={`flex-1 overflow-hidden relative flex flex-col ${view !== 'pos' && view !== 'purchases' ? 'overflow-y-auto' : ''} md:pt-0 pt-14`}>
        
        {(view === 'pos') && (
            <div className="flex flex-col h-full relative">
                
                {/* HEADER (SEARCH ONLY) */}
                <div className="bg-white border-b border-[#e5e7eb] shadow-sm z-10">
                    <div className="p-4 space-y-3">
                        <div className="relative">
                            <Search className="absolute left-4 top-3.5 w-5 h-5 text-stone-400"/>
                            <input className="w-full pl-12 pr-4 py-3 bg-[#fdfbf7] border border-stone-200 rounded-2xl text-sm focus:outline-none focus:border-[#d97706] transition-colors" placeholder="Buscar producto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                        </div>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                            <button onClick={() => setSelectedCategoryFilter('ALL')} className={`px-4 py-1.5 rounded-full border text-xs font-bold whitespace-nowrap transition-colors ${selectedCategoryFilter === 'ALL' ? 'bg-[#d97706] text-white border-[#d97706]' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'}`}>Todos</button>
                            {categories.map(c => <button key={c.id} onClick={() => setSelectedCategoryFilter(c.id)} className={`px-4 py-1.5 rounded-full border text-xs font-bold whitespace-nowrap transition-colors ${selectedCategoryFilter === c.id ? 'bg-[#d97706] text-white border-[#d97706]' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'}`}>{c.name}</button>)}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-[#fdfbf7] pb-48">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                        {filteredProducts.map(p => (
                            <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden flex flex-col h-full group hover:shadow-lg hover:border-[#d97706]/30 transition-all duration-300 text-left relative">
                                <div onClick={() => addToCart(p)} className="cursor-pointer">
                                    <div className="aspect-square w-full relative bg-[#fdfbf7]">
                                        {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <Leaf className="w-full h-full p-10 text-[#d4dcd6]" />}
                                        {p.points > 0 && <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold text-[#1e4620] shadow-sm flex items-center gap-1"><Gem className="w-3 h-3 text-[#d97706]"/> {p.points} pts</div>}
                                        {p.stock <= 0 && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="text-[10px] font-bold bg-[#d97706] text-white px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">Por Encargo</span></div>}
                                    </div>
                                    <div className="p-3 flex flex-col flex-1 justify-between">
                                        <span className="font-bold text-sm text-[#1e4620] line-clamp-2 leading-snug">{p.name}</span>
                                        <div className="mt-3 flex justify-between items-end w-full">
                                            <span className="text-[#d97706] font-black text-lg">${formatMoney(p.price)}</span>
                                            <div className={`w-2 h-2 rounded-full ${getStockStatus(p.stock).color.split(' ')[0]}`}></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-3 pb-3 pt-0 flex gap-2 border-t border-stone-100 mt-1">
                                     <button onClick={() => { setEditingProduct(p); setProductPriceInput(p.price); setIsProductModalOpen(true); }} className="flex-1 py-2 text-stone-400 hover:text-[#1e4620] flex justify-center"><Pencil className="w-4 h-4"/></button>
                                     <button onClick={() => { setViewingHistoryProduct(p); setIsHistoryModalOpen(true); loadProductHistory(p.id); }} className="flex-1 py-2 text-stone-400 hover:text-[#1e4620] flex justify-center"><History className="w-4 h-4"/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                {cart.length > 0 && (
                    <div className="fixed bottom-[70px] md:bottom-0 md:left-64 right-0 z-30 flex flex-col shadow-[0_-5px_20px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-10 duration-300">
                        <div className="rounded-t-3xl border-t border-[#e5e7eb] p-5 bg-white/95 backdrop-blur-md">
                            <div className="max-h-48 overflow-y-auto mb-3 space-y-3 pr-2 custom-scrollbar">
                                {cart.map(item => (
                                    <div key={item.id} className="flex justify-between items-center group border-b border-stone-100 pb-2 last:border-0">
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-[#1e4620] line-clamp-1">{item.name}</div>
                                            <div className="text-xs text-stone-400 flex items-center gap-2 mt-1">
                                                 <div className="flex items-center bg-stone-100 rounded-lg h-6">
                                                    <button onClick={() => updateQty(item.id, -1)} className="px-2 h-full flex items-center hover:text-[#d97706]"><Minus className="w-3 h-3"/></button>
                                                    <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                                                    <button onClick={() => updateQty(item.id, 1)} className="px-2 h-full flex items-center hover:text-[#d97706]"><Plus className="w-3 h-3"/></button>
                                                </div>
                                                <span className="font-medium">x ${formatMoney(item.transactionPrice)}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 w-24">
                                            <div className="flex gap-2 mb-1">
                                                <button onClick={() => togglePriceEdit(item.id)} className={`p-1 rounded-md transition-colors ${item.isPriceEditable ? 'bg-[#d97706] text-white' : 'text-stone-400 hover:text-[#1e4620] hover:bg-stone-100'}`}>
                                                    {item.isPriceEditable ? <ToggleRight className="w-5 h-5"/> : <ToggleLeft className="w-5 h-5"/>}
                                                </button>
                                                <button onClick={() => removeFromCart(item.id)} className="text-stone-300 hover:text-red-400 p-1"><X className="w-5 h-5"/></button>
                                            </div>
                                            {item.isPriceEditable ? (
                                                <MoneyInput className="w-full text-right text-sm font-bold border-b-2 border-[#d97706] focus:outline-none bg-transparent text-[#d97706]" value={item.transactionPrice === 0 ? '' : item.transactionPrice} placeholder="0" onChange={val => updateTransactionPrice(item.id, val || 0)} autoFocus />
                                            ) : (
                                                <div className="text-sm font-black text-[#1e4620]">${formatMoney(item.transactionPrice * item.qty)}</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => { setIsCheckoutModalOpen(true); }} className="w-full h-14 bg-[#1e4620] hover:bg-[#153316] text-white rounded-2xl font-bold flex justify-between px-6 items-center shadow-xl transition-all active:scale-[0.99]">
                                <span className="flex items-center gap-2 text-lg">Ir a Pagar <ChevronRight className="w-5 h-5"/></span>
                                <span className="text-xl font-serif">${formatMoney(cartTotal)}</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* --- PURCHASES VIEW (RESTORED) --- */}
        {view === 'purchases' && (
            <div className="flex flex-col h-full bg-[#fdfbf7]">
                {/* NEW HEADER FOR MANAGEMENT */}
                <div className="p-6 pb-0 bg-[#1e4620] shadow-lg z-10">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-serif font-bold text-2xl text-white">Compras & Stock</h2>
                    </div>
                    <div className="flex p-1 bg-[#153316] rounded-xl mb-6">
                        <button onClick={() => setPurchasesSubView('orders')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${purchasesSubView === 'orders' ? 'bg-[#fdfbf7] text-[#1e4620] shadow' : 'text-[#8da892]'}`}>📦 Recepción</button>
                        <button onClick={() => setPurchasesSubView('history')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${purchasesSubView === 'history' ? 'bg-[#fdfbf7] text-[#1e4620] shadow' : 'text-[#8da892]'}`}>📜 Historial</button>
                        <button onClick={() => setPurchasesSubView('catalog')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${purchasesSubView === 'catalog' ? 'bg-[#fdfbf7] text-[#1e4620] shadow' : 'text-[#8da892]'}`}>🏷️ Catálogo</button>
                    </div>
                </div>

                {purchasesSubView === 'orders' && (
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-24">
                        <div className="flex gap-3 mb-4">
                             <button onClick={() => { setEditingProduct(null); setProductPriceInput(''); setIsProductModalOpen(true); }} className="flex-1 bg-white text-[#1e4620] p-3 rounded-2xl shadow-sm flex items-center justify-center gap-2 hover:shadow-md transition-all active:scale-95 border border-stone-100 text-sm font-bold">
                                <Plus className="w-4 h-4"/> Nuevo Producto
                             </button>
                             <button onClick={() => setIsCategoryModalOpen(true)} className="flex-1 bg-white text-[#1e4620] p-3 rounded-2xl shadow-sm flex items-center justify-center gap-2 hover:shadow-md transition-all active:scale-95 border border-stone-100 text-sm font-bold">
                                <Tag className="w-4 h-4"/> Categorías
                             </button>
                        </div>

                        {!orderSource ? (
                            <>
                                <button onClick={() => setOrderSource('selection')} className="w-full bg-white text-[#1e4620] border-2 border-dashed border-[#1e4620]/20 p-5 rounded-2xl shadow-sm flex items-center justify-center gap-3 hover:bg-[#1e4620]/5 transition-all group">
                                    <Plus className="w-5 h-5"/> <span className="font-bold">Registrar Nuevo Pedido</span>
                                </button>
                                
                                <div>
                                    <h3 className="font-serif font-bold text-[#1e4620] text-lg mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-[#d97706]"/> Pedidos por Llegar (Recepción)</h3>
                                    {pendingArrivals.length === 0 ? (
                                        <div className="text-center py-12 text-stone-400 italic bg-white/50 rounded-2xl border-2 border-dashed border-stone-100">No hay pedidos pendientes de llegada.</div>
                                    ) : (
                                        <div className="space-y-4">
                                            {pendingArrivals.map(order => (
                                                <div key={order.id} onClick={() => startCheckIn(order)} className="bg-white border-l-4 border-l-[#d97706] p-5 rounded-2xl shadow-sm cursor-pointer hover:shadow-md transition-all">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">{order.clientId === 'Para Inversión' ? 'Inversión' : order.clientId}</div>
                                                            <div className="font-bold text-xl text-[#1e4620]">${formatMoney(order.total)}</div>
                                                        </div>
                                                        <div className="bg-[#fdfbf7] px-3 py-1 rounded-lg text-xs font-bold text-[#1e4620] border border-[#1e4620]/10">#{order.displayId}</div>
                                                    </div>
                                                    <div className="text-xs text-stone-500 flex gap-4">
                                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {formatDateSimple(order.date.seconds)}</span>
                                                        <span className="flex items-center gap-1"><Box className="w-3 h-3"/> {(order.items || []).length} prod.</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="flex flex-col h-full relative animate-in slide-in-from-right duration-200">
                                    <div className="p-4 bg-white border-b border-[#e5e7eb] relative space-y-3 shadow-sm z-10">
                                        <div className="bg-purple-50 border border-purple-100 text-purple-900 px-4 py-3 rounded-xl text-sm font-bold flex justify-between items-center shadow-inner">
                                            <span>Creando Pedido de Abastecimiento</span>
                                            <button onClick={() => { clearCart(); setOrderSource(null); }} className="text-xs underline opacity-70 hover:opacity-100">Cancelar</button>
                                        </div>
                                        <div className="relative">
                                            <Search className="absolute left-4 top-3.5 w-5 h-5 text-stone-400"/>
                                            <input className="w-full pl-12 pr-4 py-3 bg-[#fdfbf7] border border-stone-200 rounded-2xl text-sm focus:outline-none focus:border-[#d97706] transition-colors" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 bg-[#fdfbf7] pb-48">
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                            {filteredProducts.map(p => (
                                                <button key={p.id} onClick={() => addToCart(p)} className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden flex flex-col group hover:shadow-lg hover:border-[#d97706]/30 transition-all h-full text-left relative">
                                                    <div className="aspect-square w-full relative bg-[#fdfbf7]">
                                                        {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <Leaf className="w-full h-full p-8 text-[#d4dcd6]" />}
                                                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"><Plus className="w-4 h-4 text-[#1e4620]"/></div>
                                                    </div>
                                                    <div className="p-3 flex flex-col flex-1 justify-between w-full">
                                                        <span className="font-bold text-sm line-clamp-2 leading-snug text-[#1e4620]">{p.name}</span>
                                                        <div className="mt-2 flex justify-between items-end w-full">
                                                            <span className="text-stone-400 text-[10px] font-bold uppercase tracking-wider">Stock: {p.stock}</span>
                                                            <span className="text-[#d97706] font-bold text-sm">${formatMoney(p.price)}</span>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="fixed bottom-[70px] md:bottom-0 md:left-64 right-0 z-20 flex flex-col shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
                                        <div className="rounded-t-3xl border-t border-[#e5e7eb] p-5 bg-white/95 backdrop-blur-md">
                                            <div className="max-h-48 overflow-y-auto mb-3 space-y-3 pr-2 custom-scrollbar">
                                                {cart.map(item => {
                                                    const prod = products.find(p => p.id === item.id);
                                                    const brand = prod?.brand || 'Natura';
                                                    const activeCycle = cycles.find(c => c.status === 'open' && c.brand === brand);
                                                    return (
                                                        <div key={item.id} className="flex flex-col gap-2 border-b border-stone-100 pb-3 last:border-0">
                                                            <div className="flex justify-between items-center">
                                                                <div className="flex-1">
                                                                    <div className="text-xs font-bold text-[#1e4620] line-clamp-1">{item.name}</div>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <div className="flex items-center bg-stone-100 rounded-lg h-6"><button onClick={() => updateQty(item.id, -1)} className="px-2"><Minus className="w-3 h-3"/></button><span className="text-xs font-bold w-4 text-center">{item.qty}</span><button onClick={() => updateQty(item.id, 1)} className="px-2"><Plus className="w-3 h-3"/></button></div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col items-end gap-1 w-24">
                                                                    <button onClick={() => removeFromCart(item.id)} className="text-stone-300 hover:text-red-400"><X className="w-3 h-3"/></button>
                                                                    <MoneyInput className="w-full text-right text-xs font-bold border-b border-stone-200 focus:border-[#d97706] outline-none bg-transparent" value={item.transactionPrice === 0 ? '' : item.transactionPrice} placeholder="Costo" onChange={val => updateTransactionPrice(item.id, val || 0)} />
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button onClick={() => updateItemOrigin(item.id, 'cycle')} disabled={!activeCycle} className={`flex-1 py-1 text-[10px] font-bold rounded border transition-all ${item.orderType === 'cycle' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-white text-stone-400 border-stone-100'} ${!activeCycle ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                                    {activeCycle ? `Ciclo (${activeCycle.name})` : 'Sin Ciclo Abierto'}
                                                                </button>
                                                                <button onClick={() => updateItemOrigin(item.id, 'web')} className={`flex-1 py-1 text-[10px] font-bold rounded border transition-all ${item.orderType === 'web' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-stone-400 border-stone-100'}`}>Web (Express)</button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <button onClick={handleCreateSupplyOrder} className="w-full py-4 bg-[#1e4620] text-white rounded-2xl font-bold shadow-xl flex justify-between px-6 text-lg"><span>Confirmar Abastecimiento</span><span>${formatMoney(cartTotal)}</span></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {purchasesSubView === 'history' && (
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-24">
                        <h3 className="font-serif font-bold text-[#1e4620] text-xl mb-2">Historial de Stock</h3>
                        {purchaseHistoryData.length === 0 ? <div className="text-center text-stone-400">Sin historial.</div> : purchaseHistoryData.map(h => (
                            <div key={h.id} className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-[#1e4620]">{h.clientId}</div>
                                    <div className="text-xs text-stone-400">{formatDateSimple(h.date.seconds)}</div>
                                </div>
                                <div className="text-right font-bold text-[#1e4620]">${formatMoney(h.total)}</div>
                            </div>
                        ))}
                    </div>
                )}

                {purchasesSubView === 'catalog' && (
                     <div className="p-6 overflow-y-auto pb-24 flex-1 bg-[#fdfbf7]">
                        <div className="flex justify-between mb-6 gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-3.5 w-5 h-5 text-stone-400"/>
                                <input className="w-full pl-12 pr-4 py-3 bg-white border border-stone-200 rounded-2xl text-sm focus:outline-none focus:border-[#d97706]" placeholder="Buscar en inventario..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                            </div>
                            <button onClick={() => setIsCategoryModalOpen(true)} className="p-3 bg-white border border-stone-200 rounded-2xl text-[#1e4620] hover:bg-[#1e4620] hover:text-white transition-colors shadow-sm"><Tag className="w-5 h-5"/></button>
                            <button onClick={() => setShowCatalogModal(true)} className="p-3 bg-[#d97706] text-white rounded-2xl shadow-md hover:bg-[#b45309] transition-colors"><Share2 className="w-5 h-5"/></button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {filteredProducts.map(p => (
                                <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden flex flex-col group hover:shadow-lg transition-all duration-300">
                                    <div className="aspect-square w-full relative bg-[#fdfbf7]">
                                        {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <Leaf className="w-full h-full p-8 text-[#d4dcd6]" />}
                                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold text-[#1e4620] shadow-sm">Stock: {p.stock}</div>
                                    </div>
                                    <div className="p-3 flex flex-col flex-1 justify-between">
                                        <span className="font-bold text-sm line-clamp-2 leading-snug text-[#1e4620] mb-2">{p.name}</span>
                                        <div>
                                            <div className="text-[#d97706] font-bold text-lg mb-3">${formatMoney(p.price)}</div>
                                            <div className="flex gap-2 pt-3 border-t border-stone-100">
                                                <button onClick={() => { setViewingHistoryProduct(p); setIsHistoryModalOpen(true); loadProductHistory(p.id); }} className="flex-1 p-2 bg-purple-50 text-purple-600 rounded-xl flex justify-center hover:bg-purple-100 transition-colors"><ScrollText className="w-4 h-4"/></button>
                                                <button onClick={() => { setEditingProduct(p); setProductPriceInput(p.price); setIsProductModalOpen(true); }} className="flex-1 p-2 bg-blue-50 text-blue-600 rounded-xl flex justify-center hover:bg-blue-100 transition-colors"><Pencil className="w-4 h-4"/></button>
                                                <button onClick={() => handleDeleteProduct(p.id)} className="flex-1 p-2 bg-red-50 text-red-600 rounded-xl flex justify-center hover:bg-red-100 transition-colors"><Trash2 className="w-4 h-4"/></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}

      </main>
      
      {/* --- MODALS & FOOTER --- */}
      
      {receiptDetails && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95">
                  <div className="p-6 border-b border-[#e5e7eb] flex justify-between items-start bg-[#fdfbf7] rounded-t-3xl">
                      <div>
                          <h2 className="font-serif font-bold text-2xl text-[#1e4620]">{getClientName(receiptDetails.clientId)}</h2>
                          <div className="text-xs text-stone-500 mt-1 flex gap-2">
                              <span>#{receiptDetails.displayId}</span>
                              <span>•</span>
                              <span>{formatDateSimple(receiptDetails.date.seconds)}</span>
                          </div>
                          <div className={`mt-2 text-[10px] px-2 py-0.5 rounded font-bold uppercase inline-block ${getOrderTag(receiptDetails).color}`}>{getOrderTag(receiptDetails).label}</div>
                      </div>
                      <button onClick={() => setReceiptDetails(null)} className="p-2 bg-white border border-stone-200 rounded-full hover:bg-stone-100"><X className="w-5 h-5 text-stone-500"/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6">
                      <div className="space-y-4">
                          {(receiptDetails.items || []).map((item, i) => (
                              <div key={i} className="flex justify-between items-center border-b border-stone-100 pb-3 last:border-0">
                                  <div className="flex items-center gap-3">
                                      <div className="bg-stone-100 w-8 h-8 rounded-lg flex items-center justify-center text-stone-500 text-xs font-bold">{item.qty}x</div>
                                      <div>
                                          <div className="text-sm font-bold text-[#1e4620] line-clamp-2">{item.name}</div>
                                          <div className="text-[10px] text-stone-400">
                                              {item.status === 'delivered' && <span className="text-green-600 font-bold">Entregado</span>}
                                              {item.status === 'reserved' && <span className="text-blue-600 font-bold">En Stock (Reservado)</span>}
                                              {item.status === 'pending' && <span className="text-amber-600 font-bold">Pendiente</span>}
                                          </div>
                                      </div>
                                  </div>
                                  <div className="font-bold text-stone-700">${formatMoney(item.transactionPrice * item.qty)}</div>
                              </div>
                          ))}
                      </div>
                  </div>
                  <div className="p-6 bg-[#fdfbf7] rounded-b-3xl border-t border-[#e5e7eb]">
                      <div className="flex justify-between items-center mb-2">
                          <span className="text-stone-500 text-sm font-bold">Total Venta</span>
                          <span className="text-2xl font-black text-[#1e4620]">${formatMoney(receiptDetails.total)}</span>
                      </div>
                      {receiptDetails.margin > 0 && (
                          <div className="flex justify-between items-center text-xs">
                              <span className="text-stone-400 font-bold uppercase">Ganancia Est.</span>
                              <span className="text-green-600 font-bold">+${formatMoney(receiptDetails.margin)} ({Math.round(receiptDetails.marginPercent)}%)</span>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {isCycleModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="font-serif font-bold text-2xl text-[#1e4620]">Nuevo Ciclo</h2>
                      <button onClick={() => setIsCycleModalOpen(false)} className="p-2 bg-stone-100 rounded-full hover:bg-stone-200"><X className="w-5 h-5 text-stone-500"/></button>
                  </div>
                  <form onSubmit={handleSaveCycle}>
                      <label className="block text-xs font-bold text-stone-400 uppercase mb-2">Marca</label>
                      <select name="brand" required className="w-full p-4 bg-[#fdfbf7] border border-stone-200 rounded-xl mb-4 font-bold text-[#1e4620] outline-none focus:border-[#1e4620]">
                          {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                      <label className="block text-xs font-bold text-stone-400 uppercase mb-2">Nombre</label>
                      <input name="name" required className="w-full p-4 bg-[#fdfbf7] border border-stone-200 rounded-xl mb-4 font-bold text-[#1e4620] outline-none focus:border-[#1e4620]" placeholder="Ej: Ciclo 14"/>
                      <label className="block text-xs font-bold text-stone-400 uppercase mb-2">Meta Puntos</label>
                      <input name="goal" type="number" required className="w-full p-4 bg-[#fdfbf7] border border-stone-200 rounded-xl mb-4 font-bold text-[#1e4620] outline-none focus:border-[#1e4620]" placeholder="500"/>
                      <label className="block text-xs font-bold text-stone-400 uppercase mb-2">Cierre</label>
                      <input name="closingDate" type="date" required className="w-full p-4 bg-[#fdfbf7] border border-stone-200 rounded-xl mb-8 font-bold text-[#1e4620] outline-none focus:border-[#1e4620]" />
                      <button className="w-full py-4 bg-[#1e4620] text-white rounded-2xl font-bold shadow-lg hover:bg-[#153316]">Crear Ciclo</button>
                  </form>
              </div>
          </div>
      )}

      {isCheckoutModalOpen && (
          <div className="fixed inset-0 bg-[#1e4620]/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden scale-100">
                  <div className="px-6 py-5 border-b border-[#e5e7eb] flex justify-between items-center bg-white z-10">
                      <div><h2 className="font-serif font-bold text-2xl text-[#1e4620]">Finalizar Pedido</h2></div>
                      <button onClick={() => setIsCheckoutModalOpen(false)} className="p-2 bg-stone-100 hover:bg-stone-200 rounded-full"><X className="w-5 h-5 text-stone-500"/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#fdfbf7]">
                      <div>
                          <div className="flex items-center justify-between mb-3">
                              <h3 className="font-bold text-stone-400 text-xs uppercase tracking-wider">Cliente</h3>
                              <button onClick={() => { setEditingClient(null); setIsClientModalOpen(true); }} className="text-xs bg-[#1e4620] text-white px-3 py-1 rounded-lg font-bold hover:bg-[#153316]">+ Nuevo</button>
                          </div>
                          <div className="relative" ref={clientInputRef}>
                              <div className="relative">
                                  <UserPlus className="absolute left-4 top-3.5 w-5 h-5 text-stone-400"/>
                                  <input className="w-full pl-12 pr-4 py-4 bg-white border border-stone-200 rounded-2xl font-bold text-[#1e4620] focus:border-[#d97706] outline-none shadow-sm" placeholder="Buscar cliente..." value={clientSearchTerm} onChange={e => { setClientSearchTerm(e.target.value); setShowClientOptions(true); }} onFocus={() => setShowClientOptions(true)}/>
                                  {selectedClient && <div className="absolute right-3 top-3 bottom-3 flex items-center"><span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> OK</span></div>}
                              </div>
                              {showClientOptions && (
                                  <div className="absolute top-full left-0 w-full bg-white border border-stone-100 rounded-2xl shadow-xl max-h-48 overflow-y-auto z-20 mt-2 p-2">
                                      {filteredClientsForSearch.map(c => (
                                          <div key={c.id} className="p-3 hover:bg-[#fdfbf7] cursor-pointer rounded-xl transition-colors flex justify-between items-center group" onClick={() => { setSelectedClient(c.id); setClientSearchTerm(c.name); setShowClientOptions(false); }}>
                                              <div><div className="font-bold text-[#1e4620]">{c.name}</div><div className="text-xs text-stone-400">{c.phone}</div></div>
                                              <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-[#1e4620]"/>
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </div>
                      </div>
                      <div className={!selectedClient ? 'opacity-50 pointer-events-none grayscale' : ''}>
                          <h3 className="font-bold text-stone-400 text-xs uppercase tracking-wider mb-3">Disponibilidad</h3>
                          <div className={`p-5 rounded-2xl border transition-all ${stockAnalysis.canDeliverAll ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                              <div className="flex items-center gap-4"><div className={`p-3 rounded-xl ${stockAnalysis.canDeliverAll ? 'bg-white text-emerald-600' : 'bg-white text-amber-600'}`}>{stockAnalysis.canDeliverAll ? <PackageCheck className="w-6 h-6"/> : <Clock className="w-6 h-6"/>}</div><div><h4 className={`font-bold ${stockAnalysis.canDeliverAll ? 'text-emerald-800' : 'text-amber-800'}`}>{stockAnalysis.canDeliverAll ? 'Todo en Stock' : 'Faltan Productos'}</h4><p className="text-xs text-stone-500">{stockAnalysis.canDeliverAll ? 'Entrega inmediata.' : 'Se generará pedido pendiente.'}</p></div></div>
                              {!stockAnalysis.canDeliverAll && <div className="mt-4 space-y-2">{stockAnalysis.missing.map(i => <div key={i.id} className="flex justify-between items-center bg-white/60 p-2 rounded-lg border border-amber-100"><span className="text-xs font-bold text-[#1e4620] truncate max-w-[50%]">{i.name}</span><span className="text-[10px] font-bold bg-stone-100 text-stone-500 px-2 py-1 rounded">Por Encargar</span></div>)}</div>}
                          </div>
                      </div>
                      <div className={!selectedClient ? 'opacity-50 pointer-events-none grayscale' : ''}>
                          <h3 className="font-bold text-stone-400 text-xs uppercase tracking-wider mb-3">Plan de Pago</h3>
                          <div className="flex p-1 bg-stone-200 rounded-xl mb-4"><button onClick={() => setPaymentPlanType('full')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${paymentPlanType === 'full' ? 'bg-white shadow-sm text-[#1e4620]' : 'text-stone-500'}`}>Completo</button><button onClick={() => setPaymentPlanType('installments')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${paymentPlanType === 'installments' ? 'bg-white shadow-sm text-[#1e4620]' : 'text-stone-500'}`}>Cuotas</button></div>
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
                  <div className="p-6 border-t border-[#e5e7eb] bg-white z-10">
                      <button onClick={handleConfirmCheckout} className="w-full py-4 bg-[#1e4620] text-white rounded-2xl font-bold text-lg shadow-xl hover:bg-[#153316] transition-all flex justify-between px-8 items-center"><span>Confirmar Pedido</span><span>${formatMoney(cartTotal)}</span></button>
                  </div>
              </div>
          </div>
      )}

      {paymentModalOpen && selectedPaymentTx && (
          <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
                  <div className="p-6 bg-[#1e4620] text-white relative overflow-hidden">
                      <div className="relative z-10"><h2 className="font-serif font-bold text-2xl">Registrar Pago</h2><p className="opacity-80 text-sm mt-1">{getClientName(selectedPaymentTx.clientId)}</p></div>
                      <DollarSign className="absolute -right-4 -bottom-8 w-32 h-32 text-white/10 rotate-12"/>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 bg-[#fdfbf7]">
                      <div className="space-y-3 mb-6">
                          {(selectedPaymentTx.paymentSchedule || []).map((item, idx) => {
                              const paidSoFar = item.paidAmount || 0; const isFullyPaid = paidSoFar >= item.amount;
                              return <div key={idx} onClick={() => { if (isFullyPaid) return; setSelectedPaymentIndex(idx); setPaymentAmountInput(item.amount - paidSoFar); }} className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isFullyPaid ? 'bg-emerald-50 border-emerald-100 opacity-60' : selectedPaymentIndex === idx ? 'bg-white border-[#1e4620] ring-2 ring-[#1e4620]/20' : 'bg-white border-stone-200'}`}><div className="flex justify-between items-center"><span className="font-bold text-sm text-[#1e4620]">{item.type === 'cuota' ? `Cuota ${item.number}` : 'Saldo'}</span><span className="font-black text-[#1e4620]">${formatMoney(item.amount)}</span></div></div>
                          })}
                      </div>
                      {selectedPaymentIndex !== null && (
                          <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 animate-in slide-in-from-bottom-2">
                              <label className="block text-xs font-bold text-stone-400 uppercase mb-2">Monto</label>
                              <MoneyInput className="w-full text-center text-3xl font-black text-[#1e4620] border-b-2 border-stone-200 focus:border-[#d97706] outline-none pb-2 bg-transparent" value={paymentAmountInput} onChange={setPaymentAmountInput} placeholder="$0" autoFocus />
                              <div className="flex gap-2 mt-4"><button onClick={() => setPaymentMethod('Efectivo')} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${paymentMethod === 'Efectivo' ? 'bg-[#1e4620] text-white border-[#1e4620]' : 'bg-stone-50 text-stone-500'}`}>Efectivo</button><button onClick={() => setPaymentMethod('Transferencia')} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${paymentMethod === 'Transferencia' ? 'bg-[#1e4620] text-white border-[#1e4620]' : 'bg-stone-50 text-stone-500'}`}>Transf.</button></div>
                          </div>
                      )}
                  </div>
                  <div className="p-6 bg-white border-t border-[#e5e7eb]">
                      {selectedPaymentIndex !== null ? <button onClick={handleRegisterPayment} className="w-full py-3 bg-[#1e4620] text-white rounded-xl font-bold shadow-lg">Confirmar Pago</button> : <button onClick={() => setPaymentModalOpen(false)} className="w-full py-3 text-stone-400 font-bold">Cancelar</button>}
                  </div>
              </div>
          </div>
      )}

      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <h2 className="text-2xl font-serif font-bold mb-6 text-[#1e4620]">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="border-2 border-dashed border-[#1e4620]/30 rounded-2xl p-6 text-center relative hover:bg-[#fdfbf7] transition-colors group">
                  <input type="file" name="image" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required={!editingProduct?.imageUrl}/>
                  <div className="flex flex-col items-center gap-2 pointer-events-none">
                      <ImageIcon className="w-10 h-10 text-[#d97706]"/>
                      <span className="text-sm font-bold text-[#1e4620]">{editingProduct?.imageUrl ? "Cambiar Imagen" : "Subir Imagen"}</span>
                  </div>
              </div>
              <input name="name" required placeholder="Nombre del Producto" defaultValue={editingProduct?.name} className="w-full p-4 bg-[#fdfbf7] border border-stone-200 rounded-xl font-bold text-[#1e4620] outline-none focus:border-[#d97706]" />
              <div className="flex gap-3">
                  <select name="brand" required defaultValue={editingProduct?.brand} className="flex-1 p-4 bg-[#fdfbf7] border border-stone-200 rounded-xl font-bold text-[#1e4620] outline-none"><option value="">Marca</option>{BRANDS.map(b => <option key={b} value={b}>{b}</option>)}</select>
                  <select name="category" required defaultValue={editingProduct?.category} className="flex-1 p-4 bg-[#fdfbf7] border border-stone-200 rounded-xl font-bold text-[#1e4620] outline-none"><option value="">Categoría</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              </div>
              <div className="flex gap-3">
                  <div className="flex-1 relative"><span className="absolute left-4 top-4 text-[#1e4620] font-bold">$</span><MoneyInput className="w-full pl-8 p-4 bg-[#fdfbf7] border border-stone-200 rounded-xl font-bold text-[#1e4620] outline-none focus:border-[#d97706]" value={productPriceInput} onChange={setProductPriceInput} placeholder="Precio"/></div>
                  <input name="points" type="number" placeholder="Puntos" defaultValue={editingProduct?.points} className="w-1/3 p-4 bg-[#fdfbf7] border border-stone-200 rounded-xl font-bold text-[#1e4620] outline-none focus:border-[#d97706]" />
              </div>
              <div className="flex gap-3 mt-4">
                  <button type="button" onClick={() => setIsProductModalOpen(false)} className="flex-1 py-4 bg-stone-100 text-stone-500 rounded-xl font-bold">Cancelar</button>
                  <button className="flex-1 py-4 bg-[#1e4620] text-white rounded-xl font-bold shadow-lg hover:bg-[#153316]">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isClientModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <h2 className="text-2xl font-serif font-bold mb-6 text-[#1e4620]">{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
            <form onSubmit={handleSaveClient} className="space-y-4">
              <input name="name" required placeholder="Nombre Completo" defaultValue={editingClient?.name} className="w-full p-4 bg-[#fdfbf7] border border-stone-200 rounded-xl font-bold text-[#1e4620] outline-none focus:border-[#d97706]" />
              <input name="phone" placeholder="Teléfono" defaultValue={editingClient?.phone} className="w-full p-4 bg-[#fdfbf7] border border-stone-200 rounded-xl font-bold text-[#1e4620] outline-none focus:border-[#d97706]" />
              <input name="email" placeholder="Email (Opcional)" defaultValue={editingClient?.email} className="w-full p-4 bg-[#fdfbf7] border border-stone-200 rounded-xl font-bold text-[#1e4620] outline-none focus:border-[#d97706]" />
              <input name="department" placeholder="Dirección/Depto" defaultValue={editingClient?.department} className="w-full p-4 bg-[#fdfbf7] border border-stone-200 rounded-xl font-bold text-[#1e4620] outline-none focus:border-[#d97706]" />
              <div className="flex gap-3 mt-4">
                  <button type="button" onClick={() => setIsClientModalOpen(false)} className="flex-1 py-4 bg-stone-100 text-stone-500 rounded-xl font-bold">Cancelar</button>
                  <button className="flex-1 py-4 bg-[#1e4620] text-white rounded-xl font-bold shadow-lg hover:bg-[#153316]">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCategoryModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-3xl w-full max-w-sm flex flex-col max-h-[80vh] shadow-2xl">
                  <h2 className="font-serif font-bold text-xl mb-4 text-[#1e4620]">Categorías</h2>
                  <form onSubmit={e => { e.preventDefault(); simpleSave('categories', {name: new FormData(e.currentTarget).get('name')}, () => {}); e.target.reset(); }} className="mb-4 flex gap-2">
                      <input name="name" required className="flex-1 p-3 bg-[#fdfbf7] border border-stone-200 rounded-xl font-bold outline-none focus:border-[#d97706]" placeholder="Nueva..."/>
                      <button className="p-3 bg-[#1e4620] text-white rounded-xl"><Plus/></button>
                  </form>
                  <div className="flex-1 overflow-y-auto space-y-2">
                      {categories.map(cat => (
                          <div key={cat.id} className="flex justify-between items-center p-3 bg-[#fdfbf7] rounded-xl border border-stone-100">
                              <span className="font-bold text-[#1e4620]">{cat.name}</span>
                              <button onClick={() => handleDeleteCategory(cat.id)} className="text-stone-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                          </div>
                      ))}
                  </div>
                  <button onClick={() => setIsCategoryModalOpen(false)} className="w-full mt-4 py-3 bg-stone-100 text-stone-500 rounded-xl font-bold">Cerrar</button>
              </div>
          </div>
      )}

      {isHistoryModalOpen && viewingHistoryProduct && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
                  <div className="p-6 border-b border-[#e5e7eb] flex justify-between items-center">
                      <div><h2 className="font-serif font-bold text-xl text-[#1e4620]">{viewingHistoryProduct.name}</h2><p className="text-xs text-stone-500">Historial de movimientos</p></div>
                      <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 bg-stone-100 rounded-full"><X className="w-5 h-5 text-stone-500"/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-[#fdfbf7]">
                      {loadingHistory ? <div className="text-center p-4"><Loader2 className="w-8 h-8 text-[#d97706] animate-spin mx-auto"/></div> : productHistory.length === 0 ? <div className="text-center text-stone-400 py-4">Sin movimientos</div> : productHistory.map((h, i) => (
                          <div key={i} className={`p-4 rounded-xl border-l-4 shadow-sm bg-white ${h.type === 'IN' ? 'border-green-500' : 'border-red-500'}`}>
                              <div className="flex justify-between mb-1"><span className="font-bold text-[#1e4620]">{h.type === 'IN' ? 'Entrada (Stock)' : 'Salida (Venta)'}</span><span className="text-xs text-stone-400">{formatDateSimple(h.date/1000)}</span></div>
                              <div className="flex justify-between items-end"><span className="text-sm text-stone-500">{h.ref}</span><span className={`font-black text-lg ${h.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>{h.type === 'IN' ? '+' : '-'}{h.qty}</span></div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {showCatalogModal && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl">
                  <h2 className="font-serif font-bold text-xl mb-4 text-[#1e4620]">Enviar Catálogo</h2>
                  <div className="space-y-2">
                      <button onClick={() => handleSendCatalog('ALL')} className="w-full p-4 bg-[#1e4620] text-white rounded-xl font-bold text-left hover:bg-[#153316] transition-colors">Todo el Stock</button>
                      {categories.map(c => <button key={c.id} onClick={() => handleSendCatalog(c.id)} className="w-full p-3 bg-white border border-stone-200 rounded-xl text-left font-bold text-[#1e4620] hover:bg-[#fdfbf7]">{c.name}</button>)}
                  </div>
                  <button onClick={() => setShowCatalogModal(false)} className="w-full mt-4 py-3 bg-stone-100 text-stone-500 rounded-xl font-bold">Cancelar</button>
              </div>
          </div>
      )}

      {isDeliveryModalOpen && deliveryTransaction && (
        <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl">
                <h2 className="font-serif font-bold text-2xl text-center mb-2 text-[#1e4620]">Preparar Entrega</h2>
                <div className="text-4xl font-black text-center mb-8 text-[#d97706]">${formatMoney(deliveryTransaction.total)}</div>
                <label className="text-xs font-bold text-stone-400 uppercase block mb-3">¿Quién entrega?</label>
                <div className="space-y-3 mb-8">
                    {COURIERS.map(courier => (
                        <button key={courier} onClick={() => setSelectedCourier(courier)} className={`w-full p-4 rounded-xl font-bold text-left flex items-center gap-3 border-2 transition-all ${selectedCourier === courier ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-stone-100 bg-white text-stone-600'}`}>
                            {courier === 'Yo (Directo)' ? <CheckCircle2 className="w-5 h-5"/> : <Bike className="w-5 h-5"/>}{courier}
                        </button>
                    ))}
                </div>
                <button onClick={startDeliveryProcess} className={`w-full py-4 text-white font-bold rounded-2xl shadow-lg transition-all ${selectedCourier === 'Yo (Directo)' ? 'bg-green-600 hover:bg-green-700' : 'bg-[#1e4620] hover:bg-[#153316]'}`}>{selectedCourier === 'Yo (Directo)' ? 'Despachar Ahora' : 'Enviar a Reparto'}</button>
                <button onClick={() => setIsDeliveryModalOpen(false)} className="w-full mt-3 py-3 text-stone-400 font-bold hover:text-stone-600">Cancelar</button>
            </div>
        </div>
      )}

      {confirmDeliveryModal.show && (
        <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl">
                <h2 className="font-serif font-bold text-xl text-center mb-4 text-[#1e4620]">Confirmar Fecha</h2>
                <input type="date" className="w-full p-4 bg-[#fdfbf7] border border-stone-200 rounded-xl font-bold text-[#1e4620] outline-none focus:border-[#d97706] mb-6" value={deliveryDateInput} onChange={(e) => setDeliveryDateInput(e.target.value)} />
                <div className="flex gap-3">
                    <button onClick={() => setConfirmDeliveryModal({ show: false, transaction: null })} className="flex-1 py-4 bg-stone-100 text-stone-500 rounded-xl font-bold">Cancelar</button>
                    <button onClick={processDeliveryConfirmation} className="flex-1 py-4 bg-[#1e4620] text-white rounded-xl font-bold shadow-lg hover:bg-[#153316]">Finalizar</button>
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

function NavButton({ icon, label, active, onClick }) {
    return <button onClick={onClick} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${active ? 'text-[#1e4620] bg-stone-50' : 'text-stone-400'}`}>{React.cloneElement(icon, { className: `w-6 h-6 ${active ? 'fill-current' : ''}` })}<span className="text-[10px] font-bold">{label}</span></button>
}
