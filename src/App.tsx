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
  Box
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
// Opciones nuevas para Web
const WEB_SUPPLIERS = ['Natura Web', 'Esika Web', 'L\'Bel Web'];
const COURIERS = ['Yo (Directo)', 'Mamá (Puesto Feria)', 'Tía Luisa']; 

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

  // NUEVO: Estado para confirmar fecha de entrega diferida
  const [confirmDeliveryModal, setConfirmDeliveryModal] = useState({ show: false, transaction: null });
  const [deliveryDateInput, setDeliveryDateInput] = useState(new Date().toISOString().split('T')[0]);

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

  // Estados Pedido
  // NUEVO: Estados para el flujo de "Pedidos" (Compras)
  const [orderSource, setOrderSource] = useState(null); // 'web' | 'catalog'
  const [catalogBrand, setCatalogBrand] = useState(''); // NUEVO: Para guardar la marca del catalogo
  const [installmentInfo, setInstallmentInfo] = useState({ isInstallments: false, count: 1 });
  // Recepción
  const [checkInOrder, setCheckInOrder] = useState(null); 
  const [checkInItems, setCheckInItems] = useState([]);

  const [purchaseMode, setPurchaseMode] = useState(null); // Mantenido por compatibilidad si se usa magazine
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
                      // Si era purchase, borrar los lotes también
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
      // Mantenemos esta función por seguridad, aunque en el nuevo flujo 
      // de Pedidos la edición es diferente, el usuario pidió no borrar funcionalidades.
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
          setOrderSource('web'); // Simular que es web para que aparezca el UI, aunque en edición es complejo
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
  // Helper para recepción de items
  const updateCheckInDate = (tempId, date) => setCheckInItems(prev => prev.map(i => i._tempId === tempId ? { ...i, expirationDate: date } : i));

  const clearCart = () => { 
      setCart([]); setSelectedClient(''); setClientSearchTerm(''); setSelectedSupplier(''); 
      setPaymentMethod(''); setEditingTransactionId(null); setMagazineFile(null); 
      setOriginalBatchesMap({}); 
      setIsImmediateSale(false);
      setOrderSource(null);
      setCatalogBrand(''); // Reset catalog brand
      setSelectedCycle(''); // Reset selected cycle
      setInstallmentInfo({ isInstallments: false, count: 1 });
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

  // --- NUEVA LÓGICA DE CREACIÓN DE PEDIDOS (Purchases) ---
  const handleCreateOrder = async () => {
    if (cart.length === 0) { triggerAlert("Vacío", "Agrega productos.", "info"); return; }
    if (!selectedSupplier) { triggerAlert("Falta Origen", "Selecciona si es Web o Catálogo.", "info"); return; }
    
    if (cart.some(i => i.transactionPrice <= 0)) { triggerAlert("Costo 0", "Ingresa costos válidos.", "error"); return; }

    setLoading(true);
    setProcessingMsg('Creando Pedido...');

    try {
        const newTransId = doc(collection(db, `artifacts/${APP_ID}/public/data/transactions`)).id;
        const now = new Date();

        // FIX: USAR setDoc para asegurar que el ID del documento sea newTransId
        await setDoc(doc(db, `artifacts/${APP_ID}/public/data/transactions`, newTransId), {
            id: newTransId,
            type: 'order', // Nuevo tipo 'order' para diferenciar de 'purchase' (completado)
            items: [...cart],
            total: cartTotal,
            clientId: selectedSupplier, // Guardamos aquí Natura Web, Natura Catálogo, etc
            date: { seconds: now.getTime() / 1000 },
            saleStatus: 'pending_arrival', // Estado específico
            installments: installmentInfo.isInstallments ? installmentInfo.count : 1,
            orderType: orderSource, // 'web' o 'catalog'
            cycle: selectedCycle || null // Guardar ciclo
        });

        clearCart();
        setOrderSource(null);
        triggerAlert("Pedido Creado", "Registrado en 'Por Llegar'. Confirma cuando recibas los productos.", "success");

    } catch (error) {
        console.error(error);
        triggerAlert("Error", "No se pudo crear el pedido.", "error");
    } finally {
        setLoading(false);
        setProcessingMsg('');
    }
  };

  // --- INICIAR RECEPCIÓN (Check-In) ---
  const startCheckIn = (transaction) => {
      const explodedItems = [];
      transaction.items.forEach((item) => {
          for(let i=0; i < item.qty; i++) {
              explodedItems.push({
                  _tempId: `${item.id}_${i}_${Date.now()}`,
                  ...item,
                  uniqueQty: 1, // Siempre 1 para control individual
                  expirationDate: '' // Usuario debe llenar
              });
          }
      });
      setCheckInItems(explodedItems);
      setCheckInOrder(transaction);
  };

  // --- CONFIRMAR RECEPCIÓN ---
  const confirmCheckIn = async () => {
      if (checkInItems.some(i => !i.expirationDate)) {
          triggerAlert("Faltan Fechas", "Ingresa el vencimiento de CADA producto.", "error");
          return;
      }

      setLoading(true);
      setProcessingMsg('Ingresando Stock...');

      try {
          const batch = writeBatch(db);
          
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
              type: 'purchase', 
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

  // --- MANEJO TRANSACCION DE VENTAS (POS) ---
  const handleTransaction = async () => {
    if (cart.length === 0) { triggerAlert("Vacío", "Agrega productos.", "info"); return; }
    // Si estamos en vista purchases (Pedidos), usamos el nuevo handler handleCreateOrder
    if (view === 'purchases') {
        handleCreateOrder();
        return;
    }

    // Lógica de Ventas (POS)
    if (!selectedClient) { triggerAlert("Falta Cliente", "Selecciona cliente.", "info"); return; }
    if (isImmediateSale && !paymentMethod) { triggerAlert("Falta Pago", "Selecciona medio de pago.", "info"); return; }
    
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

    setLoading(true);
    setProcessingMsg('Guardando Venta...');

    try {
        const batch = writeBatch(db);
        const newTransId = doc(collection(db, `artifacts/${APP_ID}/public/data/transactions`)).id;

        if (isImmediateSale) {
             for (const item of cart) {
                 const { totalCost, batchUpdates, fifoDetails } = await calculateFIFOCost(item.id, item.qty);
                 item.fifoTotalCost = totalCost; 
                 item.fifoDetails = fifoDetails;
                 batchUpdates.forEach(u => batch.update(doc(db, `artifacts/${APP_ID}/public/data/inventory_batches`, u.id), { remainingQty: u.newRemainingQty }));
                 batch.update(doc(db, `artifacts/${APP_ID}/public/data/products`, item.id), { stock: increment(-item.qty) });
             }
        }

        const transactionFIFO = isImmediateSale ? cart.reduce((acc, i) => acc + (i.fifoTotalCost || 0), 0) : 0;
        const margin = (cartTotal - transactionFIFO);
        const now = new Date();

        batch.set(doc(db, `artifacts/${APP_ID}/public/data/transactions`, newTransId), {
            id: newTransId, 
            type: 'sale',
            items: [...cart],
            total: cartTotal,
            clientId: selectedClient,
            date: { seconds: now.getTime() / 1000 },
            paymentMethod: isImmediateSale ? paymentMethod : null,
            totalCost: transactionFIFO,
            margin: margin,
            marginPercent: (cartTotal > 0) ? (margin/cartTotal)*100 : 0,
            saleStatus: isImmediateSale ? 'completed' : 'pending',
            origin: 'POS',
            courier: isImmediateSale ? 'Yo (Directo)' : null,
            deliveredAt: isImmediateSale ? { seconds: now.getTime() / 1000 } : null,
            finalizedAt: isImmediateSale ? { seconds: now.getTime() / 1000 } : null
        });

        await batch.commit();
        clearCart();
        triggerAlert("Éxito", isImmediateSale ? "Venta realizada." : "Encargo guardado.", "success");
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

  // FILTRO PARA PEDIDOS (COMPRAS) - MUESTRA LOS PENDIENTES Y LOS COMPLETADOS
  const filteredOrders = useMemo(() => {
      return transactions.filter(t => (t.type === 'order' && t.saleStatus === 'pending_arrival') || t.type === 'purchase');
  }, [transactions]);

  const pendingArrivals = filteredOrders.filter(t => t.saleStatus === 'pending_arrival');
  const purchaseHistoryData = filteredOrders.filter(t => t.type === 'purchase');

  const getClientName = (id) => clients.find(c => c.id === id)?.name || 'Consumidor Final';
  
  const getSupplierName = (id) => {
      if (WEB_SUPPLIERS.includes(id) || id.includes('Catálogo')) return id;
      const s = suppliers.find(sup => sup.id === id);
      return s ? s.name : id || 'Proveedor'; 
  };

  // --- LOGICA REPORTES ---
  const expiringProducts = useMemo(() => {
      const expiring = inventoryBatches.filter(b => b.remainingQty > 0 && b.expirationDate);
      expiring.sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));
      return expiring.slice(0, 10); 
  }, [inventoryBatches]);

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
          case 'purchases': return 'Pedidos'; // NOMBRE ACTUALIZADO
          case 'receipts': return 'Ventas'; // NOMBRE ACTUALIZADO
          case 'inventory': return 'Inventario';
          case 'reports': return 'Reportes';
          default: return view;
      }
  };

  if (!user && loading) return <div className="flex h-screen items-center justify-center bg-stone-100 text-orange-600">Iniciando...</div>;

  return (
    <div className="flex flex-col h-screen bg-stone-50 text-stone-800 font-sans overflow-hidden relative">
      
      {/* --- GLOBAL LOADING OVERLAY --- */}
      {loading && processingMsg && (
          <div className="fixed inset-0 bg-black/50 z-[110] flex flex-col items-center justify-center backdrop-blur-sm">
              <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-200">
                  <Loader2 className="w-12 h-12 text-orange-600 animate-spin mb-3"/>
                  <span className="font-bold text-lg text-stone-700">{processingMsg}</span>
              </div>
          </div>
      )}

      {/* Alert */}
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

      {/* --- MODALES (SE MANTIENEN IGUALES PERO OCULTOS POR DEFECTO) --- */}
      {/* (Código de modales de reportes, confirmación, etc. está abajo en el JSX) */}

      {/* Header */}
      <header className={`${view === 'purchases' ? 'bg-stone-800' : view === 'receipts' ? 'bg-stone-700' : 'bg-orange-500'} text-white p-2 shadow-md flex justify-between items-center z-10 shrink-0`}>
        <h1 className="font-bold text-base flex items-center gap-2">
            {view === 'pos' ? <Leaf className="w-5 h-5"/> : view === 'inventory' ? <Package className="w-5 h-5"/> : view === 'purchases' ? <ShoppingBag className="w-5 h-5"/> : view === 'receipts' ? <Receipt className="w-5 h-5"/> : <LayoutDashboard className="w-5 h-5"/>} 
            {getHeaderTitle()}
        </h1>
      </header>

      {/* Main */}
      <main className={`flex-1 overflow-hidden relative flex flex-col ${view !== 'pos' && view !== 'purchases' ? 'overflow-y-auto' : ''}`}>
        
        {/* POS VIEW */}
        {(view === 'pos') && (
            <div className="flex flex-col h-full relative">
                <div className="p-2 bg-white border-b shadow-sm space-y-2">
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
                {/* Cart POS */}
                {cart.length > 0 && (
                    <div className="fixed bottom-[76px] left-0 w-full z-20 flex flex-col shadow-2xl">
                        <div className="rounded-t-3xl border-t p-4 bg-white">
                            <div className="max-h-48 overflow-y-auto mb-2 space-y-2">
                                {cart.map(item => (
                                    <div key={item.id} className="flex justify-between items-center border-b pb-2">
                                        <div className="flex-1">
                                            <div className="text-sm font-bold line-clamp-1">{item.name}</div>
                                            <div className="text-xs text-stone-500">${formatMoney(item.price)} x {item.qty}</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center bg-stone-100 rounded-lg">
                                                <button onClick={() => updateQty(item.id, -1)} className="px-2 py-1"><Minus className="w-3 h-3"/></button>
                                                <span className="text-sm font-bold w-6 text-center">{item.qty}</span>
                                                <button onClick={() => updateQty(item.id, 1)} className="px-2 py-1"><Plus className="w-3 h-3"/></button>
                                            </div>
                                            <button onClick={() => removeFromCart(item.id)} className="text-red-400"><X className="w-4 h-4"/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <div className="flex-1 relative" ref={clientInputRef}>
                                        <input className="w-full h-10 pl-8 border rounded-xl text-sm" placeholder="Cliente..." value={clientSearchTerm} onChange={e => { setClientSearchTerm(e.target.value); setShowClientOptions(true); }} onFocus={() => setShowClientOptions(true)} />
                                        <Users className="absolute left-2 top-3 w-4 h-4 text-stone-400"/>
                                        {showClientOptions && <div className="absolute bottom-full w-full bg-white border rounded-xl shadow-lg max-h-40 overflow-y-auto">{filteredClientsForSearch.map(c => <div key={c.id} className="p-3 hover:bg-stone-50 text-sm cursor-pointer" onClick={() => { setSelectedClient(c.id); setClientSearchTerm(c.name); setShowClientOptions(false); }}>{c.name}</div>)}</div>}
                                    </div>
                                    <button onClick={() => setIsClientModalOpen(true)} className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center"><UserPlus className="w-5 h-5"/></button>
                                </div>
                                <div className="flex justify-between items-center bg-stone-50 p-2 rounded-lg border">
                                    <label className="text-xs font-bold text-stone-600 flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={isImmediateSale} onChange={e => setIsImmediateSale(e.target.checked)} className="w-4 h-4 rounded text-orange-600"/>
                                        Entrega Inmediata
                                    </label>
                                    {isImmediateSale && <select className="h-8 border rounded text-xs" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}><option value="">Pago...</option><option value="Efectivo">Efectivo</option><option value="Transferencia">Transf.</option></select>}
                                </div>
                                <button onClick={handleTransaction} className="w-full h-12 bg-stone-800 text-white rounded-xl font-bold flex justify-between px-6 items-center">
                                    <span>{isImmediateSale ? 'Confirmar Venta' : 'Guardar Encargo'}</span>
                                    <span>${formatMoney(cartTotal)}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* --- VISTA: PEDIDOS (COMPRAS) --- */}
        {view === 'purchases' && (
            <div className="flex flex-col h-full">
                {/* 1. RECEPCIÓN DE STOCK (Check-In Mode) */}
                {checkInOrder ? (
                    <div className="flex flex-col h-full bg-white animate-in slide-in-from-bottom duration-300">
                        <div className="p-4 border-b bg-amber-50 flex justify-between items-center">
                            <div>
                                <h2 className="font-bold text-amber-800">Confirmar Llegada</h2>
                                <p className="text-xs text-amber-600">Ingresa vencimiento por unidad</p>
                            </div>
                            <button onClick={() => {setCheckInOrder(null); setCheckInItems([]);}} className="text-stone-400"><X/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            {checkInItems.map((item, idx) => (
                                <div key={item._tempId} className="mb-3 border rounded-xl p-3 bg-white shadow-sm flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <div className="font-bold text-stone-700 flex gap-2 items-center">
                                            <span className="bg-stone-100 px-2 rounded text-xs text-stone-500">#{idx+1}</span>
                                            {item.name}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <CalendarDays className="w-4 h-4 text-stone-400"/>
                                        <input 
                                            type="date" 
                                            className={`flex-1 p-2 border rounded-lg text-sm font-medium ${!item.expirationDate ? 'border-red-300 bg-red-50' : 'border-green-200 bg-green-50'}`}
                                            value={item.expirationDate}
                                            onChange={(e) => updateCheckInDate(item._tempId, e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t bg-white pb-24">
                            <button onClick={confirmCheckIn} className="w-full py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-200">
                                Confirmar e Ingresar Stock
                            </button>
                        </div>
                    </div>
                ) : (
                    /* 2. VISTA PRINCIPAL DE PEDIDOS */
                    !orderSource ? (
                        /* -- DASHBOARD PEDIDOS (SCROLLABLE FIX) -- */
                        <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
                            {/* Botón Nuevo Pedido */}
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setOrderSource('selection')} className="col-span-2 bg-stone-800 text-white p-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform">
                                    <Plus className="w-6 h-6"/> <span className="font-bold text-lg">Nuevo Pedido</span>
                                </button>
                            </div>

                            {/* Lista Por Llegar (Pending Arrival) */}
                            <div>
                                <h3 className="font-bold text-stone-700 mb-3 flex items-center gap-2"><Clock className="w-5 h-5 text-amber-500"/> Por Llegar</h3>
                                <div className="space-y-3">
                                    {pendingArrivals.length === 0 && <div className="text-center text-sm text-stone-400 py-4 border-2 border-dashed rounded-xl">No hay pedidos pendientes</div>}
                                    {pendingArrivals.map(order => (
                                        <div key={order.id} onClick={() => startCheckIn(order)} className="bg-white border border-l-4 border-l-amber-500 p-4 rounded-xl shadow-sm cursor-pointer hover:bg-amber-50 transition-colors relative">
                                            <div className="absolute top-3 right-3 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded uppercase">
                                                {order.clientId}
                                            </div>
                                            <div className="font-bold text-lg mb-1">${formatMoney(order.total)}</div>
                                            <div className="text-xs text-stone-500 flex gap-3">
                                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {formatDateSimple(order.date.seconds)}</span>
                                                <span className="flex items-center gap-1"><Box className="w-3 h-3"/> {order.items.length} prod.</span>
                                                {order.installments > 1 && <span className="flex items-center gap-1"><CreditCard className="w-3 h-3"/> {order.installments} cuotas</span>}
                                                {order.cycle && <span className="flex items-center gap-1 font-bold text-purple-600"><Tag className="w-3 h-3"/> {order.cycle}</span>}
                                            </div>
                                            <div className="mt-3 pt-2 border-t flex justify-between items-center">
                                                <span className="text-xs font-bold text-stone-400 uppercase">Toca para recibir</span>
                                                <ChevronRight className="w-4 h-4 text-amber-500"/>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Historial Pedidos Cerrados */}
                            <div>
                                <h3 className="font-bold text-stone-700 mb-3 flex items-center gap-2"><History className="w-5 h-5 text-stone-400"/> Historial Compras</h3>
                                <div className="space-y-2">
                                    {purchaseHistoryData.slice(0, 10).map(h => (
                                        <div key={h.id} className="bg-stone-50 p-3 rounded-xl flex justify-between items-center opacity-70">
                                            <div>
                                                <div className="font-bold text-stone-700">${formatMoney(h.total)}</div>
                                                <div className="text-[10px] text-stone-400">{formatDateSimple(h.date.seconds)} • {h.clientId}</div>
                                            </div>
                                            <div className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold">RECIBIDO</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* 3. CREACIÓN DE NUEVO PEDIDO (Flow) */
                        <div className="flex flex-col h-full bg-stone-50">
                            {/* Paso 1: Selección Origen */}
                            {orderSource === 'selection' && (
                                <div className="p-6 flex flex-col h-full">
                                    <div className="mb-6"><h2 className="text-2xl font-bold text-stone-800">¿Origen del Pedido?</h2><p className="text-stone-500">Selecciona cómo realizaste la compra.</p></div>
                                    <div className="grid grid-cols-1 gap-4 flex-1 content-start">
                                        <button onClick={() => setOrderSource('web')} className="p-6 bg-white rounded-2xl shadow-sm border-2 border-transparent hover:border-blue-500 text-left group">
                                            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Globe className="w-6 h-6 text-blue-600"/></div>
                                            <h3 className="font-bold text-lg">Compra Web</h3>
                                            <p className="text-sm text-stone-400">Pedido online (Natura, Esika, L'Bel)</p>
                                        </button>
                                        <button onClick={() => setOrderSource('catalog')} className="p-6 bg-white rounded-2xl shadow-sm border-2 border-transparent hover:border-pink-500 text-left group">
                                            <div className="bg-pink-100 w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><BookOpen className="w-6 h-6 text-pink-600"/></div>
                                            <h3 className="font-bold text-lg">Catálogo</h3>
                                            <p className="text-sm text-stone-400">Pedido tradicional por revista</p>
                                        </button>
                                    </div>
                                    <button onClick={() => setOrderSource(null)} className="py-3 text-stone-400 font-bold">Cancelar</button>
                                </div>
                            )}

                            {/* Paso 2: Detalles (Web o Catálogo) */}
                            {(orderSource === 'web' || orderSource === 'catalog') && !selectedSupplier && (
                                <div className="p-6 flex flex-col h-full animate-in slide-in-from-right duration-200">
                                    <div className="mb-6">
                                        <h2 className="text-2xl font-bold text-stone-800">{orderSource === 'web' ? 'Selecciona Web' : 'Detalles Catálogo'}</h2>
                                    </div>
                                    
                                    {orderSource === 'web' ? (
                                        <div className="space-y-3">
                                            {WEB_SUPPLIERS.map(s => (
                                                <button key={s} onClick={() => setSelectedSupplier(s)} className="w-full p-4 bg-white border rounded-xl font-bold text-left hover:bg-stone-50">{s}</button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-white p-6 rounded-2xl shadow-sm space-y-6">
                                            {/* NUEVO: Selección de Marca para Catálogo */}
                                            {!catalogBrand ? (
                                                <div>
                                                    <label className="block font-bold text-sm mb-3">¿De qué marca es el catálogo?</label>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {BRANDS.map(b => (
                                                            <button key={b} onClick={() => setCatalogBrand(b)} className="p-3 border rounded-xl font-bold text-sm hover:bg-stone-50">{b}</button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex justify-between items-center border-b pb-2">
                                                        <span className="font-bold text-lg text-stone-700">{catalogBrand}</span>
                                                        <button onClick={() => setCatalogBrand('')} className="text-xs text-blue-500 underline">Cambiar</button>
                                                    </div>

                                                    {/* NUEVO: Selector de Ciclo/Campaña */}
                                                    <div>
                                                        <label className="block font-bold text-sm mb-2">Campaña / Ciclo</label>
                                                        <div className="flex gap-2">
                                                            <select 
                                                                className="flex-1 p-3 border rounded-xl bg-stone-50" 
                                                                value={selectedCycle} 
                                                                onChange={(e) => setSelectedCycle(e.target.value)}
                                                            >
                                                                <option value="">Seleccionar...</option>
                                                                {cycles.map(c => <option key={c} value={c}>{c}</option>)}
                                                            </select>
                                                            <button 
                                                                onClick={() => setIsCycleModalOpen(true)} 
                                                                className="w-12 bg-stone-800 text-white rounded-xl flex items-center justify-center hover:bg-stone-700"
                                                            >
                                                                <Plus className="w-6 h-6"/>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block font-bold text-sm mb-2">¿Es compra en cuotas?</label>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => setInstallmentInfo({...installmentInfo, isInstallments: false})} className={`flex-1 py-2 rounded-lg border font-bold ${!installmentInfo.isInstallments ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-stone-500'}`}>No</button>
                                                            <button onClick={() => setInstallmentInfo({...installmentInfo, isInstallments: true})} className={`flex-1 py-2 rounded-lg border font-bold ${installmentInfo.isInstallments ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-stone-500'}`}>Sí</button>
                                                        </div>
                                                    </div>
                                                    {installmentInfo.isInstallments && (
                                                        <div>
                                                            <label className="block font-bold text-sm mb-2">Cantidad de Cuotas</label>
                                                            <select className="w-full p-3 border rounded-xl bg-stone-50" value={installmentInfo.count} onChange={e => setInstallmentInfo({...installmentInfo, count: parseInt(e.target.value)})}>
                                                                {[2,3,4,5,6].map(n => <option key={n} value={n}>{n} Cuotas</option>)}
                                                            </select>
                                                        </div>
                                                    )}
                                                    
                                                    <button 
                                                        onClick={() => {
                                                            if(!selectedCycle) { triggerAlert("Falta Ciclo", "Selecciona la campaña/ciclo.", "info"); return; }
                                                            setSelectedSupplier(`${catalogBrand} Catálogo`);
                                                        }} 
                                                        className="w-full py-3 bg-stone-800 text-white font-bold rounded-xl"
                                                    >
                                                        Continuar
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                    <button onClick={() => setOrderSource('selection')} className="mt-auto py-3 text-stone-400 font-bold">Volver</button>
                                </div>
                            )}

                            {/* Paso 3: Selección Productos (Carrito de Compra) - LOOK & FEEL ACTUALIZADO (GRID) */}
                            {selectedSupplier && (
                                <div className="flex flex-col h-full relative animate-in slide-in-from-right duration-200">
                                    {/* Buscador y Filtros (Igual que Stock) */}
                                    <div className="p-2 bg-white border-b relative space-y-2">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400"/>
                                            <input className="w-full pl-9 p-2 bg-stone-100 rounded-lg text-sm" placeholder="Buscar producto para agregar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                                        </div>
                                        {/* Filtros de Categoría */}
                                        <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                            <button onClick={() => setSelectedCategoryFilter('ALL')} className={`px-3 py-1 rounded-full border text-xs whitespace-nowrap ${selectedCategoryFilter === 'ALL' ? 'bg-orange-600 text-white' : 'bg-white'}`}>Todos</button>
                                            {categories.map(c => (
                                                <button key={c.id} onClick={() => setSelectedCategoryFilter(c.id)} className={`px-3 py-1 rounded-full border text-xs whitespace-nowrap ${selectedCategoryFilter === c.id ? 'bg-orange-600 text-white' : 'bg-white'}`}>{c.name}</button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* GRID DE PRODUCTOS (Igual que Stock) */}
                                    <div className="flex-1 overflow-y-auto p-2 bg-stone-100 pb-48">
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                            {filteredProducts.map(p => (
                                                <button key={p.id} onClick={() => addToCart(p)} className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col group hover:shadow-md transition-all h-full">
                                                    {/* Image Area */}
                                                    <div className="aspect-square w-full relative">
                                                        {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <Leaf className="w-full h-full p-8 text-stone-200 bg-stone-50" />}
                                                    </div>
                                                    {/* Details Area */}
                                                    <div className="p-2 flex flex-col flex-1 justify-between text-left w-full">
                                                        <span className="font-bold text-sm line-clamp-2 leading-tight text-stone-700">{p.name}</span>
                                                        <div className="mt-2 flex justify-between items-end w-full">
                                                            <span className="text-stone-400 text-[10px] font-medium">Stock: {p.stock}</span>
                                                            <div className="bg-stone-100 p-1.5 rounded-full"><Plus className="w-4 h-4 text-stone-600"/></div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Carrito de Compra (Purchase Cart) COMPACTO & OPTIMIZADO */}
                                    <div className="fixed bottom-[60px] left-0 w-full z-20 bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] border-t border-stone-200 flex flex-col max-h-[50vh] min-h-0"> 
                                        {/* Header Compacto */}
                                        <div className="px-4 py-3 border-b flex justify-between items-center bg-stone-50 rounded-t-2xl shrink-0">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <ShoppingCart className="w-4 h-4 text-stone-700 shrink-0"/>
                                                <span className="font-bold text-stone-800 text-sm whitespace-nowrap">Resumen</span>
                                                <span className="text-xs text-stone-500 truncate border-l pl-2 border-stone-300 max-w-[150px]">{selectedSupplier}</span>
                                            </div>
                                            <button onClick={() => { clearCart(); setOrderSource('selection'); setSelectedSupplier(''); }} className="p-1 bg-stone-200 rounded-full text-stone-500 hover:bg-red-100 hover:text-red-500 transition-colors">
                                                <X className="w-4 h-4"/>
                                            </button>
                                        </div>

                                        {/* Lista Scrollable */}
                                        <div className="flex-1 overflow-y-auto p-3 min-h-0"> {/* min-h-0 is key for nested flex scroll */}
                                            {cart.length === 0 && <div className="text-center text-stone-400 py-4 text-xs">Agrega productos arriba</div>}
                                            {cart.map(item => (
                                                <div key={item.id} className="mb-3 border-b pb-2 last:border-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="text-xs font-bold line-clamp-1">{item.name}</span>
                                                        <button onClick={() => removeFromCart(item.id)} className="text-red-400"><X className="w-3 h-3"/></button>
                                                    </div>
                                                    <div className="flex gap-2 items-end">
                                                        <div className="flex items-center bg-stone-100 rounded-lg h-7">
                                                            <button onClick={() => updateQty(item.id, -1)} className="px-2"><Minus className="w-3 h-3"/></button>
                                                            <span className="text-xs font-bold w-5 text-center">{item.qty}</span>
                                                            <button onClick={() => updateQty(item.id, 1)} className="px-2"><Plus className="w-3 h-3"/></button>
                                                        </div>
                                                        <div className="flex-1">
                                                            <input type="number" className="w-full border-b border-stone-300 text-xs font-bold text-right focus:border-stone-800 outline-none bg-transparent" 
                                                                value={item.transactionPrice === 0 ? '' : item.transactionPrice} 
                                                                placeholder="Costo..."
                                                                onChange={e => updateTransactionPrice(item.id, parseInt(e.target.value) || 0)}
                                                            />
                                                        </div>
                                                        <div className="w-16 text-right">
                                                            <div className="font-bold text-xs">${formatMoney(item.transactionPrice * item.qty)}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Footer Compacto */}
                                        <div className="p-3 border-t bg-white shrink-0">
                                            <button onClick={handleCreateOrder} className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold shadow-lg flex justify-between px-4 text-sm">
                                                <span>Guardar Pedido</span>
                                                <span>${formatMoney(cartTotal)}</span>
                                            </button>
                                        </div>
                                    </div>
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

        {/* VENTAS (Antes Receipts) */}
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

      {/* --- MODALS (RESTAURADOS) --- */}

      {/* Modal Por Vencer */}
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

      {/* Modal Por Comprar (Pendientes) */}
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

      {/* MODAL HISTORIAL (KARDEX) */}
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

      {/* MODAL RECIBO */}
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
                    
                    {/* INFO DETALLADA DEL ENVÍO/PAGO */}
                    {receiptDetails.type === 'sale' && (
                        <div className="bg-stone-50 p-3 rounded-xl border mb-4 text-xs space-y-1">
                            <div className="flex justify-between"><span>Repartidor:</span> <span className="font-bold">{receiptDetails.courier || 'No registrado'}</span></div>
                            <div className="flex justify-between"><span>Pago:</span> <span className="font-bold">{receiptDetails.paymentMethod || '-'}</span></div>
                            {receiptDetails.deliveredAt && <div className="flex justify-between"><span>Fecha Salida:</span> <span>{formatDateWithTime(receiptDetails.deliveredAt?.seconds)}</span></div>}
                            {receiptDetails.finalizedAt && <div className="flex justify-between text-green-700 font-bold"><span>Fecha Entrega/Cobro:</span> <span>{formatDateSimple(receiptDetails.finalizedAt?.seconds)}</span></div>}
                        </div>
                    )}

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
                                        - {detail.qty} un. del {formatDateSimple(detail.date)} a costo ${formatMoney(detail.cost)} c/u
                                        </div>
                                    ))
                                )}
                            </div>
                        ))}
                    </div>
                    {/* Si es pendiente, permitimos entregar solo si hay stock (validado en el handler) */}
                    {receiptDetails.saleStatus === 'pending' && (
                        <button 
                            onClick={() => handleDeliverOrder(receiptDetails)} 
                            className={`w-full mt-6 font-bold py-3 rounded-xl text-white ${getOrderStatus(receiptDetails) === 'ready' ? 'bg-green-600' : 'bg-stone-300 cursor-not-allowed'}`}
                            disabled={getOrderStatus(receiptDetails) !== 'ready'}
                        >
                            {getOrderStatus(receiptDetails) === 'ready' ? 'Entregar Ahora' : 'Falta Stock (Esperar)'}
                        </button>
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

      {/* MODAL ENTREGA / DESPACHO */}
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

      {/* MODAL CATALOGO */}
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

      {/* MODAL PRE-TICKET (Mensaje para compartir detalle) */}
      {showPreTicket && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
              <div className="bg-white p-6 rounded-2xl w-full max-w-sm">
                  <h2 className="text-lg font-bold mb-2">Compartir Detalle</h2>
                  <p className="text-sm text-stone-500 mb-4">Se copiará al portapapeles o abrirá WhatsApp.</p>
                  <div className="bg-stone-100 p-3 rounded-lg text-xs font-mono mb-4 max-h-40 overflow-y-auto">
                      {cart.map(i => `${i.name} x${i.qty} ($${formatMoney(i.price)})`).join('\n')}
                      {'\n'}Total: ${formatMoney(cartTotal)}
                  </div>
                  <div className="flex gap-2">
                      <button onClick={() => {
                          const text = `Hola! Aquí el detalle:\n${cart.map(i => `- ${i.name} x${i.qty}`).join('\n')}\nTotal: $${formatMoney(cartTotal)}`;
                          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                          setShowPreTicket(false);
                      }} className="flex-1 py-2 bg-green-500 text-white rounded-xl font-bold">WhatsApp</button>
                      <button onClick={() => setShowPreTicket(false)} className="flex-1 py-2 bg-stone-200 rounded-xl">Cerrar</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- MODAL DE CONFIRMACIÓN FECHA ENTREGA DIFERIDA --- */}
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

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full bg-white border-t flex justify-around py-3 pb-safe-bottom z-30 shadow-lg">
        <NavButton icon={<LayoutDashboard />} label="Reportes" active={view === 'reports'} onClick={() => setView('reports')} />
        <NavButton icon={<ShoppingCart />} label="Vender" active={view === 'pos'} onClick={() => setView('pos')} />
        {/* PEDIDOS (Antes Abastecimiento) */}
        <NavButton icon={<ShoppingBag />} label="Pedidos" active={view === 'purchases'} onClick={() => { setView('purchases'); setShowPurchaseHistory(false); setPurchaseMode(null); setOrderSource(null); }} />
        {/* VENTAS (Antes Pedidos) */}
        <NavButton icon={<Receipt />} label="Ventas" active={view === 'receipts'} onClick={() => setView('receipts')} />
        <NavButton icon={<Package />} label="Stock" active={view === 'inventory'} onClick={() => setView('inventory')} />
      </nav>
    </div>
  );
}

function NavButton({ icon, label, active, onClick }) {
    return <button onClick={onClick} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${active ? 'text-orange-600 bg-orange-50 scale-105' : 'text-stone-400 hover:bg-stone-50'}`}>{React.cloneElement(icon, { className: `w-6 h-6 ${active ? 'fill-current' : ''}` })}<span className="text-[10px] font-bold">{label}</span></button>
}
