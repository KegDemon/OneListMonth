# OneListMonth

## Installation
From root of the project run:

```
npm i
```

Copy the file `.env.sample` to `.env` and update the following keys:
```bash
CLIENT_ID=<your_client_id>
CLIENT_SECRET=<your_client_secret>

REDIRECT_URL=<your_domain>
```

Optional: For local development, it is recommended to modify your host file to use a "dev" URL.
Example:
```
127.0.0.1 onelistmonth.dev
```

Run Dev (uses `nodemon`):
```
npm run-script dev

# or

yarn dev
```

Run Prod:
```
npm run-script run

# or

yarn run
```

## Additional Requirements
You will need to setup your own [Spotify Developer](https://beta.developer.spotify.com/) account.
