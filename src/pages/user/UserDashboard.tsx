import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Paper, TextField, MenuItem, Select, FormControl, InputLabel,
    InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useAuth } from '../../hooks/useAuth';
import { getLeadsByUserId } from '../../services/leadService';
import type { Lead } from '../../types';
import SalesFunnel from '../../components/dashboard/SalesFunnel';
import PageLoading from '../../components/common/PageLoading';
import StatsSummary from '../../components/dashboard/StatsSummary';

const UserDashboard: React.FC = () => {
    const { user } = useAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStage, setSelectedStage] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    useEffect(() => {
        const fetchLeads = async () => {
            if (user) {
                try {
                    const data = await getLeadsByUserId(user.uid);
                    setLeads(data);
                } catch (error) {
                    console.error("Failed to fetch leads", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchLeads();
    }, [user]);

    // Apply filters
    const filteredLeads = leads.filter(lead => {
        // Search filter
        if (searchQuery && !lead.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !lead.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        if (selectedStage !== 'all' && lead.stage !== selectedStage) return false;
        if (selectedStatus !== 'all' && lead.status !== selectedStatus) return false;
        return true;
    });

    if (loading) return <PageLoading message="Loading your dashboard..." />;

    // Calculate Stats
    const totalLeads = filteredLeads.length;
    const stats = {
        total: filteredLeads.length,
        active: filteredLeads.filter(l => l.status === 'LOCKED').length,
        negotiation: filteredLeads.filter(l => l.stage === 'NEGOTIATION').length,
        demoShowed: filteredLeads.filter(l => l.stage === 'DEMO_SHOWED').length,
        converted: filteredLeads.filter(l => l.status === 'CONVERTED').length,
        cancelled: filteredLeads.filter(l => l.status === 'CANCELLED').length,
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">My Dashboard</Typography>

            {/* Stats Summary */}
            <StatsSummary stats={stats} />

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <FilterListIcon />
                    <Typography variant="h6">Filters</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <TextField
                        placeholder="Search by school or contact..."
                        size="small"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ minWidth: 250 }}
                    />

                    <FormControl sx={{ minWidth: 200 }} size="small">
                        <InputLabel>Stage</InputLabel>
                        <Select
                            value={selectedStage}
                            label="Stage"
                            onChange={(e) => setSelectedStage(e.target.value)}
                        >
                            <MenuItem value="all">All Stages</MenuItem>
                            <MenuItem value="NEW">New</MenuItem>
                            <MenuItem value="CONTACTED">Contacted</MenuItem>
                            <MenuItem value="DEMO_SCHEDULED">Demo Scheduled</MenuItem>
                            <MenuItem value="DEMO_SHOWED">Demo Showed</MenuItem>
                            <MenuItem value="QUOTATION_SENT">Quotation Sent</MenuItem>
                            <MenuItem value="NEGOTIATION">Negotiation</MenuItem>
                            <MenuItem value="CONVERTED">Converted</MenuItem>
                            <MenuItem value="CANCELLED">Cancelled</MenuItem>
                            <MenuItem value="EXPIRED">Expired</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl sx={{ minWidth: 200 }} size="small">
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={selectedStatus}
                            label="Status"
                            onChange={(e) => setSelectedStatus(e.target.value)}
                        >
                            <MenuItem value="all">All Status</MenuItem>
                            <MenuItem value="PENDING">Pending Approval</MenuItem>
                            <MenuItem value="LOCKED">Locked/Active</MenuItem>
                            <MenuItem value="POOL">General Pool</MenuItem>
                            <MenuItem value="CONVERTED">Converted</MenuItem>
                            <MenuItem value="CANCELLED">Cancelled</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Paper>

            {/* Charts Section - Side by Side */}
            <Box sx={{ display: 'flex', gap: 3, mb: 4, flexDirection: { xs: 'column', md: 'row' } }}>
                <Box sx={{ flex: 1 }}>
                    <SalesFunnel leads={filteredLeads} title="My Sales Funnel" />
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">
                            Stage Distribution
                        </Typography>
                        <Box sx={{ mt: 3 }}>
                            {[
                                { label: 'New', count: filteredLeads.filter(l => l.stage === 'NEW').length, color: '#2196f3' },
                                { label: 'Contacted', count: filteredLeads.filter(l => l.stage === 'CONTACTED').length, color: '#03a9f4' },
                                { label: 'Demo Scheduled', count: filteredLeads.filter(l => l.stage === 'DEMO_SCHEDULED').length, color: '#00bcd4' },
                                { label: 'Demo Showed', count: filteredLeads.filter(l => l.stage === 'DEMO_SHOWED').length, color: '#9c27b0' },
                                { label: 'Quotation Sent', count: filteredLeads.filter(l => l.stage === 'QUOTATION_SENT').length, color: '#673ab7' },
                                { label: 'Negotiation', count: filteredLeads.filter(l => l.stage === 'NEGOTIATION').length, color: '#ff9800' },
                                { label: 'Converted', count: filteredLeads.filter(l => l.stage === 'CONVERTED').length, color: '#4caf50' },
                                { label: 'Cancelled', count: filteredLeads.filter(l => l.stage === 'CANCELLED').length, color: '#f44336' },
                                { label: 'Expired', count: filteredLeads.filter(l => l.stage === 'EXPIRED').length, color: '#9e9e9e' },
                            ].map((stage) => (
                                <Box key={stage.label} sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="body2" fontWeight="medium">
                                            {stage.label}
                                        </Typography>
                                        <Typography variant="body2" fontWeight="bold" color={stage.color}>
                                            {stage.count}
                                        </Typography>
                                    </Box>
                                    <Box sx={{
                                        width: '100%',
                                        height: 8,
                                        bgcolor: 'action.hover',
                                        borderRadius: 1,
                                        overflow: 'hidden'
                                    }}>
                                        <Box sx={{
                                            width: totalLeads > 0 ? `${(stage.count / totalLeads) * 100}%` : '0%',
                                            height: '100%',
                                            bgcolor: stage.color,
                                            transition: 'width 0.3s ease'
                                        }} />
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Paper>
                </Box>
            </Box>
        </Box>
    );
};

export default UserDashboard;
