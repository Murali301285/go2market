import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface PageLoadingProps {
    message?: string;
}

const PageLoading: React.FC<PageLoadingProps> = ({ message = 'Loading...' }) => {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                width: '100vw',
                position: 'fixed',
                top: 0,
                left: 0,
                bgcolor: 'background.default',
                zIndex: 9999,
            }}
        >
            <CircularProgress size={60} thickness={4} />
            <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
                {message}
            </Typography>
        </Box>
    );
};

export default PageLoading;
