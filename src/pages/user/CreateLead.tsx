import React, { useEffect, useState } from 'react';
import {
    Box, Button, TextField, Typography, Paper, Checkbox, FormControlLabel, MenuItem, Alert, Dialog,
    DialogTitle, DialogContent, DialogContentText, DialogActions, CircularProgress
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { createLead } from '../../services/leadService';
import { getActiveRegions } from '../../services/regionService';
import { checkForDuplicates, validateZipCode, validatePhoneNumber } from '../../services/duplicateCheckService';
import type { Region } from '../../types';
import AddressAutocomplete from '../../components/forms/AddressAutocomplete';
import SchoolAutocomplete from '../../components/forms/SchoolAutocomplete';

const leadSchema = z.object({
    schoolName: z.string().min(3, 'School name is required'),
    regionId: z.string().min(1, 'Region is required'),
    address: z.string().min(5, 'Address is required'),
    zipCode: z.string().min(5, 'ZIP/PIN code is required').max(10, 'Invalid ZIP code'),
    landmark: z.string().optional(),
    contactPerson: z.string().min(2, 'Contact person is required'),
    contactEmail: z.string().email('Invalid email').or(z.literal('')),
    contactPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
    contactedDate: z.string().optional().refine((val) => {
        if (!val) return true;
        return new Date(val) <= new Date();
    }, { message: "Contact date cannot be in the future" }),
    isChain: z.boolean(),
    chainName: z.string().optional(),
    remarks: z.string().optional(),
});

type LeadFormInputs = z.infer<typeof leadSchema>;

const CreateLead: React.FC = () => {
    const navigate = useNavigate();
    const { user, userProfile } = useAuth();
    const [regions, setRegions] = useState<Region[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
    const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
    const [pendingLeadData, setPendingLeadData] = useState<LeadFormInputs | null>(null);
    const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);

    const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<LeadFormInputs>({
        resolver: zodResolver(leadSchema),
        defaultValues: {
            isChain: false,
            contactEmail: '',
            regionId: '',
        }
    });

    const isChain = watch('isChain');

    useEffect(() => {
        const fetchRegions = async () => {
            try {
                const data = await getActiveRegions();
                setRegions(data);
            } catch (err) {
                console.error("Failed to load regions", err);
            }
        };
        fetchRegions();
    }, []);

    const handlePlaceSelect = (place: google.maps.places.PlaceResult) => {
        setSelectedPlace(place);

        // Extract address components
        let streetAddress = '';
        let locality = '';
        let postalCode = '';
        let landmark = '';

        if (place.address_components) {
            place.address_components.forEach(component => {
                const types = component.types;

                if (types.includes('street_number')) {
                    streetAddress = component.long_name + ' ';
                }
                if (types.includes('route')) {
                    streetAddress += component.long_name;
                }
                if (types.includes('locality')) {
                    locality = component.long_name;
                }
                if (types.includes('postal_code')) {
                    postalCode = component.long_name;
                }
                if (types.includes('sublocality') || types.includes('neighborhood')) {
                    landmark = component.long_name;
                }
            });
        }

        // Auto-fill form fields
        const fullAddress = place.formatted_address || `${streetAddress}, ${locality}`;
        setValue('address', fullAddress);

        if (postalCode) {
            setValue('zipCode', postalCode);
        }

        if (landmark && !watch('landmark')) {
            setValue('landmark', landmark);
        }

        // Store place ID for future use
        if (place.place_id) {
            // We'll save this with the lead data
            console.log('Place ID:', place.place_id);
        }
    };

    const handleSchoolSelect = (place: google.maps.places.PlaceResult) => {
        setSelectedPlace(place);

        // Auto-fill School Name from place name
        if (place.name) {
            setValue('schoolName', place.name);
        }

        // Extract address components
        let streetAddress = '';
        let locality = '';
        let postalCode = '';
        let landmark = '';

        if (place.address_components) {
            place.address_components.forEach(component => {
                const types = component.types;

                if (types.includes('street_number')) {
                    streetAddress = component.long_name + ' ';
                }
                if (types.includes('route')) {
                    streetAddress += component.long_name;
                }
                if (types.includes('locality')) {
                    locality = component.long_name;
                }
                if (types.includes('postal_code')) {
                    postalCode = component.long_name;
                }
                if (types.includes('sublocality') || types.includes('neighborhood')) {
                    landmark = component.long_name;
                }
            });
        }

        // Auto-fill address fields
        const fullAddress = place.formatted_address || `${streetAddress}, ${locality}`;
        setValue('address', fullAddress);

        if (postalCode) {
            setValue('zipCode', postalCode);
        }

        if (landmark && !watch('landmark')) {
            setValue('landmark', landmark);
        }

        // Store place ID
        if (place.place_id) {
            console.log('School Place ID:', place.place_id);
        }
    };

    const createLeadWithData = async (data: LeadFormInputs, autoApprove: boolean = false) => {
        if (!user) return;

        try {
            const regionName = regions.find(r => r.id === data.regionId)?.name || '';

            // Prepare lead data, excluding undefined values
            const leadData: any = {
                schoolName: data.schoolName,
                regionId: data.regionId,
                regionName,
                address: data.address,
                zipCode: data.zipCode,
                contactPerson: data.contactPerson,
                contactPhone: data.contactPhone,
                isChain: data.isChain,
                remarks: data.remarks || '',
                contactEmail: data.contactEmail || '',
            };

            // Only add optional fields if they have values
            if (data.landmark) {
                leadData.landmark = data.landmark;
            }

            if (data.isChain && data.chainName) {
                leadData.chainName = data.chainName;
            }

            if (data.contactedDate) {
                leadData.contactedDate = new Date(data.contactedDate).getTime();
            }

            if (selectedPlace?.place_id) {
                leadData.googlePlaceId = selectedPlace.place_id;
            }

            // Pass auto-approval options if applicable
            await createLead(leadData, user.uid, autoApprove && userProfile ? {
                autoApprove: true,
                userFullName: userProfile.fullName,
                defaultLockInMonths: userProfile.defaultLockInMonths,
            } : undefined);

            navigate('/user/leads');
        } catch (err: unknown) {
            console.error(err);
            setError('Failed to create lead. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: LeadFormInputs) => {
        if (!user) return;

        // Validate ZIP code format
        if (!validateZipCode(data.zipCode)) {
            setError('Invalid ZIP/PIN code format. Please enter a valid 6-digit PIN code or 5-digit ZIP code.');
            return;
        }

        // Validate phone number format
        if (!validatePhoneNumber(data.contactPhone)) {
            setError('Invalid phone number format. Please enter a valid 10-digit phone number.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Check for duplicates
            const duplicateCheck = await checkForDuplicates(
                data.schoolName,
                data.zipCode,
                data.contactPhone,
                data.address
            );

            if (duplicateCheck.isDuplicate) {
                // Exact duplicate found - block creation
                setError(duplicateCheck.message);
                setLoading(false);
                return;
            }

            if (duplicateCheck.matchType === 'similar') {
                // Similar lead found - show warning dialog
                setDuplicateWarning(duplicateCheck.message);
                setPendingLeadData(data);
                setShowDuplicateDialog(true);
                setLoading(false);
                return;
            }

            // No duplicates, proceed with creation and auto-approve
            await createLeadWithData(data, true);

        } catch (err) {
            console.error(err);
            setError('Failed to create lead. Please try again.');
            setLoading(false);
        }
    };

    const handleProceedAnyway = async () => {
        setShowDuplicateDialog(false);
        if (pendingLeadData) {
            setLoading(true);
            await createLeadWithData(pendingLeadData);
        }
    };

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom fontWeight="bold">
                    Create New Lead
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <form onSubmit={handleSubmit(onSubmit)}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* Google School Search - Highlighted Section */}
                        <Box
                            sx={{
                                backgroundColor: 'rgba(37, 99, 235, 0.08)',
                                borderLeft: '4px solid #2563eb',
                                borderRadius: 2,
                                p: 2.5,
                                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.12)',
                                border: '1px solid rgba(37, 99, 235, 0.2)',
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                <Typography
                                    variant="subtitle1"
                                    color="primary"
                                    sx={{ fontWeight: 'bold', fontSize: '1rem' }}
                                >
                                    🎓 Quick School Search
                                </Typography>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        backgroundColor: 'white',
                                        px: 1,
                                        py: 0.5,
                                        borderRadius: 1,
                                        border: '1px solid rgba(37, 99, 235, 0.2)'
                                    }}
                                >
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                        Powered by
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#4285f4', fontSize: '0.75rem' }}>
                                        Google
                                    </Typography>
                                </Box>
                            </Box>
                            <SchoolAutocomplete
                                onSchoolSelected={handleSchoolSelect}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
                                💡 Select a school to automatically populate name, address, and location details
                            </Typography>
                        </Box>

                        <TextField
                            fullWidth
                            label="School Name"
                            {...register('schoolName')}
                            error={!!errors.schoolName}
                            helperText={errors.schoolName?.message}
                            InputLabelProps={{ shrink: true }}
                        />

                        <Controller
                            name="regionId"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    fullWidth
                                    label="Region"
                                    error={!!errors.regionId}
                                    helperText={errors.regionId?.message}
                                >
                                    {regions.map((region) => (
                                        <MenuItem key={region.id} value={region.id}>
                                            {region.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />

                        {/* Google Places Autocomplete (Optional) */}
                        <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                💡 Optional: Use Google autocomplete for faster address entry
                            </Typography>
                            <AddressAutocomplete
                                onPlaceSelected={handlePlaceSelect}
                            />
                        </Box>

                        <TextField
                            fullWidth
                            label="Address (or edit above selection)"
                            {...register('address')}
                            error={!!errors.address}
                            helperText={errors.address?.message || 'You can also enter/edit address manually'}
                            multiline
                            rows={2}
                            InputLabelProps={{ shrink: true }}
                        />

                        <TextField
                            fullWidth
                            label="ZIP / PIN Code"
                            {...register('zipCode')}
                            error={!!errors.zipCode}
                            helperText={errors.zipCode?.message || 'Enter 6-digit PIN (India) or 5-digit ZIP (US)'}
                            placeholder="e.g., 560001 or 12345"
                            InputLabelProps={{ shrink: true }}
                        />

                        <TextField
                            fullWidth
                            label="Landmark (Optional)"
                            {...register('landmark')}
                            error={!!errors.landmark}
                            helperText={errors.landmark?.message}
                            InputLabelProps={{ shrink: true }}
                        />

                        <TextField
                            fullWidth
                            label="Contact Person"
                            {...register('contactPerson')}
                            error={!!errors.contactPerson}
                            helperText={errors.contactPerson?.message}
                        />

                        <TextField
                            fullWidth
                            label="Contact Email"
                            {...register('contactEmail')}
                            error={!!errors.contactEmail}
                            helperText={errors.contactEmail?.message}
                            placeholder="optional"
                        />

                        <TextField
                            fullWidth
                            label="Contact Phone"
                            {...register('contactPhone')}
                            error={!!errors.contactPhone}
                            helperText={errors.contactPhone?.message || 'Enter 10-digit phone number'}
                            placeholder="e.g., 9876543210"
                        />

                        <TextField
                            fullWidth
                            label="Contacted Date & Time"
                            type="datetime-local"
                            {...register('contactedDate')}
                            error={!!errors.contactedDate}
                            helperText={errors.contactedDate?.message}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                max: new Date().toISOString().slice(0, 16) // Restrict to current time
                            }}
                        />

                        <Controller
                            name="isChain"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Checkbox {...field} checked={field.value} />}
                                    label="Is this part of a chain?"
                                />
                            )}
                        />

                        {isChain && (
                            <TextField
                                fullWidth
                                label="Chain Name"
                                {...register('chainName')}
                                error={!!errors.chainName}
                                helperText={errors.chainName?.message}
                            />
                        )}

                        <TextField
                            fullWidth
                            label="Remarks (Optional)"
                            {...register('remarks')}
                            error={!!errors.remarks}
                            helperText={errors.remarks?.message}
                            multiline
                            rows={3}
                        />

                        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                disabled={loading}
                                startIcon={loading && <CircularProgress size={20} />}
                            >
                                {loading ? 'Creating...' : 'Create Lead'}
                            </Button>
                            <Button
                                variant="outlined"
                                fullWidth
                                onClick={() => navigate('/user/leads')}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                        </Box>
                    </Box>
                </form>
            </Paper>

            {/* Duplicate Warning Dialog */}
            <Dialog open={showDuplicateDialog} onClose={() => setShowDuplicateDialog(false)}>
                <DialogTitle>⚠️ Similar Lead Found</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {duplicateWarning}
                    </DialogContentText>
                    <DialogContentText sx={{ mt: 2, fontWeight: 'bold', color: 'warning.main' }}>
                        Do you want to proceed anyway?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowDuplicateDialog(false)} color="inherit">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleProceedAnyway}
                        variant="contained"
                        color="warning"
                    >
                        Create Anyway
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CreateLead;
