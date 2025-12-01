import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Checkbox, TextField, MenuItem, Select, FormControl,
    InputLabel, Dialog, DialogTitle, DialogContent, DialogActions, Chip,
    InputAdornment, CircularProgress
} from '@mui/material';
import { Search, AssignmentInd } from '@mui/icons-material';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { getUsers } from '../../services/userService';
import { getRegions } from '../../services/regionService';
import type { Lead, User, Region } from '../../types';
import { useAuth } from '../../hooks/useAuth';

const LeadAssignment: React.FC = () => {
    const { userProfile } = useAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [regions, setRegions] = useState<Region[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRegion, setFilterRegion] = useState('all');

    // Assignment Dialog
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [lockInMonths, setLockInMonths] = useState<number>(3);
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch POOL leads
            const q = query(collection(db, 'leads'), where('status', '==', 'POOL'));
            const snapshot = await getDocs(q);
            const leadsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));

            const [usersData, regionsData] = await Promise.all([
                getUsers(),
                getRegions()
            ]);

            setLeads(leadsData);
            setUsers(usersData.filter(u => u.isActive && u.role !== 'admin')); // Only assign to active non-admins
            setRegions(regionsData);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelectedLeads(filteredLeads.map(l => l.id));
        } else {
            setSelectedLeads([]);
        }
    };

    const handleSelectOne = (id: string) => {
        setSelectedLeads(prev =>
            prev.includes(id) ? prev.filter(lid => lid !== id) : [...prev, id]
        );
    };

    const handleOpenAssign = () => {
        if (selectedLeads.length === 0) return;
        setAssignDialogOpen(true);
        setSelectedUser('');
        setLockInMonths(3); // Default fallback
    };

    const handleUserChange = (userId: string) => {
        setSelectedUser(userId);
        const user = users.find(u => u.id === userId);
        if (user) {
            setLockInMonths(user.defaultLockInMonths || 3);
        }
    };

    const handleAssignSubmit = async () => {
        if (!selectedUser) return;
        setAssigning(true);

        try {
            const batch = writeBatch(db);
            const user = users.find(u => u.id === selectedUser);
            if (!user) throw new Error("User not found");

            const now = Date.now();
            const lockUntil = now + (lockInMonths * 30 * 24 * 60 * 60 * 1000); // Approx months

            // 1. Update Leads
            selectedLeads.forEach(leadId => {
                const leadRef = doc(db, 'leads', leadId);
                batch.update(leadRef, {
                    assignedToUserId: user.id,
                    assignedToName: user.fullName,
                    status: 'LOCKED',
                    lockedUntil: lockUntil,
                    updates: [{
                        id: `update-${now}`,
                        status: 'LOCKED',
                        remarks: `Assigned to ${user.fullName} by Admin`,
                        timestamp: now,
                        updatedBy: userProfile?.id || 'admin'
                    }]
                });
            });

            // 2. Create Notification
            const notifRef = doc(collection(db, 'notifications'));
            batch.set(notifRef, {
                id: notifRef.id,
                userId: user.id,
                title: 'New Leads Assigned',
                message: `You have been assigned ${selectedLeads.length} new leads.`,
                type: 'info',
                read: false,
                createdAt: now,
                link: '/my-leads'
            });

            await batch.commit();

            // Refresh Data
            await fetchData();
            setAssignDialogOpen(false);
            setSelectedLeads([]);
            alert(`Successfully assigned ${selectedLeads.length} leads to ${user.fullName}`);

        } catch (error) {
            console.error("Assignment failed:", error);
            alert("Failed to assign leads. Please try again.");
        } finally {
            setAssigning(false);
        }
    };

    const filteredLeads = leads.filter(lead => {
        const matchesSearch = !searchQuery ||
            lead.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.regionName.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRegion = filterRegion === 'all' || lead.regionId === filterRegion;

        return matchesSearch && matchesRegion;
    });

    if (loading) return <CircularProgress />;

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
                <Typography variant="h4">Lead Assignment</Typography>
                <Button
                    variant="contained"
                    startIcon={<AssignmentInd />}
                    disabled={selectedLeads.length === 0}
                    onClick={handleOpenAssign}
                >
                    Assign Selected ({selectedLeads.length})
                </Button>
            </Box>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                    placeholder="Search School or Region..."
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><Search /></InputAdornment>
                    }}
                    sx={{ flexGrow: 1 }}
                />

                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Filter Region</InputLabel>
                    <Select
                        value={filterRegion}
                        label="Filter Region"
                        onChange={(e) => setFilterRegion(e.target.value)}
                    >
                        <MenuItem value="all">All Regions</MenuItem>
                        {regions.map(r => (
                            <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Paper>

            <TableContainer component={Paper} sx={{ maxHeight: '70vh' }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox">
                                <Checkbox
                                    indeterminate={selectedLeads.length > 0 && selectedLeads.length < filteredLeads.length}
                                    checked={filteredLeads.length > 0 && selectedLeads.length === filteredLeads.length}
                                    onChange={handleSelectAll}
                                />
                            </TableCell>
                            <TableCell>School Name</TableCell>
                            <TableCell>Region</TableCell>
                            <TableCell>Contact</TableCell>
                            <TableCell>Phone</TableCell>
                            <TableCell>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredLeads.map((lead) => (
                            <TableRow key={lead.id} hover>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        checked={selectedLeads.includes(lead.id)}
                                        onChange={() => handleSelectOne(lead.id)}
                                    />
                                </TableCell>
                                <TableCell>{lead.schoolName}</TableCell>
                                <TableCell>{lead.regionName}</TableCell>
                                <TableCell>
                                    {lead.contactPerson}
                                    <Typography variant="caption" display="block">{lead.designation}</Typography>
                                </TableCell>
                                <TableCell>{lead.contactPhone}</TableCell>
                                <TableCell>
                                    <Chip label={lead.status} size="small" />
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredLeads.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                    No unassigned leads found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Assignment Dialog */}
            <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Assign Leads</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Typography>
                            Assigning <b>{selectedLeads.length}</b> leads.
                        </Typography>

                        <FormControl fullWidth>
                            <InputLabel>Select User</InputLabel>
                            <Select
                                value={selectedUser}
                                label="Select User"
                                onChange={(e) => handleUserChange(e.target.value)}
                            >
                                {users.map(u => (
                                    <MenuItem key={u.id} value={u.id}>
                                        {u.fullName} ({u.assignedRegions?.map(rid => regions.find(r => r.id === rid)?.name).join(', ') || 'No Region'})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label="Lock-in Period (Months)"
                            type="number"
                            value={lockInMonths}
                            onChange={(e) => setLockInMonths(Number(e.target.value))}
                            helperText="Leads will be locked for this user for this duration."
                            fullWidth
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleAssignSubmit}
                        variant="contained"
                        disabled={!selectedUser || assigning}
                    >
                        {assigning ? 'Assigning...' : 'Confirm Assignment'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default LeadAssignment;
