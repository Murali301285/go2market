import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Paper, Divider, Chip, Button, TextField, List, ListItem, ListItemText
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';
import { getLeadById, addLeadUpdate, claimLead } from '../../services/leadService';
import type { Lead } from '../../types';
import PageLoading from '../../components/common/PageLoading';

const LeadDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user, userProfile } = useAuth();
    const navigate = useNavigate();
    const [lead, setLead] = useState<Lead | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const { register, handleSubmit, reset } = useForm<{ status: string; remarks: string }>();

    const fetchLead = useCallback(async () => {
        if (id) {
            const data = await getLeadById(id);
            setLead(data);
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchLead();
    }, [fetchLead]);

    const handleUpdate = async (data: { status: string; remarks: string }) => {
        if (!lead || !user) return;
        setUpdating(true);
        try {
            await addLeadUpdate(lead.id, {
                status: data.status,
                remarks: data.remarks,
                updatedBy: user.uid
            });
            reset();
            fetchLead(); // Refresh
        } catch (error) {
            console.error("Failed to update lead", error);
        } finally {
            setUpdating(false);
        }
    };

    const handleClaim = async () => {
        if (!lead || !user || !userProfile) return;
        if (window.confirm('Are you sure you want to claim this lead?')) {
            setUpdating(true);
            try {
                await claimLead(lead.id, user.uid, userProfile.fullName, userProfile.defaultLockInMonths);
                navigate('/user/leads');
            } catch (error) {
                console.error("Failed to claim lead", error);
            } finally {
                setUpdating(false);
            }
        }
    };

    if (loading) return <PageLoading />;
    if (!lead) return <Typography>Lead not found</Typography>;

    const isOwner = user?.uid === lead.assignedToUserId;
    const isPool = lead.status === 'POOL';
    const canUpdate = isOwner && (lead.status === 'LOCKED' || lead.status === 'PENDING');

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">{lead.schoolName}</Typography>
                <Chip label={lead.status} color="primary" />
            </Box>

            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {/* Left Column: Details */}
                <Box sx={{ flex: '1 1 600px' }}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>Lead Details</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                            <Box>
                                <Typography variant="subtitle2">Region</Typography>
                                <Typography>{lead.regionName}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2">Contact Person</Typography>
                                <Typography>{lead.contactPerson}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2">Phone</Typography>
                                <Typography>{lead.contactPhone}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2">Email</Typography>
                                <Typography>{lead.contactEmail || 'N/A'}</Typography>
                            </Box>
                            <Box sx={{ gridColumn: '1 / -1' }}>
                                <Typography variant="subtitle2">Address</Typography>
                                <Typography>{lead.address}</Typography>
                            </Box>
                            <Box sx={{ gridColumn: '1 / -1' }}>
                                <Typography variant="subtitle2">Initial Remarks</Typography>
                                <Typography>{lead.remarks}</Typography>
                            </Box>
                        </Box>
                    </Paper>

                    {/* History */}
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>Activity History</Typography>
                        <List>
                            {lead.updates && lead.updates.length > 0 ? (
                                lead.updates.map((update, index) => (
                                    <React.Fragment key={index}>
                                        <ListItem alignItems="flex-start">
                                            <ListItemText
                                                primary={update.status}
                                                secondary={
                                                    <>
                                                        <Typography component="span" variant="body2" color="text.primary">
                                                            {new Date(update.timestamp).toLocaleString()}
                                                        </Typography>
                                                        {" — " + update.remarks}
                                                    </>
                                                }
                                            />
                                        </ListItem>
                                        <Divider component="li" />
                                    </React.Fragment>
                                ))
                            ) : (
                                <Typography color="text.secondary">No updates yet.</Typography>
                            )}
                        </List>
                    </Paper>
                </Box>

                {/* Right Column: Actions */}
                <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                    {isPool ? (
                        <Paper sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="h6" gutterBottom>General Pool</Typography>
                            <Typography paragraph>This lead is currently available.</Typography>
                            <Button
                                variant="contained"
                                color="secondary"
                                fullWidth
                                onClick={handleClaim}
                                disabled={updating}
                            >
                                Claim Lead
                            </Button>
                        </Paper>
                    ) : canUpdate ? (
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>Add Update</Typography>
                            <form onSubmit={handleSubmit(handleUpdate)}>
                                <TextField
                                    label="Status Update (e.g. Demo Showed)"
                                    fullWidth
                                    margin="normal"
                                    {...register('status', { required: true })}
                                />
                                <TextField
                                    label="Remarks"
                                    fullWidth
                                    multiline
                                    rows={3}
                                    margin="normal"
                                    {...register('remarks', { required: true })}
                                />
                                <Button
                                    type="submit"
                                    variant="contained"
                                    fullWidth
                                    sx={{ mt: 2 }}
                                    disabled={updating}
                                >
                                    Add Update
                                </Button>
                            </form>
                        </Paper>
                    ) : (
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="body1" color="text.secondary">
                                You cannot edit this lead.
                                {lead.assignedToName && ` Assigned to: ${lead.assignedToName}`}
                            </Typography>
                        </Paper>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default LeadDetail;
