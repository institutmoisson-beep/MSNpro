
import React, { useState } from 'react';
import { GlassCard, Badge, SecondaryButton, NeonInput, PrimaryButton, NeonSelect } from '../components/FuturisticUI';
import { Order, OrderStatus, PaymentGateway, PaymentMethodType } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Settings, Package, Users, DollarSign, Trash2, Eye, Check, X, ArrowDownToLine, Zap, Navigation, Image as ImageIcon, Plus, Link as LinkIcon, Save, AlertTriangle, Search, Clock, Calendar } from 'lucide-react';

interface AdminDashboardProps {
  orders: Order[];
  gateways: PaymentGateway[];
  onUpdateOrderStatus: (id: string, status: OrderStatus) => void;
  onUpdateGateways: (gateways: PaymentGateway[]) => void;
  onAnalyzeOrder: (order: Order) => Promise<string>;
  // New props for DB persistence
  onSaveGateway?: (gateway: Partial<PaymentGateway>) => void;
  onDeleteGateway?: (id: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ orders, gateways, onUpdateOrderStatus, onUpdateGateways, onAnalyzeOrder, onSaveGateway, onDeleteGateway }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'settings'>('overview');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Settings State
  const [editingGateway, setEditingGateway] = useState<Partial<PaymentGateway> | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // --- Filtering ---
  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Statistics ---
  const stats = {
    totalOrders: orders.length,
    pending: orders.filter(o => o.status === OrderStatus.PENDING).length,
    revenue: orders.reduce((acc, curr) => acc + curr.price, 0),
    agents: new Set(orders.map(o => o.moissonneurCode)).size
  };

  const chartData = [
    { name: 'Lun', orders: 4 },
    { name: 'Mar', orders: 7 },
    { name: 'Mer', orders: 2 },
    { name: 'Jeu', orders: 9 },
    { name: 'Ven', orders: 5 },
    { name: 'Sam', orders: 12 },
    { name: 'Dim', orders: 8 },
  ]; // Mock data for demo

  const statusData = [
    { name: 'En attente', value: stats.pending, color: '#a855f7' },
    { name: 'Validées', value: orders.filter(o => o.status === OrderStatus.APPROVED).length, color: '#22d3ee' },
    { name: 'Rejetées', value: orders.filter(o => o.status === OrderStatus.REJECTED).length, color: '#ef4444' },
  ];

