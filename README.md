# Feature Flag Apple Store

This template uses Flipt Cloud as a feature flag management service to control whether the store is open or closed.

## Demo

## How to Use

### Set up Flipt Cloud

1. Create a new Flipt Cloud account at https://flipt.cloud/
2. Create a new environment called `apple-store-demo`
3. Create a new flag called `store-closed`
4. Set the flag to `true`

You can then choose from one of the following two methods to use this repository:

### Local Development

#### Set up environment variables

Copy the `.env.example` file in this directory to `.env.local` (which will be ignored by Git):

```bash
cp .env.example .env.local
```

1. Set the `FLIPT_CLOUD_API_KEY` environment variable to the API key for your Flipt Cloud environment.
2. Set the `FLIPT_CLOUD_URL` environment variable to the URL for your Flipt Cloud environment.

Next, install the dependencies and run Next.js in development mode:

```bash
npm install
npm run dev
```

Deploy it to the cloud with [Vercel](https://vercel.com/new?utm_source=github&utm_medium=readme&utm_campaign=edge-middleware-eap) ([Documentation](https://nextjs.org/docs/deployment)).

## Opening / Closing the Store using the Flipt UI


