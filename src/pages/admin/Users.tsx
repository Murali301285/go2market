import React, { useEffect, useState } from 'react';
import {
    Box, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Switch, Chip, InputAdornment, IconButton, Autocomplete
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getUsers, createUser, updateUser, toggleUserStatus } from '../../services/userService';
import { getRegions } from '../../services/regionService';
import type { User, Region } from '../../types';
import PageLoading from '../../components/common/PageLoading';

const userSchema = z.object({
    fullName: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['admin', 'distributor', 'user']),
    defaultLockInMonths: z.number().refine(val => [1, 3, 6].includes(val), { message: "Must be 1, 3, or 6" }),
    assignedRegions: z.array(z.string()).min(1, 'At least one region must be assigned'),
});

type UserFormInputs = z.infer<typeof userSchema>;

const Users: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [regions, setRegions] = useState<Region[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { register, handleSubmit, control, reset, formState: { errors } } = useForm<UserFormInputs>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            role: 'distributor',
            defaultLockInMonths: 3,
            assignedRegions: [],
        }
    });

    const fetchUsers = async () => {
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRegions = async () => {
        try {
            const data = await getRegions();
            setRegions(data);
        } catch (error) {
            console.error("Failed to fetch regions", error);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchRegions();
    }, []);

    const handleOpenAdd = () => {
        setEditingId(null);
        // Default: All regions for new users (will be all region IDs)
        const allRegionIds = regions.map(r => r.id);
        reset({
            fullName: '',
            email: '',
            password: '',
            role: 'distributor',
            defaultLockInMonths: 3,
            assignedRegions: allRegionIds, // Default to all regions
        });
        setOpen(true);
    };

    const handleOpenEdit = (user: User) => {
        setEditingId(user.id);
        reset({
            fullName: user.fullName,
            email: user.email,
            password: 'unchanged', // Dummy password to pass validation
            role: user.role,
            defaultLockInMonths: user.defaultLockInMonths,
            assignedRegions: user.assignedRegions || [],
        });
        setOpen(true);
    };

    const onSubmit = async (data: UserFormInputs) => {
        setCreating(true);
        try {
            if (editingId) {
                await updateUser(editingId, {
                    fullName: data.fullName,
                    role: data.role,
                    defaultLockInMonths: data.defaultLockInMonths as 1 | 3 | 6,
                    assignedRegions: data.assignedRegions,
                });
            } else {
                await createUser({
                    fullName: data.fullName,
                    email: data.email,
                    role: data.role,
                    defaultLockInMonths: data.defaultLockInMonths as 1 | 3 | 6,
                    assignedRegions: data.assignedRegions,
                    isActive: true,
                }, data.password);
            }
            setOpen(false);
            reset();
            fetchUsers();
        } catch (error) {
            console.error("Failed to save user", error);
            alert("Failed to save user. Email might be in use or other error.");
        } finally {
            setCreating(false);
        }
    };

    const handleToggleStatus = async (user: User) => {
        try {
            await toggleUserStatus(user.id, user.isActive);
            fetchUsers();
        } catch (error) {
            console.error("Failed to toggle status", error);
        }
    };

    if (loading) return <PageLoading />;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">User Management</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenAdd}
                >
                    Add User
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Regions</TableCell>
                            <TableCell>Lock-in (Months)</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.fullName}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.role}</TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                        {user.assignedRegions && user.assignedRegions.length > 0 ? (
                                            user.assignedRegions.map((regionId) => (
                                                <Chip
                                                    key={regionId}
                                                    label={regions.find(r => r.id === regionId)?.name || regionId}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            ))
                                        ) : (
                                            <Chip label="No Regions" size="small" color="error" variant="outlined" />
                                        )}
                                    </Box>
                                </TableCell>
                                <TableCell>{user.defaultLockInMonths}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={user.isActive ? "Active" : "Inactive"}
                                        color={user.isActive ? "success" : "default"}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Switch
                                            checked={user.isActive}
                                            onChange={() => handleToggleStatus(user)}
                                            color="primary"
                                        />
                                        <IconButton
                                            onClick={() => handleOpenEdit(user)}
                                            sx={{ ml: 1 }}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{editingId ? 'Edit User' : 'Create New User'}</DialogTitle>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                label="Full Name"
                                fullWidth
                                {...register('fullName')}
                                error={!!errors.fullName}
                                helperText={errors.fullName?.message}
                            />
                            <TextField
                                label="Email"
                                fullWidth
                                {...register('email')}
                                error={!!errors.email}
                                helperText={errors.email?.message}
                                disabled={!!editingId} // Disable email editing
                            />
                            {!editingId && (
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
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            )}
                            <Controller
                                name="role"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        label="Role"
                                        fullWidth
                                    >
                                        <MenuItem value="distributor">Distributor</MenuItem>
                                        <MenuItem value="admin">Admin</MenuItem>
                                        <MenuItem value="user">User</MenuItem>
                                    </TextField>
                                )}
                            />
                            <Controller
                                name="defaultLockInMonths"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        label="Default Lock-in Period"
                                        fullWidth
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    >
                                        <MenuItem value={1}>1 Month</MenuItem>
                                        <MenuItem value={3}>3 Months</MenuItem>
                                        <MenuItem value={6}>6 Months</MenuItem>
                                    </TextField>
                                )}
                            />
                            <Controller
                                name="assignedRegions"
                                control={control}
                                render={({ field }) => (
                                    <Autocomplete
                                        multiple
                                        options={regions.map(r => r.id)}
                                        getOptionLabel={(option) => regions.find(r => r.id === option)?.name || option}
                                        value={field.value || []}
                                        onChange={(_, newValue) => field.onChange(newValue)}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Assigned Regions"
                                                error={!!errors.assignedRegions}
                                                helperText={errors.assignedRegions?.message || "Select regions this user can access"}
                                            />
                                        )}
                                        renderTags={(value, getTagProps) =>
                                            value.map((option, index) => (
                                                <Chip
                                                    label={regions.find(r => r.id === option)?.name || option}
                                                    {...getTagProps({ index })}
                                                    color="primary"
                                                    size="small"
                                                />
                                            ))
                                        }
                                    />
                                )}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={creating}>
                            {creating ? 'Saving...' : (editingId ? 'Update User' : 'Create User')}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box >
    );
};

export default Users;
