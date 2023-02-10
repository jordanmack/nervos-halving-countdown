# Nervos Halving Countdown

![GitHub package.json version](https://img.shields.io/github/package-json/v/jordanmack/nervos-halving-countdown)
![GitHub last commit](https://img.shields.io/github/last-commit/jordanmack/nervos-halving-countdown)
![CircleCI](https://img.shields.io/circleci/build/github/jordanmack/nervos-halving-countdown)
![Libaries.io](https://img.shields.io/librariesio/release/github/jordanmack/nervos-halving-countdown)
![Uptime Robot status](https://img.shields.io/uptimerobot/status/m793677881-0e832575c93c534efd4ec20e)
![Uptime Robot ratio (30 days)](https://img.shields.io/uptimerobot/ratio/m793677881-0e832575c93c534efd4ec20e)
![GitHub Repo stars](https://img.shields.io/github/stars/jordanmack/nervos-halving-countdown?style=social)

This is a basic countdown page for the next mining reward halving on Nervos CKB Layer 1 blockchain.

You can view a live version of this site at [NervosHalving.com](https://nervoshalving.com/).

## Developing

These instructions describe how to launch, run, and develop using the code base for [NervosHalving.com](https://nervoshalving.com/).

If you don't need to develop and just want to view the live version, visit [NervosHalving.com](https://nervoshalving.com/).

### Technology Stack
- Node.js
- TypeScript
- React
- SASS
- Tailwind

### Development Server

```
cd nervos-halving-countdown
npm i
npm start
```

### Building and Deploying

```
cd nervos-halving-countdown
npm i
npm run build
```

Copy all files from the `build` folder to the root of your web server.
