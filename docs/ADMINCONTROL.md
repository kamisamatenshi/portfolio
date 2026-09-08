# Admin image control

`/admincontrol` is a small server-side image manager for the portfolio. It is
not part of Astro's static output: a dedicated Node service listens only on
`127.0.0.1`, and the portfolio Nginx server proxies the private route to it.

## Security model

- The password is a salted `scrypt` hash held only in `/etc/portfolio-admin.env`.
- The session signing secret is also held only in that root-owned environment file.
- The control uses `HttpOnly`, `Secure`, `SameSite=Strict` cookies, CSRF tokens,
  a bounded login-attempt window, and security response headers.
- Uploads accept only PNG, JPEG, and WebP after file-signature validation. SVG
  and arbitrary files are deliberately rejected.
- Uploaded files are stored in `/var/www/portfolio/state/uploads`, outside the
  deploy-replaced static release, and are served publicly at `/portfolio-assets/`.

## VPS activation

After the repository has deployed, an administrator creates the root-owned
environment file with a freshly generated salted password hash and a random
session secret. Do not put either value in Git, a `.env` file in the repository,
or client-side code.

Then run `sudo bash infrastructure/enable-admincontrol.sh` from the deployed
repository. It validates Nginx before reloading it, installs the dedicated
systemd service, creates the persistent upload directory, and enables the
service. The service runs as the existing `portfolio` account and needs write
access only to the persistent uploads directory.
