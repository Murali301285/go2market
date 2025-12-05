import React, { useState } from 'react';
import {
    Box, Button, TextField, Typography, Paper, InputAdornment, IconButton, Alert, Link,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import logo from '../../assets/login-logo.png';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { login, resetPassword } from '../../services/authService';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Forgot Password State
    const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetMessage, setResetMessage] = useState<string | null>(null);
    const [resetError, setResetError] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormInputs) => {
        setLoading(true);
        setError(null);
        try {
            await login(data.email, data.password);
            // Wait a bit for the auth state to update
            setTimeout(() => {
                // The auth provider will handle loading the user profile
                // Just navigate to root and let the router handle the redirect
                window.location.href = '/';
            }, 1000);
        } catch (err: unknown) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to login';
            setError(errorMessage);
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!resetEmail) {
            setResetError('Please enter your email address');
            return;
        }
        setResetLoading(true);
        setResetError(null);
        setResetMessage(null);
        try {
            await resetPassword(resetEmail);
            setResetMessage('Reset link sent to registered email id');
            setResetEmail('');
        } catch (err: any) {
            console.error(err);
            setResetError(err.message || 'Failed to send reset email');
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <Box
            sx={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default',
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    p: 4,
                    width: '100%',
                    maxWidth: 400,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                }}
            >
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <Box component="img" src={logo} alt="Opportunity Tracker Logo" sx={{ height: 100, mb: 2 }} />
                    <Typography variant="h5" color="primary" fontWeight="bold">
                        Opportunity Tracker for Schools
                    </Typography>
                </Box>

                <Typography variant="subtitle1" align="center" color="text.secondary" gutterBottom>
                    Sign in to your account
                </Typography>

                {error && <Alert severity="error">{error}</Alert>}

                <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <TextField
                        label="Email Address"
                        fullWidth
                        {...register('email')}
                        error={!!errors.email}
                        helperText={errors.email?.message}
                    />

                    <Box>
                        <TextField
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            fullWidth
                            {...register('password')}
                            error={!!errors.password}
                            helperText={errors.password?.message}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                            <Link
                                component="button"
                                variant="body2"
                                type="button"
                                onClick={() => setForgotPasswordOpen(true)}
                            >
                                Forgot Password?
                            </Link>
                        </Box>
                    </Box>

                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        fullWidth
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                </form>
            </Paper>

            {/* Forgot Password Dialog */}
            <Dialog open={forgotPasswordOpen} onClose={() => setForgotPasswordOpen(false)}>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Enter your registered email address and we'll send you a link to reset your password.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Email Address"
                        type="email"
                        fullWidth
                        variant="outlined"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                    />
                    {resetError && <Alert severity="error" sx={{ mt: 2 }}>{resetError}</Alert>}
                    {resetMessage && <Alert severity="success" sx={{ mt: 2 }}>{resetMessage}</Alert>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setForgotPasswordOpen(false)}>Cancel</Button>
                    <Button onClick={handleResetPassword} disabled={resetLoading}>
                        {resetLoading ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Login;
