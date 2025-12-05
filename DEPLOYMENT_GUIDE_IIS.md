# Deployment Guide for Windows Server (IIS)

This guide explains how to host the **DisTrackAG** application on a Windows Server using IIS (Internet Information Services).

## 1. Prerequisites

*   **Windows Server** with **IIS** enabled.
*   **URL Rewrite Module** installed on IIS. (Required for Single Page Applications like React/Vite to handle routing correctly).
    *   Download: [IIS URL Rewrite Module](https://www.iis.net/downloads/microsoft/url-rewrite)

## 2. Locate Build Files

The build process has generated a `dist` folder in your project directory:
`d:\Dev\DisTrackAG\dist`

This folder contains:
*   `index.html`
*   `assets/` (JavaScript, CSS, Images)
*   `vite.svg`

## 3. Deployment Steps

### Step A: Copy Files to Server
1.  Create a folder on your Windows Server to host the site (e.g., `C:\inetpub\wwwroot\distrack-app`).
2.  Copy **all contents** of the `dist` folder into this new folder.

### Step B: Configure IIS
1.  Open **IIS Manager**.
2.  Right-click on **Sites** in the Connections pane and select **Add Website**.
3.  **Site name**: Enter a name (e.g., `DisTrackApp`).
4.  **Physical path**: Browse to the folder you created in Step A (`C:\inetpub\wwwroot\distrack-app`).
5.  **Binding**: Configure the Port (e.g., `80` or `443` for HTTPS) and Host name as needed.
6.  Click **OK**.

### Step C: Configure URL Rewrite (Critical for React Router)
Since this is a Single Page Application (SPA), all requests must be routed to `index.html` so React can handle the routing.

1.  **Create a `web.config` file** in the root of your deployment folder (`C:\inetpub\wwwroot\distrack-app`).
2.  Paste the following content into `web.config`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="React Routes" stopProcessing="true">
                    <match url=".*" />
                    <conditions logicalGrouping="MatchAll">
                        <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
                        <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
                    </conditions>
                    <action type="Rewrite" url="/" />
                </rule>
            </rules>
        </rewrite>
        <staticContent>
            <mimeMap fileExtension=".json" mimeType="application/json" />
            <mimeMap fileExtension=".webp" mimeType="image/webp" />
        </staticContent>
    </system.webServer>
</configuration>
```

*Note: If you don't have the URL Rewrite Module installed, this `web.config` will cause a 500 error. Please ensure it is installed.*

## 4. Verify Deployment

1.  Open a browser and navigate to your server's URL (e.g., `http://localhost` or your server's IP).
2.  The application should load.
3.  **Test Routing**: Try refreshing the page while on a sub-route (e.g., `/login` or `/admin/school-details`). If it loads correctly, the URL Rewrite is working.

## 5. Troubleshooting

*   **404 on Refresh**: This means the URL Rewrite rule is missing or not working. Ensure `web.config` is present and the module is installed.
*   **500 Error**: Check if the URL Rewrite Module is installed. Check IIS logs for permission issues.
*   **MIME Type Errors**: If CSS/JS files fail to load, ensure Static Content is enabled in IIS features.
