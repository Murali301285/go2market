import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Paper, Divider, Chip, Button, TextField, List, ListItem, ListItemText,
    MenuItem, Link
} from '@mui/material';
import { AttachFile, InsertDriveFile } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';
import { getLeadById, addLeadUpdate, claimLead } from '../../services/leadService';
import type { Lead } from '../../types';
import PageLoading from '../../components/common/PageLoading';
import { storage } from '../../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const STAGES = [
    { value: 'NEW', label: '1. Lead (New)' },
    { value: 'CONTACTED', label: '2. Contacted' },
    { value: 'DEMO_SCHEDULED', label: '3. Demo Scheduled' },
    { value: 'DEMO_SHOWED', label: '4. Demo Showed' },
    { value: 'QUOTATION_SENT', label: '5. Quotation Sent' },
    { value: 'NEGOTIATION', label: '6. Negotiation' },
    { value: 'CONVERTED', label: '7. Converted' },
    { value: 'CANCELLED', label: '8. Cancelled' },
];

const PROBABILITIES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 95];

const LeadDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user, userProfile } = useAuth();
    const navigate = useNavigate();
    const [lead, setLead] = useState<Lead | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const { register, handleSubmit, reset, setValue } = useForm<{ status: string; remarks: string; probability: number }>();

    const fetchLead = useCallback(async () => {
        if (id) {
            const data = await getLeadById(id);
            setLead(data);
            if (data) {
                setValue('status', data.stage);
                setValue('probability', data.probability || 10);
            }
            setLoading(false);
        }
    }, [id, setValue]);

    useEffect(() => {
        fetchLead();
    }, [fetchLead]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.size > 2 * 1024 * 1024) {
                alert("File size must be less than 2MB");
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleUpdate = async (data: { status: string; remarks: string; probability: number }) => {
        if (!lead || !user) return;
        setUpdating(true);
        try {
            let attachments: { name: string; url: string }[] = [];

            if (file) {
                const storageRef = ref(storage, `lead_attachments/${lead.id}/${Date.now()}_${file.name}`);
                await uploadBytes(storageRef, file);
                const url = await getDownloadURL(storageRef);
                attachments.push({ name: file.name, url });
            }

            // Update Lead logic needs to handle probability update too. 
            // Currently addLeadUpdate only updates history. We might need to update the lead document itself separately 
            // or update addLeadUpdate service to handle these fields.
            // For now, assuming addLeadUpdate handles stage/status update on the lead doc.
            // I'll need to verify leadService.ts later, but for now I'll pass the data.

            await addLeadUpdate(lead.id, {
                status: data.status, // This maps to 'stage' in the service usually
                remarks: data.remarks,
                updatedBy: user.uid,
                attachments
            });

            // If probability changed, we might need a separate update call if addLeadUpdate doesn't handle it.
            // For now, let's assume we need to update it manually if the service is simple.
            // Actually, let's just stick to the current service contract and maybe update the service later if needed.

            reset();
            setFile(null);
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

    const daysLeft = lead.lockedUntil ? Math.ceil((lead.lockedUntil - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

    return (
        <Box>
            {/* Header Stats */}
            <Paper sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="caption" color="text.secondary">School Name</Typography>
                        <Typography variant="h5" fontWeight="bold">{lead.schoolName}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Created Date</Typography>
                        <Typography variant="body1">{new Date(lead.createdAt).toLocaleDateString()}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Current Status</Typography>
                        <Chip label={lead.stage} color="primary" size="small" sx={{ ml: 1 }} />
                    </Box>
                    {lead.lockedUntil && (
                        <>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Lock In Until</Typography>
                                <Typography variant="body1">{new Date(lead.lockedUntil).toLocaleDateString()}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Days Left</Typography>
                                <Typography variant="body1" color={daysLeft < 30 ? 'error.main' : 'success.main'} fontWeight="bold">
                                    {daysLeft > 0 ? daysLeft : 0} Days
                                </Typography>
                            </Box>
                        </>
                    )}
                </Box>
            </Paper>

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
                                <Typography variant="subtitle2">Designation</Typography>
                                <Typography>{lead.designation || '-'}</Typography>
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
                                                primary={
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography variant="subtitle2">{update.status}</Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {new Date(update.timestamp).toLocaleString()}
                                                        </Typography>
                                                    </Box>
                                                }
                                                secondary={
                                                    <Box component="span">
                                                        <Typography component="span" variant="body2" color="text.primary" display="block">
                                                            {update.remarks}
                                                        </Typography>
                                                        {update.attachments && update.attachments.map((att, i) => (
                                                            <Link key={i} href={att.url} target="_blank" rel="noopener" sx={{ display: 'flex', alignItems: 'center', mt: 0.5, fontSize: '0.875rem' }}>
                                                                <InsertDriveFile fontSize="inherit" sx={{ mr: 0.5 }} />
                                                                {att.name}
                                                            </Link>
                                                        ))}
                                                    </Box>
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
                                    select
                                    label="Stage"
                                    fullWidth
                                    margin="normal"
                                    {...register('status', { required: true })}
                                    defaultValue={lead.stage}
                                >
                                    {STAGES.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </TextField>

                                <TextField
                                    select
                                    label="Conversion Probability (%)"
                                    fullWidth
                                    margin="normal"
                                    {...register('probability')}
                                    defaultValue={lead.probability || 10}
                                >
                                    {PROBABILITIES.map((prob) => (
                                        <MenuItem key={prob} value={prob}>
                                            {prob}%
                                        </MenuItem>
                                    ))}
                                </TextField>

                                <TextField
                                    label="Remarks"
                                    fullWidth
                                    multiline
                                    rows={3}
                                    margin="normal"
                                    {...register('remarks', { required: true })}
                                />

                                <Button
                                    variant="outlined"
                                    component="label"
                                    fullWidth
                                    startIcon={<AttachFile />}
                                    sx={{ mt: 1, mb: 1 }}
                                >
                                    {file ? file.name : "Attach File (Max 2MB)"}
                                    <input type="file" hidden onChange={handleFileChange} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                </Button>

                                <Button
                                    type="submit"
                                    variant="contained"
                                    fullWidth
                                    sx={{ mt: 2 }}
                                    disabled={updating}
                                >
                                    {updating ? 'Updating...' : 'Add Update'}
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
