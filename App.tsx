
import React, { useState, useEffect } from 'react';
import OrderForm from './views/OrderForm';
import AdminDashboard from './views/AdminDashboard';
import OrderHistory from './views/OrderHistory';
import AuthForm from './views/AuthForm';
import { NeonBar } from './components/FuturisticUI';
import { Order, PaymentGateway, User, PaymentMethodType, OrderStatus } from './types';
import { analyzeOrderRisk } from './services/geminiService';
import { Hexagon, LogOut, PlusCircle, History, GraduationCap, ShieldCheck, LayoutDashboard } from 'lucide-react';
import { supabase } from './services/supabaseClient';

// --- CONSTANTS ---
// SEUL cet email aura accès au tableau de bord administrateur
const ADMIN_EMAIL = 'institutmoisson@gmail.com';

const App: React.FC = () => {
  // --- STATE ---
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<'AUTH' | 'USER' | 'ADMIN'>('AUTH');
  const [userTab, setUserTab] = useState<'FORM' | 'HISTORY'>('FORM');
  const [orders, setOrders] = useState<Order[]>([]);
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // --- DATA MAPPING HELPERS ---
  const mapOrderFromDB = (dbOrder: any): Order => ({
    id: dbOrder.id,
    productName: dbOrder.product_name,
    description: dbOrder.description,
    price: dbOrder.price,
    cryptoAmount: dbOrder.crypto_amount,
    clientName: dbOrder.client_name,
    clientContact: dbOrder.client_contact,
    moissonneurCode: dbOrder.moissonneur_code,
    clientMoissonneurCode: dbOrder.client_moissonneur_code,
    agentCode: dbOrder.agent_code,
    country: dbOrder.country || 'Côte d\'Ivoire',
    city: dbOrder.city,
    neighborhood: dbOrder.neighborhood,
    deliveryLocation: dbOrder.delivery_location,
    urgency: dbOrder.urgency,
    location: dbOrder.location,
    paymentMethodId: dbOrder.payment_method_id,
    photoUrl: dbOrder.photo_url,
    status: dbOrder.status,
    createdAt: dbOrder.created_at,
    aiAnalysis: dbOrder.ai_analysis,
    approvedAt: dbOrder.approved_at,
    rejectedAt: dbOrder.rejected_at
  });

  const mapGatewayFromDB = (dbGateway: any): PaymentGateway => ({
    id: dbGateway.id,
    name: dbGateway.name,
    type: dbGateway.type,
    logoUrl: dbGateway.logo_url,
    actionUrl: dbGateway.action_url,
    isActive: dbGateway.is_active,
    order: dbGateway.display_order
  });

  // --- INITIALIZATION & AUTH ---

  useEffect(() => {
    // 1. Vérifier la session active au chargement
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        handleUserSession(session.user);
      } else {
        setView('AUTH'); // Force la connexion si pas de session
      }
    });

    // 2. Écouter les changements d'auth (connexion/déconnexion)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        handleUserSession(session.user);
      } else {
        setView('AUTH');
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUserSession = async (authUser: any) => {
    setIsLoading(true);
    const email = authUser.email;
    const normalizedEmail = email ? email.toLowerCase().trim() : '';

    // --- SÉCURITÉ ADMIN ---
    // Seul l'email spécifié peut devenir ADMIN, peu importe ce que dit la base de données.
    if (normalizedEmail === ADMIN_EMAIL.toLowerCase()) {
      // 1. Définir l'état local Admin
      setCurrentUser({
        id: authUser.id,
        email: email,
        name: 'Administrateur Général & Manager', // Titre spécifié
        role: 'ADMIN',
        msnCode: 'ADMIN-MASTER',
        walletBalance: 0
      });
      setView('ADMIN');

      // 2. Tentative de mise à jour du rôle en base de données pour satisfaire les politiques RLS
      // (Row Level Security) qui bloqueraient les écritures si le rôle DB est toujours 'USER'
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authUser.id)
          .single();
        
        // Si le profil existe mais n'est pas ADMIN, on le force.
        if (profile && profile.role !== 'ADMIN') {
           console.log("Auto-promotion de l'administrateur en base de données...");
           await supabase.from('profiles').update({ role: 'ADMIN' }).eq('id', authUser.id);
        }
      } catch (e) {
        console.warn("Impossible de synchroniser le rôle Admin en DB (RLS peut-être strict)", e);
      }

      fetchData(); // Charge les données globales pour l'admin
      return;
    } 

    // --- UTILISATEUR STANDARD (Moissonneur) ---
    try {
      // Récupérer le profil Supabase pour avoir le Code Moissonneur (MSN)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profile) {
        setCurrentUser({
          id: profile.id,
          email: email,
          name: profile.name,
          role: 'USER', // Force USER même si la DB dit autre chose (sauf si admin email)
          msnCode: profile.msn_code,
          walletBalance: profile.wallet_balance
        });
        setView('USER');
        fetchData();
      } else {
        // Fallback si le profil n'est pas encore créé (Trigger lent ou erreur)
        // On crée un utilisateur temporaire pour ne pas bloquer l'UI
        setCurrentUser({
          id: authUser.id,
          email: email,
          name: authUser.user_metadata?.name || 'Utilisateur',
          role: 'USER',
          msnCode: 'TEMP-' + Math.floor(Math.random() * 10000),
          walletBalance: 0
        });
        setView('USER');
        fetchData();
      }
    } catch (e) {
      console.error("Erreur récupération profil", e);
      // Mode dégradé si erreur DB
      setView('USER');
      fetchData();
    }
  };

  // --- DATA FETCHING ---

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Gateways
      const { data: gatewayData, error: gatewayError } = await supabase
        .from('payment_gateways')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (gatewayError) throw gatewayError;

      // 2. Fetch Orders
      const { data: ordersData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (orderError) throw orderError;

      // Success
      if (gatewayData) setGateways(gatewayData.map(mapGatewayFromDB));
      if (ordersData) setOrders(ordersData.map(mapOrderFromDB));
      setIsDemoMode(false);

    } catch (error: any) {
      console.warn('⚠️ Passage en Mode Démo (Erreur Supabase):', error.message);
      setIsDemoMode(true);
    } finally {
      setIsLoading(false);
    }
  };

  // --- ACTIONS ---

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setView('AUTH');
    setUserTab('FORM');
  };

  const handleCreateOrder = async (orderData: Partial<Order>) => {
    if (!currentUser) return;
    setIsLoading(true);

    const dbPayload = {
      product_name: orderData.productName,
      description: orderData.description,
      price: orderData.price,
      crypto_amount: orderData.cryptoAmount,
      client_name: orderData.clientName,
      client_contact: orderData.clientContact,
      moissonneur_code: currentUser.msnCode,
      client_moissonneur_code: orderData.clientMoissonneurCode,
      agent_code: orderData.agentCode,
      country: orderData.country,
      city: orderData.city,
      neighborhood: orderData.neighborhood,
      delivery_location: orderData.deliveryLocation,
      urgency: orderData.urgency,
      location: orderData.location,
      payment_method_id: orderData.paymentMethodId,
      photo_url: orderData.photoUrl,
      status: OrderStatus.PENDING,
    };

    try {
      if (isDemoMode) {
         // Simulating DB insert in demo mode
         const newOrder = { 
            ...orderData as Order, 
            id: Math.random().toString(36).substr(2,9), 
            createdAt: new Date().toISOString(),
            status: OrderStatus.PENDING,
            moissonneurCode: currentUser.msnCode
         };
         setOrders(prev => [newOrder, ...prev]);
         alert("[MODE DÉMO] Commande créée localement !");
         setUserTab('HISTORY');
      } else {
        const { data, error } = await supabase
            .from('orders')
            .insert([dbPayload])
            .select();

        if (error) throw error;

        if (data) {
            setOrders(prev => [mapOrderFromDB(data[0]), ...prev]);
            alert("Commande transmise avec succès !");
            setUserTab('HISTORY');
        }
      }
    } catch (error: any) {
      console.error('Error creating order:', error);
      alert("Erreur lors de la création de la commande: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    const timestamp = new Date().toISOString();
    let updates: any = { status: status };
    if (status === OrderStatus.APPROVED) updates.approved_at = timestamp;
    else if (status === OrderStatus.REJECTED) updates.rejected_at = timestamp;

    try {
        if (!isDemoMode) {
            const { error } = await supabase.from('orders').update(updates).eq('id', id);
            if (error) throw error;
        }

        setOrders(prev => prev.map(o => {
            if (o.id === id) {
                return { 
                  ...o, 
                  status,
                  approvedAt: status === OrderStatus.APPROVED ? timestamp : o.approvedAt,
                  rejectedAt: status === OrderStatus.REJECTED ? timestamp : o.rejectedAt
                };
            }
            return o;
        }));
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert('Erreur lors de la mise à jour.');
    }
  };

  const handleSaveGatewayToDB = async (gateway: Partial<PaymentGateway>) => {
     if (isDemoMode) {
         let updatedGateways = [...gateways];
         if (gateway.id) {
            updatedGateways = updatedGateways.map(g => g.id === gateway.id ? { ...g, ...gateway } as PaymentGateway : g);
         } else {
            const newG = { ...gateway, id: Math.random().toString(36).substr(2, 5), isActive: true, order: gateways.length } as PaymentGateway;
            updatedGateways.push(newG);
         }
         setGateways(updatedGateways);
         return;
     }

     const payload = {
       name: gateway.name,
       type: gateway.type,
       logo_url: gateway.logoUrl,
       action_url: gateway.actionUrl,
       is_active: gateway.isActive,
       display_order: gateway.order,
       ...(gateway.id && { id: gateway.id })
     };

     const { error } = await supabase.from('payment_gateways').upsert(payload).select();
     if (error) {
       alert("Erreur sauvegarde gateway: " + error.message);
     } else {
       fetchData();
     }
  };

  const handleDeleteGatewayFromDB = async (id: string) => {
    if (isDemoMode) {
        setGateways(prev => prev.filter(g => g.id !== id));
        return;
    }
    const { error } = await supabase.from('payment_gateways').delete().eq('id', id);
    if (error) alert("Erreur suppression gateway");
    else fetchData();
  };


  const handleOrderAnalysis = async (order: Order) => {
      const analysis = await analyzeOrderRisk(order);
      if (!isDemoMode) {
          await supabase.from('orders').update({ ai_analysis: analysis }).eq('id', order.id);
      }
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, aiAnalysis: analysis } : o));
      return analysis;
  };

  // Filter orders for the current user (only show their own orders)
  // Admin sees all orders (handled in the fetch/state, but strictly Admin View uses global list)
  const userOrders = currentUser 
    ? orders.filter(o => o.moissonneurCode === currentUser.msnCode) 
    : [];

  return (
    <div className="min-h-screen bg-[#050508] text-white selection:bg-purple-500 selection:text-white font-sans">
      <NeonBar />
      
      {/* Header */}
      {view !== 'AUTH' && (
        <header className="border-b border-purple-900/30 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3 self-start md:self-auto">
                <div className="p-2 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-lg shadow-lg shadow-purple-500/20">
                <Hexagon className="text-white fill-white/20" />
                </div>
                <div>
                <h1 className="font-display font-bold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">MOISSON MANAGER</h1>
                <div className="flex items-center gap-2">
                    <p className="text-[10px] text-cyan-400 tracking-[0.2em] uppercase">Système Centralisé</p>
                    {isDemoMode && <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-[9px] border border-yellow-500/50 font-bold">MODE DÉMO</span>}
                </div>
                </div>
            </div>

            {currentUser && (
                <div className="flex items-center gap-4 self-end md:self-auto flex-wrap justify-end">
                    {/* --- ADMIN SWITCHER --- */}
                    {currentUser.role === 'ADMIN' && (
                        <div className="flex bg-slate-800 rounded-lg p-1 border border-purple-500/30 mr-4">
                            <button 
                                onClick={() => setView('ADMIN')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all ${view === 'ADMIN' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                            >
                                <LayoutDashboard size={14} /> Admin
                            </button>
                            <button 
                                onClick={() => setView('USER')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all ${view === 'USER' ? 'bg-cyan-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                            >
                                <PlusCircle size={14} /> Mode User
                            </button>
                        </div>
                    )}

                    <div className="hidden md:block text-right">
                        <p className="text-sm font-bold text-white flex items-center justify-end gap-2">
                             {currentUser.name}
                             {currentUser.role === 'ADMIN' && <ShieldCheck size={14} className="text-cyan-400" />}
                        </p>
                        <p className="text-xs text-purple-400 font-mono">{currentUser.msnCode}</p>
                    </div>
                    <button onClick={handleLogout} className="p-2 hover:bg-slate-800 rounded-full text-gray-400 hover:text-red-400 transition-colors" title="Déconnexion">
                        <LogOut size={20} />
                    </button>
                </div>
            )}
            </div>

            {/* User Navigation Tabs (Only for Normal Users OR Admin in User View) */}
            {view === 'USER' && (
            <div className="flex justify-center border-t border-purple-500/10 bg-slate-900/30">
                <div className="flex overflow-x-auto">
                <button 
                    onClick={() => setUserTab('FORM')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-display tracking-wide transition-all whitespace-nowrap ${
                    userTab === 'FORM' 
                        ? 'text-cyan-400 border-b-2 border-cyan-400 bg-purple-500/5' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                >
                    <PlusCircle size={16} /> NOUVELLE COMMANDE
                </button>
                <button 
                    onClick={() => setUserTab('HISTORY')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-display tracking-wide transition-all whitespace-nowrap ${
                    userTab === 'HISTORY' 
                        ? 'text-cyan-400 border-b-2 border-cyan-400 bg-purple-500/5' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                >
                    <History size={16} /> HISTORIQUE
                </button>
                <a 
                    href="https://academiedesmoissonneur.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 text-sm font-display tracking-wide transition-all whitespace-nowrap text-gray-400 hover:text-white hover:bg-white/5"
                >
                    <GraduationCap size={16} /> MOISSONNEUR
                </a>
                </div>
            </div>
            )}
        </header>
      )}

      {/* Main Content */}
      <main className="relative z-10">
        {/* Background Ambient Glow */}
        <div className="fixed top-0 left-0 w-full h-screen overflow-hidden -z-10 pointer-events-none">
           <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px] animate-pulse-slow" />
           <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-900/10 rounded-full blur-[120px]" />
        </div>
        
        {isLoading && (
            <div className="fixed top-0 left-0 w-full h-1 bg-purple-900/20 z-50">
                <div className="h-full bg-cyan-400 animate-glow-bar w-1/3 mx-auto"></div>
            </div>
        )}

        {view === 'AUTH' && (
           <AuthForm onSuccess={() => {
              // Une fois connecté, le useEffect relancera handleUserSession
              console.log("Auth success");
           }} /> 
        )}

        {view === 'USER' && currentUser && (
          <>
            {userTab === 'FORM' ? (
              <OrderForm 
                userCode={currentUser.msnCode}
                paymentGateways={gateways}
                onSubmit={handleCreateOrder}
              />
            ) : (
              <OrderHistory orders={userOrders} />
            )}
          </>
        )}

        {view === 'ADMIN' && (
          <AdminDashboard 
            orders={orders}
            gateways={gateways}
            onUpdateOrderStatus={updateOrderStatus}
            onUpdateGateways={setGateways}
            onAnalyzeOrder={handleOrderAnalysis}
             // @ts-ignore
            onSaveGateway={handleSaveGatewayToDB}
             // @ts-ignore
            onDeleteGateway={handleDeleteGatewayFromDB}
          />
        )}
      </main>
    </div>
  );
};

export default App;
