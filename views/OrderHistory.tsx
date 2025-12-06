import React, { useState } from 'react';
import { GlassCard, Badge, NeonInput, NeonSelect, SecondaryButton } from '../components/FuturisticUI';
import { Order, OrderStatus } from '../types';
import { Package, Calendar, Clock, CheckCircle, XCircle, Search, Filter, X, MapPin, User, Phone, Navigation, Zap, AlertTriangle } from 'lucide-react';

interface OrderHistoryProps {
  orders: Order[];
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ orders }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // --- Filtering Logic ---
  const filteredOrders = orders.filter(order => {
    // 1. Search Term (Product, Client, ID)
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      order.productName.toLowerCase().includes(searchLower) ||
      order.clientName.toLowerCase().includes(searchLower) ||
      order.id.toLowerCase().includes(searchLower);

    // 2. Status
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;

    // 3. Date Range
    let matchesDate = true;
    const orderDate = new Date(order.createdAt);
    
    if (startDate) {
      const start = new Date(startDate);
      // Reset hours to ensure strict comparison from start of day
      start.setHours(0, 0, 0, 0);
      matchesDate = matchesDate && orderDate >= start;
    }
    
    if (endDate) {
      const end = new Date(endDate);
      // Set to end of the selected day
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && orderDate <= end;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Sort by newest first
  const sortedOrders = [...filteredOrders].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setStartDate('');
    setEndDate('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.APPROVED: return <CheckCircle size={16} className="text-cyan-400" />;
      case OrderStatus.REJECTED: return <XCircle size={16} className="text-red-400" />;
      case OrderStatus.DELIVERED: return <Package size={16} className="text-green-400" />;
      default: return <Clock size={16} className="text-purple-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-white mb-2">
          HISTORIQUE DES MOISSONS
        </h2>
        <p className="text-gray-400">Suivi de vos transactions et livraisons.</p>
      </div>

      {/* --- Search & Filters Header --- */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 sticky top-[80px] z-30 bg-[#050508]/80 backdrop-blur-md p-4 -mx-4 md:mx-0 md:p-0 md:bg-transparent md:static rounded-xl">
         <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Rechercher (Client, Produit, ID)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/60 border border-purple-500/30 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(34,211,238,0.2)] transition-all font-sans placeholder-gray-600"
            />
         </div>
         <SecondaryButton 
            onClick={() => setShowFilters(!showFilters)} 
            icon={<Filter size={18} />}
            className={`${showFilters ? 'bg-purple-900/40 border-purple-400 text-cyan-400' : ''}`}
         >
            Filtres
         </SecondaryButton>
      </div>

      {/* --- Advanced Filters Panel --- */}
      {showFilters && (
        <GlassCard className="mb-8 animate-fade-in border-cyan-500/20">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <NeonSelect 
                label="Statut" 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">Tous les statuts</option>
                {Object.values(OrderStatus).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </NeonSelect>

              <NeonInput 
                type="date" 
                label="Date Début" 
                value={startDate} 
                max={endDate} // Constraint: Start date cannot be after end date
                onChange={(e) => setStartDate(e.target.value)}
                style={{colorScheme: 'dark'}}
              />

              <NeonInput 
                type="date" 
                label="Date Fin" 
                value={endDate}
                min={startDate} // Constraint: End date cannot be before start date
                onChange={(e) => setEndDate(e.target.value)}
                style={{colorScheme: 'dark'}}
              />
           </div>
           
           <div className="flex justify-between items-center mt-2 pt-4 border-t border-purple-500/20">
             <span className="text-xs text-gray-500">
               {sortedOrders.length} résultat{sortedOrders.length > 1 ? 's' : ''} trouvé{sortedOrders.length > 1 ? 's' : ''}
             </span>
             <button 
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-white transition-colors px-3 py-1 rounded hover:bg-red-500/20"
             >
                <X size={14} /> Réinitialiser
             </button>
           </div>
        </GlassCard>
      )}

      {/* --- Orders List --- */}
      {sortedOrders.length === 0 ? (
        <GlassCard className="text-center py-16 flex flex-col items-center">
          <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 border border-purple-500/30">
            <Search size={32} className="text-purple-400" />
          </div>
          <h3 className="text-xl text-white font-bold mb-2">Aucune commande trouvée</h3>
          <p className="text-gray-400">Essayez de modifier vos filtres de recherche.</p>
          <button onClick={clearFilters} className="mt-4 text-cyan-400 hover:underline text-sm">
             Tout effacer
          </button>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {sortedOrders.map((order) => (
            <GlassCard 
              key={order.id} 
              onClick={() => setSelectedOrder(order)}
              className="group hover:border-cyan-500/30 transition-all duration-300 cursor-pointer hover:bg-slate-900/40 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between relative z-10">
                
                {/* Left: Image & Main Info */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="relative shrink-0">
                    {order.photoUrl ? (
                      <img src={order.photoUrl} alt={order.productName} className="w-16 h-16 object-cover rounded-lg border border-purple-500/20" />
                    ) : (
                      <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center border border-purple-500/20">
                        <Package className="text-purple-400 opacity-50" />
                      </div>
                    )}
                    <div className="absolute -top-2 -left-2 bg-slate-900 border border-purple-500/50 rounded-full p-1 shadow-lg">
                       {getStatusIcon(order.status)}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                      {order.productName}
                    </h3>
                    <p className="text-sm text-gray-400 flex items-center gap-2">
                      <span className="font-mono text-purple-300">#{order.id.slice(0, 6)}</span>
                      <span>•</span>
                      <span>{order.clientName}</span>
                    </p>
                  </div>
                </div>

                {/* Middle: Date & Location */}
                <div className="hidden md:block text-right">
                  <div className="flex items-center justify-end gap-2 text-gray-400 text-sm mb-1">
                    <Calendar size={14} /> {formatDate(order.createdAt)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {order.city} - {order.neighborhood}
                  </div>
                </div>

                {/* Right: Price & Status */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto mt-2 md:mt-0 gap-2">
                  <span className="text-xl font-display font-bold text-white">
                    {order.price.toLocaleString()} <span className="text-sm text-purple-400">FCFA</span>
                  </span>
                  
                  <div className="flex gap-2">
                    <Badge color={
                        order.status === OrderStatus.APPROVED ? 'cyan' : 
                        order.status === OrderStatus.REJECTED ? 'red' : 
                        'purple'
                    }>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Mobile Only Date */}
              <div className="md:hidden mt-4 pt-4 border-t border-purple-500/10 flex justify-between items-center text-xs text-gray-500">
                 <span>{formatDate(order.createdAt)}</span>
                 <span>{order.city}</span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* --- Detail Modal --- */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={() => setSelectedOrder(null)}>
          <GlassCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border-cyan-500/30 shadow-[0_0_50px_rgba(34,211,238,0.15)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6 sticky top-0 bg-[#1a1a2e]/95 backdrop-blur z-10 pb-4 border-b border-purple-500/20 -mx-2 px-2">
               <div>
                  <h2 className="text-2xl font-display font-bold text-white">Détails de la commande</h2>
                  <p className="text-cyan-400 font-mono text-sm">Ref: {selectedOrder.id}</p>
               </div>
               <button 
                onClick={() => setSelectedOrder(null)}
                className="p-2 bg-slate-800 rounded-full hover:bg-red-500/20 hover:text-red-400 transition-colors"
               >
                 <X size={20} />
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Column 1: Product & Status */}
               <div className="space-y-6">
                  <div className="relative rounded-xl overflow-hidden border border-purple-500/30 aspect-square md:aspect-video bg-slate-900">
                     {selectedOrder.photoUrl ? (
                        <img src={selectedOrder.photoUrl} alt="Product" className="w-full h-full object-cover" />
                     ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                           <Package size={48} className="mb-2 opacity-50" />
                           <span className="text-sm">Aucune photo</span>
                        </div>
                     )}
                     <div className="absolute top-2 left-2">
                        <Badge color={selectedOrder.status === OrderStatus.APPROVED ? 'cyan' : selectedOrder.status === OrderStatus.REJECTED ? 'red' : 'purple'}>
                           {selectedOrder.status}
                        </Badge>
                     </div>
                  </div>

                  <div className="bg-slate-900/40 p-4 rounded-lg border border-purple-500/20">
                     <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-1">Produit</h3>
                     <p className="text-xl font-bold text-white mb-2">{selectedOrder.productName}</p>
                     
                     <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-1 mt-4">Prix</h3>
                     <p className="text-2xl font-display font-bold text-cyan-400">{selectedOrder.price.toLocaleString()} FCFA</p>
                  </div>
                  
                  {selectedOrder.aiAnalysis && (
                    <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 p-4 rounded-lg border border-purple-500/30 relative overflow-hidden">
                       <Zap className="absolute top-2 right-2 text-yellow-400 opacity-50" size={16} />
                       <h4 className="text-purple-300 font-bold text-xs uppercase mb-2">Analyse IA</h4>
                       <p className="text-sm text-gray-300 italic">"{selectedOrder.aiAnalysis}"</p>
                    </div>
                  )}
               </div>

               {/* Column 2: Details */}
               <div className="space-y-6">
                  <div className="bg-slate-900/40 p-4 rounded-lg border border-purple-500/20">
                     <h4 className="text-cyan-400 font-display mb-4 border-b border-purple-500/20 pb-2">Description</h4>
                     <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {selectedOrder.description || "Aucune description fournie."}
                     </p>
                  </div>

                  <div className="bg-slate-900/40 p-4 rounded-lg border border-purple-500/20">
                     <h4 className="text-cyan-400 font-display mb-4 border-b border-purple-500/20 pb-2">Client</h4>
                     <div className="space-y-3">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-slate-800 rounded-lg text-purple-400"><User size={16} /></div>
                           <div>
                              <p className="text-xs text-gray-500">Nom complet</p>
                              <p className="text-white font-medium">{selectedOrder.clientName}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-slate-800 rounded-lg text-purple-400"><Phone size={16} /></div>
                           <div>
                              <p className="text-xs text-gray-500">Contact</p>
                              <p className="text-white font-medium">{selectedOrder.clientContact}</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="bg-slate-900/40 p-4 rounded-lg border border-purple-500/20">
                     <h4 className="text-cyan-400 font-display mb-4 border-b border-purple-500/20 pb-2">Livraison</h4>
                     <div className="space-y-3">
                        <div className="flex items-start gap-3">
                           <div className="p-2 bg-slate-800 rounded-lg text-purple-400 mt-1"><MapPin size={16} /></div>
                           <div>
                              <p className="text-xs text-gray-500">Adresse</p>
                              <p className="text-white font-medium">{selectedOrder.city}, {selectedOrder.neighborhood}</p>
                              <p className="text-sm text-gray-400 mt-1">{selectedOrder.deliveryLocation}</p>
                           </div>
                        </div>
                        
                        <div className="flex items-center gap-3 mt-4">
                           <div className="p-2 bg-slate-800 rounded-lg text-red-400"><AlertTriangle size={16} /></div>
                           <div>
                              <p className="text-xs text-gray-500">Urgence</p>
                              <span className={`text-sm font-bold ${selectedOrder.urgency === 'Très Urgent' ? 'text-red-500' : selectedOrder.urgency === 'Urgent' ? 'text-orange-400' : 'text-green-400'}`}>
                                 {selectedOrder.urgency}
                              </span>
                           </div>
                        </div>

                        {selectedOrder.location && (
                           <a 
                             href={`https://maps.google.com/?q=${selectedOrder.location.latitude},${selectedOrder.location.longitude}`} 
                             target="_blank" 
                             rel="noreferrer"
                             className="block mt-4 w-full text-center py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg text-sm font-medium transition-colors border border-cyan-500/20 hover:border-cyan-500/50 flex items-center justify-center gap-2"
                           >
                              <Navigation size={16} /> Ouvrir GPS
                           </a>
                        )}
                     </div>
                  </div>
               </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;