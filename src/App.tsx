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
  ShoppingBag
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
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
const firebaseConfig = JSON.parse(__firebase_config || '{}');

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
// MODIFICADO: Apuntar al bucket específico solicitado
const storage = getStorage(app, "gs://negocio-51df2.firebasestorage.app");

const APP_ID = typeof __app_id !== 'undefined' ? __app_id : "natura-produccion-main";

// --- CONSTANTES ---
const BRANDS = ['Natura', 'Avon', 'Cyzone'];
const SUPPLIERS_OPTIONS = ['Natura Web', 'Natura Catálogo', 'Belcorp Web', 'Belcorp Catálogo'];

// --- Componente Principal ---
export default function PosApp() {

  const formatMoney = (amount) => {
    return (amount || 0).toLocaleString('es-CL', {
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0  
    });
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
  const [paymentMethod, setPaymentMethod] = useState(''); 
  const [editingTransactionId, setEditingTransactionId] = useState(null); 
  const [originalBatchesMap, setOriginalBatchesMap] = useState({}); 
    
  const [loading, setLoading] = useState(true); 
  const [searchTerm, setSearchTerm] = useState('');
  const [processingMsg, setProcessingMsg] = useState('Conectando...');

  // Alertas
  const [alertState, setAlertState] = useState({ show: false, title: '', message: '', type: 'info' }); 

  // Modales
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [showPreTicket, setShowPreTicket] = useState(false); 
  const [showStockAlertModal, setShowStockAlertModal] = useState(false); 
  const [showCatalogModal, setShowCatalogModal] = useState(false); 
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  
  // NUEVOS MODALES REPORTES
  const [showExpiringModal, setShowExpiringModal] = useState(false);
  const [showPendingOrdersModal, setShowPendingOrdersModal] = useState(false);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [viewingHistoryProduct, setViewingHistoryProduct] = useState(null);
  
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [deliveryTransaction, setDeliveryTransaction] = useState(null);
  const [deliveryPaymentMethod, setDeliveryPaymentMethod] = useState('Efectivo');
    
  const [editingProduct, setEditingProduct] = useState(null);
  const [productPriceInput, setProductPriceInput] = useState(''); 
  const [receiptDetails, setReceiptDetails] = useState(null);
  
  // Kardex
  const [productHistory, setProductHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
    
  const [showPurchaseHistory, setShowPurchaseHistory] = useState(false);

  // Estados Pedido
  const [purchaseMode, setPurchaseMode] = useState(null); 
  const [selectedCycle, setSelectedCycle] = useState('');
  const [magazineFile, setMagazineFile] = useState(null);

  // Modo Venta
  const [saleMode, setSaleMode] = useState(null);

  // Filtros
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [phStartDate, setPhStartDate] = useState('');
  const [phEndDate, setPhEndDate] = useState('');
  const [phSupplier, setPhSupplier] = useState('');
  const [phProduct, setPhProduct] = useState('');
  const [showPhFilters, setShowPhFilters] = useState(false);

  // UI Extras
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL'); 
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showClientOptions, setShowClientOptions] = useState(false);
  const clientInputRef = useRef(null);

  // Report Phones
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

  // Filtros Reportes
  const [reportStartDate, setReportStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-CA'); 
  });
  const [reportEndDate, setReportEndDate] = useState(() => {
    return new Date().toLocaleDateString('en-CA'); 
  });

  // Auth & Sync
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
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

  // Listeners
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
    const unsubCycles = onSnapshot(collection(db, basePath, 'cycles'), (s) => setCycles(s.docs.map(d => d.data().name)));
    
    // Listener de Lotes
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

  const triggerAlert = (title, message, type = 'error') => setAlertState({ show: true, title, message, type });

  const getStockStatus = (stock) => {
      if (stock === 0) return { color: 'bg-red-600 text-white', label: 'AGOTADO' };
      if (stock === 1) return { color: 'bg-red-100 text-red-700 border border-red-200', label: 'CRÍTICO' };
      if (stock > 1 && stock < 4) return { color: 'bg-orange-100 text-orange-800 border border-orange-200', label: 'BAJO' };
      return { color: 'bg-emerald-100 text-emerald-700 border border-emerald-200', label: 'BIEN' };
  };

  // Kardex
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
          if (t.type === 'sale' && t.saleStatus === 'completed') {
              const item = t.items.find(i => i.id === prodId);
              if (item) {
                  history.push({
                      id: t.id,
                      type: 'OUT',
                      date: t.date?.seconds * 1000 || Date.now(),
                      qty: item.qty,
                      price: item.transactionPrice,
                      margin: (item.transactionPrice * item.qty) - (item.fifoTotalCost || 0),
                      ref: 'Venta',
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

  // FIFO Logic
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

  // Actions
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

  const handleDeleteProduct = async (productId) => {
      if(window.confirm("¿Estás seguro de eliminar este producto?")) {
        try {
            await deleteDoc(doc(db, `artifacts/${APP_ID}/public/data/products`, productId));
            triggerAlert("Eliminado", "Producto eliminado correctamente", "success");
        } catch (error) {
            triggerAlert("Error", "No se pudo eliminar el producto.", "error");
        }
      }
  }

  const handleVoidTransaction = async (transaction) => {
      if (!transaction.id) return;
      if (!window.confirm(`¿Anular registro de $${formatMoney(transaction.total)}?`)) return;
      setLoading(true);
      setProcessingMsg('Eliminando...');
      try {
          const batch = writeBatch(db);
          batch.delete(doc(db, `artifacts/${APP_ID}/public/data/transactions`, transaction.id));
          if (transaction.saleStatus !== 'pending') {
              transaction.items.forEach(item => {
                  const productRef = doc(db, `artifacts/${APP_ID}/public/data/products`, item.id);
                  const adjustment = transaction.type === 'sale' ? item.qty : -item.qty;
                  batch.update(productRef, { stock: increment(adjustment) });
              });
              if (transaction.type === 'purchase') {
                  const batchesQ = query(collection(db, `artifacts/${APP_ID}/public/data/inventory_batches`), where('transactionId', '==', transaction.id));
                  const batchesSnap = await getDocs(batchesQ);
                  batchesSnap.forEach(b => batch.delete(b.ref));
              }
          }
          await batch.commit();
          setReceiptDetails(null);
          triggerAlert("Éxito", "Registro eliminado.", "success");
      } catch (error) {
          triggerAlert("Error", "No se pudo anular.", "error");
      } finally {
          setLoading(false);
          setProcessingMsg('');
      }
  };

  const handleEditPurchase = async (transaction) => {
      if (transaction.type !== 'purchase') return;
      setLoading(true);
      setProcessingMsg("Cargando lotes originales...");

      try {
          const batchesRef = collection(db, `artifacts/${APP_ID}/public/data/inventory_batches`);
          const q = query(batchesRef, where('transactionId', '==', transaction.id));
          const snapshot = await getDocs(q);
          
          const batchesMap = {};
          const itemsWithBatchId = transaction.items.map(item => {
              const matchingBatch = snapshot.docs.find(d => d.data().productId === item.id);
              if (matchingBatch) {
                  const bData = matchingBatch.data();
                  batchesMap[matchingBatch.id] = { ...bData, id: matchingBatch.id };
                  return { ...item, batchId: matchingBatch.id, originalQty: bData.initialQty, expirationDate: bData.expirationDate };
              }
              return { ...item, originalQty: item.qty };
          });

          setCart(itemsWithBatchId);
          setOriginalBatchesMap(batchesMap);
          if(transaction.clientId) setSelectedSupplier(transaction.clientId);
          setView('purchases');
          setShowPurchaseHistory(false);
          setPurchaseMode('internet'); 
          setEditingTransactionId(transaction.id);
          triggerAlert("Modo Edición", "Ajusta cantidades. El sistema validará el stock vendido.", "info");
      } catch (error) {
          console.error(error);
          triggerAlert("Error", "No se pudo cargar para editar.", "error");
      } finally {
          setLoading(false);
          setProcessingMsg('');
      }
  };

  const handleDeliverOrder = (transaction) => {
      const missingStock = [];
      transaction.items.forEach(item => {
          const currentProduct = products.find(p => p.id === item.id);
          if (!currentProduct || currentProduct.stock < item.qty) {
              missingStock.push(`${item.name} (Faltan: ${item.qty - (currentProduct?.stock || 0)})`);
          }
      });
      if (missingStock.length > 0) {
          triggerAlert("Stock Insuficiente", `Faltan:\n${missingStock.join('\n')}`, "error");
          return;
      }
      setReceiptDetails(null); 
      setDeliveryTransaction(transaction);
      setDeliveryPaymentMethod('Efectivo');
      setIsDeliveryModalOpen(true);
  };

  const finalizeDelivery = async () => {
      if (!deliveryTransaction) return;
      setLoading(true);
      setProcessingMsg("Calculando FIFO...");
      try {
          const batch = writeBatch(db);
          let finalTotalCost = 0;
          const updatedItems = [];
          for (const item of deliveryTransaction.items) {
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
          const transRef = doc(db, `artifacts/${APP_ID}/public/data/transactions`, deliveryTransaction.id);
          const margin = deliveryTransaction.total - finalTotalCost;
          batch.update(transRef, { 
              saleStatus: 'completed', 
              paymentMethod: deliveryPaymentMethod,
              deliveredAt: { seconds: Date.now() / 1000 },
              items: updatedItems,
              totalCost: finalTotalCost,
              margin: margin,
              marginPercent: deliveryTransaction.total > 0 ? (margin / deliveryTransaction.total) * 100 : 0
          });
          await batch.commit();
          setIsDeliveryModalOpen(false);
          setDeliveryTransaction(null);
          triggerAlert("Entregado", "Stock actualizado.", "success");
      } catch (error) {
          console.error(error);
          triggerAlert("Error", "Fallo entrega.", "error");
      } finally {
          setLoading(false);
          setProcessingMsg('');
      }
  };

  // Carrito
  const addToCart = (product) => {
    if (view === 'pos' && saleMode === 'immediate') {
        const currentProduct = products.find(p => p.id === product.id) || product;
        const existingItem = cart.find(p => p.id === product.id);
        if ((existingItem ? existingItem.qty : 0) + 1 > currentProduct.stock) {
            triggerAlert("Stock Insuficiente", `Solo quedan ${currentProduct.stock}.`, "error");
            return;
        }
    }
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) return prev.map(p => p.id === product.id ? { ...p, qty: p.qty + 1 } : p);
      return [...prev, { ...product, transactionPrice: view === 'purchases' ? 0 : product.price, qty: 1, expirationDate: '' }];
    });
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(p => p.id !== id));
  const updateQty = (id, d) => setCart(prev => prev.map(p => {
      if (p.id === id) {
          const n = Math.max(1, p.qty + d);
          if (view === 'pos' && d > 0 && saleMode === 'immediate') {
              const prod = products.find(pr => pr.id === id);
              if (prod && n > prod.stock) { triggerAlert("Stock Límite", `Máx: ${prod.stock}`, "info"); return p; }
          }
          return { ...p, qty: n };
      }
      return p;
  }));
  const updateTransactionPrice = (id, p) => setCart(prev => prev.map(i => i.id === id ? { ...i, transactionPrice: p } : i));
  const updateExpirationDate = (id, d) => setCart(prev => prev.map(i => i.id === id ? { ...i, expirationDate: d } : i));
  const clearCart = () => { 
      setCart([]); setSelectedClient(''); setClientSearchTerm(''); setSelectedSupplier(''); 
      setPaymentMethod(''); setEditingTransactionId(null); setMagazineFile(null); 
      setOriginalBatchesMap({}); 
  };
  const cartTotal = useMemo(() => cart.reduce((acc, item) => acc + (item.transactionPrice * item.qty), 0), [cart]);

  const handleWhatsAppShare = () => {
      let clientPhone = '';
      let clientName = 'Amig@';
      if (selectedClient && selectedClient !== 'Consumidor Final') {
          const c = clients.find(cl => cl.id === selectedClient);
          if (c) { clientName = c.name; if(c.phone) clientPhone = c.phone; }
      }
      const lines = cart.map(item => `- ${item.name} (${item.qty} x $${formatMoney(item.transactionPrice)})`);
      const message = `Hola ${clientName}, resumen:\n\n${lines.join('\n')}\n\n*TOTAL: $${formatMoney(cartTotal)}*`;
      window.open(`https://wa.me/${clientPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleProcessMagazinePDF = () => {
      if (!selectedCycle) { triggerAlert("Falta Ciclo", "Selecciona un ciclo.", "info"); return; }
      if (!magazineFile) { triggerAlert("Falta Archivo", "Sube el PDF.", "info"); return; }
      setLoading(true);
      setProcessingMsg("Procesando...");
      setTimeout(() => {
          setLoading(false);
          setProcessingMsg("");
          triggerAlert("Próximamente", "Lectura PDF en desarrollo.", "info");
      }, 2000);
  };

  const handleTransaction = async () => {
    if (cart.length === 0) { triggerAlert("Vacío", "Agrega productos.", "info"); return; }
    const type = view === 'purchases' ? 'purchase' : 'sale';

    if (type === 'sale') {
        if (!selectedClient) { triggerAlert("Falta Cliente", "Selecciona cliente.", "info"); return; }
        if (!paymentMethod && saleMode === 'immediate') { triggerAlert("Falta Pago", "Selecciona medio de pago.", "info"); return; }
    }
    if (type === 'purchase') {
        if (!selectedSupplier) { triggerAlert("Falta Proveedor", "Selecciona proveedor.", "info"); return; }
        if (cart.some(i => i.transactionPrice <= 0)) { triggerAlert("Costo 0", "Ingresa costos válidos.", "error"); return; }
        if (cart.some(i => !i.expirationDate)) { triggerAlert("Faltan Fechas", "Ingresa vencimientos.", "error"); return; }
    }

    setLoading(true);
    setProcessingMsg(editingTransactionId ? 'Actualizando...' : 'Guardando...');

    try {
        const batch = writeBatch(db);

        if (editingTransactionId && type === 'purchase') {
             const transRef = doc(db, `artifacts/${APP_ID}/public/data/transactions`, editingTransactionId);
             
             for (const item of cart) {
                 if (item.batchId && originalBatchesMap[item.batchId]) {
                     const oldBatch = originalBatchesMap[item.batchId];
                     const qtyDiff = item.qty - oldBatch.initialQty;
                     if (qtyDiff < 0 && oldBatch.remainingQty < Math.abs(qtyDiff)) {
                         throw new Error(`No puedes reducir ${item.name}. Unidades ya vendidas.`);
                     }
                     const batchRef = doc(db, `artifacts/${APP_ID}/public/data/inventory_batches`, item.batchId);
                     batch.update(batchRef, {
                         initialQty: item.qty,
                         remainingQty: increment(qtyDiff), 
                         cost: Number(item.transactionPrice),
                         expirationDate: item.expirationDate
                     });
                     const prodRef = doc(db, `artifacts/${APP_ID}/public/data/products`, item.id);
                     batch.update(prodRef, { stock: increment(qtyDiff) });
                 } else {
                     const batchRef = doc(collection(db, `artifacts/${APP_ID}/public/data/inventory_batches`));
                     batch.set(batchRef, {
                         productId: item.id,
                         productName: item.name,
                         date: { seconds: Date.now() / 1000 },
                         cost: Number(item.transactionPrice),
                         initialQty: Number(item.qty),
                         remainingQty: Number(item.qty),
                         supplierId: selectedSupplier,
                         expirationDate: item.expirationDate,
                         transactionId: editingTransactionId
                     });
                     const prodRef = doc(db, `artifacts/${APP_ID}/public/data/products`, item.id);
                     batch.update(prodRef, { stock: increment(item.qty) });
                 }
             }
             batch.update(transRef, { items: cart, total: cartTotal, clientId: selectedSupplier });
        }
        else {
            const newTransId = editingTransactionId || doc(collection(db, `artifacts/${APP_ID}/public/data/transactions`)).id;
            const originMethod = purchaseMode === 'magazine' ? 'PDF' : 'Manual';

            if (type === 'purchase') {
                cart.forEach(item => {
                    const batchRef = doc(collection(db, `artifacts/${APP_ID}/public/data/inventory_batches`));
                    batch.set(batchRef, {
                        productId: item.id,
                        productName: item.name,
                        date: { seconds: Date.now() / 1000 },
                        cost: Number(item.transactionPrice),
                        initialQty: Number(item.qty),
                        remainingQty: Number(item.qty),
                        supplierId: selectedSupplier,
                        expirationDate: item.expirationDate,
                        transactionId: newTransId
                    });
                    batch.update(doc(db, `artifacts/${APP_ID}/public/data/products`, item.id), { stock: increment(item.qty) });
                });
            } 
            
            if (type === 'sale' && saleMode === 'immediate') {
                 for (const item of cart) {
                     const { totalCost, batchUpdates, fifoDetails } = await calculateFIFOCost(item.id, item.qty);
                     item.fifoTotalCost = totalCost; 
                     item.fifoDetails = fifoDetails;
                     batchUpdates.forEach(u => batch.update(doc(db, `artifacts/${APP_ID}/public/data/inventory_batches`, u.id), { remainingQty: u.newRemainingQty }));
                     batch.update(doc(db, `artifacts/${APP_ID}/public/data/products`, item.id), { stock: increment(-item.qty) });
                 }
            }

            const transactionFIFO = type === 'sale' && saleMode === 'immediate' ? cart.reduce((acc, i) => acc + (i.fifoTotalCost || 0), 0) : 0;
            const margin = type === 'sale' ? (cartTotal - transactionFIFO) : 0;

            batch.set(doc(db, `artifacts/${APP_ID}/public/data/transactions`, newTransId), {
                id: newTransId, 
                type,
                items: [...cart],
                total: cartTotal,
                clientId: type === 'purchase' ? selectedSupplier : selectedClient,
                date: { seconds: Date.now() / 1000 },
                paymentMethod: type === 'sale' && saleMode === 'immediate' ? paymentMethod : null,
                totalCost: transactionFIFO,
                margin: margin,
                marginPercent: (type === 'sale' && cartTotal > 0) ? (margin/cartTotal)*100 : 0,
                saleStatus: type === 'sale' ? (saleMode === 'immediate' ? 'completed' : 'pending') : 'completed',
                origin: type === 'purchase' ? originMethod : 'POS' 
            });
        }

        await batch.commit();
        clearCart();
        if (editingTransactionId) setPurchaseMode(null);
        triggerAlert("Éxito", "Operación completada.", "success");
    } catch (error) {
        console.error(error);
        triggerAlert("Error", "Fallo al guardar.", "error");
    } finally {
        setLoading(false);
        setProcessingMsg('');
    }
  };

  const simpleSave = async (collectionName, data, isModalOpenSetter) => {
    try { await addDoc(collection(db, `artifacts/${APP_ID}/public/data/${collectionName}`), data); isModalOpenSetter(false); }
    catch (e) { console.error(e); triggerAlert("Error", "No se pudo guardar.", "error"); }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    
    const fd = new FormData(e.currentTarget);
    const price = parseInt(fd.get('price').replace(/\D/g, ''), 10) || 0;
    const imageFile = fd.get('image');
    
    // --- NUEVO: VALIDACIÓN OBLIGATORIA DE IMAGEN ---
    // Si NO se está editando (es nuevo) Y no hay imagen, lanza error.
    if (!editingProduct && (!imageFile || imageFile.size === 0)) {
        triggerAlert("Falta Imagen", "Es obligatorio subir una foto del producto.", "error");
        return;
    }
    // -----------------------------------------------

    setLoading(true);
    let imageUrl = editingProduct?.imageUrl || null;
    
    try {
        if (imageFile && imageFile.size > 0) {
            // --- NUEVO: CARPETA NATURA ---
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
            imageUrl 
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
        const docRef = await addDoc(collection(db, `artifacts/${APP_ID}/public/data/clients`), clientData); 
        setIsClientModalOpen(false); 
        if(view === 'pos'){ 
            setSelectedClient(docRef.id); 
            setClientSearchTerm(clientData.name); 
        } 
        triggerAlert("Cliente Creado", "El cliente ha sido registrado exitosamente.", "success"); 
    } catch (e) { 
        console.error(e);
        triggerAlert("Error", "Fallo al guardar.", "error"); 
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

  // Filters & Reports
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

  const getFilteredTransactions = (type, start, end, entityId, productSearch) => {
    let filtered = transactions.filter(t => t.type === type);
    if (entityId) filtered = filtered.filter(t => t.clientId === entityId);
    if (start) filtered = filtered.filter(t => new Date(t.date.seconds * 1000) >= new Date(`${start}T00:00:00`));
    if (end) filtered = filtered.filter(t => new Date(t.date.seconds * 1000) <= new Date(`${end}T23:59:59.999`));
    if (productSearch) filtered = filtered.filter(t => t.items.some(i => i.name.toLowerCase().includes(productSearch.toLowerCase())));
    return filtered;
  };

  const filteredSales = useMemo(() => getFilteredTransactions('sale', filterStartDate, filterEndDate, filterClient, filterProduct), [transactions, filterStartDate, filterEndDate, filterClient, filterProduct]);
  const filteredPurchases = useMemo(() => getFilteredTransactions('purchase', phStartDate, phEndDate, phSupplier, phProduct), [transactions, phStartDate, phEndDate, phSupplier, phProduct]);

  const getClientName = (id) => clients.find(c => c.id === id)?.name || 'Consumidor Final';
  
  const getSupplierName = (id) => {
      if (SUPPLIERS_OPTIONS.includes(id)) return id;
      return id || 'Proveedor'; 
  };

  // --- LOGICA NUEVOS REPORTES ---
  const expiringProducts = useMemo(() => {
      // Filtrar lotes con stock > 0 y con fecha de vencimiento
      const expiring = inventoryBatches.filter(b => b.remainingQty > 0 && b.expirationDate);
      // Ordenar por fecha más próxima
      expiring.sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));
      return expiring.slice(0, 10); // Top 10
  }, [inventoryBatches]);

  const pendingOrdersData = useMemo(() => {
      const pendingMap = {}; // brand -> items[]
      
      transactions
          .filter(t => t.type === 'sale' && t.saleStatus === 'pending')
          .forEach(t => {
              t.items.forEach(item => {
                   // Buscar marca actual en productos (si cambia) o usar del item
                   const product = products.find(p => p.id === item.id);
                   const brand = product ? product.brand : (item.brand || 'Sin Marca');
                   
                   if (!pendingMap[brand]) pendingMap[brand] = [];
                   
                   // Buscar si ya existe ese producto en la lista de la marca para sumar cantidad
                   const existingItem = pendingMap[brand].find(i => i.id === item.id);
                   if (existingItem) {
                       existingItem.qty += item.qty;
                   } else {
                       pendingMap[brand].push({ ...item, qty: item.qty });
                   }
              });
          });
      return pendingMap;
  }, [transactions, products]);

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
    reportTrans.forEach(t => t.items.forEach(i => {
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

  // --- ALERT CONFIG ---
  const getAlertConfig = (type) => {
    switch(type) {
        case 'success': return { border: 'border-green-500', icon: CheckCircle2, color: 'text-green-600' };
        case 'error': return { border: 'border-red-500', icon: AlertCircle, color: 'text-red-600' };
        default: return { border: 'border-orange-500', icon: Info, color: 'text-orange-500' };
    }
  };

  // NUEVO: HELPER PARA TITULOS DE HEADER
  const getHeaderTitle = () => {
      switch(view) {
          case 'pos': return 'Registra Venta';
          case 'purchases': return 'Registrar Stock';
          case 'receipts': return 'Registro de Ventas';
          case 'inventory': return 'Inventario';
          case 'reports': return 'Reportes';
          default: return view;
      }
  };

  if (!user && loading) return <div className="flex h-screen items-center justify-center bg-stone-100 text-orange-600">Iniciando...</div>;

  return (
    <div className="flex flex-col h-screen bg-stone-50 text-stone-800 font-sans overflow-hidden">
      {/* Alert - Z-Index 100 */}
      {alertState.show && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className={`bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl text-center border-t-4 ${getAlertConfig(alertState.type).border}`}>
                {React.createElement(getAlertConfig(alertState.type).icon, { className: `w-8 h-8 mx-auto mb-4 ${getAlertConfig(alertState.type).color}` })}
                <h3 className="text-lg font-bold mb-2">{alertState.title}</h3>
                <p className="text-sm text-stone-500 mb-4">{alertState.message}</p>
                <button onClick={() => setAlertState({...alertState, show: false})} className="w-full py-2 bg-stone-900 text-white rounded-lg font-bold">OK</button>
            </div>
        </div>
      )}

      {/* Header */}
      <header className={`${view === 'purchases' ? 'bg-stone-700' : view === 'receipts' ? 'bg-stone-700' : 'bg-orange-500'} text-white p-4 shadow-md flex justify-between items-center z-10 shrink-0`}>
        <h1 className="font-bold text-lg flex items-center gap-2">
            {view === 'pos' ? <Leaf className="w-5 h-5"/> : view === 'inventory' ? <Package className="w-5 h-5"/> : view === 'purchases' ? <Truck className="w-5 h-5"/> : view === 'receipts' ? <Receipt className="w-5 h-5"/> : <LayoutDashboard className="w-5 h-5"/>} 
            {getHeaderTitle()}
        </h1>
      </header>

      {/* Main */}
      <main className={`flex-1 overflow-hidden relative flex flex-col ${view !== 'pos' && view !== 'purchases' ? 'overflow-y-auto' : ''}`}>
        
        {/* POS & PURCHASES */}
        {(view === 'pos' || view === 'purchases') && !showPurchaseHistory && (
          <div className="flex flex-col h-full relative">
            {/* SubHeader */}
            <div className={`px-4 py-2 border-b flex justify-between items-center shrink-0 ${view === 'purchases' ? 'bg-stone-100' : (saleMode === 'order' ? 'bg-blue-50' : 'bg-green-50')}`}>
                 <div className="text-xs font-bold flex items-center gap-2 text-stone-700">
                    {view === 'purchases' ? (editingTransactionId ? 'EDITANDO' : (purchaseMode === 'magazine' ? 'PDF' : 'MANUAL')) : (saleMode === 'order' ? 'ENCARGO' : 'VENTA')}
                 </div>
                 <div className="flex gap-2">
                    {view === 'purchases' && !editingTransactionId && purchaseMode && <button onClick={() => setPurchaseMode(null)} className="text-xs bg-white border px-2 py-1 rounded">Volver</button>}
                    {view === 'pos' && saleMode && <button onClick={() => { setSaleMode(null); clearCart(); }} className="text-xs bg-white border px-2 py-1 rounded">Cambiar</button>}
                    {view === 'purchases' && !editingTransactionId && !purchaseMode && <button onClick={() => setShowPurchaseHistory(true)} className="text-xs bg-white border px-2 py-1 rounded flex gap-1"><History className="w-3 h-3"/> Historial</button>}
                    {editingTransactionId && <button onClick={clearCart} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-bold">Cancelar</button>}
                 </div>
            </div>

            {/* Mode Selectors */}
            {view === 'pos' && !saleMode && (
                <div className="flex-1 p-6 flex flex-col justify-center items-center gap-4 bg-stone-50">
                    <button onClick={() => setSaleMode('immediate')} className="w-full max-w-sm p-6 bg-white rounded-2xl shadow hover:border-green-500 border-2 border-transparent flex items-center gap-4"><div className="bg-green-100 text-green-600 p-4 rounded-full"><PackageCheck className="w-8 h-8" /></div><div className="text-left"><h3 className="font-bold text-lg">Entrega Inmediata</h3><p className="text-sm text-stone-500">Descuenta stock.</p></div></button>
                    <button onClick={() => setSaleMode('order')} className="w-full max-w-sm p-6 bg-white rounded-2xl shadow hover:border-blue-500 border-2 border-transparent flex items-center gap-4"><div className="bg-blue-100 text-blue-600 p-4 rounded-full"><Clock className="w-8 h-8" /></div><div className="text-left"><h3 className="font-bold text-lg">Por Encargo</h3><p className="text-sm text-stone-500">Reserva.</p></div></button>
                </div>
            )}
            {view === 'purchases' && !purchaseMode && (
                <div className="flex-1 p-6 flex flex-col justify-center items-center gap-4 bg-stone-50">
                    <button onClick={() => setPurchaseMode('internet')} className="w-full max-w-sm p-6 bg-white rounded-2xl shadow hover:border-orange-500 border-2 border-transparent flex items-center gap-4"><div className="bg-orange-100 text-orange-600 p-4 rounded-full"><Globe className="w-8 h-8" /></div><div className="text-left"><h3 className="font-bold text-lg">Manual</h3><p className="text-sm text-stone-500">Ingreso uno a uno.</p></div></button>
                    <button onClick={() => setPurchaseMode('magazine')} className="w-full max-w-sm p-6 bg-white rounded-2xl shadow hover:border-purple-500 border-2 border-transparent flex items-center gap-4"><div className="bg-purple-100 text-purple-600 p-4 rounded-full"><FileType className="w-8 h-8" /></div><div className="text-left"><h3 className="font-bold text-lg">PDF Pedido</h3><p className="text-sm text-stone-500">Carga automática.</p></div></button>
                </div>
            )}

            {/* Magazine Mode */}
            {view === 'purchases' && purchaseMode === 'magazine' && (
                <div className="flex-1 p-6 flex flex-col items-center bg-stone-50">
                    <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-sm space-y-6">
                        <div className="text-center"><FileType className="w-16 h-16 text-purple-600 mx-auto mb-3"/><h2 className="text-xl font-bold">Cargar PDF</h2></div>
                        <select className="w-full p-3 border rounded-xl" value={selectedCycle} onChange={(e) => setSelectedCycle(e.target.value)}><option value="">Selecciona Ciclo</option>{cycles.map(c => <option key={c} value={c}>{c}</option>)}</select>
                        <input type="file" accept=".pdf" onChange={(e) => setMagazineFile(e.target.files[0])} className="w-full border p-2 rounded-xl"/>
                        <button onClick={handleProcessMagazinePDF} disabled={!selectedCycle || !magazineFile} className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold disabled:bg-stone-300">Procesar</button>
                    </div>
                </div>
            )}

            {/* Operation Screen */}
            {((view === 'pos' && saleMode) || (view === 'purchases' && purchaseMode === 'internet')) && (
                <>
                    <div className="p-4 bg-stone-50 shadow-sm space-y-3">
                        <div className="relative"><Search className="absolute left-3 top-3 w-5 h-5 text-stone-400"/><input className="w-full pl-10 p-2 rounded-lg border outline-none" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/></div>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar"><button onClick={() => setSelectedCategoryFilter('ALL')} className={`px-3 py-1 rounded-full border text-xs ${selectedCategoryFilter === 'ALL' ? 'bg-orange-600 text-white' : 'bg-white'}`}>Todos</button>{categories.map(c => <button key={c.id} onClick={() => setSelectedCategoryFilter(c.id)} className={`px-3 py-1 rounded-full border text-xs ${selectedCategoryFilter === c.id ? 'bg-orange-600 text-white' : 'bg-white'}`}>{c.name}</button>)}</div>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-48">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {filteredProducts.map(p => (
                                <button key={p.id} onClick={() => addToCart(p)} className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col h-full group hover:shadow-md transition-all">
                                    <div className="aspect-square w-full relative">
                                        {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <Leaf className="w-full h-full p-8 text-stone-200 bg-stone-50" />}
                                        {p.stock <= 0 && view === 'pos' && saleMode === 'immediate' && <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20 font-bold text-red-600">AGOTADO</div>}
                                    </div>
                                    <div className="p-2 flex flex-col flex-1 justify-between text-left">
                                        <span className="font-bold text-sm line-clamp-2 leading-tight text-stone-700">{p.name}</span>
                                        <div className="mt-2 flex justify-between items-end">
                                            <span className="text-orange-600 font-bold">${formatMoney(p.price)}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold ${getStockStatus(p.stock).color}`}>{p.stock}</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Cart */}
                    {cart.length > 0 && (
                        <div className="fixed bottom-[76px] left-0 w-full z-20 flex flex-col shadow-2xl">
                            <div className={`rounded-t-3xl border-t p-4 ${editingTransactionId ? 'bg-amber-50' : 'bg-white'}`}>
                                <div className="max-h-48 overflow-y-auto mb-2">
                                    {cart.map(item => (
                                        <div key={item.id} className="flex flex-col mb-3 border-b border-stone-50 last:border-0 pb-3">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1 pr-2">
                                                    <div className="text-sm font-medium text-stone-800 line-clamp-1">{item.name}</div>
                                                </div>
                                                <button onClick={() => removeFromCart(item.id)} className="text-red-400 p-1"><X className="w-4 h-4" /></button>
                                            </div>
                                            
                                            <div className="flex items-end gap-3">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] text-stone-400 font-bold uppercase mb-1">Cant.</span>
                                                    <div className="flex items-center bg-stone-100 rounded-lg h-9">
                                                        <button onClick={() => updateQty(item.id, -1)} className="px-2 h-full hover:bg-stone-200 rounded-l-lg text-stone-600"><Minus className="w-3 h-3" /></button>
                                                        <span className="text-sm font-bold w-8 text-center">{item.qty}</span>
                                                        <button onClick={() => updateQty(item.id, 1)} className="px-2 h-full hover:bg-stone-200 rounded-r-lg text-stone-600"><Plus className="w-3 h-3" /></button>
                                                    </div>
                                                </div>

                                                {view === 'purchases' ? (
                                                    <>
                                                        <div className="flex flex-col flex-1">
                                                            <span className="text-[9px] text-stone-400 font-bold uppercase mb-1">Costo Unit.</span>
                                                            <div className="relative">
                                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400 text-xs">$</span>
                                                                <input 
                                                                    type="text" 
                                                                    className="w-full h-9 pl-5 pr-2 text-right border border-stone-200 rounded-lg text-sm font-bold text-stone-700 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-200 transition-all" 
                                                                    value={item.transactionPrice === 0 ? '' : formatMoney(item.transactionPrice)} 
                                                                    placeholder="0"
                                                                    onChange={(e) => updateTransactionPrice(item.id, parseInt(e.target.value.replace(/\D/g, ''), 10) || 0)}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col w-28">
                                                            <span className="text-[9px] text-stone-400 font-bold uppercase mb-1">Vencimiento</span>
                                                            <input type="date" className={`w-full h-9 px-2 border rounded-lg text-xs font-medium outline-none focus:border-orange-500 transition-all ${!item.expirationDate ? 'border-red-300 bg-red-50 text-red-600' : 'border-stone-200 text-stone-700'}`} value={item.expirationDate || ''} onChange={(e) => updateExpirationDate(item.id, e.target.value)} />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-end flex-1">
                                                        <span className="text-[9px] text-stone-400 font-bold uppercase mb-1">Precio Total</span>
                                                        <span className="text-lg font-bold text-stone-700">${formatMoney(item.transactionPrice * item.qty)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2 items-center mb-3">
                                    {view === 'pos' ? (
                                        <>
                                            <div className="flex-1 relative" ref={clientInputRef}>
                                                <input className="w-full h-10 pl-9 border rounded-xl text-sm pr-8" placeholder="Cliente..." value={clientSearchTerm} onChange={e => { setClientSearchTerm(e.target.value); setShowClientOptions(true); }} onFocus={() => setShowClientOptions(true)} />
                                                <Users className="absolute left-3 top-3 w-4 h-4 text-stone-400"/>
                                                {selectedClient && <button onClick={() => { setSelectedClient(''); setClientSearchTerm(''); }} className="absolute right-2 top-2 text-stone-400 hover:text-red-500"><X className="w-5 h-5"/></button>}
                                                {showClientOptions && <div className="absolute bottom-full w-full bg-white border rounded-xl shadow-lg max-h-40 overflow-y-auto">{filteredClientsForSearch.map(c => <div key={c.id} className="p-3 hover:bg-stone-50 text-sm cursor-pointer" onClick={() => { setSelectedClient(c.id); setClientSearchTerm(c.name); setShowClientOptions(false); }}>{c.name}</div>)}</div>}
                                            </div>
                                            {saleMode === 'immediate' && <select className="h-10 border rounded-xl px-2 w-28 text-sm" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}><option value="" disabled>Pago</option><option value="Efectivo">Efectivo</option><option value="Transferencia">Transf.</option></select>}
                                            <button onClick={() => setIsClientModalOpen(true)} className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center"><UserPlus className="w-5 h-5 text-orange-600"/></button>
                                        </>
                                    ) : (
                                        <div className="flex flex-1 gap-2">
                                            <select className="flex-1 h-10 border rounded-xl px-2 text-sm bg-white" value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)}>
                                                <option value="">Seleccionar Proveedor</option>
                                                {SUPPLIERS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {view === 'pos' && <button onClick={() => setShowPreTicket(true)} className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center text-white"><MessageCircle className="w-5 h-5"/></button>}
                                    <button onClick={handleTransaction} className="flex-1 h-12 bg-stone-800 text-white rounded-xl font-bold flex justify-between px-6 items-center"><span>Confirmar</span><span>${formatMoney(cartTotal)}</span></button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
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
                                {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <Leaf className="w-full h-full p-8 text-stone-200 bg-stone-50" />}
                            </div>
                            <div className="p-2 flex flex-col flex-1 justify-between text-left">
                                <span className="font-bold text-sm line-clamp-2 leading-tight text-stone-700">{p.name}</span>
                                <div className="mt-2 flex justify-between items-end">
                                    <span className="text-orange-600 font-bold">${formatMoney(p.price)}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold ${getStockStatus(p.stock).color}`}>{p.stock}</span>
                                </div>
                                <div className="flex gap-2 mt-3 pt-2 border-t">
                                    <button onClick={() => { setViewingHistoryProduct(p); setIsHistoryModalOpen(true); loadProductHistory(p.id); }} className="flex-1 py-1 bg-purple-50 text-purple-600 rounded flex justify-center"><ScrollText className="w-4 h-4"/></button>
                                    <button onClick={() => { setEditingProduct(p); setProductPriceInput('$'+formatMoney(p.price)); setIsProductModalOpen(true); }} className="flex-1 py-1 bg-blue-50 text-blue-600 rounded flex justify-center"><Pencil className="w-4 h-4"/></button>
                                    <button onClick={() => handleDeleteProduct(p.id)} className="flex-1 py-1 bg-red-50 text-red-600 rounded flex justify-center"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* RECEIPTS */}
        {view === 'receipts' && (
            <div className="p-4 overflow-y-auto pb-24">
                <h2 className="font-bold text-lg mb-4">Ventas</h2>
                <div className="space-y-3">
                    {filteredSales.map(t => (
                        <div key={t.id} onClick={() => setReceiptDetails(t)} className="p-4 bg-white rounded-xl shadow-sm border cursor-pointer">
                            <div className="flex justify-between mb-2">
                                <span className={`px-2 py-0.5 text-xs font-bold rounded ${t.saleStatus === 'pending' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{t.saleStatus === 'pending' ? 'POR ENCARGO' : 'ENTREGADO'}</span>
                                <span className="text-xs text-stone-400">{formatDateWithTime(t.date.seconds)}</span>
                            </div>
                            <div className="flex justify-between">
                                <div><div className="font-bold text-lg">${formatMoney(t.total)}</div><div className="text-xs text-stone-500">{getClientName(t.clientId)}</div></div>
                                {t.saleStatus === 'completed' && t.margin > 0 && <div className="text-right"><div className="text-xs font-bold text-green-600">+${formatMoney(t.margin)}</div><div className="text-[10px] text-stone-400">Margen</div></div>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* PURCHASE HISTORY */}
        {view === 'purchases' && showPurchaseHistory && (
            <div className="flex flex-col h-full">
                <div className="p-4 border-b flex justify-between items-center"><button onClick={() => setShowPurchaseHistory(false)} className="flex items-center text-stone-600 gap-1"><ChevronLeft className="w-4 h-4"/> Volver</button></div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {filteredPurchases.map(t => (
                        <div key={t.id} onClick={() => setReceiptDetails(t)} className="p-4 bg-white rounded-xl shadow-sm border cursor-pointer hover:bg-stone-50 transition-colors">
                            <div className="flex justify-between mb-2">
                                <div className="font-bold text-lg text-stone-800">${formatMoney(t.total)}</div>
                                <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded uppercase">{t.origin || 'Manual'}</span>
                            </div>
                            <div className="text-xs text-stone-500 flex justify-between mb-2">
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {new Date(t.date.seconds*1000).toLocaleDateString()}</span>
                                <span className="font-medium text-stone-700">{getSupplierName(t.clientId)}</span>
                            </div>
                            <div className="flex gap-2 justify-end pt-2 border-t border-stone-100" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => handleEditPurchase(t)} className="p-2 bg-amber-50 text-amber-600 rounded hover:bg-amber-100"><Pencil className="w-4 h-4"/></button>
                                <button onClick={() => handleVoidTransaction(t)} className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100"><Trash2 className="w-4 h-4"/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* REPORTS */}
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

                <div className="bg-white p-3 rounded-xl shadow-sm border border-stone-100 grid grid-cols-2 gap-3">
                   <div><label className="text-[10px] text-stone-400 font-bold uppercase">Inicio</label><input type="date" className="w-full text-sm p-1 bg-stone-50 rounded border-0" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} /></div>
                   <div><label className="text-[10px] text-stone-400 font-bold uppercase">Fin</label><input type="date" className="w-full text-sm p-1 bg-stone-50 rounded border-0" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} /></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-orange-500 flex flex-col justify-between h-28">
                        <div className="flex justify-between items-start"><div className="text-xs font-bold text-stone-400 uppercase tracking-wide">Ventas Netas</div><div className="p-1.5 bg-orange-50 rounded-lg"><Wallet className="w-5 h-5 text-orange-600"/></div></div>
                        <div className="text-2xl font-black text-stone-800 tracking-tight">${formatMoney(reportData.totalSales)}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-stone-500 flex flex-col justify-between h-28">
                        <div className="flex justify-between items-start"><div className="text-xs font-bold text-stone-400 uppercase tracking-wide">Costo (FIFO)</div><div className="p-1.5 bg-stone-50 rounded-lg"><TrendingDown className="w-5 h-5 text-stone-600"/></div></div>
                        <div className="text-2xl font-black text-stone-800 tracking-tight">${formatMoney(reportData.totalCost)}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-lg border border-stone-200 col-span-2 flex justify-between items-center h-24 relative overflow-hidden">
                        <div className="relative z-10"><div className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-1">Margen Real</div><div className="text-4xl font-black text-stone-800 tracking-tight">${formatMoney(reportData.margin)}</div></div>
                        <div className="relative z-10 flex flex-col items-end"><div className="bg-green-100 text-green-700 px-3 py-1 rounded-lg font-bold text-lg border border-green-200">{reportData.marginPercent.toFixed(1)}%</div></div>
                        <div className="absolute right-0 bottom-0 opacity-5"><TrendingUp className="w-32 h-32 text-stone-800"/></div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-100">
                    <h3 className="font-bold text-stone-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide"><BarChart3 className="w-4 h-4 text-stone-400"/> Tendencia Diaria</h3>
                    <div className="flex items-end gap-2 h-32 pb-2 border-b border-stone-100">
                        {reportData.timelineData.length === 0 ? <div className="w-full text-center text-xs text-stone-300 self-center">Sin datos en este periodo</div> : 
                         reportData.timelineData.map((d, i) => {
                             const maxVal = Math.max(...reportData.timelineData.map(x => x.total));
                             const heightPct = maxVal > 0 ? (d.total / maxVal) * 100 : 0;
                             return (
                                 <div key={i} className="flex-1 h-full flex flex-col items-center justify-end gap-1 group relative">
                                     <div className="w-full flex-1 flex items-end justify-center relative">
                                         <div className="w-full bg-orange-500 rounded-t-sm relative hover:bg-orange-600 transition-colors" 
                                              style={{height: `${Math.max(heightPct, 5)}%`}}>
                                            <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-stone-800 text-white text-[10px] p-1 rounded whitespace-nowrap z-10 pointer-events-none">
                                                ${formatMoney(d.total)}
                                            </div>
                                         </div>
                                     </div>
                                     <div className="text-[9px] text-stone-400 font-medium whitespace-nowrap">{d.date}</div>
                                 </div>
                             )
                          })
                        }
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-100">
                        <h3 className="font-bold text-stone-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide"><Package className="w-4 h-4 text-stone-400"/> Top Productos</h3>
                        <div className="space-y-3">
                            {reportData.productRanking.length === 0 && <div className="text-xs text-stone-400 text-center py-4">Sin ventas</div>}
                            {reportData.productRanking.map((p,i) => (
                                <div key={i} className="flex justify-between items-center text-sm border-b border-stone-50 last:border-0 pb-2">
                                    <div className="flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-500">{i + 1}</div><div className="font-medium text-stone-700 line-clamp-1">{p.name}</div></div>
                                    <div className="text-right"><div className="font-bold text-stone-800">${formatMoney(p.revenue)}</div><div className="text-[10px] text-stone-400">{p.qty} un.</div></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-100">
                        <h3 className="font-bold text-stone-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide"><Users className="w-4 h-4 text-stone-400"/> Top Clientes</h3>
                        <div className="space-y-3">
                            {reportData.clientRanking.length === 0 && <div className="text-xs text-stone-400 text-center py-4">Sin datos</div>}
                            {reportData.clientRanking.map((c,i) => (
                                <div key={i} className="flex justify-between items-center text-sm border-b border-stone-50 last:border-0 pb-2">
                                    <div className="flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-500">{i + 1}</div><div className="font-medium text-stone-700 line-clamp-1">{c.name}</div></div>
                                    <div className="text-right"><div className="font-bold text-stone-800">${formatMoney(c.total)}</div><div className="text-[10px] text-stone-400">{c.count} compras</div></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* CLIENTS */}
        {view === 'clients' && (
            <div className="p-4 pb-24 overflow-y-auto">
                <button onClick={() => setIsClientModalOpen(true)} className="w-full py-3 bg-orange-600 text-white font-bold rounded-xl mb-4 shadow-lg">Crear Cliente</button>
                {clients.map(c => <div key={c.id} className="p-4 bg-white rounded-xl shadow-sm border mb-2"><div className="font-bold">{c.name}</div><div className="text-sm text-stone-500">{c.phone}</div></div>)}
            </div>
        )}

      </main>

      {/* --- MODALS --- */}

      {/* NUEVO: Modal Por Vencer */}
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

      {/* NUEVO: Modal Por Comprar (Pendientes) */}
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

      {/* NUEVO: MODAL HISTORIAL (KARDEX) - Z-Index 80 */}
      {isHistoryModalOpen && viewingHistoryProduct && (
        <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[80vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center bg-stone-50 rounded-t-2xl">
                    <div>
                        <h2 className="text-lg font-bold text-stone-800">Historial: {viewingHistoryProduct.name}</h2>
                        <p className="text-xs text-stone-500">Ordenado por fecha (Reciente primero)</p>
                    </div>
                    <button onClick={() => setIsHistoryModalOpen(false)}><X className="w-6 h-6 text-stone-400"/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    {loadingHistory ? <div className="text-center py-10 text-stone-400">Cargando...</div> : (
                        <div className="border rounded-xl overflow-hidden text-xs">
                            <table className="w-full text-left">
                                <thead className="bg-stone-100 text-stone-500 font-bold">
                                    <tr><th className="p-3">Fecha/Hora</th><th className="p-3">Mov.</th><th className="p-3 text-right">Cant.</th><th className="p-3 text-right">Precio</th></tr>
                                </thead>
                                <tbody className="divide-y divide-stone-50">
                                    {productHistory.length === 0 && <tr><td colSpan="4" className="p-4 text-center text-stone-400">Sin movimientos.</td></tr>}
                                    {productHistory.map((mov) => (
                                        <tr key={mov.id} className="hover:bg-stone-50">
                                            <td className="p-3 text-stone-500">{formatDateWithTime(mov.date / 1000)}</td>
                                            <td className="p-3"><span className={`font-bold ${mov.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>{mov.type === 'IN' ? 'ENTRADA' : 'VENTA'}</span></td>
                                            <td className="p-3 text-right font-bold">{mov.qty}</td>
                                            <td className="p-3 text-right text-stone-600"><div>${formatMoney(mov.price)}</div><div className="text-[9px] text-stone-400 uppercase">{mov.type === 'IN' ? 'Costo' : 'Venta'}</div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* MODAL RECIBO - Z-Index 70 */}
      {receiptDetails && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md h-[80vh] sm:h-auto sm:max-h-[85vh] sm:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden">
                <div className="p-5 border-b flex justify-between items-center bg-stone-50">
                    <h2 className="font-bold text-lg flex items-center gap-2"><Receipt className="w-5 h-5"/> Detalle {receiptDetails.type === 'purchase' ? 'Recepción' : 'Venta'}</h2>
                    <button onClick={() => setReceiptDetails(null)} className="bg-white p-2 rounded-full shadow-sm"><X className="w-5 h-5"/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-5">
                    <div className="text-center mb-6">
                        <div className="text-sm text-stone-500 mb-1">{receiptDetails.type === 'purchase' ? getSupplierName(receiptDetails.clientId) : getClientName(receiptDetails.clientId)}</div>
                        <div className="text-4xl font-black">${formatMoney(receiptDetails.total)}</div>
                    </div>
                    {/* INFO FINANCIERA (Solo venta entregada) */}
                    {receiptDetails.type === 'sale' && receiptDetails.saleStatus === 'completed' && receiptDetails.totalCost > 0 && (
                        <div className="bg-stone-50 p-4 rounded-xl border mb-4 space-y-2">
                            <div className="flex justify-between text-xs text-stone-500"><span>Costo Mercadería (FIFO Exacto)</span><span>${formatMoney(receiptDetails.totalCost)}</span></div>
                            <div className="flex justify-between font-bold text-stone-800 text-sm pt-2 border-t"><span>Margen Ganancia</span><span className="text-green-600">+${formatMoney(receiptDetails.margin)}</span></div>
                        </div>
                    )}
                    <div className="space-y-3">
                        {receiptDetails.items.map((item, idx) => (
                            <div key={idx} className="py-2 border-b border-dashed last:border-0">
                                <div className="flex justify-between">
                                    <div className="text-sm"><span className="font-bold">{item.qty}x</span> {item.name}</div>
                                    <div className="font-bold">${formatMoney(item.transactionPrice * item.qty)}</div>
                                </div>
                                {receiptDetails.type === 'purchase' ? (
                                     <div className="text-[10px] text-stone-400">Costo unitario: ${formatMoney(item.transactionPrice)}</div>
                                ) : (
                                    /* Desglose FIFO solo en ventas */
                                    item.fifoDetails && item.fifoDetails.map((detail, dIdx) => (
                                        <div key={dIdx} className="text-[10px] text-stone-500 pl-2 mt-1">
                                        - {detail.qty} un. del {formatDateSimple(detail.date)} a ${formatMoney(detail.cost)}
                                        </div>
                                    ))
                                )}
                            </div>
                        ))}
                    </div>
                    {receiptDetails.saleStatus === 'pending' && <button onClick={() => handleDeliverOrder(receiptDetails)} className="w-full mt-6 bg-blue-600 text-white font-bold py-3 rounded-xl">Entregar Ahora</button>}
                </div>
            </div>
        </div>
      )}

      {/* Otros modales (Product, Category, Client, Supplier, etc) */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingProduct ? 'Editar' : 'Nuevo'} Producto</h2>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              
              {/* --- NUEVO: INPUT DE IMAGEN OBLIGATORIO --- */}
              <div className="border-2 border-dashed border-stone-300 rounded-xl p-4 text-center relative hover:bg-stone-50 transition-colors">
                  <input 
                      type="file" 
                      name="image" 
                      accept="image/*"
                      // Si NO hay producto en edición (es nuevo), es REQUIRED. Si hay producto, es opcional (salvo que se quiera cambiar)
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
              {/* ------------------------------------------- */}

              <input name="name" required placeholder="Nombre" defaultValue={editingProduct?.name} className="w-full p-3 border rounded-xl" />
              
              <select name="brand" required defaultValue={editingProduct?.brand} className="w-full p-3 border rounded-xl bg-white">
                  <option value="">Seleccionar Marca</option>
                  {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>

              <input name="price" required placeholder="Precio" value={productPriceInput} onChange={e => setProductPriceInput(e.target.value)} className="w-full p-3 border rounded-xl" />
              <select name="category" required defaultValue={editingProduct?.category} className="w-full p-3 border rounded-xl"><option value="">Categoría</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <button className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold">Guardar</button>
              <button type="button" onClick={() => setIsProductModalOpen(false)} className="w-full py-3 bg-stone-100 rounded-xl">Cancelar</button>
            </form>
          </div>
        </div>
      )}

      {isCategoryModalOpen && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><div className="bg-white p-6 rounded-2xl w-full max-w-sm"><h2 className="font-bold text-lg mb-4">Nueva Categoría</h2><form onSubmit={e => { e.preventDefault(); simpleSave('categories', {name: new FormData(e.currentTarget).get('name')}, setIsCategoryModalOpen); }}><input name="name" required className="w-full p-3 border rounded-xl mb-4" placeholder="Nombre"/><button className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold">Guardar</button></form><button onClick={() => setIsCategoryModalOpen(false)} className="w-full mt-2 py-3 bg-stone-100 rounded-xl">Cancelar</button></div></div>}
      
      {isCycleModalOpen && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><div className="bg-white p-6 rounded-2xl w-full max-w-sm"><h2 className="font-bold text-lg mb-4">Nuevo Ciclo</h2><form onSubmit={e => { e.preventDefault(); simpleSave('cycles', {name: new FormData(e.currentTarget).get('name')}, setIsCycleModalOpen); }}><input name="name" required className="w-full p-3 border rounded-xl mb-4" placeholder="Nombre"/><button className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold">Guardar</button></form><button onClick={() => setIsCycleModalOpen(false)} className="w-full mt-2 py-3 bg-stone-100 rounded-xl">Cancelar</button></div></div>}

      {isClientModalOpen && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><div className="bg-white p-6 rounded-2xl w-full max-w-sm"><h2 className="font-bold text-lg mb-4">Nuevo Cliente</h2><form onSubmit={handleSaveClient}><input name="name" required className="w-full p-3 border rounded-xl mb-4" placeholder="Nombre"/><input name="phone" className="w-full p-3 border rounded-xl mb-4" placeholder="Teléfono"/><button className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold">Guardar</button></form><button onClick={() => setIsClientModalOpen(false)} className="w-full mt-2 py-3 bg-stone-100 rounded-xl">Cancelar</button></div></div>}

      {isSupplierModalOpen && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><div className="bg-white p-6 rounded-2xl w-full max-w-sm"><h2 className="font-bold text-lg mb-4">Nuevo Proveedor</h2><form onSubmit={handleSaveSupplier}><input name="name" required className="w-full p-3 border rounded-xl mb-4" placeholder="Nombre"/><button className="w-full py-3 bg-stone-800 text-white rounded-xl font-bold">Guardar</button></form><button onClick={() => setIsSupplierModalOpen(false)} className="w-full mt-2 py-3 bg-stone-100 rounded-xl">Cancelar</button></div></div>}

      {/* MODAL ENTREGA - Z-Index 80 */}
      {isDeliveryModalOpen && deliveryTransaction && <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4"><div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-xl"><h2 className="text-xl font-bold text-center mb-4">Confirmar Pago</h2><div className="text-3xl font-black text-center mb-6">${formatMoney(deliveryTransaction.total)}</div><div className="grid grid-cols-2 gap-3 mb-6"><button onClick={() => setDeliveryPaymentMethod('Efectivo')} className={`p-3 border-2 rounded-xl font-bold ${deliveryPaymentMethod === 'Efectivo' ? 'border-green-500 text-green-700' : 'border-stone-200'}`}>Efectivo</button><button onClick={() => setDeliveryPaymentMethod('Transferencia')} className={`p-3 border-2 rounded-xl font-bold ${deliveryPaymentMethod === 'Transferencia' ? 'border-green-500 text-green-700' : 'border-stone-200'}`}>Transf.</button></div><button onClick={finalizeDelivery} className="w-full py-3 bg-green-600 text-white font-bold rounded-xl">Confirmar</button><button onClick={() => setIsDeliveryModalOpen(false)} className="w-full mt-2 py-3 text-stone-400">Cancelar</button></div></div>}

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full bg-white border-t flex justify-around py-3 pb-safe-bottom z-30 shadow-lg">
        <NavButton icon={<LayoutDashboard />} label="Reportes" active={view === 'reports'} onClick={() => setView('reports')} />
        <NavButton icon={<ShoppingCart />} label="Vender" active={view === 'pos'} onClick={() => setView('pos')} />
        <NavButton icon={<Truck />} label="Recepción" active={view === 'purchases'} onClick={() => { setView('purchases'); setShowPurchaseHistory(false); setPurchaseMode(null); }} />
        <NavButton icon={<Receipt />} label="Registro" active={view === 'receipts'} onClick={() => setView('receipts')} />
        <NavButton icon={<Package />} label="Stock" active={view === 'inventory'} onClick={() => setView('inventory')} />
      </nav>
    </div>
  );
}

function NavButton({ icon, label, active, onClick }) {
    return <button onClick={onClick} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${active ? 'text-orange-600 bg-orange-50 scale-105' : 'text-stone-400 hover:bg-stone-50'}`}>{React.cloneElement(icon, { className: `w-6 h-6 ${active ? 'fill-current' : ''}` })}<span className="text-[10px] font-bold">{label}</span></button>
};
