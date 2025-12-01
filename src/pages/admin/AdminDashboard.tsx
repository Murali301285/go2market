import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Paper, TextField, Button, MenuItem, Select, FormControl, InputLabel,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import FilterListIcon from '@mui/icons-material/FilterList';
import * as XLSX from 'xlsx';
import { getAllLeads } from '../../services/leadService';
import { getUsers } from '../../services/userService';
import type { Lead, User } from '../../types';
import PageLoading from '../../components/common/PageLoading';
import StatsCard from '../../components/dashboard/StatsCard';
import SalesFunnel from '../../components/dashboard/SalesFunnel';
import UserPerformanceChart from '../../components/dashboard/UserPerformanceChart';

const AdminDashboard: React.FC = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<string>('all');
    const [selectedStage, setSelectedStage] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [leadsData, usersData] = await Promise.all([
                    getAllLeads(),
                    getUsers()
                ]);
                setLeads(leadsData);
                setUsers(usersData);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
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
            !lead.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        if (selectedUser !== 'all' && lead.assignedToUserId !== selectedUser) return false;
        if (selectedStage !== 'all' && lead.stage !== selectedStage) return false;
        if (selectedStatus !== 'all' && lead.status !== selectedStatus) return false;
        return true;
    });

    // Calculate stats
    const totalLeads = filteredLeads.length;
    const pendingApproval = filteredLeads.filter(l => l.status === 'PENDING').length;
    const activeLeads = filteredLeads.filter(l => l.status === 'LOCKED').length;
    const converted = filteredLeads.filter(l => l.stage === 'CONVERTED').length;
    const poolLeads = filteredLeads.filter(l => l.status === 'POOL').length;

    // User performance metrics
    const userPerformance = users.map(user => {
        const userLeads = leads.filter(l => l.assignedToUserId === user.id || l.createdBy === user.id);
        return {
            user,
            generated: userLeads.filter(l => l.createdBy === user.id).length,
            demoShowed: userLeads.filter(l => l.stage === 'DEMO_SHOWED' || l.stage === 'QUOTATION_SENT' || l.stage === 'NEGOTIATION' || l.stage === 'CONVERTED').length,
            quotationSent: userLeads.filter(l => l.stage === 'QUOTATION_SENT' || l.stage === 'NEGOTIATION' || l.stage === 'CONVERTED').length,
            negotiation: userLeads.filter(l => l.stage === 'NEGOTIATION' || l.stage === 'CONVERTED').length,
            converted: userLeads.filter(l => l.stage === 'CONVERTED').length,
            cancelled: userLeads.filter(l => l.stage === 'CANCELLED').length,
            expired: userLeads.filter(l => l.stage === 'EXPIRED').length,
        };
    }).filter(perf => perf.generated > 0 || perf.user.role === 'distributor');

    const handleExportPerformance = () => {
        const exportData = userPerformance.map(perf => ({
            'User': perf.user.fullName,
            'Email': perf.user.email,
            'Leads Generated': perf.generated,
            'Demo Showed': perf.demoShowed,
            'Quotation Sent': perf.quotationSent,
            'Negotiation': perf.negotiation,
            'Converted': perf.converted,
            'Cancelled': perf.cancelled,
            'Expired': perf.expired,
            'Conversion Rate': perf.generated > 0 ? `${Math.round((perf.converted / perf.generated) * 100)}%` : '0%'
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'User Performance');
        XLSX.writeFile(wb, `User_Performance_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    if (loading) return <PageLoading message="Loading dashboard..." />;

    return (
        <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">Admin Dashboard</Typography>

            {/* Statistics Cards */}
            <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <StatsCard title="Total Leads" value={totalLeads} color="primary" />
                </Box>
                <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <StatsCard title="Pending Approval" value={pendingApproval} color="warning" />
                </Box>
                <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <StatsCard title="Active Leads" value={activeLeads} color="info" />
                </Box>
                <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <StatsCard title="Converted" value={converted} color="success" />
                </Box>
                <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <StatsCard title="Pool Leads" value={poolLeads} color="secondary" />
                </Box>
            </Box>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <FilterListIcon />
                    <Typography variant="h6">Filters</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>User</InputLabel>
                        <Select
                            value={selectedUser}
                            label="User"
                            onChange={(e) => setSelectedUser(e.target.value)}
                        >
                            <MenuItem value="all">All Users</MenuItem>
                            {users.filter(u => u.role === 'distributor').map(user => (
                                <MenuItem key={user.id} value={user.id}>{user.fullName}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl sx={{ minWidth: 200 }}>
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

                    <FormControl sx={{ minWidth: 200 }}>
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

            {/* Charts Section */}
            <Box sx={{ display: 'flex', gap: 3, mb: 4, flexDirection: { xs: 'column', md: 'row' } }}>
                <Box sx={{ flex: 1 }}>
                    <SalesFunnel
                        leads={filteredLeads}
                        title={`Conversion Funnel ${selectedUser !== 'all' ? `- ${users.find(u => u.id === selectedUser)?.fullName}` : ''}`}
                    />
                </Box>
                <Box sx={{ flex: 1 }}>
                    <UserPerformanceChart leads={filteredLeads} users={users} />
                </Box>
            </Box>

            {/* User Performance Section */}
            <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">User Performance</Typography>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <TextField
                            placeholder="Search..."
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
                            sx={{ width: 250 }}
                        />
                        <Button
                            variant="contained"
                            startIcon={<DownloadIcon />}
                            onClick={handleExportPerformance}
                            color="success"
                        >
                            Export
                        </Button>
                    </Box>
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>User</TableCell>
                                <TableCell align="right">Leads Generated</TableCell>
                                <TableCell align="right">Demo Showed</TableCell>
                                <TableCell align="right">Quotation Sent</TableCell>
                                <TableCell align="right">Negotiation</TableCell>
                                <TableCell align="right">Converted</TableCell>
                                <TableCell align="right">Cancelled</TableCell>
                                <TableCell align="right">Expired</TableCell>
                                <TableCell align="right">Conversion Rate</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {userPerformance
                                .filter(perf =>
                                    !searchQuery ||
                                    perf.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    perf.user.email.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .map((perf) => {
                                    const conversionRate = perf.generated > 0
                                        ? Math.round((perf.converted / perf.generated) * 100)
                                        : 0;

                                    return (
                                        <TableRow key={perf.user.id} hover>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {perf.user.fullName}
                                                    {!perf.user.isActive && (
                                                        <Chip label="Inactive" size="small" color="default" />
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right">{perf.generated}</TableCell>
                                            <TableCell align="right">{perf.demoShowed}</TableCell>
                                            <TableCell align="right">{perf.quotationSent}</TableCell>
                                            <TableCell align="right">{perf.negotiation}</TableCell>
                                            <TableCell align="right">
                                                <Chip
                                                    label={perf.converted}
                                                    color="success"
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Chip
                                                    label={perf.cancelled}
                                                    color="error"
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="right">{perf.expired}</TableCell>
                                            <TableCell align="right">
                                                <Chip
                                                    label={`${conversionRate}%`}
                                                    color={conversionRate >= 20 ? 'success' : conversionRate >= 10 ? 'warning' : 'default'}
                                                    size="small"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            {userPerformance.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={9} align="center">
                                        No performance data available
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default AdminDashboard;
