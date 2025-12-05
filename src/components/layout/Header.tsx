import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box, Menu, MenuItem } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { useAuth } from '../../hooks/useAuth';
import headerLogo from '../../assets/header-logo.png';

interface HeaderProps {
    onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    const { userProfile, logout } = useAuth();
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        handleClose();
        await logout();
    };

    return (
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar>
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="start"
                    onClick={onMenuClick}
                    sx={{ mr: 2, display: { sm: 'none' } }}
                >
                    <MenuIcon />
                </IconButton>
                {/* Logo */}
                <Box
                    component="img"
                    src={headerLogo}
                    alt="Opportunity Tracker"
                    sx={{
                        mr: 2,
                        height: 50,
                        display: 'block'
                    }}
                />
                {/* Spacer to push user info to right */}
                <Box sx={{ flexGrow: 1 }} />
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
                        {userProfile?.fullName} ({userProfile?.role})
                    </Typography>
                    <IconButton
                        size="large"
                        aria-label="account of current user"
                        aria-controls="menu-appbar"
                        aria-haspopup="true"
                        onClick={handleMenu}
                        color="inherit"
                    >
                        <AccountCircle />
                    </IconButton>
                    <Menu
                        id="menu-appbar"
                        anchorEl={anchorEl}
                        anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        keepMounted
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        open={Boolean(anchorEl)}
                        onClose={handleClose}
                    >
                        <MenuItem onClick={handleClose}>Profile</MenuItem>
                        <MenuItem onClick={handleLogout}>Logout</MenuItem>
                    </Menu>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Header;
