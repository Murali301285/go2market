# Hosting DisTrack on Windows Server (IIS)

This guide outlines the steps to host the DisTrack React application on a Windows Server using IIS (Internet Information Services).

## Prerequisites

1.  **Windows Server** (2016, 2019, 2022, or Windows 10/11 Pro).
2.  **IIS Enabled**:
    *   Open **Server Manager** > **Add roles and features**.
    *   Select **Web Server (IIS)**.
    *   Ensure **Application Development** features are installed (though for static sites, basic features are enough).
3.  **IIS URL Rewrite Module**:
    *   **Crucial for React Apps**: You MUST install this module to handle client-side routing (e.g., `/user/dashboard`).
    *   Download and install from: [IIS URL Rewrite Module](https://www.iis.net/downloads/microsoft/url-rewrite)

## Step 1: Prepare the Build Files

1.  The application has already been built. The production files are located in the `dist` folder of your project directory:
    *   `d:\Dev\DisTrackAG\dist`
2.  This folder contains:
    *   `index.html`
    *   `web.config` (Configuration for IIS)
    *   `assets/` (JavaScript, CSS, Images)

## Step 2: Deploy to IIS

1.  **Create a Folder**:
    *   On your Windows Server, create a folder to host the site, e.g., `C:\inetpub\wwwroot\distrack`.
2.  **Copy Files**:
    *   Copy **all contents** of the `dist` folder to `C:\inetpub\wwwroot\distrack`.
    *   Ensure `web.config` is present in the root of this folder.

3.  **Open IIS Manager**:
    *   Press `Win + R`, type `inetmgr`, and press Enter.

4.  **Add Website**:
    *   Right-click on **Sites** in the left pane > **Add Website**.
    *   **Site name**: `DisTrack`
    *   **Physical path**: `C:\inetpub\wwwroot\distrack`
    *   **Binding**:
        *   Type: `http` (or `https` if you have a certificate)
        *   IP Address: `All Unassigned` or your specific IP.
        *   Port: `80` (or `8080` if 80 is taken).
    *   Click **OK**.

## Step 3: Verify Configuration

1.  **URL Rewrite**:
    *   Click on your new `DisTrack` site in the left pane.
    *   Look for the **URL Rewrite** icon in the center pane. If it's missing, you didn't install the module (see Prerequisites).
    *   If installed, double-click it. You should see a rule named `React Routes`. This rule redirects all non-file requests to `index.html`, allowing the React app to handle routing.

2.  **MIME Types** (Optional but recommended):
    *   IIS usually handles standard types, but if `.json` or `.woff2` files fail to load, check the **MIME Types** feature and add them if missing. (The provided `web.config` already handles `.json`).

## Step 4: Browse the Site

1.  Open your browser and navigate to `http://localhost` (or your server's IP/domain).
2.  You should see the Login page.
3.  Try logging in and refreshing the page. If the page reloads correctly without a 404 error, the URL Rewrite module is working correctly.

## Troubleshooting

*   **404 on Refresh**: This means the URL Rewrite module is not installed or the `web.config` file is missing/incorrect.
*   **500 Internal Server Error**: Check if the `web.config` is valid XML.
*   **Permissions**: Ensure the `IIS_IUSRS` group has **Read & Execute** permissions on the `C:\inetpub\wwwroot\distrack` folder.
