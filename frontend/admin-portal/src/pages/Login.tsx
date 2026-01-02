import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left Column - Animated Illustration/Branding */}
            <div className="hidden lg:flex flex-col justify-center items-center bg-linear-to-br from-black via-black/95 to-black/90 p-12 relative overflow-hidden">
                {/* Animated Background Shapes with Orange Glow */}
                <div className="absolute inset-0">
                    <motion.div
                        className="absolute top-20 left-20 w-72 h-72 bg-primary/30 rounded-full blur-3xl"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.5, 0.3],
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                    <motion.div
                        className="absolute bottom-32 right-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
                        animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.2, 0.4, 0.2],
                        }}
                        transition={{
                            duration: 6,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                    <motion.div
                        className="absolute top-1/2 left-1/3 w-48 h-48 bg-primary/25 rounded-full blur-3xl"
                        animate={{
                            scale: [1, 1.15, 1],
                            opacity: [0.25, 0.45, 0.25],
                        }}
                        transition={{
                            duration: 5,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                </div>

                {/* Floating Particles */}
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-primary/40 rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [0, -30, 0],
                            opacity: [0, 1, 0],
                        }}
                        transition={{
                            duration: 3 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                        }}
                    />
                ))}

                {/* Content */}
                <motion.div
                    className="relative z-10 text-center space-y-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    {/* Restaurant Icon/Logo */}
                    <motion.div
                        className="mx-auto w-32 h-32 bg-linear-to-br from-primary to-primary/80 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/50"
                        animate={{
                            y: [0, -10, 0],
                            rotateY: [0, 5, 0],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    >
                        <svg
                            className="w-20 h-20 text-black"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                        </svg>
                    </motion.div>

                    <motion.div
                        className="space-y-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h1 className="text-5xl font-bold text-white drop-shadow-lg">
                            Welcome Back
                        </h1>
                        <p className="text-xl text-gray-300 max-w-md mx-auto">
                            Manage your system operations with{" "}
                            <span className="text-primary font-semibold">elegance</span> and{" "}
                            <span className="text-primary font-semibold">efficiency</span>
                        </p>
                    </motion.div>

                    {/* Feature Cards */}
                    <div className="grid grid-cols-3 gap-4 mt-12">
                        {[
                            {
                                icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
                                label: "Transactions",
                                delay: 0.5,
                            },
                            {
                                icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
                                label: "Users",
                                delay: 0.6,
                            },
                            {
                                icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
                                label: "Reports",
                                delay: 0.7,
                            },
                        ].map((feature, index) => (
                            <motion.div
                                key={index}
                                className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-primary/20 hover:border-primary/50 transition-all duration-300 group cursor-pointer"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: feature.delay }}
                                whileHover={{ scale: 1.05, y: -5 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <motion.svg
                                    className="w-8 h-8 text-primary mx-auto mb-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    whileHover={{ rotate: 5 }}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d={feature.icon}
                                    />
                                </motion.svg>
                                <p className="text-sm text-white font-medium group-hover:text-primary transition-colors">
                                    {feature.label}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Animated Bottom Pattern */}
                <motion.div
                    className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-primary/10 to-transparent"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                />
            </div>

            {/* Right Column - Login Form */}
            <div className="flex items-center justify-center p-6 lg:p-12 bg-white">
                <motion.div
                    className="w-full max-w-md"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.3 }}>
                        <Card className="shadow-2xl border-black/10 hover:shadow-primary/20 transition-shadow duration-500 bg-white">
                            <CardHeader className="space-y-1 text-center pb-6">
                                {/* Mobile Logo */}
                                <motion.div
                                    className="lg:hidden mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-primary to-primary/80 shadow-lg shadow-primary/50"
                                    animate={{
                                        rotate: [0, 5, -5, 0],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}
                                >
                                    <svg
                                        className="h-8 w-8 text-black"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                                        />
                                    </svg>
                                </motion.div>

                                <CardTitle className="text-3xl font-bold bg-linear-to-r from-black to-black/70 bg-clip-text">
                                    Admin Portal
                                </CardTitle>
                                <CardDescription className="text-base text-gray-600">
                                    Sign in to access your dashboard
                                </CardDescription>
                            </CardHeader>

                            <CardContent>
                                {error && (
                                    <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                                        {error}
                                    </div>
                                )}
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <motion.div
                                        className="space-y-2 group"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <Label
                                            htmlFor="email"
                                            className="text-sm font-medium text-black"
                                        >
                                            Email Address
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="staff@finova.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                className="pl-10 transition-all focus:ring-2 focus:ring-primary focus:border-primary duration-200 border-black/20"
                                            />
                                            <svg
                                                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                                                />
                                            </svg>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        className="space-y-2 group"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        <Label
                                            htmlFor="password"
                                            className="text-sm font-medium text-black"
                                        >
                                            Password
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="Enter your password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className="pl-10 transition-all focus:ring-2 focus:ring-primary focus:border-primary duration-200 border-black/20"
                                            />
                                            <svg
                                                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                                />
                                            </svg>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        className="flex items-center justify-between text-sm"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.4 }}
                                    >
                                        <label className="flex items-center space-x-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className="rounded border-black/30 text-primary focus:ring-primary transition-all"
                                            />
                                            <span className="text-gray-600 group-hover:text-black transition-colors">
                                                Remember me
                                            </span>
                                        </label>
                                        <a
                                            href="#"
                                            className="text-primary hover:text-primary/80 transition-colors font-medium hover:underline"
                                        >
                                            Forgot password?
                                        </a>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 }}
                                    >
                                        <motion.div
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <Button
                                                type="submit"
                                                className="w-full bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-black font-semibold py-6 text-base transition-all shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40"
                                                disabled={isLoading}
                                            >
                                                {isLoading ? (
                                                    <div className="flex items-center justify-center">
                                                        <motion.svg
                                                            className="-ml-1 mr-3 h-5 w-5 text-black"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            animate={{ rotate: 360 }}
                                                            transition={{
                                                                duration: 1,
                                                                repeat: Infinity,
                                                                ease: "linear",
                                                            }}
                                                        >
                                                            <circle
                                                                className="opacity-25"
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                            ></circle>
                                                            <path
                                                                className="opacity-75"
                                                                fill="currentColor"
                                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                            ></path>
                                                        </motion.svg>
                                                        Signing in...
                                                    </div>
                                                ) : (
                                                    <span className="flex items-center justify-center gap-2">
                                                        Sign In
                                                        <motion.svg
                                                            className="w-5 h-5"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                            whileHover={{ x: 5 }}
                                                            transition={{ type: "spring", stiffness: 400 }}
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M14 5l7 7m0 0l-7 7m7-7H3"
                                                            />
                                                        </motion.svg>
                                                    </span>
                                                )}
                                            </Button>
                                        </motion.div>
                                    </motion.div>
                                </form>

                                <motion.div
                                    className="mt-8 text-center space-y-4"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                >
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-black/10"></div>
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-white px-2 text-gray-500">
                                                Staff Access Only
                                            </span>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-600">
                                        Need help?{" "}
                                        <a
                                            href="#"
                                            className="text-primary hover:text-primary/80 transition-colors font-medium hover:underline"
                                        >
                                            Contact Manager
                                        </a>
                                    </p>
                                </motion.div>
                            </CardContent>
                        </Card>
                    </motion.div>


                </motion.div>
            </div>
        </div>
    );
}
