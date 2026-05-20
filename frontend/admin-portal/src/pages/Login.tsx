/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/authService";

export default function Login() {
    const navigate = useNavigate();
    const { login, user } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            navigate("/dashboard", { replace: true });
            console.log(user);
        }
    }, [user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const response = await authService.login(email, password);

            if (response && response.token) {
                const userData = {
                    _id: response.user.id,
                    name: response.user.name,
                    email: response.user.email,
                    role: response.user.role,
                    token: response.token
                };
                login(userData);

            } else {
                setError("Invalid response from server");
            }
        } catch (err: any) {
            console.error("Login error:", err);
            const message = err?.response?.data?.message || err?.response?.data?.error?.message || "Unable to sign in";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-background">
            {/* Left Branding Panel */}
            <div className="hidden lg:flex w-1/2 bg-primary flex-col justify-between p-12 relative overflow-hidden">
                {/* Subtle abstract geometric background element */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute w-[200%] h-[200%] -top-[50%] -left-[50%]">
                        <defs>
                            <pattern id="grid" width="4" height="4" patternUnits="userSpaceOnUse">
                                <path d="M 4 0 L 0 0 0 4" fill="none" stroke="white" strokeWidth="0.1" />
                            </pattern>
                        </defs>
                        <rect width="100" height="100" fill="url(#grid)" />
                    </svg>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-16">
                        <div className="w-10 h-10 bg-primary-foreground rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <span className="text-primary-foreground text-2xl font-bold tracking-tight">Finova</span>
                    </div>

                    <div className="max-w-md">
                        <h1 className="text-4xl font-semibold text-primary-foreground mb-6 leading-tight">
                            Enterprise-grade control for your financial ecosystem.
                        </h1>
                        <p className="text-primary-foreground/80 text-lg leading-relaxed">
                            Access your administrative dashboard to manage user roles, oversee high-level transactions, and monitor global platform health with precision and security.
                        </p>
                    </div>
                </div>

                <div className="relative z-10 text-primary-foreground/60 text-sm">
                    &copy; 2026 Finova Systems. All rights reserved.
                </div>
            </div>

            {/* Right Login Form Panel */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 relative bg-card">
                {/* Mobile Logo Only */}
                <div className="absolute top-8 left-8 lg:hidden flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                        <svg className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <span className="text-foreground text-xl font-bold">Finova</span>
                </div>

                <div className="w-full max-w-[420px] space-y-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-semibold text-foreground tracking-tight mb-2">
                            Welcome back
                        </h2>
                        <p className="text-muted-foreground">
                            Enter your administrative credentials to continue.
                        </p>
                    </div>

                    {error && (
                        <div className="p-4 rounded-md bg-destructive/10 text-destructive border border-destructive/20 text-sm flex items-start gap-3">
                            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                                    Email address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@finova.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-11 bg-background border-input px-4 focus-visible:ring-1 focus-visible:ring-ring transition-shadow"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-sm font-medium text-foreground">
                                        Password
                                    </Label>
                                    <button type="button" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        Forgot password?
                                    </button>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-11 bg-background border-input px-4 focus-visible:ring-1 focus-visible:ring-ring transition-shadow"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 opacity-70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Signing in...</span>
                                </div>
                            ) : (
                                "Sign In"
                            )}
                        </Button>
                    </form>

                    <div className="flex justify-center mt-8">
                        <span className="bg-secondary text-secondary-foreground text-xs font-medium px-2.5 py-1 rounded-sm uppercase tracking-wider">
                            Admin Portal Access
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
