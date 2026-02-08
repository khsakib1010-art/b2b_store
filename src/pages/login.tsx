import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Building2, ShoppingBag, Lock, Mail } from 'lucide-react';

const Login = () => {
  const [role, setRole] = useState("customer"); // 'admin' or 'customer'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Dynamic login based on the current 'role' state
    const success = await login(email, password, role);

    if (success) {
      navigate(role === 'admin' ? '/admin' : '/customer');
    } else {
      setError(
        role === 'admin' 
          ? 'Invalid email or password' 
          : 'Invalid email or password. Please contact your administrator.'
      );
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* --- Full-Width Navigation Bar --- */}
      <nav className="flex justify-between items-center px-10 py-5 bg-white border-b border-gray-100 z-10">
        <div className="flex items-center gap-2 text-2xl font-black tracking-tighter text-blue-600">
          <div className="p-1.5 bg-blue-600 rounded-lg">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span>CORE<span className="text-gray-900">APP</span></span>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant={role === "admin" ? "default" : "secondary"}
            onClick={() => { setRole("admin"); setError(""); }}
            className="rounded-full px-6"
          >
            Admin Login
          </Button>
          <Button
            variant={role === "customer" ? "default" : "secondary"}
            onClick={() => { setRole("customer"); setError(""); }}
            className="rounded-full px-6"
          >
            Customer Login
          </Button>
        </div>
      </nav>

      {/* --- Full-Width Hero Section --- */}
      <main className="flex-grow flex">
        <div className="w-full grid grid-cols-1 md:grid-cols-2">
          
          {/* Left Side: Full-Height Image */}
          <div className="hidden md:block relative w-full h-full bg-slate-100">
            <img
              src={role === 'admin' 
                ? "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200" 
                : "https://images.unsplash.com/photo-1556742049-13ef736c9020?auto=format&fit=crop&q=80&w=1200"}
              alt="Login Background"
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
            />
            <div className="absolute inset-0 bg-blue-900/20 mix-blend-multiply" />
          </div>

          {/* Right Side: Centered Login Form */}
          <div className="flex items-center justify-center bg-white px-8 py-12 md:px-24">
            <div className="w-full max-w-md">
              <div className="mb-10 text-center md:text-left">
                <div className="flex justify-center md:justify-start mb-4">
                   <div className={`p-3 rounded-2xl ${role === 'admin' ? 'bg-primary/10' : 'bg-accent/10'}`}>
                    {role === 'admin' 
                      ? <Building2 className="w-8 h-8 text-primary" /> 
                      : <ShoppingBag className="w-8 h-8 text-accent" />
                    }
                  </div>
                </div>
                <h2 className="text-4xl font-extrabold text-gray-900 capitalize">
                  {role} Portal
                </h2>
                <p className="text-muted-foreground mt-4">
                  {role === 'admin' 
                    ? "Sign in to access the admin dashboard and manage operations." 
                    : "Sign in to browse products, track orders, and manage your account."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-4 rounded-xl border border-destructive/20">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 rounded-xl"
                      placeholder={role === 'admin' ? "admin@company.com" : "your@email.com"}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12 rounded-xl"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full h-12 rounded-xl text-lg font-bold transition-all ${
                    role === 'customer' ? 'bg-accent text-accent-foreground hover:bg-accent/90' : 'btn-primary'
                  }`}
                >
                  {isLoading ? 'Signing in...' : `Continue as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
                </Button>
              </form>

              {/* Demo Credentials Section */}
              <div className="mt-10 p-4 bg-muted/40 rounded-xl border border-dashed border-gray-200">
                <p className="text-xs text-muted-foreground text-center font-semibold uppercase tracking-wider mb-2">
                  Demo {role} Access
                </p>
                <p className="text-sm text-center font-mono text-gray-600">
                  {role === 'admin' 
                    ? "admin@company.com / admin123" 
                    : "orders@abcdist.com / customer123"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;