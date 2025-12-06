
import React, { useState } from 'react';
import { GlassCard, NeonInput, PrimaryButton, SecondaryButton } from '../components/FuturisticUI';
import { supabase } from '../services/supabaseClient';
import { Lock, Mail, User as UserIcon, LogIn, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

interface AuthFormProps {
  onSuccess: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        // --- CONNEXION ---
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // La redirection est gérée par le useEffect dans App.tsx
      } else {
        // --- INSCRIPTION ---
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: fullName,
            },
          },
        });
        if (error) throw error;
        
        if (data.user && !data.session) {
           setMessage("Compte créé ! Veuillez vérifier votre email pour confirmer l'inscription avant de vous connecter.");
           setIsLogin(true); // Switch to login view
        } else {
           // Auto login if confirmation not required
           onSuccess();
        }
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-2">
                MOISSON MANAGER
            </h1>
            <p className="text-purple-300 tracking-widest text-xs uppercase">Portail Sécurisé</p>
        </div>

        <GlassCard className="border-cyan-500/30 shadow-[0_0_50px_rgba(124,58,237,0.15)]">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-slate-900 border border-purple-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <Lock size={32} className="text-cyan-400" />
            </div>
          </div>

          <h2 className="text-2xl font-display font-bold text-white text-center mb-6">
            {isLogin ? 'Connexion' : 'Créer un compte'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg flex items-center gap-2 text-sm text-red-200 animate-pulse">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 bg-green-900/20 border border-green-500/50 rounded-lg flex items-center gap-2 text-sm text-green-200">
              <CheckCircle size={16} />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <NeonInput 
                  placeholder="Nom complet" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                  className="pl-10"
                />
                <UserIcon className="absolute left-3 top-3.5 text-gray-500" size={18} />
              </div>
            )}

            <div className="relative">
              <NeonInput 
                type="email" 
                placeholder="Adresse Email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10"
              />
              <Mail className="absolute left-3 top-3.5 text-gray-500" size={18} />
            </div>

            <div className="relative">
              <NeonInput 
                type="password" 
                placeholder="Mot de passe" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10"
              />
              <Lock className="absolute left-3 top-3.5 text-gray-500" size={18} />
            </div>

            <PrimaryButton type="submit" className="w-full justify-center mt-6" disabled={loading}>
              {loading ? (
                <span className="animate-pulse">Traitement...</span>
              ) : (
                <>
                  {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                  {isLogin ? 'Se Connecter' : "S'inscrire"}
                </>
              )}
            </PrimaryButton>
          </form>

          <div className="mt-6 pt-6 border-t border-purple-500/20 text-center">
            <p className="text-gray-400 text-sm mb-3">
              {isLogin ? "Pas encore de compte ?" : "Déjà inscrit ?"}
            </p>
            <SecondaryButton 
              type="button" 
              onClick={() => { setIsLogin(!isLogin); setError(null); setMessage(null); }}
              className="w-full justify-center text-sm"
            >
              {isLogin ? "Créer un compte" : "Se connecter"}
            </SecondaryButton>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default AuthForm;
