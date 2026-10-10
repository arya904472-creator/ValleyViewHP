# Valley Transit HP

Official public transport timetable, fare register, and daily road bulletin portal for Himachal Pradesh valley transit routes.

## Overview
- **Home (`index.html`)**: Daily transit updates, road clearance notices, mountain pass status, and depot emergency helplines.
- **Local Routes (`local-routes.html`)**: Public timetable and fare register for intra-valley and feeder bus services.
- **Long Routes (`long-routes.html`)**: Public timetable and fare register for inter-district and mountain corridors.
- **Depot Admin Portal (`admin.html`)**: Password-protected console to publish routes, post daily updates, and manage schedules.

## Admin Credentials
- **Access URL**: `/admin.html`
- **Pass Key**: `valleytravels@3417`

## Features
- **Strictly White & Red Design**: High-contrast, sleek public transport authority design with no gradients or pink colors.
- **Geometric / Squared Buttons**: No circular or pill buttons.
- **Zero Ratings or Reviews**: Clean governmental timetable layout.
- **Dynamic Filtering**: Live client-side search by origin, destination, via stops, and bus service classes.
- **Persistent LocalStorage**: Routes and daily bulletins are saved in browser storage with JSON backup/restore support.
- **GitHub Pages Ready**: Static HTML, CSS, and vanilla JS that runs anywhere with zero build steps or server dependencies.

## Live Hosting with GitHub Pages
1. Push this repository to GitHub.
2. In your repository, go to **Settings** > **Pages**.
3. Under **Branch**, select `main` and root `/ (root)`, then click **Save**.
4. Your website will be live at `https://<your-username>.github.io/<repo-name>/`.
