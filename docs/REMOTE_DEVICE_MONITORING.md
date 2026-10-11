# Remote device monitoring with the local XAMPP database

The router address `192.168.18.1` is private to its local network. Keep the
computer running XAMPP connected to that router; its PHP API performs the ping.
Connect the computer and the remote viewing phone/laptop to the same private
VPN so the remote browser can reach BatangAI without exposing the router or
database to the public internet.

## Start BatangAI on the computer connected to the router

1. Start Apache and MySQL in XAMPP and confirm the `ainirts_db` database is
   available.
2. In one PowerShell window, run `npm run api:dev` from the project folder.
3. Find this computer's VPN IPv4 address. In another PowerShell window, set
   `VITE_DEV_HOST` to that address and start Vite:

   ```powershell
   $env:VITE_DEV_HOST = '100.x.y.z'
   npm run dev
   ```

   Replace `100.x.y.z` with the actual VPN address. Vite listens only on that
   interface. The browser API and photo requests go through Vite to the local
   PHP server, so device pings still originate from the computer connected to
   the router.

## Open BatangAI from another network

1. Connect the remote phone/laptop to the same VPN as the XAMPP computer.
2. Open `http://100.x.y.z:5173` using the XAMPP computer's VPN IPv4 address.
3. Keep the XAMPP computer connected to the router and keep Apache, MySQL,
   `npm run api:dev`, and `npm run dev` running. Use **Ping** in Device
   Monitoring to check the router.

The viewing phone may use mobile data or another Wi-Fi once its VPN is
connected. If the XAMPP computer itself leaves the router's local network, it
can no longer ping `192.168.18.1`; an always-on computer must remain in that
network to perform the checks.
