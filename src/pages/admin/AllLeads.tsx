import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Paper, TextField, Button, Chip, Card, CardContent, CardActions,
    InputAdornment, MenuItem, Select, FormControl, InputLabel, IconButton, Tooltip, Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import * as XLSX from 'xlsx';
import { getAllLeads } from '../../services/leadService';
import { getUsers } from '../../services/userService';
import type { Lead, User } from '../../types';
import PageLoading from '../../components/common/PageLoading';
import { useNavigate } from 'react-router-dom';
import StatsSummary from '../../components/dashboard/StatsSummary';

const AllLeads: React.FC = () => {
    const navigate = useNavigate();
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

    useEffect(() => {
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
        fetchData();
    }, []);

    // Apply filters
    const filteredLeads = leads.filter(lead => {
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
            default: return 'default';
        }
    };

    const getStageColor = (stage: string) => {
        switch (stage) {
            case 'CONVERTED': return 'success';
            case 'NEGOTIATION': return 'info';
            case 'QUOTATION_SENT': return 'primary';
            case 'DEMO_SHOWED': return 'secondary';
            case 'CANCELLED': return 'error';
            case 'EXPIRED': return 'default';
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

    const stats = {
        total: leads.length,
        active: leads.filter(l => l.status === 'LOCKED').length,
        negotiation: leads.filter(l => l.stage === 'NEGOTIATION').length,
        demoShowed: leads.filter(l => l.stage === 'DEMO_SHOWED').length,
        converted: leads.filter(l => l.status === 'CONVERTED').length,
        cancelled: leads.filter(l => l.status === 'CANCELLED').length,
    };

    const uniqueRegions = Array.from(new Set(leads.map(l => l.regionName)));

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
            <StatsSummary stats={stats} />

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
                    Showing {filteredLeads.length} of {leads.length} leads
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
                                        color={getStatusColor(lead.status)}
                                        size="small"
                                    />
                                </Box>
                            </Box>

                            <Chip
                                label={(lead.stage || 'NEW').replace('_', ' ')}
                                color={getStageColor(lead.stage || 'NEW')}
                                size="small"
                                sx={{ mb: 1 }}
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
                                    onClick={() => navigate(`/leads/${lead.id}`)}
                                >
                                    <VisibilityIcon />
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
        </Box>
    );
};

export default AllLeads;
