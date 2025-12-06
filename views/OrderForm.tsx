
import React, { useState, useEffect, useRef } from 'react';
import { GlassCard, NeonInput, NeonSelect, NeonTextArea, PrimaryButton, SecondaryButton } from '../components/FuturisticUI';
import { PaymentGateway, UrgencyLevel, Order, OrderStatus, PaymentMethodType } from '../types';
import { MapPin, Upload, Share2, CheckCircle, Navigation, Copy, X, AlertCircle, AlertTriangle, Crosshair, Users } from 'lucide-react';

// Déclaration pour Leaflet chargé via CDN
declare const L: any;

interface OrderFormProps {
  userCode: string;
  paymentGateways: PaymentGateway[];
  onSubmit: (order: Partial<Order>) => void;
}

const OrderForm: React.FC<OrderFormProps> = ({ userCode, paymentGateways, onSubmit }) => {
  const [formData, setFormData] = useState({
    productName: '',
    description: '',
    price: '',
    cryptoAmount: '', // New state for crypto amount
    clientName: '',
    clientContact: '',
    clientMoissonneurCode: '',
    agentCode: '',
    country: 'Côte d\'Ivoire',
    city: '',
    neighborhood: '',
    deliveryLocation: '',
    urgency: UrgencyLevel.LOW,
    paymentMethodId: ''
  });

  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  
  // Ref pour la carte
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const activeGateways = paymentGateways.filter(g => g.isActive).sort((a, b) => a.order - b.order);
  
  // Determine if selected payment method is Crypto
  const selectedGateway = activeGateways.find(g => g.id === formData.paymentMethodId);
  const isCryptoPayment = selectedGateway?.type === PaymentMethodType.CRYPTO;

  // Effet pour initialiser et mettre à jour la carte
  useEffect(() => {
    if (location && mapRef.current && typeof L !== 'undefined') {
      // Si la carte n'existe pas encore, on la crée
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapRef.current).setView([location.lat, location.lng], 15);

        // Tuiles sombres (CartoDB Dark Matter) pour le style futuriste
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20
        }).addTo(mapInstanceRef.current);
      } else {
        // Sinon on met à jour la vue
        mapInstanceRef.current.setView([location.lat, location.lng], 15);
      }

      // Nettoyer les marqueurs existants (sauf si on veut garder l'historique, ici on reset)
      mapInstanceRef.current.eachLayer((layer: any) => {
        if (layer instanceof L.Marker || layer instanceof L.Circle) {
           mapInstanceRef.current.removeLayer(layer);
        }
      });

      // Icône Utilisateur (Cyan)
      const userIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #00f3ff; width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 10px #00f3ff; border: 2px solid white;"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      });

      // Cercle de précision
      L.circle([location.lat, location.lng], {
        color: '#00f3ff',
        fillColor: '#00f3ff',
        fillOpacity: 0.1,
        radius: 100 // 100m radius representation
      }).addTo(mapInstanceRef.current);

      // Marqueur Utilisateur
      L.marker([location.lat, location.lng], { icon: userIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup("<b>Votre Position</b><br>Zone de livraison")
        .openPopup();

      // --- SIMULATION MOISSONNEURS PROCHES ---
      // Générer 2-3 agents aléatoires autour
      const nearbyAgents = [
        { lat: location.lat + 0.002, lng: location.lng + 0.001, name: 'MSN-884' },
        { lat: location.lat - 0.0015, lng: location.lng - 0.002, name: 'MSN-102' },
        { lat: location.lat + 0.0005, lng: location.lng - 0.003, name: 'MSN-339' }
      ];

      const agentIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #b026ff; width: 10px; height: 10px; border-radius: 50%; box-shadow: 0 0 8px #b026ff;"></div>`,
        iconSize: [10, 10],
        iconAnchor: [5, 5]
      });

      nearbyAgents.forEach(agent => {
         L.marker([agent.lat, agent.lng], { icon: agentIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`<b>Moissonneur ${agent.name}</b><br>À proximité`);
      });

      // Ajuster la carte après le rendu
      setTimeout(() => {
        mapInstanceRef.current.invalidateSize();
      }, 100);
    }
    
    // Cleanup on unmount (optionnel, souvent mieux de garder l'instance si on revient)
    // return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, [location]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user selects a payment method
    if (name === 'paymentMethodId') {
      setPaymentError(null);
    }
  };

  const handleGPSLocate = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsLocating(false);
      }, (err) => {
        alert("Impossible d'obtenir la localisation : " + err.message);
        setIsLocating(false);
      });
    } else {
      alert("La géolocalisation n'est pas supportée par ce navigateur.");
      setIsLocating(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPhotoError(null);

    if (file) {
      // Validate File Type
      if (!file.type.startsWith('image/')) {
        setPhotoError("Format invalide. Veuillez télécharger une image (JPG, PNG, WEBP).");
        setPhotoPreview(null); 
        e.target.value = ''; 
        return;
      }

      // Validate File Size (5MB)
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_SIZE) { 
        setPhotoError("L'image est trop volumineuse (Max: 5MB). Veuillez compresser le fichier.");
        setPhotoPreview(null); 
        e.target.value = ''; 
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.onerror = () => {
        setPhotoError("Erreur technique lors de la lecture du fichier.");
        setPhotoPreview(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Stop event bubbling to the label
    setPhotoPreview(null);
    setPhotoError(null);
  };

  const copyGPS = () => {
    if (location) {
      const text = `${location.lat}, ${location.lng}`;
      navigator.clipboard.writeText(text);
      alert("Coordonnées copiées !");
    }
  };

  const shareWhatsApp = () => {
    if (location) {
      const mapLink = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
      const text = `Localisation de livraison pour ${formData.clientName}: ${mapLink}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate Payment Method
    if (!formData.paymentMethodId) {
      setPaymentError("Veuillez obligatoirement sélectionner un moyen de paiement pour valider la commande.");
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      return;
    }
    
    onSubmit({
      ...formData,
      price: Number(formData.price),
      moissonneurCode: userCode,
      location: location ? { latitude: location.lat, longitude: location.lng } : undefined,
      photoUrl: photoPreview || undefined,
      status: OrderStatus.PENDING,
      createdAt: new Date().toISOString()
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-2">
          NOUVELLE COMMANDE
        </h1>
        <p className="text-purple-300">Remplissez le formulaire pour initier une moisson.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Details */}
          <GlassCard className="h-full">
            <h3 className="text-xl font-display text-cyan-400 mb-4 border-b border-purple-500/30 pb-2">Détails Produit</h3>
            <NeonInput name="productName" label="Nom du Produit" placeholder="Ex: Montre Connectée" value={formData.productName} onChange={handleInputChange} required />
            <div className="flex gap-4">
                <div className="flex-1">
                    <NeonInput name="price" label="Prix (FCFA)" type="number" placeholder="0" value={formData.price} onChange={handleInputChange} required />
                </div>
                <div className="flex-1">
                    <NeonInput 
                      name="cryptoAmount" 
                      label={isCryptoPayment ? "Montant Crypto (Requis)" : "Montant Crypto (Optionnel)"} 
                      placeholder="Ex: 0.005 BTC" 
                      value={formData.cryptoAmount} 
                      onChange={handleInputChange}
                      required={isCryptoPayment}
                      className={isCryptoPayment ? "border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]" : ""} 
                    />
                </div>
            </div>
            <NeonTextArea name="description" label="Description" placeholder="Détails spécifiques..." rows={3} value={formData.description} onChange={handleInputChange} />
            
            <div className="mb-4">
              <label className="block text-purple-200 text-sm mb-2 font-sans">Photo du Produit</label>
              <div className="flex flex-col gap-2">
                <label className={`cursor-pointer flex items-center justify-center bg-slate-800/50 border border-dashed ${photoError ? 'border-red-500/50 bg-red-900/10 hover:border-red-400' : 'border-purple-500/50 hover:border-cyan-400 hover:bg-slate-800/80 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]'} w-full h-32 rounded-lg transition-all duration-300 group relative overflow-hidden`}>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  {photoPreview ? (
                    <>
                        <img src={photoPreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover rounded-lg" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                            <span className="text-white text-sm font-medium flex items-center gap-2">
                              <Upload size={16} /> Changer l'image
                            </span>
                        </div>
                        <button 
                            onClick={clearPhoto}
                            className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-full z-10 transition-colors shadow-lg"
                            title="Supprimer la photo"
                        >
                            <X size={14} />
                        </button>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      {photoError ? (
                         <AlertTriangle className="mx-auto text-red-400 mb-2" />
                      ) : (
                         <Upload className="mx-auto text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                      )}
                      <span className={`text-xs ${photoError ? 'text-red-300' : 'text-purple-300'}`}>
                        {photoError ? "Réessayer" : "Cliquez pour ajouter une photo"}
                      </span>
                    </div>
                  )}
                </label>
                
                {photoError && (
                    <div className="flex items-center gap-2 text-xs text-red-400 bg-red-900/20 p-2 rounded border border-red-500/20 animate-pulse">
                        <AlertCircle size={14} />
                        <span>{photoError}</span>
                    </div>
                )}
              </div>
            </div>
          </GlassCard>

          {/* Client Details */}
          <GlassCard className="h-full">
            <h3 className="text-xl font-display text-cyan-400 mb-4 border-b border-purple-500/30 pb-2">Infos Client</h3>
            <NeonInput name="clientName" label="Nom du Client" placeholder="Nom complet" value={formData.clientName} onChange={handleInputChange} required />
            <NeonInput name="clientContact" label="Contact" placeholder="+225..." value={formData.clientContact} onChange={handleInputChange} required />
            <NeonInput name="clientMoissonneurCode" label="Code Parrain Client (Optionnel)" placeholder="MSN..." value={formData.clientMoissonneurCode} onChange={handleInputChange} />
            <NeonInput name="agentCode" label="Code Agent (Optionnel)" placeholder="AGT..." value={formData.agentCode} onChange={handleInputChange} />
            <NeonSelect name="urgency" label="Niveau d'urgence" value={formData.urgency} onChange={handleInputChange}>
              <option value={UrgencyLevel.LOW}>Faible</option>
              <option value={UrgencyLevel.URGENT}>Urgent</option>
              <option value={UrgencyLevel.VERY_URGENT}>Très Urgent</option>
            </NeonSelect>
          </GlassCard>
        </div>

        {/* Location & Delivery */}
        <GlassCard>
           <h3 className="text-xl font-display text-cyan-400 mb-4 border-b border-purple-500/30 pb-2">Livraison & Localisation</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <NeonInput name="country" label="Pays" value={formData.country} onChange={handleInputChange} />
             <NeonInput name="city" label="Ville" value={formData.city} onChange={handleInputChange} required />
             <NeonInput name="neighborhood" label="Quartier" value={formData.neighborhood} onChange={handleInputChange} required />
             <NeonInput name="deliveryLocation" label="Lieu précis" placeholder="A côté de la pharmacie..." value={formData.deliveryLocation} onChange={handleInputChange} required />
           </div>

           <div className="mt-4 p-4 bg-slate-900/40 rounded-lg border border-purple-500/20">
             <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
               <div className="flex items-center gap-3">
                 <div className={`p-3 rounded-full ${location ? 'bg-cyan-900/50 text-cyan-400' : 'bg-slate-800 text-gray-500'}`}>
                   <Navigation size={24} className={isLocating ? 'animate-spin' : ''} />
                 </div>
                 <div>
                   <p className="text-sm font-bold text-white">Position GPS</p>
                   <p className="text-xs text-purple-300">
                     {location ? 'Localisation acquise' : 'En attente de détection'}
                   </p>
                 </div>
               </div>
               
               <div className="flex gap-2">
                 <SecondaryButton type="button" onClick={handleGPSLocate} className="text-xs py-2 px-3">
                   {isLocating ? 'Détection...' : 'Localiser'}
                 </SecondaryButton>
                 {location && (
                   <>
                    <button type="button" onClick={copyGPS} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-purple-300 transition-colors" title="Copier">
                      <Copy size={18} />
                    </button>
                    <button type="button" onClick={shareWhatsApp} className="p-2 bg-green-900/30 border border-green-500/30 rounded-lg hover:bg-green-900/50 text-green-400 transition-colors" title="WhatsApp">
                      <Share2 size={18} />
                    </button>
                   </>
                 )}
               </div>
             </div>
           </div>

           {/* --- LIVE MAP & COORDINATES SECTION --- */}
           {location && (
             <div className="mt-6 animate-fade-in space-y-4">
               {/* Coordinates Display */}
               <GlassCard noPadding className="bg-slate-900/80 border-cyan-500/30 relative overflow-hidden p-4">
                 <div className="flex items-center gap-4 mb-2">
                    <Crosshair className="text-cyan-400 animate-pulse" size={20} />
                    <span className="text-sm font-display text-white tracking-widest uppercase">Coordonnées Satellite</span>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950 p-3 rounded border border-purple-500/20">
                        <span className="block text-[10px] text-gray-500 uppercase">Latitude</span>
                        <span className="font-mono text-cyan-300 font-bold">{location.lat.toFixed(6)}</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded border border-purple-500/20">
                        <span className="block text-[10px] text-gray-500 uppercase">Longitude</span>
                        <span className="font-mono text-cyan-300 font-bold">{location.lng.toFixed(6)}</span>
                    </div>
                 </div>
               </GlassCard>

               {/* Map Container */}
               <div className="relative rounded-xl overflow-hidden border border-purple-500/30 shadow-[0_0_20px_rgba(0,243,255,0.15)] h-64 md:h-80 w-full group">
                  {/* Map Ref */}
                  <div ref={mapRef} className="w-full h-full bg-slate-900 z-0"></div>
                  
                  {/* Overlay Info */}
                  <div className="absolute top-2 right-2 z-[400] bg-slate-900/90 backdrop-blur border border-purple-500/30 rounded px-3 py-1 text-xs text-white flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_5px_#a855f7]"></div>
                      <span>3 Moissonneurs proches</span>
                  </div>
                  <div className="absolute bottom-2 left-2 z-[400] text-[10px] text-gray-400 bg-black/50 px-2 rounded">
                      Carte Interactive
                  </div>
               </div>
             </div>
           )}

        </GlassCard>

        {/* Payment Methods */}
        <GlassCard>
          <h3 className="text-xl font-display text-cyan-400 mb-4 border-b border-purple-500/30 pb-2">Paiement</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {activeGateways.map((gateway) => (
              <label 
                key={gateway.id} 
                className={`cursor-pointer relative p-4 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center gap-2 h-32
                  ${formData.paymentMethodId === gateway.id 
                    ? 'bg-purple-600/20 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]' 
                    : paymentError 
                      ? 'bg-red-900/10 border-red-500/30 hover:bg-red-900/20'
                      : 'bg-slate-900/40 border-purple-500/20 hover:border-purple-400 hover:bg-slate-800/60'
                  }`}
              >
                <input 
                  type="radio" 
                  name="paymentMethodId" 
                  value={gateway.id} 
                  checked={formData.paymentMethodId === gateway.id}
                  onChange={handleInputChange}
                  className="hidden" 
                />
                {gateway.logoUrl ? (
                   <img src={gateway.logoUrl} alt={gateway.name} className="h-10 w-auto object-contain mb-1" />
                ) : (
                   <div className="h-10 w-10 rounded-full bg-purple-900 flex items-center justify-center text-purple-300 font-bold text-xl">
                      {gateway.name.charAt(0)}
                   </div>
                )}
                <span className="text-center text-sm font-medium text-white">{gateway.name}</span>
                {formData.paymentMethodId === gateway.id && (
                  <div className="absolute top-2 right-2 text-cyan-400">
                    <CheckCircle size={16} />
                  </div>
                )}
              </label>
            ))}
          </div>
          
          {/* Validation Error Message */}
          {paymentError && (
            <div className="mt-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex items-center gap-3 animate-pulse">
              <AlertCircle className="text-red-400 flex-shrink-0" size={24} />
              <span className="text-red-200 font-medium">{paymentError}</span>
            </div>
          )}
        </GlassCard>

        <div className="flex justify-end pt-4 pb-12">
          <PrimaryButton type="submit" className="w-full md:w-auto text-lg px-12">
            VALIDER LA COMMANDE
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;
