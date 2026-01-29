import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, ShoppingBag, ArrowRight, Package, Users, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <span className="font-bold text-xl">B2B Store</span>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/login/admin">
                <Button variant="ghost" size="sm">Admin</Button>
              </Link>
              <Link to="/login/customer">
                <Button size="sm" className="btn-primary">
                  Customer Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
            B2B E-Commerce
            <span className="text-primary block">Wholesale Platform</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Streamline your bulk ordering process. Browse products, select sizes and colors, 
            and place orders with your PO number in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login/customer">
              <Button size="lg" className="btn-primary h-12 px-8">
                <ShoppingBag className="w-5 h-5 mr-2" />
                Start Ordering
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/login/admin">
              <Button size="lg" variant="outline" className="h-12 px-8">
                <Building2 className="w-5 h-5 mr-2" />
                Admin Portal
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="card-hover border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Bulk Ordering</h3>
              <p className="text-muted-foreground text-sm">
                Select multiple sizes and colors per product, specify quantities, and order everything in one go.
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Package className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Product Catalog</h3>
              <p className="text-muted-foreground text-sm">
                Browse a comprehensive catalog with detailed product information, available sizes, and color options.
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="w-14 h-14 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-success" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Account Management</h3>
              <p className="text-muted-foreground text-sm">
                Admin creates customer accounts. Track orders, manage products, and export data easily.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Demo Credentials */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <Card className="border-dashed">
          <CardContent className="p-8">
            <h2 className="font-semibold text-lg mb-4 text-center">Demo Credentials</h2>
            <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="font-medium mb-2">Admin Login</p>
                <p className="text-sm font-mono text-muted-foreground">admin@company.com</p>
                <p className="text-sm font-mono text-muted-foreground">admin123</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="font-medium mb-2">Customer Login</p>
                <p className="text-sm font-mono text-muted-foreground">orders@abcdist.com</p>
                <p className="text-sm font-mono text-muted-foreground">customer123</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-muted-foreground">
            B2B E-Commerce Platform — Demo Application
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
