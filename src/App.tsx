import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  TrendingUp, 
  Plus, 
  Minus, 
  Trash2, 
  Save, 
  Search, 
  Menu, 
  X, 
  ChevronRight, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  LogOut, 
  Truck, 
  History, 
  Receipt, 
  Eye, 
  UserPlus, 
  Calendar, 
  Filter, 
  Tag, 
  Briefcase, 
  ChevronLeft, 
  BarChart3, 
  Award, 
  PieChart, 
  Clock, 
  AlertCircle, 
  Check, 
  FileText, 
  Share2, 
  MessageCircle, 
  Smartphone, 
  AlertTriangle, 
  BookOpen, 
  CreditCard, 
  Banknote, 
  Pencil, 
  RefreshCw, 
  Image as ImageIcon, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  Leaf, 
  Globe, 
  FileType, 
  CalendarDays, 
  PackageCheck, 
  ScrollText, 
  Wallet, 
  TrendingDown, 
  Info, 
  CalendarX, 
  ShoppingBag, 
  Send, 
  Bike, 
  Undo2, 
  Loader2, 
  Box, 
  DollarSign, 
  Percent, 
  ChevronDown, 
  ExternalLink, 
  QrCode, 
  CreditCard as DebitCard,
  ToggleLeft, 
  ToggleRight, 
  ClipboardList, 
  Repeat, 
  Target, 
  ArrowRight, 
  StickyNote, 
  Globe2, 
  Lock, 
  Zap, 
  Layers,
  UserCircle
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  increment, 
  writeBatch, 
  getDocs, 
  where,
  getDoc 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken, signOut } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
  const letters = String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                  String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                  String.fromCharCode(65 + Math.floor(Math.random() * 26));
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
    
    return (
        <input
            type="text"
            inputMode="numeric"
            className={className}
            placeholder={placeholder}
            value={displayValue}
            onChange={handleChange}
            autoFocus={autoFocus}
            disabled={disabled}
        />
    );
};

