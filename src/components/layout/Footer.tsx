import { Box, Typography } from '@mui/material';

const Footer = () => {
    return (
        <Box
            component="footer"
            sx={{
                py: 2,
                px: 3,
                mt: 'auto',
                backgroundColor: (theme) => theme.palette.grey[100],
                borderTop: (theme) => `1px solid ${theme.palette.divider}`,
                textAlign: 'center',
            }}
        >
            <Typography variant="body2" color="text.secondary">
                © Silotech 2025. All rights reserved.
            </Typography>
        </Box>
    );
};

export default Footer;
