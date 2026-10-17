# Local network device monitoring

The PHP API can check device addresses from the computer running it. For
private office or school devices, run BatangAI on a computer connected to the
same network. InfinityFree's public web server is outside that private network
and cannot reach its local device addresses.

## Run locally with XAMPP

1. Connect the computer to the device network and make sure Windows Firewall
   allows the required ping requests and replies.
2. Start Apache and MySQL in XAMPP. Confirm the project database is available.
3. In one VS Code terminal, run `npm run api:dev` from the project folder.
4. In a second terminal, run `npm run dev` and open the Vite URL shown.
5. Keep the computer and both servers running while device monitoring is in
   use. Use a private VPN if another trusted device needs to access the local
   app remotely; do not expose the database or development servers publicly.
