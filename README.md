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
- Node.js (LTS v18+)
- TypeScript (v4.9+)
- React (v18+ via CRA v5+)
- SASS (v1.58+)
- Tailwind (v3.2+)

### Development Server

The following commands will run a local development server on port `3000`.

```sh
git clone --depth=1 https://github.com/jordanmack/nervos-halving-countdown.git
cd nervos-halving-countdown
npm i
npm start
```

### Building and Deploying

The compiled version of this code is completely static and can be hosted on a basic web server. No backend daemons or processes are needed. 

The following commands will build the production-ready files for deployment. After building, copy all files from the `build` folder to the root of your web server.

```sh
git clone --depth=1 https://github.com/jordanmack/nervos-halving-countdown.git
cd nervos-halving-countdown
npm i
npm run build
```
