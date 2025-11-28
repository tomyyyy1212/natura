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
  Lock
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
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
  where 
} from 'firebase/firestore';
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

// --- CONSTANTES ---
const BRANDS = ['Natura', 'Avon', 'Cyzone', 'Esika', 'L\'Bel'];
const WEB_SUPPLIERS = ['Natura Web', 'Esika Web', 'L\'Bel Web'];
const COURIERS = ['Yo (Directo)', 'Mamá (Puesto Feria)', 'Tía Luisa']; 

// --- HELPER PARA ID CORTO ---
const generateShortId = () => {
  const number = Math.floor(100 + Math.random() * 900); // 3 dígitos
  const letters = String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                  String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                  String.fromCharCode(65 + Math.floor(Math.random() * 26)); // 3 letras
  return `${number}-${letters}`;
};

// --- COMPONENTE INPUT DINERO EN VIVO ---
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

export default function PosApp() {

  // --- FUNCIONES AUXILIARES ---
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
    
  // Estados Principales
  const [user, setUser] = useState(null); 
  const [view, setView] = useState('pos'); 
    
  // Data Collections
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [inventoryBatches, setInventoryBatches] = useState([]); 
    
  // Cart & UI State
  const [cart, setCart] = useState([]);
  const [selectedClient, setSelectedClient] = useState(''); 
  const [selectedSupplier, setSelectedSupplier] = useState('');
  
  // Checkout Logic State
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [paymentPlanType, setPaymentPlanType] = useState('full'); 
  
  // ESTADO CHECKOUT
  const [checkoutData, setCheckoutData] = useState({
      installmentsCount: 3,
      installmentDates: {}, 
  });

  const [paymentMethod, setPaymentMethod] = useState('Efectivo'); 
  const [editingTransactionId, setEditingTransactionId] = useState(null); 
  const [originalBatchesMap, setOriginalBatchesMap] = useState({}); 
    
  const [loading, setLoading] = useState(true); 
  const [searchTerm, setSearchTerm] = useState('');
  const [processingMsg, setProcessingMsg] = useState(''); 

  // SALES MODE STATE
  const [salesMode, setSalesMode] = useState(null); // 'stock', 'cycle', 'exchange'

  // Alertas y Confirmaciones
  const [alertState, setAlertState] = useState({ show: false, title: '', message: '', type: 'info' }); 
  const [confirmationState, setConfirmationState] = useState({ show: false, title: '', message: '', type: 'neutral', onConfirm: null });
  
  const triggerAlert = (title, message, type = 'error') => {
      setAlertState({ show: true, title, message, type });
  };

  const [confirmDeliveryModal, setConfirmDeliveryModal] = useState({ show: false, transaction: null });
  const [deliveryDateInput, setDeliveryDateInput] = useState(new Date().toISOString().split('T')[0]);

  // Modales
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [showPreTicket, setShowPreTicket] = useState(false); 
  const [showStockAlertModal, setShowStockAlertModal] = useState(false); 
  const [showCatalogModal, setShowCatalogModal] = useState(false); 
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [showExpiringModal, setShowExpiringModal] = useState(false);
  const [showPendingOrdersModal, setShowPendingOrdersModal] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [viewingHistoryProduct, setViewingHistoryProduct] = useState(null);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [deliveryTransaction, setDeliveryTransaction] = useState(null);
  const [deliveryPaymentMethod, setDeliveryPaymentMethod] = useState('Efectivo');
  const [selectedCourier, setSelectedCourier] = useState('Yo (Directo)');
  const [editingProduct, setEditingProduct] = useState(null);
  const [productPriceInput, setProductPriceInput] = useState(''); 
  const [receiptDetails, setReceiptDetails] = useState(null);
  const [productHistory, setProductHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [orderSource, setOrderSource] = useState(null);
  const [catalogBrand, setCatalogBrand] = useState(''); 
  const [installmentInfo, setInstallmentInfo] = useState({ isInstallments: false, count: 1 });
  const [checkInOrder, setCheckInOrder] = useState(null); 
  const [checkInItems, setCheckInItems] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL'); 
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showClientOptions, setShowClientOptions] = useState(false);
  const clientInputRef = useRef(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPaymentTx, setSelectedPaymentTx] = useState(null);
  const [selectedPaymentIndex, setSelectedPaymentIndex] = useState(null); 
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [paymentReceiptFile, setPaymentReceiptFile] = useState(null); 
  const [reportPhones, setReportPhones] = useState(() => {
      try {
        const saved = localStorage.getItem('stock_report_phones');
        return saved ? JSON.parse(saved) : { phone1: '', phone2: '' };
      } catch (e) {
        return { phone1: '', phone2: '' };
      }
  });

  useEffect(() => {
      localStorage.setItem('stock_report_phones', JSON.stringify(reportPhones));
  }, [reportPhones]);

  const [reportStartDate, setReportStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-CA'); 
  });
  const [reportEndDate, setReportEndDate] = useState(() => {
    return new Date().toLocaleDateString('en-CA'); 
  });

  // --- HELPER: CYCLE MAP ---
  const cycleMap = useMemo(() => {
    return cycles.reduce((acc, c) => ({ ...acc, [c.id]: c.name }), {});
  }, [cycles]);

  // --- LOGICA DE AUTODETECCIÓN DE STOCK ---
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
            missing.push({ ...item, currentStock });
            canDeliverAll = false;
        }
    });
    return { available, missing, canDeliverAll };
  }, [cart, products]);

  // --- ESTADO DERIVADO PARA DELIVERY TYPE ---
  const [deliveryType, setDeliveryType] = useState('immediate'); // 'immediate' | 'order'

  // Actualizar deliveryType cuando cambia el análisis de stock
  useEffect(() => {
    if (isCheckoutModalOpen) {
        if (stockAnalysis.canDeliverAll) {
            setDeliveryType('immediate');
        } else {
            setDeliveryType('order');
        }
        // Reset dates on open
        setCheckoutData(prev => ({...prev, installmentDates: {}}));
    }
  }, [isCheckoutModalOpen, stockAnalysis.canDeliverAll]);

  // Auth & Sync
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

  // --- CALCULO DE FECHAS DE PAGO (Manual para Cuotas) ---
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

  // --- LOGIC FOR CYCLES ---
  const activeCycle = useMemo(() => {
      return cycles.find(c => c.status === 'open') || null;
  }, [cycles]);

  // --- GUARDAR VENTA (MODIFIED TO HANDLE SALES MODE) ---
  const handleConfirmCheckout = async () => {
    if (!selectedClient) { triggerAlert("Falta Cliente", "Selecciona un cliente.", "error"); return; }
    
    const total = cart.reduce((acc, item) => acc + (item.transactionPrice * item.qty), 0);
    const totalPoints = cart.reduce((acc, item) => acc + ((item.points || 0) * item.qty), 0);
    
    // Validar Fechas de Cuotas
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
    setProcessingMsg("Registrando...");

    try {
        const batch = writeBatch(db);
        const newTransId = doc(collection(db, `artifacts/${APP_ID}/public/data/transactions`)).id;
        const displayId = generateShortId();
        const now = new Date();

        // FIFO Logic (Solo si es venta inmediata de stock)
        let transactionFIFO = 0;
        let finalItems = [...cart];
        let saleStatus = 'pending_order'; // Por defecto

        // LOGIC BASED ON SALES MODE
        if (salesMode === 'cycle') {
            saleStatus = 'pending_cycle'; // Acumulado en ciclo
        } else if (salesMode === 'exchange') {
            saleStatus = 'pending_arrival'; // Waiting for the exchange item to arrive
        } else {
            // STOCK / WEB MODE
            if (stockAnalysis.canDeliverAll) {
                 saleStatus = 'pending_delivery'; 
                 for (let item of finalItems) {
                     const { totalCost, batchUpdates, fifoDetails } = await calculateFIFOCost(item.id, item.qty);
                     item.fifoTotalCost = totalCost; 
                     item.fifoDetails = fifoDetails;
                     transactionFIFO += totalCost;
                     batchUpdates.forEach(u => batch.update(doc(db, `artifacts/${APP_ID}/public/data/inventory_batches`, u.id), { remainingQty: u.newRemainingQty }));
                     batch.update(doc(db, `artifacts/${APP_ID}/public/data/products`, item.id), { stock: increment(-item.qty) });
                 }
            } else {
                // NO HAY STOCK EN VENTA STOCK -> ES PEDIDO WEB
                saleStatus = 'pending_web';
            }
        }

        const margin = total - transactionFIFO;
        const paymentSchedule = calculatePaymentSchedule(total, paymentPlanType, checkoutData);
        
        const transactionData = {
            id: newTransId, 
            displayId: displayId,
            type: 'sale',
            items: finalItems,
            total: total,
            totalPoints: totalPoints, // Save points
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
            saleStatus: saleStatus, 
            origin: salesMode === 'cycle' ? 'cycle' : (salesMode === 'exchange' ? 'exchange' : 'POS'),
            cycleId: salesMode === 'cycle' && activeCycle ? activeCycle.id : null, // Link to cycle if applicable
            courier: null,
            deliveredAt: null,
            finalizedAt: null 
        };

        batch.set(doc(db, `artifacts/${APP_ID}/public/data/transactions`, newTransId), transactionData);
        await batch.commit();
        
        clearCart();
        setIsCheckoutModalOpen(false);
        setCheckoutData({ installmentsCount: 3, installmentDates: {}, downPayment: '' }); 
        setSalesMode(null); // Reset mode

        let successMsg = "Venta registrada.";
        if (salesMode === 'cycle') successMsg = `Agregado al Ciclo ${activeCycle?.name}.`;
        if (salesMode === 'exchange') successMsg = "Intercambio registrado por llegar.";
        if (saleStatus === 'pending_web') successMsg = "Falta stock: Registrado como Pedido Web.";

        triggerAlert("Éxito", successMsg, "success");

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

  const handleSendStockReport = (phoneNumber) => {
      if (!phoneNumber) { triggerAlert("Falta número", "Ingresa un número de teléfono.", "info"); return; }
      const lowStockItems = products.filter(p => p.stock < 4);
      if (lowStockItems.length === 0) { triggerAlert("Todo bien", "No hay productos con stock bajo.", "success"); return; }
      let message = `🚨 *REPORTE STOCK* 🚨\nFecha: ${new Date().toLocaleDateString()}\n\n`;
      lowStockItems.forEach(p => message += `- ${p.name}: ${p.stock} u.\n`);
      window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
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
          message += `- ${i.name} x${i.qty}\n`;
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
          if (t.type === 'sale' && (t.saleStatus === 'completed' || t.saleStatus === 'in_transit')) { 
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
      } else if (transaction.saleStatus === 'pending_order') {
          confirmTitle = "Cancelar Encargo";
          confirmMsg = "¿Cancelar encargo del cliente?";
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
                  if (transaction.saleStatus === 'completed' || transaction.saleStatus === 'in_transit' || transaction.saleStatus === 'pending_delivery') { 
                      (transaction.items || []).forEach(item => {
                          const productRef = doc(db, `artifacts/${APP_ID}/public/data/products`, item.id);
                          const adjustment = transaction.type === 'sale' ? item.qty : -item.qty;
                          batch.update(productRef, { stock: increment(adjustment) });
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
      setDeliveryPaymentMethod('Efectivo');
      setSelectedCourier('Yo (Directo)'); 
      setIsDeliveryModalOpen(true);
  };

  const startDeliveryProcess = async () => {
      if (!deliveryTransaction) return;
      setLoading(true);
      setProcessingMsg(selectedCourier === 'Yo (Directo)' ? "Cerrando Venta..." : "Enviando a Reparto...");
      
      try {
          const batch = writeBatch(db);
          
          let finalTotalCost = deliveryTransaction.totalCost;
          const updatedItems = [];
          
          if (deliveryTransaction.saleStatus === 'pending_order' || deliveryTransaction.saleStatus === 'pending_arrival' || deliveryTransaction.saleStatus === 'pending_web') {
              finalTotalCost = 0; // Recalculamos costo FIFO porque recién sale
              for (const item of (deliveryTransaction.items || [])) {
                   const { totalCost, batchUpdates, fifoDetails } = await calculateFIFOCost(item.id, item.qty);
                   finalTotalCost += totalCost;
                   updatedItems.push({
                       ...item,
                       fifoTotalCost: totalCost,
                       fifoDetails: fifoDetails
                   });
                   batchUpdates.forEach(u => batch.update(doc(db, `artifacts/${APP_ID}/public/data/inventory_batches`, u.id), { remainingQty: u.newRemainingQty }));
                   batch.update(doc(db, `artifacts/${APP_ID}/public/data/products`, item.id), { stock: increment(-item.qty) });
              }
          } else {
              updatedItems.push(...(deliveryTransaction.items || []));
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
      // Ensure points are passed to cart item, init isMagazinePrice false
      return [...prev, { ...product, transactionPrice: view === 'purchases' ? 0 : product.price, qty: 1, expirationDate: '', points: product.points || 0, isMagazinePrice: false, originalPrice: product.price }];
    });
  };

  const toggleMagazinePrice = (id) => setCart(prev => prev.map(p => {
      if(p.id === id) {
          const newIsMagazine = !p.isMagazinePrice;
          return {
              ...p,
              isMagazinePrice: newIsMagazine,
              transactionPrice: newIsMagazine ? 0 : p.originalPrice // Reset to 0 if switching to magazine so user types it, or keep old? Better 0 to force entry
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
  const updateExpirationDate = (id, d) => setCart(prev => prev.map(i => i.id === id ? { ...i, expirationDate: d } : i));
  const updateCheckInDate = (tempId, date) => setCheckInItems(prev => prev.map(i => i._tempId === tempId ? { ...i, expirationDate: date } : i));

  const clearCart = () => { 
      setCart([]); setSelectedClient(''); setClientSearchTerm(''); setSelectedSupplier(''); 
      setPaymentMethod(''); setEditingTransactionId(null); 
      setOriginalBatchesMap({}); 
      setOrderSource(null);
      setCatalogBrand(''); 
      setSelectedCycle(''); 
      setInstallmentInfo({ isInstallments: false, count: 1 });
      setDeliveryType('immediate');
      setPaymentPlanType('full');
      setCheckoutData({ installmentsCount: 3, installmentDates: {} });
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
            installments: installmentInfo.isInstallments ? installmentInfo.count : 1,
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
          });

          const transRef = doc(db, `artifacts/${APP_ID}/public/data/transactions`, checkInOrder.id);
          batch.update(transRef, {
              type: isInvestment ? 'stock_entry' : 'purchase', // Mark as stock_entry if investment to hide from sales/receipts
              saleStatus: 'completed',
              checkInDate: { seconds: Date.now() / 1000 }
          });

          await batch.commit();
          setCheckInOrder(null);
          setCheckInItems([]);
          triggerAlert("Stock Actualizado", "Productos ingresados correctamente.", "success");

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
      let matchesStock = true;
      if (stockFilter === 'CRITICAL') matchesStock = p.stock <= 1;
      if (stockFilter === 'LOW') matchesStock = p.stock > 1 && p.stock < 4;
      if (stockFilter === 'GOOD') matchesStock = p.stock >= 4;
      return matchesSearch && matchesCategory && matchesStock;
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
          pending_order: all.filter(t => t.saleStatus === 'pending_order'),
          inTransit: all.filter(t => t.saleStatus === 'in_transit'),
          pending_cycle: all.filter(t => t.saleStatus === 'pending_cycle'),
          pending_arrival: all.filter(t => t.saleStatus === 'pending_arrival'),
          pending_web: all.filter(t => t.saleStatus === 'pending_web'),
      };
  }, [transactions]);

  const filteredOrders = useMemo(() => {
      return transactions.filter(t => (t.type === 'order' && t.saleStatus === 'pending_arrival') || (t.type === 'purchase' || t.type === 'stock_entry'));
  }, [transactions]);

  const pendingArrivals = useMemo(() => {
      const stockOrders = filteredOrders.filter(t => t.saleStatus === 'pending_arrival');
      const clientOrders = filteredSales.pending_arrival;
      return [...stockOrders, ...clientOrders].sort((a,b) => a.date.seconds - b.date.seconds);
  }, [filteredOrders, filteredSales]);

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

  const expiringProducts = useMemo(() => {
      const expiring = inventoryBatches.filter(b => b.remainingQty > 0 && b.expirationDate);
      expiring.sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));
      return expiring.slice(0, 10); 
  }, [inventoryBatches]);

  const pendingOrdersData = useMemo(() => {
      const pendingMap = {}; 
      const tempStock = {}; 
      products.forEach(p => tempStock[p.id] = p.stock);
      const pendingTrans = transactions.filter(t => t.type === 'sale' && (t.saleStatus === 'pending' || t.saleStatus === 'pending_order'));
      pendingTrans.sort((a,b) => (a.date.seconds - b.date.seconds));
      pendingTrans.forEach(t => {
          (t.items || []).forEach(item => {
               const product = products.find(p => p.id === item.id);
               const brand = product ? product.brand : (item.brand || 'Sin Marca');
               const currentStock = tempStock[item.id] || 0;
               if (currentStock < item.qty) {
                   const missingQty = item.qty - currentStock;
                   if (!pendingMap[brand]) pendingMap[brand] = [];
                   const existingItem = pendingMap[brand].find(i => i.id === item.id);
                   if (existingItem) { existingItem.qty += missingQty; } else { pendingMap[brand].push({ ...item, qty: missingQty }); }
                   tempStock[item.id] = 0;
               } else { tempStock[item.id] -= item.qty; }
          });
      });
      return pendingMap;
  }, [transactions, products]);

  // --- LOGIC FOR CYCLES VIEW ---
  
  const activeCycleStats = useMemo(() => {
      const activeCycle = cycles.find(c => c.status === 'open') || null;
      if (!activeCycle) return { totalPoints: 0, clientPoints: 0, stockPoints: 0, progress: 0, orders: [], remainingDays: 0 };
      
      const ordersInCycle = transactions.filter(t => 
          (t.type === 'order' || t.type === 'sale') && 
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
          message: `¿Estás seguro de cerrar el ciclo "${activeCycle.name}"?\n\nTodos los pedidos pendientes pasarán a estado "Por Llegar".`,
          type: "neutral",
          onConfirm: async () => {
              setConfirmationState(prev => ({ ...prev, show: false }));
              setLoading(true);
              setProcessingMsg("Generando pedidos...");
              
              try {
                  const batch = writeBatch(db);
                  const cycleOrders = activeCycleStats.orders;
                  
                  // Update all cycle orders to pending_arrival
                  cycleOrders.forEach(order => {
                      batch.update(doc(db, `artifacts/${APP_ID}/public/data/transactions`, order.id), {
                          saleStatus: 'pending_arrival',
                          orderedAt: new Date().toISOString()
                      });
                  });
                  
                  // Close cycle
                  batch.update(doc(db, `artifacts/${APP_ID}/public/data/cycles`, activeCycle.id), {
                      status: 'closed',
                      closedAt: new Date().toISOString()
                  });
                  
                  await batch.commit();
                  triggerAlert("Ciclo Cerrado", "Los pedidos se han generado correctamente.", "success");
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
          case 'purchases': return 'Compras'; 
          case 'receipts': return 'Pedidos'; 
          case 'inventory': return 'Inventario';
          case 'reports': return 'Reportes';
          case 'finances': return 'Deudores';
          case 'clients': return 'Clientes';
          default: return view;
      }
  };

  const setQuickDate = (type) => {
      const now = new Date();
      const formatDate = (d) => d.toLocaleDateString('en-CA');
      let start = new Date();
      let end = new Date();
      if (type === 'today') { /* no op */ }
      else if (type === 'yesterday') { start.setDate(start.getDate() - 1); end.setDate(end.getDate() - 1); }
      else if (type === 'week') { start.setDate(start.getDate() - start.getDay() + (start.getDay() === 0 ? -6 : 1)); }
      else if (type === 'month') { start.setDate(1); }
      setReportStartDate(formatDate(start)); setReportEndDate(formatDate(end));
  };

  const reportData = useMemo(() => {
    const start = new Date(`${reportStartDate}T00:00:00`);
    const end = new Date(`${reportEndDate}T23:59:59.999`);
    const reportTrans = transactions.filter(t => t.type === 'sale' && t.saleStatus === 'completed' && t.date && t.date.seconds && new Date(t.date.seconds * 1000) >= start && new Date(t.date.seconds * 1000) <= end);
    
    const totalSales = reportTrans.reduce((acc, t) => acc + t.total, 0);
    const totalCost = reportTrans.reduce((acc, t) => acc + (t.totalCost || 0), 0);
    const margin = totalSales - totalCost;
    
    const productMap = new Map();
    reportTrans.forEach(t => (t.items || []).forEach(i => {
        const ex = productMap.get(i.id) || { name: i.name, qty: 0, revenue: 0 };
        productMap.set(i.id, { ...ex, qty: ex.qty + i.qty, revenue: ex.revenue + (i.qty * i.transactionPrice) });
    }));
    const productRanking = Array.from(productMap.values()).sort((a,b) => b.revenue - a.revenue).slice(0, 5);

    const clientMap = new Map();
    reportTrans.forEach(t => {
        const cname = getClientName(t.clientId);
        const ex = clientMap.get(cname) || { name: cname, count: 0, total: 0 };
        clientMap.set(cname, { ...ex, count: ex.count + 1, total: ex.total + t.total });
    });
    const clientRanking = Array.from(clientMap.values()).sort((a,b) => b.total - a.total).slice(0, 5);

    const timeline = {};
    reportTrans.forEach(t => {
        if (t.date && t.date.seconds) {
            const d = new Date(t.date.seconds * 1000);
            const k = d.toISOString().split('T')[0]; 
            timeline[k] = (timeline[k] || 0) + t.total;
        }
    });
    const timelineData = Object.entries(timeline).sort((a,b) => a[0].localeCompare(b[0])).map(([k,v]) => {
        const [y,m,d] = k.split('-');
        return { date: `${d}/${m}`, total: v };
    });

    return { totalSales, totalCost, margin, marginPercent: totalSales > 0 ? (margin/totalSales)*100 : 0, productRanking, clientRanking, timelineData };
  }, [transactions, reportStartDate, reportEndDate]);

  if (!user && loading) return <div className="flex h-screen items-center justify-center bg-stone-100 text-orange-600">Iniciando...</div>;

  return (
    <div className="flex flex-col h-screen bg-stone-50 text-stone-800 font-sans overflow-hidden relative">
      
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
                <button onClick={() => setAlertState({...alertState, show: false})} className="w-full py-2 bg-stone-900 text-white rounded-lg font-bold">OK</button>
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
                    <button onClick={confirmationState.onConfirm} className={`flex-1 py-2 text-white rounded-lg font-bold ${confirmationState.type === 'danger' ? 'bg-red-600' : 'bg-stone-900'}`}>Confirmar</button>
                </div>
            </div>
        </div>
      )}

      <header className={`${view === 'purchases' ? 'bg-stone-800' : view === 'receipts' ? 'bg-stone-700' : view === 'finances' ? 'bg-emerald-700' : 'bg-orange-500'} text-white p-2 shadow-md flex justify-between items-center z-10 shrink-0`}>
        <h1 className="font-bold text-base flex items-center gap-2">
            {view === 'pos' ? <Leaf className="w-5 h-5"/> : view === 'inventory' ? <Package className="w-5 h-5"/> : view === 'finances' ? <DollarSign className="w-5 h-5"/> : <LayoutDashboard className="w-5 h-5"/>} 
            {getHeaderTitle()}
        </h1>
      </header>

      <main className={`flex-1 overflow-hidden relative flex flex-col ${view !== 'pos' && view !== 'purchases' ? 'overflow-y-auto' : ''}`}>
        
        {(view === 'pos') && (
            <div className="flex flex-col h-full relative">
                {/* SALES MODE SELECTOR OVERLAY */}
                {salesMode === null && (
                    <div className="absolute inset-0 z-20 bg-stone-50 flex flex-col p-6 animate-in fade-in duration-300">
                        <div className="mb-8 text-center">
                            <h2 className="text-2xl font-black text-stone-800 mb-2">Nueva Venta</h2>
                            <p className="text-stone-500">¿Qué tipo de transacción deseas realizar?</p>
                        </div>
                        
                        <div className="flex flex-col gap-4 max-w-md w-full mx-auto">
                            <button onClick={() => setSalesMode('stock')} className="bg-white p-6 rounded-2xl shadow-sm border-2 border-transparent hover:border-orange-500 flex items-center gap-4 group transition-all">
                                <div className="p-3 bg-orange-100 text-orange-600 rounded-xl group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                    <ShoppingBag className="w-8 h-8"/>
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-lg text-stone-800">Venta Stock / Web</h3>
                                    <p className="text-xs text-stone-400">Venta inmediata de productos existentes o compra web directa.</p>
                                </div>
                            </button>

                            <button onClick={() => {
                                const activeCycle = cycles.find(c => c.status === 'open');
                                if(!activeCycle) { triggerAlert("Sin Ciclo", "No hay ciclo activo para agregar pedidos.", "info"); return; }
                                setSalesMode('cycle');
                            }} className="bg-white p-6 rounded-2xl shadow-sm border-2 border-transparent hover:border-blue-500 flex items-center gap-4 group transition-all">
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <Repeat className="w-8 h-8"/>
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-lg text-stone-800">Agregar al Ciclo</h3>
                                    <p className="text-xs text-stone-400">Sumar puntos a la meta del ciclo actual (Encargo).</p>
                                </div>
                            </button>

                            <button onClick={() => setSalesMode('exchange')} className="bg-white p-6 rounded-2xl shadow-sm border-2 border-transparent hover:border-purple-500 flex items-center gap-4 group transition-all">
                                <div className="p-3 bg-purple-100 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                    <ArrowRight className="w-8 h-8"/>
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-lg text-stone-800">Intercambio</h3>
                                    <p className="text-xs text-stone-400">Productos conseguidos con otras consultoras.</p>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                <div className="p-2 bg-white border-b shadow-sm space-y-2">
                    {salesMode && (
                        <div className={`px-3 py-2 rounded-lg text-sm font-bold flex justify-between items-center ${salesMode === 'cycle' ? 'bg-blue-50 text-blue-700' : salesMode === 'exchange' ? 'bg-purple-50 text-purple-700' : 'bg-orange-50 text-orange-700'}`}>
                            <span className="flex items-center gap-2">
                                {salesMode === 'cycle' ? <Repeat className="w-4 h-4"/> : salesMode === 'exchange' ? <ArrowRight className="w-4 h-4"/> : <ShoppingBag className="w-4 h-4"/>}
                                Modo: {salesMode === 'cycle' ? `Ciclo ${cycles.find(c => c.status === 'open')?.name || '...'}` : salesMode === 'exchange' ? 'Intercambio' : 'Venta Stock'}
                            </span>
                            <button onClick={() => { setSalesMode(null); clearCart(); }} className="text-xs underline opacity-80">Cambiar</button>
                        </div>
                    )}
                    <div className="relative"><Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400"/><input className="w-full pl-9 p-2 bg-stone-100 rounded-lg text-sm" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/></div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar"><button onClick={() => setSelectedCategoryFilter('ALL')} className={`px-3 py-1 rounded-full border text-xs whitespace-nowrap ${selectedCategoryFilter === 'ALL' ? 'bg-orange-600 text-white' : 'bg-white'}`}>Todos</button>{categories.map(c => <button key={c.id} onClick={() => setSelectedCategoryFilter(c.id)} className={`px-3 py-1 rounded-full border text-xs whitespace-nowrap ${selectedCategoryFilter === c.id ? 'bg-orange-600 text-white' : 'bg-white'}`}>{c.name}</button>)}</div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 bg-stone-50 pb-48">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {filteredProducts.map(p => (
                            <button key={p.id} onClick={() => addToCart(p)} className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col h-full group hover:shadow-md transition-all text-left">
                                <div className="aspect-square w-full relative">
                                    {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <Leaf className="w-full h-full p-8 text-stone-200" />}
                                    {p.stock <= 0 && <div className="absolute inset-0 bg-black/10 flex items-end justify-center p-1"><span className="text-[10px] font-bold bg-red-500 text-white px-2 rounded">Sin Stock</span></div>}
                                </div>
                                <div className="p-2 flex flex-col flex-1 justify-between">
                                    <span className="font-bold text-sm line-clamp-2 leading-tight text-stone-700">{p.name}</span>
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
                    <div className="fixed bottom-[76px] left-0 w-full z-20 flex flex-col shadow-2xl">
                        <div className="rounded-t-3xl border-t p-4 bg-white">
                            <div className="max-h-48 overflow-y-auto mb-2 space-y-2">
                                {cart.map(item => (
                                    <div key={item.id} className="border-b pb-3 last:border-0">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                    <div className="text-sm font-bold line-clamp-1 text-stone-800">{item.name}</div>
                                                    <div className="text-xs text-stone-500">${formatMoney(item.transactionPrice)} x {item.qty}</div>
                                                </div>
                                                <button onClick={() => removeFromCart(item.id)} className="text-red-400 p-1"><X className="w-4 h-4"/></button>
                                            </div>
                                            
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center bg-stone-100 rounded-lg h-8">
                                                    <button onClick={() => updateQty(item.id, -1)} className="px-2 h-full flex items-center"><Minus className="w-3 h-3"/></button>
                                                    <span className="text-sm font-bold w-8 text-center">{item.qty}</span>
                                                    <button onClick={() => updateQty(item.id, 1)} className="px-2 h-full flex items-center"><Plus className="w-3 h-3"/></button>
                                                </div>
                                                
                                                <div className="flex-1 flex flex-col items-end gap-1">
                                                    {/* TOGGLE FOR MAGAZINE PRICE (STOCK & CYCLE) */}
                                                    <div className="flex bg-stone-100 p-0.5 rounded-lg">
                                                        <button 
                                                            onClick={() => toggleMagazinePrice(item.id)} 
                                                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${!item.isMagazinePrice ? 'bg-white shadow text-stone-800' : 'text-stone-400'}`}
                                                        >
                                                            Actual
                                                        </button>
                                                        <button 
                                                            onClick={() => toggleMagazinePrice(item.id)}
                                                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${item.isMagazinePrice ? 'bg-white shadow text-blue-600' : 'text-stone-400'}`}
                                                        >
                                                            Revista
                                                        </button>
                                                    </div>
                                                    
                                                    <MoneyInput 
                                                        className={`w-24 border-b text-sm font-bold text-right outline-none bg-transparent ${item.isMagazinePrice ? 'border-blue-300 text-blue-600' : 'border-stone-300 text-stone-800'}`} 
                                                        value={item.transactionPrice === 0 ? '' : item.transactionPrice} 
                                                        placeholder="Precio" 
                                                        onChange={val => updateTransactionPrice(item.id, val || 0)}
                                                        disabled={!item.isMagazinePrice} 
                                                    />
                                                </div>
                                            </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => { setIsCheckoutModalOpen(true); }} className="w-full h-14 bg-stone-900 text-white rounded-xl font-bold flex justify-between px-6 items-center shadow-lg hover:bg-stone-800 transition-all">
                                <span className="flex items-center gap-2 text-lg">Ir a Pagar <ChevronRight className="w-5 h-5"/></span>
                                <span className="text-xl">${formatMoney(cartTotal)}</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* --- NUEVA VISTA DE CICLOS --- */}
        {view === 'cycles' && (
            <div className="p-4 overflow-y-auto pb-24 h-full bg-stone-50">
                {(() => {
                    const activeCycle = cycles.find(c => c.status === 'open');
                    if (!activeCycle) {
                        return (
                            <div className="flex flex-col items-center justify-center h-full text-center p-6">
                                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full">
                                    <Target className="w-16 h-16 text-orange-500 mx-auto mb-4"/>
                                    <h2 className="text-2xl font-black text-stone-800 mb-2">Sin Ciclo Activo</h2>
                                    <p className="text-stone-500 mb-6">Inicia un nuevo ciclo de ventas para comenzar a acumular puntos y pedidos.</p>
                                    <button onClick={() => setIsCycleModalOpen(true)} className="w-full py-4 bg-stone-900 text-white rounded-2xl font-bold text-lg shadow-lg">Iniciar Nuevo Ciclo</button>
                                </div>
                            </div>
                        );
                    }
                    return (
                    <div className="space-y-6">
                        {/* Dashboard del Ciclo */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <div className="text-xs font-bold text-stone-400 uppercase tracking-widest">Ciclo Actual</div>
                                    <h2 className="text-3xl font-black text-stone-800">{activeCycle.name}</h2>
                                    <div className="text-xs text-orange-600 font-bold mt-1 flex items-center gap-1">
                                        <Clock className="w-3 h-3"/> Cierra en {activeCycleStats.remainingDays} días
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold text-stone-400 uppercase">Meta</div>
                                    <div className="text-xl font-bold text-stone-800">{activeCycle.goal} pts</div>
                                </div>
                            </div>

                            {/* Barra de Progreso */}
                            <div className="mb-2">
                                <div className="flex justify-between text-sm font-bold mb-1">
                                    <span className="text-orange-600">{activeCycleStats.totalPoints} pts</span>
                                    <span className="text-stone-400">{Math.round(activeCycleStats.progress)}%</span>
                                </div>
                                <div className="h-4 bg-stone-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-1000" style={{ width: `${Math.min(activeCycleStats.progress, 100)}%` }}></div>
                                </div>
                            </div>
                            
                            <div className="text-center mt-2 text-xs font-medium text-stone-500">
                                {activeCycleStats.totalPoints >= activeCycle.goal 
                                    ? <span className="text-green-600 font-bold flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3"/> ¡Meta Alcanzada!</span> 
                                    : `Faltan ${activeCycle.goal - activeCycleStats.totalPoints} puntos para el pedido.`
                                }
                            </div>

                            <button 
                                onClick={() => {
                                    clearCart();
                                    setSelectedCycle(activeCycle.id);
                                    setSelectedSupplier('Para Inversión'); // Use correct client for investment
                                    setOrderSource('cycle_stock'); // Mark as coming from cycle
                                    setView('purchases'); // Go to purchases
                                }}
                                className="w-full mt-6 py-3 bg-purple-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
                            >
                                <Plus className="w-5 h-5"/>
                                Agregar productos para inversión
                            </button>
                        </div>

                        {/* Lista de Pedidos en Ciclo - Restaurada a estilo moderno */}
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
                                        className="text-xs bg-stone-800 text-white px-3 py-1.5 rounded-lg font-bold shadow-md disabled:opacity-50 disabled:shadow-none hover:bg-stone-900 transition-colors"
                                    >
                                        Cerrar y Generar Pedidos
                                    </button>
                                )}
                            </div>
                            
                            {activeCycleStats.orders.length === 0 ? (
                                <div className="text-center py-12 text-stone-400 bg-stone-50 rounded-3xl border-2 border-dashed border-stone-200">
                                    <Package className="w-12 h-12 mx-auto mb-3 text-stone-300"/>
                                    <p>Aún no hay pedidos en este ciclo.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {activeCycleStats.orders.map(order => (
                                        <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex justify-between items-center group hover:shadow-md transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${order.clientId === 'Para Inversión' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                                    {order.clientId === 'Para Inversión' ? <Package className="w-5 h-5"/> : getClientName(order.clientId).charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-stone-800">{getClientName(order.clientId)}</div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${order.clientId === 'Para Inversión' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                                                            {order.clientId === 'Para Inversión' ? 'EN STOCK' : 'POR ENCARGAR'}
                                                        </span>
                                                        <span className="text-xs text-stone-400">• {order.items.length} prod.</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-stone-800">${formatMoney(order.total)}</div>
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
             <div className="p-4 pb-24">
                 <div className="mb-6 bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex flex-col items-center justify-center text-center">
                     <div className="p-3 bg-emerald-50 rounded-full mb-2"><DollarSign className="w-8 h-8 text-emerald-600"/></div>
                     <h2 className="font-bold text-lg mb-1 text-emerald-800">Cuentas por Cobrar</h2>
                     <div className="text-4xl font-black text-stone-800 tracking-tight mb-1">
                         ${formatMoney(pendingPaymentTransactions.reduce((acc, t) => acc + t.balance, 0))}
                     </div>
                     <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">Saldo Total Clientes</p>
                 </div>

                 <div className="space-y-4">
                     {pendingPaymentTransactions.length === 0 && <div className="text-center text-stone-400 py-10">¡Todo al día! No hay deudas pendientes.</div>}
                     {pendingPaymentTransactions.map(tx => (
                         <div key={tx.id} onClick={() => { setSelectedPaymentTx(tx); setPaymentModalOpen(true); setSelectedPaymentIndex(null); setPaymentAmountInput(''); setPaymentReceiptFile(null); }} className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all">
                             <div className="flex justify-between items-start mb-3">
                                 <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center font-bold text-stone-600">{getClientName(tx.clientId).charAt(0)}</div>
                                     <div>
                                         <div className="font-bold text-stone-800 text-lg">{getClientName(tx.clientId)}</div>
                                         <div className="text-xs text-stone-400">
                                            <span className="font-mono font-bold text-stone-600 bg-stone-100 px-1 rounded mr-1">#{tx.displayId}</span> 
                                            • {formatDateSimple(tx.date.seconds)} • {(tx.items || []).length} productos
                                         </div>
                                     </div>
                                 </div>
                                 <div className="bg-red-50 text-red-600 text-sm font-bold px-3 py-1 rounded-full border border-red-100">
                                     Debe: ${formatMoney(tx.balance)}
                                 </div>
                             </div>
                             
                             <div className="flex justify-between items-center text-xs mb-3 bg-stone-50 p-2 rounded-lg">
                                 <span className="text-stone-500">Total Venta: <strong>${formatMoney(tx.total)}</strong></span>
                                 <span className="font-bold text-emerald-600 bg-white px-2 py-0.5 rounded border border-emerald-100 shadow-sm">{tx.paymentPlanType === 'installments' ? 'En Cuotas' : 'Saldo Pendiente'}</span>
                             </div>
                             
                             <div className="relative w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                                 <div className="bg-emerald-500 h-full absolute left-0 top-0" style={{ width: `${((tx.total - tx.balance) / tx.total) * 100}%` }}></div>
                             </div>
                             <div className="text-[10px] text-right mt-1 text-stone-400">Pagado: {Math.round(((tx.total - tx.balance) / tx.total) * 100)}%</div>
                         </div>
                     ))}
                 </div>
             </div>
        )}

        {view === 'purchases' && (
            <div className="flex flex-col h-full">
                {checkInOrder ? (
                    <div className="flex flex-col h-full bg-white animate-in slide-in-from-bottom duration-300">
                        <div className="p-4 border-b bg-amber-50 flex justify-between items-center">
                            <div><h2 className="font-bold text-amber-800">Confirmar Llegada</h2><p className="text-xs text-amber-600">Ingresa vencimiento por unidad</p></div>
                            <button onClick={() => {setCheckInOrder(null); setCheckInItems([]);}} className="text-stone-400"><X/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            {checkInItems.map((item, idx) => (
                                <div key={item._tempId} className="mb-3 border rounded-xl p-3 bg-white shadow-sm flex flex-col gap-2">
                                    <div className="font-bold text-stone-700 flex gap-2 items-center"><span className="bg-stone-100 px-2 rounded text-xs text-stone-500">#{idx+1}</span>{item.name}</div>
                                    <div className="flex items-center gap-2 mt-1"><CalendarDays className="w-4 h-4 text-stone-400"/><input type="date" className={`flex-1 p-2 border rounded-lg text-sm font-medium ${!item.expirationDate ? 'border-red-300 bg-red-50' : 'border-green-200 bg-green-50'}`} value={item.expirationDate} onChange={(e) => updateCheckInDate(item._tempId, e.target.value)}/></div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t bg-white pb-24"><button onClick={confirmCheckIn} className="w-full py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-200">Confirmar e Ingresar Stock</button></div>
                    </div>
                ) : (
                    !orderSource ? (
                        <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
                            <div className="grid grid-cols-2 gap-4"><button onClick={() => setOrderSource('selection')} className="col-span-2 bg-stone-800 text-white p-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"><Plus className="w-6 h-6"/> <span className="font-bold text-lg">Nuevo Pedido</span></button></div>
                            <div>
                                <h3 className="font-bold text-stone-700 mb-3 flex items-center gap-2"><Clock className="w-5 h-5 text-amber-500"/> Por Llegar</h3>
                                <div className="space-y-3">{pendingArrivals.length === 0 && <div className="text-center text-sm text-stone-400 py-4 border-2 border-dashed rounded-xl">No hay pedidos pendientes</div>}{pendingArrivals.map(order => (<div key={order.id} onClick={() => startCheckIn(order)} className="bg-white border border-l-4 border-l-amber-500 p-4 rounded-xl shadow-sm cursor-pointer hover:bg-amber-50 transition-colors relative overflow-hidden">
                                            {/* ETIQUETAS INTELIGENTES DE ORIGEN */}
                                            {order.orderType === 'web' && (
                                                <div className="absolute right-0 top-0 bg-blue-100 text-blue-700 text-[9px] font-bold px-2 py-1 rounded-bl-xl uppercase">Compra Web #{order.displayId}</div>
                                            )}
                                            {(order.orderType === 'cycle_order' || order.orderType === 'cycle_stock') && order.cycleId && (
                                                <div className="absolute right-0 top-0 bg-orange-100 text-orange-700 text-[9px] font-bold px-2 py-1 rounded-bl-xl uppercase">
                                                    {cycleMap[order.cycleId] ? `Ciclo ${cycleMap[order.cycleId]}` : 'Ciclo'}
                                                </div>
                                            )}

                                            <div className="absolute top-6 right-3 text-[10px] font-bold text-stone-400 uppercase">{order.clientId === 'Para Inversión' ? 'Inversión' : order.clientId}</div>
                                            
                                            <div className="font-bold text-lg mb-1 pt-2">${formatMoney(order.total)}</div>
                                            <div className="text-xs text-stone-500 flex gap-3"><span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {formatDateSimple(order.date.seconds)}</span><span className="flex items-center gap-1"><Box className="w-3 h-3"/> {(order.items || []).length} prod.</span></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div><h3 className="font-bold text-stone-700 mb-3 flex items-center gap-2"><History className="w-5 h-5 text-stone-400"/> Historial Compras</h3><div className="space-y-2">{purchaseHistoryData.slice(0, 10).map(h => (<div key={h.id} className="bg-stone-50 p-3 rounded-xl flex justify-between items-center opacity-70 cursor-pointer" onClick={() => setReceiptDetails(h)}><div><div className="font-bold text-stone-700">${formatMoney(h.total)}</div><div className="text-[10px] text-stone-400">{formatDateSimple(h.date.seconds)} • {h.clientId}</div></div><div className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold">RECIBIDO</div></div>))}</div></div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full bg-stone-50">
                            {orderSource === 'selection' && (<div className="p-6 flex flex-col h-full"><div className="mb-6"><h2 className="text-2xl font-bold text-stone-800">¿Origen del Pedido?</h2></div><div className="grid grid-cols-1 gap-4 flex-1 content-start"><button onClick={() => setOrderSource('web')} className="p-6 bg-white rounded-2xl shadow-sm border-2 border-transparent hover:border-blue-500 text-left group"><h3 className="font-bold text-lg">Compra Web</h3></button><button onClick={() => setOrderSource('catalog')} className="p-6 bg-white rounded-2xl shadow-sm border-2 border-transparent hover:border-pink-500 text-left group"><h3 className="font-bold text-lg">Catálogo</h3></button></div><button onClick={() => setOrderSource(null)} className="py-3 text-stone-400 font-bold">Cancelar</button></div>)}
                            {(orderSource === 'web' || orderSource === 'catalog') && !selectedSupplier && (<div className="p-6 flex flex-col h-full"><h2 className="text-2xl font-bold mb-6">Detalles</h2>{orderSource === 'web' ? (<div className="space-y-3">{WEB_SUPPLIERS.map(s => <button key={s} onClick={() => setSelectedSupplier(s)} className="w-full p-4 bg-white border rounded-xl font-bold text-left hover:bg-stone-50">{s}</button>)}</div>) : (<div className="bg-white p-6 rounded-2xl shadow-sm space-y-6">{!catalogBrand ? (<div><label className="block font-bold text-sm mb-3">Marca</label><div className="grid grid-cols-2 gap-3">{BRANDS.map(b => <button key={b} onClick={() => setCatalogBrand(b)} className="p-3 border rounded-xl font-bold text-sm hover:bg-stone-50">{b}</button>)}</div></div>) : (<><div><label className="block font-bold text-sm mb-2">Campaña</label><div className="flex gap-2"><select className="flex-1 p-3 border rounded-xl bg-stone-50" value={selectedCycle} onChange={(e) => setSelectedCycle(e.target.value)}><option value="">Seleccionar...</option>{cycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><button onClick={() => setIsCycleModalOpen(true)} className="w-12 bg-stone-800 text-white rounded-xl flex items-center justify-center"><Plus/></button></div></div><button onClick={() => {if(!selectedCycle) { triggerAlert("Falta Ciclo", "Selecciona ciclo.", "info"); return; } setSelectedSupplier(`${catalogBrand} Catálogo`);}} className="w-full py-3 bg-stone-800 text-white font-bold rounded-xl">Continuar</button></>)}</div>)}<button onClick={() => setOrderSource('selection')} className="mt-auto py-3 text-stone-400 font-bold">Volver</button></div>)}
                            
                            {/* VISTA DE PRODUCTOS AL COMPRAR/AGREGAR AL CICLO */}
                            {(selectedSupplier || orderSource === 'cycle_stock') && (
                                <div className="flex flex-col h-full relative animate-in slide-in-from-right duration-200">
                                    <div className="p-2 bg-white border-b relative space-y-2">
                                        {/* Header especial si venimos de Ciclos */}
                                        {(orderSource === 'cycle_stock') && (
                                            <div className="bg-purple-50 border border-purple-100 text-purple-800 px-3 py-2 rounded-lg text-sm font-bold flex justify-between items-center">
                                                <span>Agregando a {activeCycle?.name || 'Ciclo'} (Inversión)</span>
                                                <button onClick={() => { clearCart(); setView('cycles'); }} className="text-xs underline">Cancelar</button>
                                            </div>
                                        )}
                                        <div className="relative"><Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400"/><input className="w-full pl-9 p-2 bg-stone-100 rounded-lg text-sm" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/></div><div className="flex gap-2 overflow-x-auto no-scrollbar"><button onClick={() => setSelectedCategoryFilter('ALL')} className={`px-3 py-1 rounded-full border text-xs whitespace-nowrap ${selectedCategoryFilter === 'ALL' ? 'bg-orange-600 text-white' : 'bg-white'}`}>Todos</button>{categories.map(c => <button key={c.id} onClick={() => setSelectedCategoryFilter(c.id)} className={`px-3 py-1 rounded-full border text-xs whitespace-nowrap ${selectedCategoryFilter === c.id ? 'bg-orange-600 text-white' : 'bg-white'}`}>{c.name}</button>)}</div></div>
                                    <div className="flex-1 overflow-y-auto p-2 bg-stone-100 pb-48"><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">{filteredProducts.map(p => (<button key={p.id} onClick={() => addToCart(p)} className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col group hover:shadow-md transition-all h-full"><div className="aspect-square w-full relative">{p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <Leaf className="w-full h-full p-8 text-stone-200" />}</div><div className="p-2 flex flex-col flex-1 justify-between text-left w-full"><span className="font-bold text-sm line-clamp-2 leading-tight text-stone-700">{p.name}</span><div className="mt-2 flex justify-between items-end w-full"><span className="text-stone-400 text-[10px] font-medium">Stock: {p.stock}</span><div className="bg-stone-100 p-1.5 rounded-full"><Plus className="w-4 h-4 text-stone-600"/></div></div></div></button>))}</div></div>
                                    <div className="fixed bottom-[60px] left-0 w-full z-20 bg-white rounded-t-2xl shadow-2xl border-t flex flex-col max-h-[50vh] min-h-0"><div className="px-4 py-3 border-b flex justify-between items-center bg-stone-50 rounded-t-2xl shrink-0"><div className="flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-stone-700"/><span className="font-bold text-stone-800 text-sm">Resumen ({cartPoints} pts)</span></div><button onClick={() => { clearCart(); setOrderSource('selection'); setSelectedSupplier(''); }} className="p-1 bg-stone-200 rounded-full text-stone-500"><X className="w-4 h-4"/></button></div><div className="flex-1 overflow-y-auto p-3 min-h-0">{cart.map(item => (<div key={item.id} className="mb-3 border-b pb-2 last:border-0"><div className="flex justify-between items-start mb-1"><span className="text-xs font-bold line-clamp-1">{item.name}</span><button onClick={() => removeFromCart(item.id)} className="text-red-400"><X className="w-3 h-3"/></button></div><div className="flex gap-2 items-end"><div className="flex items-center bg-stone-100 rounded-lg h-7"><button onClick={() => updateQty(item.id, -1)} className="px-2"><Minus className="w-3 h-3"/></button><span className="text-xs font-bold w-5 text-center">{item.qty}</span><button onClick={() => updateQty(item.id, 1)} className="px-2"><Plus className="w-3 h-3"/></button></div><div className="flex-1"><MoneyInput className="w-full border-b border-stone-300 text-xs font-bold text-right outline-none bg-transparent" value={item.transactionPrice === 0 ? '' : item.transactionPrice} placeholder="Costo..." onChange={val => updateTransactionPrice(item.id, val || 0)}/></div><div className="w-16 text-right"><div className="font-bold text-xs">${formatMoney(item.transactionPrice * item.qty)}</div></div></div></div>))}</div><div className="p-3 border-t bg-white shrink-0"><button onClick={handleCreateOrder} className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold shadow-lg flex justify-between px-4 text-sm"><span>Guardar Pedido</span><span>${formatMoney(cartTotal)}</span></button></div></div>
                                </div>
                            )}
                        </div>
                    )
                )}
            </div>
        )}
        
        {/* INVENTORY */}
        {view === 'inventory' && (
            <div className="p-4 overflow-y-auto pb-24">
                <div className="flex justify-between mb-4 gap-2">
                    <div className="flex-1 relative"><Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400"/><input className="w-full pl-9 p-2 rounded-xl border" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/></div>
                    <button onClick={() => setIsCategoryModalOpen(true)} className="p-2 border rounded-xl"><Tag/></button>
                    <button onClick={() => setShowCatalogModal(true)} className="p-2 bg-green-600 text-white rounded-xl"><Share2/></button>
                    <button onClick={() => { setEditingProduct(null); setProductPriceInput(''); setIsProductModalOpen(true); }} className="px-4 bg-orange-500 text-white rounded-xl font-bold flex items-center gap-2"><Plus className="w-4 h-4"/> Nuevo</button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {filteredProducts.map(p => (
                        <div key={p.id} className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col group hover:shadow-md transition-all">
                            <div className="aspect-square w-full relative">
                                {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <Leaf className="w-full h-full p-8 text-stone-200" />}
                            </div>
                            <div className="p-2 flex flex-col flex-1 justify-between text-left">
                                <span className="font-bold text-sm line-clamp-2 leading-tight text-stone-700">{p.name}</span>
                                <div className="mt-2 flex justify-between items-end">
                                    <span className="text-orange-600 font-bold">${formatMoney(p.price)}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold ${getStockStatus(p.stock).color}`}>{p.stock}</span>
                                </div>
                                <div className="flex gap-2 mt-3 pt-2 border-t">
                                    <button onClick={() => { setViewingHistoryProduct(p); setIsHistoryModalOpen(true); loadProductHistory(p.id); }} className="flex-1 py-1 bg-purple-50 text-purple-600 rounded flex justify-center"><ScrollText className="w-4 h-4"/></button>
                                    <button onClick={() => { setEditingProduct(p); setProductPriceInput(p.price); setIsProductModalOpen(true); }} className="flex-1 py-1 bg-blue-50 text-blue-600 rounded flex justify-center"><Pencil className="w-4 h-4"/></button>
                                    <button onClick={() => handleDeleteProduct(p.id)} className="flex-1 py-1 bg-red-50 text-red-600 rounded flex justify-center"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
        
        {/* VENTA (Receipts) */}
        {view === 'receipts' && (
            <div className="p-4 overflow-y-auto pb-24">
                <div className="mb-6">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Bike className="w-5 h-5 text-orange-500"/> En Reparto / Por Confirmar</h2>
                    <div className="space-y-3">
                        {filteredSales.inTransit.length === 0 && <div className="text-stone-400 text-sm text-center py-2">No hay envíos en curso.</div>}
                        {filteredSales.inTransit.map(t => (
                            <div key={t.id} className="p-4 bg-white rounded-xl shadow-sm border border-l-4 border-l-orange-500 relative overflow-hidden">
                                <div className="absolute right-0 top-0 bg-orange-100 text-orange-700 text-[9px] font-bold px-2 py-1 rounded-bl-xl uppercase">Lleva: {t.courier}</div>
                                <div onClick={() => setReceiptDetails(t)} className="cursor-pointer">
                                    <div className="flex justify-between mb-2 mt-1"><span className="font-bold text-stone-800">{getClientName(t.clientId)}</span>
                                        <span className="text-xs text-stone-400">
                                            <span className="font-mono font-bold text-stone-500 mr-2">#{t.displayId}</span>
                                            {formatDateSimple(t.date.seconds)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center mb-2"><div className="text-xl font-black">${formatMoney(t.total)}</div><span className="text-xs text-stone-500 italic">{t.paymentMethod || 'Sin pago en caja'}</span></div>
                                </div>
                                <div className="flex gap-2 pt-2 border-t">
                                    <button onClick={(e) => { e.stopPropagation(); handleVoidTransaction(t); }} className="py-2 px-3 bg-red-50 text-red-600 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-red-100 transition-colors"><Undo2 className="w-4 h-4"/> No Retiró</button>
                                    <button onClick={(e) => { e.stopPropagation(); handleConfirmDeliveryClick(t); }} className="flex-1 py-2 bg-stone-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-stone-900 transition-colors"><Check className="w-4 h-4"/> Confirmar Entrega</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mb-6">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><PackageCheck className="w-5 h-5 text-blue-500"/> Por Entregar (Stock Reservado)</h2>
                    <div className="space-y-3">
                        {filteredSales.pending_delivery.length === 0 && <div className="text-stone-400 text-sm text-center py-4">No hay pedidos por entregar.</div>}
                        {filteredSales.pending_delivery.map(t => {
                            return (
                                <div key={t.id} className="p-4 bg-white rounded-xl shadow-sm border border-l-4 border-l-green-500">
                                    <div onClick={() => setReceiptDetails(t)} className="cursor-pointer">
                                        <div className="flex justify-between mb-2"><span className="font-bold text-stone-800">{getClientName(t.clientId)}</span>
                                            <span className="text-xs text-stone-400">
                                                <span className="font-mono font-bold text-stone-500 mr-2">#{t.displayId}</span>
                                                {formatDateSimple(t.date.seconds)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center mb-2"><div className="text-xl font-black">${formatMoney(t.total)}</div><span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold uppercase">Listo para Entrega</span></div>
                                    </div>
                                    <div className="flex gap-2 pt-2 border-t">
                                        <button onClick={() => handleNotifyClient(t)} className="flex-1 py-2 bg-green-50 text-green-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1"><MessageCircle className="w-4 h-4"/> Avisar</button>
                                        <button onClick={() => handleDeliverOrder(t)} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1"><Truck className="w-4 h-4"/> Despachar</button>
                                        <button onClick={() => handleVoidTransaction(t)} className="p-2 bg-red-50 text-red-500 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="mb-6">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-amber-500"/> Por Encargar</h2>
                    <div className="space-y-3">
                        {/* Faltantes de Stock */}
                        {filteredSales.pending_order.map(t => (
                             <div key={t.id} className="p-4 bg-white rounded-xl shadow-sm border border-l-4 border-l-amber-500">
                                <div onClick={() => setReceiptDetails(t)} className="cursor-pointer">
                                    <div className="flex justify-between mb-2"><span className="font-bold text-stone-800">{getClientName(t.clientId)}</span>
                                        <span className="text-xs text-stone-400">
                                            <span className="font-mono font-bold text-stone-500 mr-2">#{t.displayId}</span>
                                            {formatDateSimple(t.date.seconds)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="text-xl font-black">${formatMoney(t.total)}</div>
                                        <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded font-bold uppercase">Falta Stock</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2 border-t">
                                    <button onClick={() => handleDeliverOrder(t)} className="flex-1 py-2 bg-stone-200 text-stone-400 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-not-allowed" disabled><Clock className="w-4 h-4"/> Esperando Stock</button>
                                    <button onClick={() => handleVoidTransaction(t)} className="p-2 bg-red-50 text-red-500 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            </div>
                        ))}

                        {/* Pedidos Web (Sin stock y no de ciclo) */}
                        {filteredSales.pending_web.map(t => (
                             <div key={t.id} className="p-4 bg-white rounded-xl shadow-sm border border-l-4 border-l-blue-500 relative overflow-hidden">
                                <div className="absolute right-0 top-0 bg-blue-100 text-blue-700 text-[9px] font-bold px-2 py-1 rounded-bl-xl uppercase flex items-center gap-1"><Globe2 className="w-3 h-3"/> Pedido Web</div>
                                <div onClick={() => setReceiptDetails(t)} className="cursor-pointer pt-2">
                                    <div className="flex justify-between mb-2"><span className="font-bold text-stone-800">{getClientName(t.clientId)}</span>
                                        <span className="text-xs text-stone-400">
                                            <span className="font-mono font-bold text-stone-500 mr-2">#{t.displayId}</span>
                                            {formatDateSimple(t.date.seconds)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="text-xl font-black">${formatMoney(t.total)}</div>
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2 border-t">
                                    <button className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1" disabled><Clock className="w-4 h-4"/> Comprar en Web</button>
                                    <button onClick={() => handleVoidTransaction(t)} className="p-2 bg-red-50 text-red-500 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            </div>
                        ))}

                        {/* Pedidos Ciclo Pendientes (Solo informativos aqui, se gestionan en Ciclos) */}
                         {filteredSales.pending_cycle.map(t => (
                             <div key={t.id} className="p-4 bg-white rounded-xl shadow-sm border border-l-4 border-l-purple-500 relative overflow-hidden opacity-75">
                                <div className="absolute right-0 top-0 bg-purple-100 text-purple-700 text-[9px] font-bold px-2 py-1 rounded-bl-xl uppercase flex items-center gap-1"><Repeat className="w-3 h-3"/> En Ciclo</div>
                                <div onClick={() => setReceiptDetails(t)} className="cursor-pointer pt-2">
                                    <div className="flex justify-between mb-2"><span className="font-bold text-stone-800">{getClientName(t.clientId)}</span>
                                        <span className="text-xs text-stone-400">
                                            <span className="font-mono font-bold text-stone-500 mr-2">#{t.displayId}</span>
                                            {formatDateSimple(t.date.seconds)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="text-xl font-black">${formatMoney(t.total)}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><History className="w-5 h-5 text-stone-400"/> Historial Ventas</h2>
                    <div className="space-y-3">
                        {filteredSales.completed.slice(0, 10).map(t => (<div key={t.id} onClick={() => setReceiptDetails(t)} className="p-4 bg-stone-50 rounded-xl shadow-sm border cursor-pointer opacity-75 hover:opacity-100"><div className="flex justify-between mb-1"><span className="font-bold text-sm">{getClientName(t.clientId)}</span>
                        <span className="text-xs text-stone-400">
                            <span className="font-mono font-bold text-stone-500 mr-2">#{t.displayId}</span>
                            {formatDateSimple(t.date.seconds)}
                        </span>
                        </div><div className="flex justify-between"><div className="font-bold">${formatMoney(t.total)}</div><div className="text-xs text-green-600 font-bold">ENTREGADO</div></div></div>))}
                    </div>
                </div>
            </div>
        )}

        {view === 'reports' && (
            <div className="p-4 space-y-6 pb-24">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-xl text-stone-800">Consultora de Belleza Helen Quintana</h3>
                  <div className="flex gap-2">
                    <button onClick={() => setShowStockAlertModal(true)} className="px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-bold flex gap-2 items-center shadow-md"><Package className="w-4 h-4 text-orange-500"/> Stock</button>
                    <button onClick={() => setShowExpiringModal(true)} className="px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-bold flex gap-2 items-center shadow-md"><CalendarX className="w-4 h-4 text-red-500"/> Vence</button>
                    <button onClick={() => setShowPendingOrdersModal(true)} className="px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-bold flex gap-2 items-center shadow-md"><ShoppingBag className="w-4 h-4 text-blue-400"/> Comprar</button>
                  </div>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {['today', 'yesterday', 'week', 'month'].map(f => (
                        <button key={f} onClick={() => setQuickDate(f)} className="px-4 py-1.5 bg-white border border-stone-200 text-stone-600 rounded-full text-xs font-bold uppercase hover:bg-stone-50 active:bg-stone-100 transition-colors">{f === 'today' ? 'Hoy' : f === 'yesterday' ? 'Ayer' : f === 'week' ? 'Semana' : 'Mes'}</button>
                    ))}
                </div>
                <div className="bg-white p-3 rounded-xl shadow-sm border border-stone-100 grid grid-cols-2 gap-3"><div><label className="text-[10px] text-stone-400 font-bold uppercase">Inicio</label><input type="date" className="w-full text-sm p-1 bg-stone-50 rounded border-0" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} /></div><div><label className="text-[10px] text-stone-400 font-bold uppercase">Fin</label><input type="date" className="w-full text-sm p-1 bg-stone-50 rounded border-0" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} /></div></div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-orange-500 flex flex-col justify-between h-28"><div className="flex justify-between items-start"><div className="text-xs font-bold text-stone-400 uppercase tracking-wide">Ventas Netas</div><div className="p-1.5 bg-orange-50 rounded-lg"><Wallet className="w-5 h-5 text-orange-600"/></div></div><div className="text-2xl font-black text-stone-800 tracking-tight">${formatMoney(reportData.totalSales)}</div></div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-stone-500 flex flex-col justify-between h-28"><div className="flex justify-between items-start"><div className="text-xs font-bold text-stone-400 uppercase tracking-wide">Costo (FIFO)</div><div className="p-1.5 bg-stone-50 rounded-lg"><TrendingDown className="w-5 h-5 text-stone-600"/></div></div><div className="text-2xl font-black text-stone-800 tracking-tight">${formatMoney(reportData.totalCost)}</div></div>
                    <div className="bg-white p-4 rounded-xl shadow-lg border border-stone-200 col-span-2 flex justify-between items-center h-24 relative overflow-hidden"><div className="relative z-10"><div className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-1">Margen Real</div><div className="text-4xl font-black text-stone-800 tracking-tight">${formatMoney(reportData.margin)}</div></div><div className="relative z-10 flex flex-col items-end"><div className="bg-green-100 text-green-700 px-3 py-1 rounded-lg font-bold text-lg border border-green-200">{reportData.marginPercent.toFixed(1)}%</div></div><div className="absolute right-0 bottom-0 opacity-5"><TrendingUp className="w-32 h-32 text-stone-800"/></div></div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-100"><h3 className="font-bold text-stone-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide"><BarChart3 className="w-4 h-4 text-stone-400"/> Tendencia Diaria</h3><div className="flex items-end gap-2 h-32 pb-2 border-b border-stone-100">{reportData.timelineData.length === 0 ? <div className="w-full text-center text-xs text-stone-300 self-center">Sin datos en este periodo</div> : reportData.timelineData.map((d, i) => { const maxVal = Math.max(...reportData.timelineData.map(x => x.total)); const heightPct = maxVal > 0 ? (d.total / maxVal) * 100 : 0; return (<div key={i} className="flex-1 h-full flex flex-col items-center justify-end gap-1 group relative"><div className="w-full flex-1 flex items-end justify-center relative"><div className="w-full bg-orange-500 rounded-t-sm relative hover:bg-orange-600 transition-colors" style={{height: `${Math.max(heightPct, 5)}%`}}><div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-stone-800 text-white text-[10px] p-1 rounded whitespace-nowrap z-10 pointer-events-none">${formatMoney(d.total)}</div></div></div><div className="text-[9px] text-stone-400 font-medium whitespace-nowrap">{d.date}</div></div>)})}</div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-100"><h3 className="font-bold text-stone-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide"><Package className="w-4 h-4 text-stone-400"/> Top Productos</h3><div className="space-y-3">{reportData.productRanking.length === 0 && <div className="text-xs text-stone-400 text-center py-4">Sin ventas</div>}{reportData.productRanking.map((p,i) => (<div key={i} className="flex justify-between items-center text-sm border-b border-stone-50 last:border-0 pb-2"><div className="flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-500">{i + 1}</div><div className="font-medium text-stone-700 line-clamp-1">{p.name}</div></div><div className="text-right"><div className="font-bold text-stone-800">${formatMoney(p.revenue)}</div><div className="text-[10px] text-stone-400">{p.qty} un.</div></div></div>))}</div></div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-100"><h3 className="font-bold text-stone-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide"><Users className="w-4 h-4 text-stone-400"/> Top Clientes</h3><div className="space-y-3">{reportData.clientRanking.length === 0 && <div className="text-xs text-stone-400 text-center py-4">Sin datos</div>}{reportData.clientRanking.map((c,i) => (<div key={i} className="flex justify-between items-center text-sm border-b border-stone-50 last:border-0 pb-2"><div className="flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-500">{i + 1}</div><div className="font-medium text-stone-700 line-clamp-1">{c.name}</div></div><div className="text-right"><div className="font-bold text-stone-800">${formatMoney(c.total)}</div><div className="text-[10px] text-stone-400">{c.count} compras</div></div></div>))}</div></div>
                </div>
            </div>
        )}

        {view === 'clients' && (
            <div className="p-4 pb-24 overflow-y-auto">
                <button onClick={() => { setEditingClient(null); setIsClientModalOpen(true); }} className="w-full py-3 bg-orange-600 text-white font-bold rounded-xl mb-4 shadow-lg flex items-center justify-center gap-2"><Plus className="w-5 h-5"/> Crear Nuevo Cliente</button>
                <div className="space-y-2">
                    {clients.map(c => (
                        <div key={c.id} className="p-4 bg-white rounded-xl shadow-sm border flex justify-between items-center group">
                            <div>
                                <div className="font-bold text-stone-800">{c.name}</div>
                                <div className="text-sm text-stone-500 flex items-center gap-1"><Smartphone className="w-3 h-3"/> {c.phone || 'Sin teléfono'}</div>
                            </div>
                            <div className="flex gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingClient(c); setIsClientModalOpen(true); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><Pencil className="w-4 h-4"/></button>
                                <button onClick={() => handleDeleteClient(c.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 className="w-4 h-4"/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

      </main>

      {/* --- MODAL PARA CREAR CICLO --- */}
      {isCycleModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
              <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl">
                  <div className="flex justify-between items-center mb-4">
                      <h2 className="font-bold text-xl text-stone-800">Iniciar Nuevo Ciclo</h2>
                      <button onClick={() => setIsCycleModalOpen(false)}><X className="w-6 h-6 text-stone-400"/></button>
                  </div>
                  <form onSubmit={handleSaveCycle}>
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Nombre del Ciclo</label>
                      <input name="name" required className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl mb-4 font-bold" placeholder="Ej: Ciclo 14 2024"/>
                      
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Meta de Puntos</label>
                      <input name="goal" type="number" required className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl mb-4 font-bold" placeholder="Ej: 500"/>
                      
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Fecha de Cierre (Pedido)</label>
                      <input name="closingDate" type="date" required className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl mb-6 font-bold" />

                      <button className="w-full py-4 bg-stone-900 text-white rounded-2xl font-bold shadow-lg">Crear Ciclo</button>
                  </form>
              </div>
          </div>
      )}

      {isCheckoutModalOpen && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden scale-100">
                  <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-white z-10">
                      <div>
                          <h2 className="font-black text-xl text-stone-800 tracking-tight">Finalizar Pedido</h2>
                          <p className="text-xs text-stone-400 font-medium">Completa la información para registrar la venta</p>
                      </div>
                      <button onClick={() => setIsCheckoutModalOpen(false)} className="p-2 bg-stone-50 hover:bg-stone-100 rounded-full transition-colors">
                          <X className="w-5 h-5 text-stone-500"/>
                      </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-8">
                      <div>
                          <div className="flex items-center gap-2 mb-3">
                              <div className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-bold">1</div>
                              <h3 className="font-bold text-stone-700 text-sm uppercase tracking-wide">Cliente</h3>
                          </div>
                          <div className="relative" ref={clientInputRef}>
                              <div className="relative">
                                  <UserPlus className="absolute left-4 top-3.5 w-5 h-5 text-stone-400"/>
                                  <input 
                                      className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-800 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all placeholder:text-stone-400" 
                                      placeholder="Buscar o seleccionar cliente..." 
                                      value={clientSearchTerm} 
                                      onChange={e => { setClientSearchTerm(e.target.value); setShowClientOptions(true); }}
                                      onFocus={() => setShowClientOptions(true)}
                                  />
                                  {selectedClient && (
                                      <div className="absolute right-2 top-2 bottom-2 flex items-center">
                                          <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Seleccionado</span>
                                      </div>
                                  )}
                              </div>
                              {showClientOptions && (
                                  <div className="absolute top-full left-0 w-full bg-white border border-stone-100 rounded-xl shadow-xl max-h-48 overflow-y-auto z-20 mt-2 p-2">
                                      <button onClick={() => { setEditingClient(null); setIsClientModalOpen(true); setShowClientOptions(false); }} className="w-full p-3 text-left text-blue-600 font-bold hover:bg-blue-50 rounded-lg flex items-center gap-2"><Plus className="w-4 h-4"/> Crear Nuevo Cliente</button>
                                      {filteredClientsForSearch.map(c => (
                                          <div key={c.id} className="p-3 hover:bg-stone-50 cursor-pointer rounded-lg transition-colors flex justify-between items-center group" onClick={() => {
                                              setSelectedClient(c.id);
                                              setClientSearchTerm(c.name);
                                              setShowClientOptions(false);
                                          }}>
                                              <div>
                                                  <div className="font-bold text-stone-800">{c.name}</div>
                                                  <div className="text-xs text-stone-400">{c.phone}</div>
                                              </div>
                                              <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-stone-600"/>
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </div>
                      </div>

                        <div className={!selectedClient ? 'opacity-40 pointer-events-none grayscale transition-all' : 'transition-all'}>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-bold">2</div>
                                <h3 className="font-bold text-stone-700 text-sm uppercase tracking-wide">Disponibilidad</h3>
                            </div>

                            <div className={`p-5 rounded-2xl border transition-all relative overflow-hidden ${stockAnalysis.canDeliverAll ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/50'}`}>
                                <div className="flex items-start gap-4 relative z-10">
                                    <div className={`p-3 rounded-xl shadow-sm ${stockAnalysis.canDeliverAll ? 'bg-white text-emerald-600' : 'bg-white text-amber-600'}`}>
                                        {stockAnalysis.canDeliverAll ? <PackageCheck className="w-6 h-6"/> : <Clock className="w-6 h-6"/>}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className={`font-bold text-base mb-1 ${stockAnalysis.canDeliverAll ? 'text-emerald-900' : 'text-amber-900'}`}>
                                            {stockAnalysis.canDeliverAll ? 'Stock Disponible' : 'Falta Stock'}
                                        </h4>
                                        <p className={`text-xs font-medium leading-relaxed ${stockAnalysis.canDeliverAll ? 'text-emerald-700' : 'text-amber-700'}`}>
                                            {stockAnalysis.canDeliverAll 
                                                ? 'Se descontará del inventario y pasará a "Por Entregar".' 
                                                : 'Se registrará como pendiente de llegada "Por Encargar".'}
                                        </p>
                                    </div>
                                </div>

                                {!stockAnalysis.canDeliverAll && (
                                    <div className="mt-4 bg-white rounded-xl border border-amber-100 p-3 shadow-sm">
                                            <div className="text-[10px] font-bold text-amber-400 uppercase mb-2 tracking-wider">Productos Faltantes</div>
                                            <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                                                {stockAnalysis.missing.map(i => (
                                                    <div key={i.id} className="flex justify-between items-center p-2 bg-amber-50/50 rounded-lg">
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></div>
                                                            <span className="text-xs font-bold text-stone-700 truncate">{i.name}</span>
                                                        </div>
                                                        <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded ml-2 whitespace-nowrap">Faltan {i.qty - i.currentStock}</span>
                                                    </div>
                                                ))}
                                            </div>
                                    </div>
                                )}
                            </div>
                        </div>

                      <div className={!selectedClient ? 'opacity-40 pointer-events-none grayscale transition-all' : 'transition-all'}>
                          <div className="flex items-center gap-2 mb-3">
                              <div className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-bold">3</div>
                              <h3 className="font-bold text-stone-700 text-sm uppercase tracking-wide">Plan de Pago (Deuda)</h3>
                          </div>
                          
                          <div className="bg-stone-100 p-1 rounded-xl flex mb-6">
                              {['full', 'installments'].map(type => (
                                  <button 
                                      key={type}
                                      onClick={() => setPaymentPlanType(type)}
                                      className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${paymentPlanType === type ? 'bg-white text-stone-900 shadow-sm ring-1 ring-black/5' : 'text-stone-500 hover:text-stone-700'}`}
                                  >
                                      {type === 'full' ? 'Pago Completo' : 'Cuotas'}
                                  </button>
                              ))}
                          </div>

                          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                              {paymentPlanType === 'full' && (
                                  <div className="bg-stone-50 rounded-2xl p-6 border border-stone-200 text-center">
                                      <div className="text-stone-500 text-xs font-bold uppercase mb-1">Total a Deuda</div>
                                      <div className="text-4xl font-black text-stone-800 mb-2">${formatMoney(cartTotal)}</div>
                                      <div className="text-xs text-stone-400 bg-white inline-block px-3 py-1 rounded-full border border-stone-100 mb-4">
                                          El pago se registrará exclusivamente en el módulo Deudores.
                                      </div>
                                  </div>
                              )}

                              {paymentPlanType === 'installments' && (
                                  <div className="space-y-4">
                                      <div>
                                          <label className="block text-xs font-bold uppercase text-stone-500 mb-2">Cantidad de Cuotas</label>
                                          <select className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl font-bold outline-none" value={checkoutData.installmentsCount} onChange={e => setCheckoutData({...checkoutData, installmentsCount: e.target.value, installmentDates: {}})}>
                                              {[2,3,4,5,6].map(n => <option key={n} value={n}>{n} Cuotas</option>)}
                                          </select>
                                      </div>
                                      
                                      <div className="space-y-2">
                                          <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Fechas de Vencimiento</label>
                                          {Array.from({length: parseInt(checkoutData.installmentsCount)}).map((_, idx) => (
                                              <div key={idx} className="flex items-center gap-3 bg-white p-2 rounded-xl border border-stone-100">
                                                  <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center font-bold text-stone-500 text-xs">{idx+1}</div>
                                                  <div className="flex-1 text-sm font-bold text-stone-700">${formatMoney(Math.round(cartTotal / parseInt(checkoutData.installmentsCount)))}</div>
                                                  <input 
                                                      type="date" 
                                                      className="p-2 bg-stone-50 rounded-lg border-none outline-none text-xs font-bold text-stone-600"
                                                      value={checkoutData.installmentDates[idx] || ''}
                                                      onChange={(e) => {
                                                          const newDates = {...checkoutData.installmentDates, [idx]: e.target.value};
                                                          setCheckoutData({...checkoutData, installmentDates: newDates});
                                                      }}
                                                  />
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>

                  <div className="p-6 border-t border-stone-100 bg-white z-10">
                      <button 
                          onClick={handleConfirmCheckout} 
                          className="w-full py-4 bg-stone-900 text-white rounded-2xl font-bold text-lg shadow-xl shadow-stone-200 hover:bg-stone-800 hover:scale-[1.01] active:scale-[0.98] transition-all flex justify-between px-8 items-center group"
                      >
                          <span>Confirmar Pedido</span>
                          <div className="flex items-center gap-3">
                              <span className="opacity-50">|</span>
                              <span>${formatMoney(cartTotal)}</span>
                              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform"/>
                          </div>
                      </button>
                  </div>
              </div>
          </div>
      )}

      {paymentModalOpen && selectedPaymentTx && (
          <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
                  <div className="p-5 bg-emerald-600 text-white relative overflow-hidden">
                      <div className="relative z-10">
                          <h2 className="font-bold text-xl">Registrar Pago</h2>
                          <div className="text-sm opacity-90 font-medium">{getClientName(selectedPaymentTx.clientId)}</div>
                      </div>
                      <DollarSign className="absolute -right-4 -bottom-8 w-32 h-32 text-emerald-500 opacity-50 rotate-12"/>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-5">
                      <div className="mb-6 space-y-3">
                          {(selectedPaymentTx.paymentSchedule || []).map((item, idx) => {
                            const paidSoFar = item.paidAmount || 0;
                            const progress = Math.min(100, (paidSoFar / item.amount) * 100);
                            const isFullyPaid = paidSoFar >= item.amount;

                            return (
                              <div 
                                  key={idx} 
                                  onClick={() => {
                                      if (isFullyPaid) return; 
                                      setSelectedPaymentIndex(idx);
                                      setPaymentAmountInput(item.amount - paidSoFar);
                                  }}
                                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden group
                                      ${isFullyPaid 
                                          ? 'bg-emerald-50 border-emerald-100 opacity-80 cursor-default' 
                                          : selectedPaymentIndex === idx 
                                              ? 'bg-white border-emerald-500 ring-2 ring-emerald-100' 
                                              : 'bg-white border-stone-100 hover:border-emerald-200'
                                      }`}
                              >
                                  {!isFullyPaid && paidSoFar > 0 && (
                                      <div className="absolute left-0 top-0 bottom-0 bg-emerald-100 transition-all duration-500" style={{width: `${progress}%`, zIndex: 0}}></div>
                                  )}

                                  <div className="relative z-10 flex justify-between items-center">
                                      <div>
                                          <div className="font-bold text-sm text-stone-800">
                                              {item.type === 'cuota' ? `Cuota ${item.number}` : item.type === 'abono' ? 'Abono Inicial' : (item.type === 'total' ? 'Pago Total' : 'Saldo Pendiente')}
                                          </div>
                                          <div className="text-xs text-stone-500 mt-0.5">
                                              {item.date ? new Date(item.date * 1000).toLocaleDateString() : 'Fecha abierta'}
                                          </div>
                                          {item.paymentHistory && item.paymentHistory.length > 0 && (
                                              <div className="text-[9px] text-stone-400 mt-1">
                                                  {item.paymentHistory.length} abonos registrados
                                              </div>
                                          )}
                                      </div>
                                      <div className="text-right">
                                          <div className={`font-black ${isFullyPaid ? 'text-emerald-700' : 'text-stone-800'}`}>
                                              ${formatMoney(item.amount)}
                                          </div>
                                          {!isFullyPaid && paidSoFar > 0 && (
                                              <div className="text-[10px] font-bold text-emerald-600">
                                                  Pagado: ${formatMoney(paidSoFar)}
                                              </div>
                                          )}
                                          <div className={`text-[9px] uppercase font-bold mt-1 px-2 py-0.5 rounded-full inline-block ${isFullyPaid ? 'bg-emerald-200 text-emerald-800' : 'bg-stone-100 text-stone-400'}`}>
                                              {isFullyPaid ? 'Pagado' : paidSoFar > 0 ? 'Parcial' : 'Pendiente'}
                                          </div>
                                      </div>
                                  </div>
                              </div>
                            );
                          })}
                      </div>

                      {selectedPaymentIndex !== null && (
                          <div className="bg-stone-50 p-5 rounded-2xl border border-stone-100 animate-in slide-in-from-bottom-4 duration-300">
                              <label className="block text-xs font-bold uppercase text-stone-400 mb-2">Monto a Pagar</label>
                              <div className="relative mb-4">
                                  <MoneyInput 
                                      className="w-full pl-4 pr-4 py-4 bg-white border border-stone-200 rounded-2xl text-2xl font-black text-stone-800 focus:border-emerald-500 outline-none text-center" 
                                      value={paymentAmountInput}
                                      onChange={val => setPaymentAmountInput(val)}
                                      placeholder="$0"
                                      autoFocus
                                  />
                              </div>
                              
                              <label className="block text-xs font-bold uppercase text-stone-400 mb-2">Medio de Pago</label>
                              <div className="grid grid-cols-3 gap-2 mb-4">
                                  {[
                                      { id: 'Efectivo', icon: Banknote, label: 'Efectivo' },
                                      { id: 'Transferencia', icon: QrCode, label: 'Transf.' },
                                      { id: 'Debito', icon: DebitCard, label: 'Débito' }
                                  ].map((m) => (
                                      <button 
                                          key={m.id}
                                          onClick={() => setPaymentMethod(m.id)}
                                          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${paymentMethod === m.id ? 'bg-stone-800 text-white border-stone-800 shadow-md' : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'}`}
                                      >
                                          <m.icon className="w-5 h-5 mb-1"/>
                                          <span className="text-[10px] font-bold">{m.label}</span>
                                      </button>
                                  ))}
                              </div>

                              <div className="relative border-2 border-dashed border-stone-300 rounded-xl p-4 text-center text-stone-400 cursor-pointer hover:bg-white hover:border-emerald-400 hover:text-emerald-600 transition-all group">
                                  <input 
                                      type="file" 
                                      accept="image/*"
                                      onChange={(e) => setPaymentReceiptFile(e.target.files[0])}
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  />
                                  <Upload className={`w-6 h-6 mx-auto mb-2 ${paymentReceiptFile ? 'text-emerald-500' : ''}`}/>
                                  <span className={`text-xs font-bold block ${paymentReceiptFile ? 'text-emerald-600' : ''}`}>{paymentReceiptFile ? "Archivo Seleccionado" : "Subir Comprobante"}</span>
                                  <span className="text-[10px] opacity-70">{paymentReceiptFile ? paymentReceiptFile.name : "(Opcional)"}</span>
                              </div>
                          </div>
                      )}
                  </div>

                  <div className="p-5 border-t bg-white flex flex-col gap-3">
                      {selectedPaymentIndex !== null ? (
                          <button onClick={handleRegisterPayment} className="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 active:scale-[0.98] transition-all">
                              Confirmar Pago
                          </button>
                      ) : (
                          <div className="text-center text-xs text-stone-400 font-medium py-2">Selecciona una cuota para pagar</div>
                      )}
                      <button onClick={() => { setPaymentModalOpen(false); setSelectedPaymentTx(null); setPaymentReceiptFile(null); }} className="w-full py-3 text-stone-400 font-bold text-sm hover:text-stone-600 transition-colors">
                          Cancelar
                      </button>
                  </div>
              </div>
          </div>
      )}

      {isDeliveryModalOpen && deliveryTransaction && (
        <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-xl">
                <h2 className="text-xl font-bold text-center mb-4">Preparar Entrega</h2>
                <div className="text-3xl font-black text-center mb-6">${formatMoney(deliveryTransaction.total)}</div>
                
                <div className="mb-6">
                    <label className="text-xs font-bold text-stone-500 uppercase block mb-2">¿Quién entrega?</label>
                    <div className="space-y-2">
                        {COURIERS.map(courier => (
                            <button 
                                key={courier} 
                                onClick={() => setSelectedCourier(courier)}
                                className={`w-full p-3 rounded-xl font-bold text-left flex items-center gap-3 border-2 transition-all ${selectedCourier === courier ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-stone-100 bg-white text-stone-600'}`}
                            >
                                {courier === 'Yo (Directo)' ? <CheckCircle2 className="w-5 h-5"/> : <Bike className="w-5 h-5"/>}
                                {courier}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mb-6">
                    <label className="text-xs font-bold text-stone-500 uppercase block mb-2">Medio de Pago (Estimado)</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setDeliveryPaymentMethod('Efectivo')} className={`p-3 border-2 rounded-xl font-bold ${deliveryPaymentMethod === 'Efectivo' ? 'border-green-500 text-green-700' : 'border-stone-200'}`}>Efectivo</button>
                        <button onClick={() => setDeliveryPaymentMethod('Transferencia')} className={`p-3 border-2 rounded-xl font-bold ${deliveryPaymentMethod === 'Transferencia' ? 'border-green-500 text-green-700' : 'border-stone-200'}`}>Transf.</button>
                    </div>
                </div>

                <button onClick={startDeliveryProcess} className={`w-full py-3 text-white font-bold rounded-xl ${selectedCourier === 'Yo (Directo)' ? 'bg-green-600' : 'bg-stone-800'}`}>
                    {selectedCourier === 'Yo (Directo)' ? 'Confirmar y Cerrar Venta' : 'Enviar a Reparto (Descontar Stock)'}
                </button>
                <button onClick={() => setIsDeliveryModalOpen(false)} className="w-full mt-2 py-3 text-stone-400">Cancelar</button>
            </div>
        </div>
      )}

      {showExpiringModal && (
        <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[80vh] flex flex-col overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-red-50">
                    <h2 className="font-bold text-lg text-red-700 flex items-center gap-2"><CalendarX className="w-5 h-5"/> Por Vencer (Top 10)</h2>
                    <button onClick={() => setShowExpiringModal(false)}><X className="w-6 h-6 text-red-400"/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    {expiringProducts.length === 0 ? (
                        <div className="text-center text-stone-400 py-10">No hay productos próximos a vencer.</div>
                    ) : (
                        <div className="space-y-3">
                            {expiringProducts.map((b, i) => (
                                <div key={i} className="p-3 bg-white border border-red-100 rounded-xl shadow-sm">
                                    <div className="font-bold text-stone-800 mb-1">{b.productName}</div>
                                    <div className="flex justify-between text-xs text-stone-500 mb-2">
                                        <span>Vence: <span className="font-bold text-red-600">{new Date(b.expirationDate).toLocaleDateString()}</span></span>
                                        <span>{b.remainingQty} un.</span>
                                    </div>
                                    <div className="text-xs text-stone-400 bg-stone-50 p-2 rounded flex justify-between">
                                        <span>Dinero en riesgo:</span>
                                        <span className="font-bold text-stone-700">${formatMoney(b.remainingQty * b.cost)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {showStockAlertModal && (
          <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                  <div className="p-4 border-b bg-stone-50 flex justify-between items-center">
                      <h2 className="font-bold text-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-orange-500"/> Alerta de Stock</h2>
                      <button onClick={() => setShowStockAlertModal(false)}><X className="w-5 h-5 text-stone-400"/></button>
                  </div>
                  <div className="p-6 text-center">
                      <p className="text-stone-600 mb-4">¿Deseas generar un reporte de los productos con stock bajo?</p>
                      <div className="space-y-3">
                          <button onClick={() => handleSendStockReport(reportPhones.phone1)} className="w-full py-3 bg-green-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"><MessageCircle className="w-5 h-5"/> Enviar a WhatsApp (Principal)</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {showPendingOrdersModal && (
        <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[80vh] flex flex-col overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-blue-50">
                    <h2 className="font-bold text-lg text-blue-700 flex items-center gap-2"><ShoppingBag className="w-5 h-5"/> Unidades por Comprar</h2>
                    <button onClick={() => setShowPendingOrdersModal(false)}><X className="w-6 h-6 text-blue-400"/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {Object.keys(pendingOrdersData).length === 0 ? (
                        <div className="text-center text-stone-400 py-10">No hay pedidos pendientes.</div>
                    ) : (
                        Object.entries(pendingOrdersData).map(([brand, items]) => (
                            <div key={brand}>
                                <h3 className="font-bold text-stone-400 text-xs uppercase mb-2 border-b pb-1">{brand}</h3>
                                <div className="space-y-2">
                                    {items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm p-2 bg-stone-50 rounded-lg">
                                            <span className="font-medium text-stone-700">{item.name}</span>
                                            <span className="font-bold bg-white px-2 py-1 rounded border border-stone-200 text-stone-600">{item.qty} un.</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      )}

      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingProduct ? 'Editar' : 'Nuevo'} Producto</h2>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="border-2 border-dashed border-stone-300 rounded-xl p-4 text-center relative hover:bg-stone-50 transition-colors">
                  <input 
                      type="file" 
                      name="image" 
                      accept="image/*"
                      required={!editingProduct?.imageUrl}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center gap-2 pointer-events-none">
                      <ImageIcon className="w-8 h-8 text-stone-400"/>
                      <span className="text-sm font-bold text-stone-500">
                          {editingProduct?.imageUrl ? "Cambiar Imagen (Opcional)" : "Subir Imagen (Obligatorio)"}
                      </span>
                  </div>
              </div>
              {editingProduct?.imageUrl && (
                  <div className="text-xs text-center text-green-600 font-bold flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3 h-3"/> Imagen actual registrada
                  </div>
              )}
              
              <input name="customId" placeholder="ID Producto" defaultValue={editingProduct?.customId} className="w-full p-3 border rounded-xl" />

              <input name="name" required placeholder="Nombre" defaultValue={editingProduct?.name} className="w-full p-3 border rounded-xl" />
              <select name="brand" required defaultValue={editingProduct?.brand} className="w-full p-3 border rounded-xl bg-white">
                  <option value="">Seleccionar Marca</option>
                  {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              
              <div className="flex gap-3">
                  <div className="relative flex-1">
                      <span className="absolute left-3 top-3 text-stone-400">$</span>
                      <MoneyInput 
                          className="w-full pl-7 p-3 border rounded-xl" 
                          value={productPriceInput} 
                          onChange={val => setProductPriceInput(val)}
                          placeholder="Precio" 
                      />
                  </div>
                  <input name="points" type="number" placeholder="Puntos" defaultValue={editingProduct?.points} className="w-1/3 p-3 border rounded-xl" />
              </div>

              <select name="category" required defaultValue={editingProduct?.category} className="w-full p-3 border rounded-xl"><option value="">Categoría</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <button className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold">Guardar</button>
              <button type="button" onClick={() => setIsProductModalOpen(false)} className="w-full py-3 bg-stone-100 rounded-xl">Cancelar</button>
            </form>
          </div>
        </div>
      )}

      {isCategoryModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white p-6 rounded-2xl w-full max-w-sm flex flex-col max-h-[80vh]">
                  <h2 className="font-bold text-lg mb-4">Gestionar Categorías</h2>
                  <form onSubmit={e => { e.preventDefault(); simpleSave('categories', {name: new FormData(e.currentTarget).get('name')}, () => {}); e.target.reset(); }} className="mb-4">
                      <input name="name" required className="w-full p-3 border rounded-xl mb-2" placeholder="Nueva Categoría..."/>
                      <button className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold">Agregar</button>
                  </form>
                  <div className="flex-1 overflow-y-auto border-t pt-2">
                      <div className="text-xs text-stone-400 uppercase font-bold mb-2">Existentes</div>
                      {categories.map(cat => (
                          <div key={cat.id} className="flex justify-between items-center p-2 hover:bg-stone-50 rounded-lg group">
                              <span>{cat.name}</span>
                              <button onClick={() => handleDeleteCategory(cat.id)} className="text-stone-300 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                          </div>
                      ))}
                  </div>
                  <button onClick={() => setIsCategoryModalOpen(false)} className="w-full mt-4 py-3 bg-stone-100 rounded-xl">Cerrar</button>
              </div>
          </div>
      )}
      
      {isSupplierModalOpen && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><div className="bg-white p-6 rounded-2xl w-full max-w-sm"><h2 className="font-bold text-lg mb-4">Nuevo Proveedor</h2><form onSubmit={handleSaveSupplier}><input name="name" required className="w-full p-3 border rounded-xl mb-4" placeholder="Nombre"/><button className="w-full py-3 bg-stone-800 text-white rounded-xl font-bold">Guardar</button></form><button onClick={() => setIsSupplierModalOpen(false)} className="w-full mt-2 py-3 bg-stone-100 rounded-xl">Cancelar</button></div></div>}

      {showCatalogModal && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
              <div className="bg-white p-6 rounded-2xl w-full max-w-sm">
                  <h2 className="text-lg font-bold mb-4">Enviar Catálogo</h2>
                  <div className="space-y-2">
                      <button onClick={() => handleSendCatalog('ALL')} className="w-full p-3 bg-stone-100 rounded-xl text-left font-bold">Todo el Stock</button>
                      {categories.map(c => (
                          <button key={c.id} onClick={() => handleSendCatalog(c.id)} className="w-full p-3 bg-white border rounded-xl text-left text-sm">{c.name}</button>
                      ))}
                  </div>
                  <button onClick={() => setShowCatalogModal(false)} className="w-full mt-4 py-3 text-stone-400">Cancelar</button>
              </div>
          </div>
      )}

      {showPreTicket && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
              <div className="bg-white p-6 rounded-2xl w-full max-w-sm">
                  <h2 className="text-lg font-bold mb-2">Compartir Detalle</h2>
                  <p className="text-sm text-stone-500 mb-4">Se copiará al portapapeles o abrirá WhatsApp.</p>
                  <div className="bg-stone-100 p-3 rounded-lg text-xs font-mono mb-4 max-h-40 overflow-y-auto">
                      {(cart || []).map(i => `${i.name} x${i.qty} ($${formatMoney(i.price)})`).join('\n')}
                      {'\n'}Total: ${formatMoney(cartTotal)}
                  </div>
                  <div className="flex gap-2">
                      <button onClick={() => {
                          const text = `Hola! Aquí el detalle:\n${(cart || []).map(i => `- ${i.name} x${i.qty}`).join('\n')}\nTotal: $${formatMoney(cartTotal)}`;
                          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                          setShowPreTicket(false);
                      }} className="flex-1 py-2 bg-green-500 text-white rounded-xl font-bold">WhatsApp</button>
                      <button onClick={() => setShowPreTicket(false)} className="flex-1 py-2 bg-stone-200 rounded-xl">Cerrar</button>
                  </div>
              </div>
          </div>
      )}

      <nav className="fixed bottom-0 w-full bg-white border-t flex justify-around py-3 pb-safe-bottom z-30 shadow-lg">
        <NavButton icon={<LayoutDashboard />} label="Reportes" active={view === 'reports'} onClick={() => setView('reports')} />
        <NavButton icon={<Repeat />} label="Ciclos" active={view === 'cycles'} onClick={() => setView('cycles')} />
        <NavButton icon={<ShoppingCart />} label="Vender" active={view === 'pos'} onClick={() => setView('pos')} />
        <NavButton icon={<ShoppingBag />} label="Compras" active={view === 'purchases'} onClick={() => setView('purchases')} />
        <NavButton icon={<Receipt />} label="Pedidos" active={view === 'receipts'} onClick={() => setView('receipts')} />
        <NavButton icon={<DollarSign />} label="Deudores" active={view === 'finances'} onClick={() => setView('finances')} />
        <NavButton icon={<Users />} label="Clientes" active={view === 'clients'} onClick={() => setView('clients')} />
        <NavButton icon={<Package />} label="Stock" active={view === 'inventory'} onClick={() => setView('inventory')} />
      </nav>
    </div>
  );
}

function NavButton({ icon, label, active, onClick }) {
    return <button onClick={onClick} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${active ? 'text-orange-600 bg-orange-50 scale-105' : 'text-stone-400 hover:bg-stone-50'}`}>{React.cloneElement(icon, { className: `w-6 h-6 ${active ? 'fill-current' : ''}` })}<span className="text-[10px] font-bold">{label}</span></button>
}