export default function App() {

  const formatMoney = (amount) => {
    return (amount || 0).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const formatDateWithTime = (seconds) => {
      if (!seconds) return '-';
      const d = new Date(seconds * 1000);
      return d.toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatDateSimple = (seconds) => {
      if (!seconds) return '-';
      const d = new Date(seconds * 1000);
      return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const getStockStatus = (stock) => {
      if (stock === 0) return { color: 'bg-red-600 text-white', label: 'AGOTADO' };
      if (stock === 1) return { color: 'bg-red-100 text-red-700 border border-red-200', label: 'CRÍTICO' };
      if (stock > 1 && stock < 4) return { color: 'bg-orange-100 text-orange-800 border border-orange-200', label: 'BAJO' };
      return { color: 'bg-emerald-100 text-emerald-700 border border-emerald-200', label: 'BIEN' };
  };
    
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
  
  const [checkoutData, setCheckoutData] = useState({
      installmentsCount: 3,
      installmentDates: {}, 
  });

  const [paymentMethod, setPaymentMethod] = useState('Efectivo'); 
  const [editingTransactionId, setEditingTransactionId] = useState(null); 
    
  const [loading, setLoading] = useState(true); 
  const [searchTerm, setSearchTerm] = useState('');
  const [processingMsg, setProcessingMsg] = useState(''); 

  const [itemActions, setItemActions] = useState({});

  const [alertState, setAlertState] = useState({ show: false, title: '', message: '', type: 'info' }); 
  const [confirmationState, setConfirmationState] = useState({ show: false, title: '', message: '', type: 'neutral', onConfirm: null });
  
  const triggerAlert = (title, message, type = 'error') => {
      setAlertState({ show: true, title, message, type });
  };

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

  const cycleMap = useMemo(() => {
    return cycles.reduce((acc, c) => ({ ...acc, [c.id]: c.name }), {});
  }, [cycles]);

  const stockAnalysis = useMemo(() => {
    const available = [];
    const missing = [];
    let canDeliverAll = true;
    cart.forEach(item => {
        const prod = products.find(p => p.id === item.id);
        const currentStock = prod ? prod.stock : 0;
        if (currentStock >= item.qty) {
            available.push(item);
        } else {
            if (currentStock > 0) {
                 available.push({ ...item, qty: currentStock });
                 missing.push({ ...item, qty: item.qty - currentStock, currentStock: 0 });
            } else {
                 missing.push({ ...item, currentStock });
            }
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

      if ((isCycle && isExpress) || ((isCycle || isExpress) && (isStock || isReserved))) {
          return { label: 'Mixto', color: 'bg-indigo-100 text-indigo-700', icon: Layers };
      }
      if (isExpress) return { label: 'Pedido Express', color: 'bg-amber-100 text-amber-700', icon: Zap };
      if (isCycle) return { label: 'Pedido Ciclo', color: 'bg-purple-100 text-purple-700', icon: Repeat };
      if (isStock || isReserved) return { label: 'Entrega Inmediata', color: 'bg-emerald-100 text-emerald-700', icon: PackageCheck };
      
      return { label: 'Pendiente', color: 'bg-stone-100 text-stone-500', icon: Clock };
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        try {
            await signInAnonymously(auth);
        } catch (anonError) {
            console.error("Anonymous login failed:", anonError);
        }
      }
    };
    initAuth();

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
        setProcessingMsg('');
      } else {
        setLoading(true);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const basePath = `artifacts/${APP_ID}/public/data`;
    const unsubProducts = onSnapshot(collection(db, basePath, 'products'), (s) => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubClients = onSnapshot(collection(db, basePath, 'clients'), (s) => {
        const data = s.docs.map(d => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => a.name.localeCompare(b.name));
        setClients(data);
    });
    const unsubCategories = onSnapshot(collection(db, basePath, 'categories'), (s) => setCategories(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubSuppliers = onSnapshot(collection(db, basePath, 'suppliers'), (s) => setSuppliers(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const qTrans = query(collection(db, basePath, 'transactions'), orderBy('date', 'desc'), limit(200));
    const unsubTrans = onSnapshot(qTrans, (s) => setTransactions(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubCycles = onSnapshot(collection(db, basePath, 'cycles'), (s) => setCycles(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubBatches = onSnapshot(collection(db, basePath, 'inventory_batches'), (s) => {
        const data = s.docs.map(d => ({ id: d.id, ...d.data() }));
        setInventoryBatches(data);
    });
    return () => {
      unsubProducts(); unsubClients(); unsubCategories(); unsubSuppliers(); unsubTrans(); unsubCycles(); unsubBatches();
    };
  }, [user]);

  useEffect(() => {
      const handleClickOutside = (event) => {
          if (clientInputRef.current && !clientInputRef.current.contains(event.target)) {
              setShowClientOptions(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const calculatePaymentSchedule = (total, planType, data) => {
      let schedule = [];
      
      if (planType === 'full') {
          schedule.push({
              number: 1,
              date: null, 
              amount: total,
              status: 'pending',
              type: 'total'
          });
      } else if (planType === 'installments') {
          const count = Number(data.installmentsCount);
          const amountPerQuota = Math.round(total / count);
          
          for (let i = 0; i < count; i++) {
              const manualDate = data.installmentDates[i];
              const dateSecs = manualDate ? new Date(manualDate + 'T12:00:00').getTime() / 1000 : null;

              schedule.push({
                  number: i + 1,
                  date: dateSecs,
                  amount: amountPerQuota,
                  status: 'pending',
                  type: 'cuota'
              });
          }
      }
      return schedule;
  };

  const activeCycle = useMemo(() => {
      return cycles.find(c => c.status === 'open') || null;
  }, [cycles]);

  const handleConfirmCheckout = async () => {
    if (!selectedClient) { triggerAlert("Falta Cliente", "Selecciona un cliente.", "error"); return; }
    
    if (paymentPlanType === 'installments') {
        const count = Number(checkoutData.installmentsCount);
        for(let i=0; i<count; i++) {
            if (!checkoutData.installmentDates[i]) {
                triggerAlert("Faltan Fechas", `Ingresa la fecha para la cuota ${i+1}.`, "error");
                return;
            }
        }
    }

    setLoading(true);
    setProcessingMsg("Procesando Venta...");

    try {
        const batch = writeBatch(db);
        const newTransId = doc(collection(db, `artifacts/${APP_ID}/public/data/transactions`)).id;
        const displayId = generateShortId();
        const now = new Date();

        let transactionFIFO = 0;
        let finalItems = [];
        
        const isCompleteReady = stockAnalysis.missing.length === 0;
        const mainStatus = isCompleteReady ? 'pending_delivery' : 'pending_order';

        for (let item of stockAnalysis.available) {
             const { totalCost, batchUpdates, fifoDetails } = await calculateFIFOCost(item.id, item.qty);
             
             batchUpdates.forEach(u => batch.update(doc(db, `artifacts/${APP_ID}/public/data/inventory_batches`, u.id), { remainingQty: u.newRemainingQty }));
             batch.update(doc(db, `artifacts/${APP_ID}/public/data/products`, item.id), { stock: increment(-item.qty) });
             
             transactionFIFO += totalCost;
             finalItems.push({
                 ...item,
                 fifoTotalCost: totalCost,
                 fifoDetails: fifoDetails,
                 status: isCompleteReady ? 'delivered' : 'reserved' 
             });
        }

        const hasCycleItems = stockAnalysis.missing.some(i => (itemActions[i.id] || 'cycle') === 'cycle');
        if (hasCycleItems && !activeCycle) {
             triggerAlert("Sin Ciclo Activo", "Tienes productos marcados para Ciclo, pero no hay uno abierto.", "error");
             setLoading(false);
             return;
        }

        for (let item of stockAnalysis.missing) {
             const selectedType = itemActions[item.id] || 'cycle'; 
             finalItems.push({
                 ...item,
                 status: 'pending',
                 orderType: selectedType 
             });
        }

        const total = cart.reduce((acc, item) => acc + (item.transactionPrice * item.qty), 0);
        const totalPoints = cart.reduce((acc, item) => acc + ((item.points || 0) * item.qty), 0);
        
        const margin = total - transactionFIFO; 
        const paymentSchedule = calculatePaymentSchedule(total, paymentPlanType, checkoutData);
        
        const transactionData = {
            id: newTransId, 
            displayId: displayId,
            type: 'sale',
            items: finalItems,
            total: total,
            totalPoints: totalPoints,
            clientId: selectedClient,
            date: { seconds: now.getTime() / 1000 },
            paymentPlanType, 
            paymentSchedule, 
            balance: total, 
            paymentStatus: 'pending', 
            paymentMethod: null, 
            totalCost: transactionFIFO,
            margin: margin,
            marginPercent: (total > 0) ? (margin/total)*100 : 0,
            saleStatus: mainStatus, 
            origin: 'POS',
            cycleId: activeCycle ? activeCycle.id : null, 
            courier: null,
            deliveredAt: isCompleteReady ? { seconds: now.getTime() / 1000 } : null,
            finalizedAt: null 
        };

        batch.set(doc(db, `artifacts/${APP_ID}/public/data/transactions`, newTransId), transactionData);
        await batch.commit();
        
        clearCart();
        setIsCheckoutModalOpen(false);
        setCheckoutData({ installmentsCount: 3, installmentDates: {}, downPayment: '' }); 
        setItemActions({});

        triggerAlert("Éxito", "Venta registrada correctamente.", "success");

    } catch (error) {
        console.error(error);
        triggerAlert("Error", "No se pudo guardar.", "error");
    } finally {
        setLoading(false);
        setProcessingMsg('');
    }
  };

  const calculateFIFOCost = async (productId, qtyToSell) => {
    const batchesRef = collection(db, `artifacts/${APP_ID}/public/data/inventory_batches`);
    const q = query(batchesRef, where('productId', '==', productId));
    const snapshot = await getDocs(q);
    
    let batches = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
        .filter(b => b.remainingQty > 0)
        .sort((a, b) => (a.date?.seconds || 0) - (b.date?.seconds || 0));

    let remainingToSell = qtyToSell;
    let totalCost = 0;
    let batchUpdates = [];
    let fifoDetails = []; 

    for (const batch of batches) {
        if (remainingToSell <= 0) break;
        const takeFromBatch = Math.min(remainingToSell, batch.remainingQty);
        totalCost += (takeFromBatch * batch.cost);
        batchUpdates.push({
            id: batch.id,
            newRemainingQty: batch.remainingQty - takeFromBatch
        });
        fifoDetails.push({
            qty: takeFromBatch,
            cost: batch.cost,
            date: batch.date?.seconds || (Date.now() / 1000)
        });
        remainingToSell -= takeFromBatch;
    }

    if (remainingToSell > 0) {
        const fallbackCost = batches.length > 0 ? batches[batches.length - 1].cost : 0; 
        totalCost += (remainingToSell * fallbackCost);
        fifoDetails.push({
            qty: remainingToSell,
            cost: fallbackCost,
            date: null,
            note: 'Sin Lote'
        });
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
      if (!client || !client.phone) {
          triggerAlert("Sin teléfono", "El cliente no tiene número registrado.", "error");
          return;
      }
      let message = `Hola *${client.name}*! 👋\n\nTe cuento que ya tengo listos tus productos de Natura/Avon:\n`;
      (transaction.items || []).forEach(i => {
          if (i.status === 'delivered' || i.status === 'reserved') { 
               message += `- ${i.name} x${i.qty}\n`;
          }
      });
      message += `\nTotal: $${formatMoney(transaction.total)}\n\n¿Cuándo te acomoda que coordinemos la entrega?`;
      window.open(`https://wa.me/${client.phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const loadProductHistory = async (prodId) => {
    setLoadingHistory(true);
    setProductHistory([]);
    try {
      const history = [];
      const basePath = `artifacts/${APP_ID}/public/data`;
      const batchesQ = query(collection(db, basePath, 'inventory_batches'), where('productId', '==', prodId));
      const batchesSnap = await getDocs(batchesQ);
      batchesSnap.forEach(doc => {
          const d = doc.data();
          history.push({
              id: doc.id,
              type: 'IN',
              date: d.date?.seconds * 1000 || Date.now(),
              qty: d.initialQty,
              price: d.cost,
              ref: 'Recepción'
          });
      });
      transactions.forEach(t => {
          if (t.type === 'sale') { 
              const item = (t.items || []).find(i => i.id === prodId);
              if (item) {
                  history.push({
                      id: t.id,
                      type: 'OUT',
                      date: t.date?.seconds * 1000 || Date.now(),
                      qty: item.qty,
                      price: item.transactionPrice,
                      margin: (item.transactionPrice * item.qty) - (item.fifoTotalCost || 0),
                      ref: t.saleStatus === 'in_transit' ? 'En Reparto' : 'Venta',
                      fifoDetails: item.fifoDetails || []
                  });
              }
          }
      });
      history.sort((a, b) => b.date - a.date);
      setProductHistory(history);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
      setConfirmationState({
          show: true,
          title: "Eliminar Producto",
          message: "¿Estás seguro de que quieres eliminar este producto permanentemente?",
          type: "danger",
          onConfirm: async () => {
              setConfirmationState(prev => ({ ...prev, show: false })); 
              setLoading(true);
              setProcessingMsg("Eliminando...");
              try {
                  await deleteDoc(doc(db, `artifacts/${APP_ID}/public/data/products`, productId));
                  triggerAlert("Eliminado", "Producto eliminado correctamente", "success");
              } catch (error) {
                  triggerAlert("Error", "No se pudo eliminar el producto.", "error");
              } finally {
                  setLoading(false);
                  setProcessingMsg("");
              }
          }
      });
  }

  const handleVoidTransaction = async (transaction) => {
      if (!transaction || !transaction.id) return;
      
      let confirmTitle = "Eliminar Registro";
      let confirmMsg = `¿Eliminar registro de $${formatMoney(transaction.total)}?`;
      let type = "neutral";

      if (transaction.saleStatus === 'in_transit') {
          confirmTitle = "Devolución de Stock";
          confirmMsg = "IMPORTANTE: ¿El cliente NO retiró el pedido?\n\nAl eliminar este envío, el stock volverá a tu inventario automáticamente.";
          type = "danger";
      }

      setConfirmationState({
          show: true,
          title: confirmTitle,
          message: confirmMsg,
          type: type,
          onConfirm: async () => {
              setConfirmationState(prev => ({ ...prev, show: false }));
              setLoading(true);
              setProcessingMsg('Procesando...');
              try {
                  const batch = writeBatch(db);
                  batch.delete(doc(db, `artifacts/${APP_ID}/public/data/transactions`, transaction.id));
                  
                  if (transaction.saleStatus !== 'pending_order' && transaction.saleStatus !== 'pending_cycle') { 
                      (transaction.items || []).forEach(item => {
                          if (item.status === 'delivered' || item.status === 'reserved') {
                            const productRef = doc(db, `artifacts/${APP_ID}/public/data/products`, item.id);
                            batch.update(productRef, { stock: increment(item.qty) });
                          }
                      });
                  }
                  await batch.commit();
                  setReceiptDetails(null);
                  triggerAlert("Operación Exitosa", "Registro eliminado.", "success");
              } catch (error) {
                  console.error("Error voiding transaction:", error);
                  triggerAlert("Error", "No se pudo anular.", "error");
              } finally {
                  setLoading(false);
                  setProcessingMsg('');
              }
          }
      });
  };

  const handleDeliverOrder = (transaction) => {
      setReceiptDetails(null); 
      setDeliveryTransaction(transaction);
      setSelectedCourier('Yo (Directo)'); 
      setIsDeliveryModalOpen(true);
  };

  const startDeliveryProcess = async () => {
      if (!deliveryTransaction) return;

      if (selectedCourier === 'Yo (Directo)' && deliveryTransaction.paymentPlanType === 'full' && deliveryTransaction.balance > 0) {
          triggerAlert(
              "Pago Pendiente", 
              "⛔ No puedes entregar este pedido porque tiene deuda pendiente.\n\nPor favor ve a 'Deudores' y registra el pago completo antes de entregar.", 
              "error"
          );
          return;
      }

      setLoading(true);
      setProcessingMsg(selectedCourier === 'Yo (Directo)' ? "Cerrando Venta..." : "Enviando a Reparto...");
      
      try {
          const batch = writeBatch(db);
          
          let finalTotalCost = deliveryTransaction.totalCost || 0;
          const updatedItems = [];
          
          for (const item of (deliveryTransaction.items || [])) {
               if (item.status === 'pending') {
                   const { totalCost, batchUpdates, fifoDetails } = await calculateFIFOCost(item.id, item.qty);
                   finalTotalCost += totalCost;
                   updatedItems.push({
                       ...item,
                       status: 'delivered', 
                       fifoTotalCost: totalCost,
                       fifoDetails: fifoDetails
                   });
                   batchUpdates.forEach(u => batch.update(doc(db, `artifacts/${APP_ID}/public/data/inventory_batches`, u.id), { remainingQty: u.newRemainingQty }));
                   batch.update(doc(db, `artifacts/${APP_ID}/public/data/products`, item.id), { stock: increment(-item.qty) });
               } else if (item.status === 'reserved') {
                   updatedItems.push({ ...item, status: 'delivered' });
               } else {
                   updatedItems.push(item);
               }
          }
          
          const transRef = doc(db, `artifacts/${APP_ID}/public/data/transactions`, deliveryTransaction.id);
          const margin = deliveryTransaction.total - finalTotalCost;
          const nextStatus = selectedCourier === 'Yo (Directo)' ? 'completed' : 'in_transit';
          const now = new Date();

          batch.update(transRef, { 
              saleStatus: nextStatus, 
              courier: selectedCourier,
              deliveredAt: { seconds: now.getTime() / 1000 }, 
              finalizedAt: selectedCourier === 'Yo (Directo)' ? { seconds: now.getTime() / 1000 } : null,
              items: updatedItems,
              totalCost: finalTotalCost,
              margin: margin,
              marginPercent: deliveryTransaction.total > 0 ? (margin / deliveryTransaction.total) * 100 : 0
          });
          await batch.commit();
          setIsDeliveryModalOpen(false);
          setDeliveryTransaction(null);
          triggerAlert(nextStatus === 'completed' ? "Venta Cerrada" : "En Reparto", nextStatus === 'completed' ? "Entregado." : `Entregado a ${selectedCourier}.`, "success");
      } catch (error) {
          console.error(error);
          triggerAlert("Error", "Fallo proceso.", "error");
      } finally {
          setLoading(false);
          setProcessingMsg('');
      }
  };

  const handleConfirmDeliveryClick = (transaction) => {
      setConfirmDeliveryModal({ show: true, transaction: transaction });
      setDeliveryDateInput(new Date().toISOString().split('T')[0]); 
  };

  const processDeliveryConfirmation = async () => {
      const transaction = confirmDeliveryModal.transaction;
      if (!transaction || !transaction.id) return;
      
      if (transaction.paymentPlanType === 'full' && transaction.balance > 0) {
          setConfirmDeliveryModal({ show: false, transaction: null });
          triggerAlert(
              "Pago Pendiente", 
              "⛔ El pedido no está pagado.\n\nSi el repartidor trajo el dinero, regístralo primero en 'Deudores' antes de confirmar la entrega.", 
              "error"
          );
          return;
      }

      setConfirmDeliveryModal({ show: false, transaction: null }); 
      setLoading(true);
      setProcessingMsg("Finalizando Venta...");
      
      try {
          const selectedDate = new Date(deliveryDateInput + 'T12:00:00'); 
          
          await updateDoc(doc(db, `artifacts/${APP_ID}/public/data/transactions`, transaction.id), {
              saleStatus: 'completed',
              finalizedAt: { seconds: selectedDate.getTime() / 1000 }
          });
          triggerAlert("¡Listo!", "Venta finalizada con fecha seleccionada.", "success");
          setReceiptDetails(null);
      } catch (error) {
          console.error("Error finalizing transaction:", error);
          triggerAlert("Error", "No se pudo finalizar.", "error");
      } finally {
          setLoading(false);
          setProcessingMsg('');
      }
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) return prev.map(p => p.id === product.id ? { ...p, qty: p.qty + 1 } : p);
      return [...prev, { ...product, transactionPrice: view === 'purchases' ? 0 : product.price, qty: 1, expirationDate: '', points: product.points || 0, isMagazinePrice: false, originalPrice: product.price }];
    });
  };

  const toggleMagazinePrice = (id) => setCart(prev => prev.map(p => {
      if(p.id === id) {
          const newIsMagazine = !p.isMagazinePrice;
          return {
              ...p,
              isMagazinePrice: newIsMagazine,
              transactionPrice: newIsMagazine ? 0 : p.originalPrice 
          };
      }
      return p;
  }));

  const removeFromCart = (id) => setCart(prev => prev.filter(p => p.id !== id));
  const updateQty = (id, d) => setCart(prev => prev.map(p => {
      if (p.id === id) {
          const n = Math.max(1, p.qty + d);
          return { ...p, qty: n };
      }
      return p;
  }));
  const updateTransactionPrice = (id, p) => setCart(prev => prev.map(i => i.id === id ? { ...i, transactionPrice: p } : i));
  const updateCheckInDate = (tempId, date) => setCheckInItems(prev => prev.map(i => i._tempId === tempId ? { ...i, expirationDate: date } : i));

  const clearCart = () => { 
      setCart([]); setSelectedClient(''); setClientSearchTerm(''); setSelectedSupplier(''); 
      setPaymentMethod(''); setEditingTransactionId(null); 
      setOrderSource(null);
      setCatalogBrand(''); 
      setSelectedCycle(''); 
      setPaymentPlanType('full');
      setCheckoutData({ installmentsCount: 3, installmentDates: {} });
      setItemActions({});
  };
  const cartTotal = useMemo(() => cart.reduce((acc, item) => acc + (item.transactionPrice * item.qty), 0), [cart]);
  const cartPoints = useMemo(() => cart.reduce((acc, item) => acc + ((item.points || 0) * item.qty), 0), [cart]);

  const handleCreateOrder = async () => {
    if (cart.length === 0) { triggerAlert("Vacío", "Agrega productos.", "info"); return; }
    
    setLoading(true);
    setProcessingMsg('Creando Pedido...');

    try {
        const newTransId = doc(collection(db, `artifacts/${APP_ID}/public/data/transactions`)).id;
        const displayId = generateShortId();
        const now = new Date();

        await setDoc(doc(db, `artifacts/${APP_ID}/public/data/transactions`, newTransId), {
            id: newTransId,
            displayId: displayId, 
            type: 'order', 
            items: [...cart],
            total: cartTotal,
            totalPoints: cartPoints, 
            clientId: selectedSupplier || 'Stock Personal', 
            date: { seconds: now.getTime() / 1000 },
            saleStatus: 'pending_arrival', 
            installments: 1,
            orderType: orderSource || 'cycle_order', 
            cycleId: selectedCycle || null 
        });

        clearCart();
        setOrderSource(null);
        triggerAlert("Pedido Creado", "Agregado al Ciclo actual.", "success");

    } catch (error) {
        console.error(error);
        triggerAlert("Error", "No se pudo crear el pedido.", "error");
    } finally {
        setLoading(false);
        setProcessingMsg('');
    }
  };

  const startCheckIn = (transaction) => {
      const explodedItems = [];
      (transaction.items || []).forEach((item) => {
          for(let i=0; i < item.qty; i++) {
              explodedItems.push({
                  _tempId: `${item.id}_${i}_${Date.now()}`,
                  ...item,
                  uniqueQty: 1, 
                  expirationDate: '' 
              });
          }
      });
      setCheckInItems(explodedItems);
      setCheckInOrder(transaction);
  };

  const processPendingAllocations = async (arrivedProductIds) => {
      setProcessingMsg("Asignando stock a pedidos pendientes...");
      try {
          const salesRef = collection(db, `artifacts/${APP_ID}/public/data/transactions`);
          const q = query(salesRef, where('type', '==', 'sale'));
          const snapshot = await getDocs(q);
          
          const pendingSales = snapshot.docs
              .map(d => ({...d.data(), id: d.id}))
              .filter(t => ['pending_order', 'pending_cycle', 'pending_web', 'pending_arrival'].includes(t.saleStatus));

          if (pendingSales.length === 0) return;

          const batch = writeBatch(db);
          let updatesCount = 0;
          
          const productsRef = collection(db, `artifacts/${APP_ID}/public/data/products`);
          
          for (const sale of pendingSales) {
              let isSaleModified = false;
              let saleItems = [...sale.items];
              let allItemsReserved = true;

              for (let i = 0; i < saleItems.length; i++) {
                  const item = saleItems[i];
                  
                  if (item.status === 'pending' && arrivedProductIds.includes(item.id)) {
                      const { totalCost, batchUpdates, fifoDetails } = await calculateFIFOCost(item.id, item.qty);
                      
                      const allocatedQty = fifoDetails.filter(d => d.note !== 'Sin Lote').reduce((a, b) => a + b.qty, 0);
                      
                      if (allocatedQty >= item.qty) {
                          batchUpdates.forEach(u => batch.update(doc(db, `artifacts/${APP_ID}/public/data/inventory_batches`, u.id), { remainingQty: u.newRemainingQty }));
                          
                          batch.update(doc(db, `artifacts/${APP_ID}/public/data/products`, item.id), { stock: increment(-item.qty) });
                          
                          saleItems[i] = {
                              ...item,
                              status: 'reserved',
                              fifoTotalCost: totalCost,
                              fifoDetails: fifoDetails
                          };
                          isSaleModified = true;
                      } else {
                          allItemsReserved = false;
                      }
                  } else if (item.status === 'pending') {
                      allItemsReserved = false;
                  }
              }

              if (isSaleModified) {
                  const updates = { items: saleItems };
                  const newTotalCost = saleItems.reduce((acc, it) => acc + (it.fifoTotalCost || 0), 0);
                  updates.totalCost = newTotalCost;
                  updates.margin = sale.total - newTotalCost;
                  updates.marginPercent = sale.total > 0 ? (updates.margin / sale.total) * 100 : 0;

                  if (allItemsReserved) {
                      updates.saleStatus = 'pending_delivery';
                      updates.readyAt = { seconds: Date.now() / 1000 };
                  }
                  
                  batch.update(doc(db, `artifacts/${APP_ID}/public/data/transactions`, sale.id), updates);
                  updatesCount++;
              }
          }

          if (updatesCount > 0) {
              await batch.commit();
              triggerAlert("Pedidos Actualizados", `${updatesCount} pedidos ahora tienen stock asignado.`, "success");
          }

      } catch (e) {
          console.error("Error allocating stock:", e);
      }
  };

  const confirmCheckIn = async () => {
      if (checkInItems.some(i => !i.expirationDate)) {
          triggerAlert("Faltan Fechas", "Ingresa el vencimiento de CADA producto.", "error");
          return;
      }

      setLoading(true);
      setProcessingMsg('Ingresando Stock...');

      try {
          const batch = writeBatch(db);
          const isInvestment = checkInOrder.clientId === 'Para Inversión';
          const arrivedProductIds = [];

          checkInItems.forEach(item => {
              const batchRef = doc(collection(db, `artifacts/${APP_ID}/public/data/inventory_batches`));
              batch.set(batchRef, {
                  productId: item.id,
                  productName: item.name,
                  date: { seconds: Date.now() / 1000 },
                  cost: Number(item.transactionPrice),
                  initialQty: 1,
                  remainingQty: 1,
                  supplierId: checkInOrder.clientId,
                  expirationDate: item.expirationDate,
                  transactionId: checkInOrder.id
              });
              batch.update(doc(db, `artifacts/${APP_ID}/public/data/products`, item.id), { stock: increment(1) });
              if (!arrivedProductIds.includes(item.id)) arrivedProductIds.push(item.id);
          });

          const transRef = doc(db, `artifacts/${APP_ID}/public/data/transactions`, checkInOrder.id);
          batch.update(transRef, {
              type: isInvestment ? 'stock_entry' : 'purchase', 
              saleStatus: 'completed',
              checkInDate: { seconds: Date.now() / 1000 }
          });

          await batch.commit();
          setCheckInOrder(null);
          setCheckInItems([]);
          
          if (arrivedProductIds.length > 0) {
              await processPendingAllocations(arrivedProductIds);
          } else {
              triggerAlert("Stock Actualizado", "Productos ingresados correctamente.", "success");
          }

      } catch (error) {
          console.error(error);
          triggerAlert("Error", "Falló el ingreso.", "error");
      } finally {
          setLoading(false);
          setProcessingMsg('');
      }
  };

  const handleRegisterPayment = async () => {
      if(!selectedPaymentTx) return;
      const amount = parseInt(paymentAmountInput) || 0;
      if (amount <= 0) { triggerAlert("Monto Inválido", "Ingresa un monto mayor a 0", "error"); return; }
      
      setLoading(true);
      setProcessingMsg("Registrando Pago...");

      let receiptUrl = null;
      try {
          if (paymentReceiptFile) {
              const storageRef = ref(storage, `receipts/${Date.now()}_${paymentReceiptFile.name}`);
              const snap = await uploadBytes(storageRef, paymentReceiptFile);
              receiptUrl = await getDownloadURL(snap.ref);
          }
      } catch (e) {
          console.error("Error uploading receipt", e);
          triggerAlert("Error Comprobante", "No se pudo subir la imagen, pero se intentará registrar el pago.", "info");
      }

      try {
          const txRef = doc(db, `artifacts/${APP_ID}/public/data/transactions`, selectedPaymentTx.id);
          
          let updatedSchedule = [...selectedPaymentTx.paymentSchedule];
          let updatedBalance = selectedPaymentTx.balance;

          const newPaymentRecord = {
              amount: amount,
              date: Date.now() / 1000,
              method: paymentMethod || 'Efectivo',
              receiptUrl: receiptUrl,
              id: Date.now().toString() 
          };

          if (selectedPaymentIndex !== null) {
              const item = updatedSchedule[selectedPaymentIndex];
              const previousPaid = item.paidAmount || 0; 
              const newTotalPaid = previousPaid + amount;
              
              const itemHistory = item.paymentHistory ? [...item.paymentHistory, newPaymentRecord] : [newPaymentRecord];

              updatedSchedule[selectedPaymentIndex] = {
                  ...item,
                  paidAmount: newTotalPaid, 
                  paymentHistory: itemHistory, 
                  status: newTotalPaid >= item.amount ? 'paid' : 'partial', 
                  paidAt: Date.now() / 1000, 
                  method: paymentMethod 
              };
              updatedBalance -= amount;
          } else {
              updatedBalance -= amount;
          }

          const newStatus = updatedBalance <= 0 ? 'paid' : 'partial';
          
          const extraUpdates = {};
          if (updatedBalance <= 0 && (selectedPaymentTx.saleStatus === 'completed' || selectedPaymentTx.saleStatus === 'pending_delivery') && !selectedPaymentTx.finalizedAt) {
               extraUpdates.finalizedAt = { seconds: Date.now() / 1000 };
          }

          await updateDoc(txRef, {
              paymentSchedule: updatedSchedule,
              balance: updatedBalance,
              paymentStatus: newStatus,
              ...extraUpdates
          });

          setPaymentModalOpen(false);
          setPaymentAmountInput('');
          setSelectedPaymentTx(null);
          setPaymentReceiptFile(null); 
          triggerAlert("Abono Registrado", `Se abonaron $${formatMoney(amount)}.`, "success");

      } catch(e) {
          console.error(e);
          triggerAlert("Error", "No se pudo registrar pago", "error");
      } finally {
          setLoading(false);
          setProcessingMsg("");
      }
  };

  const simpleSave = async (collectionName, data, isModalOpenSetter) => {
    try { await addDoc(collection(db, `artifacts/${APP_ID}/public/data/${collectionName}`), data); isModalOpenSetter(false); }
    catch (e) { console.error(e); triggerAlert("Error", "No se pudo guardar.", "error"); }
  };

  const handleDeleteCategory = async (catId) => {
      if(!window.confirm("¿Seguro que quieres borrar esta categoría?")) return;
      try {
          await deleteDoc(doc(db, `artifacts/${APP_ID}/public/data/categories`, catId));
          triggerAlert("Borrada", "Categoría eliminada", "success");
      } catch (e) {
          console.error(e);
          triggerAlert("Error", "No se pudo borrar", "error");
      }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const imageFile = fd.get('image');
    
    const price = Number(productPriceInput) || 0;

    if (!editingProduct && (!imageFile || imageFile.size === 0)) {
        triggerAlert("Falta Imagen", "Es obligatorio subir una foto del producto.", "error");
        return;
    }

    setLoading(true);
    let imageUrl = editingProduct?.imageUrl || null;
    
    try {
        if (imageFile && imageFile.size > 0) {
            const storageRef = ref(storage, `natura/${Date.now()}_${imageFile.name}`);
            const snap = await uploadBytes(storageRef, imageFile);
            imageUrl = await getDownloadURL(snap.ref);
        }
        const data = { 
            name: fd.get('name'), 
            brand: fd.get('brand'), 
            price, 
            category: fd.get('category'), 
            stock: editingProduct ? editingProduct.stock : 0, 
            imageUrl,
            customId: fd.get('customId') || '',
            points: Number(fd.get('points')) || 0
        };
        if (editingProduct) await updateDoc(doc(db, `artifacts/${APP_ID}/public/data/products`, editingProduct.id), data);
        else await addDoc(collection(db, `artifacts/${APP_ID}/public/data/products`), data);
        setIsProductModalOpen(false); setEditingProduct(null); setProductPriceInput('');
    } catch (e) { 
        console.error(e);
        triggerAlert("Error", "Error al guardar.", "error"); 
    } finally { setLoading(false); }
  };

  const handleSaveClient = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const clientData = { 
        name: fd.get('name'), 
        department: fd.get('department') || '', 
        phone: fd.get('phone') || '', 
        email: fd.get('email') || '' 
    };

    try { 
        if (editingClient) {
            await updateDoc(doc(db, `artifacts/${APP_ID}/public/data/clients`, editingClient.id), clientData);
            triggerAlert("Actualizado", "Cliente editado correctamente.", "success");
        } else {
            const docRef = await addDoc(collection(db, `artifacts/${APP_ID}/public/data/clients`), clientData); 
            if (isCheckoutModalOpen) {
                 setSelectedClient(docRef.id);
                 setClientSearchTerm(clientData.name);
            }
            triggerAlert("Cliente Creado", "El cliente ha sido registrado exitosamente.", "success"); 
        }
        setIsClientModalOpen(false); 
        setEditingClient(null);
    } catch (e) { 
        console.error(e);
        triggerAlert("Error", "Fallo al guardar.", "error"); 
    }
  };

  const handleDeleteClient = async (clientId) => {
      if (!window.confirm("¿Eliminar este cliente?")) return;
      try {
          await deleteDoc(doc(db, `artifacts/${APP_ID}/public/data/clients`, clientId));
          triggerAlert("Eliminado", "Cliente borrado.", "success");
      } catch(e) {
          console.error(e);
          triggerAlert("Error", "No se pudo eliminar", "error");
      }
  };

  const handleSaveSupplier = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const supplierData = { name: fd.get('name'), contact: fd.get('contact')||'', phone: fd.get('phone')||'' };
      try { 
          const docRef = await addDoc(collection(db, `artifacts/${APP_ID}/public/data/suppliers`), supplierData); 
          setIsSupplierModalOpen(false); 
          setSelectedSupplier(docRef.id);
          triggerAlert("Proveedor Guardado", "Listo.", "success");
      } catch (e) { triggerAlert("Error", "Fallo al guardar.", "error"); }
  };

  const filteredProducts = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategoryFilter === 'ALL' || p.category === selectedCategoryFilter;
      return matchesSearch && matchesCategory;
  });

  const filteredClientsForSearch = clients.filter(c => {
      const term = clientSearchTerm.toLowerCase();
      return c.name.toLowerCase().includes(term) || (c.department && c.department.toLowerCase().includes(term));
  });

  const pendingPaymentTransactions = useMemo(() => {
      return transactions.filter(t => t.type === 'sale' && t.paymentStatus !== 'paid').sort((a,b) => b.date.seconds - a.date.seconds);
  }, [transactions]);

  const filteredSales = useMemo(() => {
      const all = transactions.filter(t => t.type === 'sale');
      return {
          completed: all.filter(t => t.saleStatus === 'completed'),
          pending_delivery: all.filter(t => t.saleStatus === 'pending_delivery'),
          pending: all.filter(t => t.saleStatus === 'pending' || t.saleStatus === 'pending_order' || t.saleStatus === 'pending_cycle' || t.saleStatus === 'pending_web'),
          inTransit: all.filter(t => t.saleStatus === 'in_transit'),
      };
  }, [transactions]);

  const filteredOrders = useMemo(() => {
      return transactions.filter(t => (t.type === 'order' && t.saleStatus === 'pending_arrival') || (t.type === 'purchase' || t.type === 'stock_entry'));
  }, [transactions]);

  const pendingArrivals = useMemo(() => {
      const stockOrders = filteredOrders.filter(t => t.saleStatus === 'pending_arrival');
      return stockOrders.sort((a,b) => a.date.seconds - b.date.seconds);
  }, [filteredOrders]);

  const purchaseHistoryData = filteredOrders.filter(t => t.type === 'purchase' || t.type === 'stock_entry');

  const getClientName = (id) => {
      if (!id) return 'Consumidor Final';
      const c = clients.find(c => c.id === id);
      return c ? c.name : 'Consumidor Final';
  };
    
  const getSupplierName = (id) => {
      if (!id) return 'Proveedor Desconocido';
      if (WEB_SUPPLIERS.includes(id) || (id && id.includes('Catálogo'))) return id;
      const s = suppliers.find(sup => sup.id === id);
      return s ? s.name : id || 'Proveedor'; 
  };

  
  const activeCycleStats = useMemo(() => {
      const activeCycle = cycles.find(c => c.status === 'open') || null;
      if (!activeCycle) return { totalPoints: 0, clientPoints: 0, stockPoints: 0, progress: 0, orders: [], remainingDays: 0 };
      
      const ordersInCycle = transactions.filter(t => 
          (t.type === 'order' || (t.type === 'sale' && t.cycleId === activeCycle.id)) && 
          t.cycleId === activeCycle.id
      );
      
      let clientPoints = 0;
      let stockPoints = 0;
      
      ordersInCycle.forEach(o => {
          if (o.type === 'order' && o.clientId === 'Para Inversión') {
              stockPoints += (o.totalPoints || 0);
          } else {
              clientPoints += (o.totalPoints || 0);
          }
      });
      
      const totalPoints = clientPoints + stockPoints;
      const progress = activeCycle.goal > 0 ? (totalPoints / activeCycle.goal) * 100 : 0;
      
      const diffTime = new Date(activeCycle.closingDate) - new Date();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

      return { totalPoints, clientPoints, stockPoints, progress, orders: ordersInCycle, remainingDays: diffDays };
  }, [cycles, transactions]);

  const handleSaveCycle = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const name = fd.get('name');
      const goal = Number(fd.get('goal'));
      const closingDate = fd.get('closingDate');
      
      try {
          const activeCycle = cycles.find(c => c.status === 'open');
          if(activeCycle) {
              triggerAlert("Ya existe un ciclo abierto", "Cierra el ciclo actual antes de crear uno nuevo.", "error");
              return;
          }
          await addDoc(collection(db, `artifacts/${APP_ID}/public/data/cycles`), {
              name,
              goal,
              closingDate,
              status: 'open',
              startDate: new Date().toISOString()
          });
          setIsCycleModalOpen(false);
          triggerAlert("Ciclo Iniciado", `Meta: ${goal} puntos.`, "success");
      } catch(e) {
          console.error(e);
          triggerAlert("Error", "No se pudo crear el ciclo.", "error");
      }
  };

  const handleCloseCycle = async () => {
      const activeCycle = cycles.find(c => c.status === 'open');
      if(!activeCycle) return;
      
      if(activeCycleStats.totalPoints < activeCycle.goal) {
          triggerAlert("Meta No Alcanzada", "No puedes cerrar el pedido si no has llegado al límite de puntos.", "error");
          return;
      }

      setConfirmationState({
          show: true,
          title: "Cerrar Ciclo",
          message: `¿Estás seguro de cerrar el ciclo "${activeCycle.name}"?\n\nTodos los pedidos pendientes pasarán a estado "Por Encargar" (Esperando Stock).`,
          type: "neutral",
          onConfirm: async () => {
              setConfirmationState(prev => ({ ...prev, show: false }));
              setLoading(true);
              setProcessingMsg("Generando pedidos...");
              
              try {
                  const batch = writeBatch(db);
                  const cycleOrders = activeCycleStats.orders;
                  
                  cycleOrders.forEach(order => {
                      batch.update(doc(db, `artifacts/${APP_ID}/public/data/transactions`, order.id), {
                          saleStatus: 'pending_order', 
                          orderedAt: new Date().toISOString()
                      });
                  });
                  
                  batch.update(doc(db, `artifacts/${APP_ID}/public/data/cycles`, activeCycle.id), {
                      status: 'closed',
                      closedAt: new Date().toISOString()
                  });
                  
                  await batch.commit();
                  triggerAlert("Ciclo Cerrado", "Los pedidos ahora están en 'Por Encargar'.", "success");
              } catch(e) {
                  console.error(e);
                  triggerAlert("Error", "Falló al cerrar ciclo", "error");
              } finally {
                  setLoading(false);
                  setProcessingMsg("");
              }
          }
      });
  };

  const getAlertConfig = (type) => {
    switch(type) {
        case 'success': return { border: 'border-green-500', icon: CheckCircle2, color: 'text-green-600' };
        case 'error': return { border: 'border-red-500', icon: AlertCircle, color: 'text-red-600' };
        default: return { border: 'border-orange-500', icon: Info, color: 'text-orange-500' };
    }
  };

  const getHeaderTitle = () => {
      switch(view) {
          case 'pos': return 'Registra Venta';
          case 'cycles': return 'Gestión Ciclos';
          case 'purchases': return 'Compras / Stock'; 
          case 'receipts': return 'Pedidos'; 
          case 'finances': return 'Deudores';
          default: return view;
      }
  };

  if (!user && loading) return <div className="flex h-screen items-center justify-center bg-stone-100 text-orange-600">Iniciando...</div>;

  return (
    <div className="flex h-screen bg-stone-50 text-stone-800 font-sans overflow-hidden relative">
      
      <aside className="w-64 bg-green-900 text-white flex flex-col shrink-0 transition-all shadow-xl z-40">
        <div className="p-6 border-b border-green-800 flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-xl">
                <Leaf className="w-6 h-6 text-green-900" />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-orange-50">Consultoría</h1>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            <SidebarButton icon={<ShoppingCart />} label="Vender" active={view === 'pos'} onClick={() => setView('pos')} />
            <SidebarButton icon={<ShoppingBag />} label="Compras / Stock" active={view === 'purchases'} onClick={() => setView('purchases')} />
            <SidebarButton icon={<Receipt />} label="Pedidos" active={view === 'receipts'} onClick={() => setView('receipts')} />
            <SidebarButton icon={<Repeat />} label="Ciclos" active={view === 'cycles'} onClick={() => setView('cycles')} />
            <SidebarButton icon={<DollarSign />} label="Deudores" active={view === 'finances'} onClick={() => setView('finances')} />
        </nav>

        <div className="p-4 bg-green-950 border-t border-green-800">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-green-900/50">
                <UserCircle className="w-10 h-10 text-orange-200" />
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate text-white">Consultora</div>
                    <div className="text-xs text-green-300 truncate">Perfil Activo</div>
                </div>
                <button onClick={() => auth.signOut()} className="p-2 text-green-300 hover:text-white hover:bg-green-800 rounded-lg transition-colors">
                    <LogOut className="w-4 h-4" />
                </button>
            </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-stone-50">
          
      {loading && processingMsg && (
          <div className="fixed inset-0 bg-black/50 z-[110] flex flex-col items-center justify-center backdrop-blur-sm">
              <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-200">
                  <Loader2 className="w-12 h-12 text-orange-600 animate-spin mb-3"/>
                  <span className="font-bold text-lg text-stone-700">{processingMsg}</span>
              </div>
          </div>
      )}

      {alertState.show && (
        <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className={`bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl text-center border-t-4 ${getAlertConfig(alertState.type).border}`}>
                {React.createElement(getAlertConfig(alertState.type).icon, { className: `w-8 h-8 mx-auto mb-4 ${getAlertConfig(alertState.type).color}` })}
                <h3 className="text-lg font-bold mb-2">{alertState.title}</h3>
                <p className="text-sm text-stone-500 mb-4">{alertState.message}</p>
                <button onClick={() => setAlertState({...alertState, show: false})} className="w-full py-2 bg-green-900 text-white rounded-lg font-bold">OK</button>
            </div>
        </div>
      )}

      {confirmationState.show && (
        <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl text-center border-t-4 border-orange-500">
                <AlertTriangle className="w-10 h-10 mx-auto mb-4 text-orange-500"/>
                <h3 className="text-lg font-bold mb-2">{confirmationState.title}</h3>
                <p className="text-sm text-stone-500 mb-6 whitespace-pre-line">{confirmationState.message}</p>
                <div className="flex gap-2">
                    <button onClick={() => setConfirmationState({...confirmationState, show: false})} className="flex-1 py-2 bg-stone-100 text-stone-500 rounded-lg font-bold">Cancelar</button>
                    <button onClick={confirmationState.onConfirm} className={`flex-1 py-2 text-white rounded-lg font-bold ${confirmationState.type === 'danger' ? 'bg-red-600' : 'bg-green-900'}`}>Confirmar</button>
                </div>
            </div>
        </div>
      )}

      <header className="bg-white text-green-900 p-4 shadow-sm border-b flex justify-between items-center z-10 shrink-0">
        <h1 className="font-bold text-xl flex items-center gap-2">
            {view === 'pos' ? <Leaf className="w-6 h-6 text-green-700"/> : view === 'purchases' ? <ShoppingBag className="w-6 h-6 text-green-700"/> : view === 'finances' ? <DollarSign className="w-6 h-6 text-green-700"/> : <LayoutDashboard className="w-6 h-6 text-green-700"/>} 
            {getHeaderTitle()}
        </h1>
        {view === 'purchases' && purchasesSubView === 'catalog' && (
             <button onClick={() => { setEditingProduct(null); setProductPriceInput(''); setIsProductModalOpen(true); }} className="p-2 bg-green-100 text-green-800 rounded-full hover:bg-green-200 transition-colors"><Plus className="w-5 h-5"/></button>
        )}
      </header>

      <main className={`flex-1 overflow-hidden relative flex flex-col ${view !== 'pos' && view !== 'purchases' ? 'overflow-y-auto' : ''}`}>
        
        {(view === 'pos') && (
            <div className="flex flex-col h-full relative">
                <div className="p-4 bg-white border-b shadow-sm space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-stone-400"/>
                        <input className="w-full pl-10 p-3 bg-stone-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all" placeholder="Buscar producto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        <button onClick={() => setSelectedCategoryFilter('ALL')} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${selectedCategoryFilter === 'ALL' ? 'bg-green-800 text-white shadow-md' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>Todos</button>
                        {categories.map(c => <button key={c.id} onClick={() => setSelectedCategoryFilter(c.id)} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${selectedCategoryFilter === c.id ? 'bg-green-800 text-white shadow-md' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>{c.name}</button>)}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 bg-stone-50 pb-32">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {filteredProducts.map(p => (
                            <button key={p.id} onClick={() => addToCart(p)} className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden flex flex-col h-full group hover:shadow-lg hover:border-green-200 transition-all text-left">
                                <div className="aspect-square w-full relative bg-white">
                                    {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <Leaf className="w-full h-full p-8 text-stone-100" />}
                                    {p.stock <= 0 && <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]"><span className="text-[10px] font-bold bg-white/90 text-stone-800 px-3 py-1 rounded-full shadow-lg">POR ENCARGO</span></div>}
                                </div>
                                <div className="p-3 flex flex-col flex-1 justify-between">
                                    <span className="font-medium text-sm line-clamp-2 leading-snug text-stone-700">{p.name}</span>
                                    <div className="mt-2 flex justify-between items-end w-full">
                                        <span className="text-orange-600 font-bold text-sm">${formatMoney(p.price)}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${getStockStatus(p.stock).color}`}>{p.stock}</span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                {cart.length > 0 && (
                    <div className="absolute bottom-0 right-0 left-0 bg-white border-t rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-20 flex flex-col">
                        <div className="p-4">
                            <div className="max-h-48 overflow-y-auto mb-4 space-y-3 pr-2">
                                {cart.map(item => (
                                    <div key={item.id} className="flex justify-between items-center bg-stone-50 p-2 rounded-xl border border-stone-100">
                                            <div className="flex-1 min-w-0 mr-3">
                                                <div className="text-sm font-bold truncate text-stone-800">{item.name}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="flex items-center bg-white rounded-lg border border-stone-200 h-6 shadow-sm">
                                                        <button onClick={() => updateQty(item.id, -1)} className="px-2 h-full flex items-center text-stone-400 hover:text-red-500"><Minus className="w-3 h-3"/></button>
                                                        <span className="text-xs font-bold w-6 text-center">{item.qty}</span>
                                                        <button onClick={() => updateQty(item.id, 1)} className="px-2 h-full flex items-center text-stone-400 hover:text-green-600"><Plus className="w-3 h-3"/></button>
                                                    </div>
                                                    <MoneyInput className="w-20 bg-transparent border-b border-stone-300 text-xs font-bold text-right focus:border-orange-500 outline-none" value={item.transactionPrice} onChange={val => updateTransactionPrice(item.id, val || 0)}/>
                                                </div>
                                            </div>
                                            <button onClick={() => removeFromCart(item.id)} className="p-2 text-stone-300 hover:text-red-500 transition-colors"><X className="w-4 h-4"/></button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => { setIsCheckoutModalOpen(true); }} className="w-full h-14 bg-green-900 text-white rounded-xl font-bold flex justify-between px-6 items-center shadow-xl shadow-green-900/20 hover:bg-green-800 active:scale-[0.99] transition-all">
                                <span className="flex items-center gap-2 text-lg">Ir a Pagar <ChevronRight className="w-5 h-5"/></span>
                                <span className="text-xl tracking-tight">${formatMoney(cartTotal)}</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}

        {view === 'cycles' && (
            <div className="p-6 overflow-y-auto pb-24 h-full bg-stone-50">
                {(() => {
                    const activeCycle = cycles.find(c => c.status === 'open');
                    if (!activeCycle) {
                        return (
                            <div className="flex flex-col items-center justify-center h-full text-center p-6">
                                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full border border-stone-100">
                                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Target className="w-8 h-8 text-orange-600"/>
                                    </div>
                                    <h2 className="text-2xl font-black text-stone-800 mb-2">Sin Ciclo Activo</h2>
                                    <p className="text-stone-500 mb-6 text-sm">Inicia un nuevo ciclo de ventas para comenzar a acumular puntos y pedidos.</p>
                                    <button onClick={() => setIsCycleModalOpen(true)} className="w-full py-4 bg-green-900 text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-green-800 transition-all">Iniciar Nuevo Ciclo</button>
                                </div>
                            </div>
                        );
                    }
                    return (
                    <div className="space-y-6 max-w-3xl mx-auto">
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-0"></div>
                            <div className="flex justify-between items-center mb-6 relative z-10">
                                <div>
                                    <div className="text-xs font-bold text-orange-600 uppercase tracking-widest bg-orange-50 px-2 py-1 rounded-lg inline-block mb-2">Ciclo Actual</div>
                                    <h2 className="text-4xl font-black text-green-900">{activeCycle.name}</h2>
                                    <div className="text-sm text-stone-500 font-medium mt-2 flex items-center gap-2">
                                        <Clock className="w-4 h-4"/> Cierra en {activeCycleStats.remainingDays} días
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold text-stone-400 uppercase">Meta</div>
                                    <div className="text-3xl font-black text-stone-800">{activeCycle.goal} <span className="text-lg text-stone-400">pts</span></div>
                                </div>
                            </div>

                            <div className="mb-4 relative z-10">
                                <div className="flex justify-between text-sm font-bold mb-2">
                                    <span className="text-green-700">{activeCycleStats.totalPoints} pts acumulados</span>
                                    <span className="text-stone-400">{Math.round(activeCycleStats.progress)}%</span>
                                </div>
                                <div className="h-4 bg-stone-100 rounded-full overflow-hidden border border-stone-100">
                                    <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-1000 shadow-[0_0_10px_rgba(249,115,22,0.5)]" style={{ width: `${Math.min(activeCycleStats.progress, 100)}%` }}></div>
                                </div>
                            </div>
                            
                            <div className="text-center mt-4 text-xs font-medium text-stone-500 relative z-10">
                                {activeCycleStats.totalPoints >= activeCycle.goal 
                                    ? <span className="text-green-600 font-bold flex items-center justify-center gap-1 bg-green-50 py-2 rounded-xl"><CheckCircle2 className="w-4 h-4"/> ¡Meta Alcanzada!</span> 
                                    : `Faltan ${activeCycle.goal - activeCycleStats.totalPoints} puntos para el pedido.`
                                }
                            </div>

                            <button 
                                onClick={() => {
                                    clearCart();
                                    setSelectedCycle(activeCycle.id);
                                    setSelectedSupplier('Para Inversión'); 
                                    setOrderSource('cycle_stock'); 
                                    setView('purchases');
                                    setPurchasesSubView('orders');
                                }}
                                className="w-full mt-6 py-4 bg-green-900 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-green-800"
                            >
                                <Plus className="w-5 h-5"/>
                                Agregar productos para inversión
                            </button>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-4 ml-1">
                                <h3 className="font-bold text-stone-700 text-lg">Detalle del Ciclo</h3>
                                {activeCycleStats.totalPoints < activeCycle.goal ? (
                                    <div className="text-xs bg-stone-200 text-stone-500 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1">
                                        <Lock className="w-3 h-3"/> Faltan puntos
                                    </div>
                                ) : (
                                    <button 
                                        onClick={handleCloseCycle}
                                        disabled={activeCycleStats.orders.length === 0}
                                        className="text-xs bg-stone-800 text-white px-4 py-2 rounded-xl font-bold shadow-md disabled:opacity-50 disabled:shadow-none hover:bg-stone-900 transition-colors"
                                    >
                                        Cerrar y Generar Pedidos
                                    </button>
                                )}
                            </div>
                            
                            {activeCycleStats.orders.length === 0 ? (
                                <div className="text-center py-12 text-stone-400 bg-white rounded-3xl border-2 border-dashed border-stone-100">
                                    <Package className="w-12 h-12 mx-auto mb-3 text-stone-200"/>
                                    <p>Aún no hay pedidos en este ciclo.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {activeCycleStats.orders.map(order => (
                                        <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex justify-between items-center group hover:shadow-md transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl ${order.clientId === 'Para Inversión' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-700'}`}>
                                                    {order.clientId === 'Para Inversión' ? <Package className="w-6 h-6"/> : getClientName(order.clientId).charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-stone-800">{getClientName(order.clientId)}</div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${order.clientId === 'Para Inversión' ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                                                            {order.clientId === 'Para Inversión' ? 'EN STOCK' : 'POR ENCARGAR'}
                                                        </span>
                                                        <span className="text-xs text-stone-400">• {order.items.length} prod.</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-stone-800 text-lg">${formatMoney(order.total)}</div>
                                                <div className="text-xs text-orange-600 font-bold">{order.totalPoints} pts</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    );
                })()}
            </div>
        )}

        {view === 'finances' && (
             <div className="p-6 pb-24 max-w-3xl mx-auto w-full">
                 <div className="mb-6 bg-white p-8 rounded-3xl shadow-sm border border-green-100 flex flex-col items-center justify-center text-center relative overflow-hidden">
                     <div className="absolute inset-0 bg-green-50/50"></div>
                     <div className="relative z-10">
                        <div className="p-4 bg-white rounded-full mb-3 inline-block shadow-sm"><DollarSign className="w-8 h-8 text-green-700"/></div>
                        <h2 className="font-bold text-lg mb-1 text-green-900">Cuentas por Cobrar</h2>
                        <div className="text-5xl font-black text-stone-800 tracking-tighter mb-2">
                            ${formatMoney(pendingPaymentTransactions.reduce((acc, t) => acc + t.balance, 0))}
                        </div>
                        <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">Saldo Total Clientes</p>
                     </div>
                 </div>

                 <div className="space-y-4">
                     {pendingPaymentTransactions.length === 0 && <div className="text-center text-stone-400 py-10">¡Todo al día! No hay deudas pendientes.</div>}
                     {pendingPaymentTransactions.map(tx => (
                         <div key={tx.id} onClick={() => { setSelectedPaymentTx(tx); setPaymentModalOpen(true); setSelectedPaymentIndex(null); setPaymentAmountInput(''); setPaymentReceiptFile(null); }} className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 cursor-pointer hover:border-green-500 hover:shadow-md transition-all group">
                             <div className="flex justify-between items-start mb-4">
                                 <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center font-bold text-stone-600 text-xl group-hover:bg-green-100 group-hover:text-green-700 transition-colors">{getClientName(tx.clientId).charAt(0)}</div>
                                     <div>
                                         <div className="font-bold text-stone-800 text-lg">{getClientName(tx.clientId)}</div>
                                         <div className="text-xs text-stone-400 mt-1">
                                            <span className="font-mono font-bold text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded mr-2">#{tx.displayId}</span>
                                            {formatDateSimple(tx.date.seconds)} • {(tx.items || []).length} productos
                                         </div>
                                     </div>
                                 </div>
                                 <div className="bg-red-50 text-red-600 text-sm font-bold px-4 py-2 rounded-xl border border-red-100">
                                     Debe: ${formatMoney(tx.balance)}
                                 </div>
                             </div>
                             
                             <div className="flex justify-between items-center text-xs mb-3 bg-stone-50 p-3 rounded-xl">
                                 <span className="text-stone-500">Total Venta: <strong>${formatMoney(tx.total)}</strong></span>
                                 <span className="font-bold text-green-700 bg-white px-2 py-1 rounded border border-green-100 shadow-sm">{tx.paymentPlanType === 'installments' ? 'En Cuotas' : 'Saldo Pendiente'}</span>
                             </div>
                             
                             <div className="relative w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                                 <div className="bg-green-600 h-full absolute left-0 top-0" style={{ width: `${((tx.total - tx.balance) / tx.total) * 100}%` }}></div>
                             </div>
                             <div className="text-[10px] text-right mt-1 text-stone-400 font-bold">Pagado: {Math.round(((tx.total - tx.balance) / tx.total) * 100)}%</div>
                         </div>
                     ))}
                 </div>
             </div>
        )}

        {view === 'purchases' && (
            <div className="flex flex-col h-full bg-stone-50">
                
                {checkInOrder ? (
                    <div className="flex flex-col h-full bg-white animate-in slide-in-from-bottom duration-300 z-20 absolute inset-0">
                        <div className="p-6 border-b bg-white flex justify-between items-center shadow-sm">
                            <div>
                                <h2 className="font-bold text-2xl text-stone-800">Confirmar Llegada</h2>
                                <p className="text-sm text-stone-500">Ingresa la fecha de vencimiento de cada producto</p>
                            </div>
                            <button onClick={() => {setCheckInOrder(null); setCheckInItems([]);}} className="p-2 bg-stone-100 rounded-full hover:bg-stone-200"><X className="w-6 h-6 text-stone-500"/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 bg-stone-50">
                            <div className="max-w-2xl mx-auto space-y-4">
                                {checkInItems.map((item, idx) => (
                                    <div key={item._tempId} className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">#{idx+1}</span>
                                                <div className="font-bold text-stone-800 text-lg">{item.name}</div>
                                            </div>
                                            <div className="text-xs text-stone-400">ID: {item.id}</div>
                                        </div>
                                        <div className="w-full sm:w-auto">
                                            <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Vencimiento</label>
                                            <div className={`flex items-center gap-2 p-1 rounded-xl border-2 transition-all ${!item.expirationDate ? 'border-orange-200 bg-orange-50' : 'border-green-200 bg-green-50'}`}>
                                                <CalendarDays className={`w-5 h-5 ml-2 ${!item.expirationDate ? 'text-orange-400' : 'text-green-600'}`}/>
                                                <input 
                                                    type="date" 
                                                    className="p-2 bg-transparent text-lg font-bold text-stone-700 outline-none w-full sm:w-40" 
                                                    value={item.expirationDate} 
                                                    onChange={(e) => updateCheckInDate(item._tempId, e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 border-t bg-white pb-24 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                            <div className="max-w-2xl mx-auto">
                                <button onClick={confirmCheckIn} className="w-full py-4 bg-green-900 text-white font-bold rounded-2xl shadow-xl hover:bg-green-800 transition-all flex justify-center items-center gap-2 text-lg">
                                    <CheckCircle2 className="w-6 h-6"/>
                                    Confirmar e Ingresar Stock
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                    <div className="p-4 bg-white border-b shadow-sm">
                        <div className="flex p-1 bg-stone-100 rounded-xl max-w-md mx-auto">
                            <button onClick={() => setPurchasesSubView('orders')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${purchasesSubView === 'orders' ? 'bg-white text-green-900 shadow ring-1 ring-black/5' : 'text-stone-400 hover:text-stone-600'}`}><Box className="w-4 h-4"/> Recepción</button>
                            <button onClick={() => setPurchasesSubView('catalog')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${purchasesSubView === 'catalog' ? 'bg-white text-green-900 shadow ring-1 ring-black/5' : 'text-stone-400 hover:text-stone-600'}`}><Tag className="w-4 h-4"/> Catálogo</button>
                        </div>
                    </div>

                    {purchasesSubView === 'orders' ? (
                        !orderSource ? (
                            <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
                                <div className="max-w-4xl mx-auto w-full">
                                    <button onClick={() => setOrderSource('selection')} className="w-full bg-green-900 text-white p-6 rounded-3xl shadow-lg flex items-center justify-between group hover:bg-green-800 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-white/20 p-3 rounded-2xl"><Plus className="w-8 h-8"/></div>
                                            <div className="text-left">
                                                <div className="font-bold text-xl">Nuevo Pedido de Stock</div>
                                                <div className="text-green-200 text-sm">Registrar compra web o catálogo</div>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform"/>
                                    </button>

                                    <div className="mt-8">
                                        <h3 className="font-bold text-stone-700 mb-4 flex items-center gap-2 text-lg"><Clock className="w-6 h-6 text-orange-500"/> Por Llegar (En Camino)</h3>
                                        <div className="space-y-4">
                                            {pendingArrivals.length === 0 && <div className="text-center text-sm text-stone-400 py-8 border-2 border-dashed border-stone-200 rounded-3xl">No hay pedidos pendientes de llegada</div>}
                                            {pendingArrivals.map(order => (
                                                <div key={order.id} onClick={() => startCheckIn(order)} className="bg-white border border-l-8 border-l-orange-500 p-6 rounded-2xl shadow-sm cursor-pointer hover:shadow-md transition-all relative overflow-hidden group">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
                                                                    {order.orderType === 'web' ? `Compra Web #${order.displayId}` : (order.cycleId && cycleMap[order.cycleId] ? `Ciclo ${cycleMap[order.cycleId]}` : 'Ciclo')}
                                                                </span>
                                                                <span className="text-xs font-bold text-stone-400 uppercase tracking-wide">{order.clientId === 'Para Inversión' ? 'Stock Personal' : order.clientId}</span>
                                                            </div>
                                                            <div className="font-black text-2xl text-stone-800">${formatMoney(order.total)}</div>
                                                            <div className="text-sm text-stone-500 mt-1 flex gap-4">
                                                                <span className="flex items-center gap-1"><Calendar className="w-4 h-4"/> {formatDateSimple(order.date.seconds)}</span>
                                                                <span className="flex items-center gap-1"><Box className="w-4 h-4"/> {(order.items || []).length} productos</span>
                                                            </div>
                                                        </div>
                                                        <div className="bg-orange-50 p-3 rounded-full group-hover:bg-orange-100 transition-colors">
                                                            <ArrowDownCircle className="w-6 h-6 text-orange-600"/>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="mt-8 opacity-60 hover:opacity-100 transition-opacity">
                                        <h3 className="font-bold text-stone-700 mb-4 flex items-center gap-2 text-lg"><History className="w-6 h-6 text-stone-400"/> Historial de Ingresos</h3>
                                        <div className="space-y-2">
                                            {purchaseHistoryData.slice(0, 5).map(h => (
                                                <div key={h.id} className="bg-white p-4 rounded-xl border border-stone-100 flex justify-between items-center" onClick={() => setReceiptDetails(h)}>
                                                    <div>
                                                        <div className="font-bold text-stone-700">${formatMoney(h.total)}</div>
                                                        <div className="text-xs text-stone-400">{formatDateSimple(h.date.seconds)} • {h.clientId}</div>
                                                    </div>
                                                    <div className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold">RECIBIDO</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full bg-stone-50">
                                {orderSource === 'selection' && (
                                    <div className="p-8 flex flex-col h-full max-w-lg mx-auto w-full">
                                        <div className="mb-8 text-center">
                                            <h2 className="text-3xl font-black text-stone-800 mb-2">Nuevo Ingreso</h2>
                                            <p className="text-stone-500">Selecciona el origen de los productos</p>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 flex-1 content-start">
                                            <button onClick={() => setOrderSource('web')} className="p-6 bg-white rounded-3xl shadow-sm border-2 border-transparent hover:border-blue-500 text-left group transition-all">
                                                <Globe className="w-8 h-8 text-blue-500 mb-4"/>
                                                <h3 className="font-bold text-xl text-stone-800">Compra Web</h3>
                                                <p className="text-sm text-stone-400">Pedido realizado online a Natura/Avon</p>
                                            </button>
                                            <button onClick={() => setOrderSource('catalog')} className="p-6 bg-white rounded-3xl shadow-sm border-2 border-transparent hover:border-pink-500 text-left group transition-all">
                                                <BookOpen className="w-8 h-8 text-pink-500 mb-4"/>
                                                <h3 className="font-bold text-xl text-stone-800">Pedido de Ciclo</h3>
                                                <p className="text-sm text-stone-400">Productos del catálogo de campaña</p>
                                            </button>
                                        </div>
                                        <button onClick={() => setOrderSource(null)} className="py-4 text-stone-400 font-bold hover:text-stone-600 transition-colors">Cancelar</button>
                                    </div>
                                )}
                                {(orderSource === 'web' || orderSource === 'catalog') && !selectedSupplier && (
                                    <div className="p-8 flex flex-col h-full max-w-lg mx-auto w-full">
                                        <h2 className="text-2xl font-bold mb-6 text-stone-800">Detalles del Origen</h2>
                                        {orderSource === 'web' ? (
                                            <div className="space-y-3">
                                                {WEB_SUPPLIERS.map(s => <button key={s} onClick={() => setSelectedSupplier(s)} className="w-full p-5 bg-white border border-stone-200 rounded-2xl font-bold text-left hover:bg-stone-50 hover:border-stone-300 transition-all text-stone-700">{s}</button>)}
                                            </div>
                                        ) : (
                                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 space-y-6">
                                                {!catalogBrand ? (
                                                    <div>
                                                        <label className="block font-bold text-sm mb-3 text-stone-500 uppercase">Marca</label>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            {BRANDS.map(b => <button key={b} onClick={() => setCatalogBrand(b)} className="p-4 border rounded-2xl font-bold text-sm hover:bg-stone-50 transition-colors text-stone-700">{b}</button>)}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div>
                                                            <label className="block font-bold text-sm mb-2 text-stone-500 uppercase">Campaña / Ciclo</label>
                                                            <div className="flex gap-2">
                                                                <select className="flex-1 p-3 border rounded-xl bg-stone-50 text-stone-700 font-medium" value={selectedCycle} onChange={(e) => setSelectedCycle(e.target.value)}>
                                                                    <option value="">Seleccionar...</option>
                                                                    {cycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                                </select>
                                                                <button onClick={() => setIsCycleModalOpen(true)} className="w-12 bg-stone-200 text-stone-600 rounded-xl flex items-center justify-center hover:bg-stone-300"><Plus/></button>
                                                            </div>
                                                        </div>
                                                        <button onClick={() => {if(!selectedCycle) { triggerAlert("Falta Ciclo", "Selecciona ciclo.", "info"); return; } setSelectedSupplier(`${catalogBrand} Catálogo`);}} className="w-full py-4 bg-green-900 text-white font-bold rounded-2xl shadow-lg hover:bg-green-800 transition-all">Continuar</button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                        <button onClick={() => setOrderSource('selection')} className="mt-auto py-4 text-stone-400 font-bold hover:text-stone-600">Volver</button>
                                    </div>
                                )}
                                
                                {(selectedSupplier || orderSource === 'cycle_stock') && (
                                    <div className="flex flex-col h-full relative animate-in slide-in-from-right duration-200">
                                            <div className="p-4 bg-white border-b relative space-y-3">
                                                {(orderSource === 'cycle_stock') && (
                                                    <div className="bg-purple-50 border border-purple-100 text-purple-800 px-4 py-3 rounded-xl text-sm font-bold flex justify-between items-center shadow-sm">
                                                        <span>Agregando a {activeCycle?.name || 'Ciclo'} (Inversión)</span>
                                                        <button onClick={() => { clearCart(); setView('cycles'); }} className="text-xs bg-purple-200 px-2 py-1 rounded hover:bg-purple-300 transition-colors">Cancelar</button>
                                                    </div>
                                                )}
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-3 w-5 h-5 text-stone-400"/>
                                                    <input className="w-full pl-10 p-3 bg-stone-50 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                                                </div>
                                                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                                    <button onClick={() => setSelectedCategoryFilter('ALL')} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${selectedCategoryFilter === 'ALL' ? 'bg-green-800 text-white' : 'bg-stone-100 text-stone-600'}`}>Todos</button>
                                                    {categories.map(c => <button key={c.id} onClick={() => setSelectedCategoryFilter(c.id)} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${selectedCategoryFilter === c.id ? 'bg-green-800 text-white' : 'bg-stone-100 text-stone-600'}`}>{c.name}</button>)}
                                                </div>
                                            </div>
                                            <div className="flex-1 overflow-y-auto p-4 bg-stone-50 pb-48">
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                                    {filteredProducts.map(p => (
                                                        <button key={p.id} onClick={() => addToCart(p)} className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden flex flex-col group hover:shadow-lg transition-all h-full text-left">
                                                            <div className="aspect-square w-full relative">
                                                                {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <Leaf className="w-full h-full p-8 text-stone-200" />}
                                                            </div>
                                                            <div className="p-3 flex flex-col flex-1 justify-between w-full">
                                                                <span className="font-medium text-sm line-clamp-2 leading-tight text-stone-700">{p.name}</span>
                                                                <div className="mt-2 flex justify-between items-end w-full">
                                                                    <span className="text-stone-400 text-[10px] font-medium">Stock: {p.stock}</span>
                                                                    <div className="bg-green-50 text-green-700 p-1.5 rounded-full"><Plus className="w-4 h-4"/></div>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="fixed bottom-[0px] right-0 left-64 z-20 bg-white rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] border-t flex flex-col max-h-[50vh] min-h-0">
                                                <div className="px-6 py-4 border-b flex justify-between items-center bg-stone-50 rounded-t-3xl shrink-0">
                                                    <div className="flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-stone-700"/><span className="font-bold text-stone-800 text-sm">Resumen ({cartPoints} pts)</span></div>
                                                    <button onClick={() => { clearCart(); setOrderSource('selection'); setSelectedSupplier(''); }} className="p-2 bg-stone-200 rounded-full text-stone-500 hover:bg-red-100 hover:text-red-500 transition-colors"><X className="w-4 h-4"/></button>
                                                </div>
                                                <div className="flex-1 overflow-y-auto p-4 min-h-0 space-y-3">
                                                    {cart.map(item => (
                                                        <div key={item.id} className="border border-stone-100 rounded-xl p-3 flex justify-between items-center bg-white shadow-sm">
                                                            <div className="flex-1 mr-4">
                                                                <div className="text-xs font-bold line-clamp-1 mb-1 text-stone-800">{item.name}</div>
                                                                <MoneyInput className="w-24 border-b border-stone-200 text-sm font-bold text-stone-600 outline-none bg-transparent focus:border-green-500" value={item.transactionPrice} placeholder="Costo..." onChange={val => updateTransactionPrice(item.id, val || 0)}/>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex items-center bg-stone-50 rounded-lg h-8 border border-stone-200">
                                                                    <button onClick={() => updateQty(item.id, -1)} className="px-2 h-full hover:bg-stone-200 rounded-l-lg"><Minus className="w-3 h-3"/></button>
                                                                    <span className="text-xs font-bold w-6 text-center">{item.qty}</span>
                                                                    <button onClick={() => updateQty(item.id, 1)} className="px-2 h-full hover:bg-stone-200 rounded-r-lg"><Plus className="w-3 h-3"/></button>
                                                                </div>
                                                                <div className="w-16 text-right font-bold text-sm text-stone-800">${formatMoney(item.transactionPrice * item.qty)}</div>
                                                                <button onClick={() => removeFromCart(item.id)} className="text-stone-300 hover:text-red-500"><X className="w-4 h-4"/></button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="p-4 border-t bg-white shrink-0">
                                                    <button onClick={handleCreateOrder} className="w-full py-4 bg-green-900 text-white rounded-2xl font-bold shadow-lg hover:bg-green-800 transition-all flex justify-between px-6 text-lg items-center">
                                                        <span>Guardar Pedido</span>
                                                        <span>${formatMoney(cartTotal)}</span>
                                                    </button>
                                                </div>
                                            </div>
                                    </div>
                                )}
                            </div>
                        )
                    ) : (
                        <div className="p-6 overflow-y-auto pb-24 flex-1 bg-stone-50">
                            <div className="flex justify-between mb-6 gap-3">
                                <div className="flex-1 relative shadow-sm">
                                    <Search className="absolute left-3 top-3 w-5 h-5 text-stone-400"/>
                                    <input className="w-full pl-10 p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-green-500 outline-none" placeholder="Buscar producto en catálogo..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                                </div>
                                <button onClick={() => setIsCategoryModalOpen(true)} className="p-3 border bg-white rounded-xl hover:bg-stone-50 transition-colors text-stone-600"><Tag/></button>
                                <button onClick={() => setShowCatalogModal(true)} className="p-3 bg-green-700 text-white rounded-xl shadow-md hover:bg-green-800 transition-colors"><Share2/></button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {filteredProducts.map(p => (
                                    <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden flex flex-col group hover:shadow-lg transition-all">
                                            <div className="aspect-square w-full relative">
                                                {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <Leaf className="w-full h-full p-8 text-stone-200" />}
                                            </div>
                                            <div className="p-3 flex flex-col flex-1 justify-between text-left">
                                                <span className="font-bold text-sm line-clamp-2 leading-tight text-stone-700">{p.name}</span>
                                                <div className="mt-2 flex justify-between items-end">
                                                    <span className="text-orange-600 font-bold">${formatMoney(p.price)}</span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold ${getStockStatus(p.stock).color}`}>{p.stock}</span>
                                                </div>
                                                <div className="flex gap-2 mt-3 pt-3 border-t border-stone-100">
                                                    <button onClick={() => { setViewingHistoryProduct(p); setIsHistoryModalOpen(true); loadProductHistory(p.id); }} className="flex-1 py-1.5 bg-purple-50 text-purple-600 rounded-lg flex justify-center hover:bg-purple-100"><ScrollText className="w-4 h-4"/></button>
                                                    <button onClick={() => { setEditingProduct(p); setProductPriceInput(p.price); setIsProductModalOpen(true); }} className="flex-1 py-1.5 bg-blue-50 text-blue-600 rounded-lg flex justify-center hover:bg-blue-100"><Pencil className="w-4 h-4"/></button>
                                                    <button onClick={() => handleDeleteProduct(p.id)} className="flex-1 py-1.5 bg-red-50 text-red-600 rounded-lg flex justify-center hover:bg-red-100"><Trash2 className="w-4 h-4"/></button>
                                                </div>
                                            </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    </>
                )}
            </div>
        )}
        
        {view === 'receipts' && (
            <div className="p-6 overflow-y-auto pb-24 max-w-4xl mx-auto w-full">
                <div className="mb-8">
                    <h2 className="font-bold text-xl mb-4 flex items-center gap-3 text-stone-800"><Bike className="w-6 h-6 text-orange-500"/> En Reparto / Por Confirmar</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredSales.inTransit.length === 0 && <div className="col-span-2 text-stone-400 text-sm text-center py-8 border-2 border-dashed border-stone-200 rounded-2xl">No hay envíos en curso.</div>}
                        {filteredSales.inTransit.map(t => (
                            <div key={t.id} className="p-5 bg-white rounded-2xl shadow-sm border border-l-4 border-l-orange-500 relative overflow-hidden group hover:shadow-md transition-all">
                                <div className="absolute right-0 top-0 bg-orange-100 text-orange-700 text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">Lleva: {t.courier}</div>
                                <div onClick={() => setReceiptDetails(t)} className="cursor-pointer">
                                    <div className="flex justify-between mb-3 mt-2"><span className="font-bold text-lg text-stone-800">{getClientName(t.clientId)}</span>
                                        <span className="text-xs text-stone-400 font-medium">
                                            {formatDateSimple(t.date.seconds)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="text-2xl font-black text-stone-800">${formatMoney(t.total)}</div>
                                        <span className="text-xs text-stone-500 bg-stone-100 px-2 py-1 rounded-lg">{t.paymentMethod || 'Sin pago'}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-3 border-t border-stone-100">
                                    <button onClick={(e) => { e.stopPropagation(); handleVoidTransaction(t); }} className="py-2 px-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-red-100 transition-colors"><Undo2 className="w-4 h-4"/> Devolver</button>
                                    <button onClick={(e) => { e.stopPropagation(); handleConfirmDeliveryClick(t); }} className="flex-1 py-2 bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-stone-900 transition-colors"><Check className="w-4 h-4"/> Confirmar Entrega</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mb-8">
                    <h2 className="font-bold text-xl mb-4 flex items-center gap-3 text-stone-800"><PackageCheck className="w-6 h-6 text-blue-500"/> Por Entregar (Stock Reservado)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredSales.pending_delivery.length === 0 && <div className="col-span-2 text-stone-400 text-sm text-center py-8 border-2 border-dashed border-stone-200 rounded-2xl">No hay pedidos por entregar.</div>}
                        {filteredSales.pending_delivery.map(t => {
                            const tag = getOrderTag(t);
                            return (
                                <div key={t.id} className="p-5 bg-white rounded-2xl shadow-sm border border-l-4 border-l-green-500 group hover:shadow-md transition-all">
                                    <div onClick={() => setReceiptDetails(t)} className="cursor-pointer">
                                        <div className="flex justify-between mb-3"><span className="font-bold text-lg text-stone-800">{getClientName(t.clientId)}</span>
                                            <span className="text-xs text-stone-400 font-medium">#{t.displayId}</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="text-2xl font-black text-stone-800">${formatMoney(t.total)}</div>
                                            <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${tag.color} flex items-center gap-1`}>
                                                <tag.icon className="w-3 h-3"/> {tag.label}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-3 border-t border-stone-100">
                                        <button onClick={() => handleNotifyClient(t)} className="flex-1 py-2.5 bg-green-50 text-green-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-green-100"><MessageCircle className="w-4 h-4"/> Avisar</button>
                                        <button onClick={() => handleDeliverOrder(t)} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-blue-700"><Truck className="w-4 h-4"/> Despachar</button>
                                        <button onClick={() => handleVoidTransaction(t)} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="mb-8">
                    <h2 className="font-bold text-xl mb-4 flex items-center gap-3 text-stone-800"><ShoppingBag className="w-6 h-6 text-amber-500"/> Por Encargar / Por Llegar</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredSales.pending.filter(t => t.saleStatus !== 'pending_delivery').map(t => {
                            const tag = getOrderTag(t);
                            return (
                             <div key={t.id} className="p-5 bg-white rounded-2xl shadow-sm border border-l-4 border-l-stone-300 opacity-90 hover:opacity-100 transition-opacity">
                                <div onClick={() => setReceiptDetails(t)} className="cursor-pointer">
                                    <div className="flex justify-between mb-3"><span className="font-bold text-lg text-stone-800">{getClientName(t.clientId)}</span>
                                        <span className="text-xs text-stone-400">#{t.displayId}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="text-2xl font-black text-stone-800">${formatMoney(t.total)}</div>
                                        <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${tag.color} flex items-center gap-1`}>
                                            <tag.icon className="w-3 h-3"/> {tag.label}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-3 border-t border-stone-100">
                                    <button className="flex-1 py-2.5 bg-stone-100 text-stone-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-default"><Clock className="w-4 h-4"/> Esperando Stock</button>
                                    <button onClick={() => handleVoidTransaction(t)} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            </div>
                        )})}
                    </div>
                </div>

                <div>
                    <h2 className="font-bold text-xl mb-4 flex items-center gap-3 text-stone-800"><History className="w-6 h-6 text-stone-400"/> Historial Ventas</h2>
                    <div className="space-y-3">
                        {filteredSales.completed.slice(0, 10).map(t => (<div key={t.id} onClick={() => setReceiptDetails(t)} className="p-4 bg-white rounded-xl shadow-sm border border-stone-100 cursor-pointer hover:bg-stone-50 transition-colors flex justify-between items-center"><div className="flex flex-col"><span className="font-bold text-sm text-stone-800">{getClientName(t.clientId)}</span>
                        <span className="text-xs text-stone-400">{formatDateSimple(t.date.seconds)} • #{t.displayId}</span>
                        </div><div className="text-right"><div className="font-bold text-stone-800">${formatMoney(t.total)}</div><div className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full inline-block">ENTREGADO</div></div></div>))}
                    </div>
                </div>
            </div>
        )}

      </main>

      {/* --- MODALES --- */}
      {/* ... (Modales anteriores se mantienen igual, solo ajustar estilos si es necesario) */}
      
    </div>
  );
}

function SidebarButton({ icon, label, active, onClick }) {
    return (
        <button onClick={onClick} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${active ? 'bg-orange-50 text-orange-700 shadow-sm' : 'text-green-100 hover:bg-green-800 hover:text-white'}`}>
            {React.cloneElement(icon, { className: `w-5 h-5 ${active ? 'stroke-2' : ''}` })}
            <span className={`text-sm font-medium ${active ? 'font-bold' : ''}`}>{label}</span>
        </button>
    )
}
