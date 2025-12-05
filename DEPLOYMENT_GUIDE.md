# Deployment Guide for Windows Server (IIS)

This guide explains how to host the **DisTrackAG** application on a Windows Server using Internet Information Services (IIS).

## Prerequisites

1.  **Windows Server** with **IIS** enabled.
2.  **URL Rewrite Module** installed on IIS.
    *   Download: [IIS URL Rewrite Module](https://www.iis.net/downloads/microsoft/url-rewrite)
    *   *Crucial for React routing to work (handling page refreshes).*

## Steps to Deploy

### 1. Locate Build Files
The build process has created a `dist` folder in your project directory:
`d:\Dev\DisTrackAG\dist`

This folder contains:
*   `index.html`
*   `assets/` (folder)
*   `web.config` (Configuration for IIS)

### 2. Copy Files to Server
Copy the **entire contents** of the `dist` folder to your server's web root or a specific folder for this site.
*   Default IIS path: `C:\inetpub\wwwroot\distrack`

### 3. Configure IIS

1.  Open **IIS Manager**.
2.  Right-click on **Sites** -> **Add Website**.
3.  **Site name**: `DisTrackAG` (or your preference).
4.  **Physical path**: Browse to the folder where you copied the files (e.g., `C:\inetpub\wwwroot\distrack`).
5.  **Port**: `80` (or `443` if using SSL/HTTPS).
6.  Click **OK**.

### 4. Verify `web.config`
The build includes a `web.config` file automatically. This file tells IIS to redirect all requests to `index.html` so that React Router can handle the navigation.

**If you don't see `web.config` in your folder, create one with this content:**

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

### 5. Troubleshooting

*   **404 on Refresh:** If you get a 404 error when refreshing a page (like `/login`), it means the **URL Rewrite Module** is missing or the `web.config` is not being read. Install the module and restart IIS.
*   **MIME Type Errors:** If fonts or images don't load, ensure `.woff`, `.woff2`, `.webp`, etc., are added to **MIME Types** in IIS (or via `web.config`).

## Alternative: Serve with `serve` (Simple)

If you don't want to use IIS, you can use a simple Node.js static server:

1.  Install `serve` globally:
    ```powershell
    npm install -g serve
    ```
2.  Run the server pointing to your `dist` folder:
    ```powershell
    serve -s d:\Dev\DisTrackAG\dist -l 3000
    ```
3.  Access at `http://localhost:3000`.
