import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Paper, TextField, Button, Chip, Card, CardContent, CardActions,
    InputAdornment, MenuItem, Select, FormControl, InputLabel, IconButton, Tooltip, Alert,
    Dialog, DialogContent, DialogTitle, DialogActions, DialogContentText
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import HandshakeIcon from '@mui/icons-material/Handshake';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import BlockIcon from '@mui/icons-material/Block';
import * as XLSX from 'xlsx';
import { getAllLeads, updateLeadStatus } from '../../services/leadService';
import { getUsers } from '../../services/userService';
import type { Lead, User } from '../../types';
import PageLoading from '../../components/common/PageLoading';
import LeadDetailContent from '../../components/leads/LeadDetailContent';
import { getStageColor } from '../../utils/colors';

const AllLeads: React.FC = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterStage, setFilterStage] = useState('all');
    const [filterUser, setFilterUser] = useState('all');
    const [filterRegion, setFilterRegion] = useState('all');

    const [error, setError] = useState<string | null>(null);

    // Modal State
    const [openModal, setOpenModal] = useState(false);
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

    // Inactive Confirmation State
    const [openInactiveDialog, setOpenInactiveDialog] = useState(false);
    const [leadToInactive, setLeadToInactive] = useState<Lead | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [leadsData, usersData] = await Promise.all([
                getAllLeads(),
                getUsers()
            ]);
            setLeads(leadsData);
            setUsers(usersData);
        } catch (error: any) {
            console.error("Failed to fetch leads", error);
            setError(error.message || "Failed to fetch leads");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Apply filters - Exclude INACTIVE leads from the main list and stats
    const activeLeads = leads.filter(l => l.status !== 'INACTIVE');

    const filteredLeads = activeLeads.filter(lead => {
        // Search filter
        if (searchQuery && !lead.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !lead.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !lead.contactPhone.includes(searchQuery)) {
            return false;
        }

        // Status filter
        if (filterStatus !== 'all' && lead.status !== filterStatus) return false;

        // Stage filter
        if (filterStage !== 'all' && lead.stage !== filterStage) return false;

        // User filter
        if (filterUser !== 'all' && lead.assignedToUserId !== filterUser && lead.createdBy !== filterUser) return false;

        // Region filter
        if (filterRegion !== 'all' && lead.regionName !== filterRegion) return false;

        return true;
    });

    const handleExportExcel = () => {
        const exportData = filteredLeads.map(lead => ({
            'School Name': lead.schoolName,
            'Region': lead.regionName,
            'Contact Person': lead.contactPerson,
            'Phone': lead.contactPhone,
            'Email': lead.contactEmail || 'N/A',
            'Address': lead.address,
            'Status': lead.status,
            'Stage': lead.stage,
            'Assigned To': lead.assignedToName || 'Unassigned',
            'Created Date': new Date(lead.createdAt).toLocaleDateString(),
            'Is Chain': lead.isChain ? 'Yes' : 'No',
            'Chain Name': lead.chainName || 'N/A',
            'Remarks': lead.remarks
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Leads');
        XLSX.writeFile(wb, `g2M_Leads_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleExportCSV = () => {
        const exportData = filteredLeads.map(lead => ({
            'School Name': lead.schoolName,
            'Region': lead.regionName,
            'Contact Person': lead.contactPerson,
            'Phone': lead.contactPhone,
            'Email': lead.contactEmail || 'N/A',
            'Address': lead.address,
            'Status': lead.status,
            'Stage': lead.stage,
            'Assigned To': lead.assignedToName || 'Unassigned',
            'Created Date': new Date(lead.createdAt).toLocaleDateString(),
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `g2M_Leads_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CONVERTED': return 'success';
            case 'CANCELLED': return 'error';
            case 'PENDING': return 'warning';
            case 'LOCKED': return 'info';
            case 'POOL': return 'default';
            case 'INACTIVE': return 'default';
            default: return 'default';
        }
    };

    const getDaysRemaining = (lockedUntil?: number) => {
        if (!lockedUntil) return null;
        const now = Date.now();
        const diff = lockedUntil - now;
        if (diff <= 0) return 0;
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const stats = [
        { title: 'Total Leads', value: activeLeads.length, icon: <AssignmentIcon />, color: '#1976d2' },
        { title: 'Assigned', value: activeLeads.filter(l => l.assignedToUserId).length, icon: <AssignmentIndIcon />, color: '#0288d1' },
        { title: 'To Assign', value: activeLeads.filter(l => l.status === 'POOL').length, icon: <AssignmentLateIcon />, color: '#ed6c02' },
        { title: 'Demo Showed', value: activeLeads.filter(l => l.stage === 'DEMO_SHOWED').length, icon: <SlideshowIcon />, color: '#9c27b0' },
        { title: 'Negotiation', value: activeLeads.filter(l => l.stage === 'NEGOTIATION').length, icon: <HandshakeIcon />, color: '#ff9800' },
        { title: 'Converted', value: activeLeads.filter(l => l.status === 'CONVERTED').length, icon: <CheckCircleIcon />, color: '#2e7d32' },
        { title: 'Cancelled', value: activeLeads.filter(l => l.status === 'CANCELLED').length, icon: <CancelIcon />, color: '#d32f2f' },
    ];

    const uniqueRegions = Array.from(new Set(leads.map(l => l.regionName)));

    const handleViewLead = (leadId: string) => {
        setSelectedLeadId(leadId);
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setSelectedLeadId(null);
        // Refresh data to reflect any changes
        fetchData();
    };

    const handleMarkInactiveClick = (lead: Lead) => {
        setLeadToInactive(lead);
        setOpenInactiveDialog(true);
    };

    const handleConfirmInactive = async () => {
        if (leadToInactive) {
            try {
                await updateLeadStatus(leadToInactive.id, 'INACTIVE');
                setOpenInactiveDialog(false);
                setLeadToInactive(null);
                fetchData();
            } catch (error) {
                console.error("Failed to mark lead as inactive", error);
                alert("Failed to mark lead as inactive");
            }
        }
    };

    if (loading) return <PageLoading message="Loading all leads..." />;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
                <Typography variant="h4">All Leads</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={handleExportExcel}
                    >
                        Export Excel
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleExportCSV}
                    >
                        Export CSV
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Stats Summary */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                {stats.map((stat, index) => (
                    <Paper key={index} sx={{ p: 2, flex: '1 1 150px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                            <Typography variant="body2" color="text.secondary" fontWeight="bold">
                                {stat.title}
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" sx={{ color: stat.color }}>
                                {stat.value}
                            </Typography>
                        </Box>
                        <Box sx={{
                            bgcolor: `${stat.color}20`,
                            p: 1,
                            borderRadius: '50%',
                            display: 'flex',
                            color: stat.color
                        }}>
                            {stat.icon}
                        </Box>
                    </Paper>
                ))}
            </Box>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <FilterListIcon />
                    <Typography variant="h6">Filters & Search</Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <TextField
                        placeholder="Search by school, contact, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ flex: '1 1 300px' }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <FormControl sx={{ minWidth: 150 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={filterStatus}
                            label="Status"
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <MenuItem value="all">All</MenuItem>
                            <MenuItem value="PENDING">Pending</MenuItem>
                            <MenuItem value="LOCKED">Locked</MenuItem>
                            <MenuItem value="POOL">Pool</MenuItem>
                            <MenuItem value="CONVERTED">Converted</MenuItem>
                            <MenuItem value="CANCELLED">Cancelled</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl sx={{ minWidth: 150 }}>
                        <InputLabel>Stage</InputLabel>
                        <Select
                            value={filterStage}
                            label="Stage"
                            onChange={(e) => setFilterStage(e.target.value)}
                        >
                            <MenuItem value="all">All</MenuItem>
                            <MenuItem value="NEW">New</MenuItem>
                            <MenuItem value="CONTACTED">Contacted</MenuItem>
                            <MenuItem value="DEMO_SCHEDULED">Demo Scheduled</MenuItem>
                            <MenuItem value="DEMO_SHOWED">Demo Showed</MenuItem>
                            <MenuItem value="QUOTATION_SENT">Quotation Sent</MenuItem>
                            <MenuItem value="NEGOTIATION">Negotiation</MenuItem>
                            <MenuItem value="CONVERTED">Converted</MenuItem>
                            <MenuItem value="CANCELLED">Cancelled</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl sx={{ minWidth: 150 }}>
                        <InputLabel>User</InputLabel>
                        <Select
                            value={filterUser}
                            label="User"
                            onChange={(e) => setFilterUser(e.target.value)}
                        >
                            <MenuItem value="all">All</MenuItem>
                            {users.filter(u => u.role === 'distributor').map(user => (
                                <MenuItem key={user.id} value={user.id}>{user.fullName}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl sx={{ minWidth: 150 }}>
                        <InputLabel>Region</InputLabel>
                        <Select
                            value={filterRegion}
                            label="Region"
                            onChange={(e) => setFilterRegion(e.target.value)}
                        >
                            <MenuItem value="all">All</MenuItem>
                            {uniqueRegions.map(region => (
                                <MenuItem key={region} value={region}>{region}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Showing {filteredLeads.length} of {activeLeads.length} leads
                </Typography>
            </Paper>

            {/* Leads Grid */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 2 }}>
                {filteredLeads.map((lead) => (
                    <Card key={lead.id} sx={{ display: 'flex', flexDirection: 'column' }}>
                        <CardContent sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="h6" component="div" noWrap>
                                    {lead.schoolName}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    <Chip
                                        label={lead.status}
                                        color={getStatusColor(lead.status) as any}
                                        size="small"
                                    />
                                </Box>
                            </Box>

                            <Chip
                                label={(lead.stage || 'NEW').replace('_', ' ')}
                                sx={{ mb: 1, bgcolor: getStageColor(lead.stage || 'NEW'), color: 'white' }}
                                size="small"
                            />

                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                📍 {lead.regionName}
                            </Typography>

                            <Typography variant="body2" gutterBottom>
                                👤 {lead.contactPerson}
                            </Typography>

                            <Typography variant="body2" gutterBottom>
                                📞 {lead.contactPhone}
                            </Typography>

                            {lead.contactEmail && (
                                <Typography variant="body2" gutterBottom noWrap>
                                    ✉️ {lead.contactEmail}
                                </Typography>
                            )}

                            {lead.assignedToName && (
                                <Typography variant="body2" color="primary" gutterBottom>
                                    Assigned: {lead.assignedToName}
                                </Typography>
                            )}

                            {lead.status === 'LOCKED' && lead.lockedUntil && (
                                <Box sx={{ mt: 1, mb: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                                    <Typography variant="caption" display="block" fontWeight="bold">
                                        🔒 Locked Until: {new Date(lead.lockedUntil).toLocaleDateString()}
                                    </Typography>
                                    <Typography variant="caption" color={getDaysRemaining(lead.lockedUntil)! < 30 ? 'error.main' : 'success.main'}>
                                        ⏳ {getDaysRemaining(lead.lockedUntil)} days remaining
                                    </Typography>
                                </Box>
                            )}

                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Lead by: {users.find(u => u.id === lead.createdBy)?.fullName || 'Unknown'}
                            </Typography>

                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                                Created: {new Date(lead.createdAt).toLocaleDateString()}
                            </Typography>
                        </CardContent>

                        <CardActions>
                            <Tooltip title="View Details">
                                <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleViewLead(lead.id)}
                                >
                                    <VisibilityIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit Lead">
                                <IconButton
                                    size="small"
                                    color="secondary"
                                    onClick={() => handleViewLead(lead.id)}
                                >
                                    <EditIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Mark as Inactive">
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleMarkInactiveClick(lead)}
                                >
                                    <BlockIcon />
                                </IconButton>
                            </Tooltip>
                        </CardActions>
                    </Card>
                ))}
            </Box>

            {filteredLeads.length === 0 && (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary">
                        No leads found matching your filters
                    </Typography>
                </Paper>
            )}

            {/* Lead Detail Modal */}
            <Dialog
                open={openModal}
                onClose={handleCloseModal}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        Lead Details
                        <IconButton onClick={handleCloseModal}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    {selectedLeadId && (
                        <LeadDetailContent
                            leadId={selectedLeadId}
                            onClose={handleCloseModal}
                            onUpdate={() => {
                                fetchData();
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Inactive Confirmation Dialog */}
            <Dialog
                open={openInactiveDialog}
                onClose={() => setOpenInactiveDialog(false)}
            >
                <DialogTitle>Confirm Inactive</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to mark <strong>{leadToInactive?.schoolName}</strong> as inactive?
                        This will remove it from the active leads list and stats.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenInactiveDialog(false)}>Cancel</Button>
                    <Button onClick={handleConfirmInactive} color="error" autoFocus>
                        Mark Inactive
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AllLeads;
