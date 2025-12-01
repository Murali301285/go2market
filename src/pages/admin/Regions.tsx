import React, { useEffect, useState } from 'react';
import {
    Box, Button, TextField, Typography, Paper, List, ListItem, ListItemText, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, Switch, Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { getRegions, addRegion, updateRegion, deleteRegion, toggleRegionStatus } from '../../services/regionService';
import type { Region } from '../../types';
import PageLoading from '../../components/common/PageLoading';

const Regions: React.FC = () => {
    const [regions, setRegions] = useState<Region[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [remarks, setRemarks] = useState('');

    const fetchRegions = async () => {
        try {
            const data = await getRegions();
            setRegions(data);
        } catch (error) {
            console.error("Failed to fetch regions", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRegions();
    }, []);

    const handleOpenAdd = () => {
        setEditingId(null);
        setName('');
        setRemarks('');
        setOpen(true);
    };

    const handleOpenEdit = (region: Region) => {
        setEditingId(region.id);
        setName(region.name);
        setRemarks(region.remarks || '');
        setOpen(true);
    };

    const handleSave = async () => {
        if (!name.trim()) return;

        // Check for uniqueness
        const normalizedName = name.trim().toLowerCase();
        const duplicate = regions.find(r =>
            r.name.toLowerCase() === normalizedName &&
            r.id !== editingId
        );

        if (duplicate) {
            alert('Region name must be unique!');
            return;
        }

        try {
            if (editingId) {
                await updateRegion(editingId, { name, remarks });
            } else {
                await addRegion(name, remarks);
            }
            setOpen(false);
            fetchRegions();
        } catch (error) {
            console.error("Failed to save region", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this region?')) {
            try {
                await deleteRegion(id);
                fetchRegions();
            } catch (error) {
                console.error("Failed to delete region", error);
            }
        }
    };

    const handleToggleStatus = async (region: Region) => {
        try {
            await toggleRegionStatus(region.id, region.isActive);
            fetchRegions();
        } catch (error) {
            console.error("Failed to toggle region status", error);
        }
    };

    if (loading) return <PageLoading message="Loading regions..." />;

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Regions</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenAdd}
                >
                    Add Region
                </Button>
            </Box>

            <Paper>
                <List>
                    {regions.map((region) => (
                        <ListItem
                            key={region.id}
                            secondaryAction={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Switch
                                        checked={region.isActive}
                                        onChange={() => handleToggleStatus(region)}
                                        color="primary"
                                    />
                                    <IconButton
                                        edge="end"
                                        aria-label="edit"
                                        onClick={() => handleOpenEdit(region)}
                                        sx={{ mr: 1 }}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        edge="end"
                                        aria-label="delete"
                                        onClick={() => handleDelete(region.id)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                            }
                        >
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {region.name}
                                        <Chip
                                            label={region.isActive ? 'Active' : 'Inactive'}
                                            color={region.isActive ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </Box>
                                }
                                secondary={region.remarks || 'No remarks'}
                            />
                        </ListItem>
                    ))}
                    {regions.length === 0 && (
                        <ListItem>
                            <ListItemText primary="No regions found." />
                        </ListItem>
                    )}
                </List>
            </Paper>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{editingId ? 'Edit Region' : 'Add New Region'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            autoFocus
                            label="Region Name"
                            fullWidth
                            variant="outlined"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <TextField
                            label="Remarks (Optional)"
                            fullWidth
                            variant="outlined"
                            multiline
                            rows={3}
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            helperText="Add any additional notes about this region"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained">
                        {editingId ? 'Update' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Regions;