  // --- Handlers ---
  const downloadOrders = () => {
    const json = JSON.stringify(orders, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString()}.json`;
    a.click();
  };

  const handleGatewayToggle = (id: string) => {
    // For toggles, we can construct the object and call save
    const gateway = gateways.find(g => g.id === id);
    if (gateway && onSaveGateway) {
        onSaveGateway({ ...gateway, isActive: !gateway.isActive });
    } else {
        // Fallback to local update if no DB handler
        const updated = gateways.map(g => g.id === id ? { ...g, isActive: !g.isActive } : g);
        onUpdateGateways(updated);
    }
  };
  
  const handleAnalyze = async (order: Order) => {
      setAnalyzingId(order.id);
      await onAnalyzeOrder(order);
      setAnalyzingId(null);
  };

  const handleSaveGateway = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGateway || !editingGateway.name) return;

    if (onSaveGateway) {
        // DB Mode
        onSaveGateway(editingGateway);
    } else {
        // Local Mode
        let updatedGateways = [...gateways];
        if (editingGateway.id) {
          updatedGateways = updatedGateways.map(g => 
            g.id === editingGateway.id ? { ...g, ...editingGateway } as PaymentGateway : g
          );
        } else {
          const newGateway: PaymentGateway = {
            id: Math.random().toString(36).substr(2, 9),
            name: editingGateway.name,
            type: editingGateway.type || PaymentMethodType.MOBILE_MONEY,
            logoUrl: editingGateway.logoUrl,
            actionUrl: editingGateway.actionUrl,
            isActive: true,
            order: gateways.length + 1
          };
          updatedGateways.push(newGateway);
        }
        onUpdateGateways(updatedGateways);
    }
    setEditingGateway(null);
  };

  const executeDeleteGateway = () => {
    if (deleteConfirmId) {
      if (onDeleteGateway) {
          onDeleteGateway(deleteConfirmId);
      } else {
          const updated = gateways.filter(g => g.id !== deleteConfirmId);
          onUpdateGateways(updated);
      }
      setEditingGateway(null);
      setDeleteConfirmId(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
  };

  // --- Views ---

  const Overview = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Commandes Totales", value: stats.totalOrders, icon: <Package className="text-purple-400" />, color: "border-purple-500/50" },
          { title: "En Attente", value: stats.pending, icon: <Zap className="text-yellow-400" />, color: "border-yellow-500/50" },
          { title: "Agents Actifs", value: stats.agents, icon: <Users className="text-cyan-400" />, color: "border-cyan-500/50" },
          { title: "Volume (FCFA)", value: stats.revenue.toLocaleString(), icon: <DollarSign className="text-green-400" />, color: "border-green-500/50" },
        ].map((stat, idx) => (
          <GlassCard key={idx} className={`flex items-center gap-4 ${stat.color}`}>
            <div className="p-3 bg-slate-900 rounded-full border border-gray-700">{stat.icon}</div>
            <div>
              <p className="text-gray-400 text-sm">{stat.title}</p>
              <h2 className="text-2xl font-display font-bold text-white">{stat.value}</h2>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <h3 className="text-lg font-display text-white mb-4">Commandes Hebdomadaires</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={{ backgroundColor: '#0f0f1a', border: '1px solid #7c3aed' }} />
                <Bar dataKey="orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-lg font-display text-white mb-4">Distribution des Statuts</h3>
          <div className="h-64 w-full flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-xs mt-2">
             {statusData.map((d, i) => (
               <div key={i} className="flex items-center gap-1">
                 <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                 <span className="text-gray-300">{d.name}</span>
               </div>
             ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );

  const OrdersView = () => (
    <div className="animate-fade-in space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
            <h2 className="text-2xl font-display text-cyan-400">Gestion des Commandes</h2>
            {searchTerm && (
                <span className="text-xs px-2 py-1 rounded bg-purple-900/50 text-purple-300 border border-purple-500/30">
                    Filtre: "{searchTerm}" ({filteredOrders.length})
                </span>
            )}
        </div>
        <SecondaryButton onClick={downloadOrders} icon={<ArrowDownToLine size={16} />}>Exporter CSV</SecondaryButton>
      </div>
      
      <GlassCard noPadding className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-purple-900/20 text-purple-200 uppercase font-sans text-xs">
            <tr>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Image</th>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Produit</th>
              <th className="px-6 py-4">Prix</th>
              <th className="px-6 py-4">Statut</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-500/10">
            {filteredOrders.map(order => (
              <tr key={order.id} className="hover:bg-purple-500/5 transition-colors">
                <td className="px-6 py-4 font-mono text-xs">{order.id.slice(0, 8)}...</td>
                <td className="px-6 py-4">
                  {order.photoUrl ? (
                    <img src={order.photoUrl} alt="Produit" className="w-10 h-10 object-cover rounded-md border border-purple-500/30" />
                  ) : (
                    <div className="w-10 h-10 bg-slate-800/50 rounded-md flex items-center justify-center border border-purple-500/10">
                      <ImageIcon size={16} className="text-gray-600" />
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                    <div className="font-bold text-white">{order.clientName}</div>
                    <div className="text-xs text-gray-500">{order.clientContact}</div>
                </td>
                <td className="px-6 py-4">{order.productName}</td>
                <td className="px-6 py-4 text-cyan-400 font-bold">{order.price.toLocaleString()} FCFA</td>
                <td className="px-6 py-4">
                  <Badge color={order.status === OrderStatus.APPROVED ? 'cyan' : order.status === OrderStatus.REJECTED ? 'red' : 'purple'}>
                    {order.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 flex justify-center gap-2">
                  <button onClick={() => setSelectedOrder(order)} className="p-2 hover:bg-purple-500/20 rounded-lg text-purple-300 transition-colors">
                    <Eye size={18} />
                  </button>
                  {order.status === OrderStatus.PENDING && (
                    <>
                      <button onClick={() => onUpdateOrderStatus(order.id, OrderStatus.APPROVED)} className="p-2 hover:bg-green-500/20 rounded-lg text-green-400 transition-colors">
                        <Check size={18} />
                      </button>
                      <button onClick={() => onUpdateOrderStatus(order.id, OrderStatus.REJECTED)} className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors">
                        <X size={18} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
                <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                        {searchTerm ? 'Aucune commande ne correspond à votre recherche.' : 'Aucune commande trouvée.'}
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );

  const SettingsView = () => (
    <div className="animate-fade-in space-y-6">
       <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-display text-cyan-400">Configuration Paiement</h2>
          <PrimaryButton onClick={() => setEditingGateway({} as any)} icon={<Plus size={18} />}>
            Ajouter un moyen
          </PrimaryButton>
       </div>
       
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gateways.map(gw => (
              <GlassCard key={gw.id} className="flex justify-between items-center group relative overflow-hidden">
                  <div className="flex items-center gap-4 z-10">
                     {gw.logoUrl ? <img src={gw.logoUrl} className="w-12 h-12 object-contain bg-white/5 p-1 rounded-lg" alt="" /> : <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center font-bold text-purple-500 text-xl">{gw.name[0]}</div>}
                     <div>
                         <h4 className="font-bold text-white text-lg">{gw.name}</h4>
                         <p className="text-xs text-gray-400 flex items-center gap-1">
                           {gw.type}
                           {gw.actionUrl && <LinkIcon size={10} className="text-cyan-500" />}
                         </p>
                     </div>
                  </div>
                  <div className="flex items-center gap-2 z-10">
                      <div onClick={() => handleGatewayToggle(gw.id)} className={`cursor-pointer text-[10px] font-bold px-2 py-1 rounded border ${gw.isActive ? 'bg-green-900/30 text-green-400 border-green-500/50 hover:bg-green-900/50' : 'bg-red-900/30 text-red-400 border-red-500/50 hover:bg-red-900/50'} transition-colors`}>
                          {gw.isActive ? 'ACTIF' : 'INACTIF'}
                      </div>
                      <button 
                        onClick={() => setEditingGateway(gw)}
                        className="p-2 bg-slate-800/50 border border-purple-500/30 rounded hover:bg-purple-600 hover:text-white text-purple-300 transition-all hover:scale-110"
                      >
                          <Settings size={18} />
                      </button>
                  </div>
                  {/* Decorative glow */}
                  <div className={`absolute -right-10 -bottom-10 w-32 h-32 rounded-full blur-[40px] opacity-20 ${gw.isActive ? 'bg-cyan-500' : 'bg-red-500'}`} />
              </GlassCard>
          ))}
       </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Sticky Global Search Bar */}
      <div className="sticky top-[80px] z-30 mb-6 bg-[#050508]/80 backdrop-blur-md py-4 -mx-4 px-4 md:rounded-xl md:border md:border-purple-500/20 shadow-lg shadow-purple-900/10 transition-all border-b border-purple-500/20 md:mx-0 md:px-0">
          <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" size={20} />
              <input 
                  type="text" 
                  placeholder="Rechercher globalement (ID, Client, Produit)..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900/60 border border-purple-500/30 rounded-full pl-12 pr-4 py-3 text-white focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all font-sans placeholder-gray-500"
              />
          </div>
      </div>

      {/* Admin Nav */}
      <div className="flex overflow-x-auto gap-4 mb-8 pb-2 border-b border-purple-500/20">
        {[
            { id: 'overview', label: 'Tableau de bord', icon: <Package size={18} /> },
            { id: 'orders', label: 'Commandes', icon: <Users size={18} /> },
            { id: 'settings', label: 'Configuration', icon: <Settings size={18} /> },
        ].map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-t-lg transition-all ${activeTab === tab.id ? 'bg-purple-600/20 text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'}`}
            >
                {tab.icon}
                <span className="font-display font-medium whitespace-nowrap">{tab.label}</span>
            </button>
        ))}
      </div>

      {activeTab === 'overview' && <Overview />}
      {activeTab === 'orders' && <OrdersView />}
      {activeTab === 'settings' && <SettingsView />}

      {/* Order Detail Modal */}
      {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
              <GlassCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border-purple-500/50 shadow-[0_0_50px_rgba(124,58,237,0.3)]">
                  <div className="flex justify-between items-start mb-6">
                      <h2 className="text-2xl font-display text-white">Détails Commande <span className="text-purple-400">#{selectedOrder.id.slice(0,6)}</span></h2>
                      <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-white"><X size={24} /></button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          {selectedOrder.photoUrl && (
                              <img src={selectedOrder.photoUrl} alt="Produit" className="w-full h-48 object-cover rounded-lg border border-purple-500/30 mb-4" />
                          )}
                           <h3 className="text-cyan-400 font-bold mb-1">Produit</h3>
                           <p className="text-white text-lg mb-2">{selectedOrder.productName}</p>
                           <p className="text-gray-400 text-sm mb-4">{selectedOrder.description}</p>
                           
                           <h3 className="text-cyan-400 font-bold mb-1">Prix</h3>
                           <p className="text-white text-xl font-mono">{selectedOrder.price.toLocaleString()} FCFA</p>
                      </div>
                      <div className="space-y-4">
                          {/* Approval/Rejection Timestamps Display */}
                          {(selectedOrder.approvedAt || selectedOrder.rejectedAt) && (
                              <div className={`p-3 rounded-lg border ${selectedOrder.status === OrderStatus.APPROVED ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
                                  <div className="flex items-center gap-2 mb-1">
                                      <Calendar size={14} className={selectedOrder.status === OrderStatus.APPROVED ? 'text-green-400' : 'text-red-400'} />
                                      <span className="text-xs uppercase font-bold text-gray-300">
                                          {selectedOrder.status === OrderStatus.APPROVED ? 'Date d\'approbation' : 'Date de rejet'}
                                      </span>
                                  </div>
                                  <p className="text-sm text-white font-mono pl-6">
                                      {formatDate(selectedOrder.status === OrderStatus.APPROVED ? selectedOrder.approvedAt! : selectedOrder.rejectedAt!)}
                                  </p>
                              </div>
                          )}

                          <div className="bg-slate-900/50 p-4 rounded-lg">
                              <h4 className="text-purple-300 text-sm uppercase tracking-wider mb-2">Client</h4>
                              <p className="text-white font-bold">{selectedOrder.clientName}</p>
                              <p className="text-gray-400">{selectedOrder.clientContact}</p>
                          </div>
                          
                          <div className="bg-slate-900/50 p-4 rounded-lg">
                              <h4 className="text-purple-300 text-sm uppercase tracking-wider mb-2">Livraison</h4>
                              <p className="text-white">{selectedOrder.city}, {selectedOrder.neighborhood}</p>
                              <p className="text-gray-400 text-sm">{selectedOrder.deliveryLocation}</p>
                              <Badge color="red" >{selectedOrder.urgency}</Badge>
                              {selectedOrder.location && (
                                  <a href={`https://maps.google.com/?q=${selectedOrder.location.latitude},${selectedOrder.location.longitude}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-cyan-400 text-xs mt-2 hover:underline">
                                      <Navigation size={12} /> Voir sur la carte
                                  </a>
                              )}
                          </div>

                          <div className="bg-slate-900/50 p-4 rounded-lg border border-purple-500/20">
                             <div className="flex justify-between items-center mb-2">
                                <h4 className="text-purple-300 text-sm uppercase tracking-wider">Analyse IA (Gemini)</h4>
                                <Zap size={14} className="text-yellow-400" />
                             </div>
                             {selectedOrder.aiAnalysis ? (
                                 <p className="text-xs text-gray-300 italic">"{selectedOrder.aiAnalysis}"</p>
                             ) : (
                                 <button 
                                    onClick={() => handleAnalyze(selectedOrder)}
                                    disabled={analyzingId === selectedOrder.id}
                                    className="text-xs text-cyan-400 hover:text-white underline"
                                 >
                                     {analyzingId === selectedOrder.id ? "Analyse en cours..." : "Lancer l'analyse"}
                                 </button>
                             )}
                          </div>
                      </div>
                  </div>

                  <div className="mt-8 flex justify-end gap-4 border-t border-purple-500/20 pt-4">
                      {selectedOrder.status === OrderStatus.PENDING && (
                          <>
                            <SecondaryButton onClick={() => { onUpdateOrderStatus(selectedOrder.id, OrderStatus.REJECTED); setSelectedOrder(null); }} className="border-red-500/50 text-red-400 hover:bg-red-900/20">Rejeter</SecondaryButton>
                            <PrimaryButton onClick={() => { onUpdateOrderStatus(selectedOrder.id, OrderStatus.APPROVED); setSelectedOrder(null); }}>Approuver</PrimaryButton>
                          </>
                      )}
                      {selectedOrder.status !== OrderStatus.PENDING && (
                           <span className="text-gray-500 italic flex items-center">Commande traitée</span>
                      )}
                  </div>
              </GlassCard>
          </div>
      )}

      {/* Edit/Add Gateway Modal */}
      {editingGateway && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
           <GlassCard className="w-full max-w-lg border-cyan-500/30 shadow-[0_0_40px_rgba(34,211,238,0.2)]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-display font-bold text-white">
                  {editingGateway.id ? 'Modifier le service' : 'Ajouter un service'}
                </h3>
                <button onClick={() => setEditingGateway(null)} className="text-gray-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSaveGateway} className="space-y-4">
                  <NeonInput 
                    label="Nom du service" 
                    placeholder="Ex: Orange Money CI" 
                    value={editingGateway.name || ''} 
                    onChange={e => setEditingGateway({...editingGateway, name: e.target.value})}
                    required
                  />
                  
                  <NeonSelect 
                    label="Type de paiement"
                    value={editingGateway.type || PaymentMethodType.MOBILE_MONEY}
                    onChange={e => setEditingGateway({...editingGateway, type: e.target.value as PaymentMethodType})}
                  >
                     {Object.values(PaymentMethodType).map(t => (
                       <option key={t} value={t}>{t}</option>
                     ))}
                  </NeonSelect>

                  <div className="flex gap-4 items-start">
                     <div className="flex-1">
                        <NeonInput 
                          label="URL du Logo" 
                          placeholder="https://..." 
                          value={editingGateway.logoUrl || ''} 
                          onChange={e => setEditingGateway({...editingGateway, logoUrl: e.target.value})}
                        />
                     </div>
                     {editingGateway.logoUrl && (
                       <div className="mt-6 w-14 h-14 bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden border border-purple-500/30 shrink-0">
                          <img src={editingGateway.logoUrl} alt="Preview" className="w-full h-full object-contain" />
                       </div>
                     )}
                  </div>

                  <NeonInput 
                    label="Lien d'action / API" 
                    placeholder="URL de redirection ou code USSD" 
                    value={editingGateway.actionUrl || ''} 
                    onChange={e => setEditingGateway({...editingGateway, actionUrl: e.target.value})}
                  />

                  <div className="flex justify-between items-center pt-6 mt-4 border-t border-purple-500/20">
                     {editingGateway.id ? (
                       <button 
                         type="button" 
                         onClick={() => setDeleteConfirmId(editingGateway.id!)}
                         className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm transition-colors"
                       >
                         <Trash2 size={16} /> Supprimer
                       </button>
                     ) : <div />}
                     
                     <div className="flex gap-3">
                       <SecondaryButton type="button" onClick={() => setEditingGateway(null)}>Annuler</SecondaryButton>
                       <PrimaryButton type="submit" icon={<Save size={18} />}>Enregistrer</PrimaryButton>
                     </div>
                  </div>
              </form>
           </GlassCard>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
              <GlassCard className="w-full max-w-sm border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.2)] text-center">
                  <div className="w-16 h-16 rounded-full bg-red-900/30 text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                      <AlertTriangle size={32} />
                  </div>
                  <h3 className="text-xl font-display font-bold text-white mb-2">Confirmation</h3>
                  <p className="text-gray-300 mb-6">Êtes-vous sûr de vouloir supprimer ce moyen de paiement ? Cette action est irréversible.</p>
                  
                  <div className="flex gap-3 justify-center">
                      <SecondaryButton onClick={() => setDeleteConfirmId(null)} className="w-full">
                          Annuler
                      </SecondaryButton>
                      <button 
                          onClick={executeDeleteGateway}
                          className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                      >
                          Supprimer
                      </button>
                  </div>
              </GlassCard>
          </div>
      )}
    </div>
  );
};

export default AdminDashboard;
