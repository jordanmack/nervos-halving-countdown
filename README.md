# Nervos Halving Countdown

![GitHub package.json version](https://img.shields.io/github/package-json/v/jordanmack/nervos-halving-countdown)
![GitHub last commit](https://img.shields.io/github/last-commit/jordanmack/nervos-halving-countdown)
![CircleCI](https://img.shields.io/circleci/build/github/jordanmack/nervos-halving-countdown)
![Libaries.io](https://img.shields.io/librariesio/release/github/jordanmack/nervos-halving-countdown)
![Uptime Robot status](https://img.shields.io/uptimerobot/status/m793677881-0e832575c93c534efd4ec20e)
![Uptime Robot ratio (30 days)](https://img.shields.io/uptimerobot/ratio/m793677881-0e832575c93c534efd4ec20e)
![GitHub Repo stars](https://img.shields.io/github/stars/jordanmack/nervos-halving-countdown?style=social)

This is a countdown page for the mining reward halving that occurs every four years on Nervos CKB Layer 1 blockchain.

You can view a live version of this site at [NervosHalving.com](https://nervoshalving.com/).

## Developing

These instructions describe how to develop, build, and deploy the code base for [NervosHalving.com](https://nervoshalving.com/).

If you don't need to develop and just want to view the live version, visit [NervosHalving.com](https://nervoshalving.com/).

### Technology Stack

- Bun for dependency management (version in `package.json`).
- Node.js for build tools (supported versions in `package.json`).
- React, TypeScript, Vite, and Tailwind CSS.
- Exact dependency versions are recorded in `bun.lock`.

### Development Server

The following commands will run a local development server on port `3000`.

```sh
git clone --depth=1 https://github.com/jordanmack/nervos-halving-countdown.git
cd nervos-halving-countdown
ionice -c3 nice -n19 bun install --frozen-lockfile
ionice -c3 nice -n19 bun run start
```

### Building and Deploying

The compiled version of this code is completely static and can be hosted on a basic web server. No backend daemons or processes are needed.

The following commands will build the production-ready files for deployment. After building, copy all files from the `build` folder to the root of your web server.

```sh
git clone --depth=1 https://github.com/jordanmack/nervos-halving-countdown.git
cd nervos-halving-countdown
ionice -c3 nice -n19 bun install --frozen-lockfile
ionice -c3 nice -n19 bun run build
```

`bun run build` checks TypeScript and creates the static site in `build/`.

The production Nginx host and document root are defined in the infrastructure repository:

- `~/ansible/inventory/hosts`
- `~/ansible/inventory/host_vars/s10.parhelic.com/main.yml`, in the `nervoshalving.com` server block.

To deploy, confirm the SSH host identity, back up the current document root outside the public directory, upload the assets first, and replace `index.html` last. Keep previous hashed assets so open browser sessions can finish loading. Nginx can serve the new files without a restart. Check the live countdown and block refresh after deployment.

The RPC URL is set in `src/App.tsx`. Public mainnet endpoints are listed in the [Nervos CKB Networks documentation](https://docs.nervos.org/docs/getting-started/blockchain-networks). An RPC change requires a rebuild.

### Updating Dependencies

```sh
ionice -c3 nice -n19 bun update --latest
ionice -c3 nice -n19 bun run build
bun audit
```

Review major-version changes and check the countdown in desktop and mobile browsers before deploying.
