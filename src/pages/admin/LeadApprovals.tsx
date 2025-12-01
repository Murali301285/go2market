import React, { useEffect, useState } from 'react';
import {
    Box, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Dialog, DialogTitle, DialogContent, DialogActions, Alert
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { getPendingLeads, approveLead, rejectLead } from '../../services/leadService';
import { getUsers } from '../../services/userService';
import type { Lead, User } from '../../types';
import PageLoading from '../../components/common/PageLoading';

const LeadApprovals: React.FC = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [open, setOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [leadsData, usersData] = await Promise.all([
                getPendingLeads(),
                getUsers()
            ]);
            setLeads(leadsData);
            setUsers(usersData);
        } catch (error: any) {
            console.error("Failed to fetch data", error);
            setError(error.message || "Failed to fetch pending leads");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleActionClick = (lead: Lead) => {
        setSelectedLead(lead);
        setOpen(true);
    };

    const handleApprove = async () => {
        if (!selectedLead) return;
        setProcessing(true);
        try {
            // Find the user to get their default lock-in period
            const user = users.find(u => u.id === selectedLead.createdBy);
            const lockDuration = user?.defaultLockInMonths || 3; // Default to 3 if not found

            await approveLead(selectedLead.id, lockDuration);
            setOpen(false);
            fetchData();
        } catch (error) {
            console.error("Failed to approve lead", error);
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedLead) return;
        setProcessing(true);
        try {
            await rejectLead(selectedLead.id);
            setOpen(false);
            fetchData();
        } catch (error) {
            console.error("Failed to reject lead", error);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <PageLoading />;

    return (
        <Box>
            <Typography variant="h4" gutterBottom>Pending Approvals</Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>School Name</TableCell>
                            <TableCell>Region</TableCell>
                            <TableCell>Submitted By</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {leads.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center">No pending leads.</TableCell>
                            </TableRow>
                        ) : (
                            leads.map((lead) => {
                                const user = users.find(u => u.id === lead.createdBy);
                                return (
                                    <TableRow key={lead.id}>
                                        <TableCell>{lead.schoolName}</TableCell>
                                        <TableCell>{lead.regionName}</TableCell>
                                        <TableCell>{user?.fullName || 'Unknown'}</TableCell>
                                        <TableCell>{new Date(lead.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => handleActionClick(lead)}
                                            >
                                                Review
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Review Lead</DialogTitle>
                <DialogContent>
                    {selectedLead && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                            <Alert severity="info">
                                Please verify if <strong>{selectedLead.schoolName}</strong> already exists in the system.
                            </Alert>

                            <Typography><strong>School:</strong> {selectedLead.schoolName}</Typography>
                            <Typography><strong>Address:</strong> {selectedLead.address}</Typography>
                            <Typography><strong>Region:</strong> {selectedLead.regionName}</Typography>
                            <Typography><strong>Contact:</strong> {selectedLead.contactPerson} ({selectedLead.contactPhone})</Typography>
                            <Typography><strong>Remarks:</strong> {selectedLead.remarks}</Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleReject} color="error" startIcon={<CloseIcon />} disabled={processing}>
                        Reject (To Pool)
                    </Button>
                    <Button onClick={handleApprove} color="success" variant="contained" startIcon={<CheckIcon />} disabled={processing}>
                        Approve
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default LeadApprovals;
