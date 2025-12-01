import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, TextField, Button, MenuItem, Select, FormControl, InputLabel,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
    IconButton, Tooltip, Chip, InputAdornment, Dialog, DialogContent, DialogTitle
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import * as XLSX from 'xlsx';
import { getAllLeads } from '../../services/leadService';
import { getUsers } from '../../services/userService';
import type { Lead, User } from '../../types';
import PageLoading from '../../components/common/PageLoading';
import SalesFunnel from '../../components/dashboard/SalesFunnel';
import LeadDetailContent from '../../components/leads/LeadDetailContent';
import { getStageColor } from '../../utils/colors';

const LeadStatus: React.FC = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
    const [showData, setShowData] = useState(false);

    // Modal State
    const [openModal, setOpenModal] = useState(false);
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

    // Filters
    const [filterUser, setFilterUser] = useState('all');
    const [filterRegion, setFilterRegion] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const fetchData = async () => {
        try {
            const [leadsData, usersData] = await Promise.all([
                getAllLeads(),
                getUsers()
            ]);
            setLeads(leadsData);
            setUsers(usersData);
            // If showing data, re-filter
            if (showData) {
                // We need to re-apply filters if we just refreshed data
                // But for simplicity, we'll just update the leads state and let the user click Show again or handle it in useEffect if needed.
                // Actually, let's just update filteredLeads if we can.
                // For now, simple refresh.
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleShow = () => {
        let result = leads;

        if (filterUser !== 'all') {
            result = result.filter(l => l.assignedToUserId === filterUser);
        }

        if (filterRegion !== 'all') {
            result = result.filter(l => l.regionName === filterRegion);
        }

        setFilteredLeads(result);
        setShowData(true);
        setPage(0);
    };

    const getProcessedLeads = () => {
        if (!searchQuery) return filteredLeads;
        const lowerQuery = searchQuery.toLowerCase();
        return filteredLeads.filter(l =>
            l.schoolName.toLowerCase().includes(lowerQuery) ||
            l.regionName.toLowerCase().includes(lowerQuery)
        );
    };

    const processedLeads = getProcessedLeads();

    // Stats
    const total = processedLeads.length;
    const active = processedLeads.filter(l => l.status === 'LOCKED').length;
    const demoShowed = processedLeads.filter(l => l.stage === 'DEMO_SHOWED').length;
    const negotiation = processedLeads.filter(l => l.stage === 'NEGOTIATION').length;
    const converted = processedLeads.filter(l => l.status === 'CONVERTED').length;
    const cancelled = processedLeads.filter(l => l.status === 'CANCELLED').length;
    const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : '0';

    const handleExport = () => {
        const exportData = processedLeads.map((lead, index) => ({
            'Sl No': index + 1,
            'School Name': lead.schoolName,
            'Region': lead.regionName,
            'Created Date': new Date(lead.createdAt).toLocaleDateString(),
            'Current Status': lead.stage,
            'Days Left': lead.lockedUntil ? Math.ceil((lead.lockedUntil - Date.now()) / (1000 * 60 * 60 * 24)) : '-',
            'Updated On': lead.updates && lead.updates.length > 0 ? new Date(lead.updates[lead.updates.length - 1].timestamp).toLocaleDateString() : '-'
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "LeadStatus");
        XLSX.writeFile(wb, "LeadStatus.xlsx");
    };

    const handleViewLead = (leadId: string) => {
        setSelectedLeadId(leadId);
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setSelectedLeadId(null);
        // Refresh data when closing modal to reflect changes
        fetchData().then(() => {
            if (showData) handleShow();
        });
    };

    const uniqueRegions = Array.from(new Set(leads.map(l => l.regionName)));

    if (loading) return <PageLoading />;

    return (
        <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">Lead Status</Typography>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Incharge (User)</InputLabel>
                        <Select
                            value={filterUser}
                            label="Incharge (User)"
                            onChange={(e) => setFilterUser(e.target.value)}
                        >
                            <MenuItem value="all">All Users</MenuItem>
                            {users.filter(u => u.role === 'distributor').map(user => (
                                <MenuItem key={user.id} value={user.id}>{user.fullName}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Region</InputLabel>
                        <Select
                            value={filterRegion}
                            label="Region"
                            onChange={(e) => setFilterRegion(e.target.value)}
                        >
                            <MenuItem value="all">All Regions</MenuItem>
                            {uniqueRegions.map(r => (
                                <MenuItem key={r} value={r}>{r}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Button variant="contained" onClick={handleShow} startIcon={<FilterListIcon />}>
                        Show
                    </Button>
                </Box>
            </Paper>

            {showData && (
                <>
                    {/* Stats Cards */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                        {[
                            { title: 'Total Leads', value: total, color: '#1976d2' },
                            { title: 'Active', value: active, color: '#0288d1' },
                            { title: 'Demo Showed', value: demoShowed, color: '#9c27b0' },
                            { title: 'Negotiation', value: negotiation, color: '#ed6c02' },
                            { title: 'Converted', value: converted, color: '#2e7d32' },
                            { title: 'Cancelled', value: cancelled, color: '#d32f2f' },
                            { title: 'Conv. Rate', value: `${conversionRate}%`, color: '#4caf50' },
                        ].map((stat, index) => (
                            <Paper key={index} sx={{ p: 2, flex: '1 1 150px', textAlign: 'center', bgcolor: `${stat.color}10` }}>
                                <Typography variant="caption" color="text.secondary">{stat.title}</Typography>
                                <Typography variant="h5" fontWeight="bold" color={stat.color}>{stat.value}</Typography>
                            </Paper>
                        ))}
                    </Box>

                    {/* Charts */}
                    <Box sx={{ display: 'flex', gap: 3, mb: 4, flexDirection: { xs: 'column', md: 'row' } }}>
                        <Box sx={{ flex: 1 }}>
                            <SalesFunnel leads={processedLeads} title="Sales Funnel" />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Paper sx={{ p: 3, height: '100%' }}>
                                <Typography variant="h6" gutterBottom fontWeight="bold">
                                    Stage Distribution
                                </Typography>
                                <Box sx={{ mt: 3 }}>
                                    {[
                                        { label: 'New', count: processedLeads.filter(l => l.stage === 'NEW').length, color: '#2196f3' },
                                        { label: 'Contacted', count: processedLeads.filter(l => l.stage === 'CONTACTED').length, color: '#03a9f4' },
                                        { label: 'Demo Scheduled', count: processedLeads.filter(l => l.stage === 'DEMO_SCHEDULED').length, color: '#00bcd4' },
                                        { label: 'Demo Showed', count: processedLeads.filter(l => l.stage === 'DEMO_SHOWED').length, color: '#9c27b0' },
                                        { label: 'Quotation Sent', count: processedLeads.filter(l => l.stage === 'QUOTATION_SENT').length, color: '#673ab7' },
                                        { label: 'Negotiation', count: processedLeads.filter(l => l.stage === 'NEGOTIATION').length, color: '#ff9800' },
                                        { label: 'Converted', count: processedLeads.filter(l => l.stage === 'CONVERTED').length, color: '#4caf50' },
                                        { label: 'Cancelled', count: processedLeads.filter(l => l.stage === 'CANCELLED').length, color: '#f44336' },
                                        { label: 'Expired', count: processedLeads.filter(l => l.stage === 'EXPIRED').length, color: '#9e9e9e' },
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
                                                    width: total > 0 ? `${(stage.count / total) * 100}%` : '0%',
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

                    {/* Data Table */}
                    <Paper sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <TextField
                                placeholder="Search..."
                                size="small"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>
                                }}
                            />
                            <Button startIcon={<DownloadIcon />} onClick={handleExport}>Export</Button>
                        </Box>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Sl No</TableCell>
                                        <TableCell>School Name</TableCell>
                                        <TableCell>Region</TableCell>
                                        <TableCell>Created Date</TableCell>
                                        <TableCell>Current Status</TableCell>
                                        <TableCell>Days Left</TableCell>
                                        <TableCell>Updated On</TableCell>
                                        <TableCell>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {processedLeads.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((lead, index) => (
                                        <TableRow key={lead.id}>
                                            <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                                            <TableCell>{lead.schoolName}</TableCell>
                                            <TableCell>{lead.regionName}</TableCell>
                                            <TableCell>{new Date(lead.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={lead.stage}
                                                    size="small"
                                                    sx={{ bgcolor: getStageColor(lead.stage), color: 'white' }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {lead.lockedUntil ? Math.ceil((lead.lockedUntil - Date.now()) / (1000 * 60 * 60 * 24)) : '-'}
                                            </TableCell>
                                            <TableCell>
                                                {lead.updates && lead.updates.length > 0 ? new Date(lead.updates[lead.updates.length - 1].timestamp).toLocaleDateString() : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip title="View & Edit">
                                                    <IconButton color="primary" onClick={() => handleViewLead(lead.id)}>
                                                        <VisibilityIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            component="div"
                            count={processedLeads.length}
                            page={page}
                            onPageChange={(_e, newPage) => setPage(newPage)}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={(e) => {
                                setRowsPerPage(parseInt(e.target.value, 10));
                                setPage(0);
                            }}
                            rowsPerPageOptions={[10, 20, 50, { label: 'All', value: -1 }]}
                        />
                    </Paper>
                </>
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
                                // Refresh data when update happens
                                fetchData().then(() => {
                                    if (showData) handleShow();
                                });
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default LeadStatus;
