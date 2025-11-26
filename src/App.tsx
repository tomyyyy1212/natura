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
  ShoppingBasket,
  BoxSelect,
  CheckSquare,
  Square
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
const BRANDS = ['Natura', 'Avon', 'Cyzone'];
const SUPPLIERS_OPTIONS = ['Natura Web', 'Natura Catálogo', 'Belcorp Web', 'Belcorp Catálogo'];
const COURIERS = ['Yo (Directo)', 'Mamá (Puesto Feria)', 'Tía Luisa']; 
const ONLINE_STORES = ['Natura', 'Esika', 'L\'Bel']; 

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
  const [processingMsg, setProcessingMsg] = useState(''); 

  // Alertas y Confirmaciones
  const [alertState, setAlertState] = useState({ show: false, title: '', message: '', type: 'info' }); 
  const [confirmationState, setConfirmationState] = useState({ show: false, title: '', message: '', type: 'neutral', onConfirm: null });

  // NUEVO: Estado para confirmar fecha de entrega diferida (Ventas)
  const [confirmDeliveryModal, setConfirmDeliveryModal] = useState({ show: false, transaction: null });
  const [deliveryDateInput, setDeliveryDateInput] = useState(new Date().toISOString().split('T')[0]);

  // NUEVO: Estado para RECEPCIÓN DE MERCADERÍA (Pedidos Stock)
  const [receivingStockModal, setReceivingStockModal] = useState({ show: false, transaction: null });
  const [receivingItems, setReceivingItems] = useState([]); // Array plano de items desglosados

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
  const [selectedCourier, setSelectedCourier] = useState('Yo (Directo)');
    
  const [editingProduct, setEditingProduct] = useState(null);
  const [productPriceInput, setProductPriceInput] = useState(''); 
  const [receiptDetails, setReceiptDetails] = useState(null);
  
  // Kardex
  const [productHistory, setProductHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
    
  const [showPurchaseHistory, setShowPurchaseHistory] = useState(false);

  // ESTADOS PEDIDO DE STOCK
  // steps: 'source' -> 'config' -> 'method' -> 'cart'
  const [stockOrderStep, setStockOrderStep] = useState('source'); 
  const [stockSource, setStockSource] = useState(''); // 'catalog', 'online'
  const [stockCycle, setStockCycle] = useState('');
  const [selectedOnlineStore, setSelectedOnlineStore] = useState(''); 
  const [isInstallments, setIsInstallments] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState(1);

  const [purchaseMode, setPurchaseMode] = useState(null); // 'internet', 'magazine'
  const [selectedCycle, setSelectedCycle] = useState('');
  const [magazineFile, setMagazineFile] = useState(null);

  // Toggle Venta Inmediata en Carrito
  const [isImmediateSale, setIsImmediateSale] = useState(false);

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
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.warn("Token mismatch or auth error, attempting anonymous login...", error);
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
          if (t.type === 'sale' && (t.saleStatus === 'completed' || t.saleStatus === 'in_transit')) { 
              const item = t.items.find(i => i.id === prodId);
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

  // --- LOGICA PARA AVISAR AL CLIENTE ---
  const handleNotifyClient = (transaction) => {
      const client = clients.find(c => c.id === transaction.clientId);
      if (!client || !client.phone) {
          triggerAlert("Sin teléfono", "El cliente no tiene número registrado.", "error");
          return;
      }
      let message = `Hola *${client.name}*! 👋\n\nTe cuento que ya tengo listos tus productos de Natura/Avon:\n`;
      transaction.items.forEach(i => {
          message += `- ${i.name} x${i.qty}\n`;
      });
      message += `\nTotal: $${formatMoney(transaction.total)}\n\n¿Cuándo te acomoda que coordinemos la entrega?`;
      window.open(`https://wa.me/${client.phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleDeleteProduct = async (productId) => {
      setConfirmationState({
          show: true,
          title: "Eliminar Producto",
          message: "¿Estás seguro de que quieres eliminar este producto permanentemente?",
          type: "danger",
          onConfirm: async () => {
              setConfirmationState(prev => ({ ...prev, show: false })); // Cerrar modal
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
      } else if (transaction.saleStatus === 'pending') {
          confirmTitle = "Cancelar Encargo";
          confirmMsg = "¿Cancelar encargo del cliente?\n\nSi ya compraste los productos, se quedarán en tu stock disponible.";
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
                  // Si ya se descontó stock (completed o in_transit), devolverlo
                  if (transaction.saleStatus === 'completed' || transaction.saleStatus === 'in_transit') { 
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
                  triggerAlert("Operación Exitosa", transaction.saleStatus === 'in_transit' ? "Stock devuelto al inventario." : "Registro eliminado.", "success");
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

  const handleEditPurchase = async (transaction) => {
      // Para editar, el pedido no puede haber sido recibido aún (completed)
      if (transaction.saleStatus === 'received') {
          triggerAlert("No Editable", "Este pedido ya fue recibido y agregado al stock. No se puede editar.", "error");
          return;
      }

      if (transaction.type !== 'purchase') return;
      
      setLoading(true);
      setProcessingMsg("Cargando pedido...");

      try {
          // Si no está recibido, los items están en la transacción
          setCart(transaction.items);
          
          // Cargar datos específicos de pedido
          setStockSource(transaction.purchaseType || 'catalog');
          setStockCycle(transaction.cycle || '');
          if (transaction.purchaseType === 'online' && transaction.onlineStore) {
              setSelectedOnlineStore(transaction.onlineStore);
          }
          
          if (transaction.installmentsConfig) {
              setIsInstallments(true);
              setInstallmentsCount(transaction.installmentsConfig.count);
          } else {
              setIsInstallments(false);
              setInstallmentsCount(1);
          }

          setView('purchases');
          setShowPurchaseHistory(false);
          setStockOrderStep('cart'); // Ir directo al carro
          setPurchaseMode('internet'); 
          setEditingTransactionId(transaction.id);
          triggerAlert("Modo Edición", "Modifica el pedido antes de que llegue.", "info");
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
          triggerAlert("Stock Insuficiente", `No puedes entregar. Faltan:\n${missingStock.join('\n')}`, "error");
          return;
      }
      setReceiptDetails(null); 
      setDeliveryTransaction(transaction);
      setDeliveryPaymentMethod('Efectivo');
      setSelectedCourier('Yo (Directo)'); // Reset a default
      setIsDeliveryModalOpen(true);
  };

  // INICIA EL PROCESO DE DESPACHO (Mueve a completed o in_transit)
  const startDeliveryProcess = async () => {
      if (!deliveryTransaction) return;
      setLoading(true);
      setProcessingMsg(selectedCourier === 'Yo (Directo)' ? "Cerrando Venta..." : "Enviando a Reparto...");
      try {
          const batch = writeBatch(db);
          let finalTotalCost = 0;
          const updatedItems = [];
          
          // DESCUENTO STOCK Y FIFO (Esto pasa SIEMPRE, sea Yo o Mamá, porque el producto sale)
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
          
          // ESTADO: Si es 'Yo' -> completed. Si es otro -> in_transit
          const nextStatus = selectedCourier === 'Yo (Directo)' ? 'completed' : 'in_transit';
          const now = new Date();

          batch.update(transRef, { 
              saleStatus: nextStatus, 
              courier: selectedCourier, // Guardamos quién lo lleva
              paymentMethod: deliveryPaymentMethod,
              deliveredAt: { seconds: now.getTime() / 1000 }, // Fecha de salida
              finalizedAt: selectedCourier === 'Yo (Directo)' ? { seconds: now.getTime() / 1000 } : null, // Si soy yo, finaliza al tiro
              items: updatedItems,
              totalCost: finalTotalCost,
              margin: margin,
              marginPercent: deliveryTransaction.total > 0 ? (margin / deliveryTransaction.total) * 100 : 0
          });
          await batch.commit();
          setIsDeliveryModalOpen(false);
          setDeliveryTransaction(null);
          triggerAlert(nextStatus === 'completed' ? "Venta Cerrada" : "En Reparto", nextStatus === 'completed' ? "Stock descontado y dinero ingresado." : `Entregado a ${selectedCourier}. Stock descontado.`, "success");
      } catch (error) {
          console.error(error);
          triggerAlert("Error", "Fallo proceso.", "error");
      } finally {
          setLoading(false);
          setProcessingMsg('');
      }
  };

  // PRE-CONFIRMACION: Abre modal para seleccionar fecha si es necesario
  const handleConfirmDeliveryClick = (transaction) => {
      setConfirmDeliveryModal({ show: true, transaction: transaction });
      setDeliveryDateInput(new Date().toISOString().split('T')[0]); // Reset a hoy
  };

  // CONFIRMA ENTREGA FINAL (De in_transit a completed) CON FECHA ESPECIFICA
  const processDeliveryConfirmation = async () => {
      const transaction = confirmDeliveryModal.transaction;
      if (!transaction || !transaction.id) return;
      
      setConfirmDeliveryModal({ show: false, transaction: null }); // Cerrar modal fecha
      setLoading(true);
      setProcessingMsg("Finalizando Venta...");
      
      try {
          // Convertir fecha input a timestamp
          const selectedDate = new Date(deliveryDateInput + 'T12:00:00'); // Mediodía para evitar problemas de zona horaria
          
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

  // --- NUEVO: LOGICA RECEPCIÓN DE MERCADERÍA (PEDIDOS STOCK) ---

  // 1. Abrir modal y preparar items desglosados
  const handleReceiveStockClick = (transaction) => {
      if (!transaction.items) return;
      
      // Desglosar items: Si viene qty: 3, crear 3 entradas
      const flatItems = [];
      transaction.items.forEach(item => {
          for(let i=0; i < item.qty; i++) {
              flatItems.push({
                  ...item,
                  uniqueKey: `${item.id}_${i}`, // Key temporal
                  expirationDate: '',
                  received: true // Por defecto asumimos que llegó
              });
          }
      });

      setReceivingItems(flatItems);
      setReceivingStockModal({ show: true, transaction });
  };

  // 2. Actualizar estado de un item en la lista de recepción
  const updateReceivingItem = (index, field, value) => {
      const newItems = [...receivingItems];
      newItems[index][field] = value;
      setReceivingItems(newItems);
  };

  // 3. PRE-CONFIRMACION DE INGRESO DE STOCK (MODAL SEGURO)
  const handleProcessStockReceiptClick = () => {
      const receivedCount = receivingItems.filter(i => i.received).length;
      const missingDates = receivingItems.some(i => i.received && !i.expirationDate);

      if (receivedCount === 0) {
          triggerAlert("Error", "Debes recibir al menos un producto.", "error");
          return;
      }
      if (missingDates) {
          triggerAlert("Faltan Fechas", "Ingresa el vencimiento de todos los productos recibidos.", "error");
          return;
      }

      setConfirmationState({
          show: true,
          title: "Confirmar Recepción",
          message: `Vas a ingresar ${receivedCount} productos al stock.\n¿Estás seguro de que los datos son correctos?`,
          type: "success",
          onConfirm: () => {
              setConfirmationState(prev => ({...prev, show: false}));
              processStockReceipt(); // Ejecutar la lógica real
          }
      });
  };

  // 4. Confirmar Recepción y Agregar Stock (Lógica Real)
  const processStockReceipt = async () => {
      const transaction = receivingStockModal.transaction;
      if (!transaction) return;

      const receivedItems = receivingItems.filter(i => i.received);

      setLoading(true);
      setProcessingMsg("Ingresando Stock...");
      setReceivingStockModal({ show: false, transaction: null });

      try {
          const batch = writeBatch(db);
          
          // Crear Lotes y Actualizar Stock
          receivedItems.forEach(item => {
              const batchRef = doc(collection(db, `artifacts/${APP_ID}/public/data/inventory_batches`));
              batch.set(batchRef, {
                  productId: item.id,
                  productName: item.name,
                  date: { seconds: Date.now() / 1000 },
                  cost: Number(item.transactionPrice),
                  initialQty: 1, // Siempre 1 porque desglosamos
                  remainingQty: 1,
                  supplierId: transaction.clientId,
                  expirationDate: item.expirationDate,
                  transactionId: transaction.id
              });
              batch.update(doc(db, `artifacts/${APP_ID}/public/data/products`, item.id), { stock: increment(1) });
          });

          // Actualizar transacción a 'received'
          batch.update(doc(db, `artifacts/${APP_ID}/public/data/transactions`, transaction.id), {
              saleStatus: 'received', // ESTADO FINAL DE PEDIDO STOCK
              receivedAt: { seconds: Date.now() / 1000 },
              receivedItemsCount: receivedItems.length
          });

          await batch.commit();
          triggerAlert("Stock Actualizado", `Se agregaron ${receivedItems.length} productos al inventario.`, "success");

      } catch (error) {
          console.error("Error receiving stock:", error);
          triggerAlert("Error", "Falló la recepción de stock.", "error");
      } finally {
          setLoading(false);
          setProcessingMsg("");
      }
  };

  // -------------------------------------------------------------

  // Carrito
  const addToCart = (product) => {
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
      setIsImmediateSale(false);
      // Reset Stock Order fields
      setStockOrderStep('source');
      setStockSource('');
      setStockCycle('');
      setSelectedOnlineStore('');
      setIsInstallments(false);
      setInstallmentsCount(1);
  };
  const cartTotal = useMemo(() => cart.reduce((acc, item) => acc + (item.transactionPrice * item.qty), 0), [cart]);

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
        if (isImmediateSale && !paymentMethod) { triggerAlert("Falta Pago", "Selecciona medio de pago.", "info"); return; }
        
        // Validacion Stock SOLO si es entrega inmediata
        if (isImmediateSale) {
            const missing = cart.filter(item => {
                const product = products.find(p => p.id === item.id);
                return !product || product.stock < item.qty;
            });
            if (missing.length > 0) {
                triggerAlert("Sin Stock", "No puedes entregar inmediatamente. Productos sin stock suficiente. Guárdalo como encargo.", "error");
                return;
            }
        }
    }
    if (type === 'purchase') {
        if (cart.some(i => i.transactionPrice <= 0)) { triggerAlert("Costo 0", "Ingresa costos válidos.", "error"); return; }
        // YA NO VALIDAMOS FECHAS AQUI
    }

    setLoading(true);
    setProcessingMsg(editingTransactionId ? 'Actualizando...' : 'Guardando...');

    try {
        const batch = writeBatch(db);

        if (editingTransactionId && type === 'purchase') {
             // MODO EDICIÓN PEDIDO STOCK (Solo actualizamos items y config, NO STOCK)
             const transRef = doc(db, `artifacts/${APP_ID}/public/data/transactions`, editingTransactionId);
             
             // Update main transaction data
             const installmentsConfig = isInstallments ? {
                 count: parseInt(installmentsCount),
                 paid: 0,
                 status: 'pending'
             } : null;

             batch.update(transRef, { 
                 items: cart, 
                 total: cartTotal, 
                 purchaseType: stockSource,
                 cycle: stockCycle,
                 onlineStore: selectedOnlineStore,
                 installmentsConfig: installmentsConfig
             });
        }
        else {
            const newTransId = editingTransactionId || doc(collection(db, `artifacts/${APP_ID}/public/data/transactions`)).id;
            const originMethod = purchaseMode === 'magazine' ? 'PDF' : 'Manual';

            // SI ES PEDIDO DE STOCK (PURCHASE): SOLO GUARDAMOS EL PEDIDO, NO MOVEMOS STOCK AUN
            
            // Si es venta y es inmediata, descontamos stock ahora
            if (type === 'sale' && isImmediateSale) {
                 for (const item of cart) {
                     const { totalCost, batchUpdates, fifoDetails } = await calculateFIFOCost(item.id, item.qty);
                     item.fifoTotalCost = totalCost; 
                     item.fifoDetails = fifoDetails;
                     batchUpdates.forEach(u => batch.update(doc(db, `artifacts/${APP_ID}/public/data/inventory_batches`, u.id), { remainingQty: u.newRemainingQty }));
                     batch.update(doc(db, `artifacts/${APP_ID}/public/data/products`, item.id), { stock: increment(-item.qty) });
                 }
            }

            // Si es encargo (pendiente), NO descontamos stock aun.
            
            const transactionFIFO = (type === 'sale' && isImmediateSale) ? cart.reduce((acc, i) => acc + (i.fifoTotalCost || 0), 0) : 0;
            const margin = type === 'sale' ? (cartTotal - transactionFIFO) : 0;

            const now = new Date();

            // Definir nombre proveedor
            let clientName = selectedClient;
            if (type === 'purchase') {
                if (stockSource === 'catalog') clientName = 'Natura Catálogo';
                else clientName = selectedOnlineStore ? `${selectedOnlineStore} Online` : 'Natura Web';
            }

            const installmentsConfig = (type === 'purchase' && isInstallments) ? {
                 count: parseInt(installmentsCount),
                 paid: 0,
                 status: 'pending'
            } : null;

            batch.set(doc(db, `artifacts/${APP_ID}/public/data/transactions`, newTransId), {
                id: newTransId, 
                type,
                items: [...cart],
                total: cartTotal,
                clientId: clientName,
                date: { seconds: now.getTime() / 1000 },
                paymentMethod: (type === 'sale' && isImmediateSale) ? paymentMethod : null,
                totalCost: transactionFIFO,
                margin: margin,
                marginPercent: (type === 'sale' && cartTotal > 0) ? (margin/cartTotal)*100 : 0,
                
                // ESTADOS:
                // Venta Inmediata -> completed
                // Venta Encargo -> pending
                // Pedido Stock -> pending_arrival (NUEVO)
                saleStatus: type === 'sale' ? (isImmediateSale ? 'completed' : 'pending') : 'pending_arrival',
                
                origin: type === 'purchase' ? originMethod : 'POS',
                courier: (type === 'sale' && isImmediateSale) ? 'Yo (Directo)' : null,
                deliveredAt: (type === 'sale' && isImmediateSale) ? { seconds: now.getTime() / 1000 } : null,
                finalizedAt: (type === 'sale' && isImmediateSale) ? { seconds: now.getTime() / 1000 } : null,
                
                // Nuevos campos pedido stock
                purchaseType: type === 'purchase' ? stockSource : null,
                cycle: type === 'purchase' ? stockCycle : null,
                onlineStore: type === 'purchase' ? selectedOnlineStore : null,
                installmentsConfig: installmentsConfig
            });
        }

        await batch.commit();
        clearCart();
        if (editingTransactionId) setPurchaseMode(null);
        triggerAlert("Éxito", type === 'sale' ? "Venta/Encargo guardado." : "Pedido registrado. Confirma recepción cuando llegue.", "success");
    } catch (error) {
        console.error(error);
        triggerAlert("Error", "Fallo al guardar.", "error");
    } finally {
        setLoading(false);
        setProcessingMsg('');
    }
  };

  // NUEVO: Función para pagar cuota
  const handlePayInstallment = async (transaction) => {
      if (!transaction.installmentsConfig) return;
      const currentPaid = transaction.installmentsConfig.paid;
      const total = transaction.installmentsConfig.count;
      
      if (currentPaid >= total) return;

      const newPaid = currentPaid + 1;
      const newStatus = newPaid === total ? 'completed' : 'partial';

      setLoading(true);
      setProcessingMsg("Registrando Pago Cuota...");
      
      try {
          await updateDoc(doc(db, `artifacts/${APP_ID}/public/data/transactions`, transaction.id), {
              'installmentsConfig.paid': newPaid,
              'installmentsConfig.status': newStatus
          });
          
          // Actualizar vista local del modal si está abierto
          if(receiptDetails && receiptDetails.id === transaction.id) {
              setReceiptDetails(prev => ({
                  ...prev,
                  installmentsConfig: { ...prev.installmentsConfig, paid: newPaid, status: newStatus }
              }));
          }
          
          triggerAlert("Pago Registrado", `Cuota ${newPaid}/${total} pagada correctamente.`, "success");
      } catch(e) {
          triggerAlert("Error", "No se pudo registrar el pago.", "error");
      } finally {
          setLoading(false);
          setProcessingMsg("");
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

  // Separo Ventas Completadas de Pedidos Pendientes y EN REPARTO
  const filteredSales = useMemo(() => {
      const all = getFilteredTransactions('sale', filterStartDate, filterEndDate, filterClient, filterProduct);
      return {
          completed: all.filter(t => t.saleStatus === 'completed'),
          pending: all.filter(t => t.saleStatus === 'pending'),
          inTransit: all.filter(t => t.saleStatus === 'in_transit') // NUEVO ESTADO
      };
  }, [transactions, filterStartDate, filterEndDate, filterClient, filterProduct]);

  const filteredPurchases = useMemo(() => getFilteredTransactions('purchase', phStartDate, phEndDate, phSupplier, phProduct), [transactions, phStartDate, phEndDate, phSupplier, phProduct]);

  const getClientName = (id) => clients.find(c => c.id === id)?.name || 'Consumidor Final';
  
  const getSupplierName = (id) => {
      if (SUPPLIERS_OPTIONS.includes(id)) return id;
      return id || 'Proveedor'; 
  };

  // --- LOGICA NUEVOS REPORTES ---
  const expiringProducts = useMemo(() => {
      const expiring = inventoryBatches.filter(b => b.remainingQty > 0 && b.expirationDate);
      expiring.sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));
      return expiring.slice(0, 10); 
  }, [inventoryBatches]);

  // Cálculo "Por Comprar" basado en Pedidos Pendientes vs Stock Actual
  const pendingOrdersData = useMemo(() => {
      const pendingMap = {}; 
      const tempStock = {}; 

      products.forEach(p => tempStock[p.id] = p.stock);

      const pendingTrans = transactions.filter(t => t.type === 'sale' && t.saleStatus === 'pending');
      
      pendingTrans.sort((a,b) => (a.date.seconds - b.date.seconds));

      pendingTrans.forEach(t => {
          t.items.forEach(item => {
               const product = products.find(p => p.id === item.id);
               const brand = product ? product.brand : (item.brand || 'Sin Marca');
               const currentStock = tempStock[item.id] || 0;

               if (currentStock < item.qty) {
                   const missingQty = item.qty - currentStock;
                   
                   if (!pendingMap[brand]) pendingMap[brand] = [];
                   const existingItem = pendingMap[brand].find(i => i.id === item.id);
                   
                   if (existingItem) {
                       existingItem.qty += missingQty;
                   } else {
                       pendingMap[brand].push({ ...item, qty: missingQty });
                   }
                   tempStock[item.id] = 0;
               } else {
                   tempStock[item.id] -= item.qty;
               }
          });
      });
      return pendingMap;
  }, [transactions, products]);

  // Helper para verificar estado de un pedido individual
  const getOrderStatus = (transaction) => {
      let hasShortage = false;
      for (let item of transaction.items) {
          const prod = products.find(p => p.id === item.id);
          if (!prod || prod.stock < item.qty) {
              hasShortage = true;
              break;
          }
      }
      return hasShortage ? 'waiting' : 'ready';
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
          case 'purchases': return 'Registro de Pedidos'; 
          case 'receipts': return 'Pedidos Clientes'; 
          case 'inventory': return 'Inventario';
          case 'reports': return 'Reportes';
          default: return view;
      }
  };

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
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className={`bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl text-center border-t-4 ${getAlertConfig(alertState.type).border}`}>
                {React.createElement(getAlertConfig(alertState.type).icon, { className: `w-8 h-8 mx-auto mb-4 ${getAlertConfig(alertState.type).color}` })}
                <h3 className="text-lg font-bold mb-2">{alertState.title}</h3>
                <p className="text-sm text-stone-500 mb-4">{alertState.message}</p>
                <button onClick={() => setAlertState({...alertState, show: false})} className="w-full py-2 bg-stone-900 text-white rounded-lg font-bold">OK</button>
            </div>
        </div>
      )}

      {confirmationState.show && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border-t-4 border-stone-800">
                <h3 className="text-lg font-bold mb-2 text-stone-800">{confirmationState.title}</h3>
                <p className="text-sm text-stone-600 mb-6 whitespace-pre-line">{confirmationState.message}</p>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setConfirmationState(prev => ({...prev, show: false}))} 
                        className="flex-1 py-3 bg-stone-100 text-stone-600 rounded-xl font-bold"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={confirmationState.onConfirm} 
                        className={`flex-1 py-3 text-white rounded-xl font-bold ${confirmationState.type === 'danger' ? 'bg-red-600' : confirmationState.type === 'success' ? 'bg-green-600' : 'bg-stone-800'}`}
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
      )}

      {confirmDeliveryModal.show && confirmDeliveryModal.transaction && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                <h3 className="text-lg font-bold mb-2 text-stone-800">Confirmar Entrega</h3>
                <p className="text-sm text-stone-600 mb-4">
                    {confirmDeliveryModal.transaction.courier} ya entregó el pedido. 
                    <br/>Por favor, indica la fecha real de entrega:
                </p>
                <div className="mb-6">
                    <label className="text-xs font-bold text-stone-500 uppercase block mb-2">Fecha Real</label>
                    <input 
                        type="date" 
                        className="w-full p-3 border rounded-xl bg-stone-50 font-bold text-stone-800"
                        value={deliveryDateInput}
                        onChange={(e) => setDeliveryDateInput(e.target.value)}
                    />
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setConfirmDeliveryModal({ show: false, transaction: null })} 
                        className="flex-1 py-3 bg-stone-100 text-stone-600 rounded-xl font-bold"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={processDeliveryConfirmation} 
                        className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL RECEPCIÓN DE MERCADERÍA (Stock) --- */}
      {receivingStockModal.show && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="p-4 border-b bg-green-50 flex justify-between items-center">
                    <div>
                        <h2 className="font-bold text-xl text-green-800 flex items-center gap-2"><PackageCheck className="w-6 h-6"/> Recibir Mercadería</h2>
                        <p className="text-xs text-green-600">Ingresa vencimientos y confirma llegada.</p>
                    </div>
                    <button onClick={() => setReceivingStockModal({show: false, transaction: null})}><X className="w-6 h-6 text-green-400"/></button>
                </div>
                
                <div className="px-4 py-2 bg-green-100 border-b border-green-200 flex items-center gap-2 text-green-800 text-xs font-bold">
                    <Info className="w-4 h-4"/>
                    <span>Tip: Marca el check <CheckSquare className="w-3 h-3 inline"/> si llegó el producto.</span>
                    <span className="ml-auto bg-white px-2 py-1 rounded-full border border-green-200 shadow-sm text-green-600">
                        {receivingItems.filter(i => i.received).length}/{receivingItems.length}
                    </span>
                </div>

                {/* ENCABEZADOS DE TABLA */}
                <div className="px-4 py-2 bg-stone-100 border-b flex gap-4 text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                    <div className="flex-1">Producto / Costo</div>
                    <div className="w-32 text-center">Vencimiento</div>
                    <div className="w-10 text-center">Recibido?</div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-stone-50">
                    <div className="space-y-3">
                        {receivingItems.map((item, idx) => (
                            <div key={item.uniqueKey} className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center gap-3 transition-all duration-200 ${item.received ? 'bg-white border-green-300 shadow-sm' : 'bg-stone-100 border-stone-200 opacity-75'}`}>
                                <div className="flex items-center gap-3 flex-1">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${item.received ? 'bg-green-100 text-green-700' : 'bg-stone-200 text-stone-500'}`}>{idx+1}</div>
                                    <div>
                                        <div className={`font-bold text-sm ${item.received ? 'text-stone-800' : 'text-stone-500'}`}>{item.name}</div>
                                        <div className="text-xs text-stone-500">Costo: ${formatMoney(item.transactionPrice)}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                    <div className="relative">
                                        <input 
                                            type="date" 
                                            className={`p-2 border rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-green-200 transition-all ${!item.expirationDate && item.received ? 'border-red-400 bg-red-50 text-red-700' : 'border-stone-200 text-stone-700'}`}
                                            value={item.expirationDate}
                                            onChange={(e) => updateReceivingItem(idx, 'expirationDate', e.target.value)}
                                            disabled={!item.received}
                                        />
                                        {!item.expirationDate && item.received && (
                                            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] px-2 py-1 rounded whitespace-nowrap arrow-down">
                                                ¡Falta Fecha!
                                            </div>
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => updateReceivingItem(idx, 'received', !item.received)}
                                        className={`p-2 rounded-lg transition-all active:scale-95 ${item.received ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-stone-300 text-white hover:bg-stone-400'}`}
                                        title="Marcar como recibido"
                                    >
                                        {item.received ? <CheckSquare className="w-6 h-6"/> : <Square className="w-6 h-6"/>}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-4 border-t bg-white">
                    <button onClick={handleProcessStockReceiptClick} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 transition-all active:scale-95 flex items-center justify-center gap-2">
                        <Save className="w-5 h-5"/> Confirmar Recepción e Ingresar Stock
                    </button>
                </div>
            </div>
        </div>
      )}

      <header className={`${view === 'purchases' ? 'bg-stone-700' : view === 'receipts' ? 'bg-stone-700' : 'bg-orange-500'} text-white p-4 shadow-md flex justify-between items-center z-10 shrink-0`}>
        <h1 className="font-bold text-lg flex items-center gap-2">
            {view === 'pos' ? <Leaf className="w-5 h-5"/> : view === 'inventory' ? <Package className="w-5 h-5"/> : view === 'purchases' ? <Truck className="w-5 h-5"/> : view === 'receipts' ? <Receipt className="w-5 h-5"/> : <LayoutDashboard className="w-5 h-5"/>} 
            {getHeaderTitle()}
        </h1>
      </header>

      <main className={`flex-1 overflow-hidden relative flex flex-col ${view !== 'pos' && view !== 'purchases' ? 'overflow-y-auto' : ''}`}>
        
        {/* POS & PURCHASES (STOCK ORDERS) */}
        {(view === 'pos' || view === 'purchases') && !showPurchaseHistory && (
          <div className="flex flex-col h-full relative">
            <div className={`px-4 py-2 border-b flex justify-between items-center shrink-0 ${view === 'purchases' ? 'bg-stone-100' : (isImmediateSale ? 'bg-green-50' : 'bg-blue-50')}`}>
                 <div className="text-xs font-bold flex items-center gap-2 text-stone-700">
                    {view === 'purchases' ? (editingTransactionId ? 'EDITANDO' : 'NUEVO PEDIDO') : (isImmediateSale ? 'VENTA INMEDIATA' : 'TOMAR ENCARGO')}
                 </div>
                 <div className="flex gap-2">
                    {view === 'purchases' && stockOrderStep !== 'source' && !editingTransactionId && <button onClick={() => setStockOrderStep('source')} className="text-xs bg-white border px-2 py-1 rounded">Volver al Inicio</button>}
                    {view === 'purchases' && !editingTransactionId && stockOrderStep === 'source' && <button onClick={() => setShowPurchaseHistory(true)} className="text-xs bg-white border px-2 py-1 rounded flex gap-1"><History className="w-3 h-3"/> Historial</button>}
                    {editingTransactionId && <button onClick={clearCart} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-bold">Cancelar</button>}
                 </div>
            </div>

            {view === 'purchases' && stockOrderStep === 'source' && !editingTransactionId && (
                <div className="flex-1 p-6 flex flex-col justify-center items-center gap-4 bg-stone-50">
                    <button onClick={() => { setStockSource('catalog'); setStockOrderStep('config'); }} className="w-full max-w-sm p-6 bg-white rounded-2xl shadow hover:border-purple-500 border-2 border-transparent flex items-center gap-4">
                        <div className="bg-purple-100 text-purple-600 p-4 rounded-full"><BookOpen className="w-8 h-8" /></div>
                        <div className="text-left"><h3 className="font-bold text-lg">Catálogo</h3><p className="text-sm text-stone-500">Pedido por revista/ciclo.</p></div>
                    </button>
                    <button onClick={() => { setStockSource('online'); setStockOrderStep('config'); }} className="w-full max-w-sm p-6 bg-white rounded-2xl shadow hover:border-orange-500 border-2 border-transparent flex items-center gap-4">
                        <div className="bg-orange-100 text-orange-600 p-4 rounded-full"><Globe className="w-8 h-8" /></div>
                        <div className="text-left"><h3 className="font-bold text-lg">Tienda Online</h3><p className="text-sm text-stone-500">Pedido web directo.</p></div>
                    </button>
                </div>
            )}

            {view === 'purchases' && stockOrderStep === 'config' && !editingTransactionId && (
                <div className="flex-1 p-6 flex flex-col items-center bg-stone-50 justify-center">
                    <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-sm space-y-6">
                        <h3 className="font-bold text-xl text-center">Detalles del Pedido</h3>
                        
                        {stockSource === 'catalog' && (
                            <div>
                                <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Ciclo</label>
                                <select className="w-full p-3 border rounded-xl bg-white" value={stockCycle} onChange={e => setStockCycle(e.target.value)}>
                                    <option value="">Seleccionar Ciclo</option>
                                    {cycles.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        )}

                        {stockSource === 'online' && (
                            <div>
                                <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Tienda</label>
                                <select className="w-full p-3 border rounded-xl bg-white" value={selectedOnlineStore} onChange={e => setSelectedOnlineStore(e.target.value)}>
                                    <option value="">Seleccionar Tienda</option>
                                    {ONLINE_STORES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        )}
                        
                        <div className="bg-stone-50 p-4 rounded-xl border">
                            <div className="flex items-center gap-3 mb-3">
                                <input type="checkbox" id="installments" className="w-5 h-5 text-purple-600" checked={isInstallments} onChange={e => setIsInstallments(e.target.checked)} />
                                <label htmlFor="installments" className="font-bold text-stone-700">Pago en Cuotas</label>
                            </div>
                            {isInstallments && (
                                <div>
                                    <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Cantidad de Cuotas</label>
                                    <select className="w-full p-2 border rounded-lg bg-white" value={installmentsCount} onChange={e => setInstallmentsCount(e.target.value)}>
                                        {[2,3,4,5,6].map(n => <option key={n} value={n}>{n} Cuotas</option>)}
                                    </select>
                                </div>
                            )}
                        </div>

                        <button onClick={() => { 
                            if(stockSource === 'catalog' && !stockCycle) { triggerAlert("Falta Ciclo", "Selecciona un ciclo.", "error"); return; }
                            if(stockSource === 'online' && !selectedOnlineStore) { triggerAlert("Falta Tienda", "Selecciona la tienda online.", "error"); return; }
                            setStockOrderStep('method'); 
                        }} className="w-full py-3 bg-stone-800 text-white rounded-xl font-bold">
                            Continuar
                        </button>
                    </div>
                </div>
            )}

            {view === 'purchases' && stockOrderStep === 'method' && !editingTransactionId && (
                <div className="flex-1 p-6 flex flex-col justify-center items-center gap-4 bg-stone-50">
                    <h3 className="font-bold text-stone-400 uppercase mb-4 text-sm">Selecciona Método de Ingreso</h3>
                    <button onClick={() => { setPurchaseMode('internet'); setStockOrderStep('cart'); }} className="w-full max-w-sm p-6 bg-white rounded-2xl shadow hover:border-blue-500 border-2 border-transparent flex items-center gap-4">
                        <div className="bg-blue-100 text-blue-600 p-4 rounded-full"><Pencil className="w-8 h-8" /></div>
                        <div className="text-left"><h3 className="font-bold text-lg">Ingreso Manual</h3><p className="text-sm text-stone-500">Cargar uno a uno.</p></div>
                    </button>
                    <button onClick={() => { setPurchaseMode('magazine'); setStockOrderStep('pdf'); }} className="w-full max-w-sm p-6 bg-white rounded-2xl shadow hover:border-red-500 border-2 border-transparent flex items-center gap-4">
                        <div className="bg-red-100 text-red-600 p-4 rounded-full"><FileType className="w-8 h-8" /></div>
                        <div className="text-left"><h3 className="font-bold text-lg">Subir PDF</h3><p className="text-sm text-stone-500">Carga automática del pedido.</p></div>
                    </button>
                </div>
            )}

            {view === 'purchases' && stockOrderStep === 'pdf' && (
                <div className="flex-1 p-6 flex flex-col items-center bg-stone-50 justify-center">
                    <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-sm space-y-6 text-center">
                        <FileType className="w-16 h-16 text-red-500 mx-auto"/>
                        <h2 className="text-xl font-bold">Cargar PDF del Pedido</h2>
                        <p className="text-sm text-stone-500">Sube el archivo PDF que descargaste de la web de Natura.</p>
                        <input type="file" accept=".pdf" onChange={(e) => setMagazineFile(e.target.files[0])} className="w-full border p-2 rounded-xl"/>
                        <button onClick={handleProcessMagazinePDF} disabled={!magazineFile} className="w-full py-3 bg-red-600 text-white rounded-xl font-bold disabled:bg-stone-300">Procesar Archivo</button>
                    </div>
                </div>
            )}

            {((view === 'pos') || (view === 'purchases' && stockOrderStep === 'cart')) && (
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
                                        {p.stock <= 0 && view === 'pos' && (
                                            <div className="absolute inset-0 bg-black/10 flex items-end justify-center p-1">
                                                <span className="text-[10px] font-bold bg-red-500 text-white px-2 rounded shadow">Sin Stock</span>
                                            </div>
                                        )}
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
                    {cart.length > 0 && (
                        <div className="fixed bottom-[76px] left-0 w-full z-20 flex flex-col shadow-2xl">
                            <div className={`rounded-t-3xl border-t p-4 ${editingTransactionId ? 'bg-amber-50' : 'bg-white'}`}>
                                <div className="max-h-48 overflow-y-auto mb-2">
                                    {cart.map(item => {
                                        const prod = products.find(p => p.id === item.id);
                                        const noStock = !prod || prod.stock < item.qty;
                                        return (
                                            <div key={item.id} className="flex flex-col mb-3 border-b border-stone-50 last:border-0 pb-3">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex-1 pr-2">
                                                        <div className="text-sm font-medium text-stone-800 line-clamp-1">{item.name}</div>
                                                        {view === 'pos' && noStock && <div className="text-[10px] text-red-500 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Falta Stock (Encargar)</div>}
                                                    </div>
                                                    <button onClick={() => removeFromCart(item.id)} className="text-red-400 p-1"><X className="w-4 h-4" /></button>
                                                </div>
                                                
                                                <div className="flex items-end gap-3">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center bg-stone-100 rounded-lg h-9">
                                                            <button onClick={() => updateQty(item.id, -1)} className="px-2 h-full hover:bg-stone-200 rounded-l-lg text-stone-600"><Minus className="w-3 h-3" /></button>
                                                            <span className="text-sm font-bold w-8 text-center">{item.qty}</span>
                                                            <button onClick={() => updateQty(item.id, 1)} className="px-2 h-full hover:bg-stone-200 rounded-r-lg text-stone-600"><Plus className="w-3 h-3" /></button>
                                                        </div>
                                                    </div>

                                                    {view === 'purchases' ? (
                                                        <>
                                                            <div className="flex flex-col flex-1">
                                                                <span className="text-[9px] text-stone-400 font-bold uppercase mb-1">Costo</span>
                                                                <input type="text" className="w-full h-9 pl-2 pr-2 text-right border border-stone-200 rounded-lg text-sm font-bold text-stone-700 outline-none focus:border-orange-500" value={item.transactionPrice === 0 ? '' : formatMoney(item.transactionPrice)} placeholder="0" onChange={(e) => updateTransactionPrice(item.id, parseInt(e.target.value.replace(/\D/g, ''), 10) || 0)} />
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="flex flex-col items-end flex-1">
                                                            <span className="text-[9px] text-stone-400 font-bold uppercase mb-1">Total</span>
                                                            <span className="text-lg font-bold text-stone-700">${formatMoney(item.transactionPrice * item.qty)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
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
                                            {isImmediateSale && <select className="h-10 border rounded-xl px-2 w-28 text-sm" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}><option value="" disabled>Pago</option><option value="Efectivo">Efectivo</option><option value="Transferencia">Transf.</option></select>}
                                            <button onClick={() => setIsClientModalOpen(true)} className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center"><UserPlus className="w-5 h-5 text-orange-600"/></button>
                                        </>
                                    ) : (
                                        <div className="flex flex-1 gap-2">
                                            <div className="text-xs font-bold text-stone-500 flex items-center gap-2 bg-stone-100 px-3 py-2 rounded-xl">
                                                {stockSource === 'catalog' ? <BookOpen className="w-4 h-4"/> : <Globe className="w-4 h-4"/>}
                                                {stockSource === 'catalog' ? `Catálogo ${stockCycle}` : `${selectedOnlineStore} Online`}
                                            </div>
                                            {isInstallments && (
                                                <div className="text-xs font-bold text-purple-600 flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-xl border border-purple-100">
                                                    <CreditCard className="w-4 h-4"/> {installmentsCount} Cuotas
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {view === 'pos' && (
                                    <div className="flex justify-between items-center mb-3 bg-stone-50 p-2 rounded-lg border">
                                        <label className="text-xs font-bold text-stone-600 flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={isImmediateSale} onChange={e => setIsImmediateSale(e.target.checked)} className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"/>
                                            Entrega Inmediata (Descuenta Stock)
                                        </label>
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    {view === 'pos' && <button onClick={() => setShowPreTicket(true)} className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center text-white"><MessageCircle className="w-5 h-5"/></button>}
                                    <button onClick={handleTransaction} className="flex-1 h-12 bg-stone-800 text-white rounded-xl font-bold flex justify-between px-6 items-center">
                                        <span>{view === 'pos' ? (isImmediateSale ? 'Confirmar Venta' : 'Guardar Encargo') : 'Confirmar Pedido'}</span>
                                        <span>${formatMoney(cartTotal)}</span>
                                    </button>
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

        {/* PEDIDOS CLIENTES (RECEIPTS renamed) */}
        {view === 'receipts' && (
            <div className="p-4 overflow-y-auto pb-24">
                
                {/* SECCIÓN EN REPARTO - NUEVO */}
                <div className="mb-6">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Bike className="w-5 h-5 text-orange-500"/> En Reparto / Por Confirmar</h2>
                    <div className="space-y-3">
                        {filteredSales.inTransit.length === 0 && <div className="text-stone-400 text-sm text-center py-2">No hay envíos en curso.</div>}
                        {filteredSales.inTransit.map(t => (
                            <div key={t.id} className="p-4 bg-white rounded-xl shadow-sm border border-l-4 border-l-orange-500 relative overflow-hidden">
                                <div className="absolute right-0 top-0 bg-orange-100 text-orange-700 text-[9px] font-bold px-2 py-1 rounded-bl-xl uppercase">Lleva: {t.courier}</div>
                                <div onClick={() => setReceiptDetails(t)} className="cursor-pointer">
                                    <div className="flex justify-between mb-2 mt-1">
                                        <span className="font-bold text-stone-800">{getClientName(t.clientId)}</span>
                                        <span className="text-xs text-stone-400">{formatDateSimple(t.date.seconds)}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="text-xl font-black">${formatMoney(t.total)}</div>
                                        <span className="text-xs text-stone-500 italic">{t.paymentMethod}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2 border-t">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleVoidTransaction(t); }} 
                                        className="py-2 px-3 bg-red-50 text-red-600 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-red-100 transition-colors"
                                    >
                                        <Undo2 className="w-4 h-4"/> No Retiró
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleConfirmDeliveryClick(t); }} 
                                        className="flex-1 py-2 bg-stone-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-stone-900 transition-colors"
                                    >
                                        <Check className="w-4 h-4"/> Confirmar Entrega
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mb-6">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-blue-500"/> Pendientes de Entrega</h2>
                    <div className="space-y-3">
                        {filteredSales.pending.length === 0 && <div className="text-stone-400 text-sm text-center py-4">No hay pedidos pendientes.</div>}
                        {filteredSales.pending.map(t => {
                            const status = getOrderStatus(t);
                            return (
                                <div key={t.id} className={`p-4 bg-white rounded-xl shadow-sm border border-l-4 ${status === 'ready' ? 'border-l-green-500' : 'border-l-stone-300'}`}>
                                    <div onClick={() => setReceiptDetails(t)} className="cursor-pointer">
                                        <div className="flex justify-between mb-2">
                                            <span className="font-bold text-stone-800">{getClientName(t.clientId)}</span>
                                            <span className="text-xs text-stone-400">{formatDateSimple(t.date.seconds)}</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="text-xl font-black">${formatMoney(t.total)}</div>
                                            {status === 'ready' ? (
                                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold uppercase">Disponible</span>
                                            ) : (
                                                <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-1 rounded font-bold uppercase">Falta Stock</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-2 border-t">
                                        {status === 'ready' && (
                                            <button onClick={() => handleNotifyClient(t)} className="flex-1 py-2 bg-green-50 text-green-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                                                <MessageCircle className="w-4 h-4"/> Avisar
                                            </button>
                                        )}
                                        <button onClick={() => handleDeliverOrder(t)} className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 ${status === 'ready' ? 'bg-blue-600 text-white' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`} disabled={status !== 'ready'}>
                                            <Truck className="w-4 h-4"/> Despachar
                                        </button>
                                        <button onClick={() => handleVoidTransaction(t)} className="p-2 bg-red-50 text-red-500 rounded-lg">
                                            <Trash2 className="w-4 h-4"/>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><History className="w-5 h-5 text-stone-400"/> Historial Ventas</h2>
                    <div className="space-y-3">
                        {filteredSales.completed.slice(0, 10).map(t => (
                            <div key={t.id} onClick={() => setReceiptDetails(t)} className="p-4 bg-stone-50 rounded-xl shadow-sm border cursor-pointer opacity-75 hover:opacity-100">
                                <div className="flex justify-between mb-1">
                                    <span className="font-bold text-sm">{getClientName(t.clientId)}</span>
                                    <span className="text-xs text-stone-400">{formatDateSimple(t.date.seconds)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <div className="font-bold">${formatMoney(t.total)}</div>
                                    <div className="text-xs text-green-600 font-bold">ENTREGADO</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* PURCHASE HISTORY (REGISTRO PEDIDOS STOCK) */}
        {view === 'purchases' && showPurchaseHistory && (
            <div className="flex flex-col h-full">
                <div className="p-4 border-b flex justify-between items-center"><button onClick={() => setShowPurchaseHistory(false)} className="flex items-center text-stone-600 gap-1"><ChevronLeft className="w-4 h-4"/> Volver</button></div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {filteredPurchases.map(t => (
                        <div key={t.id} className={`p-4 bg-white rounded-xl shadow-sm border cursor-pointer hover:bg-stone-50 transition-colors border-l-4 ${t.saleStatus === 'received' ? 'border-l-green-500' : 'border-l-orange-500'}`}>
                            <div onClick={() => setReceiptDetails(t)}>
                                <div className="flex justify-between mb-2">
                                    <div className="font-bold text-lg text-stone-800">${formatMoney(t.total)}</div>
                                    {t.saleStatus === 'received' ? (
                                        <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded uppercase">Recibido</span>
                                    ) : (
                                        <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded uppercase">En Camino</span>
                                    )}
                                </div>
                                <div className="text-xs text-stone-500 flex justify-between mb-2">
                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {new Date(t.date.seconds*1000).toLocaleDateString()}</span>
                                    <span className="font-medium text-stone-700">
                                        {t.purchaseType === 'catalog' ? `Catálogo ${t.cycle}` : (t.onlineStore ? `${t.onlineStore} Online` : 'Web')}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end pt-2 border-t border-stone-100" onClick={(e) => e.stopPropagation()}>
                                {t.saleStatus !== 'received' && (
                                    <>
                                        <button onClick={() => handleEditPurchase(t)} className="p-2 bg-amber-50 text-amber-600 rounded hover:bg-amber-100"><Pencil className="w-4 h-4"/></button>
                                        <button onClick={() => handleReceiveStockClick(t)} className="flex-1 bg-green-600 text-white rounded font-bold text-xs flex items-center justify-center gap-1 hover:bg-green-700">
                                            <PackageCheck className="w-4 h-4"/> Recibir Mercadería
                                        </button>
                                    </>
                                )}
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

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full bg-white border-t flex justify-around py-3 pb-safe-bottom z-30 shadow-lg">
        <NavButton icon={<LayoutDashboard />} label="Reportes" active={view === 'reports'} onClick={() => setView('reports')} />
        <NavButton icon={<ShoppingCart />} label="Vender" active={view === 'pos'} onClick={() => setView('pos')} />
        <NavButton icon={<Truck />} label="Pedidos" active={view === 'purchases'} onClick={() => { setView('purchases'); setShowPurchaseHistory(false); setPurchaseMode(null); }} />
        <NavButton icon={<Receipt />} label="Pedidos Clientes" active={view === 'receipts'} onClick={() => setView('receipts')} />
        <NavButton icon={<Package />} label="Stock" active={view === 'inventory'} onClick={() => setView('inventory')} />
      </nav>
    </div>
  );
}

function NavButton({ icon, label, active, onClick }) {
    return <button onClick={onClick} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${active ? 'text-orange-600 bg-orange-50 scale-105' : 'text-stone-400 hover:bg-stone-50'}`}>{React.cloneElement(icon, { className: `w-6 h-6 ${active ? 'fill-current' : ''}` })}<span className="text-[10px] font-bold">{label}</span></button>
};
